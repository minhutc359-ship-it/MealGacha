import { describe, expect, it } from "vitest"
import { Aw2DevSaveStore } from "@/aw2/save/store"
import { AW2_DEV_SAVE_KEY } from "@/aw2/save/schema"
import { MEMORY_IDS, STARTER_TEAM, ZONE_IDS } from "@/aw2/world/ids"
import { canStand, ZONES, zoneById } from "@/aw2/world/maps"
import {
  newWorldProgress,
  worldProgressSchema,
  type WorldProgress,
} from "@/aw2/world/model"
import {
  applyWorldAction,
  completedReceipts,
  describeObject,
  moveWorld,
  nearestObject,
} from "@/aw2/world/rules"

function at(
  state: WorldProgress,
  id: string,
  zoneId = state.zoneId,
): WorldProgress {
  const object = zoneById(zoneId).objects.find((object) => object.id === id)!
  return { ...state, zoneId, x: object.x, y: object.y }
}
function act(
  state: WorldProgress,
  id: string,
  action: string,
  zoneId = state.zoneId,
) {
  return applyWorldAction(at(state, id, zoneId), id, action).state
}
function intro() {
  let state = newWorldProgress()
  state = act(state, "aw2-npc-giu-cho", "accept")
  state = act(state, "aw2-object-village-table", "inspect")
  return act(state, "aw2-npc-giu-cho", "turn-in")
}
function memories() {
  let state = act(intro(), "aw2-npc-va-den", "accept", ZONE_IDS[1])
  for (const id of ["aw2-npc-nguoi-ban", "aw2-npc-sua-ghe", "aw2-npc-dem-nuoc"])
    state = act(state, id, "remember")
  return act(state, "aw2-npc-va-den", "thread-return")
}
function openKitchen() {
  let state = act(memories(), "aw2-npc-gac-bep", "accept", ZONE_IDS[2])
  state = act(state, "aw2-object-hearth-hint", "inspect", ZONE_IDS[3])
  for (const step of [0, 1, 2])
    state = act(state, `aw2-object-steam-${step}`, "puzzle", ZONE_IDS[4])
  return state
}

describe("WORLD-01 continuous movement, collision and safe transfers", () => {
  it("normalizes diagonal speed, clamps long frames and rejects invalid input", () => {
    const first = newWorldProgress()
    const moved = moveWorld(first, 1, 1, 3)
    expect(Math.hypot(moved.x - first.x, moved.y - first.y)).toBeCloseTo(7)
    expect(moveWorld(first, NaN, 0, 1)).toBe(first)
    expect(moveWorld(first, 1, 0, -1)).toBe(first)
    expect(moveWorld(first, 0, 0, 1)).toBe(first)
  })
  it("blocks map borders and walls, while allowing sliding", () => {
    const edge = { ...newWorldProgress(), x: 16 }
    expect(moveWorld(edge, -1, 0, 0.05).x).toBe(16)
    const wall = { ...newWorldProgress(), x: 277, y: 320 }
    const moved = moveWorld(wall, 1, -1, 0.05)
    expect(moved.x).toBe(wall.x)
    expect(moved.y).toBeLessThan(wall.y)
    expect(canStand(ZONE_IDS[0], 320, 320)).toBe(false)
  })
  it("gives every zone a return route with an unblocked destination spawn", () => {
    expect(ZONES).toHaveLength(6)
    for (const zone of ZONES)
      for (const exit of zone.objects.filter(
        (object) => object.kind === "exit",
      )) {
        expect(canStand(exit.to!, exit.spawnX!, 192)).toBe(true)
        expect(
          zoneById(exit.to!).objects.some((back) => back.to === zone.id),
        ).toBe(true)
      }
  })
  it("permits return routes and blocks entering dungeon before accepting the correct quest", () => {
    let state = newWorldProgress()
    for (let index = 0; index < 2; index++)
      state = act(state, `${ZONE_IDS[index]}:exit:east`, "travel")
    expect(state.zoneId).toBe(ZONE_IDS[2])
    expect(() => act(state, `${ZONE_IDS[2]}:exit:east`, "travel")).toThrow()
    state = act(state, `${ZONE_IDS[2]}:exit:west`, "travel")
    expect(state.zoneId).toBe(ZONE_IDS[1])
  })
  it("requires interaction range and resolves the nearby target", () => {
    const state = newWorldProgress()
    expect(nearestObject(state)).toBeUndefined()
    expect(() => applyWorldAction(state, "aw2-npc-giu-cho", "accept")).toThrow(
      /đến gần/,
    )
    expect(nearestObject(at(state, "aw2-npc-giu-cho"))?.id).toBe(
      "aw2-npc-giu-cho",
    )
  })
})

