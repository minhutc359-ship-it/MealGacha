import { describe, expect, it, vi } from "vitest"
import { Aw2DevSaveStore } from "@/aw2/save/store"
import {
  AW2_DEV_SAVE_KEY,
  AW2_RESET_CONFIRMATION,
  decodeAw2Save,
} from "@/aw2/save/schema"
import {
  KITCHEN_BOSS_ID,
  MEMORY_IDS,
  STARTER_TEAM,
  TABLE_NOTE_ID,
  ZONE_IDS,
} from "@/aw2/world/ids"
import {
  newWorldProgress,
  worldProgressSchema,
  type WorldProgress,
} from "@/aw2/world/model"
import {
  applyWorldAction,
  completedReceipts,
  describeObject,
} from "@/aw2/world/rules"
import { zoneById, canStand } from "@/aw2/world/maps"
import type { WorldBossEncounter } from "@/aw2/world/encounter"

function readyProgress(): WorldProgress {
  return {
    ...newWorldProgress(),
    zoneId: ZONE_IDS[5],
    x: 320,
    y: 128,
    questIndex: 3,
    accepted: true,
    tableRead: true,
    memories: [...MEMORY_IDS],
    threadChoice: "wait",
    hintRead: true,
    puzzleStep: 3,
    partyIds: [...STARTER_TEAM],
  }
}
function fixture() {
  const raw = JSON.stringify({
    gameId: "adventure-world-2",
    environment: "development",
    schemaVersion: 3,
    saveId: "00000000-0000-4000-8000-000000000001",
    revision: 8,
    createdAt: "2026-10-20T08:00:00.000Z",
    updatedAt: "2026-10-20T08:00:00.000Z",
    progress: readyProgress(),
  })
  const memory = new Map([
    [AW2_DEV_SAVE_KEY, raw],
    ["foodchest.tcg.v1", "stable original"],
  ])
  const setItem = vi.fn((key: string, value: string) => {
    expect(key).toBe(AW2_DEV_SAVE_KEY)
    memory.set(key, value)
  })
  let queue = Promise.resolve()
  const lock = <T>(action: () => T): Promise<T> => {
    const next = queue.then(action)
    queue = next.then(
      () => undefined,
      () => undefined,
    )
    return next
  }
  const options = {
    storage: () => ({
      getItem: (key: string) => {
        expect(key).toBe(AW2_DEV_SAVE_KEY)
        return memory.get(key) ?? null
      },
      setItem,
    }),
    lock,
    now: () => "2026-10-20T09:00:00.000Z",
    newId: () => "00000000-0000-4000-8000-000000000002",
  }
  return { raw, memory, setItem, options, store: new Aw2DevSaveStore(options) }
}
function play(encounter: WorldBossEncounter, ultimates = true) {
  for (let tick = 0; tick < 400; tick++) {
    const view = encounter.snapshot()
    if (view.battle.status !== "active") return view.battle.status
    if (ultimates && view.battle.tick >= 5)
      for (const actor of view.battle.actors.filter(
        (actor) =>
          actor.side === "player" &&
          actor.hp > 0 &&
          actor.energy === 100 &&
          !actor.cast,
      ))
        encounter.ultimate(actor.id)
    encounter.advance()
  }
  throw Error("Development boss failed to reach a terminal result")
}
function interact(
  progress: WorldProgress,
  id: string,
  action: string,
  zoneId = progress.zoneId,
) {
  const object = zoneById(zoneId).objects.find((object) => object.id === id)!
  return applyWorldAction(
    { ...progress, zoneId, x: object.x, y: object.y },
    id,
    action,
  ).state
}

