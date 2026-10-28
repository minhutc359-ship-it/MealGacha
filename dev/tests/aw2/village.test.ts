import { readFileSync, statSync } from "node:fs"
import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  VILLAGE_SCENE as scene,
  villageProps,
  villageWaypoints,
  villageWellAlpha,
} from "@/aw2/assets/village"
import { TABLE_ROOM_INTERACTIONS } from "@/aw2/assets/tableInteractions"
import {
  newWorldProgress,
  worldProgressSchema,
  type WorldProgress,
} from "@/aw2/world/model"
import { canStand, zoneById } from "@/aw2/world/maps"
import {
  applyWorldAction,
  describeObject,
  INTERACT_RANGE,
} from "@/aw2/world/rules"
import { clearPath, findWorldPath } from "@/aw2/world/navigation"
import { MEMORY_IDS, STARTER_TEAM, ZONE_IDS } from "@/aw2/world/ids"

const hash = (path: string) =>
  createHash("sha256").update(readFileSync(path)).digest("hex")
const keeper = "aw2-npc-giu-cho",
  table = "aw2-object-village-table"
function act(p: WorldProgress, id: string, action: string) {
  const point = villageWaypoints(p).find((point) => point.id === id)!
  return applyWorldAction({ ...p, x: point.walkX, y: point.walkY }, id, action)
    .state
}
function ending(choice: "wait" | "share"): WorldProgress {
  return worldProgressSchema.parse({
    ...newWorldProgress(),
    questIndex: 4,
    tableRead: true,
    memories: [...MEMORY_IDS],
    threadChoice: "wait",
    hintRead: true,
    puzzleStep: 3,
    partyIds: [...STARTER_TEAM],
    bossDefeated: true,
    tableNoteRead: true,
    endingChoice: choice,
  })
}

