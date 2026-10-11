import { CARD_MAP, SCHOOLS } from "./catalog"
import type { CharacterId } from "./characters"
import type { School } from "./types"

export type AdventureAreaId =
  | "lantern-quarter"
  | "rain-harbor"
  | "herb-garden"
  | "tide-pier"
  | "moon-table"
export type AdventureDirection = "up" | "down" | "left" | "right"
export type AdventureBattleMove = "strike" | "skill" | "guard" | "befriend" | "flee" | "switch"

export interface AdventureSpirit {
  uid: string
  cardId: string
  level: number
  xp: number
  hp: number
}
export interface AdventureEncounter {
  id: string
  kind: "wild" | "keeper"
  cardId: string
  level: number
  hp: number
  maxHp: number
  activeUid: string
  turn: number
  playerGuard: number
  enemyGuard: number
  enemyWeaken: number
  attempts: number
  log: string[]
}
export interface AdventureSave {
  version: 1
  started: boolean
  areaId: AdventureAreaId
  x: number
  y: number
  facing: AdventureDirection
  steps: number
  aromaSeals: number
  team: AdventureSpirit[]
  reserve: AdventureSpirit[]
  discovered: string[]
  badges: string[]
  completedQuests: string[]
  claimedFinds: string[]
  encounter: AdventureEncounter | null
  message: string | null
  completed: boolean
}

interface AdventureExit {
  x: number
  y: number
  to: AdventureAreaId
  toX: number
  toY: number
  requires?: string
}
interface AdventureFind {
  id: string
  x: number
  y: number
  seals: number
  text: string
}
export interface AdventureArea {
  id: AdventureAreaId
  chapter: number
  name: string
  region: string
  summary: string
  objective: string
  art: string
  music: "v4-market-warm" | "v4-harbor-warm" | "story-warm" | "story-mystery"
  grid: string[]
  spawn: { x: number; y: number }
  encounters: string[]
  npc: { id: CharacterId; x: number; y: number; before: string; after: string }
  keeper: { cardId: string; level: number; x: number; y: number; title: string; badge: string; badgeName: string }
  exits: AdventureExit[]
  finds: AdventureFind[]
}

export const ADVENTURE_STARTERS = ["pho-bo", "com-tam", "goi-cuon-tom-thit"] as const

