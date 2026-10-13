import { boardLimit, deckSizeForRules, DECK_SIZE } from "./tcgRules"
import { trapStateIssue } from "./traps"
import { validLivingDecision } from "./livingChoices"
import { z } from "zod"
import { RELIC_MAP, EXPEDITION_EVENTS } from "./expedition"
import { CARD_MAP } from "./catalog"
import { newGame, rotateDay } from "./progression"
import type { GameSave } from "./types"
import { autoSaveSchema } from "./autochess/schema"
import {
  ADVENTURE_AREA_MAP,
  migrateAdventure,
  type AdventureSave,
} from "./adventure"
import { ADVENTURE_MAP_BY_ID, canWalk } from "./adventureWorld"
import { skillsFor, spiritMaxHp } from "./adventureSkills"
import {
  loadProtected,
  writeProtectedBatch,
} from "../infrastructure/storage/protectedStorage"

export const GAME_KEY = "foodchest.tcg.v1"
const npcId = z.enum(["bach", "nhien", "moc", "hai", "lien"])
const recipeId = z.enum(["home", "street", "tet", "coast", "garden", "moon"])
const sceneId = z
  .string()
  .max(60)
  .regex(
    /^(assist:(bach|nhien|moc|hai|lien)|awaken:(lantern|harbor|garden|tide|moon|last-table|living-market|rain-harbor|tomorrow-table)-3)$/,
  )
const weekId = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const bossId = z.enum([
  "living-market-3",
  "rain-harbor-3",
  "tomorrow-table-3",
  "lantern-3",
  "harbor-3",
  "garden-3",
  "tide-3",
  "moon-3",
  "last-table-3",
])
const integer = z.number().int().nonnegative().max(1_000_000_000)
const cardId = z.string().refine((id) => !!CARD_MAP[id], "Thẻ không hợp lệ")
const adventureCardId = cardId.refine(
  (id) => CARD_MAP[id]?.kind === "unit",
  "Vị Linh không hợp lệ",
)
const adventureAreaId = z.enum([
  "lantern-quarter",
  "rain-harbor",
  "herb-garden",
  "tide-pier",
  "moon-table",
])
const adventureMember = z.object({
  uid: z.string().min(1).max(80),
  cardId: adventureCardId,
  level: z.number().int().min(1).max(30),
  xp: z.number().int().min(0).max(10000),
  hp: z.number().int().min(0).max(10000),
})
const adventureEncounter = z.object({
  id: z.string().min(1).max(120),
  kind: z.enum(["wild", "keeper"]),
  cardId: adventureCardId,
  level: z.number().int().min(1).max(30),
  hp: z.number().int().min(0).max(10000),
  maxHp: z.number().int().min(1).max(10000),
  activeUid: z.string().min(1).max(80),
  turn: z.number().int().min(1).max(10000),
  playerGuard: z.number().int().min(0).max(100),
  enemyGuard: z.number().int().min(0).max(100),
  enemyWeaken: z.number().int().min(0).max(100),
  attempts: z.number().int().min(0).max(100),
  log: z.array(z.string().max(180)).max(8),
})
const legacyAdventure = z
  .object({
    version: z.literal(1),
    started: z.boolean(),
    areaId: adventureAreaId,
    x: z.number().int().min(0).max(11),
    y: z.number().int().min(0).max(8),
    facing: z.enum(["up", "down", "left", "right"]),
    steps: integer,
    aromaSeals: z.number().int().min(0).max(999),
    team: z.array(adventureMember).max(4),
    reserve: z.array(adventureMember).max(20),
    discovered: z.array(adventureCardId).max(171),
    badges: z
      .array(z.enum(["lantern", "harbor", "garden", "tide", "moon"]))
      .max(5),
    completedQuests: z.array(z.string().max(80)).max(32),
    claimedFinds: z.array(z.string().max(80)).max(16),
    encounter: adventureEncounter.nullable(),
    message: z.string().max(400).nullable(),
    completed: z.boolean(),
  })
  .superRefine((save, ctx) => {
    const area = ADVENTURE_AREA_MAP[save.areaId]
    const members = [...save.team, ...save.reserve]
    if (new Set(members.map((member) => member.uid)).size !== members.length)
      ctx.addIssue({ code: "custom", message: "Vị Linh trùng mã" })
    if (save.started !== save.team.length > 0)
      ctx.addIssue({ code: "custom", message: "Đội phiêu lưu không nhất quán" })
    if (!area.grid[save.y]?.[save.x] || area.grid[save.y][save.x] === "#")
      ctx.addIssue({ code: "custom", message: "Vị trí phiêu lưu không hợp lệ" })
    if (
      save.encounter &&
      (!save.team.some(
        (member) => member.uid === save.encounter!.activeUid && member.hp > 0,
      ) ||
        save.encounter.hp > save.encounter.maxHp)
    )
      ctx.addIssue({
        code: "custom",
        message: "Cuộc chạm trán không nhất quán",
      })
  })
  .transform((save) => migrateAdventure(save as unknown as AdventureSave))
