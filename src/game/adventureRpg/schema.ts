import { z } from "zod"
import { CARD_MAP } from "../catalog"
import { MONSTER_MAP } from "../autochess/catalog"
import { RPG_MAPS, RPG_STAGE_IDS, rpgStage } from "./content"
import { heroStats, dungeonTierCap } from "./engine"

const count = z.number().int().min(0).max(1_000_000_000)
const bounded = z.number().int().min(0).max(100_000)
const uid = z.string().min(1).max(100)
const cardId = z.string().refine((id) => CARD_MAP[id]?.kind === "unit")
const school = z.enum(["hearth", "ember", "tide", "grove", "sugar"])
const role = z.enum(["guardian", "striker", "mage", "healer", "trickster"])
const skills = z.tuple(
  Array.from({ length: 4 }, () =>
    z.number().int().min(1).max(10),
  ) as [z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber],
)
const resources = z.object({
  coins: count,
  experience: count,
  books: count,
  ore: count,
  essence: count,
  broth: count,
  leaves: count,
  seals: count,
})
const hero = z.object({
  uid,
  cardId,
  level: z.number().int().min(1).max(50),
  xp: bounded,
  rank: z.number().int().min(1).max(5),
  skills,
  gear: z.tuple([
    z.number().int().min(0).max(10),
    z.number().int().min(0).max(10),
    z.number().int().min(0).max(10),
  ]),
})
const enemy = z.object({
  uid,
  id: z
    .string()
    .max(80)
    .refine((id) => !!MONSTER_MAP[id]),
  name: z.string().max(120),
  school,
  boss: z.boolean(),
  level: z.number().int().min(1).max(50),
})
const actor = z.object({
  uid,
  id: z.string().max(80),
  name: z.string().max(120),
  side: z.enum(["ally", "enemy"]),
  slot: z.number().int().min(0).max(5),
  school,
  role,
  level: z.number().int().min(1).max(50),
  rank: z.number().int().min(1).max(5),
  skills,
  hp: bounded,
  maxHp: bounded.min(1),
  attack: bounded.min(1),
  armor: bounded,
  energy: bounded.max(100),
  shield: bounded,
  burn: bounded.max(20),
  weaken: bounded.max(20),
  stun: bounded.max(6),
  nextAttack: bounded,
  nextSkill: bounded,
  nextSupport: bounded,
  boss: z.boolean(),
  phase: z.number().int().min(0).max(1),
  motion: z.enum(["idle", "attack", "cast", "hit", "fall", "victory"]),
  motionAt: bounded,
})
const battle = z.object({
  id: uid,
  tick: bounded.max(720),
  wave: bounded.max(2),
  waves: z.array(z.array(enemy).min(1).max(5)).min(1).max(3),
  actors: z.array(actor).min(2).max(10),
  events: z
    .array(
      z.object({
        serial: count,
        tick: bounded,
        kind: z.enum([
          "hit",
          "skill",
          "burst",
          "heal",
          "shield",
          "boss",
          "wave",
          "guard",
        ]),
        source: uid,
        targets: z.array(uid).max(5),
        value: bounded,
        text: z.string().max(180),
        school,
      }),
    )
    .max(24),
  serial: count,
  result: z.enum(["win", "loss"]).nullable(),
  settled: z.boolean(),
  stars: bounded.max(3),
  paused: z.boolean(),
  auto: z.boolean(),
  speed: z.union([z.literal(1), z.literal(2)]),
  guardUntil: bounded,
  guardReady: bounded,
  guardRow: z.enum(["front", "back"]),
  warning: z
    .object({ until: bounded, source: uid, row: z.enum(["front", "back"]) })
    .nullable(),
  reward: resources.partial().nullable(),
})
const dungeon = z.object({
  kind: z.enum(["experience", "skills", "forge"]),
  tier: z.number().int().min(1).max(3),
  floor: z.number().int().min(1).max(5),
  status: z.enum(["battle", "camp", "ready", "complete", "lost"]),
  health: z.record(uid, z.object({ hp: bounded, energy: bounded.max(100) })),
  bonus: z.number().min(0).max(0.3),
})
const stageId = z.string().refine((id) => RPG_STAGE_IDS.includes(id))
export const rpgSaveSchema = z
  .object({
    version: z.literal(1),
    roster: z.array(hero).min(1).max(250),
    formation: z.array(uid).min(1).max(5),
    resources,
    stars: z.record(stageId, z.number().int().min(1).max(3)),
    choices: z.record(
      z.string().refine((id) => RPG_MAPS.some((m) => m.id === id)),
      z.union([z.literal(0), z.literal(1)]),
    ),
    dungeonClears: z.record(
      z.string().regex(/^(experience|skills|forge):[1-3]$/),
      count,
    ),
    run: z
      .object({
        kind: z.enum(["campaign", "dungeon"]),
        stageId: stageId.nullable(),
        battle,
        dungeon: dungeon.nullable(),
      })
      .nullable(),
    serial: count,
    legacy: z.object({
      imported: z.boolean(),
      badges: z.array(z.string().max(40)).max(5),
      discoveries: count.max(171),
      completed: z.boolean(),
    }),
  })
  .superRefine((save, ctx) => {
    const invalid = (message: string) =>
      ctx.addIssue({ code: "custom", message })
    const byUid = new Map(save.roster.map((h) => [h.uid, h]))
    if (
      byUid.size !== save.roster.length ||
      new Set(save.formation).size !== save.formation.length ||
      save.formation.some((id) => !byUid.has(id)) ||
      new Set(save.formation.map((id) => byUid.get(id)?.cardId)).size !==
        save.formation.length
    )
      invalid("Đội hình Adventure không hợp lệ")
    if (save.roster.some((h) => h.skills.some((level) => level > h.level)))
      invalid("Cấp kỹ năng vượt cấp nhân vật")
    for (const id of Object.keys(save.stars)) {
      const s = rpgStage(id)!
      if (s.index > 0 && !save.stars[`${s.map.id}-${s.index}`])
        invalid("Tiến trình màn không liên tục")
      if (s.mapIndex > 0 && !save.stars[`${RPG_MAPS[s.mapIndex - 1].id}-6`])
        invalid("Map chưa mở")
    }
    if (Object.keys(save.choices).some((id) => !save.stars[`${id}-6`]))
      invalid("Lựa chọn chưa mở")
    const run = save.run
    if (!run) return
    const b = run.battle,
      allies = b.actors.filter((a) => a.side === "ally")
    if (
      new Set(b.actors.map((a) => a.uid)).size !== b.actors.length ||
      allies.length !== save.formation.length ||
      allies.some(
        (a) =>
          !save.formation.includes(a.uid) ||
          a.id !== byUid.get(a.uid)?.cardId ||
          a.hp > a.maxHp,
      )
    )
      invalid("Nhân vật trong trận không khớp đội")
    if (
      b.wave >= b.waves.length ||
      b.actors.some((a) => a.hp > a.maxHp || a.motionAt > b.tick) ||
      b.events.some((e) => e.tick > b.tick || e.serial > b.serial)
    )
      invalid("Nhịp trận không hợp lệ")
    if (
      b.actors.some((a) =>
        a.side === "ally"
          ? CARD_MAP[a.id]?.kind !== "unit"
          : !MONSTER_MAP[a.id],
      )
    )
      invalid("Model nhân vật không hợp lệ")
    if (
      b.warning &&
      (!b.actors.some(
        (a) => a.uid === b.warning!.source && a.boss && a.hp > 0,
      ) ||
        b.warning.until < b.tick)
    )
      invalid("Cảnh báo boss không hợp lệ")
    if (
      (b.settled && !b.result) ||
      (b.reward && (!b.settled || b.result !== "win"))
    )
      invalid("Trạng thái nhận thưởng không hợp lệ")
    if (
      b.result === "win" &&
      (b.wave !== b.waves.length - 1 ||
        b.actors.some((a) => a.side === "enemy" && a.hp > 0) ||
        !allies.some((a) => a.hp > 0))
    )
      invalid("Chiến thắng chưa hoàn tất")
    if (
      (run.kind === "campaign" && (!run.stageId || run.dungeon)) ||
      (run.kind === "dungeon" && (run.stageId || !run.dungeon))
    )
      invalid("Loại chuyến đi không hợp lệ")
    if (run.dungeon) {
      const d = run.dungeon
      if (
        d.tier > dungeonTierCap(save) ||
        Object.entries(d.health).some(
          ([id, h]) =>
            !save.formation.includes(id) || h.hp > heroStats(byUid.get(id)!).hp,
        )
      )
        invalid("Tiến trình dungeon không hợp lệ")
      if (
        ["camp", "ready", "complete"].includes(d.status) &&
        (!b.settled ||
          b.result !== "win" ||
          Object.keys(d.health).length !== allies.length)
      )
        invalid("Điểm nghỉ chưa mở")
      if (d.status === "complete" && d.floor !== 5)
        invalid("Dungeon chưa hoàn thành")
    }
  })
