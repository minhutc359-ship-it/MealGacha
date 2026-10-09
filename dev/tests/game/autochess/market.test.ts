import { describe, expect, it } from "vitest"
import { createAutoRun, refreshShop, poolSize, copies } from "@/game/autochess/economy"
import { AUTO_UNITS, LEGACY_UNIT_IDS, MONSTERS, SHOP_ODDS, UNIT_MAP, shopOdds } from "@/game/autochess/catalog"
import { shortcutAction, acceptsShortcut } from "@/game/autochess/shortcuts"
import { reduceAuto } from "@/game/autochess/reducer"
import { autoRunSchema, autoSaveSchema } from "@/game/autochess/schema"
import { emptyAutoSave, type AutoRun, type Piece } from "@/game/autochess/types"
import { starScale, starUpgrades } from "@/game/autochess/presentation"
import { enemyPlan, createCombat, advanceCombat } from "@/game/autochess/combat"
import { newGame } from "@/game/progression"
import { parseGame } from "@/game/storage"
import { createSaveCode, readSaveCode } from "@/game/saveCode"

const initial = () => createAutoRun("survival", 42, "2026-10-09", "market")
function add(run: AutoRun, id: string, cell: number | null = null, star: Piece["star"] = 1) {
  const p: Piece = { uid: `p${run.nextUid++}`, id, cell, star, items: [] }
  run.roster.push(p); run.pool[id] -= copies(star)
  return p
}
function stock(run: AutoRun, id: string) {
  for (const held of run.shop) if (held) run.pool[held]++
  run.shop = [id, null, null, null, null]; run.pool[id]--
}
const event = { key: "W", repeat: false, isComposing: false, ctrlKey: false, metaKey: false, altKey: false }

describe("PC shortcuts use the real economy guards", () => {
  it("W toggles the hovered unit without silently swapping when the board/bench is full", () => {
    let save = { ...emptyAutoSave(), run: initial() }
    const bench = add(save.run!, "bun-ca")
    const rejected = reduceAuto(save, shortcutAction(save.run!, "w", bench.uid)!)
    expect(rejected.error).toBeTruthy(); expect(rejected.save).toBe(save)
    save = reduceAuto(save, shortcutAction(save.run!, "w", "p1")!).save as typeof save
    expect(save.run!.roster.find(p => p.uid === "p1")!.cell).toBeNull()
    save = reduceAuto(save, shortcutAction(save.run!, "w", bench.uid)!).save as typeof save
    expect(save.run!.roster.find(p => p.uid === bench.uid)!.cell).toBeGreaterThanOrEqual(30)
    for (const id of ["banh-mi", "bun-rieu", "bun-cha", "xoi", "che-buoi", "banh-chung", "com-ga", "dua-hanh"]) add(save.run!, id)
    const full = reduceAuto(save, shortcutAction(save.run!, "w", bench.uid)!)
    expect(full.error).toContain("đầy"); expect(full.save).toBe(save)
    expect(autoRunSchema.safeParse(save.run).success).toBe(true)
  })
  it("E refunds all star copies/items; F and D share click prices, affordability and max-level caps", () => {
    let save = { ...emptyAutoSave(), run: initial() }
    const unit = add(save.run!, "cha-ruoi", null, 2); unit.items = ["ladle"]
    const gold = save.run!.gold
    save = reduceAuto(save, shortcutAction(save.run!, "e", unit.uid)!).save as typeof save
    expect(save.run!.gold).toBe(gold + 9); expect(save.run!.inventory).toContain("ladle")
    expect(save.run!.pool[unit.id]).toBe(poolSize(3))
    save = reduceAuto(save, shortcutAction(save.run!, "f", null)!).save as typeof save
    expect(save.run!.xp).toBe(4); expect(save.run!.gold).toBe(gold + 5)
    save = reduceAuto(save, shortcutAction(save.run!, "d", null)!).save as typeof save
    expect(save.run!.gold).toBe(gold + 3)
    save.run!.xp = 128
    expect(reduceAuto(save, shortcutAction(save.run!, "f", null)!).save).toBe(save)
    save.run!.gold = 0
    expect(reduceAuto(save, shortcutAction(save.run!, "d", null)!).save).toBe(save)
    expect(shortcutAction(save.run!, "e", "enemy")).toBeNull()
    save.run!.phase = "combat"
    expect(shortcutAction(save.run!, "f", null)).toBeNull()
  })
  it("ignores typing, repeats, IME, OS shortcuts and narrative scenes", () => {
    expect(acceptsShortcut(event, false)).toBe(true)
    for (const field of ["repeat", "isComposing", "ctrlKey", "metaKey", "altKey"] as const)
      expect(acceptsShortcut({ ...event, [field]: true }, false)).toBe(false)
    expect(acceptsShortcut(event, true)).toBe(false)
    const run = initial(); run.scene = "intro-1"
    expect(shortcutAction(run, "d", null)).toBeNull()
  })
})

