import { SCHOOLS } from "./catalog"
import {
  awakenedKit,
  AWAKENING_MEDIA,
  ULTIMATE_MOVES,
} from "./adventureRpg/awakening"
import type { School } from "./types"

export const SHOWCASE_MS = 2400
export const CAST_SIGILS = `${AWAKENING_MEDIA}/sigils.webp`
export const SHOWCASE_THEMES: Record<School, {
  color: string
  shade: string
  motif: string
}> = {
  hearth: { color: "#f2ca79", shade: "#48331b", motif: "Ấn đồng" },
  ember: { color: "#ffa16f", shade: "#54251f", motif: "Tàn lửa" },
  grove: { color: "#b0e5ad", shade: "#1d4436", motif: "Lá ngọc" },
  tide: { color: "#8adfeb", shade: "#183d55", motif: "Sóng nước" },
  sugar: { color: "#e4b5f0", shade: "#432950", motif: "Mộng tinh" },
}

/** Presentation data only; no skill, rarity or save migration. */
export function ultimateShowcase(id: string) {
  const kit = awakenedKit(id)
  return kit
    ? {
        title: `${kit.title} · ${ULTIMATE_MOVES[kit.ultimate][0]}`,
        icon: kit.iconCell,
      }
    : null
}

/** One lightweight cast layer, shared with Canvas Auto Chess and Adventure. */
export function drawModelCast(
  ctx: CanvasRenderingContext2D,
  x: number,
  foot: number,
  size: number,
  school: School,
  age: number,
  id: string,
  icons?: HTMLImageElement,
  combo = 1,
  quiet = false,
) {
  if (age < 0 || age > 1200) return
  const theme = SHOWCASE_THEMES[school],
    t = quiet ? 0.4 : age / 1200
  const alpha = quiet ? 0.8 : Math.min(1, age / 160, (1200 - age) / 220)
  ctx.save()
  ctx.globalAlpha = Math.max(0, alpha)
  ctx.strokeStyle = theme.color
  ctx.fillStyle = theme.color
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.ellipse(x, foot, size * (0.38 + t * 0.08), size * 0.13, 0, 0, Math.PI * 2)
  ctx.stroke()
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5 + (quiet ? 0 : t * 1.3)
    const px = x + Math.cos(a) * size * 0.36,
      py = foot + Math.sin(a) * size * 0.12
    ctx.fillRect(px - 1, py - 1, 2, 2)
  }
  const glow = ctx.createRadialGradient(
    x,
    foot - size * 0.4,
    0,
    x,
    foot - size * 0.4,
    size * 0.6,
  )
  glow.addColorStop(0, `${theme.color}38`)
  glow.addColorStop(1, `${theme.color}00`)
  ctx.fillStyle = glow
  ctx.fillRect(x - size * 0.6, foot - size, size * 1.2, size * 1.1)
  const r = Math.max(8, Math.min(20, size * 0.2)),
    head = Math.max(
      r + 2,
      foot - size * 1.12 - (quiet ? 0 : Math.sin(t * Math.PI) * 4),
    )
  ctx.fillStyle = theme.shade
  ctx.beginPath()
  ctx.arc(x, head, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  const icon = ultimateShowcase(id)?.icon
  if (icon !== undefined && icons?.complete && icons.naturalWidth) {
    const cell = icons.naturalWidth / 12
    ctx.save()
    ctx.beginPath()
    ctx.arc(x, head, r - 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(
      icons,
      (icon % 12) * cell,
      Math.floor(icon / 12) * cell,
      cell,
      cell,
      x - r + 2,
      head - r + 2,
      (r - 2) * 2,
      (r - 2) * 2,
    )
    ctx.restore()
  } else {
    ctx.fillStyle = theme.color
    ctx.textAlign = "center"
    ctx.font = `bold ${r * 1.3}px sans-serif`
    ctx.fillText(SCHOOLS[school].symbol, x, head + r * 0.45)
  }
  if (combo > 1) {
    ctx.font = `bold ${Math.max(9, r * 0.75)}px sans-serif`
    ctx.textAlign = "left"
    ctx.fillStyle = "#fff0cb"
    ctx.fillText(`×${combo}`, x + r, head + r * 0.5)
  }
  ctx.restore()
}
