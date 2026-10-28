import { lazy, type ComponentType } from "react"
import type { WorldProgress } from "../../src/aw2/world/model"
import { VILLAGE_SCENE } from "../../src/aw2/assets/village"
import { journeyScene } from "../../src/aw2/assets/journeyScenes"
import type { WorldCanvasProps } from "./worldCanvasTypes"

export type WorldRendererFamily = "interior" | "village" | "journey" | "flat"
type RendererModule = { default: ComponentType<WorldCanvasProps> }

export function worldRendererFamily(
  world: Readonly<WorldProgress>,
): WorldRendererFamily {
  if (world.interior) return "interior"
  if (world.zoneId === VILLAGE_SCENE.zoneId) return "village"
  if (journeyScene(world.zoneId)) return "journey"
  return "flat"
}

const loadInterior = () =>
  import("../aw2-scenes/TeaRoomCanvas").then<RendererModule>((module) => ({
    default: module.TeaRoomCanvas,
  }))
const loadVillage = () =>
  import("../aw2-scenes/VillageLandscape").then<RendererModule>((module) => ({
    default: module.VillageLandscape,
  }))
const loadJourney = () =>
  import("../aw2-scenes/JourneyLandscape").then<RendererModule>((module) => ({
    default: module.JourneyLandscape,
  }))

const loaders = {
  interior: loadInterior,
  village: loadVillage,
  journey: loadJourney,
} satisfies Record<Exclude<WorldRendererFamily, "flat">, () => Promise<RendererModule>>

export const InteriorWorldRenderer = lazy(loadInterior)
export const VillageWorldRenderer = lazy(loadVillage)
export const JourneyWorldRenderer = lazy(loadJourney)

/** Starts the exact scene module early; native module loading deduplicates render-time import. */
export function preloadWorldRenderer(world: Readonly<WorldProgress>) {
  const family = worldRendererFamily(world)
  return family === "flat"
    ? Promise.resolve()
    : loaders[family]().then(() => {})
}
