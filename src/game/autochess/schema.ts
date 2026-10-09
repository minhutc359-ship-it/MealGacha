import { z } from "zod"
import { UNIT_MAP, AUTO_UNITS, LEGACY_UNIT_IDS, MONSTER_MAP, RELICS, AUGMENTS } from "./catalog"
import { SCENES } from "./story"
import { capacity, copies, poolSize } from "./economy"
const int = z.number().int().nonnegative().max(1_000_000_000)
const real = z.number().finite().nonnegative().max(1_000_000_000)
const uint32 = z.number().int().min(0).max(4294967295)
const id = z.string().max(160)
const unitId = id.refine((v) => !!UNIT_MAP[v])
const relicId = id.refine((v) => RELICS.some((r) => r.id === v))
const augmentId = id.refine((v) => AUGMENTS.some((r) => r.id === v))
const sceneId = id.refine((v) => !!SCENES[v])
const mode = z.enum(["campaign", "survival", "daily"])
const star = z.union([z.literal(1), z.literal(2), z.literal(3)])
const cell = int.max(35)
const skill = z.enum([
  "flame",
  "steam",
  "shield",
  "heal",
  "cleave",
  "dash",
  "leaves",
  "mana",
  "cone",
  "shell",
  "ginger",
  "dodge",
  "charge",
  "lantern",
  "rhythm",
  "feast",
  "copy",
  "drain",
  "stun",
  "summon",
  "seal",
  "frost",
])
const piece = z.object({
  uid: id,
  id: unitId,
  star,
  cell: cell.min(18).nullable(),
  benchSlot: int.max(5).optional(),
  items: z
    .array(relicId)
    .max(2)
    .refine((a) => new Set(a).size === a.length),
})
const actor = z.object({
  uid: id,
  id: id.refine((v) => !!UNIT_MAP[v] || !!MONSTER_MAP[v]),
  side: z.enum(["ally", "enemy"]),
  cell,
  star,
  hp: int,
  maxHp: int.positive(),
  attack: real,
  baseAttack: real,
  armor: real,
  range: int.min(1).max(6),
  interval: int.min(1).max(100),
  mana: int.max(100),
  shield: int,
  stunnedUntil: int,
  burnUntil: int,
  burnPower: real,
  next: int,
  action: z
    .object({
      kind: z.enum(["move", "attack", "cast"]),
      start: int,
      hit: int,
      end: int,
      target: id.nullable(),
      from: cell,
      to: cell,
      skill: skill.optional(),
    })
    .nullable(),
  skill,
  power: real,
  items: z.array(relicId).max(2),
  lanternUsed: z.boolean(),
  casts: int,
  phase: int.max(2),
  diedAt: int.nullable(),
  dodgeUntil: int,
  sealedUntil: int,
})
const combat = z.object({
  id,
  tick: int.max(1100),
  actors: z.array(actor).min(1).max(60),
  events: z
    .array(
      z.object({
        id: int,
        tick: int,
        kind: z.enum([
          "move",
          "attack",
          "cast",
          "hit",
          "heal",
          "shield",
          "death",
          "phase",
          "summon",
          "burn",
          "mana",
          "stun",
        ]),
        source: id,
        target: id,
        cell,
        amount: z.number().int().min(-1000).max(1_000_000_000),
        school: z.enum(["ember", "tide", "grove", "hearth", "sugar"]),
      }),
    )
    .max(180),
  nextEvent: int,
  result: z.enum(["win", "loss"]).nullable(),
  settled: z.boolean(),
  boss: id.refine((v) => !!MONSTER_MAP[v]?.boss).nullable(),
  pendingScene: sceneId.nullable(),
  lastAllySkill: skill.nullable(),
  lastAllyPower: real,
  pressure: int,
})
const result = z.object({
  id,
  wave: int.min(1),
  result: z.enum(["win", "loss"]),
  seconds: real.max(55),
  survivors: int.max(7),
  points: int,
  damage: int.max(25),
  gold: int,
  reason: z.string().max(600),
})
const currentRunSchema = z
  .object({
    id,
    mode,
    rulesVersion: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    seed: uint32,
    rng: uint32,
    day: z.string().max(16),
    phase: z.enum([
      "prepare",
      "combat",
      "result",
      "reward",
      "won",
      "lost",
      "abandoned",
    ]),
    wave: int.min(1).max(1_000_000),
    rounds: int,
    bestWave: int,
    health: int.max(100),
    gold: int,
    xp: int.max(1000),
    score: int,
    activeTicks: int,
    roster: z.array(piece).max(13),
    shop: z.array(unitId.nullable()).length(5),
    pool: z.record(unitId, int.max(18)),
    locked: z.boolean(),
    inventory: z.array(relicId).max(150),
    augments: z
      .array(augmentId)
      .max(6)
      .refine((a) => new Set(a).size === a.length),
    reward: z
      .object({
        kind: z.enum(["relic", "augment"]),
        choices: z
          .array(
            id.refine(
              (v) =>
                RELICS.some((r) => r.id === v) ||
                AUGMENTS.some((r) => r.id === v),
            ),
          )
          .min(1)
          .max(3),
      })
      .nullable(),
    pendingRewards: z.array(z.enum(["relic", "augment"])).max(2),
    combat: combat.nullable(),
    lastResult: result.nullable(),
    paidWaves: z
      .array(int.min(1))
      .max(10000)
      .refine((a) => new Set(a).size === a.length),
    seenScenes: z
      .array(sceneId)
      .max(20)
      .refine((a) => new Set(a).size === a.length),
    scene: sceneId.nullable(),
    sceneLine: int.max(20),
    paused: z.boolean(),
    freeReroll: z.boolean(),
    relicReroll: z.boolean(),
    nextUid: int,
    log: z.array(z.string().max(600)).max(20),
    finished: z.boolean(),
  })
  .superRefine((run, ctx) => {
    const invalid = (message: string) =>
      ctx.addIssue({ code: "custom", message })
    const board = run.roster.filter((p) => p.cell !== null)
    const placedBench = run.roster.filter(p => p.cell === null && p.benchSlot !== undefined)
    if (
      new Set(run.roster.map((p) => p.uid)).size !== run.roster.length ||
      new Set(board.map((p) => p.cell)).size !== board.length ||
      new Set(placedBench.map(p => p.benchSlot)).size !== placedBench.length ||
      board.some(p => p.benchSlot !== undefined) ||
      board.length > capacity(run.xp) ||
      run.roster.length - board.length > 6
    )
      invalid("Đội hình không nhất quán")
    if (
      Object.keys(run.pool).length !== AUTO_UNITS.length ||
      AUTO_UNITS.some(
        (u) =>
          (run.pool[u.id] ?? -1) +
            run.roster
              .filter((p) => p.id === u.id)
              .reduce((n, p) => n + copies(p.star), 0) +
            run.shop.filter((s) => s === u.id).length !==
          poolSize(u.cost),
      )
    )
      invalid("Pool quân không nhất quán")
    if (run.mode === "campaign" && run.wave > 12)
      invalid("Màn chiến dịch không hợp lệ")
    if (run.bestWave > run.wave || run.paidWaves.some((w) => w > run.wave))
      invalid("Tiến trình đợt không hợp lệ")
    if (run.phase === "combat" && !run.combat) invalid("Thiếu trận đang chơi")
    if (run.phase === "result" && (!run.combat?.settled || !run.lastResult))
      invalid("Vòng chưa chốt")
    if (run.phase === "reward" && !run.reward)
      invalid("Thiếu lựa chọn phần thưởng")
    const scene = run.combat?.pendingScene ?? run.scene
    if (scene && run.sceneLine >= SCENES[scene].lines.length)
      invalid("Lời thoại không hợp lệ")
    const b = run.combat
    if (b) {
      if (
        new Set(b.actors.map((a) => a.uid)).size !== b.actors.length ||
        b.actors.some(
          (a) =>
            a.hp > a.maxHp ||
            a.shield > a.maxHp ||
            (a.side === "ally" ? !UNIT_MAP[a.id] : !MONSTER_MAP[a.id]),
        )
      )
        invalid("Trạng thái quân chiến đấu không hợp lệ")
      const live = b.actors.filter((a) => a.hp > 0)
      if (
        new Set(live.map((a) => a.cell)).size !== live.length ||
        live.filter((a) => a.side === "enemy").length > 12
      )
        invalid("Vị trí quân trùng nhau")
      if (
        b.result === "win" &&
        (live.some((a) => a.side === "enemy") ||
          !live.some((a) => a.side === "ally"))
      )
        invalid("Chiến thắng không hợp lệ")
      if (b.settled && !b.result) invalid("Thiếu kết quả đã chốt")
      if (
        b.actors.some(
          (a) =>
            a.action &&
            (a.action.start > a.action.hit || a.action.hit > a.action.end),
        )
      )
        invalid("Lịch đòn đánh không hợp lệ")
    }
  })
