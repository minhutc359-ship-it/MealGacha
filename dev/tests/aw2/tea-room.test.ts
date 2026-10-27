import { describe, expect, it, vi } from "vitest"
import { readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { newWorldProgress, worldProgressSchema } from "@/aw2/world/model"
import {
  TEA_ROOM,
  TEA_ROOM_ID,
  TEA_DOOR_ID,
  TEA_EXIT_ID,
  TEA_PARTY_ID,
  TEA_JOURNAL_ID,
} from "@/aw2/world/interiorLayout"
import { sceneId, scenePosition, sceneObjects } from "@/aw2/world/scene"
import {
  applyWorldAction,
  describeObject,
  moveWorld,
  nearestObject,
} from "@/aw2/world/rules"
import { findWorldPath } from "@/aw2/world/navigation"
import { journeyDirections } from "@/aw2/world/journey"
import { Aw2DevSaveStore } from "@/aw2/save/store"
import { decodeAw2Save, AW2_DEV_SAVE_KEY } from "@/aw2/save/schema"
import { Aw2ModeAdapter } from "@/aw2/modes/session"
import { worldAssetUrls } from "@/aw2/assets/worldAssets"
import { TEA_ROOM_SCENE } from "@/aw2/assets/teaRoom"
import { ROSTER_ASSETS } from "@/aw2/assets/roster"
import { mapReadyFor } from "../../aw2/worldCanvasTypes"

const outside = () => ({
  ...newWorldProgress(),
  x: 300,
  y: 80,
  facing: "up" as const,
})
const entered = () =>
  applyWorldAction(outside(), TEA_DOOR_ID, "enter-room").state
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
async function fixture() {
  const memory = new Map([["foodchest.user.v1", "untouched"]])
  const setItem = vi.fn((k: string, value: string) => {
    expect(k).toBe(AW2_DEV_SAVE_KEY)
    memory.set(k, value)
  })
  const store = new Aw2DevSaveStore({
    storage: () => ({ getItem: (k) => memory.get(k) ?? null, setItem }),
    lock: async (action) => action(),
    now: () => "2026-10-27T10:00:00.000Z",
    newId: () => "00000000-0000-4000-8000-000000000001",
  })
  const saved = await store.save(null)
  return { memory, setItem, store, saved }
}

describe("016F room rules preserve the outside checkpoint", () => {
  it("enters and exits only by explicit nearby room actions", () => {
    const source = outside(),
      before = JSON.stringify(source),
      room = entered()
    expect(JSON.stringify(source)).toBe(before)
    expect(room.interior).toEqual(TEA_ROOM.spawn)
    expect({ ...room, interior: null }).toEqual(source)
    expect(applyWorldAction(room, TEA_EXIT_ID, "leave-room").state).toEqual(
      source,
    )
    expect(() =>
      applyWorldAction(newWorldProgress(), TEA_DOOR_ID, "enter-room"),
    ).toThrow()
    expect(() =>
      applyWorldAction(
        { ...room, interior: { ...TEA_ROOM.spawn, x: 400 } },
        TEA_EXIT_ID,
        "leave-room",
      ),
    ).toThrow()
    expect(() => applyWorldAction(room, TEA_DOOR_ID, "enter-room")).toThrow()
  })
  it("moves the active actor, collides with desks and keeps outside state exactly", () => {
    const room = entered(),
      moved = moveWorld(room, 1, 1, 0.05)
    expect(moved.interior!.x).toBeGreaterThan(room.interior!.x)
    expect({ ...moved, interior: null }).toEqual(outside())
    const blocked = { ...room, interior: { ...TEA_ROOM.spawn, x: 196, y: 96 } }
    expect(moveWorld(blocked, 1, 0, 0.05).interior!.x).toBe(196)
    const border = { ...room, interior: { ...TEA_ROOM.spawn, x: 16 } }
    expect(moveWorld(border, -1, 0, 0.05).interior!.x).toBe(16)
  })
  it("uses room-local objects, paths and exit directions instead of outside targets", () => {
    const room = entered()
    expect(sceneId(room)).toBe(TEA_ROOM_ID)
    expect(scenePosition(room)).toEqual(room.interior)
    expect(sceneObjects(room)).toEqual(TEA_ROOM.objects)
    expect(nearestObject(room)?.id).toBe(TEA_EXIT_ID)
    const path = findWorldPath(TEA_ROOM_ID, { x: 64, y: 192 }, {
      x: 240,
      y: 160,
    })
    expect(path.length).toBeGreaterThan(0)
    expect(journeyDirections(room)[0].targetName).toMatch(/hiên/)
    for (const object of TEA_ROOM.objects.filter(
      (o) => o.kind === "room-service",
    )) {
      const description = describeObject(room, object)
      expect(description.actions.every((a) => a.id.startsWith("view-"))).toBe(
        true,
      )
      expect(() =>
        applyWorldAction(
          {
            ...room,
            interior: { ...TEA_ROOM.spawn, x: object.x, y: object.y + 32 },
          },
          object.id,
          description.actions[0].id,
        ),
      ).toThrow()
    }
    expect(() => applyWorldAction(room, "aw2-npc-giu-cho", "accept")).toThrow()
  })
  it.each([
    { roomId: "aw2-room-unknown", x: 64, y: 192, facing: "right" },
    { ...TEA_ROOM.spawn, x: NaN },
    { ...TEA_ROOM.spawn, x: 0 },
    { ...TEA_ROOM.spawn, x: 240, y: 96 },
    { ...TEA_ROOM.spawn, facing: "north" },
    { ...TEA_ROOM.spawn, extra: true },
  ])("rejects invalid room data %#", (interior) => {
    expect(
      worldProgressSchema.safeParse({ ...outside(), interior }).success,
    ).toBe(false)
  })
  it("rejects outside checkpoints from another region or far from entrance", () => {
    expect(worldProgressSchema.safeParse({ ...entered(), x: 96 }).success).toBe(
      false,
    )
    expect(
      worldProgressSchema.safeParse({
        ...entered(),
        zoneId: "aw2-zone-lantern-street",
      }).success,
    ).toBe(false)
  })
})

describe("016F atomic persistence and migration", () => {
  it("requires a live renderer guard for both directions and writes exactly once per action", async () => {
    const f = await fixture(),
      ready = vi.fn()
    await expect(
      f.store.act(f.saved.raw, outside(), TEA_DOOR_ID, "enter-room"),
    ).rejects.toThrow(/chuẩn bị/)
    expect(f.setItem).toHaveBeenCalledTimes(1)
    const room = await f.store.act(
      f.saved.raw,
      outside(),
      TEA_DOOR_ID,
      "enter-room",
      ready,
    )
    expect(ready).toHaveBeenCalledTimes(1)
    expect(room.save.progress).toEqual(entered())
    const walking = moveWorld(room.save.progress, 1, 0, 0.05)
    const saved = await f.store.save(room.raw, walking)
    expect(f.store.load()).toEqual(saved)
    const back = await f.store.act(
      saved.raw,
      { ...walking, interior: TEA_ROOM.spawn },
      TEA_EXIT_ID,
      "leave-room",
      ready,
    )
    expect(back.save.progress).toEqual(outside())
    expect(back.save.economy).toEqual(f.saved.save.economy)
    expect(back.save.collection).toEqual(f.saved.save.collection)
    expect(f.setItem).toHaveBeenCalledTimes(4)
    expect(f.memory.get("foodchest.user.v1")).toBe("untouched")
  })
  it("refuses generic room entry/exit/outside mutations, including economy and collection writers", async () => {
    const f = await fixture()
    await expect(f.store.save(f.saved.raw, entered())).rejects.toThrow()
    const room = await f.store.act(
      f.saved.raw,
      outside(),
      TEA_DOOR_ID,
      "enter-room",
      () => {},
    )
    for (const candidate of [
      outside(),
      { ...entered(), x: 301 },
      { ...entered(), facing: "left" as const },
    ]) {
      await expect(f.store.save(room.raw, candidate)).rejects.toThrow()
      await expect(
        f.store.economyAction(room.raw, candidate, {
          type: "open-chest",
        } as never),
      ).rejects.toThrow()
      await expect(
        f.store.collectionAction(room.raw, candidate, {
          type: "invalid",
        } as never),
      ).rejects.toThrow()
    }
    expect(f.store.load()).toEqual(room)
    expect(f.setItem).toHaveBeenCalledTimes(2)
  })
  it("keeps the exact source on failed readiness, quota and stale-tab conflict", async () => {
    const f = await fixture()
    await expect(
      f.store.act(f.saved.raw, outside(), TEA_DOOR_ID, "enter-room", () => {
        throw Error("disposed")
      }),
    ).rejects.toThrow("disposed")
    expect(f.store.load()).toEqual(f.saved)
    f.setItem.mockImplementationOnce(() => {
      throw Error("quota")
    })
    await expect(
      f.store.act(f.saved.raw, outside(), TEA_DOOR_ID, "enter-room", () => {}),
    ).rejects.toMatchObject({ code: "write-failed" })
    expect(f.store.load()).toEqual(f.saved)
    const changed = await f.store.save(f.saved.raw)
    const ready = vi.fn()
    await expect(
      f.store.act(f.saved.raw, outside(), TEA_DOOR_ID, "enter-room", ready),
    ).rejects.toMatchObject({ code: "conflict" })
    expect(ready).not.toHaveBeenCalled()
    expect(f.store.load()).toEqual(changed)
  })
  it.each([1, 2, 3, 4, 5])(
    "reads historical v%i without writes and upgrades once on explicit action",
    async (version) => {
      const f = await fixture(),
        value: any = clone(f.saved.save)
      delete value.progress.interior
      value.schemaVersion = version
      if (version < 5) delete value.collection
      if (version < 4) delete value.economy
      if (version === 2)
        for (const key of ["bossDefeated", "tableNoteRead", "endingChoice"])
          delete value.progress[key]
      if (version === 1) value.progress = {}
      const raw = JSON.stringify(value, null, 2)
      f.memory.set(AW2_DEV_SAVE_KEY, raw)
      const loaded = f.store.load()
      expect(loaded.status).toBe("ready")
      expect(f.setItem).toHaveBeenCalledTimes(1)
      if (loaded.status !== "ready") throw Error("not ready")
      expect(loaded.raw).toBe(raw)
      expect(loaded.save.progress.interior).toBeNull()
      expect(loaded.save.saveId).toBe(value.saveId)
      expect(loaded.save.revision).toBe(value.revision)
      expect(loaded.save.createdAt).toBe(value.createdAt)
      expect(loaded.save.updatedAt).toBe(value.updatedAt)
      const upgraded = await f.store.save(raw)
      expect(upgraded.save.schemaVersion).toBe(6)
      expect(upgraded.save.revision).toBe(value.revision + 1)
      expect(f.setItem).toHaveBeenCalledTimes(2)
    },
  )
  it("preserves authentic 016E earned v5 inventory/quest/party and exact raw on read", async () => {
    const historical = JSON.parse(
      readFileSync("docs/aw2/evidence/AW2-016E-source-browser.json", "utf8"),
    ).finalRaw
    const decoded = decodeAw2Save(historical)
    expect(decoded.status).toBe("ready")
    if (decoded.status !== "ready") throw Error("invalid fixture")
    const original = JSON.parse(historical)
    expect(original.schemaVersion).toBe(5)
    expect(decoded.raw).toBe(historical)
    expect({
      ...decoded.save,
      schemaVersion: 5,
      progress: { ...decoded.save.progress, interior: undefined },
    }).toEqual(original)
  })
  it("preserves unsupported and corrupt room bytes without reset", async () => {
    const f = await fixture()
    for (const bad of [
      { ...f.saved.save, schemaVersion: 7 },
      {
        ...f.saved.save,
        progress: {
          ...entered(),
          interior: { ...TEA_ROOM.spawn, roomId: "unknown" },
        },
      },
    ]) {
      const raw = JSON.stringify(bad)
      f.memory.set(AW2_DEV_SAVE_KEY, raw)
      expect(f.store.load().status).toBe(
        bad.schemaVersion === 7 ? "unsupported" : "invalid",
      )
      await expect(f.store.save(raw)).rejects.toThrow()
      expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(raw)
    }
    expect(f.setItem).toHaveBeenCalledTimes(1)
  })
  it.each(["tcg", "auto-chess"] as const)(
    "quick %s returns to exact room checkpoint without another write",
    async (mode) => {
      const f = await fixture(),
        room = await f.store.act(
          f.saved.raw,
          outside(),
          TEA_DOOR_ID,
          "enter-room",
          () => {},
        ),
        adapter = new Aw2ModeAdapter(f.store)
      const enteredMode = await adapter.enter(
        room.raw,
        room.save.progress,
        mode,
        "quick-entry",
      )
      expect(enteredMode.visit.returnRoomId).toBe(TEA_ROOM_ID)
      const count = f.setItem.mock.calls.length
      expect(adapter.returnToWorld()).toEqual(enteredMode.checkpoint)
      expect(f.setItem).toHaveBeenCalledTimes(count)
    },
  )
})

describe("016F scene readiness and original asset contract", () => {
  it("does not accept outside readiness for the room or another leader", () => {
    const room = entered(),
      ready = {
        ready: true,
        zoneId: room.zoneId,
        sceneId: room.zoneId,
        leaderId: "aw2-than",
      }
    expect(mapReadyFor(ready, room)).toBe(false)
    expect(mapReadyFor({ ...ready, sceneId: TEA_ROOM_ID }, room)).toBe(true)
    expect(
      mapReadyFor(
        { ...ready, sceneId: TEA_ROOM_ID, leaderId: "aw2-van" },
        room,
      ),
    ).toBe(false)
    expect(
      mapReadyFor({ ...ready, ready: false, sceneId: TEA_ROOM_ID }, room),
    ).toBe(false)
  })
  it("prepares only the two room atlases and one leader, within measured budgets", () => {
    const room = entered(),
      scene = TEA_ROOM_SCENE
    expect(worldAssetUrls(room)).toEqual([
      ROSTER_ASSETS["aw2-than"].assets.world.url,
      scene.assets.floor.url,
      scene.assets.props.url,
    ])
    expect(scene.budget.newCompressedBytes).toBeLessThanOrEqual(4000000)
    expect(
      scene.budget.newDecodedRgbaBytes +
        Math.max(
          ...Object.values(ROSTER_ASSETS).map(
            (r) => r.assets.world.width * r.assets.world.height * 4,
          ),
        ),
    ).toBeLessThanOrEqual(24000000)
    for (const asset of Object.values(scene.assets)) {
      const bytes = readFileSync(asset.url.slice(1))
      expect(bytes.length).toBe(asset.bytes)
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        asset.sha256,
      )
      expect(
        createHash("sha256")
          .update(readFileSync(asset.source.path))
          .digest("hex"),
      ).toBe(asset.source.sha256)
    }
    expect(
      createHash("sha256")
        .update(readFileSync(scene.provenance.prompts.path))
        .digest("hex"),
    ).toBe(scene.provenance.prompts.sha256)
    expect(scene.fullEnvironmentComplete).toBe(false)
    expect(scene.provenance.licenseStatus).toBe("REVIEW_REQUIRED")
  })
})
