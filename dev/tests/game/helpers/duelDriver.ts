import { combatCard, duelChoiceCard } from "@/game/tacticalTcg/duelCards"
import {
  reduceTacticalBattle,
  type TacticalBattleState,
  type TacticalBattleAction,
} from "@/game/tacticalTcg/engine"
import { emptyCardCell } from "@/game/tacticalTcg/engine/cardRuntime"
import { directedTargets } from "@/game/tacticalTcg/engine/directedRules"
import { duelPositionValue } from "@/game/tacticalTcg/engine/duelBot"

export function driveDuel(
  start: TacticalBattleState,
  check?: (s: TacticalBattleState) => void,
) {
  let s = start
  const opener = s.cardGame!.sides.player
  if (
    !s.units.some((u) => u.side === "player") &&
    !opener.mulliganUsed &&
    (opener.hand.filter((id) => combatCard(s, id).kind === "unit").length < 2 ||
      !opener.hand.some(
        (id) =>
          combatCard(s, id).kind === "unit" &&
          combatCard(s, id).cost <= opener.mana,
      ))
  )
    s = reduceTacticalBattle(s, { id: "opening-mulligan", type: "mulligan" })
  for (let i = 0; i < 650 && !s.winner; i++) {
    check?.(s)
    const pending = s.cardGame!.directed!.pending
    if (pending) {
      s = reduceTacticalBattle(s, {
        id: `decision:${i}`,
        type: "react",
        reactionId: pending.id,
        activate: true,
      })
      continue
    }
    if (s.cardGame!.directed!.turn === "enemy") {
      s = reduceTacticalBattle(s, { id: `enemy:${i}`, type: "enemy-step" })
      continue
    }
    const own = s.units.filter((u) => u.side === "player" && !u.defeated),
      foes = s.units.filter((u) => u.side === "enemy" && !u.defeated)
    const candidates: { next: TacticalBattleState ; score: number }[] = []
    const base = duelPositionValue(s)
    const add = (action: TacticalBattleAction) => {
      const next = reduceTacticalBattle(s, action)
      if (next === s) return
      let score = base - duelPositionValue(next)
      if (s.boss) {
        const oldBoss = s.units.find((u) => u.instanceId === s.boss!.unitId),
          newBoss = next.units.find((u) => u.instanceId === s.boss!.unitId)
        if (oldBoss && newBoss) {
          score +=
            (oldBoss.hp - newBoss.hp) * 3 + (oldBoss.shield - newBoss.shield)
          if (!oldBoss.defeated && newBoss.defeated) score += 20
        }
      }
      if (action.type === "play-card")
        score +=
          combatCard(s, s.cardGame!.sides.player.hand[action.handIndex])
            .kind === "trap"
            ? 2
            : 1
      if (next.winner === "player") score += 10000
      candidates.push({ next, score })
    }
    s.cardGame!.sides.player.hand.forEach((id, handIndex) => {
      const original = combatCard(s, id)
      for (const choiceIndex of (original.choices
        ? [0, 1]
        : [undefined]) as (0 | 1 | undefined)[]) {
        const c = duelChoiceCard(original, choiceIndex ?? 0),
          same = own.find((u) => u.cardId === id && u.star === 1)
        if (
          c.kind === "trap" &&
          s.traps.some((t) => t.side === "player" && t.armed)
        )
          continue
        if (
          c.tacticalEffect === "heal" &&
          s.commanders.player.hp === 30 &&
          own.every((u) => u.hp === u.maxHp)
        )
          continue
        const targets =
          c.kind === "spell" && c.tacticalEffect === "damage"
            ? [...foes.map((u) => u.instanceId), "hero:enemy"]
            : c.kind === "spell" && c.tacticalEffect === "buff"
              ? own.map((u) => u.instanceId)
              : [undefined]
        for (const targetId of targets)
          add({
            id: `player:${i}:card:${handIndex}:${targetId}:${choiceIndex}`,
            type: "play-card",
            side: "player",
            handIndex,
            choiceIndex,
            cell: same?.cell ?? emptyCardCell(s, "player") ?? undefined,
            targetId,
          })
      }
    })
    for (const u of own)
      for (const type of ["ultimate", "basic"] as const)
        for (const targetId of directedTargets(s, u))
          add({
            id: `player:${i}:${type}:${u.instanceId}:${targetId}`,
            type,
            unitId: u.instanceId,
            targetId,
          })
    s = candidates.length
      ? candidates.sort((a, b) => b.score - a.score)[0].next
      : reduceTacticalBattle(s, { id: `end:${i}`, type: "end-turn" })
  }
  check?.(s)
  return s
}
