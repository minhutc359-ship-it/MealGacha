import { ULTIMATE_TIMELINE, starterCharacter, ultimatePhase } from "./starterCharacters"

export type CharacterVfxKind = "attack" | "skill" | "heal" | "shield" | "charge"

/** Character-specific geometry; one authored gesture at a time, never a screen wash. */
export function drawStarterVfx(
  ctx: CanvasRenderingContext2D,
  id: string,
  x: number,
  y: number,
  radius: number,
  ms: number,
  ultimate = false,
  light = false,
  kind: CharacterVfxKind = "skill",
) {
  const kit = starterCharacter(id)
  const end = ultimate ? ULTIMATE_TIMELINE.end : 650
  if (!kit || ms < 0 || ms >= end) return
  const phase = ultimate ? ultimatePhase(ms) : ms < 400 ? "impact" : "finisher"
  if (ultimate && (phase === "preparation" || phase === "recovery")) return
  const t = ultimate ? (ms - ULTIMATE_TIMELINE.casting) / (ULTIMATE_TIMELINE.recovery-ULTIMATE_TIMELINE.casting) : ms / end
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(radius, radius)
  ctx.globalAlpha = Math.min(1, t * 5, (1 - t) * 4) * 0.8
  ctx.strokeStyle = kit.color
  ctx.fillStyle = kit.color
  ctx.lineWidth = 0.05
  ctx.lineCap = "round"
  const curve = (points: number[]) => {
    ctx.beginPath()
    ctx.moveTo(points[0], points[1])
    ctx.bezierCurveTo(
      ...points.slice(2) as [number, number, number, number, number, number],
    )
    ctx.stroke()
  }
  // The receiving event chooses the visual. A shield never looks like an attack.
  if (!ultimate && kind === "charge") {
    ctx.globalAlpha *= .5
    ctx.scale(.55,.55)
  }
  if (!ultimate && kind === "attack") {
    if (kit.signature === "bronze" || kit.signature === "stomp") {
      ctx.beginPath();ctx.moveTo(-.35,-.4);ctx.lineTo(.05,.25);ctx.lineTo(.6,.35);ctx.stroke()
    } else if (kit.signature === "dragon") {
      ctx.beginPath();ctx.ellipse(0,0,.55,.18,-.4,0,Math.PI*2);ctx.stroke()
    } else if (kit.signature === "silk") {
      for (const n of [-1,0,1]) curve([-.5,.4,n*.3,-.4,.4,-.5,.65,-.2])
    } else if (kit.signature === "leaves") {
      curve([-.6,.5,-.2,.3,.3,-.1,.65,-.5])
    } else {
      ctx.beginPath();ctx.moveTo(-.7,-.5);ctx.lineTo(.7,.5);ctx.stroke()
    }
  } else if (!ultimate && (kind === "heal" || kind === "shield")) {
    // Signature support stays below the face; no opaque full-body disks.
    ctx.translate(0,.4);ctx.scale(.8,.55)
    if (kit.signature === "bronze") {
      ctx.beginPath();ctx.moveTo(-.7,.2);ctx.lineTo(-.7,-.5);ctx.lineTo(0,-.8);ctx.lineTo(.7,-.5);ctx.lineTo(.7,.2);ctx.stroke()
    } else if (kit.signature === "silk") {
      for (const n of [-1,0,1]) {ctx.save();ctx.rotate(n*.8);curve([0,.2,-.7,-.4,-.3,-1,0,-.2]);curve([0,-.2,.3,-1,.7,-.4,0,.2]);ctx.restore()}
    } else if (kit.signature === "leaves") {
      for(const n of [-1,1])curve([n*.85,.2,n*.7,-1,n*.2,-.9,0,-.45])
    } else if (kit.signature === "dragon") {
      curve([-.9,.1,-.4,-.6,.6,.7,.9,-.3]);curve([-.8,.3,-.3,-.3,.5,.9,.8,-.1])
    } else if (kit.signature === "stomp") {
      for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse((i-1)*.4,-.2,.12,.3,(i-1)*.4,0,Math.PI*2);ctx.stroke()}
    } else {
      curve([-.8,.1,-.5,-.5,.5,-.5,.8,.1])
    }
  } else if (kit.signature === "stomp") {
    // Bear: a ground fracture, then low concentric quake rings, never a lion wall.
    ctx.beginPath();ctx.moveTo(-.9,.55);ctx.lineTo(-.3,.35);ctx.lineTo(-.45,.05);ctx.lineTo(.1,.3);ctx.lineTo(.45,.08);ctx.lineTo(.8,.5);ctx.stroke()
    for(let i=0;i<(light?1:3);i++){ctx.beginPath();ctx.ellipse(0,.55,.3+t*.8+i*.18,.08+i*.06,0,0,Math.PI*2);ctx.stroke()}
  } else if (kit.signature === "bronze") {
    // A low bronze rampart protects the feet; it never covers the face.
    const n = ultimate ? 3 : 1
    for (let i = 0; i < n; i++) {
      const p = (i - (n - 1) / 2) * 0.7
      ctx.beginPath()
      ctx.moveTo(p - 0.27, 0.45)
      ctx.lineTo(p - 0.3, -0.35)
      ctx.lineTo(p, -0.55)
      ctx.lineTo(p + 0.3, -0.35)
      ctx.lineTo(p + 0.27, 0.45)
      ctx.stroke()
    }
    if (phase === "impact") {
      ctx.beginPath()
      ctx.ellipse(0, 0.5, 0.7 + t * 0.5, 0.12, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  } else if (kit.signature === "blades") {
    // Alternating saber diagonals rather than recolored circles.
    const count = ultimate && !light ? 4 : 2
    for (let i = 0; i < count; i++) {
      const q = Math.max(0, Math.min(1, (t - i * 0.1) * 3)),
        s = i % 2 ? -1 : 1
      ctx.beginPath()
      ctx.moveTo(-0.8 * s, -0.6 + i * 0.15)
      ctx.lineTo((-0.8 + q * 1.6) * s, -0.6 + q * 1.2 + i * 0.15)
      ctx.stroke()
    }
  } else if (kit.signature === "dragon") {
    // A single serpentine water stroke and an antlered head.
    curve([-0.9, 0.5, -0.8, -0.5, 0.6, 0.55, 0.65, -0.4])
    curve([-0.85, 0.62, -0.5, -0.1, 0.5, 0.7, 0.78, -0.25])
    ctx.beginPath()
    ctx.ellipse(0.7, -0.42, 0.18, 0.1, -0.4, 0, Math.PI * 2)
    ctx.stroke()
    for (const s of [-1, 1])
      curve([
        0.63 + s * 0.08,
        -0.46,
        0.62 + s * 0.17,
        -0.65,
        0.8 + s * 0.12,
        -0.62,
        0.73 + s * 0.2,
        -0.8,
      ])
  } else if (kit.signature === "silk") {
    // Two pale ribbons join at the target; no opaque healing disk.
    for (const s of [-1, 1])
      curve([s * 0.85, 0.3, s * 0.8, -0.65, -s * 0.4, -0.55, 0, 0.4])
    ctx.beginPath()
    ctx.arc(0, 0.05, 0.15, 0, Math.PI * 2)
    ctx.stroke()
  } else {
    // Five separately unfurling leaves rooted at the target's feet.
    const n = light ? 3 : 5
    for (let i = 0; i < n; i++) {
      const a = (i - (n - 1) / 2) * 0.6
      ctx.save()
      ctx.rotate(a)
      curve([0, 0.45, -0.4, -0.1, -0.25, -0.6, 0, -0.8])
      curve([0, -0.8, 0.25, -0.6, 0.4, -0.1, 0, 0.45])
      ctx.restore()
    }
  }
  ctx.restore()
}
