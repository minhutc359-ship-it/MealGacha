import type { Rectangle, Sprite, Texture } from "pixi.js"
import {
  npcsForZone,
  sampleNpcIdle,
  type NpcMotion,
  type NpcIdleFrame,
} from "../../src/aw2/assets/npcMotion"
import { zoneById } from "../../src/aw2/world/maps"
import type { ZoneId } from "../../src/aw2/world/ids"

type LoadedNpc = {
  manifest: NpcMotion
  texture: Texture
}
export function loadNpcTextures(
  zoneId: string,
  load: (url: string) => Promise<Texture>,
): Promise<LoadedNpc[]> {
  return Promise.all(
    npcsForZone(zoneId).map(async (manifest) => ({
      manifest,
      texture: await load(manifest.asset.url),
    })),
  )
}
export interface NpcSprite {
  manifest: NpcMotion
  sprite: Sprite
  frames: Record<NpcIdleFrame, Texture>
  frame: NpcIdleFrame
}
/** Create owned subtextures after the consumer's disposed guard; source stays cached. */
export function createNpcSprites(
  loaded: readonly LoadedNpc[],
  pixi: {
    Sprite: typeof Sprite
    Texture: typeof Texture
    Rectangle: typeof Rectangle
  },
  owned: Texture[],
): NpcSprite[] {
  return loaded.map(({ manifest, texture }) => {
    texture.source.scaleMode = "nearest"
    const frames = {} as Record<NpcIdleFrame, Texture>
    for (const [key, f] of Object.entries(manifest.frames)) {
      const t = new pixi.Texture({
        source: texture.source,
        frame: new pixi.Rectangle(f.x, f.y, f.width, f.height),
      })
      owned.push(t)
      frames[(key as NpcIdleFrame)] = t
    }
    const sprite = new pixi.Sprite(frames.neutral)
    const object = zoneById(manifest.zoneId as ZoneId).objects.find(
      (o) => o.id === manifest.entityId,
    )!
    sprite.position.set(object.x, object.y)
    sprite.zIndex = object.y
    return { manifest, sprite, frames, frame: "neutral" }
  })
}
export function renderNpcSprites(
  npcs: readonly NpcSprite[],
  elapsedMs: number,
  reduced: boolean,
) {
  return npcs.map((npc) => {
    const frame = sampleNpcIdle(npc.manifest, elapsedMs, reduced),
      f = npc.manifest.frames[frame]
    npc.frame = frame
    npc.sprite.texture = npc.frames[frame]
    npc.sprite.anchor.set(f.anchorX / f.width, f.anchorY / f.height)
    npc.sprite.scale.set(npc.manifest.display.scale)
    return {
      entityId: npc.manifest.entityId,
      frame,
      assetId: npc.manifest.asset.id,
      x: npc.sprite.x,
      y: npc.sprite.y,
      depth: npc.sprite.zIndex,
      scale: npc.sprite.scale.x,
      anchorX: npc.sprite.anchor.x,
      anchorY: npc.sprite.anchor.y,
      width: npc.sprite.width,
      height: npc.sprite.height,
      alpha: npc.sprite.alpha,
      elapsedMs,
    }
  })
}
