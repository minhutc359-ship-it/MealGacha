import type { Rectangle, Sprite, Texture } from "pixi.js"
import { sampleNpcIdle, type NpcMotion } from "../../src/aw2/assets/npcMotion"
import { objectsInScene } from "../../src/aw2/world/scene"
import type { WorldObject } from "../../src/aw2/world/maps"
import {
  samplePatrolVisual,
  type PatrolVisual,
  npcVisualsForScene,
} from "../../src/aw2/assets/npcPatrol"
import {
  npcPatrolView,
  PATROL_NPC_ID,
  type NpcPatrolState,
} from "../../src/aw2/world/npcPatrol"
import type { WorldProgress } from "../../src/aw2/world/model"

type NpcVisual = NpcMotion | PatrolVisual
type NpcFrame = NpcMotion["frames"]["neutral"]

type LoadedNpc = {
  manifest: NpcVisual
  texture: Texture
  object: Readonly<WorldObject>
}
export function loadNpcTextures(
  zoneId: string,
  load: (url: string) => Promise<Texture>,
): Promise<LoadedNpc[]> {
  return Promise.all(
    npcVisualsForScene(zoneId).map(async (manifest) => ({
      manifest,
      object: objectsInScene(zoneId).find((o) => o.id === manifest.entityId)!,
      texture: await load(manifest.asset.url),
    })),
  )
}
export interface NpcSprite {
  manifest: NpcVisual
  sprite: Sprite
  frames: Record<string, Texture>
  frame: string
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
  return loaded.map(({ manifest, texture, object }) => {
    texture.source.scaleMode = "nearest"
    const frames: Record<string, Texture> = {}
    for (const [key, f] of Object.entries(manifest.frames)) {
      const t = new pixi.Texture({
        source: texture.source,
        frame: new pixi.Rectangle(f.x, f.y, f.width, f.height),
      })
      owned.push(t)
      frames[key] = t
    }
    const initial =
      manifest.entityId === PATROL_NPC_ID ? "down-idle" : "neutral"
    const sprite = new pixi.Sprite(frames[initial])
    sprite.position.set(object.x, object.y)
    sprite.zIndex = object.y
    return { manifest, sprite, frames, frame: initial }
  })
}
interface LiveNpcRender {
  world: WorldProgress
  patrol?: Readonly<NpcPatrolState>
}
export function renderNpcSprites(
  npcs: readonly NpcSprite[],
  elapsedMs: number,
  reduced: boolean,
  live?: LiveNpcRender,
) {
  return npcs.map((npc) => {
    const patrolling = npc.manifest.entityId === PATROL_NPC_ID
    const frame = patrolling
      ? live
        ? samplePatrolVisual(live.world, live.patrol, reduced)
        : "down-idle"
      : sampleNpcIdle(npc.manifest as NpcMotion, elapsedMs, reduced)
    const f = (npc.manifest.frames as Record<string, NpcFrame>)[frame]
    const pose =
      patrolling && live ? npcPatrolView(live.world, live.patrol) : undefined
    if (pose) {
      npc.sprite.position.set(pose.x, pose.y)
      npc.sprite.zIndex = pose.y
    }
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
      ...(pose
        ? { facing: pose.facing, moving: pose.moving, held: pose.held }
        : {}),
    }
  })
}
