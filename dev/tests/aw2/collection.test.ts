import { Aw2ModeAdapter } from "@/aw2/modes/session"
import { describe, expect, it, vi } from "vitest"
import {
  AW2_DEV_SAVE_KEY,
  decodeAw2Save,
  aw2DevSaveSchema,
  aw2DevSaveV4Schema,
} from "@/aw2/save/schema"
import { Aw2DevSaveStore } from "@/aw2/save/store"
import { newWorldProgress, type WorldProgress } from "@/aw2/world/model"
import {
  MEMORY_IDS,
  STARTER_TEAM,
  ZONE_IDS,
  KITCHEN_BOSS_ID,
} from "@/aw2/world/ids"
import { newEconomy } from "@/aw2/economy/model"
import {
  RECRUIT_IDS,
  RECRUIT_QUESTS,
  newCollection,
  ownedSpirits,
  type CollectionAction,
} from "@/aw2/collection/model"
import {
  developmentCombatStats,
  developmentProgression,
  nhienBusy,
} from "@/aw2/combat"
function progress(q = 3): WorldProgress {
  return {
    ...newWorldProgress(),
    questIndex: q,
    accepted: q === 3,
    tableRead: q > 0,
    partyIds: q > 0 ? [...STARTER_TEAM] : [],
    ...(q >= 2
      ? { memories: [...MEMORY_IDS], threadChoice: "wait" as const }
      : {}),
    ...(q >= 3
      ? { zoneId: ZONE_IDS[5], x: 320, y: 128, hintRead: true, puzzleStep: 3 }
      : {}),
    ...(q === 4
      ? {
          accepted: false,
          bossDefeated: true,
          tableNoteRead: true,
          endingChoice: "wait" as const,
        }
      : {}),
  }
}
function oldSave(q = 3) {
  return {
    gameId: "adventure-world-2",
    environment: "development",
    schemaVersion: 4,
    saveId: "00000000-0000-4000-8000-000000000001",
    revision: 8,
    createdAt: "2026-10-20T08:00:00.000Z",
    updatedAt: "2026-10-20T08:00:00.000Z",
    progress: progress(q),
    economy: { ...newEconomy(), teamExperience: 205 },
  }
}
function fixture(q = 3) {
  const original = JSON.stringify(oldSave(q)),
    memory = new Map([
      [AW2_DEV_SAVE_KEY, original],
      ["foodchest.user.v1", "stable-user"],
      ["foodchest.tcg.v1", "stable-tcg"],
    ])
  let fail = false,
    queue = Promise.resolve()
  const setItem = vi.fn((key: string, value: string) => {
    expect(key).toBe(AW2_DEV_SAVE_KEY)
    if (fail) throw Error("quota")
    memory.set(key, value)
  })
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
    now: () => "2026-10-23T08:00:00.000Z",
  }
  const store = new Aw2DevSaveStore(options)
  const ready = () => {
    const s = store.load()
    if (s.status !== "ready") throw Error("fixture not ready")
    return s
  }
  const action = (a: CollectionAction) => {
    const s = ready()
    return store.collectionAction(s.raw, s.save.progress, a)
  }
  return {
    original,
    memory,
    store,
    setItem,
    options,
    ready,
    action,
    setFail: (value: boolean) => {
      fail = value
    },
  }
}
async function recruitAll(f: ReturnType<typeof fixture>) {
  for (const spiritId of RECRUIT_IDS)
    await f.action({ type: "recruit", spiritId })
}

