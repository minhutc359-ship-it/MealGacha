import type { School } from "./types"

export type VfxKind = "projectile" | "slash" | "wave" | "heal" | "shield" | "summon" | "shatter"
export const TCG_IMPACT_MS = 560
export interface VfxPoint { x: number; y: number }
export const VFX_COLORS: Record<School, [string, string, string]> = {
  ember: ["#ff7938", "#ffda78", "#fff6d0"],
  tide: ["#44a8df", "#92ecff", "#edfaff"],
  grove: ["#65b765", "#b7ec8a", "#fbffe0"],
  hearth: ["#d89b43", "#ffe08a", "#fff8d7"],
  sugar: ["#be7de1", "#efbfff", "#fff2fd"],
}
export function skillVfx(skill: string, range: number): VfxKind {
  if (["heal", "leaves", "ginger", "feast"].includes(skill)) return "heal"
  if (["shield", "shell", "dodge", "lantern"].includes(skill)) return "shield"
  if (["steam", "cone", "frost", "rhythm"].includes(skill)) return "wave"
  if (["cleave", "dash", "charge"].includes(skill)) return "slash"
  if (skill === "summon") return "summon"
  return range <= 1 && skill === "stun" ? "slash" : "projectile"
}
export const clampVfx = (n: number) => Math.max(0, Math.min(1, n))
export function projectilePoint(from: VfxPoint, to: VfxPoint, t: number, arc: number): VfxPoint {
  t = clampVfx(t)
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * arc }
}
function leaf(ctx: CanvasRenderingContext2D, size: number, color: string) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-size, 0)
  ctx.bezierCurveTo(-size * .25, -size * .85, size * .8, -size * .7, size, 0)
  ctx.bezierCurveTo(size * .1, size * .55, -size * .8, size * .5, -size, 0); ctx.fill()
  ctx.strokeStyle = "#f5ffd8"; ctx.lineWidth = Math.max(.6, size * .09)
  ctx.beginPath(); ctx.moveTo(-size * .65, 0); ctx.lineTo(size * .75, 0); ctx.stroke()
}
function star(ctx: CanvasRenderingContext2D, size: number, color: string) {
  ctx.fillStyle = color; ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4, r = size * (i % 2 ? .25 : 1)
    if (i) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    else ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  ctx.closePath(); ctx.fill()
}
function shield(ctx: CanvasRenderingContext2D, size: number) {
  ctx.beginPath(); ctx.moveTo(0, -size); ctx.lineTo(size * .8, -size * .65)
  ctx.quadraticCurveTo(size * .85, size * .45, 0, size)
  ctx.quadraticCurveTo(-size * .85, size * .45, -size * .8, -size * .65)
  ctx.closePath()
}

// Read-only, deterministic geometry: gameplay and hit timing remain in reducers.
export function drawChannel(ctx: CanvasRenderingContext2D, point: VfxPoint, school: School, t: number, size: number, low = false) {
  const colors = VFX_COLORS[school], progress = clampVfx(t)
  ctx.save(); ctx.translate(point.x, point.y); ctx.scale(1, .48)
  ctx.globalAlpha = Math.min(.85, .25 + progress * .7)
  ctx.strokeStyle = colors[1]; ctx.lineWidth = Math.max(1, size * .04)
  for (let ring = 0; ring < 2; ring++) {
    ctx.beginPath(); ctx.arc(0, 0, size * (.55 + ring * .24), 0, Math.PI * 2); ctx.stroke()
  }
  ctx.rotate(progress * 1.5)
  const count = low ? 4 : 8
  for (let i = 0; i < count; i++) {
    ctx.save(); ctx.rotate(i * Math.PI * 2 / count); ctx.translate(size * .7, 0)
    if (school === "grove") leaf(ctx, size * .12, colors[1])
    else star(ctx, size * .1, colors[2])
    ctx.restore()
  }
  ctx.restore()
  ctx.save(); ctx.strokeStyle = colors[1]; ctx.globalAlpha = .55 * progress
  ctx.lineWidth = Math.max(1, size * .055)
  for (let i = 0; i < (low ? 1 : 3); i++) {
    ctx.beginPath()
    ctx.moveTo(point.x - size * .35 + i * size * .35, point.y)
    ctx.bezierCurveTo(point.x + size * .3, point.y - size * .4, point.x - size * .3, point.y - size * .8, point.x + (i - 1) * size * .18, point.y - size * (1 + progress * .4))
    ctx.stroke()
  }
  ctx.restore()
}

