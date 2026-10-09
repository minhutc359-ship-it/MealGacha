import { describe, expect, it } from "vitest"
import { AUTO_UNITS, shopOdds } from "@/game/autochess/catalog"
import { BENCH_SLOTS, LEVEL_XP, MAX_LEVEL } from "@/game/autochess/config"
import { benchLayout, capacity, copies, createAutoRun, levelProgress } from "@/game/autochess/economy"
import { createCombat, advanceCombat } from "@/game/autochess/combat"
import { craft, equipPreview, ITEM_MAP, ITEM_RECIPES, itemPreview, mergedEquipment, recipe } from "@/game/autochess/items"
import { reduceAuto, type AutoAction } from "@/game/autochess/reducer"
import { autoRunSchema } from "@/game/autochess/schema"
import { emptyAutoSave, type AutoRun, type Piece } from "@/game/autochess/types"
import { starUpgrades } from "@/game/autochess/presentation"
import { newGame } from "@/game/progression"
import { parseGame } from "@/game/storage"
import { createSaveCode, readSaveCode } from "@/game/saveCode"
import { traitTier } from "@/components/autochess/AutoTraits"
import { starSourcePosition } from "@/game/autochess/starVfx"

const initial = () => createAutoRun("survival", 42, "2026-10-09", "nine-market")
function add(run: AutoRun, id: string, cell: number | null = null, star: Piece["star"] = 1, benchSlot?: number) {
  const p: Piece = { uid: `p${run.nextUid++}`, id, star, cell, items: [], ...(benchSlot === undefined ? {} : { benchSlot }) }
  run.roster.push(p); run.pool[id] -= copies(star)
  return p
}
function stock(run: AutoRun, id: string) {
  for (const held of run.shop) if (held) run.pool[held]++
  run.shop = [id, null, null, null, null]; run.pool[id]--
}
function act(run: AutoRun, action: AutoAction) { return reduceAuto({ ...emptyAutoSave(), run }, action) }
const fill = ["bun-rieu", "bun-cha", "banh-xeo", "xoi", "com-ga", "banh-chung", "banh-tet", "xoi-xeo", "dua-hanh"]

describe("nine slots and two additional levels", () => {
  it("keeps all nine bench merge trails inside the board, including slots 6–8", () => {
    const positions = Array.from({ length: BENCH_SLOTS }, (_, benchSlot) => starSourcePosition({ cell: null, benchSlot }, 60, 10, 20))
    expect(positions.every(p => p.x > 10 && p.x < 370 && p.y === 380)).toBe(true)
    expect(positions.map(p => p.x)).toEqual([...positions.map(p => p.x)].sort((a, b) => a - b))
    expect(starSourcePosition({ cell: null }, 60, 10, 20).x).toBe(190)
    const board = starSourcePosition({ cell: 35 }, 60, 10, 20)
    expect(board.x).toBe(340); expect(board.y).toBeCloseTo(369.2)
  })
  it("keeps old XP gates and exposes exactly nine units at 128 XP", () => {
    expect(LEVEL_XP.map(capacity)).toEqual([3, 4, 5, 6, 7, 8, 9])
    expect(capacity(91)).toBe(7); expect(capacity(127)).toBe(8); expect(capacity(1000)).toBe(MAX_LEVEL)
    expect(levelProgress(62)).toMatchObject({ level: 7, next: 92, remaining: 30, percent: 0 })
    expect(levelProgress(124)).toMatchObject({ level: 8, next: 128, remaining: 4 })
    expect(levelProgress(128)).toMatchObject({ level: 9, next: null, remaining: 0, percent: 100 })
    const run = initial(); run.xp = 124
    const upgraded = act(run, { type: "xp" }).save.run!
    expect(upgraded.xp).toBe(128); expect(upgraded.gold).toBe(run.gold - 4)
    const capped = act(upgraded, { type: "xp" })
    expect(capped.error).toContain("9 quân"); expect(capped.save.run).toBe(upgraded)
  })
  it("renders nine bench slots and moves/swaps the last slot without exceeding either capacity", () => {
    const run = initial()
    expect(benchLayout(run)).toHaveLength(BENCH_SLOTS)
    fill.forEach(id => add(run, id))
    const original = structuredClone(run), last = benchLayout(run)[8]!
    const swapped = act(run, { type: "move", uid: "p1", cell: null, benchSlot: 8 }).save.run!
    expect(benchLayout(swapped)[8]!.uid).toBe("p1")
    expect(swapped.roster.find(p => p.uid === last.uid)!.cell).toBe(20)
    expect(swapped.roster.filter(p => p.cell === null)).toHaveLength(9)
    expect(autoRunSchema.safeParse(swapped).success).toBe(true)
    expect(act(run, { type: "move", uid: "p1", cell: null, benchSlot: 9 }).error).toBeTruthy()
    expect(run).toEqual(original)
  })
  it("accepts a full nine-unit board and nine-unit bench, rejects a tenth bench unit", () => {
    const run = initial(); run.xp = 128
    fill.slice(0, 6).forEach((id, i) => add(run, id, [18, 19, 21, 22, 24, 25][i]))
    fill.forEach(id => add(run, id))
    expect(run.roster).toHaveLength(18); expect(autoRunSchema.safeParse(run).success).toBe(true)
    expect(createCombat(run).actors.filter(a => a.side === "ally")).toHaveLength(9)
    add(run, "che-buoi")
    expect(autoRunSchema.safeParse(run).success).toBe(false)
  })
  it("normalizes only eligible shop tiers at levels 8–9, with unchanged percentages at levels 3–7", () => {
    expect(shopOdds(7, 3)).toEqual([15, 25, 30, 25, 5])
    expect(shopOdds(8, 4)).toEqual([10, 20, 25, 35, 10])
    expect(shopOdds(9, 4)).toEqual([5, 10, 20, 40, 25])
    for (const version of [1, 2, 3, 4]) for (let level = 3; level <= 9; level++) expect(shopOdds(level, version).reduce((a, b) => a + b)).toBe(100)
    expect(traitTier(1, [2, 4])).toBe("inactive"); expect(traitTier(2, [2, 4])).toBe("bronze")
    expect(traitTier(4, [2, 4])).toBe("silver"); expect(traitTier(6, [2, 4, 6])).toBe("gold")
  })
})

