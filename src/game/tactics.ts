import type { Battle } from "./types"

export type TacticId = "flame" | "shelter" | "insight"
export const TACTICS = [
  {
    id: "flame",
    name: "Đảo lửa",
    symbol: "✦",
    color: "#ef9a63",
    text: "Tất cả đồng minh hiện có +1 công.",
    hint: "Tốt khi đã có quân sẵn sàng đánh.",
    quote: "Tôi không lặp lại món cũ. Tôi tự chọn ngọn lửa cho bàn này.",
  },
  {
    id: "shelter",
    name: "Giữ bếp",
    symbol: "◇",
    color: "#8fd8bb",
    text: "Hồi 3 ý chí; tất cả đồng minh hiện có +1 chắn.",
    hint: "Giữ quân và ý chí cho lượt sau.",
    quote: "Có người đang chờ bên bếp. Tôi sẽ giữ chỗ cho họ.",
  },
  {
    id: "insight",
    name: "Nếm ký ức",
    symbol: "≋",
    color: "#97c8ef",
    text: "Rút tối đa 2 lá, vừa chỗ trống trên tay.",
    hint: "Chỉ rút bài còn trong bộ; không gây kiệt sức.",
    quote: "Một công thức không đủ kể hết một người. Tôi muốn đọc tiếp.",
  },
] as const
export function tacticError(b: Battle, id: TacticId): string | null {
  if (b.tactic?.status !== "pending" || b.result || b.opening)
    return "Chưa đến lúc ứng biến."
  if (!TACTICS.some((t) => t.id === id)) return "Lựa chọn không hợp lệ."
  if (id === "flame" && !b.player.board.length)
    return "Cần ít nhất một đồng minh."
  if (id === "insight" && (!b.player.deck.length || b.player.hand.length >= 8))
    return "Cần bài trong bộ và chỗ trống trên tay."
  return null
}
// This is visible board strength, not a prediction of hidden enemy cards.
export function visibleThreat(b: Battle) {
  return {
    attack: b.enemy.board.reduce((sum, unit) => sum + unit.attack, 0),
    guards: b.player.board.filter((unit) => unit.keywords.includes("guard"))
      .length,
    nextMana: Math.min(7, b.enemy.maxMana + 1),
  }
}
