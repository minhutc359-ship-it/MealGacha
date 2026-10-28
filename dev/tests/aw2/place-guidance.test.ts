import { describe, expect, it } from "vitest"
import { newWorldProgress, type WorldProgress } from "@/aw2/world/model"
import { ZONE_IDS } from "@/aw2/world/ids"
import { ZONES, canStand, zoneById } from "@/aw2/world/maps"
import {
  TEA_ROOM,
  TEA_DOOR_ID,
  TEA_EXIT_ID,
  TEA_PARTY_ID,
} from "@/aw2/world/interiorLayout"
import {
  interactionTarget,
  placeApproach,
  placeGuidance,
  teaRoomDirection,
} from "@/aw2/world/placeGuidance"
import { newNpcPatrol, PATROL_NPC_ID } from "@/aw2/world/npcPatrol"
import { describeObject, nearestObject } from "@/aw2/world/rules"
import { canStandInScene, sceneId } from "@/aw2/world/scene"
import { findWorldPath } from "@/aw2/world/navigation"
import {
  SETTLEMENT,
  scenicWalkingLandmarks,
  settlementForZone,
} from "@/aw2/assets/settlement"
import { journeyOverview } from "@/aw2/world/registry"

const outside = () => ({ ...newWorldProgress(), x: 300, y: 80 })
const inside = (): WorldProgress => ({
  ...outside(),
  interior: { ...TEA_ROOM.spawn },
})

describe("016G exact selected interaction and scene-local approaches", () => {
  it("keeps a selected nearby object even when another object is nearest", () => {
    const world = { ...newWorldProgress(), x: 160, y: 192 }
    expect(nearestObject(world)?.id).toBe("aw2-npc-giu-cho")
    expect(interactionTarget(world, "aw2-object-village-table")?.id).toBe(
      "aw2-object-village-table",
    )
    expect(interactionTarget(world)?.id).toBe("aw2-npc-giu-cho")
    expect(interactionTarget(world, "unknown")).toBeUndefined()
  })
  it("checks range inclusively and never falls back to a different nearest object", () => {
    expect(interactionTarget({ ...outside(), y: 96 }, TEA_DOOR_ID)?.id).toBe(
      TEA_DOOR_ID,
    )
    expect(
      interactionTarget({ ...outside(), y: 96.001 }, TEA_DOOR_ID),
    ).toBeUndefined()
    expect(
      interactionTarget({ ...newWorldProgress(), x: 160, y: 272 }, TEA_DOOR_ID),
    ).toBeUndefined()
  })
  it.each([
    TEA_DOOR_ID,
    "aw2-npc-giu-cho",
    "aw2-object-village-table",
    `${ZONE_IDS[0]}:exit:east`,
  ])("rejects outdoor %s while inside", (id) => {
    expect(interactionTarget(inside(), id)).toBeUndefined()
  })
  it.each([TEA_EXIT_ID, TEA_PARTY_ID, "aw2-object-tea-journal-desk"])(
    "rejects room %s while outside",
    (id) => {
      expect(interactionTarget(outside(), id)).toBeUndefined()
    },
  )
  it("resolves the moving NPC at its current snapshot without mutating or teleporting it", () => {
    const world = {
        ...newWorldProgress(),
        zoneId: ZONE_IDS[1],
        x: 544,
        y: 192,
      },
      patrol = { ...newNpcPatrol(ZONE_IDS[1]), x: 544, y: 160 }
    const before = JSON.stringify(patrol)
    expect(interactionTarget(world, PATROL_NPC_ID, patrol)).toMatchObject({
      x: 544,
      y: 160,
    })
    expect(interactionTarget(world, PATROL_NPC_ID)).toBeUndefined()
    expect(JSON.stringify(patrol)).toBe(before)
  })
  it.each(ZONE_IDS)(
    "keeps all %s authored approaches standable and inside interaction range",
    (zoneId) => {
      const world = { ...newWorldProgress(), zoneId }
      for (const object of zoneById(zoneId).objects) {
        const approach = placeApproach(object)
        expect(canStand(zoneId, approach.x, approach.y)).toBe(true)
        expect(
          Math.hypot(approach.x - object.x, approach.y - object.y),
        ).toBeLessThanOrEqual(48)
        expect(approach.entityId).toBe(object.id)
        expect(placeGuidance({ ...world, ...approach }, object).near).toBe(true)
      }
    },
  )
  it("gives room desks and exit collision-safe approaches reachable from multiple origins", () => {
    const world = inside()
    for (const object of TEA_ROOM.objects) {
      const point = placeApproach(object)
      expect(canStandInScene(sceneId(world), point.x, point.y)).toBe(true)
      expect(
        interactionTarget(
          { ...world, interior: { ...world.interior!, ...point } },
          object.id,
        )?.id,
      ).toBe(object.id)
      for (const origin of [
        { x: 64, y: 192 },
        { x: 600, y: 350 },
        { x: 320, y: 224 },
      ])
        expect(
          findWorldPath(sceneId(world), origin, point).length,
        ).toBeGreaterThan(0)
    }
  })
  it("describes a locked door without granting travel or changing the progress", () => {
    const world = { ...newWorldProgress(), zoneId: ZONE_IDS[2], x: 592, y: 192 }
    const door = zoneById(world.zoneId).objects.find(
      (o) => o.to === ZONE_IDS[3],
    )!
    const before = JSON.stringify(world)
    expect(placeGuidance(world, door)).toMatchObject({
      near: true,
      locked: true,
      kind: "Cửa nối vùng",
    })
    expect(interactionTarget(world, door.id)?.id).toBe(door.id)
    expect(
      describeObject(world, door).actions.some((a) => a.id === "travel"),
    ).toBe(false)
    expect(JSON.stringify(world)).toBe(before)
  })
})