const statusId = z.enum(["burn", "soaked", "rooted", "drowsy"]).nullable()
const memberV2 = adventureMember.extend({
  level: z.number().int().min(1).max(50),
  pp: z.record(z.string().max(40), z.number().int().min(0).max(30)),
  status: statusId,
  statusTurns: z.number().int().min(0).max(4),
})
const encounterV2 = adventureEncounter.extend({
  kind: z.enum(["wild", "keeper", "trainer"]),
  level: z.number().int().min(1).max(50),
  npcId: z.string().max(80).optional(),
  roster: z
    .array(
      z.object({
        cardId: adventureCardId,
        level: z.number().int().min(1).max(50),
      }),
    )
    .max(6)
    .optional(),
  wave: z.number().int().min(0).max(5).optional(),
  enemyPP: z.record(z.string().max(40), z.number().int().min(0).max(30)),
  enemyStatus: statusId,
  enemyStatusTurns: z.number().int().min(0).max(4),
  participants: z.array(z.string().min(1).max(80)).max(6),
})
const adventureV2 = z
  .object({
    version: z.literal(2),
    started: z.boolean(),
    areaId: adventureAreaId,
    mapId: z
      .string()
      .max(80)
      .refine((id) => !!ADVENTURE_MAP_BY_ID[id], "Bản đồ không hợp lệ"),
    x: z.number().int().min(0).max(23),
    y: z.number().int().min(0).max(17),
    facing: z.enum(["up", "down", "left", "right"]),
    steps: integer,
    aromaSeals: z.number().int().min(0).max(999),
    coins: z.number().int().min(0).max(99999),
    inventory: z.object({
      potion: z.number().int().min(0).max(99),
      revive: z.number().int().min(0).max(99),
    }),
    team: z.array(memberV2).max(6),
    reserve: z.array(memberV2).max(60),
    discovered: z.array(adventureCardId).max(171),
    badges: z
      .array(z.enum(["lantern", "harbor", "garden", "tide", "moon"]))
      .max(5),
    completedQuests: z.array(z.string().max(80)).max(64),
    claimedFinds: z.array(z.string().max(80)).max(32),
    defeatedTrainers: z.array(z.string().max(80)).max(32),
    visitedMaps: z.array(z.string().max(80)).max(20),
    encounter: encounterV2.nullable(),
    message: z.string().max(400).nullable(),
    speaker: z
      .enum([
        "hero",
        "bach",
        "hai",
        "nhien",
        "moc",
        "lien",
        "grandmother",
        "merchant",
        "child",
        "la",
      ])
      .nullable(),
    service: z.enum(["shop", "storage"]).nullable(),
    follower: z
      .object({
        x: z.number().int().min(0).max(23),
        y: z.number().int().min(0).max(17),
      })
      .nullable(),
    completed: z.boolean(),
  })
  .superRefine((save, ctx) => {
    const invalid = (message: string) =>
      ctx.addIssue({ code: "custom", message })
    const map = ADVENTURE_MAP_BY_ID[save.mapId],
      members = [...save.team, ...save.reserve]
    if (!map || map.areaId !== save.areaId || !canWalk(map, save.x, save.y))
      invalid("Vị trí phiêu lưu không hợp lệ")
    if (save.follower && map && !canWalk(map, save.follower.x, save.follower.y))
      invalid("Vị trí đồng hành không hợp lệ")
    if (
      save.started !== save.team.length > 0 ||
      new Set(members.map((m) => m.uid)).size !== members.length
    )
      invalid("Đội phiêu lưu không nhất quán")
    if (
      (save.service === "shop" && !save.mapId.endsWith(":shop")) ||
      (save.service === "storage" && !save.mapId.endsWith(":clinic"))
    )
      invalid("Dịch vụ không đúng vị trí")
    const validPP = (
      card: string,
      level: number,
      pp: Record<string, number>,
    ) => {
      const skills = skillsFor(card, level)
      return (
        Object.keys(pp).length === skills.length &&
        skills.every(
          (skill) =>
            Number.isInteger(pp[skill.id]) &&
            pp[skill.id] >= 0 &&
            pp[skill.id] <= skill.pp,
        )
      )
    }
    for (const member of members)
      if (
        CARD_MAP[member.cardId] &&
        (member.hp > spiritMaxHp(member.cardId, member.level) ||
          !validPP(member.cardId, member.level, member.pp))
      )
        invalid("Sinh lực hoặc PP không hợp lệ")
    const e = save.encounter
    if (
      e &&
      (!save.team.some((m) => m.uid === e.activeUid && m.hp > 0) ||
        e.hp < 1 ||
        e.hp > e.maxHp ||
        !e.participants.every((uid) => save.team.some((m) => m.uid === uid)))
    )
      invalid("Cuộc chạm trán không nhất quán")
    if (
      e &&
      CARD_MAP[e.cardId] &&
      (!validPP(e.cardId, e.level, e.enemyPP) ||
        e.maxHp !== spiritMaxHp(e.cardId, e.level))
    )
      invalid("Đối thủ không hợp lệ")
    if (
      e?.roster &&
      (!e.roster[e.wave ?? 0] ||
        e.roster[e.wave ?? 0].cardId !== e.cardId ||
        e.roster[e.wave ?? 0].level !== e.level)
    )
      invalid("Đội đối thủ không nhất quán")
    if (save.visitedMaps.some((id) => !ADVENTURE_MAP_BY_ID[id]))
      invalid("Vùng đã đến không hợp lệ")
  })
  .transform((save) => save as AdventureSave)
