import { CARD_MAP } from "./catalog"
import { STAGE_MAP } from "./story"
import { cardBranches, flavoredCard } from "./v4Cards"
import { cardsForRules } from "./catalog"
import {
  battleRule,
  updateEncounter,
  awakenedScene,
  queueScene,
} from "./encounters"
import { recipeReady } from "./recipes"
import { TACTICS, tacticError, type TacticId } from "./tactics"
import { battleOutcome } from "./battleOutcome"
import { ENEMY_CHALLENGE, challengeStat } from "./difficulty"
import type { Battle, BattleUnit, Combatant, GameCard } from "./types"

export type Target = "hero" | string
interface PlayAction {
  type: "play"
  index: number
  target?: Target
  branch?: "first" | "second"
}
interface AttackAction {
  type: "attack"
  uid: string
  target: Target
}
interface MulliganAction {
  type: "mulligan"
  indices: number[]
}
export type BattleAction = PlayAction | AttackAction | MulliganAction | {
  type: "end"
} | {
  type: "tactic"
  id: TacticId
}
export interface BattleEvent {
  kind: "play" | "attack" | "turn" | "rule" | "mulligan" | "combo" | "objective" | "scene" | "assist" | "tactic"
  side: "player" | "enemy"
  label: string
  cardId?: string
  source?: string
  target?: string
  recipeId?: import("./types").RecipeId
  sceneId?: string
  npcId?: import("./types").NpcId
  tacticId?: TacticId
}
export interface BattleFrame {
  before: Battle
  battle: Battle
  event: BattleEvent
}
export interface BattlePresentation {
  battleId: string
  sequence: number
  before: Battle
  frames: BattleFrame[]
}
export function cardCost(p: Combatant, card: GameCard) {
  return Math.max(
    0,
    card.cost - (p.chainSchool === card.school && !p.resonanceUsed ? 1 : 0),
  )
}
export function playError(b: Battle, index: number, branch?: PlayAction["branch"]): string | null {
  const original = CARD_MAP[b.player.hand[index]]
  if (!original) return "Lá bài không còn trên tay."
  if (b.opening) return "Hãy xác nhận bài mở đầu."
  if (b.tactic?.status === "pending") return "Hãy chọn cách ứng biến trước."
  if (b.result) return "Trận đấu đã kết thúc."
  const errors = (branch ? [branch] : cardBranches(original)).map(option => {
    const card = flavoredCard(original, option)
    if (cardCost(b.player, card) > b.player.mana) return "Chưa đủ năng lượng."
    if (card.kind === "unit" && b.player.board.length >= 3) return "Sân đã đủ 3 đồng minh."
    if (["buff", "ward"].includes(card.effect ?? "") && !b.player.board.length) return "Cần một đồng minh trên sân."
    return abilityError(b.player, card) ?? flavorError(b, "player", card)
  })
  return errors.some(error => error === null) ? null : errors[0]
}
function flavorError(b: Battle, side: "player" | "enemy", card: GameCard): string | null {
  if (card.contentVersion === 400 && (b.rulesVersion ?? 350) < 400) return "Trận cũ giữ luật 3.5; thẻ này dùng trong trận mới."
  const pending = b.pendingFlavors ?? []
  if (card.ability?.startsWith("steep-") && pending.filter(effect => effect.owner === side).length >= 2) return "Phe bạn đã có 2 Ủ vị đang chờ."
  if (card.ability === "unsteep" && !pending.some(effect => effect.owner !== side)) return "Địch chưa có Ủ vị để gỡ."
  if (card.ability === "thaw" && !b[side].board.length) return "Cần một đồng minh để dùng khăn ấm."
  return null
}
function steep(b: Battle, side: "player" | "enemy", card: GameCard) {
  const sequence = (b.flavorSequence ?? 0) + 1
  b.flavorSequence = sequence
  const target = card.ability === "steep-unit" ? weakest(b[side]) : undefined
  b.pendingFlavors = [...(b.pendingFlavors ?? []), { id: `${b.id}:flavor:${sequence}`, owner: side, cardId: card.id,
    effect: card.ability === "steep-unit" ? "buff" : "heal", power: card.power ?? 0,
    ...(target ? { targetUid: target.uid } : {}), executeRound: b.round + 1, sequence }]
  log(b, `♨ ${card.name} · chờ đến đầu lượt sau${target ? `, giữ ${CARD_MAP[target.cardId].name} trên sân` : ""}.`)
}
function resolveSteeping(b: Battle, side: "player" | "enemy", record?: (event: BattleEvent) => void) {
  const due = (b.pendingFlavors ?? []).filter(effect => effect.owner === side && effect.executeRound <= b.round)
    .sort((a, z) => a.executeRound - z.executeRound || a.sequence - z.sequence)
  for (const effect of due) {
    if (b.result) break
    b.pendingFlavors = b.pendingFlavors!.filter(other => other.id !== effect.id)
    const target = b[side].board.find(unit => unit.uid === effect.targetUid && unit.health > 0)
    if (effect.effect === "buff" && target) empower(target, effect.power, effect.power)
    if (effect.effect === "heal") { restore(b, side, effect.power + (side === "player" && b.expedition?.relics.includes("v4-pot-lid") ? 1 : 0)); mendUnits(b[side], 2) }
    const label = `♨ ${CARD_MAP[effect.cardId].name} · ${effect.effect === "buff" && !target ? "mục tiêu đã rời sân" : "Ủ vị đã nở"}`
    log(b, label); checkResult(b)
    record?.({ kind: "rule", side, cardId: effect.cardId, target: target?.uid, label })
  }
}
interface BattleResult {
  battle: Battle
  error: string | null
  frames: BattleFrame[]
}
const clone = <T>(value: T): T => structuredClone(value)
function shuffle<T>(items: T[], rng: () => number): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
function log(b: Battle, message: string) {
  b.log = [...b.log, message].slice(-40)
}
function checkResult(b: Battle) {
  const fallen = (["player", "enemy"] as const).flatMap(side =>
    b[side].board.filter(u => u.health <= 0).map(unit => ({ side, unit })))
  // Remove both sides first: death-trigger draws cannot process a corpse twice.
  for (const side of ["player", "enemy"] as const) {
    const p = b[side]
    p.graveyard = [...(p.graveyard ?? []), ...p.board.filter(u => u.health <= 0).map(u => u.cardId)].slice(-36)
    p.board = p.board.filter(u => u.health > 0)
  }
  for (const { side, unit } of fallen) {
    const card = CARD_MAP[unit.cardId]
    if (card.ability === "pantry") restore(b, side, 3)
    if (card.ability === "farewell") draw(b, side, 1)
    if (["pantry", "farewell"].includes(card.ability ?? "")) log(b, `✦ ${card.name} · kích ký ức khi bị hạ.`)
  }
  b.result = battleOutcome(b)
}
function restore(b: Battle, side: "player" | "enemy", amount: number) {
  const p = b[side], actual = Math.max(0, Math.min(amount, p.maxHealth - p.health))
  p.health += actual
  if (actual) for (const u of p.board) {
    if (u.health > 0 && CARD_MAP[u.cardId].ability === "bloom" && (u.triggers ?? 0) < 2) {
      u.attack++; u.triggers = (u.triggers ?? 0) + 1
      log(b, `✦ ${CARD_MAP[u.cardId].name} · hồi phục nở +1 công.`)
    }
  }
}
const weakest = (p: Combatant) => [...p.board].filter(u => u.health > 0).sort((a, z) => a.health - z.health || a.uid.localeCompare(z.uid))[0]
const diverseSchools = (p: Combatant) => new Set(p.board.filter(u => u.health > 0).map(u => CARD_MAP[u.cardId].school)).size
function memoryIndex(p: Combatant) {
  const memories = p.graveyard ?? []
  for (let index = memories.length - 1; index >= 0; index--) if (CARD_MAP[memories[index]]?.kind === "unit" && CARD_MAP[memories[index]].cost <= 4) return index
  return -1
}
function abilityError(p: Combatant, card: GameCard): string | null {
  if (card.ability === "offering" && p.board.length < 2) return "Cần ít nhất 2 đồng minh để hy sinh và giữ lại người nhận sức mạnh."
  if (card.ability === "revive" && (p.board.length >= 3 || memoryIndex(p) < 0)) return "Cần một ô trống và đồng minh giá tối đa 4 đã bị hạ."
  return null
}
function revive(b: Battle, side: "player" | "enemy") {
  const p = b[side], index = memoryIndex(p)
  if (p.board.length >= 3 || index < 0) return
  const id = p.graveyard!.splice(index, 1)[0], card = CARD_MAP[id]
  p.board.push({ uid: `u${b.nextUid++}`, cardId: id, attack: card.attack, health: Math.min(2, card.health),
    maxHealth: card.health, shield: card.keywords.includes("shield") ? 1 : 0, ready: false, keywords: [...card.keywords] })
  log(b, `✦ Tái triệu hồi ${card.name} · ký ức trở lại, không kích hiệu ứng vào sân.`)
}
function mendUnits(p: Combatant, amount: number) {
  p.board.filter(u => u.health > 0).forEach(u => { u.health = Math.min(u.maxHealth, u.health + amount) })
}
function empower(u: BattleUnit, attack: number, health: number) { u.attack += attack; u.health += health; u.maxHealth += health }
function unitAbility(b: Battle, side: "player" | "enemy", card: GameCard) {
  const p = b[side], foe = b[side === "player" ? "enemy" : "player"], entered = p.board.at(-1)!
  if (card.ability === "ambush") {
    const target = [...foe.board].filter(u => u.health < u.maxHealth).sort((a, z) => a.health - z.health)[0]
    if (target) hurt(target, 2)
  }
  if (card.ability === "scout" && p.hand.length <= 3) draw(b, side)
  if (card.ability === "snare") {
    const target = [...foe.board].sort((a, z) => z.attack - a.attack)[0]
    if (target) target.attack = Math.max(0, target.attack - 1)
  }
  if (card.ability === "mender") mendUnits(p, 2)
  if (card.ability === "host") p.board.filter(u => u.uid !== entered.uid).forEach(u => u.shield++)
  if (card.ability === "welcome" && diverseSchools(p) >= 3) p.board.forEach(u => u.attack++)
}
function spellAbility(b: Battle, side: "player" | "enemy", card: GameCard, target: Target | undefined, power: number): boolean {
  const p = b[side], foe = b[side === "player" ? "enemy" : "player"], ally = weakest(p)
  const strike = (amount: number, pierce = false) => {
    if (target === "hero") foe.health -= amount
    else { const u = foe.board.find(u => u.uid === target)!; if (pierce) u.health -= amount; else hurt(u, amount) }
  }
  switch (card.ability) {
    case "tea-mend": restore(b, side, power); mendUnits(p, 1); break
    case "steep-unit": case "steep-heal": steep(b, side, card); break
    case "unsteep": b.pendingFlavors = (b.pendingFlavors ?? []).filter(effect => effect.id !== target); break
    case "thaw": if (side === "player" && b.expedition?.relics.includes("v4-dry-towel")) draw(b, side); p.board.forEach(unit => { unit.health = Math.min(unit.maxHealth, unit.health + power); if (unit.icedThisTurn) unit.ready = true; unit.frozen = false; unit.icedThisTurn = false }); break
    case "wok": {
      strike(power)
      const splash = [...foe.board].filter(u => u.health > 0 && u.uid !== target).sort((a, z) => a.health - z.health)[0]
      if (splash) hurt(splash, 1)
      break
    }
    case "pierce": strike(power, true); break
    case "desperation": strike(power + (p.health <= p.maxHealth / 2 ? 4 : 0)); break
    case "wash": if (target !== "hero") foe.board.find(u => u.uid === target)!.shield = 0; strike(power); break
    case "starlight": strike(power + Math.min(2, p.spellsThisTurn ?? 0) * 2); break
    case "insight": draw(b, side, power); if (diverseSchools(p) >= 3) p.mana = Math.min(p.maxMana, p.mana + 1); break
    case "revive": revive(b, side); break
    case "mend": case "feast": restore(b, side, power); mendUnits(p, card.ability === "mend" ? 2 : 3); break
    case "rebloom": restore(b, side, power); revive(b, side); break
    case "root": {
      p.board.forEach(u => u.shield += power)
      const guard = [...p.board].sort((a, z) => z.health - a.health)[0]
      if (!guard.keywords.includes("guard")) guard.keywords.push("guard")
      break
    }
    case "sharp": empower([...p.board].sort((a, z) => a.attack - z.attack)[0], power, power); break
    case "diverse": { const schools = diverseSchools(p), bonus = schools >= 2 ? 1 : 0; p.board.forEach(u => { empower(u, power + bonus, power + bonus); if (schools >= 3) u.shield++ }); break }
    case "bulwark": ally.shield += power; if (!ally.keywords.includes("guard")) ally.keywords.push("guard"); break
    case "offering": ally.health = 0; checkResult(b); p.board.forEach(u => empower(u, power, 3)); break
    case "veil": p.board.forEach(u => u.shield += power); if ((p.spellsThisTurn ?? 0) > 0) draw(b, side); break
    case "dream": {
      restore(b, side, power)
      const sleeper = [...foe.board].sort((a, z) => z.attack - a.attack)[0]
      if (sleeper) sleeper.frozen = true
      break
    }
    case "moonward": p.board.forEach(u => u.shield += power); if (p.board.length === 3) draw(b, side); break
    default: return false
  }
  return true
}
function afterSpell(b: Battle, side: "player" | "enemy", card: GameCard) {
  if (card.choices && side === "player" && b.expedition?.relics.includes("v4-menu")) { const target = weakest(b.player); if (target) target.shield++ }
  const p = b[side]
  p.spellsThisTurn = (p.spellsThisTurn ?? 0) + 1
  for (const u of p.board.filter(u => u.health > 0 && (u.triggers ?? 0) < 2)) {
    const ability = CARD_MAP[u.cardId].ability
    if (ability === "spellfire") u.attack++
    else if (ability === "weaver") { const target = weakest(p); if (target) target.shield++ }
    else if (ability === "season-host" && card.choices && (u.triggers ?? 0) < 1) draw(b, side)
    else continue
    u.triggers = (u.triggers ?? 0) + 1
    log(b, `✦ ${CARD_MAP[u.cardId].name} · cộng hưởng phép.`)
  }
}
function draw(b: Battle, side: "player" | "enemy", count = 1) {
  const p = b[side]
  for (let i = 0; i < count; i++) {
    const id = p.deck.shift()
    if (!id) {
      p.fatigue++
      p.health -= p.fatigue
      log(
        b,
        `${
          side === "player" ? "Bạn" : b.opponent
        } chịu ${p.fatigue} sát thương kiệt sức.`,
      )
    } else if (p.hand.length < 8) p.hand.push(id)
    else log(b, `${CARD_MAP[id].name} bị bỏ vì tay bài đã đủ 8 lá.`)
  }
  checkResult(b)
}
function combatant(deck: string[], health: number): Combatant {
  return {
    health,
    maxHealth: health,
    mana: 1,
    maxMana: 1,
    deck,
    hand: [],
    board: [],
    fatigue: 0,
    chainSchool: null,
    resonanceUsed: false,
    recipeTrail: [],
    recipesUsed: [],
    graveyard: [],
    spellsThisTurn: 0,
  }
}
export function opponentDeck(
  stageId: string | null,
  rng: () => number,
  rulesVersion = 350,
): string[] {
  const stage = stageId ? STAGE_MAP[stageId] : undefined
  const catalog = cardsForRules(stage && stage.index >= 18 ? rulesVersion : 350)
  const school = stage?.chapter.school ?? "ember"
  const maxCost = stage ? Math.min(6, 3 + Math.floor(stage.index / 3)) : 5
  const finale = stage?.chapter.id === "last-table"
  const themed = catalog.filter(
    (c) =>
      c.cost <= maxCost &&
      (finale || c.school === school) &&
      c.rarity !== "legendary",
  )
  const low = shuffle(
    catalog.filter((c) => c.kind === "unit" && c.cost <= 2),
    rng,
  ).slice(0, 3)
  const units = shuffle(
    themed.filter((c) => c.kind === "unit" && !low.some((l) => l.id === c.id)),
    rng,
  ).slice(0, 4)
  const spells = shuffle(
    themed.filter((c) => c.kind === "spell"),
    rng,
  ).slice(0, 2)
  const list = [...low, ...units, ...spells]
  for (const card of catalog)
    if (
      list.length < 9 &&
      card.cost <= maxCost &&
      !list.some((c) => c.id === card.id)
    )
      list.push(card)
  const ids = list.flatMap((c) => [c.id, c.id]).slice(0, 18)
  if (stage?.boss && CARD_MAP[stage.rewardCard])
    ids[ids.length - 1] = stage.rewardCard
  return ids
}
export function startBattle(
  deck: string[],
  stageId: string | null,
  choice: "courage" | "wisdom" = "courage",
  rng = Math.random,
  offerMulligan = false,
  rulesVersion: 350 | 400 = 400,
): Battle {
  const stage = stageId ? STAGE_MAP[stageId] : undefined
  const b: Battle = {
    rulesVersion,
    ...(stage && stage.index >= 18 ? { livingRulesVersion: 2 as const } : {}),
    pendingFlavors: [],
    flavorSequence: 0,
    id: crypto.randomUUID(),
    enemyChallenge: ENEMY_CHALLENGE,
    stageId,
    opponent: stage?.opponent ?? "Đầu bếp du hành",
    round: 1,
    player: combatant(shuffle(deck, rng), choice === "courage" ? 34 : 32),
    enemy: combatant(
      shuffle(opponentDeck(stageId, rng, rulesVersion), rng),
      challengeStat(stage ? 25 + Math.floor(stage.index / 3) * 2 + (stage.boss ? 3 : 0) : 30),
    ),
    log: ["Thử thách +30% ý chí chủ tướng địch. Triệu hồi thẻ, chọn mục tiêu rồi kết thúc lượt."],
    result: null,
    settled: false,
    nextUid: 1,
    tactic: { status: "waiting" },
    opening: offerMulligan,
    openingGiftUsed: false,
    pendingScenes: [],
    seenScenes: [],
  }
  // Both sides get 1 energy on their first turn. The AI's first turn has not begun yet.
  b.enemy.mana = 0
  b.enemy.maxMana = 0
  draw(b, "player", choice === "wisdom" ? 5 : 4)
  draw(b, "enemy", 4)
  return b
}
function hurt(unit: BattleUnit, amount: number): number {
  const blocked = Math.min(unit.shield, amount)
  unit.shield -= blocked
  const actual = Math.min(unit.health, amount - blocked)
  unit.health -= amount - blocked
  return actual
}
function play(
  b: Battle,
  side: "player" | "enemy",
  index: number,
  target?: Target,
  branch?: PlayAction["branch"],
): string | null {
  const p = b[side],
    foe = b[side === "player" ? "enemy" : "player"]
  const id = p.hand[index], original = CARD_MAP[id]
  if (!Number.isInteger(index) || !original) return "Lá bài không còn trên tay."
  if (original.choices && !branch) return "Hãy chọn một nhánh Nêm vị trước khi xác nhận."
  const card = flavoredCard(original, branch)
  const flavorIssue = flavorError(b, side, card)
  if (flavorIssue) return flavorIssue
  if (card.ability === "unsteep" && !(b.pendingFlavors ?? []).some(effect => effect.id === target && effect.owner !== side)) return "Hãy chọn đúng một Ủ vị đang chờ của địch."
  const cost = cardCost(p, card)
  if (cost > p.mana) return "Không đủ năng lượng."
  if (card.kind === "unit" && p.board.length >= 3)
    return "Sân đã đủ 3 đồng minh."
  if (
    card.kind === "spell" &&
    (card.effect === "ward" || card.effect === "buff") &&
    !p.board.length
  )
    return "Cần ít nhất một đồng minh trên sân."
  if (
    card.kind === "spell" &&
    card.effect === "damage" &&
    target !== "hero" &&
    !foe.board.some((u) => u.uid === target)
  )
    return "Hãy chọn một mục tiêu địch."
  const abilityIssue = abilityError(p, card)
  if (abilityIssue) return abilityIssue
  const resonated = cost < card.cost
  p.mana -= cost
  if (resonated) p.resonanceUsed = true
  p.chainSchool = card.school
  p.hand.splice(index, 1)
  p.recipeTrail = [...(p.recipeTrail ?? []), card.id].slice(-2)
  const relics = side === "player" ? (b.expedition?.relics ?? []) : []
  const bonus =
    relics.includes("old-recipe") &&
    card.kind === "spell" &&
    (card.effect === "damage" || card.effect === "sweep")
      ? 1
      : relics.includes("tea-cup") && card.effect === "heal"
        ? 2
        : 0
  const power = (card.power ?? 1) + bonus
  if (card.kind === "unit") {
    const synergy = p.board.some(
      (u) => CARD_MAP[u.cardId].school === card.school,
    )
    const healthBonus = relics.includes("hearth-apron") ? 1 : 0
    const attackBonus =
      (relics.includes("ember-pin") && card.school === "ember" ? 1 : 0) +
      (side === "enemy" ? (b.expedition?.enemyBoost ?? 0) : 0)
    const bootRush =
      relics.includes("traveler-boots") && b.expedition?.summoned === 0
    const openingWard =
      side === "player" &&
      b.sideQuest &&
      b.companion?.choice === "share" &&
      !b.openingGiftUsed
        ? 1
        : 0
    if (openingWard) b.openingGiftUsed = true
    p.board.push({
      uid: `u${b.nextUid++}`,
      cardId: id,
      attack: card.attack + attackBonus,
      health: card.health + healthBonus,
      maxHealth: card.health + healthBonus,
      shield:
        (card.keywords.includes("shield") ? 1 : 0) +
        (synergy ? 1 : 0) +
        openingWard +
        (relics.includes("sugar-crystal") ? 1 : 0),
      ready: card.keywords.includes("rush") || bootRush,
      keywords: [
        ...card.keywords,
        ...(bootRush && !card.keywords.includes("rush")
          ? ["rush" as const]
          : []),
      ],
    })
    if (side === "player" && b.expedition) b.expedition.summoned++
    if (card.effect === "heal")
      restore(b, side, power)
    if (card.effect === "draw") draw(b, side, power)
    unitAbility(b, side, card)
    log(
      b,
      `${side === "player" ? "Bạn" : b.opponent} triệu hồi ${card.name}${
        synergy ? " · Đồng hệ +1 lá chắn" : ""
      }.`,
    )
  } else {
    if (!spellAbility(b, side, card, target, power)) {
      if (card.effect === "sweep") foe.board.forEach((u) => hurt(u, power))
      if (card.effect === "damage") {
        if (target === "hero") foe.health -= power
        else hurt(foe.board.find((u) => u.uid === target)!, power)
      }
      if (card.effect === "heal")
        restore(b, side, power)
      if (card.effect === "draw") draw(b, side, power)
      if (card.effect === "buff")
        p.board.forEach((u) => {
          u.attack += power
          u.health += power
          u.maxHealth += power
        })
      if (card.effect === "ward")
        p.board.forEach((u) => {
          u.shield += power
        })
    }
    afterSpell(b, side, card)
    log(b, `${side === "player" ? "Bạn" : b.opponent} dùng ${card.name}.`)
  }
  if (resonated)
    log(b, "✦ Cộng hưởng cùng hệ · Giảm 1 năng lượng (mỗi lượt một lần).")
  checkResult(b)
  return null
}
function resolveRecipe(
  b: Battle,
  side: "player" | "enemy",
  cardId: string,
  record: (event: BattleEvent) => void,
  playedCard = CARD_MAP[cardId],
) {
  if (b.result) return
  const p = b[side],
    foe = b[side === "player" ? "enemy" : "player"]
  const recipe = recipeReady(
    { ...p, recipeTrail: (p.recipeTrail ?? []).slice(0, -1) },
    playedCard,
  )
  if (!recipe) return
  p.recipesUsed = [...(p.recipesUsed ?? []), recipe.id]
  if (recipe.id === "home") {
    restore(b, side, 3)
    p.board.forEach((u) => u.shield++)
  }
  if (recipe.id === "street") {
    foe.health--
    draw(b, side, 1)
  }
  if (recipe.id === "tet")
    p.board.forEach((u) => {
      u.attack++
      u.shield++
    })
  if (recipe.id === "coast") {
    const sleeper = [...foe.board].sort((a, z) => z.attack - a.attack)[0]
    if (sleeper) sleeper.frozen = true
    else draw(b, side)
  }
  if (recipe.id === "garden") {
    mendUnits(p, 2)
    const ally = weakest(p)
    if (ally) ally.attack++
  }
  if (recipe.id === "moon") { p.board.forEach(u => u.shield++); draw(b, side) }
  b.tableAura = { id: recipe.id, untilRound: b.round + 1 }
  if (side === "player")
    b.comboCounts = {
      ...b.comboCounts,
      [recipe.id]: (b.comboCounts?.[recipe.id] ?? 0) + 1,
    }
  log(b, `✦ COMBO ${recipe.name} · ${recipe.reward}`)
  checkResult(b)
  record({
    kind: "combo",
    side,
    cardId,
    recipeId: recipe.id,
    label: `COMBO · ${recipe.name}`,
  })
}
function assist(b: Battle, record: (event: BattleEvent) => void) {
  const companion = b.companion
  if (!companion || companion.used || b.round < 3 || b.result) return
  companion.used = true
  const p = b.player,
    share = companion.choice === "share"
  if (companion.id === "bach") {
    if (share) p.board.forEach((u) => (u.shield += 2))
    else restore(b, "player", 3)
  }
  if (companion.id === "nhien") {
    if (share) b.enemy.health -= 2
    else {
      p.board.forEach((u) => u.shield++)
      draw(b, "player")
    }
  }
  if (companion.id === "moc") {
    restore(b, "player", share ? 4 : 2)
    if (!share) p.board.forEach((u) => u.shield++)
  }
  if (companion.id === "hai") {
    draw(b, "player", share ? 2 : 1)
    if (!share) restore(b, "player", 2)
  }
  if (companion.id === "lien") {
    if (share) {
      p.board.forEach((u) => u.shield++)
      b.enemy.health--
    } else {
      restore(b, "player", 2)
      draw(b, "player")
    }
  }
  checkResult(b)
  record({
    kind: "assist",
    side: "player",
    npcId: companion.id,
    label: "Người đồng hành giữ một góc bàn cho bạn",
  })
  const sceneId = `assist:${companion.id}`
  queueScene(b, sceneId)
  record({
    kind: "scene",
    side: "player",
    sceneId,
    npcId: companion.id,
    label: "Lời hứa bên bếp",
  })
}
function attack(
  b: Battle,
  side: "player" | "enemy",
  uid: string,
  target: Target,
): string | null {
  const p = b[side],
    foe = b[side === "player" ? "enemy" : "player"]
  const attacker = p.board.find((u) => u.uid === uid)
  if (!attacker || !attacker.ready) return "Đồng minh chưa sẵn sàng tấn công."
  const defender = foe.board.find((u) => u.uid === target)
  if (target !== "hero" && !defender) return "Mục tiêu không còn trên sân."
  const guards = foe.board.filter((u) => u.keywords.includes("guard"))
  if (guards.length && !defender?.keywords.includes("guard"))
    return "Phải đánh Hộ vệ trước."
  attacker.ready = false
  let actual: number
  if (defender) {
    actual = hurt(defender, attacker.attack)
    const counter = hurt(attacker, defender.attack)
    if (defender.keywords.includes("drain"))
      restore(b, side === "player" ? "enemy" : "player", counter)
  } else {
    actual = Math.min(foe.health, attacker.attack)
    foe.health -= attacker.attack
  }
  if (attacker.keywords.includes("drain"))
    restore(b, side, actual)
  log(
    b,
    `${CARD_MAP[attacker.cardId].name} đánh ${
      defender ? CARD_MAP[defender.cardId].name : "chủ tướng"
    } (${actual} sát thương).`,
  )
  checkResult(b)
  return null
}
function nextTurn(b: Battle, side: "player" | "enemy", record?: (event: BattleEvent) => void) {
  const p = b[side]
  p.chainSchool = null
  p.recipeTrail = []
  p.recipesUsed = []
  p.resonanceUsed = false
  p.spellsThisTurn = 0
  p.maxMana = Math.min(7, p.maxMana + 1)
  p.mana = p.maxMana
  p.board.forEach((u) => {
    if ((b.rulesVersion ?? 350) >= 400) u.icedThisTurn = !!u.frozen
    u.ready = !u.frozen
    u.frozen = false
    u.triggers = 0
  })
  if (side === "player" && b.expedition?.relics.includes("grove-seed"))
    restore(b, side, 1)
  resolveSteeping(b, side, record)
  if (!b.result) draw(b, side)
}
function chooseDamageTarget(card: GameCard, foe: Combatant, caster: Combatant): Target {
  const power = (card.power ?? 0) + (card.ability === "desperation" && caster.health <= caster.maxHealth / 2 ? 4 : 0)
    + (card.ability === "starlight" ? Math.min(2, caster.spellsThisTurn ?? 0) * 2 : 0)
  if (foe.health <= power) return "hero"
  const bypassesShield = card.ability === "pierce" || card.ability === "wash"
  const kill = foe.board
    .filter((u) => u.health + (bypassesShield ? 0 : u.shield) <= power)
    .sort((a, z) => z.attack - a.attack)[0]
  return kill?.uid ?? "hero"
}
function enemyTurn(b: Battle, record: (event: BattleEvent) => void) {
  nextTurn(b, "enemy", record)
  record({
    kind: "turn",
    side: "enemy",
    label: `${b.opponent} · Rút bài, hồi năng lượng`,
  })
  const rule = battleRule(b)
  if (rule && !b.result) {
    const empowered = b.enemy.health <= b.enemy.maxHealth / 2
    const strength = empowered ? 2 : 1
    const effect =
      rule.effect === "cycle"
        ? ["burn", "heal", "draw"][(b.round - 1) % 3]
        : rule.effect
    if (effect === "burn") b.player.health -= strength
    if (effect === "heal")
      restore(b, "enemy", strength * 2)
    if (effect === "draw") draw(b, "enemy", strength)
    if (effect === "steep" && (b.pendingFlavors ?? []).filter(e=>e.owner === "enemy").length < 2)
      steep(b,"enemy",CARD_MAP["v4-rain-seed"])
    if (effect === "edit") {
      const oldest=(b.pendingFlavors ?? []).filter(e=>e.owner === "player").sort((a,z)=>a.sequence-z.sequence)[0]
      if(oldest) b.pendingFlavors=b.pendingFlavors!.filter(e=>e.id !== oldest.id)
      draw(b,"enemy",strength)
    }
    if (effect === "shield")
      b.enemy.board.forEach((u) => {
        u.shield += strength
      })
    checkResult(b)
    log(
      b,
      `${rule.name}${empowered ? " · THỨC TỈNH" : ""}: ${
        effect === "steep" ? "Đặt Chậu mầm bên bếp; hồi 4 ở lượt địch kế nếu không bị gỡ" : effect === "edit" ? `Gỡ một Ủ vị lâu nhất của bạn; rút ${strength} lá` : effect === "burn"
          ? `Gây ${strength} sát thương lên bạn`
          : effect === "heal"
            ? `Hồi ${strength * 2} máu cho boss`
            : effect === "draw"
              ? `Boss rút ${strength} lá`
              : `Đồng minh boss nhận ${strength} lá chắn`
      }.`,
    )
    record({ kind: "rule", side: "enemy", label: b.log[b.log.length - 1] })
  }
  if (b.result) return
  for (let steps = 0; steps < 12 && !b.result; steps++) {
    const p = b.enemy
    const options = p.hand
      .flatMap((id, index) => cardBranches(CARD_MAP[id]).map(branch => ({ card: flavoredCard(CARD_MAP[id], branch), index, branch })))
      .filter(
        ({ card }) =>
          !abilityError(p, card) && !flavorError(b, "enemy", card) &&
          cardCost(p, card) <= p.mana &&
          (card.kind !== "unit" || p.board.length < 3) &&
          ((card.effect !== "buff" && card.effect !== "ward") ||
            p.board.length > 0) &&
          (card.kind !== "spell" ||
            card.effect !== "draw" || card.ability === "revive" ||
            (p.hand.length <= 5 && p.deck.length > 0)) &&
          (card.kind === "unit" ||
            card.effect !== "heal" ||
            p.health < p.maxHealth || card.ability === "dream" && b.player.board.length > 0 ||
            ["mend", "feast"].includes(card.ability ?? "") && p.board.some(u => u.health < u.maxHealth) ||
            card.ability === "rebloom" && p.board.length < 3 && memoryIndex(p) >= 0) &&
          (card.effect !== "sweep" || b.player.board.length > 0),
      )
    options.sort((a, z) => {
      const score = (c: GameCard) =>
        c.kind === "unit"
          ? c.cost + 3
          : c.effect === "damage"
            ? c.cost + 2
            : c.cost
      return score(z.card) - score(a.card)
    })
    if (!options.length) break
    const { card, index, branch } = options[0]
    const source = card.kind === "unit" ? `u${b.nextUid}` : undefined
    const target =
      card.ability === "unsteep" ? b.pendingFlavors?.find(effect => effect.owner === "player")?.id : card.effect === "damage" ? chooseDamageTarget(card, b.player, p) : undefined
    if (play(b, "enemy", index, target, branch)) break
    record({
      kind: "play",
      side: "enemy",
      cardId: card.id,
      source,
      target,
      label: `${b.opponent} dùng ${card.name}`,
    })
    resolveRecipe(b, "enemy", card.id, record, card)
  }
  for (const uid of b.enemy.board.filter((u) => u.ready).map((u) => u.uid)) {
    if (b.result) break
    const attacker = b.enemy.board.find((u) => u.uid === uid)!
    const guards = b.player.board.filter((u) => u.keywords.includes("guard"))
    const kill = b.player.board.find(
      (u) =>
        u.health + u.shield <= attacker.attack &&
        u.attack < attacker.health + attacker.shield,
    )
    const target =
      guards.sort((a, z) => a.health - z.health)[0]?.uid ??
      (b.player.health <= attacker.attack ? "hero" : (kill?.uid ?? "hero"))
    attack(b, "enemy", uid, target)
    record({
      kind: "attack",
      side: "enemy",
      cardId: attacker.cardId,
      source: uid,
      target,
      label: b.log[b.log.length - 1],
    })
  }
  if (!b.result) {
    b.round++
    nextTurn(b, "player", record)
    log(b, `Lượt ${b.round} · Năng lượng được hồi đầy.`)
    if (b.tableAura && b.round > b.tableAura.untilRound) b.tableAura = undefined
    record({
      kind: "turn",
      side: "player",
      label: `Lượt ${b.round} · Đến lượt bạn`,
    })
    assist(b, record)
    if (!b.result && b.round >= 4 && b.tactic?.status === "waiting") {
      b.tactic.status = "pending"
      log(b, "Lượt 4 · Chọn một cách ứng biến cho bàn đấu.")
      record({
        kind: "objective",
        side: "player",
        label: "Một công thức mới đang chờ bạn chọn",
      })
    }
  }
}
export function actBattle(
  current: Battle,
  action: BattleAction,
  rng = Math.random,
): BattleResult {
  const invalid = (error: string): BattleResult => ({
    battle: current,
    error,
    frames: [],
  })
  if (current.result || current.settled) return invalid("Trận đấu đã kết thúc.")
  if (current.tactic?.status === "pending" && action.type !== "tactic")
    return invalid("Hãy chọn cách ứng biến trước.")
  if (action.type === "tactic") {
    const error = tacticError(current, action.id)
    if (error) return invalid(error)
  }
  if (current.opening && action.type !== "mulligan")
    return invalid("Hãy xác nhận bài mở đầu.")
  if (action.type === "mulligan" && !current.opening)
    return invalid("Chỉ được đổi bài một lần trước trận.")
  const b = clone(current)
  const frames: BattleFrame[] = []
  let before = clone(current)
  if (b.rngState !== undefined)
    rng = () => {
      b.rngState = (Math.imul(b.rngState!, 1664525) + 1013904223) >>> 0
      return b.rngState / 4294967296
    }
  const append = (event: BattleEvent) => {
    frames.push({ before, battle: clone(b), event })
    before = clone(b)
  }
  const record = (event: BattleEvent) => {
    const previous = before
    append(event)
    const objective = updateEncounter(b, previous, event)
    if (objective) {
      log(b, objective)
      append({ kind: "objective", side: "player", label: objective })
    }
    const sceneId = awakenedScene(b, previous)
    if (sceneId) {
      queueScene(b, sceneId)
      append({
        kind: "scene",
        side: "enemy",
        sceneId,
        label: "Ký ức bừng sáng giữa trận",
      })
    }
  }
  let error: string | null = null
  if (action.type === "tactic") {
    b.tactic = { status: "chosen", choice: action.id }
    if (action.id === "flame") b.player.board.forEach((u) => u.attack++)
    if (action.id === "shelter") {
      restore(b, "player", 3)
      b.player.board.forEach((u) => u.shield++)
    }
    if (action.id === "insight")
      draw(
        b,
        "player",
        Math.min(2, b.player.deck.length, 8 - b.player.hand.length),
      )
    const tactic = TACTICS.find((t) => t.id === action.id)!
    log(b, `Bạn ứng biến · ${tactic.name}: ${tactic.text}`)
    record({
      kind: "tactic",
      side: "player",
      tacticId: action.id,
      label: `ỨNG BIẾN · ${tactic.name}`,
    })
  } else if (action.type === "mulligan") {
    const indices = action.indices
    if (
      indices.length > 3 ||
      new Set(indices).size !== indices.length ||
      indices.some(
        (i) => !Number.isInteger(i) || i < 0 || i >= b.player.hand.length,
      )
    )
      return invalid("Chọn tối đa 3 lá khác nhau để đổi.")
    if (indices.length > b.player.deck.length)
      return invalid("Không còn đủ bài để đổi.")
    const returned = indices.map((i) => b.player.hand[i])
    for (const i of indices) b.player.hand[i] = b.player.deck.shift()!
    b.player.deck = shuffle([...b.player.deck, ...returned], rng)
    b.opening = false
    log(
      b,
      indices.length
        ? `Đổi ${indices.length} lá · Bắt đầu lượt của bạn.`
        : "Giữ bài mở đầu · Bắt đầu lượt của bạn.",
    )
    record({ kind: "mulligan", side: "player", label: b.log[b.log.length - 1] })
  } else if (action.type === "play") {
    const cardId = b.player.hand[action.index]
    const source =
      CARD_MAP[cardId]?.kind === "unit" ? `u${b.nextUid}` : undefined
    error = play(b, "player", action.index, action.target, action.branch)
    if (!error) {
      record({
        kind: "play",
        side: "player",
        cardId,
        source,
        target: action.target,
        label: `Bạn dùng ${CARD_MAP[cardId].name}`,
      })
      resolveRecipe(b, "player", cardId, record, flavoredCard(CARD_MAP[cardId], action.branch))
    }
  } else if (action.type === "attack") {
    const cardId = b.player.board.find((u) => u.uid === action.uid)?.cardId
    error = attack(b, "player", action.uid, action.target)
    if (!error)
      record({
        kind: "attack",
        side: "player",
        cardId,
        source: action.uid,
        target: action.target,
        label: b.log[b.log.length - 1],
      })
  } else enemyTurn(b, record)
  return error ? invalid(error) : { battle: b, error: null, frames }
}

