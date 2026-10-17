import { enemyVisual } from "./enemyVisuals"
/** Bounded code-native motifs, aligned to real cast contact/phase events. */
export function drawEnemyVfx(
  ctx: CanvasRenderingContext2D,
  id: string,
  x: number,
  y: number,
  size: number,
  age: number,
  quiet: boolean,
  phase = false,
) {
  const v = enemyVisual(id)
  if (!v || age < 0 || age > 800) return
  const t = quiet ? 0.45 : age / 800,
    r = size * (phase ? 1.45 : 1) * (0.5 + t * 0.7)
  ctx.save()
  ctx.translate(x, y)
  ctx.globalAlpha = quiet ? 0.65 : Math.sin(Math.PI * t) * 0.85
  ctx.strokeStyle = v.color
  ctx.fillStyle = v.color
  ctx.lineWidth = 2
  if (v.motif === "tea") {
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + t * 0.7
      ctx.beginPath()
      ctx.ellipse(
        Math.cos(a) * r * 0.45,
        Math.sin(a) * r * 0.22,
        r * 0.5,
        r * 0.25,
        a,
        0,
        Math.PI * 2,
      )
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.ellipse(0, r * 0.5, r, 0.28 * r, 0, 0, Math.PI * 2)
    ctx.stroke()
  } else if (v.motif === "salt") {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3
      ctx.save()
      ctx.translate(Math.cos(a) * r * 0.65, Math.sin(a) * r * 0.4)
      ctx.rotate(a)
      ctx.beginPath()
      ctx.moveTo(0, -r * 0.42)
      ctx.lineTo(r * 0.16, 0)
      ctx.lineTo(0, r * 0.24)
      ctx.lineTo(-r * 0.16, 0)
      ctx.closePath()
      ctx.stroke()
      ctx.restore()
    }
  } else if (v.motif === "moon") {
    ctx.beginPath()
    ctx.arc(0, 0, r, -Math.PI * 0.8, Math.PI * 0.8)
    ctx.arc(r * 0.28, 0, r * 0.75, Math.PI * 0.7, -Math.PI * 0.7, true)
    ctx.stroke()
    for (const d of [-1, 1])
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.moveTo(d * r * 0.18, r * 0.25)
        ctx.quadraticCurveTo(
          d * r * (0.7 + i * 0.15),
          -r * 0.7,
          d * r * (0.5 + i * 0.2),
          -r * (0.3 + i * 0.2),
        )
        ctx.stroke()
      }
  } else {
    const colors = ["#f5b070", "#9ada96", "#a4dff2", "#d8b6ec"]
    ctx.beginPath()
    ctx.ellipse(0, 0, r, r * 0.5, 0, 0, Math.PI * 2)
    ctx.stroke()
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + t
      ctx.strokeStyle = colors[i]
      ctx.beginPath()
      ctx.arc(Math.cos(a) * r, Math.sin(a) * r * 0.5, r * 0.16, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  if (phase) {
    ctx.strokeStyle = v.color
    ctx.beginPath()
    ctx.ellipse(0, r * 0.55, r * 1.25, r * 0.32, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}
