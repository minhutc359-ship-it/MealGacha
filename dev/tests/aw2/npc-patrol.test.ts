import { describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import {
  advanceNpcPatrol,
  facePatrolNpc,
  newNpcPatrol,
  npcPatrolView,
  npcNeedsStoryAnchor,
  NPC_PATROL,
  PATROL_NPC_ID,
  PATROL_ZONE,
  pinNpcApproach,
  releaseNpcApproach,
  worldObjects,
} from "@/aw2/world/npcPatrol"
import { newWorldProgress } from "@/aw2/world/model"
import { MEMORY_IDS, STARTER_TEAM, ZONE_IDS } from "@/aw2/world/ids"
import { canStand, zoneById } from "@/aw2/world/maps"
import {
  applyWorldAction,
  describeObject,
  nearestObject,
} from "@/aw2/world/rules"
import { clearPath, findWorldPath } from "@/aw2/world/navigation"
import { journeyDirections } from "@/aw2/world/journey"
import { PATROL_VISUAL, samplePatrolVisual } from "@/aw2/assets/npcPatrol"
import { loadNpcTextures } from "../../aw2/npcSprites"

const world = () => ({
  ...newWorldProgress(),
  zoneId: PATROL_ZONE,
  x: 96,
  y: 192,
})
const active = () => ({
  ...world(),
  questIndex: 1,
  accepted: true,
  tableRead: true,
  partyIds: [...STARTER_TEAM],
})
const moving = () => ({ ...newNpcPatrol(PATROL_ZONE), restMs: 0 })
const hash = (p: string) =>
  createHash("sha256").update(readFileSync(p)).digest("hex")

describe("016B real NPC patrol", () => {
  it("uses bounded deterministic steps at 26px/s without catch-up", () => {
    const start = moving(),
      next = advanceNpcPatrol(world(), start, 100)
    expect(next.x - start.x).toBeCloseTo(2.6)
    expect(next).toEqual(advanceNpcPatrol(world(), start, 100))
    expect(next).toEqual(advanceNpcPatrol(world(), start, 10_000))
    expect(advanceNpcPatrol(world(), start, 0)).toEqual(start)
  })
  it("finishes the safe four-facing circuit without mutating canonical objects or progress", () => {
    const w = world(),
      before = JSON.stringify([w, zoneById(PATROL_ZONE)])
    let pose = newNpcPatrol(PATROL_ZONE)
    const facings = new Set<string>()
    for (let i = 0; i < 400; i++) {
      const next = advanceNpcPatrol(w, pose, 33)
      expect(clearPath(PATROL_ZONE, pose, next)).toBe(true)
      expect(next.x).toBeGreaterThanOrEqual(504)
      expect(next.x).toBeLessThanOrEqual(544)
      expect(next.y).toBeGreaterThanOrEqual(128)
      expect(next.y).toBeLessThanOrEqual(160)
      if (next.moving) facings.add(next.facing)
      pose = next
    }
    expect([...facings].sort()).toEqual(["down", "left", "right", "up"])
    expect(JSON.stringify([w, zoneById(PATROL_ZONE)])).toBe(before)
  })
  it("freezes position, rest and timeline for modal/reduced pauses then resumes", () => {
    const p = advanceNpcPatrol(world(), moving(), 33)
    for (const control of [{ paused: true }, { reduced: true }]) {
      const stopped = advanceNpcPatrol(world(), p, 100, control)
      expect(stopped).toEqual({ ...p, moving: false })
      expect(advanceNpcPatrol(world(), stopped, 100, control)).toEqual(stopped)
      expect(advanceNpcPatrol(world(), stopped, 33).x).toBeGreaterThan(p.x)
    }
  })
  it.each([-1, NaN, Infinity])("rejects invalid delta %s", (delta) => {
    expect(() => advanceNpcPatrol(world(), moving(), delta)).toThrow(
      "Invalid NPC patrol delta",
    )
  })
  it.each([
    [504, 96, "up"],
    [504, 160, "down"],
    [472, 128, "left"],
    [536, 128, "right"],
  ] as const)("faces nearby player at %s,%s using %s", (x, y, facing) => {
    const w = { ...world(), x, y },
      p = facePatrolNpc(w, moving())
    expect(p.facing).toBe(facing)
    expect(p.moving).toBe(false)
    expect([p.x, p.y]).toEqual([504, 128])
  })
  it("holds a nearby conversation without a save write and resumes after player leaves", () => {
    const p = moving(),
      near = { ...world(), x: 504, y: 160 }
    expect(advanceNpcPatrol(near, p, 100).x).toBe(504)
    expect(advanceNpcPatrol(world(), p, 100).x).toBeGreaterThan(504)
  })
  it("pins a native approach until explicitly released", () => {
    const w = world(),
      p = moving(),
      { patrol, point } = pinNpcApproach(w, p, { x: 504, y: 160 })
    expect(point).toEqual({ x: 504, y: 160, entityId: PATROL_NPC_ID })
    expect(advanceNpcPatrol(w, patrol, 100).x).toBe(504)
    const released = releaseNpcApproach(patrol)
    expect(advanceNpcPatrol(w, released, 100).x).toBeGreaterThan(504)
    expect(pinNpcApproach(w, patrol, { x: 320, y: 240 }).patrol.held).toBe(
      false,
    )
  })
  it("resolves a stale button by entity identity at click time", () => {
    const w = world(),
      p = { ...moving(), x: 544, y: 160 }
    const pinned = pinNpcApproach(w, p, {
      x: 504,
      y: 160,
      entityId: PATROL_NPC_ID,
    })
    expect(pinned.point).toEqual({ x: 544, y: 192, entityId: PATROL_NPC_ID })
    expect(clearPath(PATROL_ZONE, w, pinned.point)).toBe(true)
  })
  it("makes the quest memory immediately available at its anchor even during pause", () => {
    const w = active(),
      p = { ...moving(), x: 544, y: 160 }
    expect(npcNeedsStoryAnchor(w)).toBe(true)
    expect(npcPatrolView(w, p)).toMatchObject({ x: 504, y: 128, moving: false })
    expect(
      advanceNpcPatrol(w, p, 100, { paused: true, reduced: true }),
    ).toMatchObject({ x: 504, y: 128, nextPoint: 1, walkMs: 0 })
    expect(
      journeyDirections(w, p).find((d) => d.targetId === PATROL_NPC_ID)
        ?.approach,
    ).toEqual({ x: 504, y: 160 })
    expect(npcNeedsStoryAnchor({ ...w, memories: [MEMORY_IDS[2]] })).toBe(false)
  })
  it("keeps the existing canonical memory write authoritative and once-only", () => {
    const w = { ...active(), x: 504, y: 160 }
    const result = applyWorldAction(w, PATROL_NPC_ID, "remember").state
    expect(result.memories).toEqual([MEMORY_IDS[2]])
    expect(() => applyWorldAction(result, PATROL_NPC_ID, "remember")).toThrow()
    const npc = worldObjects(world(), moving()).find(
      (o) => o.id === PATROL_NPC_ID,
    )!
    expect(describeObject(world(), npc).actions).toEqual([])
  })
  it("uses the live location for proximity and rejects an empty old anchor", () => {
    const p = { ...moving(), x: 544, y: 160 },
      w = { ...world(), x: 544, y: 192 }
    expect(nearestObject(w, p)?.id).toBe(PATROL_NPC_ID)
    expect(nearestObject(w)?.id).not.toBe(PATROL_NPC_ID)
    expect(nearestObject({ ...w, x: 472, y: 128 }, p)?.id).not.toBe(
      PATROL_NPC_ID,
    )
  })
  it("returns detached objects and never puts patrol state into progress", () => {
    const w = world(),
      before = JSON.stringify(w),
      objects = worldObjects(w, moving())
    objects[0].x = -99
    expect(zoneById(PATROL_ZONE).objects[0].x).toBe(160)
    expect(JSON.stringify(w)).toBe(before)
    expect(w).not.toHaveProperty("walkMs")
    expect(w).not.toHaveProperty("patrol")
  })
  it("resets transient movement on zone entry/reload without changing the save", () => {
    const p = { ...moving(), x: 544, y: 160, held: true },
      w = { ...world(), zoneId: ZONE_IDS[0] }
    expect(advanceNpcPatrol(w, p, 33)).toEqual(newNpcPatrol(ZONE_IDS[0]))
    expect(npcPatrolView(world(), newNpcPatrol(ZONE_IDS[0]))).toEqual(
      newNpcPatrol(PATROL_ZONE),
    )
  })
  it("preserves original pixels/hash and all16 authored frame rectangles", () => {
    const m = PATROL_VISUAL,
      a = m.asset
    expect(hash(a.source.path)).toBe(a.source.sha256)
    expect(hash(a.url.slice(1))).toBe(a.sha256)
    expect(readFileSync(a.url.slice(1)).length).toBe(a.bytes)
    expect(Object.keys(m.frames)).toHaveLength(16)
    for (const f of Object.values(m.frames)) {
      expect(f.alphaEdgeMax).toBeLessThanOrEqual(8)
      expect(f.anchorX).toBeGreaterThan(0)
      expect(f.anchorX).toBeLessThan(f.width)
      expect(f.anchorY).toBeLessThan(f.height)
    }
    expect(m.fullNpcComplete).toBe(false)
    expect(m.provenance.commercialRelease).toBe("NOT_CLEARED")
    expect(m.provenance.exactPromptStatus).toBe("LOST_WITH_TEMPORARY_WORKSPACE")
  })
  it("samples real facing rows and freezes authored idle under reduced motion", () => {
    for (const facing of ["down", "left", "right", "up"] as const) {
      const p = { ...moving(), facing, moving: true, walkMs: 0 }
      expect(samplePatrolVisual(world(), p)).toBe(`${facing}-walk1`)
      expect(samplePatrolVisual(world(), { ...p, walkMs: 140 })).toBe(
        `${facing}-walk2`,
      )
      expect(samplePatrolVisual(world(), { ...p, walkMs: 280 })).toBe(
        `${facing}-walk3`,
      )
      expect(samplePatrolVisual(world(), p, true)).toBe(`${facing}-idle`)
    }
  })
  it("replaces only the required street NPC texture, without loading both sheets", async () => {
    const urls: string[] = []
    await loadNpcTextures(PATROL_ZONE, async (url) => {
      urls.push(url)
      return {} as never
    })
    expect(urls).toHaveLength(6)
    expect(urls.filter((u) => u.includes("/dem-nuoc/"))).toEqual([
      PATROL_VISUAL.asset.url,
    ])
    urls.length = 0
    await loadNpcTextures(ZONE_IDS[0], async (url) => {
      urls.push(url)
      return {} as never
    })
    expect(urls.some((u) => u.includes("patrol-v1"))).toBe(false)
  })
  it("keeps every patrol endpoint and approach reachable without blocking existing exits", () => {
    const w = world()
    for (const point of NPC_PATROL.route) {
      expect(canStand(PATROL_ZONE, point.x, point.y)).toBe(true)
      expect(
        findWorldPath(PATROL_ZONE, w, { x: point.x, y: point.y + 32 }).length,
      ).toBeGreaterThan(0)
    }
    for (const exit of zoneById(PATROL_ZONE).objects.filter(
      (o) => o.kind === "exit",
    ))
      expect(
        findWorldPath(PATROL_ZONE, w, {
          x: exit.x + (exit.x > 320 ? -24 : 24),
          y: exit.y,
        }).length,
      ).toBeGreaterThan(0)
  })
})