export interface TargetPreview {
  legal: boolean
  damage: number
  counter: number
  shield: number
  defeated: boolean
  attackerDefeated: boolean
  text: string
}
export function previewTarget(
  b: Battle,
  action: PlayAction | Omit<AttackAction, "target">,
  target: string,
): TargetPreview {
  const attempted = actBattle(b, { ...action, target })
  if (attempted.error)
    return {
      legal: false,
      damage: 0,
      counter: 0,
      shield: 0,
      defeated: false,
      attackerDefeated: false,
      text: attempted.error,
    }
  const old =
    target === "hero" ? b.enemy : b.enemy.board.find((u) => u.uid === target)!
  const next =
    target === "hero"
      ? attempted.battle.enemy
      : attempted.battle.enemy.board.find((u) => u.uid === target)
  const damage = Math.min(old.health, old.health - (next?.health ?? 0))
  const shield =
    target === "hero"
      ? 0
      : (old as BattleUnit).shield -
        ((next as BattleUnit | undefined)?.shield ?? 0)
  const attacker =
    action.type === "attack"
      ? b.player.board.find((u) => u.uid === action.uid)
      : undefined
  const survivor = attacker
    ? attempted.battle.player.board.find((u) => u.uid === attacker.uid)
    : undefined
  const counter = attacker
    ? Math.min(attacker.health, attacker.health - (survivor?.health ?? 0))
    : 0
  const defeated = !next || next.health <= 0
  const attackerDefeated = !!attacker && !survivor
  const text = `${damage} sát thương${shield ? ` · Phá ${shield} chắn` : ""}${
    counter ? ` · Nhận ${counter} phản đòn` : ""
  }${defeated ? (target === "hero" ? " · Kết liễu" : " · Hạ gục") : ""}${
    attackerDefeated ? " · Đồng minh cũng bị hạ" : ""
  }`
  return {
    legal: true,
    damage,
    counter,
    shield,
    defeated,
    attackerDefeated,
    text,
  }
}
