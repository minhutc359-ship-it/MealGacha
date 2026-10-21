import data from "./forgotten-host.reference-v1.json"
import type { AtlasAsset, AtlasFrame, BattleClip, BattleState } from "./types"

export interface BossSkillAsset {
  id: string
  warningFrame: string
  impactFrames: string[]
  frameMs: number
}

export interface BossAssetManifest {
  entityId: string
  displayName: string
  artVariantId: string
  fullEnemyComplete: boolean
  facing: string
  assets: Record<string, AtlasAsset>
  frames: Record<string, AtlasFrame>
  battle: Record<BattleState, BattleClip>
  skills: Record<"sweep" | "snuff" | "barrier", BossSkillAsset>
}

/** Enemy-only registry: no collectible spirit identity, rarity or world clip. */
export const FORGOTTEN_HOST_ASSETS: BossAssetManifest = data
