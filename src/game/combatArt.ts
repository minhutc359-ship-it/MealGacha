import type { School } from "./types"
export const COMBAT_ART = "/assets/rpg/combat583/effects.webp"
/** A unit keeps its own slash angle, projectile arc and cast rhythm across modes. */
export function combatSignature(id: string) {
  let hash = 0
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) >>> 0
  return {
    angle: ((hash % 7) - 3) * 0.13,
    arc: ((hash % 3) - 1) * 0.2,
    beats: 1 + (hash % 2),
  }
}
export function drawCombatArt(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | undefined,
  school: School,
  kind: "slash" | "projectile" | "impact" | "cast",
  x: number,
  y: number,
  radius: number,
  t: number,
  id: string,
  angle = 0,
) {
  if (!image?.complete || !image.naturalWidth || t < 0 || t > 1) return false
  const row = { hearth: 0, ember: 1, grove: 2, tide: 3, sugar: 4 }[school],
    col = { slash: 0, projectile: 1, impact: 2, cast: 3 }[kind]
  const w = image.naturalWidth / 4,
    h = image.naturalHeight / 5,
    sig = combatSignature(id)
  const size =
    radius *
    (kind === "projectile" ? 1 : kind === "slash" ? 1.4 : 1.1) *
    (kind === "projectile" ? 1 : 0.65 + 0.4 * Math.sin((t * Math.PI) / 2))
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(
    angle +
      (kind === "slash"
        ? sig.angle + (t - 0.5) * 0.45
        : kind === "cast"
          ? sig.angle + t * 0.22
          : 0),
  )
  ctx.globalAlpha *=
    kind === "projectile" ? 0.95 : Math.min(1, t * 8, (1 - t) * 4) * 0.88
  ctx.drawImage(
    image,
    col * w + 2,
    row * h + 2,
    w - 4,
    h - 4,
    -size,
    -size,
    size * 2,
    size * 2,
  )
  ctx.restore()
  return true
}
