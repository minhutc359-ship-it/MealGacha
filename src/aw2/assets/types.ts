export const BATTLE_STATES = [
  "idle",
  "move",
  "attack",
  "cast",
  "hit",
  "guard",
  "ultimate",
  "defeat",
] as const
export type BattleState = typeof BATTLE_STATES[number]
export const DIRECTIONS = ["down", "left", "right", "up"] as const
export type WorldDirection = typeof DIRECTIONS[number]
export const SKILL_SLOTS = ["basic", "auto", "passive", "ultimate"] as const
export type SkillSlot = typeof SKILL_SLOTS[number]

export interface AssetSource {
  path: string
  sha256: string
}
export interface FrameKey {
  atMs: number
  frame: string
}
export interface Point {
  x: number
  y: number
}
export interface WorldClip {
  idle: string
  walk: string[]
  frameMs: number
}

export interface AtlasAsset {
  id: string
  url: string
  width: number
  height: number
  sha256: string
  bytes: number
  source: AssetSource
  transparentFraction: number
}
export interface AtlasFrame {
  asset: string
  x: number
  y: number
  width: number
  height: number
  anchorX: number
  anchorY: number
  visibleBounds: number[]
  maxEdgeAlpha: number
  /** Logical size calibration; does not resize/repaint preserved source pixels. */
  renderScale?: number
}
export interface MotionKey {
  atMs: number
  x: number
  y: number
  rotation: number
  scale: number
  opacity: number
}
export interface ClipMarker {
  atMs: number
  kind: string
  skill: string
}
export interface BattleClip {
  id: string
  durationMs: number
  loop: boolean
  frames: FrameKey[]
  motion: MotionKey[]
  markers: ClipMarker[]
  method: string
  reducedMotionFrame?: string
}
export interface ProjectileTrack {
  frames: string[]
  frameMs: number
  launchAtMs: number
  impactAtMs: number
  from: Point
  to: Point
  scale: number
}
export interface SpiritAssetManifest {
  version: number
  spiritId: string
  displayName: string
  artVariantId: string
  status: string
  fullCharacterComplete: boolean
  assets: Record<string, AtlasAsset>
  frames: Record<string, AtlasFrame>
  battle: Record<BattleState, BattleClip>
  world: Record<WorldDirection, WorldClip>
  skills: Record<SkillSlot, {
    id: string
    displayName: string
    battleState: string
    fx: string[]
    fxFrameMs: number
    fxTriggerAtMs: number
    fxCueAtMs?: number[]
    fxPlacement: {
      attachment: string
      layer: string
      x: number
      y: number
      scale: number
    }
    trigger: string
    audio: {
      id: string
      url: string
      durationMs: number
      sampleRate: number
      sha256: string
      method: string
    }
    projectile: ProjectileTrack | null
    scope: string
  }>
  provenance: {
    generator: string
    model: string
    date: string
    prompts: string
    externalReferences: string[]
    referenceAsset: string
    licenseStatus: string
    commercialRelease: string
    audio: string
    processing: string
    alphaEdgeTolerance: number
  }
}
