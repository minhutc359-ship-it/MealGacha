import { TACTICAL_CARD_MAP } from "../cards"
import {
  cardLog,
  drawCards,
  emptyCardCell,
  recordFallenCards,
} from "./cardRuntime"
import { directedReadiness, directedTargets } from "./directedRules"
import type {
  BattleSide,
  BattleTrap,
  BattleUnit,
  DirectedEvent,
  DirectedIntent,
  DirectedReaction,
  TacticalBattleAction,
  TacticalBattleState,
} from "./types"

type Core = (
  s: TacticalBattleState,
  a: TacticalBattleAction,
) => TacticalBattleState
type Finish = (s: TacticalBattleState) => void
const other = (side: BattleSide): BattleSide =>
  side === "player" ? "enemy" : "player"
const living = (s: TacticalBattleState, side: BattleSide) =>
  s.units.filter((u) => u.side === side && !u.defeated)
const actor = (s: TacticalBattleState, a: DirectedIntent): BattleSide =>
  a.type === "play-card"
    ? a.side
    : s.units.find((u) => u.instanceId === a.unitId)!.side
const cardIdOf = (s: TacticalBattleState, a: DirectedIntent) =>
  a.type === "play-card"
    ? s.cardGame!.sides[a.side].hand[a.handIndex]
    : (s.units.find((u) => u.instanceId === a.unitId)?.cardId ?? null)
const sourceOf = (s: TacticalBattleState, a: DirectedIntent) =>
  a.type === "play-card" ? `hero:${a.side}` : a.unitId