// Expand old pool snapshots without repairing corrupt counts or changing RNG.
export const autoRunSchema = z.preprocess(raw => {
  if (!raw || typeof raw !== "object") return raw
  const value = raw as Record<string, unknown>
  if (![1, 2].includes(value.rulesVersion as number) || !value.pool ||
    typeof value.pool !== "object" || Array.isArray(value.pool)) return raw
  const pool = { ...value.pool as Record<string, unknown> }
  for (const unit of AUTO_UNITS) if (!LEGACY_UNIT_IDS.has(unit.id) && !(unit.id in pool))
    pool[unit.id] = poolSize(unit.cost)
  return { ...value, pool }
}, currentRunSchema)
export const autoSaveSchema = z
  .object({
    version: z.literal(1),
    run: autoRunSchema.nullable(),
    campaignCleared: int.max(12),
    ending: z.enum(["annotations", "hall"]).nullable(),
    records: z
      .array(
        z.object({
          id,
          mode,
          seed: uint32,
          rulesVersion: int,
          day: z.string().max(16),
          score: int,
          wave: int,
          seconds: int,
          result: z.enum(["won", "lost", "abandoned"]),
          team: z.array(z.string().max(160)).max(7),
        }),
      )
      .max(60),
    seals: int,
    cosmetics: z
      .array(z.enum(["market", "river", "archive", "dawn"]))
      .max(4)
      .refine((a) => new Set(a).size === a.length),
    board: z.enum(["market", "river", "archive", "dawn"]),
    tutorialSeen: z.boolean(),
  })
  .superRefine((save, ctx) => {
    if (!save.cosmetics.includes(save.board))
      ctx.addIssue({ code: "custom", message: "Bàn chưa sở hữu" })
    if (save.ending && save.campaignCleared !== 12)
      ctx.addIssue({ code: "custom", message: "Chưa hoàn thành câu chuyện" })
  })
