import { CARD_MAP, CARDS } from "./catalog"
import { STAGE_MAP } from "./story"
import type { Battle, BattleUnit, Combatant, GameCard } from "./types"

export type Target = "hero" | string
interface PlayAction {
  type: "play"
  index: number
  target?: Target
}
interface AttackAction {
  type: "attack"
  uid: string
  target: Target
}
export type BattleAction = PlayAction | AttackAction | { type: "end" }
interface BattleResult {
  battle: Battle
  error: string | null
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
  b.player.board = b.player.board.filter((u) => u.health > 0)
  b.enemy.board = b.enemy.board.filter((u) => u.health > 0)
  // The attacker loses a simultaneous lethal (including fatigue).
  if (b.player.health <= 0) b.result = "loss"
  else if (b.enemy.health <= 0) b.result = "win"
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
  }
}
export function opponentDeck(
  stageId: string | null,
  rng: () => number,
): string[] {
  const stage = stageId ? STAGE_MAP[stageId] : undefined
  const school = stage?.chapter.school ?? "ember"
  const maxCost = stage ? Math.min(6, 3 + Math.floor(stage.index / 3)) : 5
  const finale = stage?.chapter.id === "last-table"
  const themed = CARDS.filter(
    (c) =>
      c.cost <= maxCost &&
      (finale || c.school === school) &&
      c.rarity !== "legendary",
  )
  const low = shuffle(
    CARDS.filter((c) => c.kind === "unit" && c.cost <= 2),
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
  for (const card of CARDS)
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
): Battle {
  const stage = stageId ? STAGE_MAP[stageId] : undefined
  const b: Battle = {
    id: crypto.randomUUID(),
    stageId,
    opponent: stage?.opponent ?? "Đầu bếp du hành",
    round: 1,
    player: combatant(shuffle(deck, rng), choice === "courage" ? 34 : 32),
    enemy: combatant(
      shuffle(opponentDeck(stageId, rng), rng),
      stage ? 25 + Math.floor(stage.index / 3) * 2 + (stage.boss ? 3 : 0) : 30,
    ),
    log: ["Trận đấu bắt đầu. Triệu hồi thẻ, chọn mục tiêu rồi kết thúc lượt."],
    result: null,
    settled: false,
    nextUid: 1,
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
): string | null {
  const p = b[side],
    foe = b[side === "player" ? "enemy" : "player"]
  const id = p.hand[index],
    card = CARD_MAP[id]
  if (!Number.isInteger(index) || !card) return "Lá bài không còn trên tay."
  if (card.cost > p.mana) return "Không đủ năng lượng."
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
  p.mana -= card.cost
  p.hand.splice(index, 1)
  const power = card.power ?? 1
  if (card.kind === "unit") {
    const synergy = p.board.some(
      (u) => CARD_MAP[u.cardId].school === card.school,
    )
    p.board.push({
      uid: `u${b.nextUid++}`,
      cardId: id,
      attack: card.attack,
      health: card.health,
      maxHealth: card.health,
      shield: (card.keywords.includes("shield") ? 1 : 0) + (synergy ? 1 : 0),
      ready: card.keywords.includes("rush"),
      keywords: [...card.keywords],
    })
    if (card.effect === "heal")
      p.health = Math.min(p.maxHealth, p.health + power)
    if (card.effect === "draw") draw(b, side, power)
    log(
      b,
      `${side === "player" ? "Bạn" : b.opponent} triệu hồi ${card.name}${
        synergy ? " · Đồng hệ +1 lá chắn" : ""
      }.`,
    )
  } else {
    if (card.effect === "damage") {
      if (target === "hero") foe.health -= power
      else hurt(foe.board.find((u) => u.uid === target)!, power)
    }
    if (card.effect === "heal")
      p.health = Math.min(p.maxHealth, p.health + power)
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
    log(b, `${side === "player" ? "Bạn" : b.opponent} dùng ${card.name}.`)
  }
  checkResult(b)
  return null
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
      foe.health = Math.min(foe.maxHealth, foe.health + counter)
  } else {
    actual = Math.min(foe.health, attacker.attack)
    foe.health -= attacker.attack
  }
  if (attacker.keywords.includes("drain"))
    p.health = Math.min(p.maxHealth, p.health + actual)
  log(
    b,
    `${CARD_MAP[attacker.cardId].name} đánh ${
      defender ? CARD_MAP[defender.cardId].name : "chủ tướng"
    } (${actual} sát thương).`,
  )
  checkResult(b)
  return null
}
function nextTurn(b: Battle, side: "player" | "enemy") {
  const p = b[side]
  p.maxMana = Math.min(7, p.maxMana + 1)
  p.mana = p.maxMana
  p.board.forEach((u) => {
    u.ready = true
  })
  draw(b, side)
}
function chooseDamageTarget(card: GameCard, foe: Combatant): Target {
  if (foe.health <= (card.power ?? 0)) return "hero"
  const kill = foe.board
    .filter((u) => u.health + u.shield <= (card.power ?? 0))
    .sort((a, z) => z.attack - a.attack)[0]
  return kill?.uid ?? "hero"
}
function enemyTurn(b: Battle) {
  nextTurn(b, "enemy")
  if (b.result) return
  for (let steps = 0; steps < 12 && !b.result; steps++) {
    const p = b.enemy
    const options = p.hand
      .map((id, index) => ({ card: CARD_MAP[id], index }))
      .filter(
        ({ card }) =>
          card.cost <= p.mana &&
          (card.kind !== "unit" || p.board.length < 3) &&
          ((card.effect !== "buff" && card.effect !== "ward") ||
            p.board.length > 0) &&
          (card.kind !== "spell" ||
            card.effect !== "draw" ||
            (p.hand.length <= 5 && p.deck.length > 0)) &&
          (card.effect !== "heal" || p.health < p.maxHealth),
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
    const { card, index } = options[0]
    play(
      b,
      "enemy",
      index,
      card.effect === "damage" ? chooseDamageTarget(card, b.player) : undefined,
    )
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
  }
  if (!b.result) {
    b.round++
    nextTurn(b, "player")
    log(b, `Lượt ${b.round} · Năng lượng được hồi đầy.`)
  }
}
export function actBattle(current: Battle, action: BattleAction): BattleResult {
  if (current.result || current.settled)
    return { battle: current, error: "Trận đấu đã kết thúc." }
  const b = clone(current)
  let error: string | null = null
  if (action.type === "play")
    error = play(b, "player", action.index, action.target)
  else if (action.type === "attack")
    error = attack(b, "player", action.uid, action.target)
  else enemyTurn(b)
  return error ? { battle: current, error } : { battle: b, error: null }
}