export function drawProjectile(ctx: CanvasRenderingContext2D, from: VfxPoint, to: VfxPoint, school: School, progress: number, size: number, low = false, kind: VfxKind = "projectile") {
  const t = clampVfx(progress), colors = VFX_COLORS[school], arc = size * .8
  const point = projectilePoint(from, to, t, arc)
  const previous = projectilePoint(from, to, Math.max(0, t - .08), arc)
  const angle = Math.atan2(point.y - previous.y, point.x - previous.x)
  ctx.save(); ctx.lineCap = "round"
  // Short curved ribbon follows the moving head, never a straight source-target line.
  const trail = Math.min(t, .22), steps = low ? 4 : 8
  for (let i = 0; i < steps; i++) {
    const a = projectilePoint(from, to, t - trail + trail * i / steps, arc)
    const b = projectilePoint(from, to, t - trail + trail * (i + 1) / steps, arc)
    ctx.globalAlpha = .08 + .42 * i / steps
    ctx.strokeStyle = colors[i === steps - 1 ? 1 : 0]; ctx.lineWidth = size * (.08 + .3 * i / steps)
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 - size * .07, b.x, b.y); ctx.stroke()
  }
  ctx.globalAlpha = 1; ctx.translate(point.x, point.y); ctx.rotate(angle)
  if (kind === "shield" || kind === "shatter") {
    ctx.rotate(Math.PI / 2); shield(ctx, size * .85)
    ctx.fillStyle = colors[0]; ctx.fill(); ctx.strokeStyle = colors[2]; ctx.lineWidth = Math.max(1, size * .1); ctx.stroke()
  } else if (kind === "heal" || school === "grove") {
    for (let i = 0; i < (low ? 2 : 4); i++) {
      ctx.save(); ctx.rotate(t * 5 + i * Math.PI / 2); ctx.translate(size * .4, 0)
      leaf(ctx, size * .45, colors[1]); ctx.restore()
    }
    star(ctx, size * .3, colors[2])
  } else if (school === "ember") {
    for (let i = 0; i < 3; i++) {
      const s = size * (1 - i * .22)
      ctx.fillStyle = colors[i]; ctx.beginPath(); ctx.moveTo(s * .9, 0)
      ctx.bezierCurveTo(s * .3, -s * .9, -s * .9, -s * .35, -s * 2.3, -s * .5)
      ctx.quadraticCurveTo(-s, 0, -s * 2, s * .5)
      ctx.bezierCurveTo(-s * .5, s * .25, s * .15, s * .85, s * .9, 0); ctx.fill()
    }
  } else if (school === "tide" || kind === "wave") {
    ctx.fillStyle = colors[0]; ctx.beginPath(); ctx.moveTo(size, 0)
    ctx.bezierCurveTo(size * .2, -size * 1.1, -size * 1.5, -size * .8, -size * 2.4, size * .2)
    ctx.bezierCurveTo(-size * .7, -size * .25, -size * .2, size * .9, size, 0); ctx.fill()
    ctx.strokeStyle = colors[2]; ctx.lineWidth = Math.max(1, size * .12)
    ctx.beginPath(); ctx.moveTo(size * .5, -size * .25)
    ctx.bezierCurveTo(-size * .1, -size * .7, -size * .9, -size * .3, -size * 1.4, 0); ctx.stroke()
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-size * (1 + i * .5), size * Math.sin(t * 8 + i) * .45, size * .12, 0, Math.PI * 2); ctx.stroke() }
  } else if (school === "hearth") {
    ctx.fillStyle = colors[0]; ctx.beginPath(); ctx.moveTo(size, 0); ctx.lineTo(-size * .2, -size * .65); ctx.lineTo(-size, 0); ctx.lineTo(-size * .2, size * .65); ctx.closePath(); ctx.fill()
    ctx.strokeStyle = colors[2]; ctx.lineWidth = 2; ctx.stroke()
    ctx.rotate(Math.PI / 4); star(ctx, size * .4, colors[2])
  } else {
    ctx.rotate(t * 5); star(ctx, size, colors[1]); star(ctx, size * .4, colors[2])
    if (!low) { ctx.translate(-size * 1.3, size * .45); star(ctx, size * .3, colors[2]) }
  }
  ctx.restore()
}

