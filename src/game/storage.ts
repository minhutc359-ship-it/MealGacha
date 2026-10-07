import { z } from "zod"
import { RELIC_MAP, EXPEDITION_EVENTS } from "./expedition"
import { CARD_MAP } from "./catalog"
import { newGame, rotateDay } from "./progression"
import type { GameSave } from "./types"

export const GAME_KEY = "foodchest.tcg.v1"
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
  resonanceUsed: z.boolean().default(false),
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
      .max(3),
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
    storyEnding: z.enum(["remember", "release"]).nullable().default(null),
    history: z
      .array(
        z.object({
          id: z.string(),
          mode: z.enum(["story", "practice", "expedition"]),
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
        id: z.string(),
        stageId: z.string().nullable(),
        opponent: z.string(),
        round: integer,
        player: fighter,
        enemy: fighter,
        log: z.array(z.string()).max(40),
        result: z.enum(["win", "loss"]).nullable(),
        settled: z.boolean(),
        nextUid: integer,
        opening: z.boolean().default(false),
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
  .superRefine((save, ctx) => {
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
  try {
    const raw = localStorage.getItem(GAME_KEY)
    return raw ? (parseGame(JSON.parse(raw)) ?? newGame()) : newGame()
  } catch {
    return newGame()
  }
}
export function saveGame(save: GameSave) {
  localStorage.setItem(
    GAME_KEY,
    JSON.stringify({ ...save, updatedAt: new Date().toISOString() }),
  )
}
