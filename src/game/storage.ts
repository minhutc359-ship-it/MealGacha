import { validLivingDecision } from "./livingChoices"
import { z } from "zod"
import { RELIC_MAP, EXPEDITION_EVENTS } from "./expedition"
import { CARD_MAP } from "./catalog"
import { newGame, rotateDay } from "./progression"
import type { GameSave } from "./types"
import { autoSaveSchema } from "./autochess/schema"
import { loadProtected, writeProtectedBatch } from "../infrastructure/storage/protectedStorage"

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
 "living-market-3", "rain-harbor-3", "tomorrow-table-3",
  "lantern-3",
  "harbor-3",
  "garden-3",
  "tide-3",
  "moon-3",
  "last-table-3",
])
const integer = z.number().int().nonnegative().max(1_000_000_000)
const cardId = z.string().refine((id) => !!CARD_MAP[id], "Thẻ không hợp lệ")
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
const fighter = z.object({
  health: z.number().int().min(-100).max(10000),
  maxHealth: integer,
  mana: integer.max(7),
  maxMana: integer.max(7),
  deck: z.array(cardId).max(18),
  hand: z.array(cardId).max(8),
  board: z.array(unit).max(3),
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
    promise: z.enum(["safe","bold"]).optional(),
    rulesVersion: z.union([z.literal(350), z.literal(400)]).default(350),
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
      .length(18)
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
    contentVersion: z.union([z.literal(350), z.literal(400)]).optional(),
    story400: z.object({
      version: z.literal(1),
      giftClaimed: z.boolean(),
      decisions: z.record(z.string().max(40), z.string().max(40)).refine(v=>Object.entries(v).every(([k,d])=>validLivingDecision(k,d))).optional(),
      originEnding: z.enum(["remember", "release"]).nullable(),
      choices: z.record(z.string().max(80), z.enum(["courage", "wisdom"])),
      seenScenes: z.array(z.string().max(80)).max(32),
      claimedRewards: z.array(z.string().max(100)).max(32),
    }).optional(),
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
          cards: z.array(cardId).max(18),
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
        rulesVersion: z.union([z.literal(350), z.literal(400)]).default(350),
        flavorSequence: integer.optional(),
        pendingFlavors: z.array(z.object({
          id: z.string().max(100), owner: z.enum(["player", "enemy"]), cardId,
          effect: z.enum(["buff", "heal"]), power: integer.max(10), targetUid: z.string().max(80).optional(),
          executeRound: integer, sequence: integer, delayed: z.boolean().optional(),
        })).max(4).optional(),
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
      const pending = b.pendingFlavors ?? []
      if (new Set(pending.map(effect => effect.id)).size !== pending.length || new Set(pending.map(effect => effect.sequence)).size !== pending.length || ["player", "enemy"].some(side => pending.filter(effect => effect.owner === side).length > 2) || pending.some(effect => !CARD_MAP[effect.cardId].ability?.startsWith("steep-") || effect.sequence > (b.flavorSequence ?? 0) || effect.power !== CARD_MAP[effect.cardId].power || effect.effect !== (CARD_MAP[effect.cardId].ability === "steep-unit" ? "buff" : "heal") || (effect.effect === "buff" ? !effect.targetUid : !!effect.targetUid)))
        ctx.addIssue({ code: "custom", message: "Hiệu ứng Ủ vị không nhất quán" })
      const battleCards = [b.player, b.enemy].flatMap(side => [...side.deck, ...side.hand, ...side.board.map(unit => unit.cardId), ...(side.graveyard ?? [])])
      if (b.rulesVersion < 400 && (pending.length || battleCards.some(id => CARD_MAP[id].contentVersion === 400)))
        ctx.addIssue({ code: "custom", message: "Trận 3.5 không nhận luật/thẻ 4.0" })
    }
    if (save.expedition && save.expedition.rulesVersion < 400 && save.expedition.deck.some(id => CARD_MAP[id].contentVersion === 400))
      ctx.addIssue({ code: "custom", message: "Chuyến cũ không nhận thẻ mới giữa hành trình" })
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
        save.expedition.currentNode !== save.battle.expedition.nodeId)
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
  writeProtectedBatch([{ key: GAME_KEY, value: { ...save, updatedAt: new Date().toISOString() } }])
}