describe("WORLD-02 approved quest progression and starter unlock", () => {
  it("does not progress on description/close and rejects early/repeated hand-ins", () => {
    const state = at(newWorldProgress(), "aw2-npc-giu-cho")
    const original = JSON.stringify(state)
    describeObject(state, zoneById(state.zoneId).objects[0])
    expect(JSON.stringify(state)).toBe(original)
    expect(() =>
      applyWorldAction(state, "aw2-npc-giu-cho", "turn-in"),
    ).toThrow()
    const completed = intro()
    expect(completed.partyIds).toEqual(STARTER_TEAM)
    expect(completedReceipts(completed)).toEqual(["aw2-grant-kept-seat"])
    expect(() => act(completed, "aw2-npc-giu-cho", "turn-in")).toThrow()
    expect(new Set(completed.partyIds).size).toBe(5)
  })
  it.each([
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ])("accepts all three-memory permutations %j", (...order) => {
    let state = act(intro(), "aw2-npc-va-den", "accept", ZONE_IDS[1])
    const ids = ["aw2-npc-nguoi-ban", "aw2-npc-sua-ghe", "aw2-npc-dem-nuoc"]
    for (const index of order) {
      state = act(state, ids[index], "remember")
      expect(() => act(state, ids[index], "remember")).toThrow()
    }
    expect(new Set(state.memories)).toEqual(new Set(MEMORY_IDS))
    state = act(state, "aw2-npc-va-den", "thread-wait")
    expect(state).toMatchObject({
      questIndex: 2,
      threadChoice: "wait",
      accepted: false,
    })
  })
  it("does not count memories before accepting the quest", () => {
    const state = at(intro(), "aw2-npc-nguoi-ban", ZONE_IDS[1])
    expect(() =>
      applyWorldAction(state, "aw2-npc-nguoi-ban", "remember"),
    ).toThrow()
  })
  it("retries wrong puzzle order, persists solved state and permits returning to report", () => {
    let state = act(memories(), "aw2-npc-gac-bep", "accept", ZONE_IDS[2])
    state = act(state, "aw2-object-hearth-hint", "inspect", ZONE_IDS[3])
    state = act(state, "aw2-object-steam-0", "puzzle", ZONE_IDS[4])
    state = act(state, "aw2-object-steam-2", "puzzle")
    expect(state.puzzleStep).toBe(0)
    state = openKitchen()
    expect(
      worldProgressSchema.parse(JSON.parse(JSON.stringify(state))).puzzleStep,
    ).toBe(3)
    expect(() => act(state, "aw2-object-steam-0", "puzzle")).toThrow()
    const reported = act(state, "aw2-npc-gac-bep", "turn-in", ZONE_IDS[2])
    expect(reported).toMatchObject({ questIndex: 3, accepted: false })
    expect(completedReceipts(reported)).toHaveLength(3)
  })
  it("never fabricates combat, chest rewards or mode transitions", () => {
    const state = act(openKitchen(), "aw2-npc-gac-bep", "turn-in", ZONE_IDS[2])
    for (const [id, zone] of [
      ["aw2-enemy-forgotten-host", ZONE_IDS[5]],
      ["aw2-chest-pantry", ZONE_IDS[3]],
      ["aw2-npc-ban-bai", ZONE_IDS[1]],
      ["aw2-npc-ban-co", ZONE_IDS[1]],
    ] as const) {
      const placed = at(state, id, zone)
      const object = zoneById(zone).objects.find((object) => object.id === id)!
      expect(describeObject(placed, object).actions).toEqual(
        object.kind === "mode" ? [{ id: "visit-mode", label: "Ghé bàn" }] : [],
      )
      if (object.kind === "mode")
        expect(() => applyWorldAction(placed, id, "visit-mode")).toThrow(
          /bộ chuyển mode/,
        )
      expect(() => applyWorldAction(placed, id, "win")).toThrow()
    }
  })
  it("rejects invalid quest/party, duplicated memories, wall positions and inaccessible zones", () => {
    for (const invalid of [
      { ...newWorldProgress(), questIndex: 2 },
      { ...newWorldProgress(), x: 320, y: 320 },
      { ...newWorldProgress(), zoneId: ZONE_IDS[3] },
      { ...intro(), partyIds: ["aw2-van"] },
      {
        ...memories(),
        memories: [MEMORY_IDS[0], MEMORY_IDS[0], MEMORY_IDS[1]],
      },
    ])
      expect(worldProgressSchema.safeParse(invalid).success).toBe(false)
  })
})