export const ADVENTURE_AREAS: AdventureArea[] = [
  {
    id: "lantern-quarter", chapter: 1, name: "Phố Đèn Lồng", region: "Khu chợ thức giấc",
    summary: "Bách nhờ bạn đánh thức những Vị Linh đang lạc giữa mùi khói sớm.",
    objective: "Gặp Bách, rèn đội hình rồi thách Người Giữ Đèn.", art: "/assets/tcg/story/lantern.webp", music: "v4-market-warm",
    grid: ["############", "#....gg...b#", "#.##.gg.##.#", "#.g......g.#", "#.g.####.g.#", "#...i..g...#", "#.n....g...#", "#h........e#", "############"],
    spawn: { x: 2, y: 7 }, encounters: ["banh-mi", "xoi", "banh-cuon", "chao-suon"],
    npc: { id: "bach", x: 2, y: 6, before: "Đừng vội đi xa. Hãy lắng nghe nhịp chân của Vị Linh và giữ Hương Ấn cho lúc chúng yếu đi.", after: "Ấn Đèn đã sáng. Con đường ra bến mưa đang mở; cứ để món ăn dẫn lối." },
    keeper: { cardId: "bun-cha", level: 7, x: 10, y: 1, title: "Người Giữ Đèn", badge: "lantern", badgeName: "Ấn Đèn" },
    exits: [{ x: 10, y: 7, to: "rain-harbor", toX: 2, toY: 7, requires: "lantern" }],
    finds: [{ id: "lantern-basket", x: 4, y: 5, seals: 3, text: "Một giỏ lá thơm còn ấm · nhận 3 Hương Ấn." }],
  },
  {
    id: "rain-harbor", chapter: 2, name: "Bến Sau Mưa", region: "Những mái chèo ký ức",
    summary: "Nước triều mang theo tên món đã mất. Hải chờ một người đủ kiên nhẫn để nghe.",
    objective: "Tìm Hải và vượt thử thách của Người Canh Con Nước.", art: "/assets/tcg/story/harbor.webp", music: "v4-harbor-warm",
    grid: ["############", "#e..gg.....#", "#.##gg.##b.#", "#..g....g..#", "#..g.##.g..#", "#....i.....#", "#..n...gg..#", "#e....h....#", "############"],
    spawn: { x: 2, y: 7 }, encounters: ["pho-ga", "bun-rieu", "bun-ca", "mi-van-than"],
    npc: { id: "hai", x: 3, y: 6, before: "Biển không quên; chỉ có người trên bờ ngừng gọi tên. Hãy để đội của bạn nghe con nước trước khi ra cầu cảng.", after: "Bạn đã nghe được khoảng lặng giữa hai con sóng. Mang Ấn Mưa về phía vườn xanh." },
    keeper: { cardId: "sushi", level: 10, x: 9, y: 2, title: "Người Canh Con Nước", badge: "harbor", badgeName: "Ấn Mưa" },
    exits: [
      { x: 1, y: 7, to: "lantern-quarter", toX: 9, toY: 7 },
      { x: 1, y: 1, to: "herb-garden", toX: 9, toY: 7, requires: "harbor" },
    ],
    finds: [{ id: "harbor-crate", x: 5, y: 5, seals: 3, text: "Trong thùng gỗ là ba Hương Ấn còn khô." }],
  },
  {
    id: "herb-garden", chapter: 3, name: "Vườn Lá Thơm", region: "Lối nhỏ dưới tán xanh",
    summary: "Sương Nhạt làm cây quên mùa. Mộc cần bạn khôi phục vòng tuần hoàn của khu vườn.",
    objective: "Đọc lời nhắn của Mộc và đánh thức Linh Gốc Cổ Thụ.", art: "/assets/tcg/story/garden.webp", music: "story-warm",
    grid: ["############", "#....g....b#", "#.gg.g.gg..#", "#....#.....#", "#gg..#..gg.#", "#..i....g..#", "#.n..gg....#", "#e.h.....e.#", "############"],
    spawn: { x: 9, y: 7 }, encounters: ["goi-cuon-tom-thit", "banh-cuon", "nom-sua-xoai", "dua-hanh"],
    npc: { id: "moc", x: 2, y: 6, before: "Mỗi chiếc lá nhớ một bữa cơm. Đi chậm thôi, bạn sẽ thấy khu vườn tự chỉ đường.", after: "Rễ cây đã nhớ lại mùa mưa. Ấn Lá sẽ dẫn bạn tới cầu triều." },
    keeper: { cardId: "goi-cuon-tom-thit", level: 13, x: 10, y: 1, title: "Linh Gốc Cổ Thụ", badge: "garden", badgeName: "Ấn Lá" },
    exits: [{ x: 9, y: 7, to: "rain-harbor", toX: 2, toY: 1 }, { x: 1, y: 7, to: "tide-pier", toX: 9, toY: 7, requires: "garden" }],
    finds: [{ id: "garden-satchel", x: 3, y: 5, seals: 4, text: "Mộc để lại một túi hạt thơm · nhận 4 Hương Ấn." }],
  },
  {
    id: "tide-pier", chapter: 4, name: "Cầu Triều Lửa", region: "Gió mặn và bếp đỏ",
    summary: "Nhiên giữ một ngọn lửa không tắt giữa gió biển, nhưng lối lên bàn trăng đã bị khóa.",
    objective: "Hợp sức với Nhiên, chiến thắng Chủ Bếp Triều Lửa.", art: "/assets/tcg/story/tide.webp", music: "story-mystery",
    grid: ["############", "#e..g.....b#", "#.##g.###..#", "#..gg......#", "#.....gg...#", "#..i.###...#", "#....n..g..#", "#e.......h.#", "############"],
    spawn: { x: 9, y: 7 }, encounters: ["bun-bo-hue", "banh-xeo", "com-tam", "mi-cay"],
    npc: { id: "nhien", x: 5, y: 6, before: "Lửa mạnh không phải lửa cháy lớn nhất. Đó là ngọn lửa biết chờ đúng món, đúng người.", after: "Giữ lấy Ấn Than. Liên đang chờ trên Bàn Trăng, nơi Sương Nhạt dày nhất." },
    keeper: { cardId: "bun-bo-hue", level: 16, x: 10, y: 1, title: "Chủ Bếp Triều Lửa", badge: "tide", badgeName: "Ấn Than" },
    exits: [{ x: 1, y: 7, to: "herb-garden", toX: 8, toY: 7 }, { x: 1, y: 1, to: "moon-table", toX: 9, toY: 7, requires: "tide" }],
    finds: [{ id: "tide-chest", x: 3, y: 5, seals: 4, text: "Một hộp gia vị chống ẩm · nhận 4 Hương Ấn." }],
  },
  {
    id: "moon-table", chapter: 5, name: "Bàn Trăng", region: "Bữa cơm trên tầng mây",
    summary: "Liên đã dọn một chỗ trống. Chỉ còn Tiếng Vọng Nuốt Tên đứng giữa bạn và bữa cơm ngày mai.",
    objective: "Chuẩn bị đội hình cuối và hoàn thành Giao Ước Năm Vị.", art: "/assets/tcg/story/moon.webp", music: "story-mystery",
    grid: ["############", "#....gg...b#", "#.##.gg.##.#", "#..g......g#", "#..g.##...g#", "#....i.....#", "#..n..gg...#", "#e.......h.#", "############"],
    spawn: { x: 9, y: 7 }, encounters: ["banh-tet", "che-buoi", "croissant", "xiaolongbao"],
    npc: { id: "lien", x: 3, y: 6, before: "Một chỗ trống không phải là thiếu vắng. Đó là lời mời. Hãy đưa cả đội tới bàn ăn bằng tên thật của từng món.", after: "Bàn đã đủ người. Từ đây, mọi con đường đều có thể trở thành một công thức mới." },
    keeper: { cardId: "banh-tet", level: 20, x: 10, y: 1, title: "Tiếng Vọng Nuốt Tên", badge: "moon", badgeName: "Giao Ước Năm Vị" },
    exits: [{ x: 1, y: 7, to: "tide-pier", toX: 2, toY: 1 }],
    finds: [{ id: "moon-gift", x: 5, y: 5, seals: 5, text: "Một gói Hương Ấn đặt cạnh chỗ trống · nhận 5." }],
  },
]

