import { ULTIMATE_TIMELINE, starterCharacter, ultimatePhase } from "./starterCharacters"

export type CharacterVfxKind = "attack" | "skill" | "heal" | "shield" | "charge"
const LINE_MOTIFS = {
  vapor: [[-.85,.55,-.55,.2,-.7,-.2,-.4,-.65,-.15,-.8],[-.2,.7,.1,.3,-.05,-.15,.25,-.6,.55,-.7],[.35,.75,.65,.4,.5,.05,.8,-.35]],
  carp: [[-.65,0,-.35,-.4,.35,-.35,.7,0,.35,.4,-.35,.4,-.65,0,-.95,-.35,-.95,.35,-.65,0],[-.1,-.35,.1,-.7,.3,-.35],[-.1,.4,.1,.65,.3,.4],[.5,-.07,.52,-.09]],
  plume: [[-.7,.7,.65,-.7,.7,-.2,.2,.35,-.7,.7],[-.45,.45,-.5,.1,-.2,.15],[-.1,.1,-.1,-.2,.2,-.15],[.25,-.25,.25,-.5,.5,-.45]],
  howl: [[-.65,.6,-.75,-.1,-.55,-.7,-.25,-.35,.15,-.5,.5,-.1,.8,.05,.45,.3,.05,.3,-.2,.65],[-.1,-.1,.15,-.15],[.3,.5,.65,.6,.85,.45],[-.8,.7,-.45,.85,.1,.8]],
  shell: [[-.8,.5,-.75,-.25,-.4,-.7,.35,-.7,.75,-.25,.8,.5,-.8,.5],[-.4,-.7,-.2,-.25,.2,-.25,.35,-.7],[-.75,-.25,-.2,-.25,-.35,.45],[.75,-.25,.2,-.25,.35,.45]],
  butterfly: [[0,0,-.55,-.7,-.85,-.55,-.8,-.05,-.3,.2,-.65,.55,-.45,.8,0,.2], [0,0,.55,-.7,.85,-.55,.8,-.05,.3,.2,.65,.55,.45,.8,0,.2],[0,-.2,0,.65],[-.15,-.45,0,-.2,.15,-.45]],
  antler: [[0,.8,0,-.2,-.35,-.5,-.55,-.85],[0,-.2,.35,-.5,.55,-.85],[-.35,-.5,-.7,-.45,-.85,-.7], [.35,-.5,.7,-.45,.85,-.7],[-.55,-.85,-.4,-.95],[.55,-.85,.4,-.95]],
  scepter: [[-.45,.85,.45,-.65,.7,-.55,.85,-.8,.65,-.95,.45,-.65],[-.55,.7,-.3,.85],[.05,.05,.4,.15,.65,.05],[.4,-.1,.55,-.3,.75,-.2]],
  bowl: [
    [-.8,-.1,-.6,.4,-.25,.65,.25,.65,.6,.4,.8,-.1,-.8,-.1],
    [-.9,-.2,.9,-.2],[-.35,.75,.35,.75],
    [-.5,-.35,-.3,-.65,-.1,-.35],[.05,-.4,.25,-.8,.45,-.4],
  ],
  onion: [
    [0,-.3,-.5,-.1,-.65,.3,-.4,.6,0,.7,.4,.6,.65,.3,.5,-.1,0,-.3],
    [0,-.3,-.35,-.75,-.1,-.6,0,-.3,.1,-.85,.3,-.65,0,-.3],
    [0,-.25,-.2,.25,0,.65,.2,.25,0,-.25],[-.2,.75,-.3,.9],[.1,.75,.3,.9],
  ],
  herbs: [
    [-.6,.75,0,.1,.5,-.75],
    [-.35,.45,-.8,.15,-.65,-.1,-.2,.15],
    [-.1,.15,.5,.25,.65,0,.1,-.1],
    [.15,-.25,-.35,-.55,-.3,-.8,.35,-.5],
    [-.7,.8,-.5,.9,-.3,.8],
  ],
  hoe: [
    [-.75,.75,.5,-.5,.85,-.25,.8,.05,.35,-.2,.5,-.5],
    [-.85,.8,-.3,.6,.05,.8,.5,.6,.85,.75],
    [0,.7,0,.2,-.35,-.05,-.45,.15,0,.4,.35,-.1,.45,.1,0,.3],
  ],
  roll: [
    [
      -0.4, -0.65, -0.6, -0.45, -0.6, 0.45, -0.4, 0.65, 0.4, 0.65, 0.6, 0.45,
      0.6, -0.45, 0.4, -0.65, -0.4, -0.65,
    ],
    [-0.6, -0.2, 0.6, -0.2],
    [-0.6, 0.25, 0.6, 0.25],
    [0, -0.65, 0, 0.65],
    [-0.2, 0, 0, -0.2, 0.2, 0, 0, 0.2, -0.2, 0],
  ],
  ladle: [
    [-0.7, 0.75, 0.1, -0.15],
    [
      0.1, -0.15, -0.05, -0.45, 0.15, -0.8, 0.5, -0.85, 0.75, -0.55, 0.55,
      -0.25, 0.1, -0.15,
    ],
    [-0.6, -0.3, -0.35, -0.65, -0.1, -0.55, -0.3, -0.3, -0.6, -0.3],
    [0.35, 0.65, 0.55, 0.35, 0.8, 0.3, 0.65, 0.6, 0.35, 0.65],
  ],
  dart: [
    [-0.85, 0.45, 0.75, -0.4, 0.5, -0.42, 0.75, -0.4, 0.65, -0.15],
    [-0.75, 0.2, -0.65, 0.45, -0.35, 0.5],
    [-0.7, 0.65, -0.3, 0.8, 0.15, 0.65, 0.5, 0.8, 0.85, 0.65],
    [-0.35, -0.55, 0, -0.8, 0.3, -0.65, 0.05, -0.4, -0.35, -0.55],
  ],
  blossom: [
    [-0.75, 0.2, -0.5, 0.55, 0.5, 0.55, 0.75, 0.2, -0.75, 0.2],
    [-0.35, 0.6, 0.35, 0.6],
    [
      0, -0.2, -0.2, -0.6, 0, -0.8, 0.2, -0.6, 0, -0.2, -0.5, -0.25, -0.65,
      -0.5, -0.4, -0.65, 0, -0.2, 0.4, -0.65, 0.65, -0.5, 0.5, -0.25, 0, -0.2,
    ],
    [-0.25, -0.05, 0, 0.08, 0.25, -0.05],
  ],
  grill: [[-.7,.45,-.75,-.35,0,-.7,.75,-.35,.7,.45,0,.7,-.7,.45],[-.45,-.2,.45,.35],[-.45,.35,.45,-.2],[-.65,.05,.65,.05]],
  claw: [[-.75,.55,-.9,-.1,-.55,-.7,-.25,-.55,-.5,-.05,-.15,.2,-.75,.55],[.75,.55,.9,-.1,.55,-.7,.25,-.55,.5,-.05,.15,.2,.75,.55],[-.25,.5,0,.7,.25,.5]],
  fan: [[-.8,.5,-.75,-.15,-.3,-.75,.4,-.7,.85,-.25,.2,-.15,-.3,.2,-.8,.5],[-.8,.5,.1,-.5],[-.8,.5,.6,-.3]],
  lance: [[-.85,.55,.85,-.55,.55,-.55,.85,-.55,.7,-.25],[-.6,.4,-.55,.05,-.2,.1],[-.2,.15,-.15,-.2,.2,-.15],[.2,-.1,.25,-.45,.6,-.4]],
  rampart: [[-.65,.6,-.65,-.65,.65,-.65,.65,.6,-.65,.6],[-.65,0,.65,0],[0,-.65,0,.6],[-.4,.35,.4,-.4]],
  skillet: [[-.6,.45,-.9,.05,-.65,-.5,-.1,-.65,.35,-.3,.25,.3,-.15,.6,-.6,.45],[.15,-.4,.8,-.9],[-.6,-.3,-.45,-.75,-.7,-.8],[-.25,-.55,-.1,-.9,.1,-.8]],
  threads: [[-.7,.6,-.35,.1,-.5,-.35,-.15,-.7,.25,-.8,.45,-.55],[-.25,.6,.1,.1,-.05,-.35,.3,-.65],[.25,.6,.6,.1,.45,-.3,.75,-.55]],
  knot: [[0,0,-.55,-.65,-.85,-.25,-.4,.25,0,0,.55,-.65,.85,-.25,.4,.25,0,0],[-.4,.25,-.7,.75],[.4,.25,.7,.75],[0,-.15,.15,0,0,.15,-.15,0,0,-.15]],
  grain: [[-.7,.6,-.4,.15,-.25,-.3,0,-.7,.1,-.35,-.25,-.3,-.55,-.45,-.4,.15],[-.15,.65,.2,.2,.45,-.5,.6,-.75,.75,-.4,.45,-.5,.2,-.1,.65,.05,.2,.2],[-.6,.65,.6,.65]],
  phin: [[-.65,-.45,.55,-.45,.35,.15,-.45,.15,-.65,-.45],[-.75,-.55,.65,-.55],[-.75,.25,.65,.25],[-.3,.4,-.3,.65],[0,.35,0,.8],[.3,.4,.3,.65]],
  seal: [[0,-.7,-.4,-.5,-.55,0,-.4,.5,0,.7,.4,.5,.55,0,.4,-.5,0,-.7],[-.2,-.15,0,-.3,.2,-.15,.25,.15,0,.3,-.25,.15,-.2,-.15],[-.8,.55,-.45,.7,0,.55,.45,.7,.8,.55]],
  autumn: [[-.8,.6,-.6,-.1,-.1,-.65,.65,-.75,.55,0,.1,.5,-.8,.6],[-.8,.6,.45,-.45],[-.35,.25,-.4,-.15],[0,-.05,.35,.1]],
}

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
  const motif = LINE_MOTIFS[kit.signature as keyof typeof LINE_MOTIFS]
  if (motif) {
    if (!ultimate && (kind === "heal" || kind === "shield")) {ctx.translate(0,.45);ctx.scale(.75,.5)}
    if (kind === "charge") {ctx.scale(.5,.5);ctx.globalAlpha *= .5}
    const count = !ultimate && kind === "attack" ? 1 : motif.length
    for(let i=0;i<count;i++) {
      const points=motif[i];ctx.beginPath();ctx.moveTo(points[0],points[1])
      for(let j=2;j<points.length;j+=2)ctx.lineTo(points[j],points[j+1])
      ctx.stroke()
    }
    ctx.restore();return
  }
  const curve = (points: number[]) => {
    ctx.beginPath()
    ctx.moveTo(points[0], points[1])
    ctx.bezierCurveTo(
      ...points.slice(2) as [number, number, number, number, number, number],
    )
    ctx.stroke()
  }
  if (id.startsWith("chef-")) {
    const receiving = !ultimate && (kind === "heal" || kind === "shield"),
      attack = !ultimate && kind === "attack"
    if (receiving) { ctx.translate(0,.45);ctx.scale(.75,.5) }
    if (kind === "charge") {ctx.scale(.45,.45);ctx.globalAlpha *= .5}
    if (kit.signature === "recipe") {
      // Two open recipe pages become a low protective table on receiving allies.
      ctx.beginPath();ctx.moveTo(-.8,.35);ctx.lineTo(-.8,-.45);ctx.lineTo(0,-.2);ctx.lineTo(.8,-.45);ctx.lineTo(.8,.35);ctx.lineTo(0,.55);ctx.closePath();ctx.stroke()
      if (!attack) curve([0,.5,0,.2,0,-.1,0,-.2])
    } else if (kit.signature === "wok") {
      ctx.beginPath();ctx.ellipse(0,.35,.75,.2,-.25,0,Math.PI);ctx.stroke()
      if (!attack) curve([-.6,.2,-.3,-.5,.5,-.1,.3,-.8])
      if (!receiving) curve([-.5,.15,-.8,-.45,.9,-.6,.6,.1])
    } else if (kit.signature === "roots") {
      for (const s of [-1,1]) curve([s*.8,.65,s*.25,.35,s*.55,-.45,s*.2,-.7])
      if (!attack) {
        curve([0,.5,-.6,0,-.5,-.75,0,-.4]);curve([0,-.4,.5,-.75,.6,0,0,.5])
      }
    } else if (kit.signature === "current") {
      const n = attack ? 1 : 2
      for(let i=0;i<n;i++) curve([-.9,.2+i*.3,-.2,-.7+i*.3,.5,.8+i*.1,.9,-.3+i*.3])
      if (!receiving) {ctx.beginPath();ctx.ellipse(.55,-.15,.22,.45,.7,0,Math.PI*1.4);ctx.stroke()}
    } else if (kit.signature === "lantern") {
      ctx.beginPath()
      for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?.25:.6;const px=Math.cos(a)*r,py=Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}
      ctx.closePath();ctx.stroke()
      if (!attack) curve([-.9,.5,-.3,-.1,.3,1,.9,.3])
    }
    ctx.restore();return
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
