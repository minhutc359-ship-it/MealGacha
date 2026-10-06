import { z } from "zod"
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
})
export const GameSaveSchema = z.object({
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
      loot: z
        .object({
          coins: integer,
          xp: integer,
          tickets: integer,
          cardId: cardId.optional(),
        })
        .optional(),
    })
    .nullable(),
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
