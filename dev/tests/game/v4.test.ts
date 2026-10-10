import { beforeEach, describe, expect, it } from "vitest"
import { actBattle, startBattle } from "@/game/battle"
import { CARD_MAP, STARTER_DECK } from "@/game/catalog"
import { reduceAuto } from "@/game/autochess/reducer"
import { emptyAutoSave } from "@/game/autochess/types"
import { settleBattle, newGame } from "@/game/progression"
import { parseGame } from "@/game/storage"
import { STAGES, isStageUnlocked } from "@/game/story"
import { useGameStore } from "@/game/useGameStore"
import { clearProtectedState } from "@/infrastructure/storage/protectedStorage"
import { createAutoRun, choices } from "@/game/autochess/economy"
import { enemyPlan, createCombat } from "@/game/autochess/combat"
import { autoRunSchema } from "@/game/autochess/schema"
import { livingOpening } from "@/game/livingStory"
const arena = () => {
  const b = startBattle(STARTER_DECK, null, "courage", () => 0.5)
  b.player.mana = b.player.maxMana = 7
  b.enemy.hand = []
  b.enemy.deck = Array(18).fill("banh-mi")
  return b
}
const ally = (uid = "ally") => ({
  uid,
  cardId: "banh-mi",
  attack: 2,
  health: 3,
  maxHealth: 3,
  shield: 0,
  ready: true,
  keywords: [],
})
beforeEach(() => {
  const memory = new Map<string, string>()
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => memory.set(k, v),
      removeItem: (k: string) => memory.delete(k),
    },
  })
  clearProtectedState()
  useGameStore.setState({ save: newGame(), notice: null })
})
describe("living market rules and preservation", () => {
  it("does not spend mana, change RNG or remove a Nêm card without an explicit branch", () => {
    const b = arena()
    b.player.hand = ["v4-two-spices"]
    const original = structuredClone(b)
    const result = actBattle(b, { type: "play", index: 0, target: "hero" })
    expect(result.error).toBeTruthy()
    expect(result.battle).toEqual(original)
    expect(b).toEqual(original)
    const hit = actBattle(b, {
      type: "play",
      index: 0,
      branch: "first",
      target: "hero",
    })
    expect(hit.error).toBeNull()
    expect(hit.battle.enemy.health).toBe(b.enemy.health - 3)
    expect(hit.battle.player.spellsThisTurn).toBe(1)
  })
  it("resolves Ủ vị once after the opponent turn, survives a save, and caps pending effects", () => {
    let b = arena()
    b.player.board = [ally()]
    b.player.hand = ["v4-banked-coals", "v4-banked-coals", "v4-banked-coals"]
    b = actBattle(b, { type: "play", index: 0 }).battle
    b = actBattle(b, { type: "play", index: 0 }).battle
    expect(b.player.board[0].attack).toBe(2)
    expect(b.pendingFlavors).toHaveLength(2)
    expect(actBattle(b, { type: "play", index: 0 }).error).toBeTruthy()
    const restored = parseGame({ ...newGame(), battle: b })
    expect(restored?.battle?.pendingFlavors).toEqual(b.pendingFlavors)
    b = actBattle(restored!.battle!, { type: "end" }).battle
    expect(b.pendingFlavors).toHaveLength(0)
    expect(b.player.board[0].attack).toBe(6)
    b = actBattle(b, { type: "end" }).battle
    expect(b.player.board[0].attack).toBe(6)
  })
  it("requires an exact enemy pending target and never cancels your own effect", () => {
    const b = arena()
    b.player.hand = ["v4-unseal-recipe"]
    b.flavorSequence = 2
    b.pendingFlavors = [
      {
        id: "one",
        owner: "enemy",
        cardId: "v4-rain-seed",
        effect: "heal",
        power: 4,
        executeRound: 2,
        sequence: 1,
      },
      {
        id: "two",
        owner: "player",
        cardId: "v4-rain-seed",
        effect: "heal",
        power: 4,
        executeRound: 2,
        sequence: 2,
      },
    ]
    expect(
      actBattle(b, { type: "play", index: 0, target: "two" }).error,
    ).toBeTruthy()
    const r = actBattle(b, { type: "play", index: 0, target: "one" })
    expect(r.error).toBeNull()
    expect(r.battle.pendingFlavors?.map((f) => f.id)).toEqual(["two"])
  })
  it("preserves frozen legacy battles, rejects new cards in them, and retains ending gates", () => {
    const b = arena()
    delete b.rulesVersion
    delete b.pendingFlavors
    delete b.flavorSequence
    expect(parseGame({ ...newGame(), battle: b })?.battle?.rulesVersion).toBe(
      350,
    )
    b.player.hand = ["v4-rain-seed"]
    expect(actBattle(b, { type: "play", index: 0 }).error).toBeTruthy()
    const old = STAGES.slice(0, 18).map((s) => s.id)
    expect(isStageUnlocked("living-market-1", old)).toBe(false)
    expect(isStageUnlocked("living-market-1", old, "release")).toBe(true)
    expect(livingOpening("release").speaker).toBe("An")
    expect(livingOpening("remember").speaker).toContain("Mai")
  })
  it("claims the gift once without changing decks, old inventory, money, or old progress", () => {
    const before = structuredClone(useGameStore.getState().save)
    useGameStore.getState().claimV4Gift()
    const first = structuredClone(useGameStore.getState().save)
    expect(first.decks).toEqual(before.decks)
    expect(first.coins).toBe(before.coins)
    expect(first.cards["banh-mi"]).toBe(before.cards["banh-mi"])
    expect(first.cards["v4-rain-seed"]).toBe(2)
    useGameStore.getState().claimV4Gift()
    expect(useGameStore.getState().save).toEqual(first)
    expect(parseGame(first)).not.toBeNull()
  })
  it("keeps old augment RNG pools and validates two new campaign bosses and wave 18", () => {
    const old = createAutoRun("campaign", 42, "2026-10-10", "old")
    old.rulesVersion = 5
    for (let i = 0; i < 20; i++)
      expect(choices(old, "augment").every((id) => !id.startsWith("v4-"))).toBe(
        true,
      )
    const run = createAutoRun("campaign", 42, "2026-10-10", "new")
    run.wave = 15
    expect(enemyPlan(run).find((p) => p.def.boss)?.def.id).toBe("v4-tide-lock")
    run.wave = 18
    expect(enemyPlan(run).find((p) => p.def.boss)?.def.id).toBe("v4-last-page")
    expect(autoRunSchema.safeParse(run).success).toBe(true)
    old.wave = 18
    expect(autoRunSchema.safeParse(old).success).toBe(false)
  })
  it("applies new augments only on v6 combat initialization", () => {
    const run = createAutoRun("survival", 1, "2026-10-10", "new")
    run.roster = [{ uid: "p", id: "banh-mi", star: 1, cell: 18, items: [] }]
    const plain = createCombat(run).actors.find((a) => a.uid === "p")!
    run.augments = ["v4-front-apron", "v4-slow-fire"]
    const buff = createCombat(run).actors.find((a) => a.uid === "p")!
    expect(buff.shield).toBe(plain.shield + 180)
    expect(buff.maxHp).toBeGreaterThan(plain.maxHp)
    expect(buff.armor).toBe(plain.armor + 6)
    run.rulesVersion = 5
    const legacy = createCombat(run).actors.find((a) => a.uid === "p")!
    expect(legacy.shield).toBe(plain.shield)
    expect(legacy.maxHp).toBe(plain.maxHp)
  })
})