describe("buy-to-merge with a full bench", () => {
  it("buys the third one-star copy with 9/9 bench slots, preserving gold/pool/position", () => {
    const run = initial(); add(run, "com-tam"); fill.slice(0, 8).forEach(id => add(run, id)); stock(run, "com-tam")
    const after = act(run, { type: "buy", index: 0 })
    expect(after.error).toBeNull()
    expect(after.save.run!.roster.find(p => p.uid === "p1")).toMatchObject({ star: 2, cell: 20 })
    expect(after.save.run!.gold).toBe(run.gold - 1); expect(after.save.run!.pool).toEqual(run.pool)
    expect(after.save.run!.roster.filter(p => p.cell === null)).toHaveLength(8)
    expect(autoRunSchema.safeParse(after.save.run).success).toBe(true)
  })
  it("chains the shop copy into three stars while full, emitting one awakening for the retained UID", () => {
    const run = initial(); add(run, "com-tam", null, 2); add(run, "com-tam", null, 2); add(run, "com-tam")
    fill.slice(0, 6).forEach(id => add(run, id)); stock(run, "com-tam")
    const after = act(run, { type: "buy", index: 0 }).save.run!
    expect(after.roster.find(p => p.uid === "p1")).toMatchObject({ star: 3, cell: 20 })
    expect(after.roster.filter(p => p.cell === null)).toHaveLength(6)
    expect(starUpgrades(run.roster, after.roster, 100)).toMatchObject([{ uid: "p1", to: 3 }])
    expect(autoRunSchema.safeParse(after).success).toBe(true)
  })
  it("rejects an unrelated purchase atomically when full or insufficiently funded", () => {
    const run = initial(); fill.forEach(id => add(run, id)); stock(run, "che-buoi")
    const before = structuredClone(run), rejected = act(run, { type: "buy", index: 0 })
    expect(rejected.error).toContain("đầy"); expect(rejected.save.run).toBe(run); expect(run).toEqual(before)
    run.gold = 0; stock(run, "pho-bo")
    expect(act(run, { type: "buy", index: 0 }).error).toContain("vàng")
  })
})

