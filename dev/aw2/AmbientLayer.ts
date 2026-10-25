import type { Rectangle, Sprite, Texture } from "pixi.js"
import {
  AMBIENT_MOTION,
  ambientForZone,
  sampleAmbientFrame,
  type AmbientFrame,
} from "../../src/aw2/assets/ambientMotion"

type Lease = {
  texture: Texture
  count: number
}
const leases = new Map<string, Lease>()
const loading = new Map<string, Promise<Texture>>()

export async function loadAmbientTexture(
  zoneId: string,
  load: (url: string) => Promise<Texture>,
) {
  const region = ambientForZone(zoneId)
  if (!region) return undefined
  const asset =
    AMBIENT_MOTION.assets[(region.asset as keyof typeof AMBIENT_MOTION.assets)]
  let lease = leases.get(asset.url)
  if (!lease) {
    let pending = loading.get(asset.url)
    if (!pending) {
      pending = load(asset.url).then((texture) => {
        if (!leases.has(asset.url)) leases.set(asset.url, { texture, count: 0 })
        return texture
      })
      loading.set(asset.url, pending)
    }
    await pending
    loading.delete(asset.url)
    lease = leases.get(asset.url)!
  }
  lease.count += 1
  return { region, asset, texture: lease.texture }
}

export function releaseAmbientTexture(url?: string) {
  if (!url) return
  const lease = leases.get(url)
  if (!lease) return
  lease.count -= 1
  if (lease.count <= 0) {
    lease.texture.destroy(true)
    leases.delete(url)
  }
}

export function createAmbientSprites(
  loaded: NonNullable<Awaited<ReturnType<typeof loadAmbientTexture>>>,
  pixi: {
    Sprite: typeof Sprite
    Texture: typeof Texture
    Rectangle: typeof Rectangle
  },
  owned: Texture[],
) {
  loaded.texture.source.scaleMode = "linear"
  const frames = {} as Record<AmbientFrame, Texture>
  const sourceFrames = loaded.asset.frames as Record<AmbientFrame, {
    x: number
    y: number
    width: number
    height: number
  }>
  for (const [name, frame] of Object.entries(sourceFrames)) {
    const texture = new pixi.Texture({
      source: loaded.texture.source,
      frame: new pixi.Rectangle(frame.x, frame.y, frame.width, frame.height),
    })
    owned.push(texture)
    frames[(name as AmbientFrame)] = texture
  }
  return loaded.region.placements.map((placement) => {
    const sprite = new pixi.Sprite(frames.calm)
    sprite.anchor.set(0.5)
    sprite.position.set(placement.x, placement.y)
    sprite.width = loaded.region.display.width
    sprite.height = loaded.region.display.height
    sprite.zIndex = loaded.region.depth
    return { placement, sprite, frames, frame: "calm" as AmbientFrame }
  })
}

export function renderAmbientSprites(
  sprites: ReturnType<typeof createAmbientSprites>,
  elapsedMs: number,
  reduced: boolean,
) {
  const frame = sampleAmbientFrame(elapsedMs, reduced)
  return sprites.map((item) => {
    item.frame = frame
    item.sprite.texture = item.frames[frame]
    return {
      id: item.placement.id,
      frame,
      x: item.sprite.x,
      y: item.sprite.y,
      width: item.sprite.width,
      height: item.sprite.height,
      depth: item.sprite.zIndex,
      elapsedMs,
    }
  })
}
