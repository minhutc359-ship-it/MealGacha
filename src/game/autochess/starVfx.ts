import type { StarUpgrade } from "./presentation"
import { STAR_UPGRADE_MS } from "./presentation"

// A bounded presentation-only effect; no timers or game-state changes in Canvas.
export function drawStarUpgrade(ctx: CanvasRenderingContext2D, upgrade: StarUpgrade, now: number,
  x: number, y: number, cell: number, left: number, top: number, quiet: boolean, low: boolean) {
  const t = (now - upgrade.at) / STAR_UPGRADE_MS
  if (t < 0 || t > 1) return
  const fade = Math.min(1, (1 - t) * 4), power = Math.sin(Math.min(1, t * 2) * Math.PI / 2)
  ctx.save()
  ctx.globalAlpha = fade
  if (!quiet) {
    const glow = ctx.createRadialGradient(x, y - cell * .35, 0, x, y - cell * .35, cell * .8)
    glow.addColorStop(0, "rgba(255,241,168,.65)"); glow.addColorStop(1, "rgba(255,205,90,0)")
    ctx.fillStyle = glow; ctx.fillRect(x - cell, y - cell * 1.3, cell * 2, cell * 1.6)
    ctx.strokeStyle = "#ffe6a2"; ctx.lineWidth = 2
    for (const radius of [.38, .55]) {
      ctx.beginPath(); ctx.ellipse(x, y, cell * radius * (.75 + power * .6), cell * radius * .3, 0, 0, Math.PI * 2); ctx.stroke()
    }
    const converge = Math.min(1, t / .38)
    if (converge < 1) for (const source of upgrade.sources) {
      const sx = source.cell === null ? left + ((source.benchSlot ?? 2) + .5) * cell : left + (source.cell % 6 + .5) * cell
      const sy = source.cell === null ? top + 6 * cell : top + (Math.floor(source.cell / 6) + .82) * cell
      const px = sx + (x - sx) * converge, py = sy + (y - cell * .4 - sy) * converge
      ctx.globalAlpha = fade * (1 - converge)
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo((sx + x) / 2, Math.min(sy, y) - cell, px, py); ctx.stroke()
      ctx.globalAlpha = fade
      ctx.fillStyle = "#fff4b7"; ctx.beginPath(); ctx.arc(px, py, cell * .065, 0, Math.PI * 2); ctx.fill()
    }
    const count = low ? 6 : 14
    for (let i = 0; i < count; i++) {
      const angle = i / count * Math.PI * 2 + t * .9
      const radius = cell * (.2 + t * .75)
      const px = x + Math.cos(angle) * radius, py = y - cell * .4 + Math.sin(angle) * radius * .65
      ctx.fillStyle = i % 2 ? "#ffcc68" : "#fff6c5"
      ctx.beginPath(); ctx.moveTo(px, py - 3); ctx.lineTo(px + 2, py); ctx.lineTo(px, py + 3); ctx.lineTo(px - 2, py); ctx.closePath(); ctx.fill()
    }
  }
  ctx.globalAlpha = fade
  ctx.font = `bold ${Math.max(10, cell * .21)}px sans-serif`; ctx.textAlign = "center"
  ctx.strokeStyle = "#493318"; ctx.lineWidth = 3; ctx.fillStyle = "#fff0b4"
  const text = "★".repeat(upgrade.to) + " THỨC TỈNH"
  ctx.strokeText(text, x, y - cell * 1.04, cell * 1.75); ctx.fillText(text, x, y - cell * 1.04, cell * 1.75)
  ctx.restore()
}
