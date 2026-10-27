import { describe, expect, it } from "vitest"
import { newWorldProgress, type WorldProgress } from "@/aw2/world/model"
import { ZONE_IDS } from "@/aw2/world/ids"
import { zoneById } from "@/aw2/world/maps"
import { TEA_ROOM, TEA_DOOR_ID, TEA_EXIT_ID } from "@/aw2/world/interiorLayout"
import {
  planWalking,
  reachedWalkingTarget,
  walkingArrivalText,
} from "@/aw2/world/walkingIntent"
import { placeApproach } from "@/aw2/world/placeGuidance"
import { clearPath } from "@/aw2/world/navigation"
import { sceneId, scenePosition } from "@/aw2/world/scene"
import {
  newNpcPatrol,
  pinNpcApproach,
  PATROL_NPC_ID,
} from "@/aw2/world/npcPatrol"
import { walkingMarkerPlacement } from "@/aw2/assets/walkMarker"
import { villageCamera, type VillageCamera } from "@/aw2/assets/villageView"

const room = (): WorldProgress => ({
  ...newWorldProgress(),
  x: 300,
  y: 80,
  interior: { ...TEA_ROOM.spawn },
})
describe("016H ephemeral walking plans", () => {
  it.each(ZONE_IDS)(
    "uses the exact existing safe local path in %s",
    (zoneId) => {
      const world = { ...newWorldProgress(), zoneId },
        object = zoneById(zoneId).objects.find((o) => o.kind === "exit")!,
        point = placeApproach(object),
        before = JSON.stringify(world)
      const plan = planWalking(world, point)!
      expect(plan.target).toMatchObject({
        ...point,
        sceneId: zoneId,
        label: object.name,
      })
      expect(plan.path.at(-1)).toEqual({ x: point.x, y: point.y })
      let previous = scenePosition(world)
      for (const next of plan.path) {
        expect(clearPath(zoneId, previous, next)).toBe(true)
        previous = { ...previous, ...next }
      }
      expect(JSON.stringify(world)).toBe(before)
    },
  )
  it("labels floor taps neutrally, detects safe semantic approaches and detaches requested input", () => {
    const world = newWorldProgress(),
      request = { x: 240, y: 192 }
    const floor = planWalking(world, request)!
    expect(floor.target.label).toBe("Điểm đã chọn")
    expect(floor.target.entityId).toBeUndefined()
    expect(walkingArrivalText(floor.target)).toBe("Đã tới điểm đã chọn.")
    expect(planWalking(world, { x: 300, y: 80 })!.target).toMatchObject({
      entityId: TEA_DOOR_ID,
      label: "Cửa tiệm trà",
    })
    floor.target.x = 500
    floor.path[0].y = 300
    expect(request).toEqual({ x: 240, y: 192 })
    expect(world).toEqual(newWorldProgress())
  })
  it.each([
    { x: NaN, y: 192 },
    { x: Infinity, y: 192 },
    { x: 240, y: -Infinity },
    { x: 0, y: 192 },
    { x: 640, y: 192 },
    { x: 320, y: 320 },
  ])("rejects invalid or blocked target %#", (point) => {
    expect(planWalking(newWorldProgress(), point)).toBeNull()
  })
  it.each(["missing", TEA_EXIT_ID, "aw2-object-tea-party-desk"])(
    "rejects foreign/missing entity %s without a fallback",
    (entityId) => {
      expect(
        planWalking(newWorldProgress(), { x: 240, y: 192, entityId }),
      ).toBeNull()
    },
  )
  it("cannot label a distant floor point as an unrelated existing entity", () => {
    expect(
      planWalking(newWorldProgress(), { x: 96, y: 192, entityId: TEA_DOOR_ID }),
    ).toBeNull()
  })
  it("plans room desks/exits with a separate scene identity and no outside checkpoint changes", () => {
    const world = room(),
      before = JSON.stringify(world)
    for (const object of TEA_ROOM.objects) {
      const plan = planWalking(world, placeApproach(object))!
      expect(plan.target.sceneId).toBe(TEA_ROOM.id)
      expect(plan.target.entityId).toBe(object.id)
      expect(plan.path.at(-1)).toEqual({ x: plan.target.x, y: plan.target.y })
      expect(
        reachedWalkingTarget(
          {
            ...world,
            interior: {
              ...world.interior!,
              x: plan.target.x,
              y: plan.target.y,
            },
          },
          plan.target,
        ),
      ).toBe(true)
    }
    expect(JSON.stringify(world)).toBe(before)
    expect(planWalking(world, { ...TEA_ROOM.approach })).toBeNull()
  })
  it("keeps the existing moving-NPC pin snapshot as the destination authority", () => {
    const world = { ...newWorldProgress(), zoneId: ZONE_IDS[1] },
      patrol = { ...newNpcPatrol(ZONE_IDS[1]), x: 544, y: 160 }
    const pinned = pinNpcApproach(world, patrol, {
        x: 504,
        y: 160,
        entityId: PATROL_NPC_ID,
      }),
      before = JSON.stringify(pinned)
    const plan = planWalking(world, pinned.point, pinned.patrol)!
    expect(plan.target).toMatchObject({
      x: 544,
      y: 192,
      entityId: PATROL_NPC_ID,
    })
    expect(JSON.stringify(pinned)).toBe(before)
  })
  it("reports arrival only from actual final position in the same scene", () => {
    const world = newWorldProgress(),
      target = planWalking(world, { x: 240, y: 192 })!.target
    expect(reachedWalkingTarget({ ...world, x: 239 }, target)).toBe(true)
    expect(reachedWalkingTarget({ ...world, x: 238.99 }, target)).toBe(false)
    expect(
      reachedWalkingTarget({ ...world, x: 240, zoneId: ZONE_IDS[1] }, target),
    ).toBe(false)
    expect(reachedWalkingTarget(room(), target)).toBe(false)
    const semantic = planWalking(world, { ...TEA_ROOM.approach })!.target
    expect(walkingArrivalText(semantic)).toMatch(/Dùng E/)
  })
})