describe("shards, preview and real equipment effects", () => {
  it("offers six symmetric recipes including equal ingredients, with no extra full relic IDs", () => {
    expect(ITEM_RECIPES).toHaveLength(6)
    for (const { parts, result } of ITEM_RECIPES) { expect(recipe(parts[0], parts[1])).toBe(result); expect(recipe(parts[1], parts[0])).toBe(result); expect(ITEM_MAP[result]).toBeTruthy() }
    expect(recipe("book", "spark")).toBeNull()
  })
  it("previews without mutation and consumes two specific copies, including identical IDs", () => {
    const run = initial(); run.inventory = ["spark", "spark", "dew"]
    const before = structuredClone(run)
    expect(itemPreview(run, 0, { kind: "craft", index: 1 })).toMatchObject({ valid: true, result: "bell" })
    expect(run).toEqual(before)
    expect(craft(run, 0, 1)).toBeNull(); expect(run.inventory).toEqual(["dew", "bell"])
    for (const [index, target] of [[0, 0], [-1, 0], [9, 0], [0, 1]]) {
      const current = structuredClone(run)
      expect(craft(run, index, target)).toBeTruthy(); expect(run).toEqual(current)
    }
  })
  it("combines on an equipped shard even when both equipment slots are occupied", () => {
    const run = initial(); run.roster[0].items = ["book", "spark"]; run.inventory = ["fiber"]
    expect(equipPreview(run.roster[0], "fiber")).toMatchObject({ valid: true, result: "lantern", combine: "spark" })
    const after = act(run, { type: "equip", uid: "p1", item: "fiber" }).save.run!
    expect(after.roster[0].items).toEqual(["book", "lantern"]); expect(after.inventory).toEqual([])
    expect(autoRunSchema.safeParse(after).success).toBe(true)
  })
  it("retains ingredients on duplicate/full/invalid targets and locks equipment changes in combat", () => {
    const run = initial(); run.roster[0].items = ["lantern", "spark"]; run.inventory = ["fiber", "dew"]
    for (const action of [{ type: "equip", uid: "p1", item: "fiber" }, { type: "equip", uid: "missing", item: "dew" }, { type: "craft", index: 0, target: 0 }] as AutoAction[]) {
      const before = structuredClone(run); expect(act(run, action).error).toBeTruthy(); expect(run).toEqual(before)
    }
    run.phase = "combat"; run.combat = createCombat(run)
    expect(act(run, { type: "craft", index: 0, target: 1 }).error).toContain("chuẩn bị")
  })
  it("applies the advertised shard stats in real combat creation", () => {
    const base = createCombat(initial()).actors.find(a => a.uid === "p1")!
    for (const [id, field, delta] of [["spark", "attack", 6], ["dew", "mana", 10], ["fiber", "maxHp", 60]] as const) {
      const run = initial(); run.inventory = [id]
      const equipped = act(run, { type: "equip", uid: "p1", item: id }).save.run!
      const actor = createCombat(equipped).actors.find(a => a.uid === "p1")!
      expect(actor[field]).toBe(base[field] + delta)
    }
  })
  it("merges shards and returns duplicate or excess relics instead of discarding equipment value", () => {
    expect(mergedEquipment(["bell", "spark", "spark", "dew", "fiber", "book"])).toEqual({ kept: ["bell", "book"], overflow: ["bell", "herbs"] })
    const run = initial(); run.roster[0].items = ["spark"]
    const second = add(run, "com-tam"); second.items = ["fiber"]; stock(run, "com-tam")
    const after = act(run, { type: "buy", index: 0 }).save.run!
    expect(after.roster[0].items).toEqual(["lantern"])
    expect(autoRunSchema.safeParse(after).success).toBe(true)
    const sold = act(after, { type: "sell", uid: "p1" }).save.run!
    expect(sold.inventory).toContain("lantern")
  })
  it("a shard reward grants two actual ingredients and can craft its promised relic", () => {
    const run = initial(); run.phase = "reward"; run.reward = { kind: "relic", choices: ["dew"] }
    const after = act(run, { type: "reward", id: "dew" }).save.run!
    expect(after.inventory.filter(id => id === "dew")).toHaveLength(3)
    expect(autoRunSchema.safeParse(after).success).toBe(true)
  })
})

describe("save compatibility and transfer", () => {
  it("keeps a v3 run unchanged and round-trips 18 owned units and crafted/shard items in MGC1", async () => {
    const run = initial(); run.rulesVersion = 3; run.xp = 128; run.score = 90210; run.gold = 72; run.inventory = ["book", "fiber", "spark"]
    fill.slice(0, 6).forEach((id, i) => add(run, id, [18, 19, 21, 22, 24, 25][i]))
    fill.forEach((id, index) => add(run, id, null, 1, index)); run.roster[0].items = ["dew"]
    const game = { ...newGame(), autoChess: { ...emptyAutoSave(), run } }
    expect(parseGame(JSON.parse(JSON.stringify(game)))?.autoChess?.run).toEqual(run)
    const parsed = await readSaveCode(await createSaveCode(game))
    expect(parsed.save.autoChess?.run).toEqual(run)
    const before = structuredClone(run), result = act(run, { type: "battle" })
    expect(result.error).toBeNull(); expect(result.save.run!.rulesVersion).toBe(3)
    expect(run).toEqual(before)
    expect(Object.keys(run.pool)).toHaveLength(AUTO_UNITS.length)
  })
  it("saves a real nine-survivor settlement and all nine team members in the final record", () => {
    const run = initial(); run.xp = 128
    fill.slice(0, 6).forEach((id, i) => add(run, id, [18, 19, 21, 22, 24, 25][i]))
    const started = act(run, { type: "battle" }).save
    for (const actor of started.run!.combat!.actors) if (actor.side === "enemy") actor.hp = 0
    const advanced = advanceCombat(started.run!)
    const settled = reduceAuto(started, { type: "checkpoint", run: advanced }).save
    expect(settled.run!.lastResult!.survivors).toBe(9)
    expect(autoRunSchema.safeParse(settled.run).success).toBe(true)
    const finished = reduceAuto(settled, { type: "abandon" }).save
    expect(finished.records[0].team).toHaveLength(9)
    expect(parseGame({ ...newGame(), autoChess: finished })?.autoChess?.records[0].team).toHaveLength(9)
  })
})
