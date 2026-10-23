import manifest from "./kitchen-table.interactions-v1.json"
import type { WorldProgress } from "../world/model"
import { zoneById } from "../world/maps"
import { TABLE_NOTE_ID } from "../world/ids"

export const TABLE_ROOM_INTERACTIONS = manifest

/** Presentation only: existing canonical objects and live flags own coordinates/state. */
export function tableRoomInteractionProps(progress: WorldProgress) {
  if (progress.zoneId !== manifest.zoneId) return []
  return manifest.props.map((prop) => {
    const object = zoneById(progress.zoneId).objects.find(
      (object) => object.id === prop.entityId,
    )!
    const state =
      prop.entityId === TABLE_NOTE_ID
        ? progress.tableNoteRead
          ? "read"
          : progress.bossDefeated
            ? "available"
            : "locked"
        : object.requiresCompleted && progress.questIndex !== 4
          ? "locked"
          : "available"
    const alpha =
      state !== "locked"
        ? manifest.states.availableAlpha
        : prop.entityId === TABLE_NOTE_ID
          ? manifest.states.noteLockedAlpha
          : manifest.states.shortcutLockedAlpha
    return { ...prop, x: object.x, y: object.y, state, alpha }
  })
}