const adventure = z.union([adventureV2, legacyAdventure])
const stats = z.object({
  wins: integer,
  battles: integer,
  packs: integer,
  crafted: integer,
})
const unit = z.object({
  uid: z.string(),
  cardId,
  attack: integer,
  health: z.number().int().min(-100).max(10000),
  maxHealth: integer,
  shield: integer,
  ready: z.boolean(),
  frozen: z.boolean().optional(),
  icedThisTurn: z.boolean().optional(),
  triggers: integer.max(2).optional(),
  keywords: z.array(z.enum(["guard", "rush", "shield", "drain"])),
})
const trapSlot = z.object({uid:z.string().regex(/^t[1-9]\d*$/).max(30),cardId:cardId.refine(id=>CARD_MAP[id].kind==="trap"),setTurn:integer.min(1),revealed:z.boolean().optional()})
const trapIntent = z.object({
  trigger:z.enum(["attack","spell","summon","fallen"]),actor:z.literal("enemy"),cardId,
  source:z.string().max(80).optional(),target:z.string().max(100).optional(),index:integer.max(7).optional(),
  branch:z.enum(["first","second"]).optional(),fallenCardId:cardId.optional(),resume:z.enum(["play","attack","continue"]),
})
const fighter = z.object({
  trap:trapSlot.nullable().optional(),
  health: z.number().int().min(-100).max(10000),
  maxHealth: integer,
  mana: integer.max(7),
  maxMana: integer.max(7),
  deck: z.array(cardId).max(DECK_SIZE),
  hand: z.array(cardId).max(8),
  board: z.array(unit).max(4),
  fatigue: integer,
  chainSchool: z
    .enum(["ember", "tide", "grove", "hearth", "sugar"])
    .nullable()
    .default(null),
  recipeTrail: z.array(cardId).max(2).default([]),
  recipesUsed: z.array(recipeId).max(6).default([]),
  resonanceUsed: z.boolean().default(false),
  graveyard: z.array(cardId).max(36).default([]),
  spellsThisTurn: integer.max(40).default(0),
})
const relicId = z
  .string()
  .refine((id) => !!RELIC_MAP[id], "Di vật không hợp lệ")
