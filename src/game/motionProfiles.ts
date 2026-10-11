/** Original procedural motion clips layered on the measured pose atlases.
 * Presentation only: milliseconds/ticks in, no RNG or game-state writes. */
export const MOTION_PROFILES: Record<string, {
  lean: number
  lift: number
  pulse: number
}> = {
  "pho-bo": { lean: .024, lift: .018, pulse: .01 },
  "com-tam": { lean: .055, lift: .01, pulse: .02 },
  "banh-mi": { lean: .07, lift: .014, pulse: .015 },
  "goi-cuon-tom-thit": { lean: .03, lift: .035, pulse: .012 },
  "banh-chung": { lean: .055, lift: .01, pulse: .022 },
  "banh-tet": { lean: .065, lift: .018, pulse: .015 },
  "bun-bo-hue": { lean: .07, lift: .025, pulse: .012 },
  "che-buoi": { lean: .025, lift: .035, pulse: .014 },
  "chef-nhien": { lean: 0.07, lift: 0.018, pulse: 0.012 },
  "chef-hai": { lean: 0.025, lift: 0.04, pulse: 0.018 },
  "chef-moc": { lean: 0.035, lift: 0.022, pulse: 0.009 },
  "chef-bach": { lean: 0.05, lift: 0.012, pulse: 0.016 },
  "chef-lien": { lean: 0.025, lift: 0.05, pulse: 0.014 },
  ferry: { lean: 0.04, lift: 0.025, pulse: 0.008 },
  "bun-cha": { lean: 0.06, lift: 0.025, pulse: 0.012 },
  "bun-rieu": { lean: 0.03, lift: 0.032, pulse: 0.008 },
  "banh-xeo": { lean: 0.075, lift: 0.015, pulse: 0.012 },
  "banh-cuon": { lean: 0.04, lift: 0.035, pulse: 0.008 },
  xoi: { lean: 0.045, lift: 0.015, pulse: 0.018 },
  "com-ga": { lean: 0.055, lift: 0.025, pulse: 0.013 },
  "v4-tide-lock": { lean: 0.018, lift: 0.04, pulse: 0.025 },
  "v4-last-page": { lean: 0.065, lift: 0.02, pulse: 0.022 },
}
export function motionAccent(
  id: string,
  progress: number,
  casting: boolean,
  quiet: boolean,
) {
  const p = MOTION_PROFILES[id] ?? { lean: .035, lift: .018, pulse: .009 }
  if (quiet) return { rotation: 0, lift: 0, stretch: 0 }
  const t = Math.max(0, Math.min(1, progress)),
    envelope = Math.sin(t * Math.PI) ** 2
  return {
    rotation: p.lean * envelope * (casting ? -1 : 1),
    lift: -p.lift * envelope,
    stretch: p.pulse * envelope,
  }
}

/** Brief weapon/cast ribbons, layered over atlas poses without extra image frames. */
export function drawMotionTrail(ctx: CanvasRenderingContext2D, size: number, progress: number, casting: boolean, color: string, quiet: boolean) {
  if (quiet || progress < .22 || progress > .8) return
  const t = (progress - .22) / .58
  ctx.save(); ctx.globalAlpha = Math.sin(t * Math.PI) * .38
  ctx.strokeStyle = color; ctx.lineCap = "round"
  for (let i=0;i<3;i++) {
    ctx.lineWidth = Math.max(1,size*(.014-i*.003))
    ctx.beginPath()
    const radius = size*(.3+i*.055)
    ctx.ellipse(0,-size*.48,radius,radius*(casting?.4:.7),casting?0:-.5,t*1.7+Math.PI*.15,t*1.7+Math.PI*.95)
    ctx.stroke()
  }
  ctx.restore()
}