export const ADVENTURE_AREA_MAP = Object.fromEntries(ADVENTURE_AREAS.map((area) => [area.id, area])) as Record<AdventureAreaId, AdventureArea>
const DELTAS: Record<AdventureDirection, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }
const advantage: Partial<Record<School, School>> = { ember: "grove", grove: "tide", tide: "ember", hearth: "sugar", sugar: "hearth" }

export type AdventureAction =
  | { type: "start"; cardId: string }
  | { type: "move"; direction: AdventureDirection }
  | { type: "interact" }
  | { type: "dismiss" }
  | { type: "battle"; move: AdventureBattleMove; uid?: string }
  | { type: "lead"; uid: string }
  | { type: "deposit"; uid: string }
  | { type: "withdraw"; uid: string }
  | { type: "heal" }

export interface AdventureResult { save: AdventureSave; error?: string; event?: "move" | "battle" | "win" | "capture" | "heal" }

export function newAdventure(): AdventureSave {
  const area = ADVENTURE_AREAS[0]
  return { version: 1, started: false, areaId: area.id, ...area.spawn, facing: "up", steps: 0, aromaSeals: 6, team: [], reserve: [], discovered: [], badges: [], completedQuests: [], claimedFinds: [], encounter: null, message: null, completed: false }
}

export function spiritMaxHp(cardId: string, level: number) {
  return 12 + (CARD_MAP[cardId]?.health ?? 3) * 2 + level * 2
}
export function spiritAttack(cardId: string, level: number) {
  return 2 + (CARD_MAP[cardId]?.attack ?? 2) + Math.floor(level / 2)
}
export function xpForNext(level: number) { return 10 + level * 4 }
export function schoolMultiplier(attacker: School, defender: School) {
  return advantage[attacker] === defender ? 1.35 : advantage[defender] === attacker ? 0.78 : 1
}
export function captureChance(encounter: AdventureEncounter) {
  if (encounter.kind === "keeper") return 0
  return Math.min(.94, .3 + (1 - encounter.hp / encounter.maxHp) * .68)
}