function remember(s: TacticalBattleState, id: string) {
  if (!s.processedActionIds.includes(id)) s.processedActionIds.push(id)
}
function event(s: TacticalBattleState, e: Omit<DirectedEvent, "id">) {
  s.cardGame!.directed!.event = {
    ...e,
    id: s.processedActionIds[s.processedActionIds.length - 1],
  }
}
function hurt(u: BattleUnit, n: number) {
  const shield = Math.min(n, u.shield)
  u.shield -= shield
  u.hp = Math.max(0, u.hp - n + shield)
  u.defeated = u.hp === 0
}
function settle(
  before: TacticalBattleState,
  s: TacticalBattleState,
  finish: Finish,
) {
  recordFallenCards(before, s)
  for (const side of ["player", "enemy"] as const)
    if (s.commanders[side].hp > before.commanders[side].hp)
      for (const u of living(s, side).filter(
        (u) => u.cardId && TACTICAL_CARD_MAP[u.cardId].ability === "bloom",
      )) {
        const key = `bloom:${s.round}`
        u.triggers ??= {}
        if ((u.triggers[key] ?? 0) < 2) {
          u.attack += 6
          u.triggers[key] = (u.triggers[key] ?? 0) + 1
        }
      }
  finish(s)
}
function reaction(
  s: TacticalBattleState,
  a: DirectedIntent,
  stage: "before" | "after",
  before = s,
): DirectedReaction | null {
  const owner = other(actor(before, a)),
    t = s.traps.find((t) => t.side === owner && t.armed && t.cardId)
  if (!t) return null
  const cardId = cardIdOf(before, a),
    c = cardId ? TACTICAL_CARD_MAP[cardId] : null
  let affectedUnitId: string | null = null,
    valid = false
  if (stage === "before") {
    if (a.type === "play-card")
      valid = t.cardId === "trap-seal" && c?.kind === "spell" && c.cost >= 2
    else {
      affectedUnitId = a.targetId ?? null
      valid =
        t.cardId === "trap-mirror" ||
        t.cardId === "trap-embers" ||
        (t.cardId === "trap-lid" && a.targetId === `hero:${owner}`) ||
        (t.cardId === "trap-ward" && !a.targetId?.startsWith("hero:"))
    }
  } else if (a.type === "play-card" && c?.kind === "unit") {
    const born = living(s, actor(before, a)).find(
      (u) => !before.units.some((v) => v.instanceId === u.instanceId),
    )
    affectedUnitId = born?.instanceId ?? null
    valid =
      !!born &&
      ((t.cardId === "trap-root" && c.cost >= 3) ||
        (t.cardId === "trap-pantry" && c.cost >= 4))
  } else if (a.type !== "play-card" && t.cardId === "trap-recall") {
    const dead = s.units.find(
      (u) =>
        u.side === owner &&
        u.defeated &&
        u.cardId &&
        TACTICAL_CARD_MAP[u.cardId].cost <= 4 &&
        before.units.some((v) => v.instanceId === u.instanceId && !v.defeated),
    )
    affectedUnitId = dead?.instanceId ?? null
    valid = !!dead && living(s, owner).length < 5 && !!emptyCardCell(s, owner)
  }
  return valid
    ? {
        id: `${a.id}|${t.instanceId}|${stage}`,
        trapInstanceId: t.instanceId,
        stage,
        action: structuredClone(a),
        cardId,
        affectedUnitId,
      }
    : null
}
function applyTrap(
  s: TacticalBattleState,
  p: DirectedReaction,
  finish: Finish,
) {
  const before = structuredClone(s),
    t = s.traps.find((t) => t.instanceId === p.trapInstanceId && t.armed)!
  const owner = t.side,
    foe = other(owner),
    a = p.action
  const source =
      a.type === "play-card"
        ? null
        : s.units.find((u) => u.instanceId === a.unitId),
    target = s.units.find((u) => u.instanceId === p.affectedUnitId)
  t.armed = false
  t.triggeredRound = s.round
  t.revealed = true
  cardLog(s, `Lật bẫy: ${TACTICAL_CARD_MAP[t.cardId!].name}.`)
  let blocked = false
  switch (t.cardId) {
    case "trap-lid":
      blocked = true
      break
    case "trap-mirror":
      s.commanders[foe].hp = Math.max(
        0,
        s.commanders[foe].hp -
          Math.min(4, Math.max(1, Math.ceil((source?.attack ?? 0) / 10))),
      )
      blocked = true
      break
    case "trap-embers":
      for (const u of living(s, foe).filter(
        (u) => s.cardGame!.attacks[u.instanceId] !== s.round,
      ))
        hurt(u, 12)
      blocked = !!source?.defeated
      break
    case "trap-seal":
      blocked = true
      break
    case "trap-ward":
      for (const u of living(s, owner)) u.shield += 20
      break
    case "trap-root":
      if (target) {
        hurt(target, 20)
        target.stunnedUntil = s.round + 1
      }
      break
    case "trap-pantry":
      s.commanders[owner].hp = Math.min(30, s.commanders[owner].hp + 3)
      drawCards(s, owner, 2)
      break
    case "trap-recall":
      if (target?.cardId && living(s, owner).length < 5) {
        const cell = emptyCardCell(s, owner),
          grave = s.cardGame!.sides[owner].discard,
          index = grave.lastIndexOf(target.cardId)
        if (cell && index >= 0) {
          grave.splice(index, 1)
          target.cell = cell
          target.hp = Math.min(20, target.maxHp)
          target.defeated = false
          target.shield = 0
          target.energy = 0
          target.summonedRound = s.round
          s.cardGame!.attacks[target.instanceId] = s.round
        }
      }
      break
  }
  // recordFallenCards also records this trap's single armed -> triggered discard.
  settle(before, s, finish)
  return { blocked, trapCardId: t.cardId! }
}
function spendBlocked(s: TacticalBattleState, a: DirectedIntent) {
  if (a.type === "play-card") {
    const owner = s.cardGame!.sides[a.side],
      id = owner.hand[a.handIndex],
      c = TACTICAL_CARD_MAP[id]
    owner.mana -= c.cost
    owner.hand.splice(a.handIndex, 1)
    owner.discard.push(id)
    owner.mulliganUsed = true
    cardLog(
      s,
      `${c.name} bị vô hiệu: mất lá và ${c.cost} Lửa, không kích nội tại/công thức.`,
    )
  } else {
    const u = s.units.find((u) => u.instanceId === a.unitId)!
    if (a.type === "basic") s.cardGame!.attacks[u.instanceId] = s.round
    u.energy = a.type === "ultimate" ? 25 : Math.min(100, u.energy + 25)
    cardLog(s, `${u.name}: đòn bị chặn, không hoàn lượt/Hương lực.`)
  }
  remember(s, a.id)
}
function pause(s: TacticalBattleState, p: DirectedReaction) {
  const n = structuredClone(s),
    prior = n.cardGame!.directed!.event
  n.cardGame!.directed!.pending = p
  n.phase = "reaction"
  remember(n, `intent:${p.id}`)
  event(
    n,
    p.stage === "after" && prior
      ? prior
      : {
          kind: "intent",
          side: actor(s, p.action),
          sourceId: sourceOf(s, p.action),
          cardId: p.cardId,
          targetId:
            p.action.type === "play-card" ? undefined : p.action.targetId,
          note: "CHỌN PHẢN ỨNG",
        },
  )
  return n
}
function legal(s: TacticalBattleState, a: DirectedIntent, core: Core) {
  const d = s.cardGame!.directed!
  if (s.phase !== "planning" || d.pending) return false
  if (a.type === "play-card") return a.side === d.turn && core(s, a) !== s
  const u = s.units.find((u) => u.instanceId === a.unitId && !u.defeated)
  if (
    !u ||
    u.side !== d.turn ||
    !a.targetId ||
    !directedTargets(s, u).includes(a.targetId)
  )
    return false
  const ready = directedReadiness(s, u)
  return (
    ready !== "summoning" &&
    ready !== "stunned" &&
    (a.type === "basic" ? ready === "ready" : u.energy >= 100)
  )
}
function resolve(
  current: TacticalBattleState,
  a: DirectedIntent,
  core: Core,
  finish: Finish,
  skipBefore = false,
): TacticalBattleState {
  const side = actor(current, a),
    cardId = cardIdOf(current, a),
    sourceId = sourceOf(current, a)
  let s = current,
    trapCardId: string | undefined,
    blocked = false
  const p = skipBefore ? null : reaction(s, a, "before")
  if (p) {
    const t = s.traps.find((t) => t.instanceId === p.trapInstanceId)!
    if (t.side === "player") return pause(s, p)
    s = structuredClone(s)
    const r = applyTrap(s, p, finish)
    blocked = r.blocked
    trapCardId = r.trapCardId
  }
  if (blocked) {
    spendBlocked(s, a)
    event(s, {
      kind: "negate",
      side,
      sourceId,
      cardId,
      trapCardId,
      targetId: a.targetId,
      note: "PHẢN CHẾ",
    })
    finish(s)
    return s
  }
  if (s.winner) {
    remember(s, a.id)
    return s
  }
  const before = s,
    n = core(s, a)
  if (n === s) return current
  const born = n.units.find(
    (u) => !before.units.some((v) => v.instanceId === u.instanceId),
  )
  if (born) born.summonedRound = n.round
  for (const u of n.units.filter(
    (u) =>
      !u.defeated &&
      before.units.some((v) => v.instanceId === u.instanceId && v.defeated),
  )) {
    u.summonedRound = n.round
    n.cardGame!.attacks[u.instanceId] = n.round
  }
  const ability = cardId ? TACTICAL_CARD_MAP[cardId].ability : null
  if (ability === "thaw" || (born && ability === "thawer"))
    for (const u of living(n, side)) u.stunnedUntil = 0
  if (a.type === "play-card" && ability === "reveal-trap")
    for (const t of before.traps.filter((t) => t.side !== side && t.armed)) {
      const restored = n.traps.find((v) => v.instanceId === t.instanceId)!
      restored.armed = true
      restored.revealed = true
      const grave = n.cardGame!.sides[t.side].discard,
        index = grave.lastIndexOf(t.cardId!)
      if (index >= 0) grave.splice(index, 1)
    }
  const upgraded = n.units.find((u) =>
    before.units.some((v) => v.instanceId === u.instanceId && v.star < u.star),
  )
  const kind: DirectedEvent["kind"] =
    a.type === "basic"
      ? "attack"
      : a.type === "ultimate"
        ? "ultimate"
        : TACTICAL_CARD_MAP[cardId!].kind === "trap"
          ? "trap"
          : TACTICAL_CARD_MAP[cardId!].kind === "unit"
            ? born
              ? "summon"
              : "upgrade"
            : "spell"
  event(n, {
    kind,
    side,
    cardId,
    sourceId: born?.instanceId ?? upgraded?.instanceId ?? sourceId,
    targetId: a.targetId,
    trapCardId,
  })
  if (!n.winner) {
    const after = reaction(n, a, "after", before)
    if (after) {
      const t = n.traps.find((t) => t.instanceId === after.trapInstanceId)!
      if (t.side === "player") return pause(n, after)
      const r = applyTrap(n, after, finish)
      event(n, {
        kind: "reaction",
        side: t.side,
        sourceId: `hero:${t.side}`,
        cardId: r.trapCardId,
        trapCardId: r.trapCardId,
        targetId: after.affectedUnitId ?? undefined,
        note: "BẪY HƯƠNG KÍCH HOẠT",
      })
    }
  }
  return n
}
export function directedEnemyAction(
  s: TacticalBattleState,
  core: Core,
): DirectedIntent | null {
  const allies = living(s, "enemy"),
    foes = living(s, "player")
  const choices: Array<{ action: DirectedIntent; score: number }> = []
  s.cardGame!.sides.enemy.hand.forEach((id, handIndex) => {
    const c = TACTICAL_CARD_MAP[id],
      same = allies.find((u) => u.cardId === id && u.star === 1)
    const target =
      c.tacticalEffect === "buff"
        ? [...allies].sort((a, b) => b.attack - a.attack)[0]
        : [...foes].sort((a, b) => a.hp - b.hp)[0]
    const action: DirectedIntent = {
      id: `ai:${s.round}:${s.processedActionIds.length}:card`,
      type: "play-card",
      side: "enemy",
      handIndex,
      cell:
        same?.cell ??
        emptyCardCell(s, "enemy", c.tacticalRole !== "guardian") ??
        undefined,
      targetId: ["buff", "damage"].includes(c.tacticalEffect ?? "")
        ? target?.instanceId
        : undefined,
      column: 0,
    }
    if (!legal(s, action, core)) return
    if (c.kind === "trap" && s.traps.some((t) => t.side === "enemy" && t.armed))
      return
    if (
      c.tacticalEffect === "heal" &&
      s.commanders.enemy.hp === 30 &&
      allies.every((u) => u.hp === u.maxHp)
    )
      return
    if (
      c.tacticalEffect === "disarm" &&
      !s.traps.some((t) => t.side === "player" && t.armed)
    )
      return
    const score =
      c.kind === "unit"
        ? (allies.length < 2 ? 25 : 12) + c.cost
        : c.kind === "trap"
          ? 7
          : c.tacticalEffect === "damage" &&
              target &&
              target.hp <= c.tacticalPower * 10
            ? 24
            : 10
    choices.push({
      action,
      score: score + (s.cardGame!.sides.enemy.lastSchool === c.school ? 3 : 0),
    })
  })
  if (choices.length) return choices.sort((a, b) => b.score - a.score)[0].action
  for (const u of [...allies].sort((a, b) => b.attack - a.attack))
    for (const type of ["ultimate", "basic"] as const) {
      const targets = directedTargets(s, u),
        targetId =
          targets.find((id) =>
            foes.some((v) => v.instanceId === id && v.hp <= u.attack),
          ) ?? targets[0]
      const a: DirectedIntent = {
        id: `r${s.round}:${
          type === "basic" ? "basic" : "enemy-ult"
        }:${u.instanceId}`,
        type,
        unitId: u.instanceId,
        targetId,
      }
      if (!s.processedActionIds.includes(a.id) && legal(s, a, core)) return a
    }
  return null
}
export function reduceDirectedBattle(
  current: TacticalBattleState,
  a: TacticalBattleAction,
  core: Core,
  finish: Finish,
): TacticalBattleState {
  const d = current.cardGame!.directed!
  if (current.winner || current.processedActionIds.includes(a.id))
    return current
  if (a.type === "forfeit") {
    const n = core(current, a)
    n.cardGame!.directed!.pending = null
    return n
  }
  if (a.type === "react") {
    const p = d.pending,
      t = current.traps.find(
        (t) =>
          t.instanceId === p?.trapInstanceId && t.armed && t.side === "player",
      )
    if (!p || !t || p.id !== a.reactionId) return current
    let n = structuredClone(current)
    n.cardGame!.directed!.pending = null
    n.phase = "planning"
    let blocked = false,
      trapCardId: string | undefined
    if (a.activate) {
      const r = applyTrap(n, p, finish)
      blocked = r.blocked
      trapCardId = r.trapCardId
    } else cardLog(n, "Bạn giữ bẫy cho hành động tiếp theo.")
    if (p.stage === "before" && !n.winner) {
      if (blocked) spendBlocked(n, p.action)
      else n = resolve(n, p.action, core, finish, true)
    }
    remember(n, a.id)
    const prior = n.cardGame!.directed!.event
    if (a.activate)
      event(n, {
        kind: blocked ? "negate" : "reaction",
        side: "player",
        sourceId: "hero:player",
        cardId: trapCardId ?? null,
        trapCardId,
        targetId: p.affectedUnitId ?? undefined,
        note: blocked ? "PHẢN CHẾ" : "BẪY HƯƠNG KÍCH HOẠT",
      })
    else if (prior && p.stage === "before") event(n, prior)
    else
      event(n, {
        kind: "reaction",
        side: "player",
        sourceId: "hero:player",
        cardId: null,
        note: "GIỮ BẪY",
      })
    finish(n)
    return n
  }
  if (d.pending) return current
  if (a.type === "end-turn") {
    if (d.turn !== "player" || current.phase !== "planning") return current
    const n = structuredClone(current)
    n.cardGame!.directed!.turn = "enemy"
    remember(n, a.id)
    cardLog(n, "Bạn kết lượt. Đối thủ bắt đầu hành động.")
    event(n, {
      kind: "turn",
      side: "enemy",
      sourceId: "hero:enemy",
      cardId: null,
      note: "LƯỢT ĐỐI THỦ",
    })
    return n
  }
  if (a.type === "enemy-step") {
    if (d.turn !== "enemy" || current.phase !== "planning") return current
    const intent = directedEnemyAction(current, core)
    if (intent) {
      const next=resolve(current,intent,core,finish)
      if(next!==current){remember(next,a.id);const last=next.cardGame!.directed!.event;if(last)event(next,last)}
      return next
    }
    const before = structuredClone(current)
    before.phase = "round-end"
    const n = core(before, { id: a.id, type: "end-round" })
    n.cardGame!.directed!.turn = "player"
    event(n, {
      kind: "turn",
      side: "player",
      sourceId: "hero:player",
      cardId: null,
      note: `VÒNG ${n.round} · LƯỢT CỦA BẠN`,
    })
    return n
  }
  if (a.type === "play-card" || a.type === "basic" || a.type === "ultimate")
    return legal(current, a, core) ? resolve(current, a, core, finish) : current
  if (
    d.turn !== "player" ||
    current.phase !== "planning" ||
    !["move", "mulligan"].includes(a.type)
  )
    return current
  const n = core(current, a)
  if (n !== current)
    event(n, {
      kind: a.type === "move" ? "move" : "turn",
      side: "player",
      sourceId: a.type === "move" ? a.unitId : "hero:player",
      cardId: null,
    })
  return n
}