export function drawImpact(ctx: CanvasRenderingContext2D, point: VfxPoint, school: School, age: number, size: number, kind: VfxKind = "projectile", low = false) {
  if (age < 0 || age > .7) return
  const t = age / .7, colors = VFX_COLORS[school], radius = size * (.3 + t * .8)
  ctx.save(); ctx.translate(point.x, point.y); ctx.globalAlpha = (1 - t) * .9
  ctx.strokeStyle = colors[1]; ctx.lineWidth = Math.max(1, size * .07 * (1 - t))
  ctx.save(); ctx.scale(1, .48); ctx.beginPath(); ctx.arc(0, size * .6, radius * 1.35, 0, Math.PI * 2); ctx.stroke(); ctx.restore()
  if (kind === "slash") {
    ctx.rotate(-.6 + t * .35)
    for (let i = 0; i < 2; i++) {
      ctx.fillStyle = colors[i + 1]; ctx.beginPath()
      ctx.moveTo(-radius * 1.3, radius * .7 + i * size * .15)
      ctx.bezierCurveTo(-radius, -radius * .7, radius * .6, -radius * 1.2, radius * 1.3, -radius * .4)
      ctx.bezierCurveTo(radius * .5, -radius * .9, -radius * .2, -radius * .7, -radius * 1.3, radius * .7 + i * size * .15); ctx.fill()
    }
  } else if (kind === "shield" || kind === "shatter") {
    const count = kind === "shatter" ? low ? 3 : 6 : 1
    for (let i = 0; i < count; i++) {
      ctx.save(); ctx.rotate(i * Math.PI * 2 / count)
      if (kind === "shatter") ctx.translate(radius, -radius * .5)
      shield(ctx, kind === "shatter" ? size * .23 : radius)
      ctx.fillStyle = colors[0]; ctx.globalAlpha *= .4; ctx.fill(); ctx.globalAlpha /= .4
      ctx.lineWidth = Math.max(1, size * .055); ctx.stroke(); ctx.restore()
    }
  } else if (kind === "heal" || school === "grove") {
    for (let i = 0; i < (low ? 3 : 6); i++) {
      ctx.save(); ctx.rotate(i * Math.PI / 3 + t); ctx.translate(radius, -t * size * .5)
      leaf(ctx, size * .22, colors[1]); ctx.restore()
    }
    ctx.fillStyle = colors[2]; ctx.fillRect(-size * .08, -radius * .8, size * .16, size * .5); ctx.fillRect(-size * .25, -radius * .8 + size * .16, size * .5, size * .16)
  } else if (school === "tide" || kind === "wave") {
    for (let i = 0; i < (low ? 2 : 4); i++) {
      ctx.beginPath(); ctx.ellipse(0, 0, radius + i * size * .1, radius * .5, t + i, 0, Math.PI * 1.6); ctx.stroke()
      ctx.save(); ctx.rotate(i * Math.PI / 2); ctx.translate(radius, 0); ctx.rotate(-.6)
      ctx.fillStyle = colors[2]; ctx.beginPath(); ctx.moveTo(0, -size * .25); ctx.quadraticCurveTo(size * .22, size * .15, 0, size * .22); ctx.quadraticCurveTo(-size * .22, size * .15, 0, -size * .25); ctx.fill(); ctx.restore()
    }
  } else if (school === "ember") {
    for (let i = 0; i < (low ? 3 : 6); i++) {
      const x = (i - ((low ? 3 : 6) - 1) / 2) * size * .25, rise = t * size * .8, h = size * (.65 + (i % 2) * .3)
      ctx.fillStyle = colors[i % 2]; ctx.beginPath(); ctx.moveTo(x - size * .2, size * .3 - rise)
      ctx.bezierCurveTo(x - size * .4, -h * .3 - rise, x + size * .1, -h - rise, x, -h * 1.3 - rise)
      ctx.bezierCurveTo(x + size * .5, -h * .5 - rise, x + size * .2, size * .15 - rise, x + size * .2, size * .3 - rise); ctx.fill()
    }
  } else {
    for (let i = 0; i < (low ? 3 : 7); i++) {
      ctx.save(); ctx.rotate(i * Math.PI * 2 / 7 + t); ctx.translate(radius, 0); star(ctx, size * (.25 - t * .1), colors[i % 2 + 1]); ctx.restore()
    }
    star(ctx, size * (1 - t), colors[2])
  }
  ctx.restore()
}
