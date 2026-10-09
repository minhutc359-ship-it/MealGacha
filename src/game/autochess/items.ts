import { RELICS } from "./catalog"
import type { AutoRun, Piece } from "./types"

export const ITEM_COMPONENTS = [
  { id: "spark", name: "Than Hồng", text: "+6 công. Ghép với một mảnh khác để tạo di vật.", color: "#ff8c78", icon: "♨" },
  { id: "dew", name: "Giọt Sương", text: "+10 mana đầu trận. Ghép với một mảnh khác để tạo di vật.", color: "#7dcff7", icon: "≈" },
  { id: "fiber", name: "Sợi Tre", text: "+60 máu. Ghép với một mảnh khác để tạo di vật.", color: "#a9df91", icon: "❧" },
] as const
const RELIC_ICONS: Record<string, string> = { lantern: "☀", ladle: "◡", herbs: "❧", bell: "♬", basket: "▥", book: "▤" }
export const ITEMS = [...RELICS.map(r => ({ ...r, icon: RELIC_ICONS[r.id] })), ...ITEM_COMPONENTS]
export const ITEM_MAP = Object.fromEntries(ITEMS.map(item => [item.id, item]))
export const isComponent = (id: string) => ITEM_COMPONENTS.some(item => item.id === id)
export const ITEM_RECIPES = [
  { parts: ["spark", "spark"], result: "bell" },
  { parts: ["dew", "dew"], result: "ladle" },
  { parts: ["fiber", "fiber"], result: "basket" },
  { parts: ["spark", "dew"], result: "book" },
  { parts: ["spark", "fiber"], result: "lantern" },
  { parts: ["dew", "fiber"], result: "herbs" },
] as const
export function recipe(first: string, second: string): string | null {
  return ITEM_RECIPES.find(({ parts }) =>
    parts[0] === first && parts[1] === second || parts[0] === second && parts[1] === first)?.result ?? null
}
export type ItemTarget = { kind: "equip"; uid: string } | { kind: "craft"; index: number }
export interface ItemPreview { valid: boolean; name: string; text: string; color: string; result: string | null; combine: string | null }
function refused(text: string): ItemPreview {
  return { valid: false, name: "Chưa thể thả", text, color: "#f29a91", result: null, combine: null }
}
export function equipPreview(piece: Piece | undefined, item: string): ItemPreview {
  const def = ITEM_MAP[item]
  if (!piece || !Object.prototype.hasOwnProperty.call(ITEM_MAP, item)) return refused("Không tìm thấy quân hoặc trang bị.")
  const part = isComponent(item) ? piece.items.find(isComponent) : undefined
  const result = part ? recipe(item, part) : item
  if (!result) return refused("Hai mảnh này không có công thức.")
  if (piece.items.includes(result)) return refused("Quân đã giữ di vật này.")
  if (!part && piece.items.length >= 2) return refused("Mỗi quân giữ tối đa hai trang bị.")
  const formed = ITEM_MAP[result]
  return { valid: true, name: formed.name, text: part ? `Ghép ${def.name} + ${ITEM_MAP[part].name} · ${formed.text}` : formed.text,
    color: formed.color, result, combine: part ?? null }
}
export function itemPreview(run: AutoRun, index: number, target: ItemTarget): ItemPreview {
  if (!Number.isInteger(index) || index < 0 || !run.inventory[index]) return refused("Mảnh này không còn trong kho.")
  const item = run.inventory[index]
  if (target.kind === "equip") return equipPreview(run.roster.find(p => p.uid === target.uid), item)
  if (!Number.isInteger(target.index) || target.index < 0 || target.index === index) return refused("Thả lên một mảnh khác trong kho.")
  const other = run.inventory[target.index], result = other ? recipe(item, other) : null
  if (!result) return refused("Chỉ hai mảnh nguyên liệu mới ghép được; di vật hoàn chỉnh không ghép tiếp.")
  const def = ITEM_MAP[result]
  return { valid: true, name: def.name, text: def.text, color: def.color, result, combine: other }
}
export function craft(run: AutoRun, index: number, target: number): string | null {
  const preview = itemPreview(run, index, { kind: "craft", index: target })
  if (!preview.valid) return preview.text
  for (const i of [index, target].sort((a, b) => b - a)) run.inventory.splice(i, 1)
  run.inventory.push(preview.result!)
  run.log = [`Ghép thành ${preview.name}.`, ...run.log].slice(0, 20)
  return null
}
// A merge preserves all equipment value, combines shards, and returns overflow.
export function mergedEquipment(items: string[]): { kept: string[]; overflow: string[] } {
  const pending = [...items]
  for (;;) {
    const parts = pending.map((id, index) => ({ id, index })).filter(p => isComponent(p.id))
    if (parts.length < 2) break
    const [a, b] = parts
    const result = recipe(a.id, b.id)!
    pending.splice(b.index, 1); pending.splice(a.index, 1); pending.push(result)
  }
  const kept: string[] = [], overflow: string[] = []
  for (const id of pending) (kept.length < 2 && !kept.includes(id) ? kept : overflow).push(id)
  return { kept, overflow }
}