describe("AW2-007L collection/save/real-party authority", () => {
  it.each([1, 2, 3, 4])(
    "migrates v%i in memory without writes, nonstarter grants or identity changes",
    (version) => {
      const f = fixture(),
        old = oldSave()
      let value: Record<string, unknown> = { ...old, schemaVersion: version }
      if (version < 4) delete value.economy
      if (version === 1) value.progress = {}
      if (version === 2) {
        const { bossDefeated, tableNoteRead, endingChoice, ...p } = old.progress
        value.progress = p
      }
      const raw = JSON.stringify(value)
      f.memory.set(AW2_DEV_SAVE_KEY, raw)
      const s = f.ready()
      expect(s.raw).toBe(raw)
      expect(s.save).toMatchObject({
        schemaVersion: 5,
        saveId: old.saveId,
        revision: 8,
        createdAt: old.createdAt,
        updatedAt: old.updatedAt,
        collection: newCollection(),
      })
      expect(ownedSpirits(s.save.progress, s.save.collection)).toEqual(
        version === 1 ? [] : STARTER_TEAM,
      )
      expect(f.setItem).not.toHaveBeenCalled()
      expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(raw)
    },
  )
  it("explicitly persists the upgrade without clearing economy/receipts", async () => {
    const f = fixture()
    const next = await f.store.save(f.original)
    expect(next.save.schemaVersion).toBe(5)
    expect(next.save.economy).toEqual(oldSave().economy)
    expect(next.save.revision).toBe(9)
    expect(next.save.progress).toEqual(oldSave().progress)
  })
  it.each(RECRUIT_IDS)(
    "rejects early %s recruitment without any write",
    async (spiritId) => {
      const f = fixture(RECRUIT_QUESTS[spiritId] - 1)
      await expect(f.action({ type: "recruit", spiritId })).rejects.toThrow(
        "mốc nhiệm vụ",
      )
      expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(f.original)
      expect(f.setItem).not.toHaveBeenCalled()
    },
  )
  it.each(RECRUIT_IDS)(
    "explicitly recruits %s once at its exact gate without XP/items/team change",
    async (spiritId) => {
      const f = fixture(RECRUIT_QUESTS[spiritId]),
        before = f.ready()
      const s = await f.action({ type: "recruit", spiritId })
      expect(s.save.collection.recruitedIds).toEqual([spiritId])
      expect(s.save.economy).toEqual(before.save.economy)
      expect(s.save.progress).toEqual(before.save.progress)
      expect(s.save.revision).toBe(9)
      await expect(f.action({ type: "recruit", spiritId })).rejects.toThrow(
        "đã được mời",
      )
      expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(s.raw)
    },
  )
  it("ordinary save and load do not auto-recruit any eligible character", async () => {
    const f = fixture(4)
    expect(f.ready().save.collection.recruitedIds).toEqual([])
    const s = await f.store.save(f.original)
    expect(s.save.collection.recruitedIds).toEqual([])
  })
  it("persists all12 owned IDs with bounded unique recruits and untouched stable bytes", async () => {
    const f = fixture()
    await recruitAll(f)
    const s = f.ready()
    expect(ownedSpirits(s.save.progress, s.save.collection)).toHaveLength(12)
    expect(s.save.collection.recruitedIds).toEqual(RECRUIT_IDS)
    expect(f.memory.get("foodchest.user.v1")).toBe("stable-user")
    expect(f.memory.get("foodchest.tcg.v1")).toBe("stable-tcg")
  })
  it.each(
    [
      [],
      [...STARTER_TEAM.slice(0, 4)],
      [...STARTER_TEAM, "aw2-muoi"],
      ["aw2-than", ...STARTER_TEAM.slice(0, 4)],
      ["aw2-unknown", ...STARTER_TEAM.slice(1)],
      ["aw2-van", ...STARTER_TEAM.slice(1)],
    ].map((partyIds) => ({ partyIds })),
  )(
    "rejects invalid/unowned team $partyIds atomically",
    async ({ partyIds }) => {
      const f = fixture()
      await expect(
        f.action({
          type: "team",
          partyIds,
          vanEmphasis: "protection",
        } as unknown as CollectionAction),
      ).rejects.toThrow()
      expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(f.original)
    },
  )
  it("swaps and persists exactly five owned IDs/order and Van emphasis across reload", async () => {
    const f = fixture()
    await recruitAll(f)
    const ids = [
      "aw2-van",
      "aw2-moc",
      "aw2-bach",
      "aw2-lien",
      "aw2-nhien",
    ] as const
    const s = await f.action({
      type: "team",
      partyIds: [...ids],
      vanEmphasis: "attack",
    })
    expect(new Aw2DevSaveStore(f.options).load()).toEqual(s)
    expect(s.save.progress.partyIds).toEqual(ids)
    expect(s.save.collection.vanEmphasis).toBe("attack")
    expect(s.save.economy).toEqual(oldSave().economy)
    await expect(
      f.action({ type: "team", partyIds: [...ids], vanEmphasis: "attack" }),
    ).rejects.toThrow("đã được lưu")
  })
  it("cannot change party through position-save or forged collection fields", async () => {
    const f = fixture()
    await recruitAll(f)
    const before = f.ready()
    await expect(
      f.store.save(before.raw, {
        ...before.save.progress,
        partyIds: [...STARTER_TEAM].reverse(),
      }),
    ).rejects.toThrow()
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(before.raw)
    await expect(
      f.action({
        type: "team",
        partyIds: [...STARTER_TEAM].reverse(),
        vanEmphasis: "both",
      } as never),
    ).rejects.toThrow()
  })
  it("forbids empty world team before intro and locked Van attack choice", async () => {
    const f = fixture(0)
    await expect(
      f.action({
        type: "team",
        partyIds: [...STARTER_TEAM],
        vanEmphasis: "protection",
      }),
    ).rejects.toThrow()
    const g = fixture()
    await expect(
      g.action({
        type: "team",
        partyIds: [...STARTER_TEAM].reverse(),
        vanEmphasis: "attack",
      }),
    ).rejects.toThrow()
    expect(g.memory.get(AW2_DEV_SAVE_KEY)).toBe(g.original)
  })
  it.each([
    "duplicates",
    "unknown",
    "starter",
    "early",
    "mode",
    "extra",
    "unowned-party",
  ])("preserves a malformed v5 %s save byte-for-byte", (kind) => {
    const f = fixture()
    const s = structuredClone(f.ready().save)
    if (kind === "duplicates")
      s.collection.recruitedIds = ["aw2-van", "aw2-van"]
    if (kind === "unknown") s.collection.recruitedIds = ["unknown"] as never
    if (kind === "starter") s.collection.recruitedIds = ["aw2-than"] as never
    if (kind === "early") {
      s.progress = progress(1)
      s.collection.recruitedIds = ["aw2-van"]
    }
    if (kind === "mode") s.collection.vanEmphasis = "attack"
    if (kind === "extra") Object.assign(s.collection, { coins: 99 })
    if (kind === "unowned-party") s.progress.partyIds[0] = "aw2-van"
    const raw = JSON.stringify(s)
    f.memory.set(AW2_DEV_SAVE_KEY, raw)
    expect(f.store.load()).toEqual({ status: "invalid", raw })
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(raw)
    expect(f.setItem).not.toHaveBeenCalled()
  })
  it("keeps v4 strict starter validation and treats future6 as unsupported", () => {
    const f = fixture()
    const forged = oldSave()
    forged.progress.partyIds[0] = "aw2-van"
    expect(aw2DevSaveV4Schema.safeParse(forged).success).toBe(false)
    const raw = JSON.stringify(forged)
    expect(decodeAw2Save(raw)).toEqual({ status: "invalid", raw })
    const future = '{"schemaVersion":6,"retain":"untouched"}'
    expect(decodeAw2Save(future)).toEqual({
      status: "unsupported",
      raw: future,
    })
    expect(aw2DevSaveSchema.safeParse(f.ready().save).success).toBe(true)
  })
  it("failed recruitment write grants nothing and retries once against the same raw", async () => {
    const f = fixture()
    f.setFail(true)
    await expect(
      f.action({ type: "recruit", spiritId: "aw2-van" }),
    ).rejects.toMatchObject({ code: "write-failed" })
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(f.original)
    expect(f.ready().save.collection.recruitedIds).toEqual([])
    f.setFail(false)
    expect(
      (await f.action({ type: "recruit", spiritId: "aw2-van" })).save.collection
        .recruitedIds,
    ).toEqual(["aw2-van"])
  })
  it("failed team write preserves saved party/choice and permits safe retry", async () => {
    const f = fixture()
    await recruitAll(f)
    const before = f.ready(),
      action = {
        type: "team" as const,
        partyIds: [...before.save.progress.partyIds].reverse(),
        vanEmphasis: "attack" as const,
      }
    f.setFail(true)
    await expect(f.action(action)).rejects.toMatchObject({
      code: "write-failed",
    })
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(before.raw)
    f.setFail(false)
    expect((await f.action(action)).save.progress.partyIds).toEqual(
      action.partyIds,
    )
  })
  it("serializes concurrent recruit writes, rejects stale raw, and preserves both after reread", async () => {
    const f = fixture(),
      s = f.ready(),
      other = new Aw2DevSaveStore(f.options)
    const result = await Promise.allSettled([
      f.store.collectionAction(s.raw, s.save.progress, {
        type: "recruit",
        spiritId: "aw2-moc",
      }),
      other.collectionAction(s.raw, s.save.progress, {
        type: "recruit",
        spiritId: "aw2-van",
      }),
    ])
    expect(result.map((r) => r.status)).toEqual(["fulfilled", "rejected"])
    expect((result[1] as PromiseRejectedResult).reason.code).toBe("conflict")
    const done = await f.action({ type: "recruit", spiritId: "aw2-van" })
    expect(done.save.collection.recruitedIds).toEqual(["aw2-moc", "aw2-van"])
  })
  it.each(["protection", "attack"] as const)(
    "authentic world boss snapshots all selected IDs/levels and Van %s",
    async (vanEmphasis) => {
      const f = fixture()
      await recruitAll(f)
      const ids = [
        "aw2-van",
        "aw2-moc",
        "aw2-bach",
        "aw2-lien",
        "aw2-nhien",
      ] as const
      await f.action({ type: "team", partyIds: [...ids], vanEmphasis })
      const s = f.ready(),
        started = await f.store.beginBoss(s.raw, s.save.progress),
        b = started.encounter.snapshot().battle
      expect(
        b.actors.filter((a) => a.side === "player").map((a) => a.spiritId),
      ).toEqual(ids)
      expect(b.actors[0].vanEmphasis).toBe(vanEmphasis)
      expect(b.actors[0].maxHp).toBe(
        developmentCombatStats("aw2-van", developmentProgression(205).level)
          .maxHp,
      )
      if (vanEmphasis === "attack") {
        for (let i = 0; i < 30; i++) {
          const live = started.encounter.snapshot().battle,
            van = live.actors[0],
            boss = live.actors.find((a) => a.id === KITCHEN_BOSS_ID)!
          if (!van.cast && Math.abs(van.position - boss.position) <= van.range)
            break
          started.encounter.advance()
        }
      }
      started.encounter.ultimate("player-aw2-van")
      expect(started.encounter.snapshot().battle.actors[0].energy).toBe(0)
      started.encounter.retreat()
      const done = await f.store.finishBoss(
        started.snapshot.raw,
        started.encounter,
      )
      expect(done.save.progress.partyIds).toEqual(ids)
      expect(done.save.collection).toEqual(s.save.collection)
      expect(done.save.progress.bossDefeated).toBe(false)
    },
  )
  it("later team/choice changes cannot mutate a live snapshot or settle its stale checkpoint", async () => {
    const f = fixture()
    await recruitAll(f)
    const ids: WorldProgress["partyIds"] = ["aw2-van", ...STARTER_TEAM.slice(1)]
    await f.action({ type: "team", partyIds: ids, vanEmphasis: "attack" })
    const s = f.ready(),
      started = await f.store.beginBoss(s.raw, s.save.progress)
    const before = started.encounter.snapshot()
    const changed = await f.store.collectionAction(
      started.snapshot.raw,
      started.snapshot.save.progress,
      { type: "team", partyIds: [...STARTER_TEAM], vanEmphasis: "protection" },
    )
    expect(started.encounter.snapshot()).toEqual(before)
    started.encounter.retreat()
    await expect(
      f.store.finishBoss(started.snapshot.raw, started.encounter),
    ).rejects.toMatchObject({ code: "conflict" })
    expect(f.memory.get(AW2_DEV_SAVE_KEY)).toBe(changed.raw)
  })
  it("mixed nonstarter party obeys targeting/busy authority and reaches a terminal", async () => {
    const f = fixture()
    await recruitAll(f)
    await f.action({
      type: "team",
      partyIds: ["aw2-muoi", "aw2-nhien", "aw2-moc", "aw2-hai", "aw2-lien"],
      vanEmphasis: "protection",
    })
    const s = f.ready(),
      { encounter, snapshot } = await f.store.beginBoss(s.raw, s.save.progress)
    const committed = new Set<string>()
    for (
      let t = 0;
      t < 300 && encounter.snapshot().battle.status === "active";
      t++
    ) {
      const b = encounter.snapshot().battle
      for (const a of b.actors.filter(
        (a) =>
          a.side === "player" &&
          a.hp > 0 &&
          a.energy >= 100 &&
          !a.cast &&
          !a.lienUltimate &&
          !a.mocBurst &&
          !a.bachStrike &&
          !nhienBusy(a, b.tick),
      )) {
        const boss = b.actors.find((a) => a.id === KITCHEN_BOSS_ID)!
        if (
          ["aw2-moc", "aw2-nhien"].includes(a.spiritId) &&
          Math.abs(a.position - boss.position) > a.range
        )
          continue
        encounter.ultimate(a.id)
      }
      encounter.advance()
      for (const event of encounter.snapshot().battle.events)
        if (event.kind === "cast-commit" && event.skillId)
          committed.add(event.skillId)
    }
    const view = encounter.snapshot()
    expect(view.battle.status).not.toBe("active")
    expect(committed.has("aw2-moc:skill:ultimate")).toBe(true)
    const done = await f.store.finishBoss(snapshot.raw, encounter)
    expect(done.save.collection.recruitedIds).toHaveLength(7)
    expect(done.save.economy).toEqual(s.save.economy)
  })
  it.each(["tcg", "auto-chess"] as const)(
    "%s checkpoint/return preserves a fully recruited custom party without extra grants",
    async (mode) => {
      const f = fixture()
      await recruitAll(f)
      const partyIds = [
        "aw2-van",
        "aw2-hai",
        "aw2-lien",
        "aw2-moc",
        "aw2-bach",
      ] as WorldProgress["partyIds"]
      await f.action({ type: "team", partyIds, vanEmphasis: "attack" })
      const before = f.ready(),
        adapter = new Aw2ModeAdapter(f.store),
        { checkpoint } = await adapter.enter(
          before.raw,
          before.save.progress,
          mode,
          "quick-entry",
        )
      expect(checkpoint.save.collection).toEqual(before.save.collection)
      expect(checkpoint.save.progress.partyIds).toEqual(partyIds)
      expect(checkpoint.save.economy).toEqual(before.save.economy)
      const writes = f.setItem.mock.calls.length
      expect(adapter.returnToWorld()).toEqual(checkpoint)
      expect(f.setItem.mock.calls.length).toBe(writes)
    },
  )
})
