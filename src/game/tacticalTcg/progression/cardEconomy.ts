import { RARITIES, SCHOOLS } from "../../catalog"
import type { Deck, School } from "../../types"
import {
  TACTICAL_CARDS,
  TACTICAL_CARD_MAP,
  TACTICAL_STARTER,
  ownedTacticalCards,
  tacticalDeckErrors,
} from "../cards"
import { TACTICAL_CATALOG } from "../catalog"
import {
  TACTICAL_PROFILE_KEY,
  type StorageLike,
  type TacticalMigrationProfile,
} from "../migration"
import type { TacticalBattleState } from "../engine/types"
import type { TacticalPackReceipt } from "./schema"
import { commitTacticalProgress, readTacticalProgress } from "./storage"

export const TACTICAL_PACK_COST = 80
export class TacticalCheckpointConflict extends Error {}
let requestSequence = 0
/** Receipt/deck identity, including HTTP previews and WebViews without randomUUID. */
export function newTacticalRequestId() {
  if (typeof globalThis.crypto?.randomUUID === "function")
    return globalThis.crypto.randomUUID()
  const bytes = new Uint8Array(16)
  if (typeof globalThis.crypto?.getRandomValues === "function")
    globalThis.crypto.getRandomValues(bytes)
  else
    for (let i = 0; i < bytes.length; i++)
      bytes[i] = Math.floor(Math.random() * 256)
  return `${Date.now().toString(36)}-${Array.from(bytes, (n) => n.toString(16).padStart(2, "0")).join("")}-${++requestSequence}`
}
export async function withTacticalLock<T>(operation: () => T): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks)
    return navigator.locks.request("soul-of-meal:tactical-progress", operation)
  return operation()
}
export const TACTICAL_PACKS = [
  {
    id: "origin",
    name: "Khởi nguyên",
    school: null,
    symbol: "⬡",
    description: "Toàn bộ hệ · mở rộng bộ sưu tập",
  },
  ...Object.entries(SCHOOLS).map(([id, school]) => ({
    id,
    name: school.name,
    school: id as School,
    symbol: school.symbol,
    description: school.identity,
  })),
]

/** Additive one-time recovery. Original save/profile bytes never change. */
export function ensureTacticalAccount(storage: StorageLike) {
  const progress = readTacticalProgress(storage)
  if (progress.accountReady) return progress
  const raw = storage.getItem(TACTICAL_PROFILE_KEY)
  const profile: TacticalMigrationProfile | null = raw ? JSON.parse(raw) : null
  const grants: Record<string, number> = {}
  const owned = ownedTacticalCards(progress.cardCopies)
  for (const spirit of TACTICAL_CATALOG.spirits) {
    if (!(progress.cardCopies[spirit.id] > 0)) continue
    const alias = spirit.aliases.find((a) => a.startsWith("chest:"))?.slice(6)
    if (alias && TACTICAL_CARD_MAP[alias] && !(owned[alias] > 0))
      grants[`card:${alias}`] = 1
  }
  for (const id of new Set(TACTICAL_STARTER))
    grants[`card:${id}`] = Math.max(
      grants[`card:${id}`] ?? 0,
      2 - (owned[id] ?? 0),
    )
  const decks: Deck[] = (profile?.tcg?.decks ?? []).map((d) => ({
    ...d,
    cards: [...d.cards],
  }))
  let starterId = "tactical-starter"
  while (decks.some((d) => d.id === starterId)) starterId += "-new"
  decks.push({
    id: starterId,
    name: "Bếp nhà · Giao ước đầu tiên",
    cards: [...TACTICAL_STARTER],
  })
  const active = decks.find(
    (d) =>
      d.id === profile?.tcg?.activeDeckId &&
      !tacticalDeckErrors(d.cards, {
        ...owned,
        ...Object.fromEntries(
          Object.keys(grants).map((k) => [
            k.slice(5),
            (owned[k.slice(5)] ?? 0) + grants[k],
          ]),
        ),
      }).length,
  )
  return commitTacticalProgress(storage, {
    receiptId: "tcg:account:v2",
    accountReady: true,
    cardCopies: grants,
    decks,
    activeDeckId: active?.id ?? starterId,
    packTicketsDelta: 2 + (profile?.tcg?.packTickets ?? 0),
    tinhVi: profile?.tcg?.dust ?? 0,
  }).progress
}