describe("016H camera-projected destination marker", () => {
  const camera: VillageCamera = {
    x: 320,
    y: 192,
    zoom: 1,
    width: 640,
    height: 384,
    mode: "overview",
  }
  const canvas = { left: 100, top: 50, width: 640, height: 384 }
  it("projects an onscreen target exactly and leaves input geometry unchanged", () => {
    const point = { x: 400, y: 240 },
      before = JSON.stringify({ point, camera, canvas })
    expect(walkingMarkerPlacement(point, camera, canvas, canvas)).toMatchObject(
      { x: 500, y: 290, offscreen: false },
    )
    expect(JSON.stringify({ point, camera, canvas })).toBe(before)
  })
  it.each([
    [-1000, 192, 118, 242],
    [2000, 192, 722, 242],
    [320, -1000, 420, 68],
    [320, 2000, 420, 416],
  ])("clamps offscreen target (%s,%s) to a visible edge", (x, y, px, py) => {
    expect(
      walkingMarkerPlacement({ x, y }, camera, canvas, canvas),
    ).toMatchObject({ x: px, y: py, offscreen: true })
  })
  it("uses the visible crop/status exclusion rather than full oversize canvas bounds", () => {
    const visible = { left: 300, top: 150, width: 240, height: 200 }
    expect(
      walkingMarkerPlacement({ x: 0, y: 0 }, camera, canvas, visible),
    ).toMatchObject({ x: 318, y: 168, offscreen: true })
    expect(
      walkingMarkerPlacement({ x: 320, y: 192 }, camera, canvas, visible),
    ).toMatchObject({ x: 420, y: 242, offscreen: false })
  })
  it.each([0.5, 1, 2])(
    "retains camera alignment under CSS display scale%s",
    (scale) => {
      const display = {
        left: 0,
        top: 0,
        width: 640 * scale,
        height: 384 * scale,
      }
      const result = walkingMarkerPlacement(
        { x: 400, y: 240 },
        camera,
        display,
        display,
      )!
      expect(result.x).toBe(400 * scale)
      expect(result.y).toBe(240 * scale)
    },
  )
  it("handles both actual follow and overview camera transforms", () => {
    for (const mode of ["follow", "overview"] as const) {
      const view = villageCamera({ x: 96, y: 192 }, mode),
        point = { x: view.x, y: view.y }
      expect(walkingMarkerPlacement(point, view, canvas, canvas)).toMatchObject(
        { x: 420, y: 242, offscreen: false },
      )
    }
  })
  it.each([
    { left: 0, top: 0, width: 0, height: 384 },
    { left: 0, top: 0, width: 20, height: 20 },
    { left: NaN, top: 0, width: 640, height: 384 },
    { left: 800, top: 800, width: 100, height: 100 },
  ])("hides empty, tiny, invalid or disjoint visible bounds %#", (visible) => {
    expect(
      walkingMarkerPlacement({ x: 320, y: 192 }, camera, canvas, visible),
    ).toBeNull()
  })
  it.each([0, -1, NaN, Infinity])(
    "rejects unusable camera scale %s",
    (zoom) => {
      expect(
        walkingMarkerPlacement(
          { x: 320, y: 192 },
          { ...camera, zoom },
          canvas,
          canvas,
        ),
      ).toBeNull()
    },
  )
  it("rejects invalid target, canvas dimensions and padding", () => {
    expect(
      walkingMarkerPlacement({ x: NaN, y: 192 }, camera, canvas, canvas),
    ).toBeNull()
    expect(
      walkingMarkerPlacement(
        { x: 320, y: 192 },
        camera,
        { ...canvas, width: 0 },
        canvas,
      ),
    ).toBeNull()
    expect(
      walkingMarkerPlacement({ x: 320, y: 192 }, camera, canvas, canvas, -1),
    ).toBeNull()
  })
})
