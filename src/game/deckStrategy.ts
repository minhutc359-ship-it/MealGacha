import { CARDS, CARD_MAP, DECK_SIZE } from "./catalog"
import { recipeCoverage, recipeFinishers, RECIPES } from "./recipes"
import type { GameCard, RecipeId } from "./types"
export type DeckStyle = "balanced" | "rush" | "guard" | "sustain" | "cycle" | "rebirth" | "spellcraft"
export const DECK_STYLES: {
  id: DeckStyle
  name: string
  text: string
  recipe: RecipeId
}[] = [
  {
    id: "balanced",
    name: "Bàn đủ vị",
    text: "Năng lượng thấp, đồng minh và phép cân bằng.",
    recipe: "home",
  },
  {
    id: "rush",
    name: "Nhịp phố nhanh",
    text: "Xung phong, phép sát thương và combo Quà phố.",
    recipe: "street",
  },
  {
    id: "guard",
    name: "Bếp Tết vững vàng",
    text: "Hộ vệ, lá chắn, cường hóa và combo Bếp Tết.",
    recipe: "tet",
  },
  {
    id: "sustain",
    name: "Bữa cơm chữa lành",
    text: "Hồi phục và giữ đồng minh qua nhiều lượt.",
    recipe: "home",
  },
  {
    id: "cycle",
    name: "Dòng vị luân chuyển",
    text: "Rút bài, phép giá thấp và chuỗi liên tiếp.",
    recipe: "street",
  },
  { id: "rebirth", name: "Ký ức trở lại", text: "Hy sinh, hiệu ứng khi bị hạ và tái triệu hồi để giữ tài nguyên.", recipe: "coast" },
  { id: "spellcraft", name: "Dệt phép dưới trăng", text: "Giữ quân tăng công/dệt chắn sau phép, nối phép rẻ với Sao băng.", recipe: "moon" },
]
export function cardRole(card: GameCard): string {
  if (["revive", "rebloom"].includes(card.ability ?? "")) return "Tái triệu hồi"
  if (["pantry", "farewell", "offering"].includes(card.ability ?? "")) return "Ký ức khi bị hạ"
  if (["spellfire", "weaver", "starlight"].includes(card.ability ?? "")) return "Chuỗi phép"
  if (["snare", "dream"].includes(card.ability ?? "")) return "Kiểm soát"
  if (card.ability === "bloom") return "Hồi phục → tăng công"
  if (card.keywords.includes("rush")) return "Áp lực"
  if (card.keywords.includes("guard")) return "Giữ bàn"
  if (card.effect === "draw") return "Rút bài"
  if (card.effect === "heal" || card.keywords.includes("drain"))
    return "Hồi phục"
  if (card.effect === "damage" || card.effect === "sweep") return "Dọn sân"
  if (card.effect === "buff" || card.effect === "ward") return "Hỗ trợ"
  return card.kind === "unit" ? "Đồng minh" : "Bí thuật"
}
export function suggestDeck(
  owned: Record<string, number>,
  style: DeckStyle,
): string[] {
  const plan = DECK_STYLES.find((s) => s.id === style)!,
    recipe = RECIPES.find((r) => r.id === plan.recipe)!
  const finishers = new Set(recipeFinishers(recipe).map((c) => c.id))
  const score = (c: GameCard) =>
    10 -
    c.cost +
    (recipe.foodIds.includes(c.id) ? 6 : 0) +
    (finishers.has(c.id) ? 6 : 0) +
    (style === "rush" && (c.keywords.includes("rush") || c.effect === "damage")
      ? 7
      : 0) +
    (style === "guard" &&
    (c.keywords.includes("guard") || c.effect === "ward" || c.effect === "buff")
      ? 7
      : 0) +
    (style === "sustain" &&
    (c.effect === "heal" || c.keywords.includes("drain"))
      ? 7
      : 0) +
    (style === "cycle" && c.effect === "draw" ? 8 : 0) +
    (style === "rebirth" && ["pantry", "farewell", "offering", "revive", "rebloom"].includes(c.ability ?? "") ? 12 : 0) +
    (style === "spellcraft" && (["spellfire", "weaver", "starlight", "veil"].includes(c.ability ?? "") || c.kind === "spell" && c.cost <= 2) ? 12 : 0)
  const available = CARDS.flatMap((c) =>
    Array.from({ length: Math.min(2, Math.max(0, owned[c.id] ?? 0)) }, () => c),
  ).sort(
    (a, b) => score(b) - score(a) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  )
  const selected: GameCard[] = []
  const take = (c: GameCard) => {
    if (
      selected.filter((x) => x.id === c.id).length <
      Math.min(2, owned[c.id] ?? 0)
    )
      selected.push(c)
  }
  // Reserve a pair for the chosen recipe before filling role quotas.
  available
    .filter((c) => recipe.foodIds.includes(c.id))
    .slice(0, 2)
    .forEach(take)
  available
    .filter((c) => finishers.has(c.id))
    .slice(0, 2)
    .forEach(take)
  for (const c of available.filter((c) => c.kind === "unit"))
    if (selected.filter((x) => x.kind === "unit").length < 10) take(c)
  for (const c of available.filter((c) => c.kind === "spell"))
    if (selected.filter((x) => x.kind === "spell").length < 8) take(c)
  for (const c of available)
    if (
      selected.length < DECK_SIZE &&
      selected.filter((x) => x.id === c.id).length <
        Math.min(2, owned[c.id] ?? 0)
    )
      selected.push(c)
  return selected.slice(0, DECK_SIZE).map((c) => c.id)
}
export function analyzeDeck(ids: string[]) {
  const cards = ids.map((id) => CARD_MAP[id]).filter(Boolean),
    units = cards.filter((c) => c.kind === "unit").length
  const cheap = cards.filter((c) => c.cost <= 2).length,
    guards = cards.filter((c) => c.keywords.includes("guard")).length
  const tips: string[] = []
  if (cheap < 5) tips.push("Thêm khoảng 5 lá giá 1–2 để ít bỏ trống lượt đầu.")
  if (units < 8) tips.push("Ít đồng minh: khó giữ sân và kích hoạt công thức.")
  if (units > 13)
    tips.push("Nhiều đồng minh: sân chỉ có 3 chỗ; thêm phép để tránh kẹt tay.")
  if (!guards) tips.push("Chưa có Hộ vệ; cân nhắc một lá giữ bếp trước boss.")
  const abilities = new Set(cards.map(c => c.ability))
  if ((abilities.has("revive") || abilities.has("rebloom")) && !cards.some(c => c.kind === "unit" && c.cost <= 4)) tips.push("Tái triệu hồi cần đồng minh giá tối đa 4; thêm quân thấp giá để có ký ức trở lại.")
  if (abilities.has("offering") && units < 10) tips.push("Hy sinh cần ít nhất 2 quân; thêm đồng minh hoặc hiệu ứng khi bị hạ.")
  if (abilities.has("bloom") && !cards.some(c => c.effect === "heal" || c.keywords.includes("drain"))) tips.push("Quân nở công cần hồi máu chủ tướng thật sự; ghép phép hồi hoặc Hút vị.")
  if ((abilities.has("spellfire") || abilities.has("weaver")) && cards.filter(c => c.kind === "spell" && c.cost <= 2).length < 4) tips.push("Động cơ chuỗi phép cần khoảng 4 phép giá 1–2 để kích nội tại đều hơn.")
  const combos = recipeCoverage(ids)
  if (!combos.some((c) => c.anchors.length && c.finishers.length))
    tips.push("Chưa có chuỗi món + phép hoàn chỉnh để kích hoạt combo.")
  return {
    units,
    spells: cards.length - units,
    cheap,
    guards,
    average: cards.length
      ? cards.reduce((sum, c) => sum + c.cost, 0) / cards.length
      : 0,
    tips,
    combos,
  }
}
export function sampleHand(ids: string[], rng = Math.random) {
  const cards = [...ids]
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }
  return cards.slice(0, 4)
}
