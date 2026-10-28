import type { WorldProgress } from "../world/model"
import { ZONE_IDS } from "../world/ids"
import { ROSTER_ASSETS } from "./roster"
import { VILLAGE_SCENE } from "./village"
import { journeyScene } from "./journeyScenes"
import { interiorScene } from "./interiorLandscapes"
import { HEARTH_ROOM_SCENE } from "./hearthRoom"
import { TABLE_ROOM_SCENE } from "./tableRoom"
import { TABLE_ROOM_INTERACTIONS } from "./tableInteractions"
import { FORGOTTEN_HOST_WORLD } from "./bossWorld"
import { npcVisualsForZone } from "./npcPatrol"
import { SETTLEMENT, settlementForZone } from "./settlement"
import { AMBIENT_MOTION, ambientRegionsForZone } from "./ambientMotion"
import { roomScene } from "./teaRoom"

/** Exact mandatory world textures; no portraits/battle/audio/source PNGs or future zones. */
export function worldAssetUrls(world: Readonly<WorldProgress>): string[] {
  const leader = ROSTER_ASSETS[world.partyIds[0] ?? "aw2-than"]
  if (!leader) throw Error("Không tìm thấy hình đại diện của đội.")
  const urls = [leader.assets.world.url]
  if (world.interior)
    return [
      ...urls,
      ...Object.values(roomScene(world.interior.roomId).assets).map(
        (asset) => asset.url,
      ),
    ]
  const journey = journeyScene(world.zoneId)
  if (world.zoneId === VILLAGE_SCENE.zoneId) {
    urls.push(...Object.values(VILLAGE_SCENE.assets).map((a) => a.url))
  } else if (journey) {
    urls.push(
      ...Object.entries(journey.assets)
        .filter(([key]) => !(world.zoneId === ZONE_IDS[1] && key === "props"))
        .map(([, a]) => a.url),
    )
  } else {
    const interior = interiorScene(world.zoneId)
    if (!interior) throw Error("Chưa có cảnh đích hợp lệ.")
    urls.push(interior.assets.floor.url)
    if (world.zoneId === HEARTH_ROOM_SCENE.zoneId) {
      urls.push(
        HEARTH_ROOM_SCENE.assets.sideboard.url,
        HEARTH_ROOM_SCENE.assets.puzzles.url,
        HEARTH_ROOM_SCENE.assets.threshold.url,
      )
    } else {
      urls.push(
        TABLE_ROOM_SCENE.assets.sideboard.url,
        FORGOTTEN_HOST_WORLD.asset.url,
        TABLE_ROOM_INTERACTIONS.assets.note.url,
        TABLE_ROOM_INTERACTIONS.assets.threshold.url,
      )
    }
  }
  urls.push(...npcVisualsForZone(world.zoneId).map((n) => n.asset.url))
  if (settlementForZone(world.zoneId))
    urls.push(...Object.values(SETTLEMENT.assets).map((a) => a.url))
  urls.push(
    ...ambientRegionsForZone(world.zoneId).map(
      (r) =>
        AMBIENT_MOTION.assets[(r.asset as keyof typeof AMBIENT_MOTION.assets)]
          .url,
    ),
  )
  return [...new Set(urls)]
}
