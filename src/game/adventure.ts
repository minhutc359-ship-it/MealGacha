import { CARD_MAP } from "./catalog"
import type { CharacterId } from "./characters"
import {
  ADVENTURE_AREAS,
  ADVENTURE_AREA_MAP,
  ADVENTURE_STARTERS,
  type AdventureAreaId,
} from "./adventureRegions"
import { ADVENTURE_MAP_BY_ID, canWalk, type MapNpc } from "./adventureWorld"
import {
  fullPP,
  skillsFor,
  SKILL_MAP,
  schoolMultiplier,
  spiritMaxHp,
  spiritAttack,
  spiritSpeed,
  xpForNext,
  type AdventureStatus,
  type AdventureSkill,
} from "./adventureSkills"
export {
  ADVENTURE_AREAS,
  ADVENTURE_AREA_MAP,
  ADVENTURE_STARTERS,
  schoolMultiplier,
  spiritMaxHp,
  spiritAttack,
  spiritSpeed,
  xpForNext,
}
export type { AdventureAreaId }
export type AdventureDirection = "up" | "down" | "left" | "right"
export type AdventureBattleMove = "strike" | "skill" | "guard" | "befriend" | "flee" | "switch" | "item"
export type AdventureItem = "potion" | "revive" | "seal"
export interface AdventureSpirit {
  uid: string
  cardId: string
  level: number
  xp: number
  hp: number
  pp?: Record<string, number>
  status?: AdventureStatus
  statusTurns?: number
}
export interface AdventureEncounter {
  id: string
  kind: "wild" | "keeper" | "trainer"
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
  npcId?: string
  roster?: { cardId: string; level: number }[]
  wave?: number
  enemyPP?: Record<string, number>
  enemyStatus?: AdventureStatus
  enemyStatusTurns?: number
  participants?: string[]
}
export interface AdventureSave {
  version: 1 | 2
  started: boolean
  areaId: AdventureAreaId
  mapId: string
  x: number
  y: number
  facing: AdventureDirection
  steps: number
  aromaSeals: number
  coins: number
  inventory: { potion: number; revive: number }
  team: AdventureSpirit[]
  reserve: AdventureSpirit[]
  discovered: string[]
  badges: string[]
  completedQuests: string[]
  claimedFinds: string[]
  defeatedTrainers: string[]
  visitedMaps: string[]
  encounter: AdventureEncounter | null
  message: string | null
  speaker: CharacterId | null
  service: "shop" | "storage" | null
  follower: { x: number; y: number } | null
  completed: boolean
}
export const ADVENTURE_SHOP = [
  {
    id: "seal" as const,
    name: "Hương Ấn",
    price: 18,
    description: "Mời Vị Linh hoang dã về cùng đội.",
  },
  {
    id: "potion" as const,
    name: "Canh Ấm",
    price: 12,
    description: "Hồi 30 HP và gỡ trạng thái.",
  },
  {
    id: "revive" as const,
    name: "Lá Tỉnh",
    price: 35,
    description: "Hồi sinh Vị Linh với 50% HP.",
  },
]
export type AdventureAction = { type: "start"; cardId: string } | {
  type: "move"
  direction: AdventureDirection
} | { type: "interact" } | { type: "dismiss" } | {
  type: "battle"
  move: AdventureBattleMove
  uid?: string
  skillId?: string
  item?: AdventureItem
} | { type: "lead" | "deposit" | "withdraw"; uid: string } | { type: "heal" } | {
  type: "buy"
  item: AdventureItem
} | { type: "item"; item: AdventureItem; uid: string } | {
  type: "travel"
  areaId: AdventureAreaId
}
export interface AdventureResult {
  save: AdventureSave
  error?: string
  event?: "move" | "battle" | "win" | "capture" | "heal"
}
export const DELTAS: Record<AdventureDirection, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
}
const hash = (value: string) =>
  [...value].reduce(
    (n, char) => (Math.imul(n, 31) + char.charCodeAt(0)) >>> 0,
    2166136261,
  )
