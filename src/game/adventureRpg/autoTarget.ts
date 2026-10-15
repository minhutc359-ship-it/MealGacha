import { actorAnchor } from "./formationLayout"
import type { RpgActor } from "./types"

/** A positional rule independent of viewport dimensions and animation frames. */
export function nearestRpgOpponent(
  actor: Pick<RpgActor, "side" | "slot">,
  enemies: RpgActor[],
): RpgActor | undefined {
  const origin = actorAnchor(actor)
  return [...enemies]
    .filter(enemy => enemy.hp > 0)
    .sort((left, right) => {
      const distance = (enemy: RpgActor) => {
        const destination = actorAnchor(enemy)
        return (destination.x - origin.x) ** 2 + (destination.y - origin.y) ** 2
      }
      return distance(left) - distance(right) || left.slot - right.slot
    })[0]
}