const loot = z.object({
  coins: integer,
  xp: integer,
  tickets: integer,
  cardId: cardId.optional(),
  dust: integer.optional(),
})
const node = z.object({
  id: z.string(),
  kind: z.enum(["battle", "elite", "boss", "event", "camp"]),
  school: z.enum(["ember", "tide", "grove", "hearth", "sugar"]),
  title: z.string().max(100),
  eventId: z
    .string()
    .refine((id) => EXPEDITION_EVENTS.some((e) => e.id === id))
    .optional(),
})
const expedition = z
  .object({
    promise: z.enum(["safe", "bold"]).optional(),
    rulesVersion: z.union([z.literal(350), z.literal(400), z.literal(450), z.literal(470)]).default(350),
    id: z.string(),
    seed: z.number().int().min(0).max(4294967295),
    status: z.enum([
      "path",
      "battle",
      "event",
      "reward",
      "won",
      "lost",
      "abandoned",
    ]),
    floor: integer.max(6),
    health: integer.max(38),
    maxHealth: z.number().int().min(34).max(38),
    supplies: integer,
    deck: z
      .array(cardId)
      .max(DECK_SIZE)
      .refine((ids) =>
        ids.every((id) => ids.filter((c) => c === id).length <= 2),
      ),
    relics: z
      .array(relicId)
      .max(10)
      .refine((ids) => new Set(ids).size === ids.length),
    nodes: z.array(z.array(node).min(1).max(2)).length(7),
    route: z.array(z.string()).max(7),
    currentNode: z.string().nullable(),
    reward: z
      .object({
        cards: z.array(cardId).max(3),
        relics: z.array(relicId).max(3),
        cardPicked: z.boolean(),
        relicPicked: z.boolean(),
      })
      .nullable(),
    log: z.array(z.string()).max(30),
    wins: integer.max(4),
    paid: z.boolean(),
  })
  .superRefine((run, ctx) => {
    const nodes = run.nodes.flat()
    if (
      run.health > run.maxHealth ||
      new Set(nodes.map((n) => n.id)).size !== nodes.length ||
      new Set(run.route).size !== run.route.length ||
      run.route.some((id, i) => !run.nodes[i]?.some((n) => n.id === id))
    )
      ctx.addIssue({ code: "custom", message: "Hành trình không nhất quán" })
    if (run.currentNode && run.currentNode !== run.route[run.route.length - 1])
      ctx.addIssue({ code: "custom", message: "Điểm dừng không hợp lệ" })
    if (run.status === "reward" && !run.reward)
      ctx.addIssue({ code: "custom", message: "Thiếu phần thưởng hành trình" })
    if (run.deck.length !== deckSizeForRules(run.rulesVersion))
      ctx.addIssue({code:"custom",message:"Số lá không khớp luật hành trình"})
    const currentNode = run.nodes[run.floor]?.find(
      (n) => n.id === run.currentNode,
    )
    if (
      run.status === "path" &&
      (run.route.length !== run.floor ||
        run.currentNode !== null ||
        run.reward !== null)
    )
      ctx.addIssue({
        code: "custom",
        message: "Bản đồ hành trình không hợp lệ",
      })
    if (
      ["event", "battle", "reward"].includes(run.status) &&
      (run.route.length !== run.floor + 1 || !currentNode)
    )
      ctx.addIssue({
        code: "custom",
        message: "Điểm dừng không thuộc chặng hiện tại",
      })
    if (
      run.status === "event" &&
      (!currentNode ||
        !["event", "camp"].includes(currentNode.kind) ||
        (currentNode.kind === "event" && !currentNode.eventId))
    )
      ctx.addIssue({ code: "custom", message: "Sự kiện không hợp lệ" })
    if (
      run.status === "battle" &&
      (!currentNode || !["battle", "elite", "boss"].includes(currentNode.kind))
    )
      ctx.addIssue({ code: "custom", message: "Điểm giao đấu không hợp lệ" })
    if (
      run.status === "won" &&
      (run.floor !== 6 ||
        run.route.length !== 7 ||
        currentNode?.kind !== "boss")
    )
      ctx.addIssue({ code: "custom", message: "Hành trình chưa hoàn thành" })
    if (["event", "battle"].includes(run.status) && !run.currentNode)
      ctx.addIssue({ code: "custom", message: "Thiếu điểm dừng" })
  })
