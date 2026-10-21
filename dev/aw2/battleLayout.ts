import type { CombatActor, CombatPresentation } from "../../src/aw2/combat"
import type { SpiritAssetManifest } from "../../src/aw2/assets/types"

export interface ActorPoint {
  x: number
  y: number
  lane: number
  badge: string
}

/** Display depth only. The rules still use their original one-dimensional positions. */
export function projectBattle(
  actors: readonly CombatActor[],
  containerWidth: number,
) {
  const width = Math.max(240, Math.min(960, Math.floor(containerWidth)))
  const ordered = [...actors].sort(
    (a, b) =>
      a.slot - b.slot ||
      (a.side === b.side
        ? a.id.localeCompare(b.id)
        : a.side === "player"
          ? -1
          : 1),
  )
  const points: Record<string, ActorPoint> = {}
  ordered.forEach((actor, lane) => {
    points[actor.id] = {
      x: 64 + (actor.position * (width - 128)) / 100,
      y: 112 + lane * 112,
      lane,
      badge: `${actor.side === "player" ? "Đ" : "K"}${actor.slot + 1}`,
    }
  })
  return { width, height: 56 + Math.max(1, actors.length) * 112, points }
}

/** Reserve room for pose movement/rotation as well as the unmodified source cell. */
export function actorDisplayScale(
  manifest: Pick<SpiritAssetManifest, "frames">,
) {
  const frames = Object.values(manifest.frames).filter((frame) =>
    frame.asset.startsWith("battle"),
  )
  const largest = Math.max(
    ...frames.map(
      (frame) => Math.max(frame.width, frame.height) * (frame.renderScale ?? 1),
    ),
  )
  return Math.min(0.28, 72 / largest)
}

export function actorStatus(actor: CombatActor, tick: number): string[] {
  if (actor.hp <= 0) return ["Đã gục"]
  const labels: string[] = []
  if (actor.cast) labels.push("Đang niệm")
  if (actor.shield > 0) labels.push(`Khiên ${actor.shield}`)
  if (actor.slowUntilTick > tick) labels.push("Chậm")
  if (actor.weakenUntilTick > tick) labels.push("Suy yếu")
  if (actor.interruptGuardCharges > 0 && actor.interruptGuardUntilTick > tick)
    labels.push("Chống ngắt")
  return labels
}

/** Keep numeric outcomes close to their recipient; verbose statuses belong in the roster. */
export function recentActorOutcomes(
  presentation: CombatPresentation,
  actorId: string,
  tick: number,
) {
  if (presentation.terminal) return []
  return presentation.floating
    .filter(
      (item) =>
        item.targetId === actorId &&
        item.tick <= tick &&
        item.tick >= tick - 1 &&
        ["hit", "heal", "shield"].includes(item.kind) &&
        item.amount !== undefined,
    )
    .slice(-2)
}
