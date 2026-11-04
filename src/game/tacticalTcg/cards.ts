import { CARDS, CARD_MAP, SCHOOLS, STARTER_DECK } from "../catalog"
import type { GameCard } from "../types"
import type { TrapId, UnitRole } from "./engine/types"
import { TACTICAL_CATALOG } from "./catalog"

export type CardEffectKind =
  | "damage"
  | "sweep"
  | "heal"
  | "draw"
  | "buff"
  | "ward"
  | "revive"
  | "disarm"
export interface TacticalCard extends GameCard {
  tacticalEffect: CardEffectKind | null
  tacticalPower: number
  tacticalRole: UnitRole
  tacticalTrap: TrapId | null
}

const abilityEffects: Partial<
  Record<NonNullable<GameCard["ability"]>, CardEffectKind>
> = {
  wok: "damage",
  pierce: "damage",
  desperation: "damage",
  wash: "damage",
  starlight: "damage",
  insight: "draw",
  revive: "revive",
  rebloom: "revive",
  mend: "heal",
  feast: "heal",
  "tea-mend": "heal",
  "steep-heal": "heal",
  thaw: "heal",
  dream: "heal",
  sharp: "buff",
  diverse: "buff",
  offering: "buff",
  "steep-unit": "buff",
  root: "ward",
  bulwark: "ward",
  veil: "ward",
  moonward: "ward",
  disarm: "disarm",
  "reveal-trap": "disarm",
  unsteep: "disarm",
}
export const TACTICAL_UNIT_ABILITIES: Partial<
  Record<NonNullable<GameCard["ability"]>, string>
> = {
  breach: "Vào sân: xóa khiên của địch có nhiều khiên nhất.",
  duelist: "Đánh mục tiêu đầy máu: +12 sát thương.",
  execute: "Đánh mục tiêu đã mất máu: +12 sát thương.",
  triage: "Vào sân: hồi 40 HP cho đồng minh khác mất nhiều máu nhất.",
  relay:
    "Phép khác hệ đầu mỗi vòng: đồng minh khác ít máu nhất +6 công và 10 khiên.",
  testament: "Bị hạ: đồng minh ít máu nhất +6 công và 20 khiên.",
  thawer: "Vào sân: mọi đồng minh khác +10 Hương lực.",
  reserve: "Vào sân: rút 2 lá nếu tay đã hết bài.",
  conductor: "Phép thứ hai mỗi vòng: hồi 1 Lửa Bếp (một lần).",
  siphon: "Đánh quân địch: chuyển tối đa 12 khiên của mục tiêu sang mình.",
  ambush: "Vào sân: gây 20 sát thương lên địch đã bị thương ít máu nhất.",
  spellfire: "Mỗi khi bạn dùng phép: +6 công, tối đa 2 lần/vòng.",
  scout: "Vào sân: rút 1 lá nếu tay còn không quá 3 lá.",
  snare: "Vào sân: địch có công cao nhất mất 6 công (không dưới 0).",
  mender: "Vào sân: mọi đồng minh hồi 20 HP.",
  bloom: "Chỉ huy được hồi Ý chí: +6 công, tối đa 2 lần/vòng.",
  host: "Vào sân: mọi đồng minh khác +10 khiên.",
  pantry: "Bị hạ: hồi 3 Ý chí.",
  farewell: "Bị hạ: rút 1 lá.",
  weaver:
    "Mỗi khi bạn dùng phép: đồng minh ít máu nhất +10 khiên, tối đa 2 lần/vòng.",
  welcome: "Vào sân: nếu có 3 hệ, mọi đồng minh +6 công.",
  "season-host": "Sau phép tăng công đầu mỗi vòng: rút 1 lá.",
}

