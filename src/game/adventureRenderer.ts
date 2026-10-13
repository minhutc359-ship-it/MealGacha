import { ADVENTURE_ART_480, atlasCellRect, propCellFor, terrainCellFor } from "./adventure480"
import { CARD_MAP } from "./catalog"
import { tcgCharacter } from "./tcgCharacterMotion"
import { SPRITE_SHEETS } from "./autochess/presentation"
import {
  acquireCharacterImage,
  characterBounds,
  subscribeCharacterClock,
  unitCharacter,
} from "../infrastructure/assets/characterSprites"
import {
  renderDpr,
  renderIsLight,
  subscribeRenderQuality,
} from "../infrastructure/presentation/renderQuality"
import type { AdventureDirection, AdventureSave } from "./adventure"
import type { AdventureMap } from "./adventureWorld"
import type { CharacterId } from "./characters"
import { faceToward } from "./visualPack"
import {
  WALK_ATLASES,
  WorldMotion,
  worldView,
  tileAt,
  type Point,
} from "./adventurePresentation"
const BASE = 48
const rows: Record<AdventureDirection, number> = {
  down: 0,
  left: 1,
  right: 2,
  up: 3,
}
interface Sprite {
  image: HTMLCanvasElement
  width: number
  height: number
}
interface Layer {
  image: HTMLCanvasElement
  x: number
  y: number
  feet: number
}
export interface WorldRendererStats {
  artReady: boolean
  draws: number
  groundBuilds: number
  layerBytes: number
  surfacePixels: number
  lastFrameMs: number
  assetFailures: string[]
}
const rendererStats = new WeakMap<HTMLCanvasElement, WorldRendererStats>()
export const adventureRendererStats = (canvas: HTMLCanvasElement) =>
  rendererStats.get(canvas)