export function saveTacticalDeck(
  storage: StorageLike,
  deck: Deck,
  equip = true,
) {
  const progress = ensureTacticalAccount(storage)
  const errors = tacticalDeckErrors(
    deck.cards,
    ownedTacticalCards(progress.cardCopies),
  )
  if (errors.length) throw Error(errors[0])
  if (!deck.name.trim() || deck.name.length > 40)
    throw Error("Tên bộ bài cần từ 1 đến 40 ký tự.")
  if (
    !progress.decks.some((d) => d.id === deck.id) &&
    progress.decks.length >= 12
  )
    throw Error("Bạn đã có 12 bộ bài.")
  const decks = [
    ...progress.decks.filter((d) => d.id !== deck.id),
    { ...deck, name: deck.name.trim(), cards: [...deck.cards] },
  ]
  return commitTacticalProgress(storage, {
    receiptId: `deck:${progress.revision}:${deck.id}`,
    decks,
    activeDeckId: equip ? deck.id : undefined,
  }).progress
}
export function craftTacticalCard(storage: StorageLike, cardId: string) {
  const progress = ensureTacticalAccount(storage),
    card = TACTICAL_CARD_MAP[cardId]
  if (!card) throw Error("Thẻ không tồn tại.")
  if ((progress.cardCopies[`card:${cardId}`] ?? 0) >= 2)
    throw Error("Đã sở hữu đủ 2 bản.")
  return commitTacticalProgress(storage, {
    receiptId: `craft:${progress.revision}:${cardId}`,
    spendTinhVi: RARITIES[card.rarity].dust,
    cardCopies: { [`card:${cardId}`]: 1 },
  }).progress
}
export function tacticalDailyDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}
export function claimTacticalDaily(storage: StorageLike, now = new Date()) {
  ensureTacticalAccount(storage)
  const date = tacticalDailyDate(now)
  return commitTacticalProgress(storage, {
    receiptId: `tcg-daily:${date}`,
    tinhVi: 30,
    packTicketsDelta: 1,
    dailyClaimedDate: date,
  }).progress
}

export function openTacticalPack(
  storage: StorageLike,
  packId: string,
  requestId: string,
  rng = Math.random,
) {
  const progress = ensureTacticalAccount(storage)
  const receiptId = `pack:${requestId}`
  if (progress.claimedRewardReceiptIds.includes(receiptId))
    return {
      progress,
      receipt:
        progress.packHistory.find((p) => p.id === receiptId) ??
        progress.lastPack!,
    }
  const pack = TACTICAL_PACKS.find((p) => p.id === packId)
  if (!pack) throw Error("Gói thẻ không tồn tại.")
  if (progress.packTickets < 1 && progress.tinhVi < TACTICAL_PACK_COST)
    throw Error("Cần 1 vé hoặc 80 Tinh Vị để mở gói.")
  const pool = TACTICAL_CARDS.filter(
    (c) => !pack.school || c.school === pack.school,
  )
  const cards: string[] = [],
    counts = { ...ownedTacticalCards(progress.cardCopies) },
    grants: Record<string, number> = {},
    newIds: string[] = []
  let duplicateTinhVi = 0,
    epic = false
  const random = () => Math.min(0.999999999, Math.max(0, rng()))
  for (let i = 0; i < 5; i++) {
    const roll = random()
    let rarity =
      roll < 0.02
        ? "legendary"
        : roll < 0.12
          ? "epic"
          : roll < 0.37
            ? "rare"
            : "common"
    if (
      i === 4 &&
      !cards.some((id) => TACTICAL_CARD_MAP[id].rarity !== "common") &&
      rarity === "common"
    )
      rarity = "rare"
    if (i === 4 && progress.packPity >= 7 && !epic && rarity !== "legendary")
      rarity = "epic"
    const candidates = pool.filter((c) => c.rarity === rarity)
    if (!candidates.length) throw Error("Pool thẻ thiếu độ hiếm đã công bố.")
    const card = candidates[Math.floor(random() * candidates.length)]
    cards.push(card.id)
    epic ||= card.rarity === "epic" || card.rarity === "legendary"
    if (!(counts[card.id] > 0)) newIds.push(card.id)
    if ((counts[card.id] ?? 0) >= 2)
      duplicateTinhVi += RARITIES[card.rarity].salvage
    counts[card.id] = (counts[card.id] ?? 0) + 1
    grants[`card:${card.id}`] = (grants[`card:${card.id}`] ?? 0) + 1
  }
  const receipt: TacticalPackReceipt = {
    id: receiptId,
    packId,
    cards,
    newCardIds: newIds,
    duplicateTinhVi,
    openedAt: new Date().toISOString(),
  }
  const result = commitTacticalProgress(storage, {
    receiptId,
    spendTinhVi: progress.packTickets ? 0 : TACTICAL_PACK_COST,
    packTicketsDelta: progress.packTickets ? -1 : 0,
    cardCopies: grants,
    packPity: epic ? 0 : progress.packPity + 1,
    packOpened: receipt,
  })
  return { progress: result.progress, receipt }
}
export function saveTacticalCheckpoint(
  storage: StorageLike,
  battle: TacticalBattleState | null,
  expected?: TacticalBattleState | null,
) {
  const progress = readTacticalProgress(storage)
  if (
    expected !== undefined &&
    JSON.stringify(progress.checkpoint) !== JSON.stringify(expected)
  )
    throw new TacticalCheckpointConflict(
      "Trận đã thay đổi ở tab khác. Đọc lại bản lưu trước khi tiếp tục.",
    )
  return commitTacticalProgress(storage, {
    receiptId: `checkpoint:${progress.revision}`,
    checkpoint: battle,
  }).progress
}
