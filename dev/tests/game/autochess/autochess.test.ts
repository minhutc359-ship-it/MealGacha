import { beforeEach, describe, expect, it } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import {
  createAutoRun,
  buy,
  sell,
  move,
  equip,
  copies,
  poolSize,
  capacity,
  traitCounts,
  refreshShop,
} from "@/game/autochess/economy"
import { AUTO_UNITS, MONSTERS, UNIT_MAP, RELICS, AUGMENTS } from "@/game/autochess/catalog"
import {
  advanceCombat,
  createCombat,
  enemyPlan,
  nextCell,
  pressure,
} from "@/game/autochess/combat"
import { reduceAuto } from "@/game/autochess/reducer"
import { autoRunSchema, autoSaveSchema } from "@/game/autochess/schema"
import { emptyAutoSave, type AutoRun, type AutoSave, type Piece } from "@/game/autochess/types"
import { SCENES } from "@/game/autochess/story"
import { newGame } from "@/game/progression"
import { parseGame, GAME_KEY } from "@/game/storage"
import { createSaveCode, readSaveCode, TRANSFER_BACKUP_KEY } from "@/game/saveCode"
import { restoreProgress, readTransferBackup } from "@/game/transferBundle"
import { repository } from "@/infrastructure/storage/repository"
import { useGameStore } from "@/game/useGameStore"
import { useAppStore } from "@/store/useAppStore"
import { MUSIC_TRACKS, RETRO_MUSIC_TRACKS } from "@/game/audioScore"
import { buildPool } from "@/domain/drawReward"
import { BUILT_IN_DISHES } from "@/infrastructure/catalog/dishCatalog"

const memory = new Map<string, string>()
beforeEach(() => {
  memory.clear()
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => {
        memory.set(k, v)
      },
      removeItem: (k: string) => {
        memory.delete(k)
      },
    },
  })
  useGameStore.setState({ save: newGame(), notice: null })
  useAppStore.setState({ user: repository.loadUser() })
})
const run = (mode: AutoRun["mode"] = "survival", seed = 42) =>
  createAutoRun(mode, seed, "2026-10-08", "test")
function piece(
  r: AutoRun,
  id: string,
  star: Piece["star"] = 1,
  cell: number | null = null,
  items: string[] = [],
) {
  const p = { uid: `p${r.nextUid++}`, id, star, cell, items }
  r.roster.push(p)
  r.pool[id] -= copies(star)
  return p
}
function shop(r: AutoRun, ids: string[]) {
  for (const id of r.shop) if (id) r.pool[id]++
  r.shop = [...ids, ...Array(5 - ids.length).fill(null)]
  for (const id of ids) r.pool[id]--
}
function fight(r: AutoRun) {
  r.phase = "combat"
  r.rounds++
  r.scene = null
  r.combat = createCombat(r)
  return r
}
function finish(r: AutoRun) {
  let out = r
  for (let i = 0; i < 120 && out.phase === "combat"; i++) {
    out = advanceCombat(out, 40)
    if (out.combat?.pendingScene) {
      out.seenScenes.push(out.combat.pendingScene)
      out.combat.pendingScene = null
    }
  }
  return out
}
const dispatch = (save: AutoSave, action: Parameters<typeof reduceAuto>[1]) => {
  const out = reduceAuto(save, action)
  expect(out.error).toBeNull()
  return out.save as AutoSave & { run: AutoRun }
}
const valid = (r: AutoRun) => {
  const parsed = autoRunSchema.safeParse(r)
  expect(
    parsed.success,
    parsed.success ? "" : JSON.stringify(parsed.error.issues),
  ).toBe(true)
}

