import { readFileSync, statSync } from "node:fs"
import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  TABLE_ROOM_SCENE as scene,
  tableRoomPropAlpha,
  tableRoomWaypoints,
} from "@/aw2/assets/tableRoom"
import { FORGOTTEN_HOST_ASSETS } from "@/aw2/assets/forgottenHost"
import { newWorldProgress, worldProgressSchema } from "@/aw2/world/model"
import {
  KITCHEN_BOSS_ID,
  MEMORY_IDS,
  STARTER_TEAM,
  TABLE_NOTE_ID,
  ZONE_IDS,
} from "@/aw2/world/ids"
import { canStand, zoneById } from "@/aw2/world/maps"
import { clearPath, findWorldPath } from "@/aw2/world/navigation"
function progress(stage: "quest" | "won" | "read" | "completed") {
  return worldProgressSchema.parse({
    ...newWorldProgress(),
    zoneId: ZONE_IDS[5],
    x: 96,
    y: 192,
    questIndex: stage === "completed" ? 4 : 3,
    accepted: stage !== "completed",
    tableRead: true,
    memories: [...MEMORY_IDS],
    threadChoice: "wait",
    hintRead: true,
    puzzleStep: 3,
    partyIds: [...STARTER_TEAM],
    bossDefeated: stage !== "quest",
    tableNoteRead: ["read", "completed"].includes(stage),
    endingChoice: stage === "completed" ? "wait" : null,
  })
}
describe("WORLD-SCENE-01 authored room matches unchanged world authority", () => {
  it("binds scene assets/prop to canonical room geometry and keeps incomplete status honest", () => {
    expect(scene.zoneId).toBe(ZONE_IDS[5])
    expect(scene.canvas).toEqual({ width: 640, height: 384 })
    expect(scene.fullEnvironmentComplete).toBe(false)
    expect(scene.status).toBe("REFERENCE_ENVIRONMENT")
    expect(scene.prop.footprint).toEqual(zoneById(ZONE_IDS[5]).walls[0])
    expect(scene.prop.y).toBe(
      scene.prop.footprint.y + scene.prop.footprint.height,
    )
    expect(scene.provenance.licenseStatus).toBe("REVIEW_REQUIRED")
    expect(scene.provenance.commercialRelease).toBe("NOT_CLEARED")
    expect(scene.bossMarker.entityId).toBe(KITCHEN_BOSS_ID)
    expect(scene.bossMarker.status).toBe(
      "STATIC_BATTLE_REFERENCE_NOT_WORLD_MODEL",
    )
    expect(
      FORGOTTEN_HOST_ASSETS.frames[
        scene.bossMarker.frame as keyof typeof FORGOTTEN_HOST_ASSETS.frames
      ],
    ).toBeDefined()
  })
  it.each(["floor", "sideboard"] as const)(
    "loads %s by actual SHA/bytes and alpha-safe in-bounds frame, preserving source",
    (name) => {
      const asset = scene.assets[name],
        runtime = asset.url.slice(1)
      expect(
        createHash("sha256").update(readFileSync(runtime)).digest("hex"),
      ).toBe(asset.sha256)
      expect(statSync(runtime).size).toBe(asset.bytes)
      expect(
        createHash("sha256")
          .update(readFileSync(asset.source.path))
          .digest("hex"),
      ).toBe(asset.source.sha256)
      const frame = asset.frame
      expect(frame.x).toBeGreaterThanOrEqual(0)
      expect(frame.y).toBeGreaterThanOrEqual(0)
      expect(frame.width).toBeGreaterThan(0)
      expect(frame.height).toBeGreaterThan(0)
      expect(frame.x + frame.width).toBeLessThanOrEqual(asset.width)
      expect(frame.y + frame.height).toBeLessThanOrEqual(asset.height)
      if (name === "sideboard")
        expect(scene.prop.width / scene.prop.height).toBeCloseTo(
          frame.width / frame.height,
          4,
        )
    },
  )
  it.each([
    { x: 96, y: 192 },
    { x: 576, y: 192 },
    { x: 272, y: 320 },
    { x: 320, y: 366 },
  ])(
    "reaches all canonical targets from safe point $x,$y through actual collision",
    (from) => {
      for (const target of tableRoomWaypoints(progress("completed"))) {
        const path = findWorldPath(ZONE_IDS[5], from, {
          x: target.x,
          y: target.y,
        })
        expect(path.length).toBeGreaterThan(0)
        let previous = from
        for (const point of path) {
          expect(canStand(ZONE_IDS[5], point.x, point.y)).toBe(true)
          expect(clearPath(ZONE_IDS[5], previous, point)).toBe(true)
          previous = point
        }
        expect(previous).toEqual({ x: target.x, y: target.y })
      }
    },
  )
  it("presents quest/win/read/ending truth without changing progress or granting actions", () => {
    for (const stage of ["quest", "won", "read", "completed"] as const) {
      const p = progress(stage),
        before = JSON.stringify(p),
        points = tableRoomWaypoints(p)
      expect(points).toHaveLength(4)
      expect(points.find((x) => x.id === KITCHEN_BOSS_ID)?.status).toBe(
        stage === "quest"
          ? "Có thể bắt đầu thử thách"
          : stage === "completed"
            ? "Đấu lại không nhận thưởng"
            : "Đã vượt thử thách",
      )
      expect(points.find((x) => x.id === TABLE_NOTE_ID)?.status).toBe(
        stage === "quest"
          ? "Vượt thử thách để đọc"
          : stage === "won"
            ? "Có thể đọc sau khi đến gần"
            : "Đã đọc ghi chép",
      )
      expect(
        points.find((x) => x.id === "aw2-shortcut-table-yard")?.locked,
      ).toBe(stage !== "completed")
      expect(JSON.stringify(p)).toBe(before)
      expect(points.every((x) => !("action" in x))).toBe(true)
    }
    expect(
      tableRoomWaypoints({ ...progress("quest"), zoneId: ZONE_IDS[0] }),
    ).toEqual([])
  })
  it("keeps return coordinates/native path targets sourced from map objects", () => {
    const points = tableRoomWaypoints(progress("completed"))
    for (const p of points) {
      const o = zoneById(ZONE_IDS[5]).objects.find((o) => o.id === p.id)!
      expect({ x: p.x, y: p.y, name: p.name }).toEqual({
        x: o.x,
        y: o.y,
        name: o.name,
      })
    }
    expect(points.find((p) => p.id.endsWith(":exit:west"))).toMatchObject({
      x: 24,
      y: 192,
      locked: false,
    })
    expect(
      points.find((p) => p.id === "aw2-shortcut-table-yard"),
    ).toMatchObject({ x: 520, y: 240 })
  })
  it("fades overlapping actors behind furniture while leaving front/clear/edge-only cases opaque", () => {
    const behind = { x: 270, y: 298, width: 24, height: 40, groundY: 320 }
    expect(tableRoomPropAlpha([behind])).toBe(scene.prop.occludedAlpha)
    expect(tableRoomPropAlpha([{ ...behind, groundY: 366 }])).toBe(1)
    expect(tableRoomPropAlpha([{ ...behind, x: 500 }])).toBe(1)
    expect(tableRoomPropAlpha([{ ...behind, x: 280 - 24 }])).toBe(1)
    expect(tableRoomPropAlpha([])).toBe(1)
    expect(tableRoomPropAlpha([{ ...behind, groundY: 366 }, behind])).toBe(
      scene.prop.occludedAlpha,
    )
    expect(behind).toEqual({
      x: 270,
      y: 298,
      width: 24,
      height: 40,
      groundY: 320,
    })
  })
})