export const GameSaveSchema = z
  .object({
    version: z.literal(1),
    tcg470:z.object({giftClaimed:z.boolean()}).optional(),
    traps450:z.object({giftClaimed:z.boolean()}).optional(),
    contentVersion: z.union([z.literal(350), z.literal(400), z.literal(450), z.literal(470)]).optional(),
    story400: z
      .object({
        version: z.literal(1),
        giftClaimed: z.boolean(),
        decisions: z
          .record(z.string().max(40), z.string().max(40))
          .refine((v) =>
            Object.entries(v).every(([k, d]) => validLivingDecision(k, d)),
          )
          .optional(),
        originEnding: z.enum(["remember", "release"]).nullable(),
        choices: z.record(z.string().max(80), z.enum(["courage", "wisdom"])),
        seenScenes: z.array(z.string().max(80)).max(32),
        claimedRewards: z.array(z.string().max(100)).max(32),
      })
      .optional(),
    coins: integer,
    dust: integer,
    xp: integer,
    packTickets: integer,
    cards: z.record(cardId, z.number().int().min(0).max(2)),
    foils: z.array(cardId),
    decks: z
      .array(
        z.object({
          id: z.string(),
          name: z.string().max(40),
          cards: z.array(cardId).max(DECK_SIZE),
        }),
      )
      .min(1)
      .max(6),
    activeDeckId: z.string(),
    clearedStages: z.array(z.string()),
    choices: z.record(z.string(), z.enum(["courage", "wisdom"])),
    claimedQuests: z.array(z.string()),
    claimedDailyQuests: z.array(z.string()),
    day: z.string(),
    lastCheckIn: z.string().nullable(),
    daily: stats,
    stats,
    pity: integer.max(8),
    legacyImported: z.array(z.string()),
    updatedAt: z.string(),
    expedition: expedition.nullable().default(null),
    expeditionStats: z
      .object({ runs: integer, wins: integer, best: integer.max(7) })
      .default({ runs: 0, wins: 0, best: 0 }),
    bonds: z
      .partialRecord(
        npcId,
        z.object({
          choice: z.enum(["share", "listen"]),
          completed: z.boolean(),
        }),
      )
      .default({}),
    companion: npcId.nullable().default(null),
    weeklyRecords: z
      .record(
        weekId,
        z.object({
          stage: integer.max(2),
          score: integer,
          best: integer,
          claimed: z.boolean(),
          completions: integer,
        }),
      )
      .refine((records) => Object.keys(records).length <= 12)
      .default({}),
    storyEnding: z.enum(["remember", "release"]).nullable().default(null),
    autoChess: autoSaveSchema.optional(),
    adventure: adventure.optional(),
    history: z
      .array(
        z.object({
          id: z.string(),
          mode: z.enum([
            "story",
            "practice",
            "expedition",
            "sidequest",
            "weekly",
          ]),
          opponent: z.string(),
          result: z.enum(["win", "loss"]),
          rounds: integer,
          date: z.string(),
          stageId: z.string().nullable(),
          loot,
        }),
      )
      .max(20)
      .default([]),
    battle: z
      .object({
        rulesVersion: z.union([z.literal(350), z.literal(400), z.literal(450), z.literal(470)]).default(350),
        turnSerial:integer.min(1).optional(),turnSide:z.enum(["player","enemy"]).optional(),
        enemyPhase:z.object({phase:z.enum(["plays","attacks"]),steps:integer.max(12),attacks:z.array(z.string().max(80)).max(4),cursor:integer.max(4)}).optional(),
        pendingReaction:z.object({id:z.string().min(1).max(140),trapUid:z.string().max(30),intent:trapIntent}).optional(),
        flavorSequence: integer.optional(),
        pendingFlavors: z
          .array(
            z.object({
              id: z.string().max(100),
              owner: z.enum(["player", "enemy"]),
              cardId,
              effect: z.enum(["buff", "heal"]),
              power: integer.max(10),
              targetUid: z.string().max(80).optional(),
              executeRound: integer,
              sequence: integer,
              delayed: z.boolean().optional(),
            }),
          )
          .max(4)
          .optional(),
        id: z.string(),
        stageId: z.string().nullable(),
        opponent: z.string(),
        enemyChallenge: z.union([z.literal(1), z.literal(1.3)]).optional(),
        round: integer,
        player: fighter,
        enemy: fighter,
        log: z.array(z.string()).max(40),
        result: z.enum(["win", "loss"]).nullable(),
        settled: z.boolean(),
        nextUid: integer,
        tactic: z
          .object({
            status: z.enum(["waiting", "pending", "chosen"]),
            choice: z.enum(["flame", "shelter", "insight"]).optional(),
          })
          .refine(
            (t) => (t.status === "chosen") === !!t.choice,
            "Ứng biến không nhất quán",
          )
          .optional(),
        opening: z.boolean().default(false),
        openingGiftUsed: z.boolean().default(false),
        encounter: z
          .object({
            kind: z.enum(["protect", "rescue"]),
            progress: integer.max(3),
            target: z.literal(3),
            integrity: integer.max(6),
            maxIntegrity: integer.max(6),
          })
          .optional(),
        pendingScenes: z.array(sceneId).max(8).default([]),
        seenScenes: z.array(sceneId).max(8).default([]),
        companion: z
          .object({
            id: npcId,
            choice: z.enum(["share", "listen"]),
            used: z.boolean(),
          })
          .optional(),
        sideQuest: npcId.optional(),
        weekly: z
          .object({
            week: weekId,
            index: integer.max(2),
            seed: z.number().int().min(0).max(4294967295),
            score: integer.optional(),
          })
          .optional(),
        livingRulesVersion: z.literal(2).optional(),
        bossRuleId: bossId.optional(),
        rngState: z.number().int().min(0).max(4294967295).optional(),
        comboCounts: z.partialRecord(recipeId, integer.max(1000)).optional(),
        tableAura: z.object({ id: recipeId, untilRound: integer }).optional(),
        loot: loot.optional(),
        expedition: z
          .object({
            runId: z.string(),
            nodeId: z.string(),
            relics: z.array(relicId).max(10),
            enemyBoost: integer.max(1),
            summoned: integer,
          })
          .optional(),
      })
      .nullable(),
  })
  .passthrough()
  .superRefine((save, ctx) => {
    const b = save.battle
    if (b) {
      const trapIssue=trapStateIssue(b)
      if(trapIssue)ctx.addIssue({code:"custom",message:trapIssue})
      const pending = b.pendingFlavors ?? []
      if (
        new Set(pending.map((effect) => effect.id)).size !== pending.length ||
        new Set(pending.map((effect) => effect.sequence)).size !==
          pending.length ||
        ["player", "enemy"].some(
          (side) =>
            pending.filter((effect) => effect.owner === side).length > 2,
        ) ||
        pending.some(
          (effect) =>
            !CARD_MAP[effect.cardId].ability?.startsWith("steep-") ||
            effect.sequence > (b.flavorSequence ?? 0) ||
            effect.power !== CARD_MAP[effect.cardId].power ||
            effect.effect !==
              (CARD_MAP[effect.cardId].ability === "steep-unit"
                ? "buff"
                : "heal") ||
            (effect.effect === "buff" ? !effect.targetUid : !!effect.targetUid),
        )
      )
        ctx.addIssue({
          code: "custom",
          message: "Hiệu ứng Ủ vị không nhất quán",
        })
      const limit = boardLimit(b), size = deckSizeForRules(b.rulesVersion)
      if ([b.player,b.enemy].some(side => side.board.length > limit || side.deck.length > size) || (b.enemyPhase && (b.enemyPhase.attacks.length > limit || b.enemyPhase.cursor > limit)))
        ctx.addIssue({code:"custom",message:"Sân hoặc bộ bài vượt luật trận đang lưu"})
      const battleCards = [b.player, b.enemy].flatMap((side) => [
        ...side.deck,
        ...side.hand,
        ...side.board.map((unit) => unit.cardId),
        ...(side.graveyard ?? []),
        ...(side.trap ? [side.trap.cardId] : []),
      ])
      if (
        (b.rulesVersion < 400 && pending.length) || battleCards.some((id) => (CARD_MAP[id].contentVersion ?? 350) > b.rulesVersion)
      )
        ctx.addIssue({
          code: "custom",
          message: "Trận 3.5 không nhận luật/thẻ 4.0",
        })
    }
    if (
      save.expedition &&
      save.expedition.deck.some((id) => (CARD_MAP[id].contentVersion ?? 350) > save.expedition!.rulesVersion)
    )
      ctx.addIssue({
        code: "custom",
        message: "Chuyến cũ không nhận thẻ mới giữa hành trình",
      })
    if (
      b?.tactic?.status === "pending" &&
      (b.round < 4 || b.opening || b.result)
    )
      ctx.addIssue({ code: "custom", message: "Chưa đến lượt ứng biến" })
    if (
      b &&
      [!!b.sideQuest, !!b.weekly, !!b.expedition].filter(Boolean).length > 1
    )
      ctx.addIssue({
        code: "custom",
        message: "Trận đấu có nhiều chế độ không tương thích",
      })
    if (b && (b.sideQuest || b.weekly) && b.stageId !== null)
      ctx.addIssue({
        code: "custom",
        message: "Truyện phụ và thử thách không mở chiến dịch",
      })
    if (save.companion && !save.bonds[save.companion]?.completed)
      ctx.addIssue({
        code: "custom",
        message: "Chưa giữ lời hứa với người đồng hành",
      })
    if (
      b &&
      (new Set(b.pendingScenes).size !== b.pendingScenes.length ||
        new Set(b.seenScenes).size !== b.seenScenes.length ||
        b.pendingScenes.some((id) => b.seenScenes.includes(id)))
    )
      ctx.addIssue({
        code: "custom",
        message: "Đoạn truyện đang chờ không nhất quán",
      })
    if (
      b?.encounter &&
      (b.encounter.integrity > b.encounter.maxIntegrity ||
        b.encounter.progress > b.encounter.target)
    )
      ctx.addIssue({
        code: "custom",
        message: "Mục tiêu trận đấu không nhất quán",
      })
    if (
      save.expedition?.status === "battle" &&
      (!save.battle?.expedition || save.battle.settled)
    )
      ctx.addIssue({ code: "custom", message: "Thiếu trận đấu của hành trình" })

    if (
      save.battle?.expedition &&
      (save.expedition?.id !== save.battle.expedition.runId ||
        save.expedition.currentNode !== save.battle.expedition.nodeId ||
        save.expedition.rulesVersion !== save.battle.rulesVersion)
    )
      ctx.addIssue({
        code: "custom",
        message: "Trận đấu không thuộc hành trình hiện tại",
      })
  })
export function parseGame(raw: unknown): GameSave | null {
  const parsed = GameSaveSchema.safeParse(raw)
  return parsed.success ? rotateDay(parsed.data) : null
}
export function loadGame(): GameSave {
  return loadProtected(GAME_KEY, parseGame, newGame)
}
export function saveGame(save: GameSave) {
  writeProtectedBatch([
    { key: GAME_KEY, value: { ...save, updatedAt: new Date().toISOString() } },
  ])
}