it("continues a finished 3.5 campaign at 13 without replacing its team or receipts", () => {
 const old = createAutoRun("campaign",42,"2026-10-10","old")
 old.rulesVersion=5; old.wave=12; old.bestWave=12; old.phase="won"; old.finished=true; old.scene=null; old.paidWaves=Array.from({length:12},(_,i)=>i+1); old.gold=57; old.xp=62
 const save={...emptyAutoSave(),run:old,campaignCleared:12,ending:"hall" as const}
 const result=reduceAuto(save,{type:"start",mode:"campaign",seed:7,day:old.day,id:"continuation"})
 expect(result.error).toBeNull(); expect(result.save.run?.wave).toBe(13); expect(result.save.run?.rulesVersion).toBe(6); expect(result.save.run?.gold).toBe(57); expect(result.save.run?.xp).toBe(62); expect(result.save.run?.paidWaves).toEqual(old.paidWaves); expect(result.save.run?.pool).toEqual(old.pool); expect(result.save.run?.shop).toEqual(old.shop); expect(result.save.ending).toBe("hall"); expect(autoRunSchema.safeParse(result.save.run).success).toBe(true)
})
it("pays each new story stage once and preserves both old ending and old rewards", () => {
 let save: import("@/game/types").GameSave={...newGame(),clearedStages:STAGES.slice(0,18).map(s=>s.id),storyEnding:"release" as const}
 const oldCoins=save.coins
 for(const stage of STAGES.slice(18)) {
  const b=startBattle(STARTER_DECK,stage.id,"wisdom",()=>.5); b.enemy.health=0; b.result="win"; save=settleBattle({...save,battle:b}) as typeof save
  expect(parseGame(save)).not.toBeNull(); expect(save.storyEnding).toBe("release")
  const before=structuredClone(save); save=settleBattle(save) as typeof save; expect(save).toEqual(before)
 }
 expect(save.clearedStages).toHaveLength(27); expect(save.story400?.claimedRewards).toHaveLength(9); expect(save.coins).toBeGreaterThan(oldCoins)
})
