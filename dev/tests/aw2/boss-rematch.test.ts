import { describe, expect, it, vi } from "vitest"
import { Aw2DevSaveStore } from "@/aw2/save/store"
import {
  AW2_DEV_SAVE_KEY,
  aw2DevSaveSchema,
  decodeAw2Save,
} from "@/aw2/save/schema"
import { newWorldProgress, type WorldProgress } from "@/aw2/world/model"
import {
  MEMORY_IDS,
  STARTER_TEAM,
  ZONE_IDS,
  KITCHEN_BOSS_ID,
  QUEST_GRANTS,
} from "@/aw2/world/ids"
import { RECRUIT_IDS, newCollection } from "@/aw2/collection/model"
import { newEconomy, CHEST_RECEIPT } from "@/aw2/economy/model"
import {
  createWorldBossEncounter,
  type WorldBossEncounter,
} from "@/aw2/world/encounter"
import { applyWorldAction, describeObject } from "@/aw2/world/rules"
import { zoneById, canStand } from "@/aw2/world/maps"
import { nhienBusy } from "@/aw2/combat"

function fixture(ending: "wait" | "share" = "wait", version = 6) {
  const save = aw2DevSaveSchema.parse({
    gameId: "adventure-world-2",
    environment: "development",
    schemaVersion: 6,
    saveId: "00000000-0000-4000-8000-000000000001",
    revision: 20,
    createdAt: "2026-10-20T08:00:00.000Z",
    updatedAt: "2026-10-23T08:00:00.000Z",
    progress: {
      ...newWorldProgress(),
      zoneId: ZONE_IDS[5],
      x: 320,
      y: 128,
      questIndex: 4,
      accepted: false,
      tableRead: true,
      memories: [...MEMORY_IDS],
      threadChoice: "wait",
      hintRead: true,
      puzzleStep: 3,
      partyIds: [...STARTER_TEAM],
      bossDefeated: true,
      tableNoteRead: true,
      endingChoice: ending,
    },
    economy: {
      ...newEconomy(),
      teamExperience: 345,
      receipts: [...QUEST_GRANTS, CHEST_RECEIPT],
      inventory: { rice: 6, herbs: 7, broth: 4, "warm-bowl": 1 },
      cooked: 3,
      shared: 2,
    },
    collection: newCollection(),
  })
  const legacy: Record<string, unknown> = { ...save, schemaVersion: version }
  if (version < 6) { const {interior, ...progress} = save.progress; legacy.progress = progress }
  if (version < 5) delete legacy.collection
  if (version < 4) delete legacy.economy
  const raw = JSON.stringify(legacy),
    memory = new Map([
      [AW2_DEV_SAVE_KEY, raw],
      ["foodchest.user.v1", "stable-original"],
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
  const store = new Aw2DevSaveStore({
    storage: () => ({
      getItem: (key: string) => memory.get(key) ?? null,
      setItem,
    }),
    lock,
    now: () => "2026-10-23T09:00:00.000Z",
  })
  const read = () => {
    const s = store.load()
    if (s.status !== "ready") throw Error("not ready")
    return s
  }
  return { raw, save, memory, setItem, store, read }
}
function approach(p: WorldProgress): WorldProgress {
  return { ...p, zoneId: ZONE_IDS[5], x: 320, y: 128 }
}
function substantive(p: WorldProgress) {
  const { zoneId, x, y, facing, ...other } = p
  return other
}
function play(run: WorldBossEncounter, ults: boolean) {
  for (let i = 0; i < 400 && run.snapshot().battle.status === "active"; i++) {
    const b = run.snapshot().battle
    if (ults && b.tick >= 5)
      for (const a of b.actors.filter(
        (a) =>
          a.side === "player" &&
          a.hp > 0 &&
          a.energy === 100 &&
          !a.cast &&
          !a.lienUltimate &&
          !a.mocBurst &&
          !a.bachStrike &&
          !nhienBusy(a, b.tick),
      )) {
        const boss = b.actors.find((a) => a.side === "enemy" && a.hp > 0)
        if (!boss) break
        if (
          (["aw2-nhien", "aw2-moc"].includes(a.spiritId) ||
            (a.spiritId === "aw2-van" && a.vanEmphasis === "attack")) &&
          Math.abs(a.position - boss.position) > a.range
        )
          continue
        run.ultimate(a.id)
      }
    run.advance()
  }
  expect(run.snapshot().battle.status).not.toBe("active")
  return run.snapshot().battle.status
}

describe("BATTLE-REMATCH-01 reward-free completed-story boss", () => {
  it.each(["wait", "share"] as const)(
    "preserves every nonspatial field for repeated real outcomes after %s ending",
    async (ending) => {
      const f = fixture(ending),
        original = f.read().save,
        observed = []
      for (const outcome of ["win", "loss", "retreat", "win"] as const) {
        if (outcome === "loss") {
          for (const spiritId of RECRUIT_IDS) {
            const s = f.read()
            await f.store.collectionAction(s.raw, s.save.progress, {
              type: "recruit",
              spiritId,
            })
          }
          const s = f.read()
          await f.store.collectionAction(s.raw, s.save.progress, {
            type: "team",
            partyIds: [
              "aw2-hai",
              "aw2-nhien",
              "aw2-moc",
              "aw2-lien",
              "aw2-van",
            ],
            vanEmphasis: "protection",
          })
        } else if (
          outcome === "win" &&
          JSON.stringify(f.read().save.progress.partyIds) !==
            JSON.stringify(STARTER_TEAM)
        ) {
          const s = f.read()
          await f.store.collectionAction(s.raw, s.save.progress, {
            type: "team",
            partyIds: [...STARTER_TEAM],
            vanEmphasis: "protection",
          })
        }
        const current = f.read(),
          { snapshot, encounter } = await f.store.beginBoss(
            current.raw,
            approach(current.save.progress),
            "rematch",
          )
        expect(encounter.snapshot().purpose).toBe("rematch")
        if (outcome === "retreat") encounter.retreat()
        else observed.push(play(encounter, outcome === "win"))
        const result = await f.store.finishBoss(snapshot.raw, encounter)
        expect(substantive(result.save.progress)).toEqual(
          substantive(current.save.progress),
        )
        expect(result.save.economy).toEqual(original.economy)
        expect(result.save.collection).toEqual(current.save.collection)
        expect(result.save.progress).toMatchObject({
          zoneId: ZONE_IDS[5],
          x: 96,
          y: 192,
          facing: "right",
        })
        expect(canStand(result.save.progress.zoneId, 96, 192)).toBe(true)
        expect(result.save.revision).toBe(current.save.revision + 2)
        expect(f.read()).toEqual(result)
        await expect(
          f.store.finishBoss(snapshot.raw, encounter),
        ).rejects.toThrow()
        expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(result.raw)
      }
      expect(observed).toEqual(["player-win", "enemy-win", "player-win"])
      expect(f.memory.get("foodchest.user.v1")).toBe("stable-original")
    },
  )

  it("validates native purpose/quest stage/proximity before any write and denies ordinary rematch actions", async () => {
    const f = fixture(),
      boss = zoneById(ZONE_IDS[5]).objects.find(
        (o) => o.id === KITCHEN_BOSS_ID,
      )!
    expect(
      describeObject(f.save.progress, boss).actions.map((a) => a.id),
    ).toEqual(["rematch"])
    expect(() => applyWorldAction(f.save.progress, boss.id, "rematch")).toThrow(
      /bộ điều khiển/,
    )
    for (const purpose of ["quest", "invalid", null, {}])
      await expect(
        f.store.beginBoss(f.raw, f.save.progress, purpose as never),
      ).rejects.toThrow()
    for (const p of [
      { ...f.save.progress, x: 96, y: 192 },
      { ...f.save.progress, zoneId: ZONE_IDS[2] },
    ])
      await expect(f.store.beginBoss(f.raw, p, "rematch")).rejects.toThrow()
    expect(f.setItem).not.toHaveBeenCalled()
    const uncompleted = {
      ...f.save,
      progress: {
        ...f.save.progress,
        questIndex: 3,
        accepted: true,
        bossDefeated: false,
        tableNoteRead: false,
        endingChoice: null,
      },
    }
    uncompleted.economy.receipts = uncompleted.economy.receipts.filter(
      (id) => id !== QUEST_GRANTS[3],
    )
    const raw = JSON.stringify(uncompleted)
    f.memory.set(AW2_DEV_SAVE_KEY, raw)
    await expect(
      f.store.beginBoss(raw, uncompleted.progress, "rematch"),
    ).rejects.toThrow()
    expect(() => createWorldBossEncounter(raw, "rematch")).toThrow()
    expect(() => createWorldBossEncounter(f.raw, "quest")).toThrow()
    expect(() => createWorldBossEncounter(f.raw, "invalid" as never)).toThrow()
    expect(f.setItem).not.toHaveBeenCalled()
  })

  it("entry/settlement failures preserve exact bytes and authentic retry; reload discards only attempt", async () => {
    const f = fixture()
    f.setItem.mockImplementationOnce(() => {
      throw Error("quota")
    })
    await expect(
      f.store.beginBoss(f.raw, f.save.progress, "rematch"),
    ).rejects.toMatchObject({ code: "write-failed" })
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(f.raw)
    const { snapshot, encounter } = await f.store.beginBoss(
      f.raw,
      f.save.progress,
      "rematch",
    )
    const writes = f.setItem.mock.calls.length
    expect(f.read()).toEqual(snapshot)
    expect(decodeAw2Save(snapshot.raw)).toEqual(snapshot)
    expect(f.setItem).toHaveBeenCalledTimes(writes)
    const detached = encounter.snapshot()
    detached.purpose = "quest"
    detached.battle.status = "player-win"
    expect(encounter.snapshot().purpose).toBe("rematch")
    await expect(f.store.finishBoss(snapshot.raw, encounter)).rejects.toThrow(
      /chưa kết thúc/,
    )
    await expect(
      f.store.finishBoss(snapshot.raw, {
        snapshot: () => detached,
      } as WorldBossEncounter),
    ).rejects.toThrow(/không thuộc/)
    encounter.retreat()
    f.setItem.mockImplementationOnce(() => {
      throw Error("quota")
    })
    await expect(
      f.store.finishBoss(snapshot.raw, encounter),
    ).rejects.toMatchObject({ code: "write-failed" })
    expect(encounter.snapshot().committed).toBe(false)
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(snapshot.raw)
    const result = await f.store.finishBoss(snapshot.raw, encounter)
    expect(result.save.economy).toEqual(f.save.economy)
    expect(encounter.snapshot().committed).toBe(true)
  })

  it("freezes selected owned party/Van choice and refuses stale result against another tab", async () => {
    const f = fixture()
    let s = f.read()
    for (const spiritId of RECRUIT_IDS)
      s = await f.store.collectionAction(s.raw, s.save.progress, {
        type: "recruit",
        spiritId,
      })
    const partyIds = [
      "aw2-hai",
      "aw2-nhien",
      "aw2-moc",
      "aw2-lien",
      "aw2-van",
    ] as WorldProgress["partyIds"]
    s = await f.store.collectionAction(s.raw, s.save.progress, {
      type: "team",
      partyIds,
      vanEmphasis: "attack",
    })
    const { snapshot, encounter } = await f.store.beginBoss(
      s.raw,
      approach(s.save.progress),
      "rematch",
    )
    const initial = encounter.snapshot().battle
    expect(
      initial.actors.filter((a) => a.side === "player").map((a) => a.spiritId),
    ).toEqual(partyIds)
    expect(
      initial.actors.find((a) => a.spiritId === "aw2-van")?.vanEmphasis,
    ).toBe("attack")
    const newer = await f.store.collectionAction(
      snapshot.raw,
      snapshot.save.progress,
      { type: "team", partyIds: [...STARTER_TEAM], vanEmphasis: "protection" },
    )
    expect(encounter.snapshot().battle).toEqual(initial)
    encounter.retreat()
    await expect(
      f.store.finishBoss(snapshot.raw, encounter),
    ).rejects.toMatchObject({ code: "conflict" })
    await expect(f.store.finishBoss(newer.raw, encounter)).rejects.toThrow(
      /không thuộc/,
    )
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(newer.raw)
    expect(encounter.snapshot().committed).toBe(false)
  })

  it("serializes competing rematch entries and duplicate settlements", async () => {
    const f = fixture()
    const entries = await Promise.allSettled([
      f.store.beginBoss(f.raw, f.save.progress, "rematch"),
      f.store.beginBoss(f.raw, f.save.progress, "rematch"),
    ])
    const passed = entries.filter((e) => e.status === "fulfilled")
    expect(passed).toHaveLength(1)
    expect(entries.filter((e) => e.status === "rejected")).toHaveLength(1)
    if (passed[0].status !== "fulfilled") throw Error("entry")
    const { snapshot, encounter } = passed[0].value
    encounter.retreat()
    const settled = await Promise.allSettled([
      f.store.finishBoss(snapshot.raw, encounter),
      f.store.finishBoss(snapshot.raw, encounter),
    ])
    expect(settled.filter((r) => r.status === "fulfilled")).toHaveLength(1)
    expect(f.read().save.economy).toEqual(f.save.economy)
  })

  it.each([3, 4, 5])(
    "reads completed v%i without writes, then rematches without backfilling rewards",
    async (version) => {
      const f = fixture("share", version),
        read = f.read()
      expect(read.raw).toBe(f.raw)
      expect(f.setItem).not.toHaveBeenCalled()
      const { snapshot, encounter } = await f.store.beginBoss(
        read.raw,
        read.save.progress,
        "rematch",
      )
      encounter.retreat()
      const next = await f.store.finishBoss(snapshot.raw, encounter)
      expect(next.save.schemaVersion).toBe(6)
      expect(next.save.saveId).toBe(read.save.saveId)
      expect(next.save.createdAt).toBe(read.save.createdAt)
      expect(next.save.economy).toEqual(read.save.economy)
      expect(next.save.collection).toEqual(read.save.collection)
      expect(substantive(next.save.progress)).toEqual(
        substantive(read.save.progress),
      )
    },
  )
})
