import scene from "./village-tea.environment-v1.json"
export const TEA_ROOM_SCENE = scene

import { roomById, TEA_ROOM_ID } from "../world/interiorLayout"
export function roomScene(id: string) {
  if (id === TEA_ROOM_ID)
    return { ...TEA_ROOM_SCENE, floorBounds: TEA_ROOM_SCENE.landscape }
  const room = roomById(id)
  return {
    ...TEA_ROOM_SCENE,
    id: `${id}:environment`,
    sceneId: id,
    floorBounds: { x: -80, y: -112, width: 800, height: 536 },
    camera: { ...TEA_ROOM_SCENE.camera, overviewZoom: 0.75 },
    props:
      room.zoneId === "aw2-zone-lantern-street"
        ? room.objects.map((o, i) => ({
            entityId: o.id,
            frame:
              o.kind === "room-exit" ? "exit" : i === 1 ? "party" : "journal",
            x: o.x,
            y: o.y - (o.kind === "room-exit" ? 0 : 32),
            width: o.kind === "room-exit" ? 56 : 108,
            depth: o.kind === "room-exit" ? 1 : o.y - 1,
          }))
        : TEA_ROOM_SCENE.props.map((p, i) => ({
            ...p,
            entityId: room.objects[i === 0 ? 1 : i === 1 ? 2 : 0].id,
            x: room.objects[i === 0 ? 1 : i === 1 ? 2 : 0].x,
            y:
              room.objects[i === 0 ? 1 : i === 1 ? 2 : 0].y -
              (i === 2 ? 0 : 32),
            depth: room.objects[i === 0 ? 1 : i === 1 ? 2 : 0].y,
          })),
  }
}
