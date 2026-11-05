import { combatCard, duelChoiceCard } from "../duelCards"
import { directedReadiness } from "./directedRules"
import { duelTargets } from "./duelRules"
import { emptyCardCell } from "./cardRuntime"
import type { DirectedIntent, TacticalBattleState } from "./types"

export function duelPositionValue(s: TacticalBattleState) {
  const sideValue = (side: "enemy" | "player") =>
    s.commanders[side].hp * 4 +
    s.units
      .filter((u) => u.side === side && !u.defeated)
      .reduce(
        (sum, u) =>
          sum +
          u.hp +
          u.shield * 0.7 +
          u.attack * 2.2 +
          (u.role === "guardian" ? 3 : 0) +
          u.energy / 40,
        0,
      ) +
    s.cardGame!.sides[side].hand.length * 0.8
  return sideValue("enemy") - sideValue("player")
}
/** Uses public board information; never reads the player's hand contents or hidden trap identity. */
export function duelEnemyAction(
  s: TacticalBattleState,
  legal: (a: DirectedIntent) => boolean,
  core: (s: TacticalBattleState, a: DirectedIntent) => TacticalBattleState,
): DirectedIntent | null {
  const own = s.units.filter((u) => u.side === "enemy" && !u.defeated),
    foes = s.units.filter((u) => u.side === "player" && !u.defeated)
  const actions: DirectedIntent[] = []
  const add = (
    a: Omit<Extract<DirectedIntent, {
      type: "play-card"
    }>, "id"> | Omit<Exclude<DirectedIntent, { type: "play-card" }>, "id">,
  ) => {
    const action = {
      ...a,
      id: `bot:${s.round}:${s.processedActionIds.length}:${actions.length}`,
    } as DirectedIntent
    if (legal(action)) actions.push(action)
  }
  s.cardGame!.sides.enemy.hand.forEach((id, handIndex) => {
    const original = combatCard(s, id)
    for (const choiceIndex of (original.choices
      ? [0, 1]
      : [undefined]) as (0 | 1 | undefined)[]) {
      const c = duelChoiceCard(original, choiceIndex ?? 0)
      if (
        c.kind === "trap" &&
        s.traps.some((t) => t.side === "enemy" && t.armed)
      )
        continue
      if (
        c.tacticalEffect === "heal" &&
        s.commanders.enemy.hp === 30 &&
        own.every((u) => u.hp === u.maxHp)
      )
        continue
      if (
        c.tacticalEffect === "disarm" &&
        !s.traps.some((t) => t.side === "player" && t.armed)
      )
        continue
      const targets =
        c.kind === "spell" && c.tacticalEffect === "damage"
          ? [...foes.map((u) => u.instanceId), "hero:player"]
          : c.kind === "spell" && c.tacticalEffect === "buff"
            ? own.map((u) => u.instanceId)
            : [undefined]
      const same = own.find((u) => u.cardId === id && u.star === 1)
      for (const targetId of targets)
        add({
          type: "play-card",
          side: "enemy",
          handIndex,
          choiceIndex,
          cell: same?.cell ?? emptyCardCell(s, "enemy") ?? undefined,
          targetId,
          column: 0,
        })
    }
  })
  for (const u of own)
    for (const type of ["ultimate", "basic"] as const)
      for (const targetId of duelTargets(s, u))
        add({ type, unitId: u.instanceId, targetId })
  if (!actions.length) return null
  if (s.cardGame!.botLevel === "normal") {
    const index =
      ((Math.imul(s.seed + s.round, 1664525) +
        s.processedActionIds.length * 1013904223) >>>
        0) %
      actions.length
    return actions[index]
  }
  const base = duelPositionValue(s)
  const scored = actions.map((action) => {
    const next = core(s, action)
    let score = duelPositionValue(next) - base
    if (next.commanders.player.hp === 0) score += 10000
    if (next.commanders.enemy.hp === 0) score -= 10000
    if (action.type === "play-card") {
      const c = combatCard(s, s.cardGame!.sides.enemy.hand[action.handIndex])
      score += c.kind === "trap" ? 3 : c.kind === "unit" ? 2 : 0
    }
    if (s.cardGame!.botLevel === "extreme" && !next.winner) {
      let worst = 0
      for (const u of next.units.filter(
        (u) =>
          u.side === "player" &&
          !u.defeated &&
          directedReadiness(next, u) === "ready",
      ))
        for (const targetId of duelTargets(next, u)) {
          const probe = core(next, {
            id: `reply:${action.id}:${u.instanceId}:${targetId}`,
            type: "basic",
            unitId: u.instanceId,
            targetId,
          })
          worst = Math.min(
            worst,
            duelPositionValue(probe) - duelPositionValue(next),
          )
        }
      score += worst * 0.65
    }
    return { action, score }
  })
  return scored.sort((a, b) => b.score - a.score)[0].action
}