describe("star awakening is cosmetic and handles chained merges", () => {
  it("animates the retained board UID for both 2-star and a chained 3-star merge; does not replay on load", () => {
    const run = initial(); run.gold = 99
    add(run, "com-tam"); stock(run, "com-tam")
    let before = structuredClone(run)
    let after = reduceAuto({ ...emptyAutoSave(), run }, { type: "buy", index: 0 }).save.run!
    const two = starUpgrades(before.roster, after.roster, 100)
    expect(two).toHaveLength(1); expect(two[0]).toMatchObject({ uid: "p1", from: 1, to: 2 })
    expect(two[0].sources).toHaveLength(1)
    // Move the earlier retained two-star copy to the bench; the new board trio
    // keeps its UID when it then consumes two bench two-stars.
    after.roster[0].cell = null
    add(after, "com-tam", null, 2)
    const kept = add(after, "com-tam", 20)
    add(after, "com-tam"); stock(after, "com-tam")
    before = structuredClone(after)
    after = reduceAuto({ ...emptyAutoSave(), run: after }, { type: "buy", index: 0 }).save.run!
    const three = starUpgrades(before.roster, after.roster, 200)
    expect(three).toHaveLength(1); expect(three[0]).toMatchObject({ uid: kept.uid, from: 1, to: 3 })
    expect(starUpgrades(after.roster, after.roster, 300)).toEqual([])
    expect(starScale(2) / starScale(1)).toBeCloseTo(1.07)
    expect(starScale(3) / starScale(2)).toBeCloseTo(1.07)
    expect(autoRunSchema.safeParse(after).success).toBe(true)
  })
})

describe("finite level-based recruitment", () => {
  it("provides a diverse 1–5 gold roster and matches advertised odds over 50,000 slots per level", () => {
    expect([1, 2, 3, 4, 5].map(cost => AUTO_UNITS.filter(u => u.cost === cost).length)).toEqual([8, 11, 10, 8, 7])
    for (const [index, xp] of [0, 8, 20, 38, 62, 92, 128].entries()) {
      const run = initial(); run.xp = xp
      const counts = [0, 0, 0, 0, 0]
      for (let i = 0; i < 10000; i++) { refreshShop(run); for (const id of run.shop) counts[UNIT_MAP[id!].cost - 1]++ }
      expect(SHOP_ODDS[index].reduce((a, b) => a + b)).toBe(100)
      for (let cost = 0; cost < 5; cost++) expect(Math.abs(counts[cost] / 500 - SHOP_ODDS[index][cost])).toBeLessThan(.9)
      expect(autoRunSchema.safeParse(run).success).toBe(true)
    }
  })
  it("never falls into locked tiers when all permitted pools are empty; redistributes to eligible stock", () => {
    const run = initial()
    for (const id of run.shop) if (id) run.pool[id]++
    run.shop = Array(5).fill(null)
    for (const unit of AUTO_UNITS) if (unit.cost <= 2) run.pool[unit.id] = 0
    refreshShop(run); expect(run.shop).toEqual(Array(5).fill(null))
    run.pool["bun-cha"] = 2
    refreshShop(run)
    expect(run.shop.filter(Boolean)).toEqual(["bun-cha", "bun-cha"])
    expect(run.pool["bun-cha"]).toBe(0)
    for (const unit of AUTO_UNITS) expect(run.pool[unit.id]).toBeGreaterThanOrEqual(0)
  })
})

