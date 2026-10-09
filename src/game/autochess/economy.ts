import { AUTO_UNITS, UNIT_MAP, SHOP_ODDS, RELICS, AUGMENTS } from "./catalog"
import { RULES_VERSION, type AutoMode, type AutoRun, type Piece } from "./types"
export const copies = (star: number) => 3 ** (star - 1)
export const poolSize = (cost: number) => [0, 18, 16, 12, 10, 9][cost]
export const capacity = (xp: number) =>
  3 + [8, 20, 38, 62].filter((n) => xp >= n).length
export const boardPieces = (run: AutoRun) =>
  run.roster.filter((p) => p.cell !== null)
export function unitRole(id: string) {
  const unit = UNIT_MAP[id]
  if (["heal", "leaves", "feast", "ginger"].includes(unit.skill)) return "Hồi phục"
  if (["shield", "shell", "lantern"].includes(unit.skill) || (unit.range === 1 && unit.armor >= 10)) return "Đỡ đòn"
  return unit.range > 1 ? "Tầm xa" : "Cận chiến"
}
export function autoArrange(run: AutoRun): string | null {
  if (!run.roster.length) return "Mua ít nhất một Vị Linh trước khi xếp đội."
  const rank = (p: Piece) => p.star * 1000 + UNIT_MAP[p.id].cost * 10 + p.items.length * 3
  const team = [...run.roster].sort((a, b) => rank(b) - rank(a) || a.uid.localeCompare(b.uid)).slice(0, capacity(run.xp))
  const front = [20, 21, 19, 22, 18, 23, 26, 27, 25, 28, 24, 29, 32, 33, 31, 34, 30, 35]
  const back = [32, 33, 31, 34, 30, 35, 26, 27, 25, 28, 24, 29, 20, 21, 19, 22, 18, 23]
  const occupied = new Set<number>()
  for (const p of run.roster) p.cell = null
  for (const p of team) {
    const order = UNIT_MAP[p.id].range === 1 && unitRole(p.id) !== "Hồi phục" ? front : back
    p.cell = order.find(cell => !occupied.has(cell))!
    occupied.add(p.cell)
  }
  return null
}
export function random(run: AutoRun) {
  run.rng = (Math.imul(run.rng, 1664525) + 1013904223) >>> 0
  return run.rng / 4294967296
}
export function seedForDay(day: string) {
  return [...day].reduce(
    (h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0,
    2166136261,
  )
}
export function refreshShop(run: AutoRun) {
  for (const id of run.shop) if (id) run.pool[id]++
  run.shop = []
  const odds = SHOP_ODDS[capacity(run.xp) - 3]
  for (let i = 0; i < 5; i++) {
    const roll = random(run) * 100
    let threshold = 0,
      tier = 1
    for (let k = 0; k < 5; k++) {
      threshold += odds[k]
      if (roll < threshold) {
        tier = k + 1
        break
      }
    }
    let eligible = AUTO_UNITS.filter(
      (u) => u.cost === tier && run.pool[u.id] > 0,
    )
    if (!eligible.length)
      eligible = AUTO_UNITS.filter((u) => run.pool[u.id] > 0)
    const weight = eligible.reduce((sum, u) => sum + run.pool[u.id], 0)
    let draw = random(run) * weight
    const picked = eligible.find((u) => {
      draw -= run.pool[u.id]
      return draw < 0
    })
    run.shop.push(picked?.id ?? null)
    if (picked) run.pool[picked.id]--
  }
}
export function createAutoRun(
  mode: AutoMode,
  seed: number,
  day: string,
  id: string,
): AutoRun {
  const run: AutoRun = {
    id,
    mode,
    rulesVersion: RULES_VERSION,
    seed: seed >>> 0,
    rng: seed >>> 0,
    day,
    phase: "prepare",
    wave: 1,
    rounds: 0,
    bestWave: 0,
    health: 100,
    gold: 10,
    xp: 0,
    score: 0,
    activeTicks: 0,
    roster: [],
    shop: [],
    pool: Object.fromEntries(AUTO_UNITS.map((u) => [u.id, poolSize(u.cost)])),
    locked: false,
    inventory: [],
    augments: [],
    reward: null,
    pendingRewards: [],
    combat: null,
    lastResult: null,
    paidWaves: [],
    seenScenes: [],
    scene: mode === "campaign" ? "intro-1" : null,
    sceneLine: 0,
    paused: false,
    freeReroll: false,
    relicReroll: false,
    nextUid: 1,
    log: ["An gọi ba Vị Linh đầu tiên. Vàng chỉ dùng trong phiên chợ này."],
    finished: false,
  }
  for (const [id, cell] of [
    ["com-tam", 20],
    ["pho-bo", 31],
    ["banh-cuon", 34],
  ] as const) {
    run.roster.push({ uid: `p${run.nextUid++}`, id, star: 1, cell, items: [] })
    run.pool[id]--
  }
  refreshShop(run)
  return run
}
function merge(run: AutoRun) {
  let changed = true
  while (changed) {
    changed = false
    for (const def of AUTO_UNITS)
      for (const star of [1, 2] as const) {
        const matching = run.roster
          .filter((p) => p.id === def.id && p.star === star)
          .sort(
            (a, b) =>
              Number(a.cell === null) - Number(b.cell === null) ||
              a.uid.localeCompare(b.uid),
          )
        if (matching.length < 3) continue
        const trio = matching.slice(0, 3),
          keep = trio[0],
          items = trio.flatMap((p) => p.items)
        keep.star = star === 1 ? 2 : 3
        keep.items = [...new Set(items)].slice(0, 2)
        for (const item of keep.items) items.splice(items.indexOf(item), 1)
        run.inventory.push(...items)
        run.roster = run.roster.filter(
          (p) => !trio.slice(1).some((t) => t.uid === p.uid),
        )
        run.log = [`${def.name} lên ${keep.star} sao!`, ...run.log].slice(0, 20)
        changed = true
      }
  }
}
export function buy(run: AutoRun, index: number): string | null {
  const id = run.shop[index],
    def = id ? UNIT_MAP[id] : null
  if (!def) return "Ô cửa hàng đã trống."
  if (run.gold < def.cost) return "Chưa đủ vàng trong lượt chơi."
  const spare = run.roster.filter((p) => p.cell === null).length
  const willMerge =
    run.roster.filter((p) => p.id === id && p.star === 1).length >= 2
  if (spare >= 6 && !willMerge)
    return "Ghế dự bị đầy. Bán hoặc ghép quân trước."
  run.gold -= def.cost
  run.shop[index] = null
  run.roster.push({
    uid: `p${run.nextUid++}`,
    id: def.id,
    star: 1,
    cell: null,
    items: [],
  })
  merge(run)
  return null
}
export function move(
  run: AutoRun,
  uid: string,
  cell: number | null,
  swapUid?: string,
): string | null {
  const piece = run.roster.find((p) => p.uid === uid)
  if (
    !piece ||
    (cell !== null && (!Number.isInteger(cell) || cell < 18 || cell > 35))
  )
    return "Chỉ xếp quân trong ba hàng phía bạn."
  const other =
    cell !== null
      ? run.roster.find((p) => p.cell === cell && p.uid !== uid)
      : run.roster.find((p) => p.uid === swapUid && p.cell === null)
  if (
    piece.cell === null &&
    cell !== null &&
    !other &&
    boardPieces(run).length >= capacity(run.xp)
  )
    return "Đội hình đã đủ quân. Đổi chỗ hoặc nâng cấp bàn."
  if (
    piece.cell !== null &&
    cell === null &&
    !other &&
    run.roster.filter((p) => p.cell === null).length >= 6
  )
    return "Ghế dự bị đầy."
  if (other) other.cell = piece.cell
  piece.cell = cell
  return null
}
export function sell(run: AutoRun, uid: string) {
  const piece = run.roster.find((p) => p.uid === uid)
  if (!piece) return
  run.gold += UNIT_MAP[piece.id].cost * copies(piece.star)
  run.pool[piece.id] += copies(piece.star)
  run.inventory.push(...piece.items)
  run.roster = run.roster.filter((p) => p.uid !== uid)
}
export function equip(run: AutoRun, uid: string, item: string): string | null {
  const p = run.roster.find((p) => p.uid === uid),
    index = run.inventory.indexOf(item)
  if (!p || index < 0 || p.items.length >= 2 || p.items.includes(item))
    return "Mỗi quân giữ tối đa hai di vật khác nhau."
  p.items.push(item)
  run.inventory.splice(index, 1)
  return null
}
export function choices(run: AutoRun, kind: "relic" | "augment") {
  const options = (kind === "relic" ? RELICS : AUGMENTS)
    .filter((o) => kind === "relic" || !run.augments.includes(o.id))
    .map((o) => o.id)
  const picked: string[] = []
  while (options.length && picked.length < 3)
    picked.push(options.splice(Math.floor(random(run) * options.length), 1)[0])
  return picked
}
export function traitCounts(pieces: Piece[]) {
  const counts: Record<string, number> = {}
  for (const id of new Set(pieces.map((p) => p.id))) {
    const d = UNIT_MAP[id]
    for (const trait of [d.school, d.profession])
      counts[trait] = (counts[trait] ?? 0) + 1
  }
  return counts
}
