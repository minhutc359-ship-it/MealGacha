import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"

const seed = readFileSync(resolve("src/infrastructure/catalog/seedCatalog.ts"), "utf8")
const eventCatalog = readFileSync(resolve("src/infrastructure/catalog/eventCatalog.ts"), "utf8")
const registry = readFileSync(resolve("src/domain/tagRegistry.ts"), "utf8")
const events = readFileSync(resolve("src/domain/events.ts"), "utf8")
const knownTags = new Set([...registry.matchAll(/\["([a-z-]+)",\s*"[^"]+",\s*"[^"]+",\s*"(?:cuisine|region|foodType|taste|ingredient|occasion|price|style)"\]/g)].map((match) => match[1]))
const dishes = [...seed.matchAll(/\{\s*id:\s*"([a-z0-9-]+)"([\s\S]*?)\n\s*\},/g)].map(([_, id, body]) => ({ id, body }))
const dishIds = new Set()
const errors = []
for (const match of eventCatalog.matchAll(/\["([a-z0-9-]+)", "([^"]+)", "([^"]+)", "([a-z-]+)", "([A-Z]+)", "([a-z-]+)", "(common|rare|epic|diamond)", \[([^\]]+)\], \[([^\]]+)\]\]/g)) {
  const [, id, name, query, event, country, category, rarity, slots, tags] = match
  if (dishIds.has(id)) errors.push(`ID trùng: ${id}`)
  dishIds.add(id)
  if (!name || !query || !country || !category || !rarity || !slots) errors.push(`Metadata món sự kiện thiếu: ${id}`)
  if (!events.includes(`id: "${event}"`)) errors.push(`Event không tồn tại: ${event}`)
  for (const tag of [...tags.matchAll(/"([a-z-]+)"/g)].map((match) => match[1])) if (!knownTags.has(tag)) errors.push(`Tag ${tag} không tồn tại: ${id}`)
  if (!existsSync(resolve(`public/assets/food/full/${id}.webp`))) errors.push(`Thiếu ảnh: ${id}`)
}
for (const dish of dishes) {
  if (dishIds.has(dish.id)) errors.push(`ID trùng: ${dish.id}`)
  dishIds.add(dish.id)
  if (!/name:\s*".+"/.test(dish.body)) errors.push(`Thiếu tên: ${dish.id}`)
  if (!/description:\s*".+"/.test(dish.body)) errors.push(`Thiếu mô tả: ${dish.id}`)
  if (!/searchQuery:\s*".+"/.test(dish.body)) errors.push(`Thiếu query tìm quán: ${dish.id}`)
  if (!/mealSlots:\s*\[/.test(dish.body)) errors.push(`Thiếu banner bữa ăn: ${dish.id}`)
  if (!/category:\s*".+"/.test(dish.body)) errors.push(`Thiếu category: ${dish.id}`)
  const weight = Number(dish.body.match(/weight:\s*(\d+)/)?.[1])
  if (!Number.isInteger(weight) || weight <= 0) errors.push(`Weight sai: ${dish.id}`)
  const rarity = dish.body.match(/rarity:\s*"([^"]+)"/)?.[1]
  if (rarity && !["common", "rare", "epic", "diamond"].includes(rarity)) errors.push(`Rarity sai: ${dish.id}`)
  const tags = dish.body.match(/tags:\s*\[([^\]]+)\]/)?.[1] || ""
  for (const tag of [...tags.matchAll(/"([a-z-]+)"/g)].map((match) => match[1])) if (!knownTags.has(tag)) errors.push(`Tag ${tag} không tồn tại: ${dish.id}`)
  if (!existsSync(resolve(`public/assets/food/full/${dish.id}.webp`))) errors.push(`Thiếu ảnh: ${dish.id}`)
}
const eventIds = new Set()
for (const [_, id, contents] of events.matchAll(/\{ id: "([a-z-]+)", name: \{[\s\S]*?dishIds: \[([^\]]+)\] \},/g)) {
  if (eventIds.has(id)) errors.push(`Event ID trùng: ${id}`)
  eventIds.add(id)
  const ids = [...contents.matchAll(/"([a-z0-9-]+)"/g)].map((match) => match[1])
  if (ids.length < 6 || ids.length > 8) errors.push(`Event ${id}: phải có 6–8 món`)
  if (new Set(ids).size !== ids.length) errors.push(`Event ${id}: món trùng`)
  for (const dishId of ids) if (!dishIds.has(dishId)) errors.push(`Event ${id}: thiếu ${dishId}`)
  if (!existsSync(resolve(`public/assets/events/${id}/banner.webp`))) errors.push(`Event ${id}: thiếu banner`)
}
if (eventIds.size !== 6) errors.push(`Cần 6 event (hiện có ${eventIds.size})`)
const localEvents = JSON.parse(readFileSync(resolve("src/infrastructure/events/limitedEvents.json"), "utf8"))
const localDishes = JSON.parse(readFileSync(resolve("src/infrastructure/catalog/localDishes.json"), "utf8"))
const localEventIds = new Set()
for (const event of localEvents) {
  if (eventIds.has(event.id) || localEventIds.has(event.id)) errors.push(`Event ID trùng: ${event.id}`)
  localEventIds.add(event.id)
  if (!event.title || !Number.isFinite(Date.parse(event.startsAt)) || !Number.isFinite(Date.parse(event.endsAt)) || Date.parse(event.startsAt) >= Date.parse(event.endsAt)) errors.push(`Event không hợp lệ: ${event.id}`)
}
for (const dish of localDishes) {
  if (dishIds.has(dish.id)) errors.push(`ID trùng: ${dish.id}`)
  dishIds.add(dish.id)
  if (!dish.name || !dish.searchQuery || !dish.mealSlots?.length || !(dish.weight > 0)) errors.push(`Metadata món local thiếu: ${dish.id}`)
  if (dish.type === "limited" && !localEventIds.has(dish.limitedEventId) && !eventIds.has(dish.limitedEventId)) errors.push(`Event không tồn tại: ${dish.id}`)
  for (const tag of dish.tags ?? []) if (!knownTags.has(tag) && tag !== "limited") errors.push(`Tag ${tag} không tồn tại: ${dish.id}`)
  if (dish.imageUrl?.startsWith("/assets/") && !existsSync(resolve(`public${dish.imageUrl}`))) errors.push(`Thiếu ảnh: ${dish.id}`)
}
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1 }
else console.log(`Catalog hợp lệ: ${dishIds.size} món, ${knownTags.size} tag, ${eventIds.size + localEventIds.size} event.`)