describe("BATTLE-02 trusted world encounter and SAVE-02 boss subset", () => {
  it("checkpoints before entry and only permits the accepted canonical boss in range", async () => {
    const f = fixture()
    for (const invalid of [
      { ...readyProgress(), accepted: false },
      { ...readyProgress(), x: 96 },
      { ...readyProgress(), zoneId: ZONE_IDS[2] },
    ]) {
      await expect(f.store.beginBoss(f.raw, invalid)).rejects.toThrow()
      expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(f.raw)
    }
    const { snapshot, encounter } = await f.store.beginBoss(
      f.raw,
      readyProgress(),
    )
    expect(snapshot.save).toMatchObject({
      revision: 9,
      progress: { x: 96, y: 192, bossDefeated: false },
    })
    expect(
      encounter
        .snapshot()
        .battle.actors.filter((actor) => actor.side === "player")
        .map((actor) => actor.spiritId),
    ).toEqual(STARTER_TEAM)
    expect(
      encounter
        .snapshot()
        .battle.actors.find((actor) => actor.id === KITCHEN_BOSS_ID)?.boss,
    ).toBe(true)
    expect(new Aw2DevSaveStore(f.options).load()).toEqual(snapshot)
    expect(f.memory.get("foodchest.tcg.v1")).toBe("stable original")
  })

  it("rejects forged results, modified snapshots, early settlement and ordinary-save victory", async () => {
    const f = fixture(),
      { snapshot, encounter } = await f.store.beginBoss(f.raw, readyProgress())
    const detached = encounter.snapshot()
    detached.battle.status = "player-win"
    detached.battle.actors.forEach((actor) => {
      actor.hp = 0
    })
    expect(encounter.snapshot().battle.status).toBe("active")
    await expect(
      f.store.finishBoss(snapshot.raw, {
        snapshot: () => detached,
      } as WorldBossEncounter),
    ).rejects.toThrow(/không thuộc/)
    await expect(f.store.finishBoss(snapshot.raw, encounter)).rejects.toThrow(
      /chưa kết thúc/,
    )
    await expect(
      f.store.save(snapshot.raw, {
        ...snapshot.save.progress,
        bossDefeated: true,
      }),
    ).rejects.toThrow(/xác thực/)
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(snapshot.raw)
  })

  it("uses real combat victory and commits it once; failed writes remain retryable", async () => {
    const f = fixture(),
      { snapshot, encounter } = await f.store.beginBoss(f.raw, readyProgress())
    expect(play(encounter)).toBe("player-win")
    f.setItem.mockImplementationOnce(() => {
      throw Error("disk full")
    })
    await expect(
      f.store.finishBoss(snapshot.raw, encounter),
    ).rejects.toMatchObject({ code: "write-failed" })
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(snapshot.raw)
    expect(encounter.snapshot().committed).toBe(false)
    const result = await f.store.finishBoss(snapshot.raw, encounter)
    expect(result.save.progress).toMatchObject({
      zoneId: ZONE_IDS[5],
      x: 96,
      y: 192,
      bossDefeated: true,
      tableNoteRead: false,
      questIndex: 3,
    })
    expect(completedReceipts(result.save.progress)).toHaveLength(3)
    await expect(f.store.finishBoss(result.raw, encounter)).rejects.toThrow()
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(result.raw)
    expect(f.store.load()).toEqual(result)
  })

  it("returns real defeat and retreat to the yard without erasing objectives or granting victory", async () => {
    for (const retreat of [false, true]) {
      const f = fixture(),
        { snapshot, encounter } = await f.store.beginBoss(
          f.raw,
          readyProgress(),
        )
      if (retreat) encounter.retreat()
      else expect(play(encounter, false)).toBe("enemy-win")
      const result = await f.store.finishBoss(snapshot.raw, encounter)
      expect(result.save.progress).toMatchObject({
        zoneId: ZONE_IDS[2],
        questIndex: 3,
        accepted: true,
        puzzleStep: 3,
        bossDefeated: false,
        partyIds: STARTER_TEAM,
      })
      expect(
        canStand(
          result.save.progress.zoneId,
          result.save.progress.x,
          result.save.progress.y,
        ),
      ).toBe(true)
    }
  })

  it("starts no encounter when checkpoint writing fails and serializes competing tabs", async () => {
    const f = fixture()
    f.setItem.mockImplementationOnce(() => {
      throw Error("disk full")
    })
    await expect(
      f.store.beginBoss(f.raw, readyProgress()),
    ).rejects.toMatchObject({ code: "write-failed" })
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(f.raw)
    const other = new Aw2DevSaveStore(f.options)
    const results = await Promise.allSettled([
      f.store.beginBoss(f.raw, readyProgress()),
      other.beginBoss(f.raw, readyProgress()),
    ])
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1)
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1)
  })

  it("binds settlement to its exact checkpoint and refuses another tab's save or reset identity", async () => {
    for (const reset of [false, true]) {
      const f = fixture(),
        { snapshot, encounter } = await f.store.beginBoss(
          f.raw,
          readyProgress(),
        )
      expect(play(encounter)).toBe("player-win")
      const other = new Aw2DevSaveStore(f.options)
      const changed = reset
        ? await other.confirmReset(
            other.beginReset(snapshot.raw),
            AW2_RESET_CONFIRMATION,
          )
        : await other.save(snapshot.raw)
      await expect(
        f.store.finishBoss(snapshot.raw, encounter),
      ).rejects.toMatchObject({ code: "conflict" })
      await expect(f.store.finishBoss(changed.raw, encounter)).rejects.toThrow(
        /không thuộc/,
      )
      expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(changed.raw)
      expect(changed.save.progress.bossDefeated).toBe(false)
    }
  })

  it.each(["seat-wait", "seat-share"])(
    "persists note, explicit ending %s and once-only completion, then opens safe shortcuts",
    async (choice) => {
      const f = fixture(),
        { snapshot, encounter } = await f.store.beginBoss(
          f.raw,
          readyProgress(),
        )
      expect(play(encounter)).toBe("player-win")
      const won = await f.store.finishBoss(snapshot.raw, encounter)
      expect(() =>
        interact(won.save.progress, "aw2-npc-giu-cho", choice, ZONE_IDS[0]),
      ).toThrow()
      const note = await f.store.save(
        won.raw,
        interact(won.save.progress, TABLE_NOTE_ID, "read-note"),
      )
      const complete = await f.store.save(
        note.raw,
        interact(note.save.progress, "aw2-npc-giu-cho", choice, ZONE_IDS[0]),
      )
      expect(complete.save.progress).toMatchObject({
        questIndex: 4,
        accepted: false,
        endingChoice: choice === "seat-wait" ? "wait" : "share",
      })
      expect(completedReceipts(complete.save.progress)).toEqual([
        "aw2-grant-kept-seat",
        "aw2-grant-three-memories",
        "aw2-grant-open-hearth",
        "aw2-grant-one-more-bowl",
      ])
      expect(() =>
        interact(complete.save.progress, "aw2-npc-giu-cho", choice),
      ).toThrow()
      const shortcut = interact(
        complete.save.progress,
        "aw2-shortcut-yard-table",
        "travel",
        ZONE_IDS[2],
      )
      expect(shortcut.zoneId).toBe(ZONE_IDS[5])
      expect(
        interact(shortcut, "aw2-shortcut-table-yard", "travel").zoneId,
      ).toBe(ZONE_IDS[2])
      expect(f.store.load()).toEqual(complete)
      await expect(
        f.store.save(complete.raw, {
          ...complete.save.progress,
          bossDefeated: false,
        }),
      ).rejects.toThrow()
      await expect(
        f.store.save(complete.raw, {
          ...complete.save.progress,
          endingChoice: choice === "seat-wait" ? "share" : "wait",
        }),
      ).rejects.toThrow()
    },
  )

  it("migrates schema v2 read-only while preserving all old progress and identity", async () => {
    const f = fixture(),
      value = JSON.parse(f.raw)
    const { bossDefeated, tableNoteRead, endingChoice, ...legacyProgress } =
      value.progress
    const raw = JSON.stringify({
      ...value,
      schemaVersion: 2,
      progress: legacyProgress,
    })
    f.memory.set(AW2_DEV_SAVE_KEY, raw)
    const loaded = f.store.load()
    expect(loaded).toMatchObject({
      status: "ready",
      raw,
      save: {
        schemaVersion: 3,
        saveId: value.saveId,
        revision: 8,
        progress: readyProgress(),
      },
    })
    expect(f.setItem).not.toHaveBeenCalled()
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(raw)
    const upgraded = await f.store.save(raw)
    expect(upgraded.save).toMatchObject({
      schemaVersion: 3,
      createdAt: value.createdAt,
      saveId: value.saveId,
      revision: 9,
    })
  })

  it("serializes two terminal commits and two ending choices without duplicate progress", async () => {
    const f = fixture()
    const { snapshot, encounter } = await f.store.beginBoss(
      f.raw,
      readyProgress(),
    )
    expect(play(encounter)).toBe("player-win")
    const other = new Aw2DevSaveStore(f.options)
    const claims = await Promise.allSettled([
      f.store.finishBoss(snapshot.raw, encounter),
      other.finishBoss(snapshot.raw, encounter),
    ])
    const winner = claims.find((result) => result.status === "fulfilled")
    expect(
      claims.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1)
    if (!winner || winner.status !== "fulfilled")
      throw Error("Expected one committed victory")
    const note = await f.store.save(
      winner.value.raw,
      interact(winner.value.save.progress, TABLE_NOTE_ID, "read-note"),
    )
    const endings = await Promise.allSettled([
      f.store.save(
        note.raw,
        interact(
          note.save.progress,
          "aw2-npc-giu-cho",
          "seat-wait",
          ZONE_IDS[0],
        ),
      ),
      other.save(
        note.raw,
        interact(
          note.save.progress,
          "aw2-npc-giu-cho",
          "seat-share",
          ZONE_IDS[0],
        ),
      ),
    ])
    expect(
      endings.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1)
    const loaded = f.store.load()
    if (loaded.status !== "ready") throw Error("Expected committed ending")
    expect(loaded.save.revision).toBe(snapshot.save.revision + 3)
    expect(loaded.save.progress.questIndex).toBe(4)
    expect(new Set(completedReceipts(loaded.save.progress)).size).toBe(4)
  })

  it("rejects inconsistent endings and preserves unknown/future schemas", () => {
    for (const progress of [
      { ...readyProgress(), tableNoteRead: true },
      { ...readyProgress(), endingChoice: "share" },
      { ...readyProgress(), questIndex: 4 },
      { ...readyProgress(), bossDefeated: true, accepted: false },
    ])
      expect(worldProgressSchema.safeParse(progress).success).toBe(false)
    const raw = JSON.stringify({ schemaVersion: 4, future: "retain" })
    expect(decodeAw2Save(raw)).toEqual({ status: "unsupported", raw })
    const boss = zoneById(ZONE_IDS[5]).objects.find(
      (object) => object.id === KITCHEN_BOSS_ID,
    )!
    expect(
      describeObject({ ...readyProgress(), accepted: false }, boss).actions,
    ).toEqual([])
  })
})