describe("SAVE-03 v1 migration and atomic world/starter writes", () => {
  function fixture() {
    const memory = new Map<string, string>([
      ["foodchest.tcg.v1", "stable original"],
    ])
    let fail = false
    const store = new Aw2DevSaveStore({
      storage: () => ({
        getItem: (key) => memory.get(key) ?? null,
        setItem: (key, value) => {
          if (fail) throw Error("Quota")
          memory.set(key, value)
        },
      }),
      lock: async (action) => action(),
      now: () => "2026-10-20T08:00:00.000Z",
      newId: () => "00000000-0000-4000-8000-000000000001",
    })
    return {
      store,
      memory,
      fail: () => {
        fail = true
      },
      recover: () => {
        fail = false
      },
    }
  }
  it("upgrades v1 in memory without writing, preserving identity and revision on explicit save", async () => {
    const f = fixture(),
      first = await f.store.save(null)
    const raw = JSON.stringify({
      ...Object.fromEntries(
        Object.entries(first.save).filter(
          ([key]) => !["economy", "collection"].includes(key),
        ),
      ),
      schemaVersion: 1,
      revision: 7,
      progress: {},
    })
    f.memory.set(AW2_DEV_SAVE_KEY, raw)
    const loaded = f.store.load()
    expect(loaded).toMatchObject({
      status: "ready",
      save: { schemaVersion: 5, revision: 7, progress: newWorldProgress() },
    })
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(raw)
    const saved = await f.store.save(raw)
    expect(saved.save).toMatchObject({
      saveId: first.save.saveId,
      createdAt: first.save.createdAt,
      schemaVersion: 5,
      revision: 8,
    })
    expect(f.memory.get("foodchest.tcg.v1")).toBe("stable original")
  })
  it("preserves original progression on failed starter unlock, and retries exactly once", async () => {
    const f = fixture(),
      initial = await f.store.save(null)
    const accepted = await f.store.act(
      initial.raw,
      at(initial.save.progress, "aw2-npc-giu-cho"),
      "aw2-npc-giu-cho",
      "accept",
    )
    const before = await f.store.act(
      accepted.raw,
      at(accepted.save.progress, "aw2-object-village-table"),
      "aw2-object-village-table",
      "inspect",
    )
    const approach = at(before.save.progress, "aw2-npc-giu-cho")
    f.fail()
    await expect(
      f.store.act(before.raw, approach, "aw2-npc-giu-cho", "turn-in"),
    ).rejects.toMatchObject({ code: "write-failed" })
    expect(f.store.load()).toMatchObject({
      save: { progress: { questIndex: 0, partyIds: [] } },
    })
    f.recover()
    const after = await f.store.act(
      before.raw,
      approach,
      "aw2-npc-giu-cho",
      "turn-in",
    )
    expect(after.save.progress.partyIds).toEqual(STARTER_TEAM)
    await expect(
      f.store.act(before.raw, approach, "aw2-npc-giu-cho", "turn-in"),
    ).rejects.toMatchObject({
      code: "conflict",
    })
    await expect(f.store.save(after.raw, newWorldProgress())).rejects.toThrow(
      /đặt lại quest/,
    )
  })
})