function hash(value: string) { return [...value].reduce((n, char) => (Math.imul(n, 31) + char.charCodeAt(0)) >>> 0, 2166136261) }
function clone(save: AdventureSave): AdventureSave { return structuredClone(save) }
function tile(area: AdventureArea, x: number, y: number) { return area.grid[y]?.[x] ?? "#" }
function currentMember(save: AdventureSave) { return save.team.find((member) => member.uid === save.encounter?.activeUid) }
function aliveMember(save: AdventureSave) { return save.team.find((member) => member.hp > 0) }
function appendLog(encounter: AdventureEncounter, text: string) { encounter.log = [...encounter.log.slice(-5), text] }
function addUnique(values: string[], value: string) { if (!values.includes(value)) values.push(value) }
function makeMember(cardId: string, level: number, uid: string, hpRatio = 1): AdventureSpirit {
  return { uid, cardId, level, xp: 0, hp: Math.max(1, Math.round(spiritMaxHp(cardId, level) * hpRatio)) }
}
function healTeam(save: AdventureSave) {
  for (const member of save.team) member.hp = spiritMaxHp(member.cardId, member.level)
}
function gainXp(member: AdventureSpirit, amount: number) {
  member.xp += amount
  while (member.level < 30 && member.xp >= xpForNext(member.level)) {
    const oldMax = spiritMaxHp(member.cardId, member.level)
    member.xp -= xpForNext(member.level)
    member.level++
    member.hp += spiritMaxHp(member.cardId, member.level) - oldMax
  }
}
function beginEncounter(save: AdventureSave, cardId: string, level: number, kind: "wild" | "keeper") {
  const lead = aliveMember(save)
  if (!lead || !CARD_MAP[cardId]) return
  const maxHp = spiritMaxHp(cardId, level)
  save.encounter = { id: `${save.areaId}-${save.steps}-${cardId}-${kind}`, kind, cardId, level, hp: maxHp, maxHp, activeUid: lead.uid, turn: 1, playerGuard: 0, enemyGuard: 0, enemyWeaken: 0, attempts: 0, log: [kind === "keeper" ? `${ADVENTURE_AREA_MAP[save.areaId].keeper.title} nhận lời thách đấu!` : `${CARD_MAP[cardId].name} xuất hiện trong làn hương!`] }
  addUnique(save.discovered, cardId)
  save.message = null
}
function respawn(save: AdventureSave) {
  const area = ADVENTURE_AREA_MAP[save.areaId]
  healTeam(save); save.encounter = null; save.x = area.spawn.x; save.y = area.spawn.y
  save.message = "Cả đội đã kiệt sức. Người trong vùng đưa bạn về Bếp Nghỉ và hồi phục Vị Linh."
}
function enemyTurn(save: AdventureSave) {
  const encounter = save.encounter
  const member = currentMember(save)
  if (!encounter || !member) return
  const enemyCard = CARD_MAP[encounter.cardId], memberCard = CARD_MAP[member.cardId]
  const special = encounter.turn % 3 === 0
  const raw = Math.max(1, Math.round(spiritAttack(encounter.cardId, encounter.level) * (special ? 1.25 : .82) * schoolMultiplier(enemyCard.school, memberCard.school)) - encounter.enemyWeaken)
  const damage = Math.max(1, raw - encounter.playerGuard)
  member.hp = Math.max(0, member.hp - damage)
  encounter.playerGuard = 0; encounter.enemyWeaken = 0
  appendLog(encounter, `${enemyCard.name} ${special ? "bung hương thức" : "phản công"} · ${damage} sát thương.`)
  if (!member.hp) {
    const next = aliveMember(save)
    if (!next) { respawn(save); return }
    encounter.activeUid = next.uid
    appendLog(encounter, `${memberCard.name} lùi lại. ${CARD_MAP[next.cardId].name} tiếp sức!`)
  }
  encounter.turn++
}
function finishVictory(save: AdventureSave) {
  const encounter = save.encounter!
  const member = currentMember(save)!
  const card = CARD_MAP[encounter.cardId]
  gainXp(member, encounter.kind === "keeper" ? 18 + encounter.level * 2 : 7 + encounter.level)
  if (encounter.kind === "keeper") {
    const area = ADVENTURE_AREA_MAP[save.areaId]
    addUnique(save.badges, area.keeper.badge); addUnique(save.completedQuests, `keeper:${area.id}`)
    save.aromaSeals += 4
    if (area.id === "moon-table") save.completed = true
    save.message = area.id === "moon-table"
      ? "Giao Ước Năm Vị đã hoàn thành. Bàn Trăng sáng lên và mọi vùng đường đều mở để bạn tiếp tục sưu tầm."
      : `Nhận ${area.keeper.badgeName} và 4 Hương Ấn. Lối sang vùng kế tiếp đã mở.`
  } else save.message = `${card.name} trở về làn hương. ${CARD_MAP[member.cardId].name} nhận kinh nghiệm.`
  save.encounter = null
}
function battle(save: AdventureSave, action: Extract<AdventureAction, { type: "battle" }>): AdventureResult {
  const encounter = save.encounter
  const member = currentMember(save)
  if (!encounter || !member) return { save, error: "Không có cuộc chạm trán đang diễn ra." }
  const card = CARD_MAP[member.cardId], enemy = CARD_MAP[encounter.cardId]
  if (action.move === "switch") {
    const next = save.team.find((candidate) => candidate.uid === action.uid && candidate.hp > 0)
    if (!next) return { save, error: "Vị Linh này chưa thể vào trận." }
    if (next.uid === encounter.activeUid) return { save, error: "Vị Linh này đang ở trên sân." }
    encounter.activeUid = next.uid
    appendLog(encounter, `${CARD_MAP[next.cardId].name} vào thay và đón lượt phản công.`)
    enemyTurn(save)
    return { save, event: "battle" }
  }
  if (action.move === "flee") {
    if (encounter.kind === "keeper") return { save, error: "Người giữ ấn muốn thấy cuộc đấu đi đến cùng." }
    if ((hash(`${encounter.id}:flee:${encounter.turn}`) % 100) < 72) { save.encounter = null; save.message = "Cả đội đã rút lui an toàn."; return { save, event: "move" } }
    appendLog(encounter, "Đường lui bị chặn."); enemyTurn(save); return { save, event: "battle" }
  }
  if (action.move === "befriend") {
    if (encounter.kind === "keeper") return { save, error: "Vị Linh giữ ấn không thể được mời khi đang làm nhiệm vụ." }
    if (save.aromaSeals < 1) return { save, error: "Bạn đã hết Hương Ấn." }
    save.aromaSeals--; encounter.attempts++
    const chance = captureChance(encounter), roll = (hash(`${encounter.id}:seal:${encounter.attempts}`) % 1000) / 1000
    if (roll <= chance) {
      const caught = makeMember(encounter.cardId, encounter.level, `adv-${save.steps}-${encounter.attempts}-${hash(encounter.id).toString(36)}`, Math.max(.35, encounter.hp / encounter.maxHp))
      const destination = save.team.length < 4 ? save.team : save.reserve
      if (destination === save.reserve && save.reserve.length >= 20) return { save, error: "Tủ Vị Linh đã đầy 20 chỗ." }
      destination.push(caught); addUnique(save.discovered, caught.cardId); save.encounter = null
      save.message = `${enemy.name} nhận lời về cùng bạn${destination === save.reserve ? " và đang nghỉ trong Tủ Vị Linh" : ""}.`
      return { save, event: "capture" }
    }
    appendLog(encounter, `${enemy.name} chưa sẵn sàng nhận lời mời.`); enemyTurn(save); return { save, event: "battle" }
  }
  if (action.move === "guard") {
    encounter.playerGuard = 5 + Math.floor(member.level / 5); appendLog(encounter, `${card.name} giữ mâm, giảm đòn kế tiếp.`)
    enemyTurn(save); return { save, event: "battle" }
  }
  if (action.move === "skill") {
    let power = spiritAttack(member.cardId, member.level) + 3
    if (card.school === "ember") power += 2
    const damage = Math.max(1, Math.round(power * schoolMultiplier(card.school, enemy.school)) - encounter.enemyGuard)
    encounter.enemyGuard = 0; encounter.hp = Math.max(0, encounter.hp - damage)
    if (card.school === "grove" || card.school === "sugar") member.hp = Math.min(spiritMaxHp(member.cardId, member.level), member.hp + 3 + Math.floor(member.level / 4))
    if (card.school === "hearth" || card.school === "sugar") encounter.playerGuard += 3
    if (card.school === "tide") encounter.enemyWeaken = 3
    appendLog(encounter, `${card.name} dùng Hương thức ${SCHOOLS[card.school].name} · ${damage} sát thương.`)
  } else {
    const damage = Math.max(1, Math.round(spiritAttack(member.cardId, member.level) * .9 * schoolMultiplier(card.school, enemy.school)) - encounter.enemyGuard)
    encounter.enemyGuard = 0; encounter.hp = Math.max(0, encounter.hp - damage)
    appendLog(encounter, `${card.name} đánh Nhịp Muôi · ${damage} sát thương.`)
  }
  if (!encounter.hp) { finishVictory(save); return { save, event: "win" } }
  enemyTurn(save)
  return { save, event: "battle" }
}

