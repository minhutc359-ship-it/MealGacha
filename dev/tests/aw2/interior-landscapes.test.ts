import { readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  INTERIOR_LANDSCAPES,
  interiorScene,
  interiorWaypoints,
} from "@/aw2/assets/interiorLandscapes"
import {
  landscapeCamera,
  projectVillage,
  unprojectVillage,
  villageWorldBounds,
} from "@/aw2/assets/villageView"
import type { ZoneId } from "@/aw2/world/ids"
import { newWorldProgress } from "@/aw2/world/model"
import { canStand, zoneById } from "@/aw2/world/maps"
import { findWorldPath, clearPath } from "@/aw2/world/navigation"
import { TABLE_ROOM_SCENE, tableRoomPropAlpha } from "@/aw2/assets/tableRoom"
import { FORGOTTEN_HOST_WORLD } from "@/aw2/assets/bossWorld"
const hash = (path: string) =>
  createHash("sha256").update(readFileSync(path)).digest("hex")

describe.each(INTERIOR_LANDSCAPES)(
  "006L $zoneId scenic presentation",
  (scene) => {
    it("binds exact source/runtime/prompt/reference hashes and truthful bounded texture inventory", () => {
      expect(interiorScene(scene.zoneId as ZoneId)).toBe(scene)
      expect(scene.fullEnvironmentComplete).toBe(false)
      expect(scene.provenance.licenseStatus).toBe("REVIEW_REQUIRED")
      expect(scene.provenance.commercialRelease).toBe("NOT_CLEARED")
      for (const a of Object.values(scene.assets)) {
        expect(hash(a.url.slice(1))).toBe(a.sha256)
        expect(readFileSync(a.url.slice(1)).length).toBe(a.bytes)
        expect(hash(a.source.path)).toBe(a.source.sha256)
      }
      expect(hash(scene.provenance.prompts.path)).toBe(
        scene.provenance.prompts.sha256,
      )
      for (const ref of scene.provenance.references)
        expect(hash(ref.path)).toBe(ref.sha256)
      expect(scene.budget.compressedBytes).toBe(
        Object.values(scene.assets).reduce((n, a) => n + a.bytes, 0),
      )
      expect(scene.budget.decodedRgbaBytes).toBe(
        Object.values(scene.assets).reduce(
          (n, a) => n + a.width * a.height * 4,
          0,
        ),
      )
      expect(scene.budget.compressedBytes).toBeLessThanOrEqual(
        scene.budget.maxCompressedBytes,
      )
      expect(scene.budget.decodedRgbaBytes).toBeLessThanOrEqual(
        scene.budget.maxDecodedRgbaBytes,
      )
      expect(scene.assets.sideboard).toEqual(TABLE_ROOM_SCENE.assets.sideboard)
    })
    it("keeps native playfield flat at uniform source scale and exact camera inverse including boss/props", () => {
      expect(scene.landscape).toEqual({
        x: -448,
        y: -320,
        width: 1536,
        height: 1024,
      })
      const f = scene.safeSourcePlayfield
      expect({
        x: f.x + scene.landscape.x,
        y: f.y + scene.landscape.y,
        width: f.width,
        height: f.height,
      }).toEqual({ x: 16, y: 16, width: 608, height: 352 })
      for (const mode of ["follow", "overview"] as const) {
        const camera = landscapeCamera({ x: 96, y: 192 }, mode, scene)
        for (const o of zoneById(scene.zoneId as ZoneId).objects) {
          const v = projectVillage(o, camera),
            p = unprojectVillage(v, camera)
          expect(p.x).toBeCloseTo(o.x, 10)
          expect(p.y).toBeCloseTo(o.y, 10)
        }
        const a = { x: 352, y: 310, width: 20, height: 40 },
          p = projectVillage(a, camera)
        const bounds = villageWorldBounds(
          {
            ...p,
            width: a.width * camera.zoom,
            height: a.height * camera.zoom,
          },
          camera,
        )
        expect(bounds.x).toBeCloseTo(a.x, 10)
        expect(bounds.width).toBeCloseTo(a.width, 10)
        expect(tableRoomPropAlpha([{ ...bounds, groundY: 320 }])).toBe(0.35)
      }
    })
    it("approaches every canonical object within interaction range through collision-safe paths without mutations", () => {
      const progress = { ...newWorldProgress(), zoneId: scene.zoneId as ZoneId }
      const before = JSON.stringify(progress),
        points = interiorWaypoints(progress),
        zone = zoneById(scene.zoneId as ZoneId)
      expect(points).toHaveLength(zone.objects.length)
      for (const p of points) {
        const o = zone.objects.find((o) => o.id === p.id)!
        expect(Math.hypot(p.walkX - o.x, p.walkY - o.y)).toBeLessThanOrEqual(32)
        expect(canStand(scene.zoneId as ZoneId, p.walkX, p.walkY)).toBe(true)
        const path = findWorldPath(scene.zoneId as ZoneId, { x: 96, y: 192 }, {
          x: p.walkX,
          y: p.walkY,
        })
        expect(path.length).toBeGreaterThan(0)
        expect(path.at(-1)).toEqual({ x: p.walkX, y: p.walkY })
        let previous = { x: 96, y: 192 }
        for (const next of path) {
          expect(clearPath(scene.zoneId as ZoneId, previous, next)).toBe(true)
          previous = next
        }
      }
      expect(JSON.stringify(progress)).toBe(before)
      expect(zone.walls[0]).toEqual(TABLE_ROOM_SCENE.prop.footprint)
    })
  },
)
it("keeps the table's own boss asset and rejects unsupported scene lookup", () => {
  expect(INTERIOR_LANDSCAPES[1].assets.boss).toEqual(FORGOTTEN_HOST_WORLD.asset)
  expect(interiorScene("unknown")).toBeUndefined()
  expect(interiorWaypoints(newWorldProgress())).toEqual([])
})