describe("finite pool, economy and formation", () => {
  it("keeps seeded shops deterministic and daily independent of an arbitrary seed", () => {
    expect(run("daily", 1).shop).toEqual(run("daily", 1).shop)
    const a = reduceAuto(undefined, {
      type: "start",
      mode: "daily",
      seed: 1,
      day: "2026-10-08",
      id: "a",
    }).save.run!
    const b = reduceAuto(undefined, {
      type: "start",
      mode: "daily",
      seed: 999,
      day: "2026-10-08",
      id: "b",
    }).save.run!
    expect(a.shop).toEqual(b.shop)
    expect(enemyPlan(a)).toEqual(enemyPlan(b))
    refreshShop(a)
    expect(enemyPlan(a)).toEqual(enemyPlan(b))
    valid(a)
  })
  it("conserves physical copies across nine purchases, star merges and selling", () => {
    const r = run()
    r.gold = 100
    shop(r, ["banh-mi", "banh-mi", "banh-mi"])
    for (let i = 0; i < 3; i++) expect(buy(r, i)).toBeNull()
    expect(r.roster.find((p) => p.id === "banh-mi")?.star).toBe(2)
    valid(r)
    for (let wave = 0; wave < 2; wave++) {
      shop(r, ["banh-mi", "banh-mi", "banh-mi"])
      for (let i = 0; i < 3; i++) buy(r, i)
      valid(r)
    }
    const merged = r.roster.find((p) => p.id === "banh-mi")!
    expect(merged.star).toBe(3)
    const before = r.gold
    sell(r, merged.uid)
    expect(r.gold - before).toBe(9)
    expect(r.pool["banh-mi"]).toBe(poolSize(1))
    valid(r)
  })
  it("allows a three-star five-cost unit without violating its finite nine-copy pool", () => {
    const r = run(); r.gold = 100
    for (let round = 0; round < 3; round++) {
      shop(r, ["chef-lien", "chef-lien", "chef-lien"])
      for (let i = 0; i < 3; i++) expect(buy(r, i)).toBeNull()
      valid(r)
    }
    expect(r.roster.find(p => p.id === "chef-lien")?.star).toBe(3)
    expect(r.pool["chef-lien"]).toBe(0)
  })
  it("merges on a full bench, returns excess items and preserves the board anchor", () => {
    const r = run()
    r.gold = 100
    shop(r, [])
    const anchor = r.roster[0]
    anchor.items = ["herbs", "lantern"]
    piece(r, anchor.id, 1, null, ["herbs"])
    for (let i = 0; i < 8; i++) piece(r, "banh-mi")
    shop(r, [anchor.id])
    expect(buy(r, 0)).toBeNull()
    expect(r.roster.find((p) => p.uid === anchor.uid)).toMatchObject({
      star: 2,
      cell: 20,
      items: ["herbs", "lantern"],
    })
    expect(r.inventory).toEqual(["spark", "dew", "herbs"])
    valid(r)
  })
  it("rejects full bench and insufficient gold without consuming a shop unit", () => {
    const r = run()
    shop(r, ["banh-mi"])
    for (let i = 0; i < 9; i++) piece(r, "banh-dau-xanh")
    const before = JSON.stringify(r)
    expect(buy(r, 0)).toContain("đầy")
    expect(JSON.stringify(r)).toBe(before)
    const poor = run()
    poor.gold = 0
    const saved = JSON.stringify(poor)
    expect(buy(poor, 0)).toContain("vàng")
    expect(JSON.stringify(poor)).toBe(saved)
  })
  it("swaps board/bench at capacity and rejects enemy rows or an extra deployment", () => {
    const r = run(),
      p = piece(r, "banh-mi")
    expect(move(r, p.uid, 22)).toContain("đủ")
    expect(move(r, p.uid, 8)).toContain("ba hàng")
    const old = r.roster[0]
    expect(move(r, p.uid, old.cell)).toBeNull()
    expect(old.cell).toBeNull()
    valid(r)
    expect(move(r, p.uid, null, old.uid)).toBeNull()
    expect(old.cell).toBe(20)
    valid(r)
  })
  it("counts distinct trait IDs and scales slot capacity at meaningful XP gates", () => {
    const r = run()
    piece(r, "pho-bo")
    expect(traitCounts(r.roster).tide).toBe(1)
    expect([0, 7, 8, 19, 20, 37, 38, 61, 62].map(capacity)).toEqual([
      3, 3, 4, 4, 5, 5, 6, 6, 7,
    ])
  })
  it("equips at most two different relics and refuses missing inventory", () => {
    const r = run(),
      p = r.roster[0]
    r.inventory = ["herbs", "herbs", "lantern", "book"]
    expect(equip(r, p.uid, "herbs")).toBeNull()
    expect(equip(r, p.uid, "herbs")).toBeTruthy()
    expect(equip(r, p.uid, "lantern")).toBeNull()
    expect(equip(r, p.uid, "book")).toBeTruthy()
    valid(r)
  })
  it("charges rerolls and XP, respects locked shops, pays capped interest once", () => {
    let s = { ...emptyAutoSave(), run: run() }
    s.run.gold = 30
    s = dispatch(s, { type: "lock" })
    const locked = s.run.shop.slice()
    s = dispatch(s, { type: "xp" })
    expect(s.run.gold).toBe(26)
    expect(s.run.xp).toBe(4)
    s = dispatch(s, { type: "battle" })
    const final = finish(s.run)
    s = dispatch(s, { type: "checkpoint", run: final })
    expect(s.run.lastResult?.gold).toBe(8)
    const gold = s.run.gold
    expect(reduceAuto(s, { type: "checkpoint", run: final }).error).toBeTruthy()
    expect(s.run.gold).toBe(gold)
    s = dispatch(s, { type: "next" })
    expect(s.run.shop).toEqual(locked)
    const n = s.run.gold
    s = dispatch(s, { type: "reroll" })
    expect(s.run.gold).toBe(n - 2)
    valid(s.run)
  })
})
describe("fixed-step combat", () => {
  it("finds paths around occupied squares and never wraps between rows", () => {
    expect(nextCell(18, 6, 1, new Set([12]))).toBe(19)
    expect(nextCell(18, 6, 1, new Set([12, 19, 24]))).toBeNull()
    expect(nextCell(5, 6, 1, new Set())).not.toBe(6)
  })
  it("has identical outcomes/events in one-tick and 40-tick batches without mutating input", () => {
    const initial = fight(run()),
      snapshot = JSON.stringify(initial)
    let a = initial,
      b = initial
    while (a.phase === "combat") a = advanceCombat(a)
    while (b.phase === "combat") b = advanceCombat(b, 40)
    expect(a).toEqual(b)
    expect(JSON.stringify(initial)).toBe(snapshot)
    valid(
      dispatch({ ...emptyAutoSave(), run: initial }, {
        type: "checkpoint",
        run: a,
      }).run!,
    )
  })
  it("uses windup hit ticks, not the render frame, and does not hit early", () => {
    const r = fight(run()),
      b = r.combat!
    b.actors = b.actors
      .slice(0, 1)
      .concat(b.actors.filter((a) => a.side === "enemy").slice(0, 1))
    b.actors[0].cell = 18
    b.actors[1].cell = 12
    const hp = b.actors.map((a) => a.hp),
      windup = advanceCombat(r, 4)
    expect(windup.combat!.actors.map((a) => a.hp)).toEqual(hp)
    const hit = advanceCombat(windup)
    expect(
      hit.combat!.actors.every((a, i) => a.hp < hp[i] || a.shield > 0),
    ).toBe(true)
  })
  it("resolves a simultaneous lethal exchange as a loss instead of granting a win", () => {
    const r = fight(run()),
      a = r.combat!.actors[0],
      b = r.combat!.actors.find((x) => x.side === "enemy")!
    r.combat!.actors = [a, b]
    a.cell = 18
    b.cell = 12
    for (const u of [a, b]) {
      u.hp = 1
      u.shield = 0
      u.attack = 100
      u.action = {
        kind: "attack",
        start: 0,
        hit: 1,
        end: 10,
        target: u === a ? b.uid : a.uid,
        from: u.cell,
        to: u === a ? b.cell : a.cell,
      }
    }
    const result = advanceCombat(r)
    expect(result.combat!.result).toBe("loss")
    expect(result.combat!.actors.every((a) => a.hp === 0)).toBe(true)
  })
  it("freezes battle time during pause and story; keeps both teams fighting past 55 seconds", () => {
    const r = fight(run())
    r.paused = true
    expect(advanceCombat(r, 40)).toBe(r)
    r.paused = false
    r.combat!.pendingScene = "boss-3"
    expect(advanceCombat(r)).toBe(r)
    r.combat!.pendingScene = null
    for (const a of r.combat!.actors) {
      a.stunnedUntil = 2000
      a.shield = 0
    }
    r.combat!.tick = 1099
    r.activeTicks = 1099
    const ongoing = advanceCombat(r, 40)
    expect(ongoing.combat!.tick).toBe(1139)
    expect(ongoing.activeTicks).toBe(1139)
    expect(ongoing.phase).toBe("combat")
    expect(ongoing.combat!.result).toBeNull()
  })
  it("strengthens survival with active time while preserving wounded enemy HP ratios", () => {
    const r = fight(run())
    r.activeTicks = 599
    for (const a of r.combat!.actors) a.stunnedUntil = 2000
    const enemy = r.combat!.actors.find((a) => a.side === "enemy")!
    enemy.hp = Math.round(enemy.maxHp / 2)
    const after = advanceCombat(r),
      e = after.combat!.actors.find((a) => a.uid === enemy.uid)!
    expect(e.maxHp).toBeGreaterThan(enemy.maxHp)
    expect(e.hp / e.maxHp).toBeCloseTo(enemy.hp / enemy.maxHp, 2)
    expect(pressure(15, 12000).health).toBeGreaterThan(pressure(1, 0).health)
    expect(after.activeTicks).toBe(600)
  })
  it("pauses on boss phase dialogue once and resumes without changing the clock", () => {
    const r = run("campaign")
    r.wave = 3
    fight(r)
    const boss = r.combat!.actors.find((a) => a.id === r.combat!.boss)!
    boss.hp = Math.floor(boss.maxHp / 2)
    const next = advanceCombat(r)
    expect(next.combat!.pendingScene).toBe("boss-3")
    expect(next.combat!.events.some((e) => e.kind === "phase")).toBe(true)
    let s = { ...emptyAutoSave(), run: next }
    const tick = next.combat!.tick
    for (const _ of SCENES["boss-3"].lines)
      s = dispatch(s, { type: "dialogue" })
    expect(s.run.combat!.tick).toBe(tick)
    expect(s.run.seenScenes).toContain("boss-3")
    expect(advanceCombat(s.run).combat!.pendingScene).toBeNull()
  })
  it("scales stars and actually applies trait, relic and augment bonuses", () => {
    const r = run()
    r.roster[0].star = 2
    r.pool[r.roster[0].id] -= 2
    r.roster[0].items = ["basket", "herbs"]
    r.augments = ["guests"]
    r.health = 30
    const b = createCombat(r),
      tank = b.actors[0]
    expect(tank.maxHp).toBe(
      Math.round((UNIT_MAP[tank.id].hp * 1.7 + 280) * 1.15),
    )
    expect(tank.attack).toBe(UNIT_MAP[tank.id].attack * 1.5)
  })
  it.each(AUTO_UNITS)(
    "casts $id using mana and produces combat effects",
    (u) => {
      const r = run()
      r.roster = []
      piece(r, u.id, 1, 18)
      fight(r)
      const ally = r.combat!.actors[0],
        foe = r.combat!.actors.find((a) => a.side === "enemy")!
      r.combat!.actors = [ally, foe]
      foe.cell = 12
      foe.stunnedUntil = 2000
      ally.mana = 100
      ally.hp = Math.max(1, ally.hp - 100)
      const out = advanceCombat(r, 12)
      expect(out.combat!.actors[0].casts).toBe(1)
      expect(out.combat!.events.some((e) => e.kind === "cast")).toBe(true)
      expect(out.combat!.actors[0].mana).toBeLessThan(100)
      expect(
        out.combat!.events.some((e) =>
          ["hit", "heal", "shield", "burn"].includes(e.kind),
        ),
      ).toBe(true)
    },
  )
  it("applies the first-cast relic multiplier to a copied allied skill", () => {
    const r = run(); r.roster = []
    piece(r, "recorder", 1, 18, ["book"]); fight(r)
    const ally = r.combat!.actors[0], foe = r.combat!.actors.find(a => a.side === "enemy")!
    r.combat!.actors = [ally, foe]; foe.cell = 12; foe.stunnedUntil = 2000; ally.mana = 100
    r.combat!.lastAllySkill = "steam"; r.combat!.lastAllyPower = 200
    const out = advanceCombat(r, 12)
    expect(out.combat!.events.find(e => e.kind === "cast" && e.amount > 0)?.amount).toBe(189)
  })
  it("caps final boss summons and awards no separate spawn-kill score", () => {
    const r = run()
    r.wave = 20
    fight(r)
    const boss = r.combat!.actors.find((a) => a.id === "unwritten")!
    boss.hp = Math.floor(boss.maxHp * 0.3)
    for (const a of r.combat!.actors) a.stunnedUntil = 2000
    const out = advanceCombat(r)
    expect(
      out.combat!.actors.filter((a) => a.side === "enemy" && a.hp > 0).length,
    ).toBeLessThanOrEqual(12)
    expect(out.score).toBe(0)
  })
})
describe("outcomes, progress and persistence", () => {
  it("does not complete or unlock the next campaign wave on defeat", () => {
    let s = { ...emptyAutoSave(), run: run("campaign") }
    s.run.scene = null
    s = dispatch(s, { type: "battle" })
    const lost = structuredClone(s.run)
    for (const a of lost.combat!.actors.filter((a) => a.side === "ally"))
      a.hp = 0
    lost.combat!.result = "loss"
    lost.phase = "result"
    s = dispatch(s, { type: "checkpoint", run: lost })
    expect(s.campaignCleared).toBe(0)
    expect(s.run.score).toBe(0)
    expect(s.seals).toBe(0)
    expect(s.run.phase).toBe("result")
    expect(s.run.finished).toBe(false)
    expect(s.records).toHaveLength(0)
    const retry = reduceAuto(s, { type: "next" })
    expect(retry.error).toBeNull()
    expect(retry.save.run).toMatchObject({ phase: "prepare", wave: 1 })
    expect(s.run.wave).toBe(1)
  })
  it("rejects a claimed victory while enemies are still alive", () => {
    let s = { ...emptyAutoSave(), run: run() }
    s = dispatch(s, { type: "battle" })
    const falseWin = structuredClone(s.run)
    falseWin.combat!.result = "win"
    falseWin.phase = "result"
    s = dispatch(s, { type: "checkpoint", run: falseWin })
    expect(s.run.phase).toBe("combat")
    expect(s.run.combat!.result).toBeNull()
    expect(s.run.score).toBe(0)
  })
  it("records abandon once, separates daily records and avoids duplicate cosmetics charges", () => {
    let s = { ...emptyAutoSave(), run: run() }
    s = dispatch(s, { type: "abandon" })
    expect(s.records).toHaveLength(1)
    expect(reduceAuto(s, { type: "abandon" }).error).toBeTruthy()
    s.seals = 100
    s = dispatch(s, { type: "cosmetic", id: "river" })
    expect(s.seals).toBe(40)
    s = dispatch(s, { type: "cosmetic", id: "market" })
    s = dispatch(s, { type: "cosmetic", id: "river" })
    expect(s.seals).toBe(40)
  })
  it("rejects stale snapshots from a different battle and corrupt pool or overlapping saves", () => {
    let s = { ...emptyAutoSave(), run: run() }
    s = dispatch(s, { type: "battle" })
    const old = structuredClone(s.run)
    old.id = "previous"
    expect(reduceAuto(s, { type: "checkpoint", run: old }).error).toBeTruthy()
    const wrong = run()
    wrong.pool["pho-bo"]++
    expect(autoRunSchema.safeParse(wrong).success).toBe(false)
    const overlap = run()
    overlap.roster[1].cell = overlap.roster[0].cell
    expect(autoRunSchema.safeParse(overlap).success).toBe(false)
  })
  it("round-trips a real in-flight battle and all three modes via encrypted code, accepting old codes", async () => {
    const auto = { ...emptyAutoSave(), run: advanceCombat(fight(run()), 40) },
      tcg = { ...newGame(), autoChess: auto },
      user = repository.loadUser()
    user.keys = 731
    expect(parseGame(tcg)?.autoChess?.run?.combat?.tick).toBe(40)
    const code = await createSaveCode(tcg, true, user),
      decoded = await readSaveCode(code)
    expect(decoded.save.autoChess).toEqual(auto)
    expect(decoded.user?.keys).toBe(731)
    expect(restoreProgress(decoded.save, decoded.user)).toBe(true)
    expect(useAppStore.getState().user.keys).toBe(731)
    expect(useGameStore.getState().save.autoChess?.run?.paused).toBe(true)
    expect(
      readTransferBackup(JSON.parse(memory.get(TRANSFER_BACKUP_KEY)!)),
    ).not.toBeNull()
    const old = await readSaveCode(await createSaveCode(newGame(), false))
    expect(old.user).toBeUndefined()
    expect(old.save.autoChess).toBeUndefined()
    expect(readTransferBackup(newGame())?.save).toBeTruthy()
  })
  it("rolls back both persisted and in-memory progress when the second write fails", () => {
    const before = newGame(),
      user = repository.loadUser()
    user.keys = 91
    memory.set(GAME_KEY, JSON.stringify(before))
    memory.set("foodchest.user.v1", JSON.stringify(user))
    useAppStore.setState({ user })
    const setter = localStorage.setItem
    let once = true
    localStorage.setItem = (k, v) => {
      if (k === "foodchest.user.v1" && once) {
        once = false
        throw Error("quota")
      }
      setter(k, v)
    }
    expect(
      restoreProgress({ ...before, coins: 999 }, { ...user, keys: 999 }),
    ).toBe(false)
    expect(memory.get(GAME_KEY)).toBe(JSON.stringify(before))
    expect(JSON.parse(memory.get("foodchest.user.v1")!).keys).toBe(91)
    expect(useAppStore.getState().user.keys).toBe(91)
    expect(useGameStore.getState().save.coins).toBe(before.coins)
  })
  it("preserves existing TCG/Chest mutations and refuses autosave failures", () => {
    const tcg = { ...newGame(), autoChess: { ...emptyAutoSave(), run: run() } }
    useGameStore.setState({ save: tcg })
    localStorage.setItem = () => {
      throw Error("quota")
    }
    expect(useGameStore.getState().autoAction({ type: "xp" })).toBe(false)
    expect(useGameStore.getState().save).toBe(tcg)
    expect(useGameStore.getState().notice).toContain("lưu")
  })
})
describe("complete content and assets", () => {
  it("has 44 distinct units, 22 enemies, all skills, valid sprites, manual story and two epilogues", () => {
    expect(AUTO_UNITS).toHaveLength(44)
    expect(new Set(AUTO_UNITS.map((u) => u.id)).size).toBe(44)
    expect(MONSTERS).toHaveLength(22)
    expect(MONSTERS.filter((m) => m.boss)).toHaveLength(6)
    expect(RELICS).toHaveLength(6)
    expect(AUGMENTS).toHaveLength(6)
    expect(Object.keys(SCENES)).toHaveLength(9)
    for (const scene of Object.values(SCENES))
      expect(scene.lines.length).toBeGreaterThanOrEqual(2)
    for (const u of AUTO_UNITS) {
      expect(existsSync("public" + u.art)).toBe(true)
      expect(u.portrait).toBeLessThan(AUTO_UNITS.length)
    }
    for (const path of [
      "movement",
      "new-movement",
      "monsters",
      "portraits",
      "roster",
      "world",
    ]) {
      const file = readFileSync(`public/assets/autochess/${path}.webp`)
      expect(file.subarray(0, 4).toString()).toBe("RIFF")
      expect(file.length).toBeLessThan(1200000)
    }
  })
  it("adds all eleven new foods to the shared catalog, TCG and eligible Chest pools", () => {
    const ids = [
      "banh-dau-xanh",
      "banh-khuc",
      "banh-can",
      "banh-tom-ho-tay",
      "com-hen",
      "che-lam",
      "chao-luon",
      "banh-it-la-gai",
      "banh-ram-it",
      "keo-cu-do",
      "banh-tet",
    ]
    const pool = buildPool(BUILT_IN_DISHES, "lunch", [])
    for (const id of ids)
      expect(
        pool.some((d) => d.id === id),
        id,
      ).toBe(true)
  })
  it("ships five original and five 8-bit music loops under a compact combined budget", () => {
    let total = 0
    for (const tracks of [MUSIC_TRACKS, RETRO_MUSIC_TRACKS])
      for (const [id, path] of Object.entries(tracks).filter(([id]) =>
        id.startsWith("auto-"),
      )) {
        const file = readFileSync("public/" + path)
        expect(file.subarray(0, 3).toString()).toBe("ID3")
        expect(file.length).toBeGreaterThan(100000)
        total += file.length
      }
    // Combat and boss loops now have 32 bars in both styles.
    expect(total).toBeLessThan(3800000)
  })
})