describe("006G original village scene stays separate from world authority", () => {
  it("retains canonical points, collider, reference status and bounded real assets", () => {
    expect(scene.zoneId).toBe(ZONE_IDS[0])
    expect(scene.canvas).toEqual({ width: 640, height: 384 })
    expect(scene.obstacle.footprint).toEqual(zoneById(ZONE_IDS[0]).walls[0])
    expect(scene.assets.threshold).toEqual(
      TABLE_ROOM_INTERACTIONS.assets.threshold,
    )
    expect(scene.fullEnvironmentComplete).toBe(false)
    expect(scene.npcMotionComplete).toBe(false)
    expect(scene.provenance.licenseStatus).toBe("REVIEW_REQUIRED")
    expect(scene.provenance.commercialRelease).toBe("NOT_CLEARED")
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
  })
  it.each(["floor", "props", "threshold"] as const)(
    "binds %s runtime/source bytes and prompt provenance",
    (key) => {
      const asset = scene.assets[key]
      expect(hash(asset.source.path)).toBe(asset.source.sha256)
      expect(hash(asset.url.slice(1))).toBe(asset.sha256)
      expect(statSync(asset.url.slice(1)).size).toBe(asset.bytes)
      for (const p of [scene.provenance.reference, scene.provenance.prompts])
        expect(hash(p.path)).toBe(p.sha256)
    },
  )
  it("uses distinct in-bounds atlas cells and uniform render scale", () => {
    expect(Object.keys(scene.frames)).toEqual(["keeper", "table", "well"])
    for (const [key, f] of Object.entries(scene.frames)) {
      expect(f.x).toBeGreaterThan(0)
      expect(f.y).toBeGreaterThan(0)
      expect(f.x + f.width).toBeLessThan(scene.assets.props.width)
      expect(f.y + f.height).toBeLessThan(scene.assets.props.height)
      const prop =
        key === "well"
          ? scene.obstacle
          : scene.props.find((p) => p.frame === key)!
      expect(prop.width / prop.height).toBeCloseTo(f.width / f.height, 5)
    }
  })
  it("describes actual intro accept/read/hand-in states without granting on walk or render", () => {
    const fresh = newWorldProgress(),
      before = JSON.stringify(fresh)
    expect(villageWaypoints(fresh).find((p) => p.id === table)?.state).toBe(
      "unavailable",
    )
    expect(
      villageWaypoints(fresh).find((p) => p.id === keeper)?.status,
    ).toContain("Nhận nhiệm vụ")
    const accepted = act(fresh, keeper, "accept")
    expect(villageWaypoints(accepted).find((p) => p.id === table)?.state).toBe(
      "ready",
    )
    const read = act(accepted, table, "inspect")
    expect(villageWaypoints(read).find((p) => p.id === table)?.state).toBe(
      "read",
    )
    expect(
      villageWaypoints(read).find((p) => p.id === keeper)?.status,
    ).toContain("Hoàn tất nhập môn")
    const complete = act(read, keeper, "turn-in")
    expect(complete.partyIds).toEqual(STARTER_TEAM)
    expect(villageWaypoints(complete).find((p) => p.id === keeper)?.state).toBe(
      "waiting",
    )
    villageProps(fresh)
    expect(JSON.stringify(fresh)).toBe(before)
    expect(fresh.partyIds).toEqual([])
  })
  it.each(["wait", "share"] as const)(
    "reflects actual %s ending and pending final choice without making it",
    (choice) => {
      const done = ending(choice),
        pending = worldProgressSchema.parse({
          ...done,
          questIndex: 3,
          accepted: true,
          endingChoice: null,
        })
      expect(villageWaypoints(done).find((p) => p.id === keeper)).toMatchObject(
        {
          state: "completed",
          status:
            choice === "wait"
              ? "Đã để ghế trống chờ"
              : "Đã mời cả làng dùng bữa",
        },
      )
      expect(
        villageWaypoints(pending).find((p) => p.id === keeper)?.status,
      ).toContain("chọn lời mời")
      expect(pending.endingChoice).toBeNull()
    },
  )
  it("derives object coordinates from maps and separate safe approach within authoritative range", () => {
    const fresh = newWorldProgress(),
      points = villageWaypoints(fresh)
    expect(points).toHaveLength(6)
    for (const p of points) {
      const object = zoneById(fresh.zoneId).objects.find((o) => o.id === p.id)!
      expect([p.x, p.y, p.name]).toEqual([object.x, object.y, object.name])
      expect(canStand(fresh.zoneId, p.walkX, p.walkY)).toBe(true)
      expect(Math.hypot(p.walkX - p.x, p.walkY - p.y)).toBeLessThanOrEqual(
        INTERACT_RANGE,
      )
      expect(p.locked).toBe(
        object.kind === "exit" &&
          !describeObject(fresh, object).actions.some((a) => a.id === "travel"),
      )
      expect(p).not.toHaveProperty("action")
    }
    const props = villageProps(fresh)
    props[0].x = 999
    expect(villageProps(fresh)[0].x).toBe(160)
    expect(villageWaypoints({ ...fresh, zoneId: ZONE_IDS[1] })).toEqual([])
    expect(villageProps({ ...fresh, zoneId: ZONE_IDS[1] })).toEqual([])
  })
  it.each([
    { x: 96, y: 192 },
    { x: 576, y: 192 },
    { x: 272, y: 320 },
    { x: 320, y: 366 },
  ])(
    "routes safely around the unchanged well from $x,$y to every approach",
    (from) => {
      for (const p of villageWaypoints(newWorldProgress())) {
        const target = { x: p.walkX, y: p.walkY },
          path = findWorldPath(ZONE_IDS[0], from, target)
        expect(path.length).toBeGreaterThan(0)
        let prior = from
        for (const next of path) {
          expect(canStand(ZONE_IDS[0], next.x, next.y)).toBe(true)
          expect(clearPath(ZONE_IDS[0], prior, next)).toBe(true)
          prior = next
        }
        expect(prior).toEqual(target)
      }
    },
  )
  it("fades well only when a leader behind it intersects the rendered bounds", () => {
    const before = { x: 310, y: 280, width: 20, height: 45, groundY: 296 }
    expect(villageWellAlpha([before])).toBe(scene.obstacle.occludedAlpha)
    expect(villageWellAlpha([{ ...before, groundY: 360 }])).toBe(1)
    expect(villageWellAlpha([{ ...before, x: 90 }])).toBe(1)
    expect(villageWellAlpha([])).toBe(1)
    expect(canStand(ZONE_IDS[0], 320, 320)).toBe(false)
  })
})