describe("legacy progress and broader enemies", () => {
  it("loads and transfers a real 32-unit pool, retaining its seed, score, held copies and rules for future waves", async () => {
    const raw = initial(); raw.rulesVersion = 2; raw.score = 987; raw.xp = 62
    for (const id of raw.shop) if (id) raw.pool[id]++
    raw.shop = ["chef-lien", null, null, null, null]; raw.pool["chef-lien"]--
    for (const unit of AUTO_UNITS) if (!LEGACY_UNIT_IDS.has(unit.id)) delete raw.pool[unit.id]
    const snapshot = structuredClone(raw)
    const loaded = autoRunSchema.parse(raw)
    expect(raw).toEqual(snapshot)
    for (const [key, value] of Object.entries(snapshot)) if (key !== "pool") expect(loaded[key as keyof AutoRun]).toEqual(value)
    for (const id of LEGACY_UNIT_IDS) expect(loaded.pool[id]).toBe(raw.pool[id])
    const save = { ...newGame(), autoChess: { ...emptyAutoSave(), run: loaded } }
    const restored = await readSaveCode(await createSaveCode(save))
    expect(restored.save.autoChess!.run).toEqual(loaded)
    expect(parseGame({ ...save, autoChess: { ...save.autoChess, run: raw } })!.autoChess!.run).toEqual(loaded)
    const started = reduceAuto(save.autoChess, { type: "battle" }).save.run!
    expect(started.rulesVersion).toBe(2)
    refreshShop(loaded)
    expect(loaded.shop.filter(Boolean).every(id => LEGACY_UNIT_IDS.has(id!))).toBe(true)
    expect(shopOdds(7, 2)[4]).toBe(10); expect(shopOdds(7, 3)[4]).toBe(5)
    const corrupt = structuredClone(raw); delete corrupt.pool["pho-bo"]
    expect(autoRunSchema.safeParse(corrupt).success).toBe(false)
    expect(autoSaveSchema.safeParse(save.autoChess).success).toBe(true)
  })
  it("unlocks all 16 normals and 6 bosses deterministically, with legal cells and resolved skills", () => {
    const seen = new Set<string>()
    for (const seed of [1, 42, 997, 5723, 123456]) for (let wave = 1; wave <= 60; wave++) {
      const run = initial(); run.seed = seed; run.wave = wave
      const plan = enemyPlan(run)
      expect(enemyPlan(run)).toEqual(plan)
      expect(new Set(plan.map(p => p.cell)).size).toBe(plan.length)
      for (const { def, cell } of plan) { seen.add(def.id); expect(cell).toBeLessThan(18); expect(cell).toBeGreaterThanOrEqual(0); if (def.unlockWave) expect(wave).toBeGreaterThanOrEqual(def.unlockWave) }
      if (wave % 5 === 0) expect(plan.filter(p => p.def.boss)).toHaveLength(1)
    }
    expect(seen.size).toBe(MONSTERS.length)
    for (const id of ["ink-crab", "char-hound", "silk-moth", "bamboo-wraith", "rival-ladle", "rival-flute", "boss-drum", "boss-lotus"]) {
      let run = initial(); run.wave = id === "boss-lotus" ? 30 : 25; run.phase = "combat"
      run.combat = createCombat(run)
      // Exercise each new skill with a real actor and normal tick resolution.
      const def = MONSTERS.find(m => m.id === id)!, enemy = run.combat.actors.find(a => a.side === "enemy")!
      Object.assign(enemy, { id, cell: 14, range: def.range, skill: def.skill, power: def.power, mana: 100 })
      run = advanceCombat(run, 40)
      expect(run.combat!.actors.find(a => a.uid === enemy.uid)!.casts).toBeGreaterThan(0)
      expect(autoRunSchema.safeParse(run).success).toBe(true)
    }
    const campaign = initial(); campaign.mode = "campaign"
    expect([3, 6, 9, 12].map(wave => enemyPlan({ ...campaign, wave }).find(p => p.def.boss)!.def.id)).toEqual(["empty-lantern", "white-ink", "one-color", "unwritten"])
  })
})
