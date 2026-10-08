import type { Battle } from "./types"

// Defeat takes precedence over objectives and any stale victory flag.
// An objective victory is valid while the player's will is still above zero.
export function battleOutcome(battle: Battle): Battle["result"] {
  if (battle.player.health <= 0) return "loss"
  if (battle.result) return battle.result
  return battle.enemy.health <= 0 ? "win" : null
}
