import type { TacticalBattleState, BattleUnit } from "../engine/types"
import { isDuel } from "../duelCards"
import { duelStrike } from "../engine/duelRules"

/** Same pure damage resolver as combat, without hidden-trap guesses or state writes. */
export function duelAttackPreview(
  s: TacticalBattleState,
  u: BattleUnit,
  targetId: string,
  ultimate = false,
) {
  if (!isDuel(s)) return null
  const next = structuredClone(s),
    source = next.units.find((v) => v.instanceId === u.instanceId)!,
    beforeTarget = s.units.find((v) => v.instanceId === targetId)
  duelStrike(
    next,
    source,
    ultimate ? u.ultimatePower : u.attack,
    targetId,
    ultimate,
  )
  const target = next.units.find((v) => v.instanceId === targetId)
  const foe = u.side === "player" ? "enemy" : "player"
  const hp =
    beforeTarget && target
      ? beforeTarget.hp - target.hp
      : s.commanders[foe].hp - next.commanders[foe].hp
  const shield =
    beforeTarget && target ? beforeTarget.shield - target.shield : 0
  return {
    hp,
    shield,
    counter: u.hp - source.hp,
    counterShield: u.shield - source.shield,
    sourceFalls: source.defeated,
    targetFalls: !!target?.defeated,
    spill: beforeTarget ? s.commanders[foe].hp - next.commanders[foe].hp : 0,
    text: `${hp ? `−${hp} HP` : "0 HP"}${shield ? ` · −${shield} khiên` : ""}${
      u.hp - source.hp
        ? ` · Nhận ${u.hp - source.hp} phản đòn`
        : u.shield - source.shield
          ? ` · Mất ${u.shield - source.shield} khiên phản đòn`
          : " · Không mất HP"
    }${
      beforeTarget
        ? s.commanders[foe].hp - next.commanders[foe].hp
          ? ` · Xuyên ${s.commanders[foe].hp - next.commanders[foe].hp} HP chủ tướng`
          : ""
        : ""
    }`,
  }
}
