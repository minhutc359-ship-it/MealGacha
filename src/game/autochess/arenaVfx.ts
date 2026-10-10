import { UNIT_MAP } from "./catalog"
import { VFX_COLORS } from "../battleVfx"
import type { AutoRun, Skill } from "./types"
import type { School } from "../types"

export function arenaTheme(run: AutoRun): School {
  const counts: Record<School, number> = { hearth: 0, ember: 0, tide: 0, grove: 0, sugar: 0 }
  for (const piece of run.roster) if (piece.cell !== null) counts[UNIT_MAP[piece.id].school]++
  return (Object.keys(counts) as School[]).sort((a, b) => counts[b] - counts[a])[0]
}
// Original engraved floor geometry inspired by Vietnamese bronze-drum motifs.
// Presentation is deterministic and never writes simulation state.
export function drawArena(ctx: CanvasRenderingContext2D, left: number, top: number, size: number, school: School, time: number, quiet: boolean, low: boolean, pressure: boolean) {
  const colors = VFX_COLORS[school], x = left + size / 2, y = top + size / 2
  ctx.save(); ctx.beginPath(); ctx.rect(left, top, size, size); ctx.clip()
  const floor = ctx.createLinearGradient(left, top, left + size, top + size)
  floor.addColorStop(0, "rgba(8,24,32,.88)"); floor.addColorStop(.5, "rgba(24,44,43,.86)"); floor.addColorStop(1, "rgba(9,22,31,.93)")
  ctx.fillStyle = floor; ctx.fillRect(left, top, size, size)
  const light = ctx.createRadialGradient(x, y, 0, x, y, size * .65)
  light.addColorStop(0, `${colors[0]}22`); light.addColorStop(1, `${colors[0]}00`)
  ctx.fillStyle = light; ctx.fillRect(left, top, size, size)
  ctx.strokeStyle = "#dfba78"; ctx.lineWidth = Math.max(.6, size / 650); ctx.globalAlpha = .16
  for (const radius of [.14, .19, .22, .33, .37, .46]) {
    ctx.beginPath(); ctx.ellipse(x, y, size * radius, size * radius, 0, 0, Math.PI * 2); ctx.stroke()
  }
  ctx.beginPath()
  for (let k = 0; k < 24; k++) {
    const angle = k * Math.PI / 12 - Math.PI / 2, r = size * (k % 2 ? .064 : .135)
    if (k) ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r)
    else ctx.moveTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r)
  }
  ctx.closePath(); ctx.stroke()
  for (let k = 0; k < 20; k++) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(k * Math.PI / 10); ctx.translate(size * .265, 0)
    ctx.beginPath(); ctx.moveTo(-size * .015, 0); ctx.lineTo(0, -size * .018); ctx.lineTo(size * .015, 0); ctx.lineTo(0, size * .018); ctx.closePath(); ctx.stroke(); ctx.restore()
  }
  ctx.globalAlpha = 1
  if (!quiet) for (let k = 0; k < (low ? 4 : 12); k++) {
    const age = (time / 120 + k * .381) % 1
    ctx.globalAlpha = Math.sin(age * Math.PI) * .35
    ctx.fillStyle = colors[1]; ctx.beginPath(); ctx.arc(left + ((k * .618) % 1) * size, top + (1 - age) * size, Math.max(1, size * .002), 0, Math.PI * 2); ctx.fill()
  }
  ctx.globalAlpha = pressure ? .5 : .2; ctx.strokeStyle = pressure ? "#ff9368" : colors[1]; ctx.lineWidth = pressure ? 4 : 2
  ctx.strokeRect(left + 2, top + 2, size - 4, size - 4); ctx.restore()
}
export function drawCastAura(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, school: School, t: number, low: boolean) {
  const colors = VFX_COLORS[school]
  ctx.save()
  const beam = ctx.createLinearGradient(x, y - cell * 1.1, x, y)
  beam.addColorStop(0, `${colors[0]}00`); beam.addColorStop(1, `${colors[1]}70`)
  ctx.fillStyle = beam; ctx.globalAlpha = .3 + t * .5
  ctx.beginPath(); ctx.moveTo(x - cell * .32, y); ctx.lineTo(x - cell * .1, y - cell * 1.1); ctx.lineTo(x + cell * .1, y - cell * 1.1); ctx.lineTo(x + cell * .32, y); ctx.fill()
  ctx.fillStyle = colors[2]
  for (let k = 0; k < (low ? 3 : 6); k++) {
    const rise = (t + k / 6) % 1, angle = k * 1.047 + t * 3
    ctx.save(); ctx.translate(x + Math.sin(angle) * cell * .3, y - rise * cell * .95); ctx.rotate(angle)
    ctx.globalAlpha = Math.sin(rise * Math.PI) * .75; ctx.fillRect(-cell * .025, -cell * .025, cell * .05, cell * .05); ctx.restore()
  }
  ctx.restore()
}
export function drawWard(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, time: number, quiet: boolean) {
  ctx.save(); ctx.strokeStyle = "#b1f1ff"; ctx.lineWidth = Math.max(1, size * .015); ctx.globalAlpha = .45
  ctx.beginPath(); ctx.ellipse(x, y - size * .43, size * .43, size * .53, 0, 0, Math.PI * 2); ctx.stroke()
  if (!quiet) for (let k = 0; k < 3; k++) {
    const angle = time * .05 + k * Math.PI * 2 / 3
    ctx.fillStyle = "#defaff"; ctx.beginPath(); ctx.arc(x + Math.cos(angle) * size * .43, y - size * .43 + Math.sin(angle) * size * .53, Math.max(1, size * .023), 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()
}
export function drawSkillBurst(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, school: School, skill: Skill, age: number, quiet: boolean, low: boolean) {
  if (age < 0 || age > .75) return
  const t = age / .75, colors = VFX_COLORS[school], area = ["steam", "cone", "cleave", "frost", "rhythm", "feast", "leaves"].includes(skill)
  const radius = cell * (area ? .65 : .35) * (.5 + t)
  ctx.save(); ctx.globalAlpha = (1 - t) * .75; ctx.strokeStyle = colors[1]; ctx.lineWidth = Math.max(1, cell * .035) * (1 - t * .5)
  ctx.beginPath(); ctx.ellipse(x, y, radius, radius * .55, 0, 0, Math.PI * 2); ctx.stroke()
  if (quiet) { ctx.restore(); return }
  const count = low ? 4 : school === "grove" ? 9 : 12
  for (let k = 0; k < count; k++) {
    const angle = k * Math.PI * 2 / count + .2, extent = radius * (1 + t * .7)
    ctx.save(); ctx.translate(x + Math.cos(angle) * extent, y + Math.sin(angle) * extent * .7 - t * cell * .15); ctx.rotate(angle + t)
    ctx.fillStyle = k % 3 === 0 ? colors[2] : colors[1]
    if (school === "grove") { ctx.beginPath(); ctx.ellipse(0, 0, cell * .07 * (1 - t), cell * .027 * (1 - t), 0, 0, Math.PI * 2); ctx.fill() }
    else if (["frost", "seal", "stun"].includes(skill)) { const s = cell * .075 * (1 - t); ctx.beginPath(); ctx.moveTo(0,-s);ctx.lineTo(s*.4,0);ctx.lineTo(0,s);ctx.lineTo(-s*.4,0);ctx.closePath();ctx.fill() }
    else { ctx.fillRect(-cell * .018, -cell * .055 * (1 - t), cell * .036, cell * .11 * (1 - t)) }
    ctx.restore()
  }
  if (school === "tide") for (let k = 1; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(x, y, radius * (1 + k * .35), radius * (.5 + k * .15), 0, 0, Math.PI * 2); ctx.stroke() }
  ctx.restore()
}
export function drawDeparture(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, school: School, age: number, quiet: boolean, low: boolean) {
  if (quiet || age < 0 || age > 1) return
  ctx.save(); ctx.globalAlpha = 1 - age; ctx.fillStyle = VFX_COLORS[school][1]
  for (let k = 0; k < (low ? 4 : 12); k++) {
    ctx.save(); ctx.translate(x + Math.sin(k * 2.4 + age * 3) * cell * .3, y - age * cell * (.3 + k / 16)); ctx.rotate(age * 3 + k)
    const size = cell * .035 * (1 - age * .4); ctx.fillRect(-size, -size, size * 2, size * 2); ctx.restore()
  }
  ctx.restore()
}
