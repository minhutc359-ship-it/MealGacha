import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import {
  JOURNEY_SCENES,
  journeyWaypoints,
  journeyProps,
  journeyObstacleAlpha,
} from "@/aw2/assets/journeyScenes"
import {
  landscapeCamera,
  projectVillage,
  unprojectVillage,
  villageWorldBounds,
  villageFoliage,
} from "@/aw2/assets/villageView"
import { newWorldProgress, worldProgressSchema } from "@/aw2/world/model"
import {
  newEconomy,
  CHEST_RECEIPT,
  applyEconomyAction,
} from "@/aw2/economy/model"
import { ZONE_IDS, MEMORY_IDS, STARTER_TEAM } from "@/aw2/world/ids"
import { zoneById, canStand } from "@/aw2/world/maps"
import { describeObject, INTERACT_RANGE } from "@/aw2/world/rules"
import { findWorldPath, clearPath } from "@/aw2/world/navigation"

const hash = (p: string) =>
  createHash("sha256").update(readFileSync(p)).digest("hex")
const at = (zoneId: typeof ZONE_IDS[number]) => ({
  ...newWorldProgress(),
  zoneId,
})
describe("006H/J/K authored journey scenes read real authority", () => {
  it.each(JOURNEY_SCENES)(
    "binds $zoneId actual pixels/refs/budget and safe uniform sprite frames",
    (scene) => {
      expect(scene.fullEnvironmentComplete).toBe(false)
      expect(scene.npcMotionComplete).toBe(false)
      expect(scene.obstacle.footprint).toEqual(
        zoneById(scene.zoneId as typeof ZONE_IDS[number]).walls[0],
      )
      expect(scene.provenance.licenseStatus).toBe("REVIEW_REQUIRED")
      for (const asset of Object.values(scene.assets)) {
        expect(hash(asset.source.path)).toBe(asset.source.sha256)
        expect(hash(asset.url.slice(1))).toBe(asset.sha256)
      }
      for (const ref of [
        scene.provenance.prompts,
        ...scene.provenance.references,
      ])
        expect(hash(ref.path)).toBe(ref.sha256)
      expect(Object.values(scene.assets).reduce((n, a) => n + a.bytes, 0)).toBe(
        scene.budget.compressedBytes,
      )
      expect(scene.budget.compressedBytes).toBeLessThanOrEqual(
        scene.budget.maxCompressedBytes,
      )
      expect(scene.budget.decodedRgbaBytes).toBeLessThanOrEqual(
        scene.budget.maxDecodedRgbaBytes,
      )
      for (const prop of scene.props) {
        const frame =
          prop.asset === "threshold"
            ? scene.assets.threshold.frame!
            : scene.frames[prop.frame]
        expect(prop.width / prop.height).toBeCloseTo(
          frame.width / frame.height,
          5,
        )
        expect(frame.x).toBeGreaterThan(0)
        expect(frame.y).toBeGreaterThan(0)
        expect(frame.x + frame.width).toBeLessThan(
          scene.assets[prop.asset].width,
        )
        expect(frame.y + frame.height).toBeLessThan(
          scene.assets[prop.asset].height,
        )
      }
    },
  )
  it.each(JOURNEY_SCENES)(
    "preserves $zoneId canonical points/permissions and safe native approach routes",
    (scene) => {
      const world = at(scene.zoneId as typeof ZONE_IDS[number]),
        economy = newEconomy(),
        points = journeyWaypoints(world, economy)
      expect(points).toHaveLength(zoneById(world.zoneId).objects.length)
      for (const p of points) {
        const obj = zoneById(world.zoneId).objects.find((o) => o.id === p.id)!
        expect([p.x, p.y, p.name]).toEqual([obj.x, obj.y, obj.name])
        expect(canStand(world.zoneId, p.walkX, p.walkY)).toBe(true)
        expect(Math.hypot(p.x - p.walkX, p.y - p.walkY)).toBeLessThanOrEqual(
          INTERACT_RANGE,
        )
        if (obj.kind === "exit")
          expect(p.locked).toBe(
            !describeObject(world, obj).actions.some((a) => a.id === "travel"),
          )
        for (const from of [
          { x: 96, y: 192 },
          { x: 576, y: 192 },
          { x: 320, y: 366 },
        ]) {
          const path = findWorldPath(world.zoneId, from, {
            x: p.walkX,
            y: p.walkY,
          })
          expect(path.length).toBeGreaterThan(0)
          let prior = from
          for (const next of path) {
            expect(clearPath(world.zoneId, prior, next)).toBe(true)
            prior = next
          }
        }
      }
      expect(points.every((p) => !("action" in p))).toBe(true)
    },
  )
  it.each(JOURNEY_SCENES)(
    "roundtrips $zoneId view at all world corners without changing input",
    (scene) => {
      const world = at(scene.zoneId as typeof ZONE_IDS[number]),
        economy = newEconomy(),
        before = JSON.stringify({ world, economy, scene })
      for (const mode of ["follow", "overview"] as const)
        for (const p of [
          { x: 16, y: 16 },
          { x: 624, y: 368 },
          { x: scene.camera.centerX, y: scene.camera.centerY },
        ]) {
          const c = landscapeCamera(p, mode, scene),
            v = projectVillage(p, c),
            actual = unprojectVillage(v, c)
          expect(actual.x).toBeCloseTo(p.x, 10)
          expect(actual.y).toBeCloseTo(p.y, 10)
          expect(c.x - c.width / c.zoom / 2).toBeGreaterThanOrEqual(
            scene.landscape.x,
          )
          expect(c.x + c.width / c.zoom / 2).toBeLessThanOrEqual(
            scene.landscape.x + scene.landscape.width,
          )
          const b = villageWorldBounds(
            { ...v, width: 16 * c.zoom, height: 48 * c.zoom },
            c,
          )
          expect(b.width).toBeCloseTo(16, 10)
          expect(b.height).toBeCloseTo(48, 10)
          villageFoliage(c, b, true, scene)
        }
      journeyProps(world, economy)
      expect(JSON.stringify({ world, economy, scene })).toBe(before)
    },
  )
  it("chest state depends on real receipt, not inventory or arrival", () => {
    const world = { ...at(ZONE_IDS[3]), x: 432, y: 304 },
      economy = newEconomy(),
      point = () =>
        journeyWaypoints(world, economy).find(
          (p) => p.id === "aw2-chest-pantry",
        )!
    economy.inventory.rice = 9999
    expect(point().state).toBe("ready")
    economy.inventory.rice = 0
    const claimed = applyEconomyAction(economy, world, "open-chest")
    expect(claimed.receipts).toContain(CHEST_RECEIPT)
    expect(point().state).toBe("ready")
    expect(
      journeyWaypoints(world, claimed).find((p) => p.id === "aw2-chest-pantry")
        ?.state,
    ).toBe("claimed")
    expect(() => applyEconomyAction(claimed, world, "open-chest")).toThrow()
    expect(economy.receipts).toEqual([])
  })
  it("hint and memories reflect actual availability/read state", () => {
    const economy = newEconomy(),
      pantry = at(ZONE_IDS[3]),
      street = at(ZONE_IDS[1]),
      hint = (p: typeof pantry) =>
        journeyWaypoints(p, economy).find(
          (p) => p.id === "aw2-object-hearth-hint",
        )!
    expect(hint(pantry).state).toBe("unavailable")
    expect(hint({ ...pantry, questIndex: 2, accepted: true }).state).toBe(
      "ready",
    )
    expect(hint({ ...pantry, hintRead: true }).state).toBe("read")
    expect(
      journeyWaypoints(street, economy).find(
        (p) => p.id === "aw2-npc-nguoi-ban",
      )?.state,
    ).toBe("unavailable")
    expect(
      journeyWaypoints(
        { ...street, questIndex: 1, accepted: true },
        economy,
      ).find((p) => p.id === "aw2-npc-nguoi-ban")?.state,
    ).toBe("ready")
    expect(
      journeyWaypoints({ ...street, memories: [MEMORY_IDS[0]] }, economy).find(
        (p) => p.id === "aw2-npc-nguoi-ban",
      )?.state,
    ).toBe("read")
  })
  it("yard gates follow actual quest acceptance/completion; mode entry remains explicit", () => {
    const economy = newEconomy(),
      world = at(ZONE_IDS[2]),
      exit = (p: typeof world, id: string) =>
        journeyWaypoints(p, economy).find((q) => q.id === id)!
    expect(exit(world, world.zoneId + ":exit:east").locked).toBe(true)
    expect(
      exit(
        { ...world, questIndex: 2, accepted: true },
        world.zoneId + ":exit:east",
      ).locked,
    ).toBe(false)
    expect(exit(world, "aw2-shortcut-yard-table").locked).toBe(true)
    const done = worldProgressSchema.parse({
      ...world,
      questIndex: 4,
      tableRead: true,
      memories: [...MEMORY_IDS],
      threadChoice: "wait",
      hintRead: true,
      puzzleStep: 3,
      partyIds: [...STARTER_TEAM],
      bossDefeated: true,
      tableNoteRead: true,
      endingChoice: "wait",
    })
    expect(exit(done, "aw2-shortcut-yard-table").locked).toBe(false)
    expect(
      journeyWaypoints(at(ZONE_IDS[1]), economy)
        .filter((p) => p.id === "aw2-npc-ban-bai" || p.id === "aw2-npc-ban-co")
        .every((p) => !p.locked && p.state === "ready"),
    ).toBe(true)
  })
  it.each(JOURNEY_SCENES)(
    "fades only genuinely overlapping leader behind $zoneId original crate",
    (scene) => {
      expect(
        journeyObstacleAlpha(scene, {
          x: 310,
          y: 286,
          width: 20,
          height: 48,
          groundY: 296,
        }),
      ).toBe(0.35)
      expect(
        journeyObstacleAlpha(scene, {
          x: 310,
          y: 350,
          width: 20,
          height: 48,
          groundY: 366,
        }),
      ).toBe(1)
      expect(
        journeyObstacleAlpha(scene, {
          x: 90,
          y: 100,
          width: 20,
          height: 48,
          groundY: 148,
        }),
      ).toBe(1)
    },
  )
  it("returns detached snapshots and no targets outside authored regions", () => {
    const w = at(ZONE_IDS[1]),
      e = newEconomy(),
      p = journeyProps(w, e)
    p[0].x = 999
    p[0].state = "claimed"
    expect(journeyProps(w, e)[0].x).toBe(160)
    expect(journeyProps(w, e)[0].state).not.toBe("claimed")
    expect(journeyWaypoints(newWorldProgress(), e)).toEqual([])
    expect(journeyProps(newWorldProgress(), e)).toEqual([])
  })
})