describe("016G tea-room signposting across scenes", () => {
  it("uses the real door approach in village, not its roof anchor", () => {
    const hint = teaRoomDirection(newWorldProgress())
    expect(hint.label).toBe("Đi tới cửa tiệm trà")
    expect(hint.approach).toEqual(TEA_ROOM.approach)
    expect(hint.approach?.y).not.toBe(TEA_ROOM.entrance.y)
  })
  it.each(ZONE_IDS.slice(1))(
    "walks only to the next local portal from %s",
    (zoneId) => {
      const world = { ...newWorldProgress(), zoneId },
        hint = teaRoomDirection(world)
      expect(hint.label).toBe("Đi tới cửa về Làng")
      expect(hint.approach).toBeDefined()
      const door = zoneById(zoneId).objects.find(
        (o) =>
          o.kind === "exit" &&
          Math.hypot(hint.approach!.x - o.x, hint.approach!.y - o.y) <= 48,
      )!
      expect(door).toBeDefined()
      expect(
        describeObject(world, door).actions.some((a) => a.id === "travel"),
      ).toBe(true)
    },
  )
  it("points to the local room exit first, without changing the outdoor region graph", () => {
    const world = inside(),
      before = JSON.stringify(world),
      hint = teaRoomDirection(world)
    expect(hint.label).toBe("Đi tới cửa ra hiên")
    expect(hint.approach).toEqual({ x: 48, y: 192, entityId: TEA_EXIT_ID })
    expect(journeyOverview(world)).toHaveLength(6)
    expect(ZONES).toHaveLength(6)
    expect(JSON.stringify(world)).toBe(before)
  })
  it("removes scenic-only village landmarks and preserves all manifest data", () => {
    const before = JSON.stringify(SETTLEMENT),
      village = settlementForZone(ZONE_IDS[0])!,
      street = settlementForZone(ZONE_IDS[1])!
    const points = scenicWalkingLandmarks(ZONE_IDS[0])
    expect(points).toHaveLength(0)
    expect(points.some((p) => p.id === "tea")).toBe(false)
    expect(scenicWalkingLandmarks(ZONE_IDS[1])).toEqual(street.landmarks)
    expect(scenicWalkingLandmarks("unknown")).toEqual([])
    scenicWalkingLandmarks(ZONE_IDS[1])[0].x = 600
    expect(JSON.stringify(SETTLEMENT)).toBe(before)
  })
  it("returns detached approach data and preserves story/economy authority", () => {
    const world = outside(),
      before = JSON.stringify(world)
    for (let i = 0; i < 50; i++) {
      const hint = teaRoomDirection(world)
      hint.approach!.x = 20
      const point = placeApproach(TEA_ROOM.entrance)
      point.y = 300
      placeGuidance(world, TEA_ROOM.entrance)
      interactionTarget(world, TEA_DOOR_ID)
    }
    expect(TEA_ROOM.approach).toEqual({ x: 300, y: 80, entityId: TEA_DOOR_ID })
    expect(JSON.stringify(world)).toBe(before)
  })
})
