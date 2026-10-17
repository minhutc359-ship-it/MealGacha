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
  if (v.accent) drawRegularMotif(ctx, v.accent, r, t)
  else if (v.motif === "tea") {
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

/** One bounded silhouette for each regular creature, rendered at its real contact. */
function drawRegularMotif(
  ctx: CanvasRenderingContext2D,
  accent: number,
  r: number,
  t: number,
) {
  if (accent === 1) {
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 + t * 0.7
      ctx.save()
      ctx.translate(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.4)
      ctx.rotate(a)
      ctx.beginPath()
      ctx.ellipse(0, 0, r * 0.3, r * 0.1, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }
  } else if (accent === 2 || accent === 8) {
    ctx.beginPath()
    if (accent === 2) {
      ctx.moveTo(-r * 0.65, -r * 0.65)
      ctx.lineTo(r * 0.65, -r * 0.65)
      ctx.lineTo(r * 0.5, r * 0.35)
      ctx.lineTo(0, r * 0.8)
      ctx.lineTo(-r * 0.5, r * 0.35)
      ctx.closePath()
    } else ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2)
    ctx.stroke()
    for (let i = 0; i < (accent === 2 ? 3 : 6); i++) {
      const a = (i * Math.PI * 2) / (accent === 2 ? 3 : 6)
      ctx.beginPath()
      ctx.ellipse(
        Math.cos(a) * r * 0.32,
        Math.sin(a) * r * 0.32,
        r * 0.22,
        r * 0.08,
        a,
        0,
        Math.PI * 2,
      )
      ctx.stroke()
    }
  } else if (accent === 3) {
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * r * 0.65
      ctx.beginPath()
      ctx.moveTo(x, -r * 0.65)
      ctx.lineTo(x + r * 0.25, r * 0.15)
      ctx.lineTo(x, r * 0.5)
      ctx.lineTo(x - r * 0.25, r * 0.15)
      ctx.closePath()
      ctx.stroke()
    }
  } else if (accent === 4) {
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.8, Math.PI, Math.PI * 2)
    ctx.stroke()
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath()
      ctx.moveTo(i * r * 0.4, r * 0.55)
      ctx.bezierCurveTo(
        (i - 0.25) * r,
        0,
        (i + 0.25) * r,
        0,
        i * r * 0.4,
        -r * 0.55,
      )
      ctx.stroke()
    }
  } else if (accent === 5) {
    ctx.beginPath()
    ctx.ellipse(0, -r * 0.3, r * 0.7, r * 0.35, 0, Math.PI, Math.PI * 2)
    ctx.stroke()
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath()
      ctx.moveTo(i * r * 0.5, -r * 0.3)
      ctx.bezierCurveTo(
        (i - 0.4) * r,
        r * 0.1,
        (i + 0.4) * r,
        r * 0.5,
        i * r * 0.4,
        r * 0.8,
      )
      ctx.stroke()
    }
  } else if (accent === 6) {
    for (const d of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(-d * r * 0.7, -r * 0.6)
      ctx.quadraticCurveTo(d * r * 0.8, -r * 0.5, d * r * 0.7, r * 0.6)
      ctx.quadraticCurveTo(d * r * 0.1, 0, -d * r * 0.7, -r * 0.6)
      ctx.stroke()
    }
  } else {
    for (let i = 0; i < 3; i++) {
      const y = (i - 1) * r * 0.4
      ctx.beginPath()
      ctx.moveTo(-r * 0.8, y + r * 0.25)
      ctx.quadraticCurveTo(0, y - r * 0.5, r * 0.8, y)
      ctx.quadraticCurveTo(0, y + r * 0.2, -r * 0.8, y + r * 0.25)
      ctx.stroke()
    }
  }
}
