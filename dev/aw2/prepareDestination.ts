import type { WorldProgress } from "../../src/aw2/world/model"
import { worldAssetUrls } from "../../src/aw2/assets/worldAssets"
import {
  prepareScene,
  type ScenePreparationProgress,
} from "../../src/aw2/assets/prepareScene"
import { loadAmbientTextures, releaseAmbientTextures } from "./AmbientLayer"

export async function prepareDestination(
  world: WorldProgress,
  signal: AbortSignal,
  onProgress: (progress: ScenePreparationProgress) => void,
) {
  const { Assets } = await import("pixi.js")
  return prepareScene({
    urls: worldAssetUrls(world),
    signal,
    onProgress,
    load: (url) => Assets.load(url),
    acquire: async () => {
      if (world.interior) return () => {}
      const loaded = await loadAmbientTextures(
        world.zoneId,
        (url) => Assets.load(url),
        (url) => Assets.unload(url),
      )
      return () => releaseAmbientTextures(loaded.map((item) => item.asset.url))
    },
  })
}