const unique = (values: string[], value: string) => {
  if (!values.includes(value)) values.push(value)
}
export function newAdventure(): AdventureSave {
  return {
    version: 2,
    started: false,
    areaId: "lantern-quarter",
    mapId: "lantern-quarter",
    x: 2,
    y: 14,
    facing: "up",
    steps: 0,
    aromaSeals: 6,
    coins: 80,
    inventory: { potion: 3, revive: 1 },
    team: [],
    reserve: [],
    discovered: [],
    badges: [],
    completedQuests: [],
    claimedFinds: [],
    defeatedTrainers: [],
    visitedMaps: ["lantern-quarter"],
    encounter: null,
    message: null,
    speaker: null,
    service: null,
    follower: null,
    completed: false,
  }
}
/** Called once by save parsing and defensively by the reducer. v1 coordinates belong to the old 12x9 maps. */
export function migrateAdventure(current: AdventureSave): AdventureSave {
  const save = { ...newAdventure(), ...structuredClone(current) }
  if (current.version === 1) {
    save.version = 2
    save.mapId = save.areaId
    save.x = 2
    save.y = 14
    save.follower = null
    save.visitedMaps = ADVENTURE_AREAS.filter(
      (area, i) =>
        i === 0 || save.badges.includes(ADVENTURE_AREAS[i - 1].keeper.badge),
    ).map((area) => area.id)
  }
  for (const member of [...save.team, ...save.reserve]) {
    member.pp = { ...fullPP(member.cardId, member.level), ...member.pp }
    member.status ??= null
    member.statusTurns ??= 0
  }
  if (save.encounter) {
    save.encounter.enemyPP ??= fullPP(
      save.encounter.cardId,
      save.encounter.level,
    )
    save.encounter.enemyStatus ??= null
    save.encounter.enemyStatusTurns ??= 0
    save.encounter.participants ??= [save.encounter.activeUid]
  }
  return save
}
function makeMember(
  cardId: string,
  level: number,
  uid: string,
): AdventureSpirit {
  return {
    uid,
    cardId,
    level,
    xp: 0,
    hp: spiritMaxHp(cardId, level),
    pp: fullPP(cardId, level),
    status: null,
    statusTurns: 0,
  }
}
function say(
  save: AdventureSave,
  text: string,
  speaker: CharacterId | null = null,
) {
  save.message = text
  save.speaker = speaker
}
function log(encounter: AdventureEncounter, text: string) {
  encounter.log = [...encounter.log.slice(-6), text]
}
function healTeam(save: AdventureSave) {
  for (const member of save.team) {
    member.hp = spiritMaxHp(member.cardId, member.level)
    member.pp = fullPP(member.cardId, member.level)
    member.status = null
    member.statusTurns = 0
  }
}
function gainXp(member: AdventureSpirit, amount: number) {
  member.xp += amount
  while (member.level < 50 && member.xp >= xpForNext(member.level)) {
    const oldMax = spiritMaxHp(member.cardId, member.level)
    member.xp -= xpForNext(member.level)
    member.level++
    if (member.hp > 0)
      member.hp += spiritMaxHp(member.cardId, member.level) - oldMax
    member.pp = { ...fullPP(member.cardId, member.level), ...member.pp }
  }
  if (member.level === 50) member.xp = 0
}
export function captureChance(encounter: AdventureEncounter) {
  if (encounter.kind !== "wild") return 0
  return Math.min(
    0.96,
    0.25 +
      (1 - encounter.hp / encounter.maxHp) * 0.65 +
      (encounter.enemyStatus ? 0.12 : 0),
  )
}
function active(save: AdventureSave) {
  return save.team.find((member) => member.uid === save.encounter?.activeUid)
}
function startEncounter(
  save: AdventureSave,
  cardId: string,
  level: number,
  kind: AdventureEncounter["kind"],
  npc?: MapNpc,
) {
  const member = save.team.find((member) => member.hp > 0)
  if (!member) {
    say(save, "Cả đội cần nghỉ tại Bếp Nghỉ trước khi tiếp tục.")
    return
  }
  save.encounter = {
    id: `${save.mapId}-${save.steps}-${cardId}-${kind}`,
    kind,
    cardId,
    level,
    hp: spiritMaxHp(cardId, level),
    maxHp: spiritMaxHp(cardId, level),
    activeUid: member.uid,
    turn: 1,
    playerGuard: 0,
    enemyGuard: 0,
    enemyWeaken: 0,
    attempts: 0,
    log: [
      npc
        ? `${npc.name} nhận lời thách đấu!`
        : `${CARD_MAP[cardId].name} xuất hiện trong bãi hương!`,
    ],
    npcId: npc?.id,
    roster: npc?.roster,
    wave: 0,
    enemyPP: fullPP(cardId, level),
    enemyStatus: null,
    enemyStatusTurns: 0,
    participants: [member.uid],
  }
  unique(save.discovered, cardId)
  save.message = null
  save.service = null
}
function respawn(save: AdventureSave) {
  healTeam(save)
  save.encounter = null
  save.mapId = `${save.areaId}:clinic`
  save.x = 5
  save.y = 7
  save.follower = null
  save.service = null
  unique(save.visitedMaps, save.mapId)
  say(
    save,
    "Cả đội kiệt sức. Bà đưa bạn về Bếp Nghỉ và hồi HP, PP cùng trạng thái. Xu và Vị Linh vẫn được giữ.",
    "grandmother",
  )
}
function settleFaint(save: AdventureSave) {
  const encounter = save.encounter!,
    member = active(save)!
  if (member.hp > 0) return false
  const next = save.team.find((candidate) => candidate.hp > 0)
  if (!next) {
    respawn(save)
    return true
  }
  encounter.activeUid = next.uid
  unique(encounter.participants!, next.uid)
  encounter.playerGuard = 0
  log(
    encounter,
    `${CARD_MAP[member.cardId].name} kiệt sức. ${CARD_MAP[next.cardId].name} tiếp sức!`,
  )
  return true
}
/** Returns true when a wave ended, so the incoming opponent cannot attack in the same action. */
function settleEnemy(save: AdventureSave) {
  const encounter = save.encounter!
  if (encounter.hp > 0) return false
  const participants = save.team.filter((member) =>
    encounter.participants?.includes(member.uid),
  )
  for (const member of participants)
    gainXp(
      member,
      Math.ceil((8 + encounter.level * 2) / Math.max(1, participants.length)),
    )
  const nextWave = (encounter.wave ?? 0) + 1,
    next = encounter.roster?.[nextWave]
  if (next) {
    encounter.wave = nextWave
    encounter.cardId = next.cardId
    encounter.level = next.level
    encounter.maxHp = spiritMaxHp(next.cardId, next.level)
    encounter.hp = encounter.maxHp
    encounter.enemyStatus = null
    encounter.enemyStatusTurns = 0
    encounter.enemyPP = fullPP(next.cardId, next.level)
    encounter.enemyGuard = 0
    unique(save.discovered, next.cardId)
    log(encounter, `Đối thủ đưa ${CARD_MAP[next.cardId].name} vào sân!`)
    encounter.turn++
    return true
  }
  const area = ADVENTURE_AREA_MAP[save.areaId],
    reward =
      encounter.kind === "wild" ? 8 + encounter.level : 35 + encounter.level * 4
  save.coins = Math.min(99999, save.coins + reward)
  if (encounter.kind === "keeper") {
    unique(save.badges, area.keeper.badge)
    unique(save.completedQuests, `keeper:${area.id}`)
    save.aromaSeals = Math.min(999, save.aromaSeals + 4)
    if (area.id === "moon-table") save.completed = true
    say(
      save,
      save.completed
        ? `Giao Ước Năm Vị hoàn tất! Nhận ${reward} xu. Bạn có thể tiếp tục khám phá và sưu tầm.`
        : `Nhận ${area.keeper.badgeName}, 4 Hương Ấn và ${reward} xu. Đường sang vùng tiếp theo đã mở!`,
      area.npc.id,
    )
  } else {
    if (encounter.npcId) unique(save.defeatedTrainers, encounter.npcId)
    say(
      save,
      `Chiến thắng! Đội nhận kinh nghiệm và ${reward} xu${
        encounter.kind === "trainer" ? ". Lả ghi nhớ cuộc đấu này" : ""
      }.`,
    )
  }
  save.encounter = null
  return true
}
function statusTick(
  member: { hp: number; status?: AdventureStatus; statusTurns?: number },
  max: number,
) {
  if ((member.status === "burn" || member.status === "rooted") && member.hp > 0)
    member.hp = Math.max(0, member.hp - Math.max(1, Math.floor(max / 12)))
  member.statusTurns = Math.max(0, (member.statusTurns ?? 0) - 1)
  if (!member.statusTurns) member.status = null
}
function endRound(save: AdventureSave) {
  if (!save.encounter) return
  const e = save.encounter,
    member = active(save)!
  const enemy = {
    hp: e.hp,
    status: e.enemyStatus,
    statusTurns: e.enemyStatusTurns,
  }
  const oldHP = member.hp,
    oldEnemyHP = e.hp
  statusTick(member, spiritMaxHp(member.cardId, member.level))
  statusTick(enemy, e.maxHp)
  e.hp = enemy.hp
  e.enemyStatus = enemy.status
  e.enemyStatusTurns = enemy.statusTurns
  if (oldHP > member.hp || oldEnemyHP > e.hp)
    log(e, "Trạng thái rút sinh lực cuối lượt.")
  // Simultaneous exhaustion favours the player's earned victory; then check remaining team.
  if (!e.hp) {
    settleEnemy(save)
    if (save.encounter) settleFaint(save)
    else if (!save.team.some((item) => item.hp > 0)) respawn(save)
    return
  }
  if (settleFaint(save)) {
    if (save.encounter) save.encounter.turn++
    return
  }
  e.turn++
}
function damage(
  attacker: string,
  level: number,
  skill: AdventureSkill,
  defender: string,
  status: AdventureStatus | undefined,
  guard: number,
) {
  const multiplier = skill.school
    ? schoolMultiplier(skill.school, CARD_MAP[defender].school)
    : 1
  const raw =
    spiritAttack(attacker, level) *
    skill.power *
    multiplier *
    (status === "burn" ? 0.8 : 1)
  return skill.power ? Math.max(1, Math.round(raw) - guard) : 0
}
function playerSkill(
  save: AdventureSave,
  skill: AdventureSkill,
  spendPP = true,
) {
  const e = save.encounter!,
    member = active(save)!
  if (
    member.status === "drowsy" &&
    hash(`${e.id}:${e.turn}:sleep:player`) % 3 === 0
  ) {
    log(e, `${CARD_MAP[member.cardId].name} mơ màng, bỏ lượt.`)
    return
  }
  if (spendPP) member.pp![skill.id]--
  const dealt = damage(
    member.cardId,
    member.level,
    skill,
    e.cardId,
    member.status,
    e.enemyGuard,
  )
  e.hp = Math.max(0, e.hp - dealt)
  if (dealt) e.enemyGuard = 0
  if (skill.effect === "shield")
    e.playerGuard = 8 + Math.floor(member.level / 2)
  else if (skill.effect === "heal")
    member.hp = Math.min(
      spiritMaxHp(member.cardId, member.level),
      member.hp + Math.ceil(spiritMaxHp(member.cardId, member.level) * 0.25),
    )
  else if (skill.effect === "cleanse") {
    member.status = null
    member.statusTurns = 0
    member.hp = Math.min(
      spiritMaxHp(member.cardId, member.level),
      member.hp + Math.ceil(spiritMaxHp(member.cardId, member.level) * 0.15),
    )
  } else if (skill.effect && e.hp > 0) {
    e.enemyStatus = skill.effect
    e.enemyStatusTurns = 4
  }
  const effectiveness = skill.school
    ? schoolMultiplier(skill.school, CARD_MAP[e.cardId].school)
    : 1
  log(
    e,
    `${CARD_MAP[member.cardId].name}: ${skill.name}${
      dealt ? ` · ${dealt} sát thương` : " · dựng khiên"
    }${
      effectiveness > 1
        ? " · rất hiệu quả!"
        : effectiveness < 1
          ? " · bị kháng"
          : ""
    }.`,
  )
}
function enemyAction(save: AdventureSave) {
  const e = save.encounter!,
    member = active(save)!
  if (
    e.enemyStatus === "drowsy" &&
    hash(`${e.id}:${e.turn}:sleep:enemy`) % 3 === 0
  ) {
    log(e, "Đối thủ mơ màng, bỏ lượt.")
    return
  }
  const available = skillsFor(e.cardId, e.level).filter(
    (skill) => (e.enemyPP?.[skill.id] ?? 0) > 0,
  )
  const skill = available.length
    ? available[e.turn % available.length]
    : SKILL_MAP.ladle
  if (available.length) e.enemyPP![skill.id]--
  const dealt = Math.max(
    0,
    damage(
      e.cardId,
      e.level,
      skill,
      member.cardId,
      e.enemyStatus,
      e.playerGuard,
    ) - e.enemyWeaken,
  )
  e.enemyWeaken = 0
  if (dealt) {
    member.hp = Math.max(0, member.hp - dealt)
    e.playerGuard = 0
  }
  if (skill.effect === "shield") e.enemyGuard = 8 + Math.floor(e.level / 2)
  else if (skill.effect === "heal")
    e.hp = Math.min(e.maxHp, e.hp + Math.ceil(e.maxHp * 0.25))
  else if (skill.effect === "cleanse") {
    e.enemyStatus = null
    e.enemyStatusTurns = 0
    e.hp = Math.min(e.maxHp, e.hp + Math.ceil(e.maxHp * 0.15))
  } else if (skill.effect && member.hp > 0) {
    member.status = skill.effect
    member.statusTurns = 4
  }
  log(
    e,
    `${CARD_MAP[e.cardId].name}: ${skill.name}${
      dealt ? ` · ${dealt} sát thương` : " · dựng khiên"
    }.`,
  )
}
function useItem(
  save: AdventureSave,
  item: AdventureItem,
  uid: string,
): string | undefined {
  const member = save.team.find((candidate) => candidate.uid === uid)
  if (!member || item === "seal")
    return "Chọn một Vị Linh và vật phẩm hồi phục hợp lệ."
  if (!save.inventory[item]) return "Bạn đã hết vật phẩm này."
  const max = spiritMaxHp(member.cardId, member.level)
  if (item === "revive" && member.hp > 0)
    return "Lá Tỉnh chỉ dùng cho Vị Linh kiệt sức."
  if (item === "potion" && !member.hp) return "Vị Linh kiệt sức cần Lá Tỉnh."
  if (item === "potion" && member.hp === max && !member.status)
    return "Vị Linh đang khỏe mạnh."
  save.inventory[item]--
  member.hp =
    item === "revive" ? Math.ceil(max / 2) : Math.min(max, member.hp + 30)
  member.status = null
  member.statusTurns = 0
}
function battle(
  save: AdventureSave,
  action: Extract<AdventureAction, { type: "battle" }>,
): AdventureResult {
  const e = save.encounter,
    member = active(save)
  if (!e || !member)
    return { save, error: "Không có cuộc chạm trán đang diễn ra." }
  if (action.move === "switch") {
    const next = save.team.find(
      (candidate) => candidate.uid === action.uid && candidate.hp > 0,
    )
    if (!next || next.uid === e.activeUid)
      return { save, error: "Vị Linh này chưa thể vào thay." }
    e.activeUid = next.uid
    e.playerGuard = 0
    unique(e.participants!, next.uid)
    log(e, `${CARD_MAP[next.cardId].name} vào thay!`)
    enemyAction(save)
    endRound(save)
    return { save, event: "battle" }
  }
  if (action.move === "flee") {
    if (e.kind !== "wild")
      return { save, error: "Hãy hoàn thành cuộc đấu với người trong vùng." }
    if (hash(`${e.id}:flee:${e.turn}`) % 100 < 75) {
      save.encounter = null
      say(save, "Đã rút lui an toàn.")
      return { save, event: "move" }
    }
    log(e, "Đường lui bị chặn!")
    enemyAction(save)
    endRound(save)
    return { save, event: "battle" }
  }
  if (action.move === "befriend") {
    if (e.kind !== "wild")
      return { save, error: "Không thể thu phục Vị Linh thuộc đội NPC." }
    if (!save.aromaSeals) return { save, error: "Bạn đã hết Hương Ấn." }
    if (save.team.length >= 6 && save.reserve.length >= 60)
      return { save, error: "Đội và Tủ Vị Linh đã đầy." }
    save.aromaSeals--
    e.attempts++
    if (
      (hash(`${e.id}:seal:${e.attempts}`) % 1000) / 1000 <=
      captureChance(e)
    ) {
      const caught = makeMember(
        e.cardId,
        e.level,
        `adv-${save.steps}-${e.attempts}-${hash(e.id).toString(36)}`,
      )
      caught.hp = Math.max(1, e.hp)
      caught.status = e.enemyStatus
      caught.statusTurns = e.enemyStatusTurns
      const destination = save.team.length < 6 ? save.team : save.reserve
      destination.push(caught)
      unique(save.discovered, caught.cardId)
      save.encounter = null
      say(
        save,
        `${CARD_MAP[caught.cardId].name} nhận lời đồng hành${
          destination === save.reserve ? " và nghỉ tại Tủ Vị Linh" : ""
        }!`,
      )
      return { save, event: "capture" }
    }
    log(e, "Hương Ấn tan ra. Vị Linh chưa sẵn sàng!")
    enemyAction(save)
    endRound(save)
    return { save, event: "battle" }
  }
  if (action.move === "item") {
    const error = useItem(
      save,
      action.item ?? "potion",
      action.uid ?? member.uid,
    )
    if (error) return { save, error }
    log(e, "Đội dùng vật phẩm, đối thủ đón lượt.")
    enemyAction(save)
    endRound(save)
    return { save, event: "heal" }
  }
  if (action.move === "guard") {
    e.playerGuard = 6 + Math.floor(member.level / 2)
    log(e, `${CARD_MAP[member.cardId].name} giữ mâm!`)
    enemyAction(save)
    endRound(save)
    return { save, event: "battle" }
  }
  const skillId =
    action.move === "strike"
      ? "ladle"
      : (action.skillId ??
        skillsFor(member.cardId, member.level).find((skill) => skill.school)
          ?.id)
  const skill = skillsFor(member.cardId, member.level).find(
    (candidate) => candidate.id === skillId,
  )
  if (!skill) return { save, error: "Vị Linh chưa học kỹ năng này." }
  const struggle =
    action.move === "strike" &&
    !skillsFor(member.cardId, member.level).some(
      (candidate) => (member.pp?.[candidate.id] ?? 0) > 0,
    )
  if (!struggle && !(member.pp?.[skill.id] ?? 0))
    return { save, error: "Kỹ năng đã hết PP. Ghé Bếp Nghỉ để hồi PP." }
  const playerFirst =
    spiritSpeed(member.cardId, member.level, member.status) >=
    spiritSpeed(e.cardId, e.level, e.enemyStatus)
  if (playerFirst) {
    playerSkill(save, skill, !struggle)
    if (settleEnemy(save))
      return { save, event: save.encounter ? "battle" : "win" }
    enemyAction(save)
    if (member.hp === 0) {
      endRound(save)
      return { save, event: "battle" }
    }
  } else {
    enemyAction(save)
    if (member.hp === 0) {
      endRound(save)
      return { save, event: "battle" }
    }
    playerSkill(save, skill, !struggle)
    if (settleEnemy(save))
      return { save, event: save.encounter ? "battle" : "win" }
  }
  if (struggle) {
    member.hp = Math.max(
      0,
      member.hp - Math.ceil(spiritMaxHp(member.cardId, member.level) / 12),
    )
    log(e, "Cố Sức: mất một phần HP vì đã hết PP.")
  }
  endRound(save)
  return { save, event: save.encounter ? "battle" : "win" }
}
function interactNpc(save: AdventureSave, npc: MapNpc): AdventureResult {
  const area = ADVENTURE_AREA_MAP[save.areaId]
  if (npc.role === "healer") {
    healTeam(save)
    say(
      save,
      "Cả đội đã hồi đầy HP, PP và gỡ mọi trạng thái. Tủ Vị Linh ở bên phải bếp.",
      npc.character,
    )
    return { save, event: "heal" }
  }
  if (npc.role === "merchant") {
    save.service = "shop"
    say(save, npc.text, npc.character)
    return { save }
  }
  if (npc.role === "trainer" || npc.role === "keeper") {
    if (
      save.defeatedTrainers.includes(npc.id) ||
      (npc.role === "keeper" && save.badges.includes(area.keeper.badge))
    ) {
      say(
        save,
        "Một cuộc đấu đẹp! Hãy đi tiếp; những người ở vùng sau đang chờ bạn.",
        npc.character,
      )
      return { save }
    }
    const first = npc.roster![0]
    startEncounter(
      save,
      first.cardId,
      first.level,
      npc.role === "keeper" ? "keeper" : "trainer",
      npc,
    )
    return { save, event: "battle" }
  }
  if (npc.role === "quest") {
    const quest = `memory:${area.id}`,
      required = area.chapter + 2
    if (save.completedQuests.includes(quest))
      say(
        save,
        "Cảm ơn bạn đã kể lại tên những món ăn. Ký ức của ngôi nhà đã sáng lên.",
        npc.character,
      )
    else if (save.discovered.length >= required) {
      unique(save.completedQuests, quest)
      save.coins = Math.min(99999, save.coins + 60)
      save.inventory.revive = Math.min(99, save.inventory.revive + 1)
      say(
        save,
        "Bạn đã mang đủ tên món về Nhà Ký Ức! Nhận 60 xu và 1 Lá Tỉnh.",
        npc.character,
      )
    } else
      say(
        save,
        `${npc.text} Tiến độ: ${save.discovered.length}/${required} loài.`,
        npc.character,
      )
    return { save, event: "capture" }
  }
  unique(save.completedQuests, `talk:${area.id}`)
  say(
    save,
    npc.role === "guide" && save.badges.includes(area.keeper.badge)
      ? area.npc.after
      : npc.text,
    npc.character,
  )
  return { save }
}
export function reduceAdventure(
  current: AdventureSave | undefined,
  action: AdventureAction,
): AdventureResult {
  const save = current ? migrateAdventure(current) : newAdventure()
  if (action.type === "start") {
    if (
      save.started ||
      !ADVENTURE_STARTERS.includes(
        action.cardId as typeof ADVENTURE_STARTERS[number],
      )
    )
      return {
        save,
        error: "Vị Linh khởi hành không hợp lệ hoặc chuyến đi đã bắt đầu.",
      }
    save.started = true
    save.team = [makeMember(action.cardId, 5, `starter-${action.cardId}`)]
    unique(save.discovered, action.cardId)
    say(
      save,
      `${CARD_MAP[action.cardId].name} chọn đồng hành! Gặp Bách cạnh đường, vào Bếp Nghỉ và ghé Tiệm Hương trước khi ra bãi cỏ.`,
      "grandmother",
    )
    return { save, event: "capture" }
  }
  if (!save.started) return { save, error: "Hãy chọn Vị Linh đồng hành trước." }
  if (action.type === "dismiss") {
    save.message = null
    save.service = null
    save.speaker = null
    return { save }
  }
  if (action.type === "battle") return battle(save, action)
  if (save.encounter)
    return { save, error: "Hãy giải quyết cuộc chạm trán trước." }
  const map = ADVENTURE_MAP_BY_ID[save.mapId],
    area = ADVENTURE_AREA_MAP[save.areaId]
  if (action.type === "heal") {
    if (!map.id.endsWith(":clinic"))
      return { save, error: "Vào Bếp Nghỉ và gặp Bà để hồi HP, PP." }
    healTeam(save)
    say(save, "Cả đội đã hồi phục hoàn toàn.", "grandmother")
    return { save, event: "heal" }
  }
  if (action.type === "buy") {
    if (save.service !== "shop" || !map.id.endsWith(":shop"))
      return { save, error: "Hãy nói chuyện với chủ Tiệm Hương." }
    const item = ADVENTURE_SHOP.find(
      (candidate) => candidate.id === action.item,
    )!
    if (save.coins < item.price) return { save, error: "Bạn chưa đủ xu." }
    if (
      action.item === "seal"
        ? save.aromaSeals >= 999
        : save.inventory[action.item] >= 99
    )
      return { save, error: "Túi vật phẩm này đã đầy." }
    save.coins -= item.price
    if (action.item === "seal") save.aromaSeals++
    else save.inventory[action.item]++
    say(save, `Đã mua ${item.name}.`, "merchant")
    return { save }
  }
  if (action.type === "item") {
    const error = useItem(save, action.item, action.uid)
    return { save, error, event: error ? undefined : "heal" }
  }
  if (action.type === "lead") {
    const index = save.team.findIndex(
      (member) => member.uid === action.uid && member.hp > 0,
    )
    if (index < 0) return { save, error: "Vị Linh cần còn HP để dẫn đội." }
    save.team = [
      save.team[index],
      ...save.team.slice(0, index),
      ...save.team.slice(index + 1),
    ]
    say(save, `${CARD_MAP[save.team[0].cardId].name} đang đi theo bạn.`)
    return { save }
  }
  if (action.type === "deposit" || action.type === "withdraw") {
    if (save.service !== "storage" || !map.id.endsWith(":clinic"))
      return {
        save,
        error: "Dùng Tủ Vị Linh trong Bếp Nghỉ để đổi đội và dự bị.",
      }
    const from = action.type === "deposit" ? save.team : save.reserve,
      to = action.type === "deposit" ? save.reserve : save.team
    if (
      to.length >= (action.type === "deposit" ? 60 : 6) ||
      (action.type === "deposit" && from.length <= 1)
    )
      return { save, error: "Đội cần 1–6 Vị Linh; tủ chứa tối đa 60." }
    const index = from.findIndex((member) => member.uid === action.uid)
    if (index < 0) return { save, error: "Không tìm thấy Vị Linh." }
    if (
      action.type === "deposit" &&
      from[index].hp > 0 &&
      !from.some((member, i) => i !== index && member.hp > 0)
    )
      return { save, error: "Đội cần còn một Vị Linh có thể chiến đấu." }
    to.push(from[index])
    from.splice(index, 1)
    return { save }
  }
  if (action.type === "travel") {
    if (map.interior || !save.visitedMaps.includes(action.areaId))
      return { save, error: "Chỉ đi nhanh tới vùng đã đến, từ ngoài trời." }
    save.areaId = action.areaId
    save.mapId = action.areaId
    save.x = 2
    save.y = 14
    save.follower = null
    save.service = null
    say(save, `Đã trở về ${ADVENTURE_AREA_MAP[action.areaId].name}.`)
    return { save, event: "move" }
  }
  if (action.type === "interact") {
    const [dx, dy] = DELTAS[save.facing],
      x = save.x + dx,
      y = save.y + dy
    const npc = map.npcs.find(
      (candidate) => candidate.x === x && candidate.y === y,
    )
    if (npc) return interactNpc(save, npc)
    const sign = map.signs.find(
      (candidate) => candidate.x === x && candidate.y === y,
    )
    if (sign) {
      say(save, sign.text)
      return { save }
    }
    if (map.grid[y]?.[x] === "r" || map.grid[save.y]?.[save.x] === "r") {
      save.service = "storage"
      say(
        save,
        "Tủ Vị Linh đã mở. Dùng bảng Đội hình để gửi hoặc nhận bạn đồng hành.",
        "grandmother",
      )
      return { save }
    }
    if (save.follower?.x === x && save.follower.y === y) {
      say(
        save,
        `${CARD_MAP[save.team[0].cardId].name} ${
          save.team[0].hp <
          spiritMaxHp(save.team[0].cardId, save.team[0].level) / 3
            ? "mệt rồi, muốn ghé Bếp Nghỉ"
            : "vui vẻ đi quanh bạn và ngửi mùi bếp mới"
        }.`,
      )
      return { save }
    }
    say(
      save,
      "Đứng cạnh NPC, biển chỉ dẫn hoặc Tủ Vị Linh rồi quay mặt về phía đó và bấm E.",
    )
    return { save }
  }
  if (action.type === "move") {
    save.facing = action.direction
    const [dx, dy] = DELTAS[action.direction],
      x = save.x + dx,
      y = save.y + dy
    if (!canWalk(map, x, y)) return { save }
    const exit = map.exits.find(
      (candidate) => candidate.x === x && candidate.y === y,
    )
    if (exit?.requires && !save.badges.includes(exit.requires)) {
      say(save, "Đường còn phủ sương. Nhận ấn của vùng này trước.")
      return { save }
    }
    save.follower = { x: save.x, y: save.y }
    save.x = x
    save.y = y
    save.steps++
    save.message = null
    save.speaker = null
    save.service = null
    if (exit) {
      const next = ADVENTURE_MAP_BY_ID[exit.to]
      save.mapId = next.id
      save.areaId = next.areaId
      save.x = exit.toX
      save.y = exit.toY
      save.follower = null
      unique(save.visitedMaps, next.id)
      say(save, `Đã tới ${next.name}.`)
      return { save, event: "move" }
    }
    const find = map.finds.find(
      (candidate) => candidate.x === x && candidate.y === y,
    )
    if (find && !save.claimedFinds.includes(find.id)) {
      unique(save.claimedFinds, find.id)
      save.aromaSeals = Math.min(999, save.aromaSeals + find.seals)
      save.coins = Math.min(99999, save.coins + find.coins)
      say(save, `Tìm thấy ${find.seals} Hương Ấn và ${find.coins} xu!`)
      return { save, event: "capture" }
    }
    if (
      map.grid[y][x] === "g" &&
      hash(`${map.id}:${x}:${y}:${save.steps}`) % 100 < 18
    ) {
      startEncounter(
        save,
        area.encounters[
          hash(`${map.id}:${save.steps}:spirit`) % area.encounters.length
        ],
        3 + (area.chapter - 1) * 3 + (hash(`${x}:${y}`) % 3),
        "wild",
      )
      return { save, event: "battle" }
    }
    return { save, event: "move" }
  }
  return { save }
}
export function tileLabel(id: string) {
  return (
    ({
      "#": "Nhà",
      t: "Cây",
      w: "Nước",
      f: "Nội thất",
      c: "Bàn",
      ".": "Nền",
      p: "Đường",
      g: "Cỏ hương · chạm trán",
      n: "Nhân vật",
      d: "Cửa nhà",
      e: "Lối sang vùng",
      i: "Túi quà",
      s: "Biển chỉ dẫn",
      r: "Tủ Vị Linh",
    } as Record<string, string>)[id] ?? "Ô bản đồ"
  )
}
