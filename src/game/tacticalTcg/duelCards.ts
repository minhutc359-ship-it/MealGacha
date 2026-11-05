import {
  TACTICAL_CARDS,
  TACTICAL_CARD_MAP,
  type TacticalCard,
  type CardEffectKind,
} from "./cards"
import { CARDS } from "../catalog"
import type { TacticalBattleState } from "./engine/types"
import names from "./duelNames.json"

export const DUEL_ROLE_NAMES = {
  guardian: "Hộ vệ",
  striker: "Đấu sĩ",
  mage: "Pháp sư",
  support: "Trợ thủ",
} as const
export const DUEL_TRAITS = {
  quick: {
    name: "Tiên thủ",
    text: "Đánh trước khi tấn công thường; hạ mục tiêu thì không nhận phản đòn.",
  },
  overwhelm: {
    name: "Xuyên phá",
    text: "Sát thương thừa qua HP và khiên của quân địch đi vào chủ tướng.",
  },
  regenerate: { name: "Tái sinh", text: "Hồi 1 HP cuối vòng nếu còn sống." },
  spellshield: {
    name: "Hộ pháp",
    text: "Chặn phép gây sát thương hoặc khống chế đầu tiên nhắm vào mình, rồi mất Hộ pháp.",
  },
} as const
const traits: Record<string, NonNullable<TacticalCard["duelTraits"]>> = {
  "caravan-scout": ["quick"],
  "bun-cha": ["quick"],
  "banh-mi": ["quick"],
  "kimchi-jjigae": ["quick"],
  yakitori: ["quick"],
  "caravan-letter": ["quick"],
  "com-tam": ["overwhelm"],
  "chef-nhien": ["overwhelm"],
  pasta: ["overwhelm"],
  "keo-cu-do": ["overwhelm"],
  "bun-bo-hue": ["overwhelm"],
  "caravan-smith": ["overwhelm"],
  "chef-moc": ["regenerate"],
  "caravan-herbalist": ["regenerate"],
  "banh-khuc": ["regenerate"],
  "goi-cuon-tom-thit": ["regenerate"],
  "chef-lien": ["spellshield"],
  "caravan-pastry": ["spellshield"],
  "com-lang-vong": ["spellshield"],
  "banh-chung": ["spellshield"],
}
export const DUEL_TRAP_TEXT: Record<string, string> = {
  "trap-lid":
    "Khi chủ tướng bị đánh: lật để chặn trọn đòn đó. Địch vẫn tiêu đòn đánh hoặc Hương lực.",
  "trap-mirror":
    "Khi địch tấn công: chặn đòn và phản lên chủ tướng địch bằng công kẻ đánh, tối đa 3.",
  "trap-embers":
    "Trước đòn đánh địch: gây 2 sát thương và Thiêu đốt 1×2 cuối vòng lên quân địch chưa đánh. Không cộng dồn; hạ kẻ đánh sẽ hủy đòn.",
  "trap-root":
    "Sau khi địch gọi quân giá từ 3: gây 2 sát thương và khống chế đến hết vòng kế. Hộ pháp chặn cả sát thương lẫn khống chế.",
  "trap-seal":
    "Khi địch dùng phép giá từ 2: vô hiệu phép. Địch mất lá và Lửa; không kích nội tại hay công thức.",
  "trap-ward":
    "Trước đòn đánh vào quân bạn: mọi đồng minh nhận 2 khiên (tối đa 3), rồi đòn đánh tiếp tục.",
  "trap-recall":
    "Sau đòn đánh địch hạ đồng minh giá tối đa 4: gọi lại đúng quân đó với tối đa 2 HP nếu còn chỗ. Không kích vào sân; chờ vòng sau mới đánh.",
  "trap-pantry":
    "Sau khi địch gọi quân giá từ 4: hồi 3 HP chủ tướng và rút 2 lá. Lá dư khi tay đầy vào ký ức.",
}
const passive: Record<string, string> = {
  breach: "Vào sân: xóa khiên của địch có nhiều khiên nhất.",
  duelist: "Đánh quân đầy HP: +2 sát thương.",
  execute: "Đánh quân đã mất HP: +2 sát thương.",
  triage: "Vào sân: hồi 4 HP cho đồng minh khác mất nhiều HP nhất.",
  relay: "Phép khác hệ đầu vòng: đồng minh khác ít HP nhất +1 công và 1 khiên.",
  testament: "Bị hạ: đồng minh ít HP nhất +1 công và 2 khiên.",
  thawer: "Vào sân: giải khống chế đồng minh khác, cho họ +10 Hương lực.",
  reserve: "Vào sân: nếu tay đã hết bài, rút 2 lá.",
  conductor: "Phép thứ hai mỗi vòng: hồi 1 Lửa, tối đa 1 lần.",
  siphon:
    "Đánh quân địch: lấy tối đa 2 khiên của mục tiêu trước khi gây sát thương.",
  ambush: "Vào sân: gây 2 sát thương lên địch đã bị thương ít HP nhất.",
  spellfire: "Mỗi phép: +1 công, tối đa 2 lần/vòng.",
  scout: "Vào sân: rút 1 lá nếu tay không quá 3 lá.",
  snare: "Vào sân: địch có công cao nhất mất 1 công.",
  mender: "Vào sân: đồng minh hồi 2 HP.",
  bloom: "Chủ tướng được hồi HP: +1 công, tối đa 2 lần/vòng.",
  host: "Vào sân: đồng minh khác +1 khiên.",
  pantry: "Bị hạ: hồi 3 HP chủ tướng.",
  farewell: "Bị hạ: rút 1 lá.",
  weaver: "Mỗi phép: đồng minh ít HP nhất +1 khiên, tối đa 2 lần/vòng.",
  welcome: "Vào sân: nếu có 3 hệ, mọi đồng minh +1 công.",
  "season-host": "Phép tăng công đầu vòng: rút 1 lá.",
}
export function duelSpellText(
  effect: CardEffectKind | null,
  p: number,
  ability?: string,
) {
  if (ability === "thaw")
    return `Giải khống chế và thiêu đốt đồng minh; hồi ${p} HP chủ tướng và ${Math.ceil(p / 2)} HP mỗi quân. Không trả đòn đã dùng.`
  if (ability === "reveal-trap")
    return "Lộ danh tính bẫy địch (vẫn còn hiệu lực), rồi rút 1 lá."
  if (ability === "disarm")
    return "Gỡ bẫy địch vào ký ức và rút 1 lá; không kích bẫy."
  return effect === "damage"
    ? `Gây ${p} sát thương lên một quân hoặc chủ tướng địch. Phép nhắm được chủ tướng kể cả khi có Hộ vệ.`
    : effect === "sweep"
      ? `Gây ${Math.max(1, Math.ceil(p * 0.6))} sát thương lên toàn bộ quân địch.`
      : effect === "heal"
        ? `Hồi ${p} HP chủ tướng và ${Math.ceil(p / 2)} HP mọi đồng minh.`
        : effect === "draw"
          ? `Rút ${Math.min(3, p)} lá; tay tối đa 8, lá dư vào ký ức.`
          : effect === "buff"
            ? `Một đồng minh +${Math.ceil(p / 2)} công và +${p} HP tối đa.`
            : effect === "ward"
              ? `Mọi đồng minh nhận ${p} khiên (tối đa 3 khiên mỗi quân).`
              : effect === "revive"
                ? "Gọi lại đồng minh bị hạ gần nhất với nửa HP tối đa. Không kích vào sân, chờ vòng sau mới đánh."
                : "Gỡ bẫy địch, rút 1 lá."
}
export function duelChoiceCard(c: TacticalCard, index = 0): TacticalCard {
  const choice = c.duelRuleVersion === 3 ? c.choices?.[index] : undefined
  return choice
    ? {
        ...c,
        tacticalEffect: choice.effect,
        tacticalPower: choice.power,
        ability: choice.ability,
        text: duelSpellText(choice.effect, choice.power, choice.ability),
      }
    : c
}
export const DUEL_CARDS: TacticalCard[] = TACTICAL_CARDS.map((c, i) => {
  const original = CARDS[i],
    duelTraits = traits[c.id] ?? [],
    name = (names as Record<string, string>)[c.id] ?? c.name
  const attack = original.attack,
    health = original.health
  const text =
    c.kind === "unit"
      ? [
          c.tacticalRole === "guardian"
            ? "Hộ vệ: đối thủ phải đánh Hộ vệ trước khi đánh quân khác hoặc chủ tướng."
            : "",
          ...duelTraits.map(
            (t) => `${DUEL_TRAITS[t].name}: ${DUEL_TRAITS[t].text}`,
          ),
          c.keywords.includes("rush")
            ? "Xung kích: đánh ngay khi gọi; +25 Hương lực."
            : "",
          c.keywords.includes("shield") ? "Vào sân: +1 khiên." : "",
          c.keywords.includes("drain") ? "Đánh trúng: hồi 1 HP chủ tướng." : "",
          passive[c.ability ?? ""] ?? "",
          c.tacticalEffect === "draw"
            ? `Vào sân: rút ${Math.min(2, c.tacticalPower)} lá.`
            : c.tacticalEffect === "heal"
              ? `Vào sân: hồi ${Math.min(5, c.tacticalPower)} HP chủ tướng.`
              : "Đã có đồng hệ: +1 khiên khi vào sân.",
          `Công ${attack} · HP ${health} · Tuyệt kỹ ${Math.max(3, attack * 2)}.`,
        ]
          .filter(Boolean)
          .join(" ")
      : c.kind === "trap"
        ? DUEL_TRAP_TEXT[c.id]
        : c.choices
          ? "Nêm vị — chọn một: " +
            c.choices
              .map(
                (ch) =>
                  `${ch.label}: ${duelSpellText(ch.effect, ch.power, ch.ability)}`,
              )
              .join(" / ")
          : duelSpellText(c.tacticalEffect, c.tacticalPower, c.ability)
  return {
    ...c,
    name,
    legacyName: c.name,
    attack,
    health,
    text,
    duelRuleVersion: 3,
    duelTraits,
    lore:
      c.kind === "unit" ? `${name} · Giao ước ${c.name}. ${c.lore}` : c.lore,
  }
})
export const DUEL_CARD_MAP = Object.fromEntries(
  DUEL_CARDS.map((c) => [c.id, c]),
) as Record<string, TacticalCard>
export const isDuel = (s: TacticalBattleState) => s.cardGame?.rulesVersion === 3
export const combatCard = (s: TacticalBattleState, id: string) =>
  isDuel(s) ? DUEL_CARD_MAP[id] : TACTICAL_CARD_MAP[id]
export const combatValue = (
  s: TacticalBattleState,
  old: number,
  newValue: number,
) => (isDuel(s) ? newValue : old)
export const duelTrait = (
  s: TacticalBattleState,
  u: { cardId?: string },
  trait: NonNullable<TacticalCard["duelTraits"]>[number],
) =>
  isDuel(s) &&
  !!u.cardId &&
  !!DUEL_CARD_MAP[u.cardId]?.duelTraits?.includes(trait)