function adaptCard(original: GameCard): TacticalCard {
  const effect =
    original.kind === "spell"
      ? (original.ability && abilityEffects[original.ability]) ||
        original.effect ||
        "buff"
      : (original.effect ?? null)
  const power = Math.max(1, original.power ?? 2)
  const role: UnitRole = original.keywords.includes("guard")
    ? "guardian"
    : original.school === "grove" || original.school === "sugar"
      ? "support"
      : original.school === "tide"
        ? "mage"
        : "striker"
  const trap: TrapId | null =
    original.kind !== "trap"
      ? null
      : ["reflect", "embers", "bind"].includes(original.trap?.effect ?? "")
        ? "steam-counter"
        : ["recall", "reserve"].includes(original.trap?.effect ?? "")
          ? "warm-broth"
          : "bamboo-guard"
  let text = ""
  if (original.kind === "unit") {
    text =
      `${role === "guardian" ? "Hộ vệ: ưu tiên chắn đòn trong hàng trước. " : ""}` +
      `${original.keywords.includes("shield") ? "Vào sân: +10 khiên. " : ""}` +
      `${original.keywords.includes("rush") ? "Vào sân: +25 Hương lực. " : ""}` +
      `${original.keywords.includes("drain") ? "Đánh trúng: hồi 1 Ý chí. " : ""}` +
      (effect === "draw"
        ? `Vào sân: rút ${Math.min(2, power)} lá. `
        : effect === "heal"
          ? `Vào sân: hồi ${Math.min(5, power)} Ý chí. `
          : "Đồng hệ: +5 khiên nếu đã có Vị Linh cùng hệ. ") +
      `Tự đánh ${original.attack * 6}; Tuyệt kỹ ${Math.max(18, original.attack * 12)} sát thương.`
    if (original.ability && TACTICAL_UNIT_ABILITIES[original.ability])
      text = `${TACTICAL_UNIT_ABILITIES[original.ability]} ${text}`
  } else if (trap) {
    text =
      trap === "bamboo-guard"
        ? "Bẫy theo cột: tạo 20 khiên trước đòn đánh đầu tiên vào đồng minh."
        : trap === "steam-counter"
          ? "Bẫy theo cột: phản lại kẻ tấn công 12 sát thương sau đòn đánh đầu tiên."
          : "Bẫy theo cột: hồi 18 sinh lực sau đòn đánh khi đồng minh còn không quá nửa máu (không hồi sinh)."
  } else {
    text =
      effect === "damage"
        ? `Gây ${power * 10} sát thương lên một Vị Linh địch; nếu sân địch trống, gây ${power} lên Chỉ huy.`
        : effect === "sweep"
          ? `Gây ${power * 6} sát thương lên mọi Vị Linh địch.`
          : effect === "heal"
            ? `Hồi ${power} Ý chí và ${power * 5} sinh lực cho mọi Vị Linh của bạn.`
            : effect === "draw"
              ? `Rút ${Math.min(3, power)} lá. Tay tối đa 8; thẻ rút khi tay đầy vào ký ức.`
              : effect === "buff"
                ? `Một Vị Linh đồng minh nhận +${power * 5} công và +${power * 8} sinh lực tối đa.`
                : effect === "ward"
                  ? `Mọi Vị Linh đồng minh nhận ${power * 10} khiên.`
                  : effect === "revive"
                    ? "Gọi lại Vị Linh bị hạ gần nhất với nửa sinh lực vào ô trống. Không kích hiệu ứng vào sân."
                    : "Gỡ bẫy địch đang gài và rút 1 lá."
  }
  return {
    ...original,
    text,
    attack: original.attack * 6,
    health: original.health * 10,
    tacticalEffect: effect,
    tacticalPower: power,
    tacticalRole: role,
    tacticalTrap: trap,
  }
}

/** Every original ID/art/lore is retained; displayed rules describe this engine. */
export const TACTICAL_CARDS = CARDS.map(adaptCard)
export const TACTICAL_CARD_MAP = Object.fromEntries(
  TACTICAL_CARDS.map((card) => [card.id, card]),
) as Record<string, TacticalCard>
export const TACTICAL_DECK_SIZE = 24
export const TACTICAL_STARTER = STARTER_DECK.map((id) =>
  id === "xoi" ? "trap-ward" : id === "banh-cuon" ? "chef-nhien" : id,
)
export const tacticalCardId = (id: string) =>
  id.startsWith("card:") ? id.slice(5) : id
export function ownedTacticalCards(copies: Record<string, number>) {
  const owned: Record<string, number> = {}
  for (const [id, count] of Object.entries(copies)) {
    const legacy = tacticalCardId(id)
    if (CARD_MAP[legacy])
      owned[legacy] = Math.min(2, (owned[legacy] ?? 0) + count)
  }
  for (const spirit of TACTICAL_CATALOG.spirits) {
    if (!(copies[spirit.id] > 0)) continue
    const id = spirit.aliases
      .find((alias) => alias.startsWith("chest:"))
      ?.slice(6)
    if (id && CARD_MAP[id]) owned[id] = Math.max(owned[id] ?? 0, 1)
  }
  return owned
}
export function tacticalDeckErrors(
  cards: readonly string[],
  owned?: Record<string, number>,
) {
  const errors: string[] = []
  if (cards.length !== 24)
    errors.push(`Bộ bài cần đủ 24 lá (hiện ${cards.length}).`)
  const counts: Record<string, number> = {}
  for (const id of cards) counts[id] = (counts[id] ?? 0) + 1
  for (const [id, count] of Object.entries(counts)) {
    if (!TACTICAL_CARD_MAP[id]) errors.push(`Thẻ không hợp lệ: ${id}.`)
    else if (count > 2 || (owned && count > (owned[id] ?? 0)))
      errors.push(
        `${TACTICAL_CARD_MAP[id].name}: tối đa 2 bản và phải sở hữu đủ.`,
      )
  }
  if (cards.filter((id) => TACTICAL_CARD_MAP[id]?.kind === "unit").length < 8)
    errors.push("Cần ít nhất 8 lá Vị Linh để bảo vệ Chỉ huy.")
  return errors
}
export function cardSchoolName(id: string) {
  return SCHOOLS[TACTICAL_CARD_MAP[id].school].name
}