let activeRenderers = 0
export const activeAdventureRenderers = () => activeRenderers
let symbols: Promise<Document> | undefined
function worldSymbols() {
  return (symbols ??= fetch("/assets/adventure/world.svg")
    .then((r) => {
      if (!r.ok) throw Error("World assets unavailable")
      return r.text()
    })
    .then((text) => new DOMParser().parseFromString(text, "image/svg+xml"))
    .catch((error) => {
      symbols = undefined
      throw error
    }))
}
function surface(width: number, height: number) {
  const c = document.createElement("canvas")
  c.width = Math.max(1, Math.ceil(width))
  c.height = Math.max(1, Math.ceil(height))
  return c
}
async function symbolSprite(doc: Document, id: string): Promise<Sprite | null> {
  const symbol = doc.getElementById(id)
  if (!symbol) return null
  const view = (symbol.getAttribute("viewBox") ?? "0 0 32 40")
      .split(/\s+/)
      .map(Number),
    house = id.startsWith("house-")
  const width = house ? BASE * 4 : BASE,
    height = house ? BASE * 4 : BASE * (view[3] / view[2])
  const xml = new XMLSerializer(),
    defs = doc.querySelector("defs"),
    content = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view.join(" ")}" width="${width}" height="${height}">${
      defs ? xml.serializeToString(defs) : ""
    }${symbol.innerHTML}</svg>`
  const url = URL.createObjectURL(
      new Blob([content], { type: "image/svg+xml" }),
    ),
    image = new Image()
  try {
    image.src = url
    await image.decode()
    const c = surface(width, height)
    c.getContext("2d")!.drawImage(image, 0, 0, width, height)
    return { image: c, width, height }
  } finally {
    URL.revokeObjectURL(url)
  }
}
function clipped(layer: Layer, view: ReturnType<typeof worldView>) {
  const s = view.tile / BASE,
    x = view.x + layer.x * s,
    y = view.y + layer.y * s
  return (
    x + layer.image.width * s < 0 ||
    y + layer.image.height * s < 0 ||
    x > view.width ||
    y > view.height
  )
}
export function mountAdventureRenderer(
  canvas: HTMLCanvasElement,
  map: AdventureMap,
  initial: AdventureSave,
) {
  const ctx = canvas.getContext("2d", { alpha: false })!,
    stats: WorldRendererStats = {
      artReady: false,
      draws: 0,
      groundBuilds: 0,
      layerBytes: 0,
      surfacePixels: 0,
      lastFrameMs: 0,
      assetFailures: [],
    }
  rendererStats.set(canvas, stats)
  activeRenderers++
  let save = initial,
    quiet = false,
    paused = false,
    disposed = false,
    width = 1,
    height = 1,
    lastIdle = -1,
    dirty = true,
    goal: Point | null = null
  const pendingSpirits = new Set<string>()
  const motion = new WorldMotion(initial),
    icons = new Map<string, Sprite>(),
    humans = new Map<string, Sprite[]>(),
    spirits = new Map<string, Sprite[]>(),
    releases: Array<() => void> = []
  let ground = surface(map.grid[0].length * BASE, map.grid.length * BASE),
    layers: Layer[] = []
  let terrainImage: HTMLImageElement | null = null
  const retain = async (path: string) => {
    const lease = acquireCharacterImage(path)
    let released = false
    const release = () => {
      if (!released) {
        released = true
        lease.release()
      }
    }
    releases.push(release)
    try {
      if (!lease.image.complete || !lease.image.naturalWidth)
        await lease.image.decode()
      if (disposed) return null
      return lease.image
    } catch {
      stats.assetFailures.push(path)
      return null
    }
  }
  const prepareHuman = async (character: CharacterId) => {
    const path = WALK_ATLASES[character]
    if (path) {
      const image = await retain(path)
      if (!image) return
      for (const direction of ["down", "left", "right", "up"] as const) {
        humans.set(
          `${character}:${direction}`,
          Array.from({ length: 4 }, (_, frame) => {
            const c = surface(64, 96),
              w = image.naturalWidth / 4,
              h = image.naturalHeight / 4
            c.getContext("2d")!.drawImage(
              image,
              frame * w,
              rows[direction] * h,
              w,
              h,
              0,
              0,
              64,
              96,
            )
            return { image: c, width: 64, height: 96 }
          }),
        )
      }
    } else if (["bach", "hai", "moc", "nhien", "lien"].includes(character)) {
      const model = unitCharacter(`chef-${character}`),
        bounds = characterBounds(model)!,
        image = await retain(SPRITE_SHEETS[model.sheet].path)
      if (!image) return
      humans.set(
        `${character}:shared`,
        [0, 1].map((pose) => stampCharacter(image, bounds, pose)),
      )
    }
  }
  function stampCharacter(
    image: HTMLImageElement,
    bounds: NonNullable<ReturnType<typeof characterBounds>>,
    pose: number,
  ): Sprite {
    const [sx, sy, sw, sh, ax, ay] =
        bounds.row.frames[pose] ?? bounds.row.frames[0],
      c = surface(64, 88),
      s = Math.min(
        60 / (bounds.right - bounds.left),
        80 / (bounds.bottom - bounds.top),
      ),
      cctx = c.getContext("2d")!
    cctx.drawImage(
      image,
      sx,
      sy,
      sw,
      sh,
      32 - ((bounds.left + bounds.right) * s) / 2 - ax * s,
      84 - bounds.bottom * s - ay * s,
      sw * s,
      sh * s,
    )
    return { image: c, width: 64, height: 88 }
  }
  const prepareSpirit = async (cardId: string) => {
    if (spirits.has(cardId) || pendingSpirits.has(cardId)) return
    pendingSpirits.add(cardId)
    const model = tcgCharacter(CARD_MAP[cardId])
    if (!model) {
      pendingSpirits.delete(cardId)
      return
    }
    const bounds = characterBounds(model)!,
      image = await retain(SPRITE_SHEETS[model.sheet].path)
    pendingSpirits.delete(cardId)
    if (image) {
      spirits.set(
        cardId,
        [0, 1].map((pose) => stampCharacter(image, bounds, pose)),
      )
      dirty = true
    } else spirits.set(cardId, [])
  }
  function buildGround() {
    const g = ground.getContext("2d")!,
      palette = map.interior
        ? ["#dbc9ac", "#e6d5bb", "#9d856e"]
        : map.areaId === "moon-table"
          ? ["#a0b6ad", "#d2d4bc", "#829c91"]
          : ["#b0c38b", "#e4d0a2", "#94b278"]
    for (let y = 0; y < map.grid.length; y++)
      for (let x = 0; x < map.grid[0].length; x++) {
        const cell = map.grid[y][x],
          px = x * BASE,
          py = y * BASE,
          road = "pdes".includes(cell),
          water = cell === "w",
          inside = map.interior
        g.fillStyle = water
          ? "#729eaa"
          : cell === "g"
            ? palette[2]
            : road
              ? palette[1]
              : palette[0]
        g.fillRect(px, py, BASE, BASE)
        if (terrainImage) {
          const rect = atlasCellRect(terrainCellFor(cell, inside, map.areaId), terrainImage.naturalWidth, terrainImage.naturalHeight)
          // One source tile spans four world tiles, avoiding noisy repeated mini-patterns.
          const w = (rect.width - 2) / 4, h = (rect.height - 2) / 4
          g.drawImage(terrainImage, rect.x + 1 + (x % 4) * w, rect.y + 1 + (y % 4) * h, w, h, px, py, BASE, BASE)
          continue
        }
        if (inside && cell === "#") {
          g.fillStyle = "#796b5a"
          g.fillRect(px, py, BASE, BASE)
          g.fillStyle = "#b79b7a"
          g.fillRect(px, py, BASE, 6)
        }
        if (cell === "c" || cell === "f") {
          g.fillStyle = "#997a55"
          g.fillRect(px + 2, py + 3, BASE - 4, BASE - 5)
          g.fillStyle = "#d8b885"
          g.fillRect(px + 4, py + 3, BASE - 8, 6)
        }
        if (water) {
          g.strokeStyle = "#b2d0d1"
          g.beginPath()
          g.moveTo(px + 6, py + 14)
          g.lineTo(px + 28, py + 14)
          g.moveTo(px + 24, py + 32)
          g.lineTo(px + 41, py + 32)
          g.stroke()
        } else if (cell === "g") {
          g.fillStyle = "#c3d39a"
          for (let n = 0; n < 6; n++) {
            const gx = px + 7 + ((n * 17 + x * 3) % 34),
              gy = py + 9 + ((n * 13 + y * 7) % 29)
            g.fillRect(gx, gy, 2, 5)
            g.fillRect(gx + 3, gy + 2, 2, 4)
          }
        } else if (road) {
          g.fillStyle = "#c5b58d88"
          g.fillRect(
            px + 7 + ((x * 13 + y * 7) % 24),
            py + 11 + ((y * 11) % 24),
            6,
            2,
          )
        } else if (inside) {
          g.fillStyle = "#b6a38b55"
          g.fillRect(px, py, BASE, 1)
          g.fillRect(px, py, 1, BASE)
        } else {
          g.fillStyle = "#87a37466"
          g.fillRect(
            px + 11 + ((x * 7 + y * 13) % 24),
            py + 12 + ((y * 3) % 23),
            3,
            2,
          )
        }
      }
    stats.groundBuilds++
  }
  function buildLayers() {
    const items: {
      sprite: Sprite
      x: number
      y: number
      width: number
      height: number
      feet: number
      label?: string
    }[] = []
    for (let y = 0; y < map.grid.length; y++)
      for (let x = 0; x < map.grid[0].length; x++) {
        const cell = map.grid[y][x],
          id =
            cell === "t"
              ? "tree"
              : cell === "s"
                ? "sign"
                : cell === "r"
                  ? "storage"
                  : cell === "c"
                    ? "counter"
                    : cell === "f"
                      ? map.id.endsWith(":clinic") ? "bench" : map.id.endsWith(":shop") ? "planter" : "lantern"
                  : null,
          icon = id && icons.get(id)
        if (icon)
          items.push({
            sprite: icon,
            x: x * BASE - (cell === "t" ? BASE * 0.05 : 0),
            y: (y + 1) * BASE - icon.height * (cell === "t" ? 1.04 : 0.85),
            width: icon.width * (cell === "t" ? 1.1 : 0.85),
            height: icon.height * (cell === "t" ? 1.04 : 0.85),
            feet: y + 1,
          })
      }
    for (const house of map.houses) {
      const icon = icons.get(`house-${house.kind}`)
      if (icon)
        items.push({
          sprite: icon,
          x: house.x * BASE,
          y: (house.y - 1) * BASE,
          width: house.width * BASE,
          height: (house.height + 1) * BASE,
          feet: house.y + house.height,
          label: house.name,
        })
    }
    layers = []
    for (const feet of [...new Set(items.map((i) => i.feet))].sort(
      (a, b) => a - b,
    )) {
      const group = items.filter((i) => i.feet === feet),
        x = Math.floor(Math.min(...group.map((i) => i.x))),
        y = Math.floor(Math.min(...group.map((i) => i.y))),
        w = Math.ceil(Math.max(...group.map((i) => i.x + i.width)) - x),
        h = Math.ceil(Math.max(...group.map((i) => i.y + i.height)) - y),
        c = surface(w, h),
        g = c.getContext("2d")!
      for (const item of group) {
        g.drawImage(
          item.sprite.image,
          item.x - x,
          item.y - y,
          item.width,
          item.height,
        )
        if (item.label) {
          const cx = item.x - x + item.width / 2,
            cy = item.y - y + item.height * 0.12
          g.font = "bold 12px sans-serif"
          g.textAlign = "center"
          const w = g.measureText(item.label).width + 14
          g.fillStyle = "#284d3cef"
          g.fillRect(cx - w / 2, cy - 10, w, 18)
          g.fillStyle = "#ffedbd"
          g.fillText(item.label, cx, cy + 3)
        }
      }
      layers.push({ image: c, x, y, feet })
    }
    stats.layerBytes =
      (ground.width * ground.height +
        layers.reduce((n, l) => n + l.image.width * l.image.height, 0)) *
      4
    dirty = true
  }
  buildGround()
  const requested = new Set([
    "tree",
    "sign",
    "storage",
    "gift",
    ...map.houses.map((h) => `house-${h.kind}`),
    ...map.npcs
      .filter(
        (n) =>
          !WALK_ATLASES[n.character] &&
          !["bach", "hai", "moc", "nhien", "lien"].includes(n.character),
      )
      .flatMap((n) =>
        ["down", "left", "right", "up"].map((d) => `${n.character}-${d}-0`),
      ),
  ])
  worldSymbols()
    .then(async (doc) => {
      const loaded = await Promise.all(
        [...requested].map(
          async (id) => [id, await symbolSprite(doc, id)] as const,
        ),
      )
      if (disposed) return
      for (const [id, icon] of loaded) if (icon && !icons.has(id)) icons.set(id, icon)
      buildLayers()
    })
    .catch(() => {
      stats.assetFailures.push("world.svg")
      dirty = true
    })
  Promise.all([retain(ADVENTURE_ART_480.props), retain(ADVENTURE_ART_480.terrain)]).then(([props, terrain]) => {
    if (disposed) return
    if (terrain) terrainImage = terrain
    if (props) for (const id of ["tree", "sign", "storage", "gift", "counter", "bench", "planter", "lantern", ...map.houses.map(h => `house-${h.kind}`)]) {
      const index = propCellFor(id, map.areaId)
      if (index === undefined) continue
      const rect = atlasCellRect(index, props.naturalWidth, props.naturalHeight)
      const house = id.startsWith("house-"), tree = id === "tree"
      const width = house ? BASE * 4 : tree ? BASE * 1.4 : BASE, height = house ? BASE * 4 : tree ? BASE * 2.1 : BASE
      const image = surface(width, height)
      image.getContext("2d")!.drawImage(props, rect.x, rect.y, rect.width, rect.height, 0, 0, width, height)
      icons.set(id, {image, width, height})
    }
    stats.artReady = !!props && !!terrain
    buildGround(); buildLayers()
  })
  Promise.all(
    [
      ...new Set(["hero" as CharacterId, ...map.npcs.map((n) => n.character)]),
    ].map(prepareHuman),
  ).then(() => {
    dirty = true
  })
  if (save.team[0]) prepareSpirit(save.team[0].cardId)
  function drawHuman(
    character: CharacterId,
    point: Point,
    direction: AdventureDirection,
    frame: number,
    view: ReturnType<typeof worldView>,
  ) {
    const set =
        humans.get(`${character}:${direction}`) ??
        humans.get(`${character}:shared`),
      icon =
        set?.[frame % set.length] ?? icons.get(`${character}-${direction}-0`)
    const x = view.x + (point.x + 0.5) * view.tile,
      y = view.y + (point.y + 1) * view.tile
    ctx.fillStyle = "#30443733"
    ctx.beginPath()
    ctx.ellipse(x, y - 1, view.tile * 0.28, view.tile * 0.08, 0, 0, Math.PI * 2)
    ctx.fill()
    if (icon) {
      const w = view.tile * 0.9,
        h =
          character === "hero" || WALK_ATLASES[character]
            ? view.tile * 1.35
            : view.tile * 1.3
      ctx.drawImage(icon.image, x - w / 2, y - h, w, h)
    } else {
      ctx.fillStyle = "#315e56"
      ctx.fillRect(
        x - view.tile * 0.16,
        y - view.tile * 0.7,
        view.tile * 0.32,
        view.tile * 0.6,
      )
      ctx.fillStyle = "#f0c7a0"
      ctx.beginPath()
      ctx.arc(x, y - view.tile * 0.78, view.tile * 0.18, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  function draw(now: number) {
    if (disposed || document.hidden) return
    const start = performance.now(),
      position = motion.at(now, quiet || paused),
      low = renderIsLight(),
      beat = quiet || low || paused ? 0 : Math.floor(now / 250)
    if (!dirty && !position.moving && (paused || beat === lastIdle)) return
    dirty = false
    lastIdle = beat
    const view = worldView(map, position.player, width, height),
      scale = view.tile / BASE
    ctx.fillStyle = map.interior ? "#524e40" : "#536e4f"
    ctx.fillRect(0, 0, width, height)
    // Copy only visible pixels of the cached terrain, never resample an entire city.
    const sx = Math.max(0, -view.x / scale),
      sy = Math.max(0, -view.y / scale),
      sw = Math.min(ground.width - sx, width / scale),
      sh = Math.min(ground.height - sy, height / scale)
    ctx.drawImage(
      ground,
      sx,
      sy,
      sw,
      sh,
      view.x + sx * scale,
      view.y + sy * scale,
      sw * scale,
      sh * scale,
    )
    if (goal) {
      ctx.strokeStyle = "#ffe7a2"
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])
      ctx.strokeRect(
        view.x + goal.x * view.tile + 2,
        view.y + goal.y * view.tile + 2,
        view.tile - 4,
        view.tile - 4,
      )
      ctx.setLineDash([])
    }
    const actors: { feet: number; draw: () => void }[] = layers
      .filter((l) => !clipped(l, view))
      .map((l) => ({
        feet: l.feet,
        draw: () =>
          ctx.drawImage(
            l.image,
            view.x + l.x * scale,
            view.y + l.y * scale,
            l.image.width * scale,
            l.image.height * scale,
          ),
      }))
    for (const find of map.finds) {
      const icon = icons.get("gift")
      if (icon && !save.claimedFinds.includes(find.id))
        actors.push({
          feet: find.y + 1,
          draw: () =>
            ctx.drawImage(
              icon.image,
              view.x + find.x * view.tile,
              view.y + find.y * view.tile,
              view.tile,
              view.tile,
            ),
        })
    }
    for (const npc of map.npcs) {
      const x = view.x + npc.x * view.tile,
        y = view.y + npc.y * view.tile
      if (
        x < -view.tile ||
        y < -view.tile * 2 ||
        x > width ||
        y > height + view.tile
      )
        continue
      actors.push({
        feet: npc.y + 1,
        draw: () => {
          drawHuman(
            npc.character,
            npc,
            Math.abs(npc.x - save.x) + Math.abs(npc.y - save.y) <= 3
              ? faceToward(npc, save)
              : "down",
            beat % 2,
            view,
          )
          ctx.fillStyle = "#fff0c2"
          ctx.fillRect(
            x + view.tile * 0.6,
            y - view.tile * 0.5,
            view.tile * 0.32,
            view.tile * 0.28,
          )
          ctx.fillStyle = "#554f3c"
          ctx.font = `${Math.max(9, view.tile * 0.2)}px sans-serif`
          ctx.textAlign = "center"
          ctx.fillText(
            ["trainer", "keeper"].includes(npc.role) ? "!" : "…",
            x + view.tile * 0.76,
            y - view.tile * 0.29,
          )
        },
      })
    }
    if (position.follower && save.team[0]?.hp > 0) {
      const member = save.team[0],
        frames = spirits.get(member.cardId),
        icon = frames?.[beat % 2],
        p = position.follower
      if (icon)
        actors.push({
          feet: p.y + 0.95,
          draw: () => {
            const x = view.x + (p.x + 0.5) * view.tile,
              y = view.y + (p.y + 1) * view.tile
            ctx.save()
            ctx.translate(x, y)
            if (save.facing === "left") ctx.scale(-1, 1)
            ctx.drawImage(
              icon.image,
              -view.tile * 0.5,
              -view.tile * 1.1,
              view.tile,
              view.tile * 1.1,
            )
            ctx.restore()
          },
        })
    }
    actors.push({
      feet: position.player.y + 1,
      draw: () =>
        drawHuman(
          "hero",
          position.player,
          save.facing,
          position.moving ? 1 + Math.floor(position.phase * 3) : 0,
          view,
        ),
    })
    actors.sort((a, b) => a.feet - b.feet).forEach((a) => a.draw())
    const miniScale = map.interior ? 4 : 3,
      mw = map.grid[0].length * miniScale,
      mh = map.grid.length * miniScale,
      mx = width - mw - 12,
      my = height - mh - 12
    ctx.fillStyle = "#213d35"
    ctx.fillRect(mx - 3, my - 3, mw + 6, mh + 6)
    ctx.globalAlpha = 0.92
    ctx.drawImage(ground, mx, my, mw, mh)
    ctx.globalAlpha = 1
    ctx.fillStyle = "#ffec9f"
    ctx.fillRect(
      mx + save.x * miniScale,
      my + save.y * miniScale,
      miniScale + 1,
      miniScale + 1,
    )
    stats.draws++
    stats.lastFrameMs = performance.now() - start
  }
  const resize = () => {
    width = canvas.clientWidth
    height = canvas.clientHeight
    const dpr = Math.min(
      1.5,
      renderDpr(),
      Math.sqrt(1_300_000 / Math.max(1, width * height)),
    )
    canvas.width = Math.max(1, Math.round(width * dpr))
    canvas.height = Math.max(1, Math.round(height * dpr))
    stats.surfacePixels = canvas.width * canvas.height
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "low"
    dirty = true
    draw(performance.now())
  }
  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  resize()
  const releaseQuality = subscribeRenderQuality(resize),
    releaseClock = subscribeCharacterClock(draw, true)
  const visible = () => {
    dirty = true
  }
  document.addEventListener("visibilitychange", visible)
  return {
    update(
      next: AdventureSave,
      options: {
        quiet: boolean
        paused: boolean
        stepDuration: number
        goal?: Point | null
      },
    ) {
      motion.update(next, performance.now(), options.stepDuration)
      save = next
      quiet = options.quiet
      paused = options.paused
      goal = options.goal ?? null
      dirty = true
      if (next.team[0] && !spirits.has(next.team[0].cardId))
        prepareSpirit(next.team[0].cardId)
      draw(performance.now())
    },
    pick(x: number, y: number) {
      return tileAt(
        worldView(
          map,
          motion.at(performance.now(), quiet).player,
          width,
          height,
        ),
        x,
        y,
      )
    },
    dispose() {
      if (disposed) return
      disposed = true
      activeRenderers--
      observer.disconnect()
      releaseQuality()
      releaseClock()
      document.removeEventListener("visibilitychange", visible)
      releases.forEach((release) => release())
      ground.width = ground.height = 1
      layers.forEach((l) => (l.image.width = l.image.height = 1))
      layers = []
      terrainImage = null
      humans.clear()
      spirits.clear()
      icons.clear()
      rendererStats.delete(canvas)
    },
  }
}
