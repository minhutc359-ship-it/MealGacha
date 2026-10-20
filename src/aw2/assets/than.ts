import data from "./than.base-v1.json"
import type { SpiritAssetManifest } from "./types"

// Explicitly a reference asset set. This never grants combat/leveling completion.
export const THAN_ASSETS: SpiritAssetManifest = data
export const THAN_ASSET_IDS = {
  world: data.assets.world.id,
  battle: data.assets.battle.id,
  portrait: data.assets.portrait.id,
} as const
