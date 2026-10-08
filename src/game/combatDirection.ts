import { CARD_MAP } from "./catalog"
import type { BattleFrame } from "./battle"
import { FLAVOR_SPIRITS, foodSpirit } from "./flavorSpirits"

// Read-only stage direction: reducers alone apply damage, costs and rewards.
export function battleInvocation(frame: BattleFrame) {
  const { event, before } = frame
  if (event.kind !== "play" && event.kind !== "attack") return null
  const cardId =
    event.cardId ??
    before[event.side].board.find((unit) => unit.uid === event.source)?.cardId
  const card = cardId ? CARD_MAP[cardId] : undefined
  if (!card) return null
  const spirit = foodSpirit(card)
  const attack = event.kind === "attack"
  const kind: "attack" | "cast" | "summon" = attack ? "attack" : card.kind === "spell" ? "cast" : "summon"
  return {
    card,
    spirit,
    kind,
    title: attack
      ? "PHÁT ĐỘNG TẤN CÔNG"
      : card.kind === "spell"
        ? "NIỆM BÍ THUẬT"
        : spirit
          ? "ẤN VỊ THỨC TỈNH"
          : "ĐỒNG MINH XUẤT TRẬN",
    quote: attack
      ? spirit
        ? "Vị Linh, tiến lên! Giữ lấy ký ức này!"
        : `${card.name.split(" · ")[0]}, cùng tôi mở đường!`
      : card.kind === "spell"
        ? FLAVOR_SPIRITS[card.school].call
        : spirit
          ? "Ký ức trong món ăn, hãy trở thành sức mạnh!"
          : "Bàn ăn cần bạn. Cùng giữ ngọn lửa!",
    art: spirit?.art ?? card.art,
    detail: spirit ? `${card.name} → ${spirit.name}` : card.name,
    outcome: event.label,
  }
}

export function frameDuration(frame?: BattleFrame) {
  if (!frame) return 90
  // Hold captions for another half-second; projectile and impact speeds stay the same.
  if (frame.event.kind === "combo") return 1600
  if (["assist", "tactic"].includes(frame.event.kind)) return 1550
  if (frame.event.kind === "attack") return 1540
  if (["play", "rule"].includes(frame.event.kind)) return 1500
  return 1190
}
