import { characterVisual } from "./characterVisuals"

/** Authored three-frame effect strips are optional. Missing art deliberately
 * falls back to the shared school projectile/impact in each compositor. */
export function characterEffect(id: string) {
  return characterVisual(id)?.effect ?? null
}

export function drawCharacterEffect(
  ctx: CanvasRenderingContext2D,
  id: string,
  image: HTMLImageElement | undefined,
  x: number,
  y: number,
  radius: number,
  progress: number,
  quiet = false,
) {
  const effect = characterEffect(id)
  if (
    !effect ||
    !image?.complete ||
    !image.naturalWidth ||
    !image.naturalHeight ||
    progress < 0 ||
    progress >= 1
  ) return false

  const rows = 3,
    cell = image.naturalHeight / rows,
    columns = Math.floor(image.naturalWidth / cell)
  if (effect.column < 0 || effect.column >= columns) return false

  const frame = quiet ? 1 : progress * (rows - 1),
    first = Math.min(rows - 1, Math.floor(frame)),
    second = Math.min(rows - 1, first + 1),
    mix = quiet ? 0 : frame - first,
    alpha = quiet
      ? 0.72
      : Math.max(0, Math.min(1, progress * 6, (1 - progress) * 5)) * 0.88,
    extent = radius * 2 * (quiet ? 0.94 : 0.84 + Math.sin(progress * Math.PI) * 0.14),
    sx = effect.column * cell

  ctx.save()
  for (const [row, weight] of [[first, 1 - mix], [second, mix]] as const) {
    if (weight <= 0.001) continue
    ctx.globalAlpha = alpha * weight
    ctx.drawImage(
      image,
      sx + 2,
      row * cell + 2,
      cell - 4,
      cell - 4,
      x - extent / 2,
      y - extent / 2,
      extent,
      extent,
    )
  }
  ctx.restore()
  return true
}