export function reduceAdventure(current: AdventureSave | undefined, action: AdventureAction): AdventureResult {
  const save = clone(current ?? newAdventure())
  if (action.type === "start") {
    if (save.started) return { save, error: "Chuyến phiêu lưu đã bắt đầu." }
    if (!ADVENTURE_STARTERS.includes(action.cardId as typeof ADVENTURE_STARTERS[number]) || !CARD_MAP[action.cardId]) return { save, error: "Vị Linh khởi hành không hợp lệ." }
    save.started = true; save.team = [makeMember(action.cardId, 5, `starter-${action.cardId}`)]; addUnique(save.discovered, action.cardId)
    save.message = `${CARD_MAP[action.cardId].name} đã chọn đồng hành. Hãy gặp Bách ở phía trên và tìm Người Giữ Đèn.`
    return { save, event: "capture" }
  }
  if (!save.started) return { save, error: "Hãy chọn Vị Linh đồng hành trước." }
  if (action.type === "dismiss") { save.message = null; return { save } }
  if (action.type === "battle") return battle(save, action)
  if (save.encounter) return { save, error: "Hãy giải quyết cuộc chạm trán trước." }
  if (action.type === "heal") { healTeam(save); save.message = "Cả đội đã được hồi phục tại Bếp Nghỉ."; return { save, event: "heal" } }
  if (action.type === "lead") {
    const index = save.team.findIndex((member) => member.uid === action.uid)
    if (index < 0) return { save, error: "Vị Linh không ở trong đội." }
    save.team = [save.team[index], ...save.team.slice(0, index), ...save.team.slice(index + 1)]
    save.message = `${CARD_MAP[save.team[0].cardId].name} đang dẫn đội.`; return { save }
  }
  if (action.type === "deposit") {
    if (save.team.length <= 1) return { save, error: "Đội phải còn ít nhất một Vị Linh." }
    if (save.reserve.length >= 20) return { save, error: "Tủ Vị Linh đã đầy." }
    const index = save.team.findIndex((member) => member.uid === action.uid)
    if (index < 0) return { save, error: "Vị Linh không ở trong đội." }
    save.reserve.push(save.team[index]); save.team.splice(index, 1); return { save }
  }
  if (action.type === "withdraw") {
    if (save.team.length >= 4) return { save, error: "Đội hiện tại đã đủ 4 Vị Linh." }
    const index = save.reserve.findIndex((member) => member.uid === action.uid)
    if (index < 0) return { save, error: "Không tìm thấy Vị Linh trong tủ." }
    save.team.push(save.reserve[index]); save.reserve.splice(index, 1); return { save }
  }
  const area = ADVENTURE_AREA_MAP[save.areaId]
  if (action.type === "interact") {
    const [dx, dy] = DELTAS[save.facing], x = save.x + dx, y = save.y + dy
    if (area.npc.x === x && area.npc.y === y) { save.message = save.badges.includes(area.keeper.badge) ? area.npc.after : area.npc.before; addUnique(save.completedQuests, `talk:${area.id}`); return { save } }
    if (area.keeper.x === x && area.keeper.y === y) {
      if (save.badges.includes(area.keeper.badge)) { save.message = `${area.keeper.title} đã trao ${area.keeper.badgeName}. Lối đi phía trước đang mở.`; return { save } }
      beginEncounter(save, area.keeper.cardId, area.keeper.level, "keeper"); return { save, event: "battle" }
    }
    if (tile(area, save.x, save.y) === "h" || tile(area, x, y) === "h") { healTeam(save); save.message = "Bếp Nghỉ tỏa hơi ấm. Cả đội đã hồi phục hoàn toàn."; return { save, event: "heal" } }
    save.message = "Chỉ có tiếng gió và mùi bếp thoảng qua."; return { save }
  }
  if (action.type === "move") {
    save.facing = action.direction
    const [dx, dy] = DELTAS[action.direction], x = save.x + dx, y = save.y + dy, target = tile(area, x, y)
    if (target === "#" || target === "n" || target === "b") return { save }
    save.x = x; save.y = y; save.steps++; save.message = null
    const exit = area.exits.find((candidate) => candidate.x === x && candidate.y === y)
    if (exit) {
      if (exit.requires && !save.badges.includes(exit.requires)) { save.x -= dx; save.y -= dy; save.message = "Con đường vẫn phủ sương. Hãy nhận ấn của vùng này trước."; return { save } }
      save.areaId = exit.to; save.x = exit.toX; save.y = exit.toY; save.message = `Đã tới ${ADVENTURE_AREA_MAP[exit.to].name}.`; return { save, event: "move" }
    }
    const find = area.finds.find((candidate) => candidate.x === x && candidate.y === y)
    if (find && !save.claimedFinds.includes(find.id)) { addUnique(save.claimedFinds, find.id); save.aromaSeals += find.seals; save.message = find.text; return { save, event: "capture" } }
    if (target === "h") { healTeam(save); save.message = "Bếp Nghỉ đã hồi phục cả đội."; return { save, event: "heal" } }
    if (target === "g" && (hash(`${save.areaId}:${x}:${y}:${save.steps}`) % 100) < 27) {
      const index = hash(`${save.areaId}:${save.steps}:spirit`) % area.encounters.length
      beginEncounter(save, area.encounters[index], 3 + area.chapter * 3 + (hash(`${x}:${y}`) % 3), "wild")
      return { save, event: "battle" }
    }
    return { save, event: "move" }
  }
  return { save }
}

export function tileLabel(tileId: string) {
  return ({ "#": "Vật cản", ".": "Lối đi", g: "Bãi hương · có thể gặp Vị Linh", h: "Bếp Nghỉ", n: "Người dẫn đường", b: "Người giữ ấn", e: "Lối sang vùng", i: "Điểm tìm kiếm" } as Record<string, string>)[tileId] ?? "Ô bản đồ"
}
