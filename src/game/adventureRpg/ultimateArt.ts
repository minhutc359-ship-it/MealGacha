import { ULTIMATE_MOVES, awakenedKit } from "./awakening"

export type UltimatePattern = typeof ULTIMATE_MOVES[number][2]

export function ultimateIdentity(id: string) {
  const kit = awakenedKit(id)
  return { ...kit, name: ULTIMATE_MOVES[kit.ultimate][0], pattern: ULTIMATE_MOVES[kit.ultimate][2] }
}

/** Twenty spell silhouettes, shared by the cinematic and the battlefield. */
export function drawUltimateArt(
  ctx: CanvasRenderingContext2D,
  pattern: UltimatePattern,
  x: number,
  y: number,
  radius: number,
  progress: number,
  color: string,
  motif = 0,
  light = false,
) {
  if (progress < 0 || progress >= 1) return
  const t = progress, power = Math.sin(Math.PI * Math.min(1, t * 1.15))
  const bloom = Math.min(1, t * 3)
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(radius, radius)
  ctx.globalAlpha = Math.max(0, power) * .88
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = .035
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  if (!light) { ctx.shadowColor = color; ctx.shadowBlur = radius * .12 }
  const line = (points: number[][], close = false, fill = false) => {
    ctx.beginPath()
    points.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))
    if (close) ctx.closePath()
    if (fill) ctx.fill(); else ctx.stroke()
  }
  const ellipse = (px: number, py: number, rx: number, ry: number, rotation = 0, fill = false) => {
    ctx.beginPath(); ctx.ellipse(px, py, Math.max(.001, rx), Math.max(.001, ry), rotation, 0, Math.PI * 2)
    if (fill) ctx.fill(); else ctx.stroke()
  }
  const shield = (px: number, scale: number) => {
    ctx.save(); ctx.translate(px, 0); ctx.scale(scale, scale)
    line([[-.48, -.65], [0, -.85], [.48, -.65], [.4, .22], [0, .65], [-.4, .22]], true)
    line([[0, -.5], [0, .32]]); line([[-.25, -.12], [.25, -.12]])
    ctx.restore()
  }
  const petal = (angle: number, offset: number, length = .62) => {
    ctx.save(); ctx.rotate(angle); ellipse(0, -offset, .16, length, 0); ctx.restore()
  }
  switch (pattern) {
    case "citadel":
      for (let i = -2; i <= 2; i++) {
        const h = (.7 + (2 - Math.abs(i)) * .17) * bloom
        line([[i * .35 - .13, .55], [i * .35 - .13, -h], [i * .35, -h - .14], [i * .35 + .13, -h], [i * .35 + .13, .55]])
      }
      shield(0, .7); break
    case "meteor":
      for (let i = 0; i < 3; i++) {
        const q = Math.min(1, Math.max(0, (t - i * .12) * 1.8)), px = .7 - q * 1.1 + i * .33, py = -.95 + q * 1.45
        line([[px + .35, py - .65], [px, py], [px + .16, py - .08]], false)
        ellipse(px, py, .1, .1, 0, true)
      } break
    case "nova":
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6 + motif * .07
        line([[Math.cos(a) * .15, Math.sin(a) * .15], [Math.cos(a) * bloom * 1.1, Math.sin(a) * bloom * 1.1]])
      }
      ellipse(0, 0, .28 + t * .45, .28 + t * .45); break
    case "lotus":
      for (let i = 0; i < 7; i++) petal((i - 3) * .36, .18 * bloom, .6 * bloom)
      ellipse(0, .57, .8 * bloom, .16); break
    case "moon":
      ctx.beginPath(); ctx.arc(0, -.1, .7 * bloom, .3, Math.PI * 1.8); ctx.arc(.28, -.22, .56 * bloom, Math.PI * 1.7, .5, true); ctx.stroke()
      for (let i = 0; i < 3; i++) ellipse(-.7 + i * .7, .7, .04, .04, 0, true)
      break
    case "mirror":
      for (let i = -1; i <= 1; i++) {
        const px = i * .65, h = (.5 + (i === 0 ? .3 : 0)) * bloom
        line([[px, -h], [px + .28, 0], [px, h], [px - .28, 0]], true)
        line([[px - .1, -.18], [px + .1, .18]])
      } break
    case "bastion":
      for (let i = -1; i <= 1; i++) shield(i * .58, .7 * bloom)
      line([[-1, .65], [1, .65]]); break
    case "blade":
      for (let i = 0; i < 4; i++) {
        const q = Math.min(1, Math.max(0, (t - i * .1) * 3)), sign = i % 2 ? -1 : 1
        line([[-.85 * sign, -.6 + i * .12], [(.2 + q * .65) * sign, .65 - i * .12]])
      } break
    case "frost":
      for (let i = 0; i < 6; i++) {
        ctx.save(); ctx.rotate(i * Math.PI / 3 + t * .2)
        line([[0, 0], [0, -bloom]]); line([[-.2, -.65 * bloom], [0, -.45 * bloom], [.2, -.65 * bloom]])
        ctx.restore()
      } break
    case "reunion":
      for (let i = 0; i < 5; i++) {
        const a = i * Math.PI * 2 / 5 - Math.PI / 2
        const px = Math.cos(a) * .65 * bloom, py = Math.sin(a) * .65 * bloom
        ellipse(px, py, .16, .16); line([[px, py], [0, 0]])
      }
      petal(-.7, .05, .4); petal(.7, .05, .4); break
    case "chains":
      for (let i = -2; i <= 2; i++) ellipse(i * .33, Math.sin(t * 7 + i) * .18, .24, .13, -.5)
      line([[-.8, -.6], [0, 0], [.8, -.6]]); break
    case "drain":
      for (let i = 0; i < 4; i++) {
        ctx.save(); ctx.rotate(i * Math.PI / 2 + t * 2)
        ctx.beginPath(); ctx.moveTo(.95, 0); ctx.bezierCurveTo(.7, -.55, -.4, -.45, 0, 0); ctx.stroke(); ctx.restore()
      }
      ellipse(0, 0, .17, .17, 0, true); break
    case "counter":
      shield(0, bloom)
      for (const sign of [-1, 1]) line([[sign * .28, .05], [sign * .95, -.45], [sign * .61, -.4], [sign * .95, -.45], [sign * .87, -.12]])
      break
    case "phoenix":
      for (const sign of [-1, 1]) {
        line([[0, .48], [sign * .25, -.14], [sign * .72 * bloom, -.7], [sign * 1.05 * bloom, -.38], [sign * .62, -.15], [sign * .82, .02], [sign * .3, .15]])
      }
      line([[0, -.42], [.12, -.22], [0, .65], [-.12, -.22]], true); break
    case "judgement":
      line([[0, -.95 * bloom], [.13, -.63], [.08, .42], [0, .72], [-.08, .42], [-.13, -.63]], true)
      line([[-.42, -.2], [.42, -.2]]); line([[-.65, .9], [0, .5], [.65, .9]]); break
    case "sanctuary":
      for (let i = 0; i < 8; i++) petal(i * Math.PI / 4 + t * .2, .35 * bloom, .35)
      shield(0, .55); ellipse(0, .75, .95 * bloom, .15); break
    case "tide":
      for (let j = 0; j < 3; j++) {
        const points = Array.from({length: 28}, (_, i) => [-1 + i / 13.5, Math.sin(i * .3 - t * 9 + j) * .22 + (j - 1) * .3])
        line(points)
      } break
    case "renewal":
      ctx.beginPath(); ctx.moveTo(0, .8); ctx.bezierCurveTo(-.3, .1, .35, -.1, 0, -.9 * bloom); ctx.stroke()
      for (let i = 0; i < 4; i++) petal((i % 2 ? -1 : 1) * (.5 + i * .12), .18 + i * .1, .28 * bloom)
      ellipse(0, .78, .5, .1); break
    case "balance":
      line([[0, -.85], [0, .7], [-.45, .7], [.45, .7]]); line([[-.82, -.5], [.82, -.5]])
      for (const sign of [-1, 1]) { const px = sign * .62; line([[px, -.5], [px - .25, .18], [px + .25, .18], [px, -.5]]); ellipse(px, .18, .25, .1) }
      break
    case "shadow":
      for (let i = 0; i < 3; i++) {
        ctx.save(); ctx.translate((i - 1) * .5, (i - 1) * -.2); ctx.rotate(-.5)
        line([[0, -.68 * bloom], [.14, -.18], [0, .6 * bloom], [-.08, .05]], true)
        ctx.restore()
      } break
  }
  if (!light) for (let i = 0; i < 9; i++) {
    const angle = i * 2.399 + motif * .17 + t
    const r = .35 + ((i * .17 + t * .7) % .8)
    ellipse(Math.cos(angle) * r, Math.sin(angle) * r, .013 + i % 2 * .009, .013 + i % 2 * .009, 0, true)
  }
  ctx.restore()
}
