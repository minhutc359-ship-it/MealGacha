/** Encode preserved generated sources; crop/measure cells, never paint or resize. */
import { readFile, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { parseArgs } from "node:util"
import { isAbsolute, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const { values } = parseArgs({
  options: { sharp: { type: "string", default: "sharp" } },
})
const { default: sharp } = await import(
  isAbsolute(values.sharp) ? pathToFileURL(values.sharp).href : values.sharp
)
const directory = "dev/aw2/assets/forgotten-host/reference-v1"
const id = "aw2-enemy-forgotten-host"
const hash = (data) => createHash("sha256").update(data).digest("hex")
const assets = {},
  frames = {}
async function encode(name, xs, ys, ids) {
  const source = await readFile(`${directory}/${name}.png`)
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const runtime = await sharp(source)
    .webp({ lossless: true, effort: 6 })
    .toBuffer()
  const decoded = await sharp(runtime).ensureAlpha().raw().toBuffer()
  for (let i = 0; i < data.length; i += 4) {
    if (
      data[i + 3] !== decoded[i + 3] ||
      (data[i + 3] > 0 && [0, 1, 2].some((c) => data[i + c] !== decoded[i + c]))
    )
      throw Error(`Lossless visible RGBA mismatch: ${name}`)
  }
  await writeFile(`${directory}/${name}.webp`, runtime)
  let transparent = 0
  for (let i = 3; i < data.length; i += 4) if (data[i] < 8) transparent++
  assets[name] = {
    id: `${id}:${name}:reference-v1`,
    url: `/${directory}/${name}.webp`,
    width: info.width,
    height: info.height,
    sha256: hash(runtime),
    bytes: runtime.length,
    source: { path: `${directory}/${name}.png`, sha256: hash(source) },
    transparentFraction: transparent / (info.width * info.height),
  }
  for (let row = 0; row < ys.length - 1; row++)
    for (let col = 0; col < xs.length - 1; col++) {
      const cell = [xs[col], ys[row], xs[col + 1], ys[row + 1]]
      let left = cell[2],
        top = cell[3],
        right = -1,
        bottom = -1
      for (let y = cell[1]; y < cell[3]; y++)
        for (let x = cell[0]; x < cell[2]; x++) {
          if (data[(y * info.width + x) * 4 + 3] <= 8) continue
          left = Math.min(left, x)
          top = Math.min(top, y)
          right = Math.max(right, x)
          bottom = Math.max(bottom, y)
        }
      if (
        right < 0 ||
        left - cell[0] < 3 ||
        top - cell[1] < 3 ||
        cell[2] - right < 4 ||
        cell[3] - bottom < 4
      )
        throw Error(`Unsafe/empty cell ${name}/${row}/${col}`)
      const x = left - 3,
        y = top - 3,
        width = right - left + 7,
        height = bottom - top + 7
      let edge = 0
      for (let yy = y; yy < y + height; yy++)
        for (let xx = x; xx < x + width; xx++) {
          if (
            xx === x ||
            yy === y ||
            xx === x + width - 1 ||
            yy === y + height - 1
          )
            edge = Math.max(edge, data[(yy * info.width + xx) * 4 + 3])
        }
      if (edge > 8) throw Error(`Unsafe alpha edge ${name}/${row}/${col}`)
      frames[ids[row][col]] = {
        asset: name,
        x,
        y,
        width,
        height,
        anchorX: width / 2,
        anchorY: name === "battle" ? height - 3 : height / 2,
        visibleBounds: [3, 3, width - 3, height - 3],
        maxEdgeAlpha: edge,
      }
    }
}
const states = [
  "idle",
  "move",
  "attack",
  "cast",
  "hit",
  "guard",
  "ultimate",
  "defeat",
]
await encode("battle", [0, 450, 890, 1350, 1774], [0, 465, 887], [
  states.slice(0, 4).map((s) => `battle.${s}`),
  states.slice(4).map((s) => `battle.${s}`),
])
await encode(
  "fx",
  [0, 512, 1064, 1536],
  [0, 350, 660, 1024],
  ["sweep", "snuff", "barrier"].map((s) =>
    [0, 1, 2].map((i) => `fx.${s}.${i}`),
  ),
)
const idle = frames["battle.idle"]
const portrait = await sharp(`${directory}/battle.png`)
  .extract({
    left: idle.x,
    top: idle.y,
    width: idle.width,
    height: idle.height,
  })
  .webp({ lossless: true, effort: 6 })
  .toBuffer()
await writeFile(`${directory}/portrait.webp`, portrait)
const portraitPixels = await sharp(portrait).ensureAlpha().raw().toBuffer()
let transparentPortraitPixels = 0
for (let i = 3; i < portraitPixels.length; i += 4)
  if (portraitPixels[i] < 8) transparentPortraitPixels++
assets.portrait = {
  id: `${id}:portrait:reference-v1`,
  url: `/${directory}/portrait.webp`,
  width: idle.width,
  height: idle.height,
  sha256: hash(portrait),
  bytes: portrait.length,
  source: assets.battle.source,
  sourceCrop: [idle.x, idle.y, idle.width, idle.height],
  transparentFraction: transparentPortraitPixels / (idle.width * idle.height),
}
const neutral = (atMs) => ({
  atMs,
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  opacity: 1,
})
const battle = Object.fromEntries(
  states.map((state) => {
    const durationMs = ["cast", "ultimate"].includes(state)
      ? 1950
      : state === "hit"
        ? 300
        : state === "attack"
          ? 560
          : 1200
    return [
      state,
      {
        id: `${id}:clip:${state}`,
        durationMs,
        loop: ["idle", "move", "guard"].includes(state),
        frames: [{ atMs: 0, frame: `battle.${state}` }],
        reducedMotionFrame: `battle.${state}`,
        motion: [neutral(0), neutral(durationMs)],
        markers: [],
        method:
          "One preserved authored key pose; reference track, not full motion animation",
      },
    ]
  }),
)
const skills = Object.fromEntries(
  ["sweep", "snuff", "barrier"].map((kind, i) => [
    kind,
    {
      id: `${id}:skill:${["missed-invitation", "snuff-hearth", "empty-chair"][i]}`,
      warningFrame: `fx.${kind}.0`,
      impactFrames: [`fx.${kind}.1`, `fx.${kind}.2`],
      frameMs: 180,
    },
  ]),
)
const manifest = {
  version: 1,
  entityId: id,
  displayName: "Người Giữ Bàn Quên",
  artVariantId: "reference-v1",
  status: "KEY_POSE_REFERENCE",
  fullEnemyComplete: false,
  facing: "left",
  assets,
  frames,
  battle,
  skills,
  provenance: {
    generator: "built-in image_gen",
    model: "tool managed",
    date: "2026-10-22",
    prompts: `${directory}/prompts.json`,
    licenseStatus: "REVIEW_REQUIRED",
    commercialRelease: "NOT_CLEARED",
    alphaEdgeTolerance: 8,
    processing:
      "Original PNG preserved; measured alpha-bounded cells/anchors; no painting, resize, mask or mirroring. Lossless WebP visible RGBA + alpha verified. Portrait is exact idle-cell crop. No generated audio.",
  },
}
await writeFile(
  "src/aw2/assets/forgotten-host.reference-v1.json",
  JSON.stringify(manifest, null, 2) + "\n",
)
await writeFile(
  `${directory}/provenance.json`,
  JSON.stringify(
    {
      ...manifest.provenance,
      identity: id,
      sourceAndRuntime: assets,
      frameCount: Object.keys(frames).length,
      keyPoses: 8,
      skillEffects: 9,
      worldArt: "NOT_CREATED",
      fullEnemyComplete: false,
      tool: `sharp${sharp.versions.sharp}/libvips${sharp.versions.vips}`,
      checks:
        "All17 cells alpha-safe; runtime visible RGBA/alpha byte-identical; portrait derived crop",
      remaining: [
        "full motion animation",
        "world object art",
        "audio",
        "independent art review",
        "device/performance",
        "rights",
        "final balance",
      ],
    },
    null,
    2,
  ) + "\n",
)
console.log(
  JSON.stringify({
    status: "PASS",
    frames: Object.keys(frames).length,
    assets: Object.fromEntries(
      Object.entries(assets).map(([key, a]) => [
        key,
        { bytes: a.bytes, width: a.width, height: a.height },
      ]),
    ),
  }),
)
