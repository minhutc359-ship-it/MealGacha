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
  const old = createAutoRun("campaign", 42, "2026-10-10", "old")
  old.rulesVersion = 5
  old.wave = 12
  old.bestWave = 12
  old.phase = "won"
  old.finished = true
  old.scene = null
  old.paidWaves = Array.from({ length: 12 }, (_, i) => i + 1)
  old.gold = 57
  old.xp = 62
  const save = {
    ...emptyAutoSave(),
    run: old,
    campaignCleared: 12,
    ending: "hall" as const,
  }
  const result = reduceAuto(save, {
    type: "start",
    mode: "campaign",
    seed: 7,
    day: old.day,
    id: "continuation",
  })
  expect(result.error).toBeNull()
  expect(result.save.run?.wave).toBe(13)
  expect(result.save.run?.rulesVersion).toBe(7)
  expect(result.save.run?.gold).toBe(57)
  expect(result.save.run?.xp).toBe(62)
  expect(result.save.run?.paidWaves).toEqual(old.paidWaves)
  expect(result.save.run?.pool).toEqual(old.pool)
  expect(result.save.run?.shop).toEqual(old.shop)
  expect(result.save.ending).toBe("hall")
  expect(autoRunSchema.safeParse(result.save.run).success).toBe(true)
})
it("pays each new story stage once and preserves both old ending and old rewards", () => {
  let save: import("@/game/types").GameSave = {
    ...newGame(),
    clearedStages: STAGES.slice(0, 18).map((s) => s.id),
    storyEnding: "release" as const,
  }
  const oldCoins = save.coins
  for (const stage of STAGES.slice(18)) {
    const b = startBattle(STARTER_DECK, stage.id, "wisdom", () => 0.5)
    b.enemy.health = 0
    b.result = "win"
    save = (settleBattle({ ...save, battle: b }) as typeof save)
    expect(parseGame(save)).not.toBeNull()
    expect(save.storyEnding).toBe("release")
    const before = structuredClone(save)
    save = (settleBattle(save) as typeof save)
    expect(save).toEqual(before)
  }
  expect(save.clearedStages).toHaveLength(27)
  expect(save.story400?.claimedRewards).toHaveLength(9)
  expect(save.coins).toBeGreaterThan(oldCoins)
})

it("stores chapter choices without rewards and round-trips them through MGC1", async () => {
  const { createSaveCode, readSaveCode } = await import("@/game/saveCode")
  const save = newGame()
  save.clearedStages = STAGES.slice(0, 24).map((s) => s.id)
  save.coins = 7654
  save.storyEnding = "release"
  useGameStore.setState({ save })
  useGameStore.getState().chooseLivingPath("living-market", "listen")
  useGameStore.getState().chooseLivingPath("rain-harbor", "short")
  useGameStore.getState().chooseLivingPath("tomorrow-table", "open")
  const after = useGameStore.getState().save
  expect(after.coins).toBe(7654)
  expect(after.cards).toEqual(save.cards)
  expect(after.storyEnding).toBe("release")
  expect(after.story400?.decisions).toEqual({
    "living-market": "listen",
    "rain-harbor": "short",
    "tomorrow-table": "open",
  })
  expect((await readSaveCode(await createSaveCode(after))).save).toEqual(
    parseGame(after),
  )
  const bad = structuredClone(after)
  bad.story400!.decisions!["living-market"] = "open"
  expect(parseGame(bad)).toBeNull()
})
it("keeps tactical offers out of rules6 and supplies a usable rules7 choice", () => {
  const old = createAutoRun("survival", 42, "2026-10-10", "old")
  old.rulesVersion = 6
  for (let i = 0; i < 100; i++)
    expect(
      choices(old, "augment").some((id) =>
        TACTICAL_AUGMENTS.some((a) => a.id === id),
      ),
    ).toBe(false)
  const fresh = createAutoRun("survival", 42, "2026-10-10", "new")
  for (let i = 0; i < 100; i++)
    expect(
      choices(fresh, "augment").some((id) =>
        ["another", "v4-third-cast", "shift"].includes(id),
      ),
    ).toBe(true)
})
import { TACTICAL_AUGMENTS } from "@/game/autochess/catalog"
import { advanceCombat } from "@/game/autochess/combat"
function tacticalArena(augments: string[]) {
  const r = createAutoRun("survival", 11, "2026-10-10", "tactical")
  for (const piece of r.roster) r.pool[piece.id]++
  r.roster = [
    { uid: "one", id: "banh-mi", star: 1, cell: 18, items: [] },
    { uid: "two", id: "banh-mi", star: 1, cell: 19, items: [] },
  ]
  r.pool["banh-mi"] -= 2
  r.augments = augments
  r.combat = createCombat(r)
  r.phase = "combat"
  r.scene = null
  r.paused = false
  for (const actor of r.combat.actors) {
    actor.next = 9999
    actor.action = null
    actor.hp = actor.maxHp = 10000
  }
  return r
}
it("relays capped mana once per caster cooldown and keeps talent state in saves", () => {
  let r = tacticalArena(["v4-relay"])
  const b = r.combat!,
    caster = b.actors.find((a) => a.uid === "one")!,
    other = b.actors.find((a) => a.uid === "two")!,
    enemy = b.actors.find((a) => a.side === "enemy")!
  caster.action = {
    kind: "cast",
    start: 0,
    end: 4,
    hit: 1,
    from: caster.cell,
    to: caster.cell,
    target: enemy.uid,
    skill: caster.skill,
  }
  other.mana = 95
  r = advanceCombat(r)
  const cast = r.combat!.actors.find((a) => a.uid === "one")!,
    target = r.combat!.actors.find((a) => a.uid === "two")!
  expect(target.mana).toBe(100)
  expect(cast.talent?.relayAt).toBe(161)
  cast.action = {
    kind: "cast",
    start: 1,
    end: 5,
    hit: 2,
    from: cast.cell,
    to: cast.cell,
    target: enemy.uid,
    skill: cast.skill,
  }
  target.mana = 0
  r = advanceCombat(r)
  expect(r.combat!.actors.find((a) => a.uid === "two")!.mana).toBe(0)
  const save = newGame()
  save.autoChess = { ...emptyAutoSave(), run: r }
  expect(
    parseGame(save)?.autoChess?.run?.combat?.actors.find((a) => a.uid === "one")
      ?.talent?.relayAt,
  ).toBe(161)
})
it("adds third-cast damage only after an actual resolved third cast", () => {
  const plain = tacticalArena([]),
    boosted = tacticalArena(["v4-third-cast"])
  for (const run of [plain, boosted]) {
    const caster = run.combat!.actors[0],
      enemy = run.combat!.actors.find((a) => a.side === "enemy")!
    caster.casts = 2
    caster.action = {
      kind: "cast",
      start: 0,
      end: 4,
      hit: 1,
      from: caster.cell,
      to: caster.cell,
      target: enemy.uid,
      skill: "flame",
    }
  }
  const p = advanceCombat(plain),
    b = advanceCombat(boosted)
  expect(b.combat!.actors.find((a) => a.side === "enemy")!.hp).toBeLessThan(
    p.combat!.actors.find((a) => a.side === "enemy")!.hp,
  )
})
it("opts only new boss battles into delayed brewing and keeps old checkpoints", () => {
  const fresh = startBattle(STARTER_DECK, "rain-harbor-3", "courage", () => 0.5)
  fresh.player.board = []
  fresh.enemy.hand = []
  fresh.enemy.deck = []
  const next = actBattle(fresh, { type: "end" }).battle
  expect(next.pendingFlavors?.filter((p) => p.owner === "enemy")).toHaveLength(
    1,
  )
  expect(next.pendingFlavors?.[0].executeRound).toBe(next.round)
  const old = structuredClone(fresh)
  delete old.livingRulesVersion
  expect(actBattle(old, { type: "end" }).battle.pendingFlavors).toHaveLength(0)
})
it("repeats seeded hands and maps new card roles from the real catalog", async () => {
  const { seededHand, strategicRoles } = await import("@/game/deckStrategy")
  expect(seededHand(STARTER_DECK, 400)).toEqual(seededHand(STARTER_DECK, 400))
  expect(seededHand(STARTER_DECK, 401)).not.toEqual(
    seededHand(STARTER_DECK, 400),
  )
  expect(strategicRoles(CARD_MAP["v4-rain-seed"])).toContain("Nối phép")
})
it("charges one attack after real healing and respects the five-second cooldown", () => {
  let run = tacticalArena(["v4-heal-strike"]),
    b = run.combat!,
    healer = b.actors.find((a) => a.uid === "one")!,
    ally = b.actors.find((a) => a.uid === "two")!,
    enemy = b.actors.find((a) => a.side === "enemy")!
  ally.hp = 5000
  healer.skill = "heal"
  healer.action = {
    kind: "cast",
    start: 0,
    end: 4,
    hit: 1,
    from: healer.cell,
    to: healer.cell,
    target: enemy.uid,
    skill: "heal",
  }
  run = advanceCombat(run)
  b = run.combat!
  ally = b.actors.find((a) => a.uid === "two")!
  healer = b.actors.find((a) => a.uid === "one")!
  expect(ally.hp).toBeGreaterThan(5000)
  expect(ally.talent?.attackCharge).toBe(0.35)
  expect(ally.talent?.healAt).toBe(101)
  ally.action = {
    kind: "attack",
    start: 1,
    end: 5,
    hit: 2,
    from: ally.cell,
    to: ally.cell,
    target: enemy.uid,
  }
  healer.action = {
    kind: "cast",
    start: 1,
    end: 5,
    hit: 2,
    from: healer.cell,
    to: healer.cell,
    target: enemy.uid,
    skill: "heal",
  }
  run = advanceCombat(run)
  ally = run.combat!.actors.find((a) => a.uid === "two")!
  expect(ally.talent?.attackCharge).toBe(0)
  expect(ally.talent?.healAt).toBe(101)
})
it("awards a keeper shield once, only after a real allied death", () => {
  let run = tacticalArena(["v4-last-guard"]),
    b = run.combat!,
    guard = b.actors.find((a) => a.uid === "one")!,
    victim = b.actors.find((a) => a.uid === "two")!,
    enemy = b.actors.find((a) => a.side === "enemy")!
  guard.id = "com-tam"
  guard.shield = 0
  victim.hp = 1
  victim.shield = 0
  enemy.attack = 10000
  enemy.action = {
    kind: "attack",
    start: 0,
    end: 4,
    hit: 1,
    from: enemy.cell,
    to: enemy.cell,
    target: victim.uid,
  }
  run = advanceCombat(run)
  guard = run.combat!.actors.find((a) => a.uid === "one")!
  expect(guard.talent?.guardUsed).toBe(true)
  expect(guard.shield).toBe(160)
  const duplicate = {
    ...run.combat!.actors.find((a) => a.uid === "two")!,
    uid: "third",
    hp: 1,
    diedAt: null,
  }
  run.combat!.actors.push(duplicate)
  const attacker = run.combat!.actors.find((a) => a.uid === enemy.uid)!
  attacker.action = {
    kind: "attack",
    start: 1,
    end: 5,
    hit: 2,
    from: attacker.cell,
    to: attacker.cell,
    target: "third",
  }
  run = advanceCombat(run)
  expect(run.combat!.actors.find((a) => a.uid === "one")!.shield).toBe(160)
})
it("offers the two new deck paths with their actual keyword engines", async () => {
  const { suggestDeck } = await import("@/game/deckStrategy"),
    { CARDS } = await import("@/game/catalog")
  const owned = Object.fromEntries(CARDS.map((c) => [c.id, 2]))
  const seasoning = suggestDeck(owned, "seasoning"),
    steeping = suggestDeck(owned, "steeping")
  expect(seasoning).toHaveLength(18)
  expect(steeping).toHaveLength(18)
  expect(seasoning.some((id) => CARD_MAP[id].choices)).toBe(true)
  expect(seasoning.some((id) => CARD_MAP[id].ability === "season-host")).toBe(
    true,
  )
  expect(
    steeping.some((id) => CARD_MAP[id].ability?.startsWith("steep-")),
  ).toBe(true)
})
it("keeps optional expedition promises distinct and older unmarked runs unchanged", async () => {
  const { createExpedition, enterRunNode, startRunBattle, settleRunCombat } =
    await import("@/game/expedition")
  const create = (promise?: "safe" | "bold") => {
    let run = createExpedition(STARTER_DECK, 400, promise)
    run.health = 10
    return enterRunNode(run, run.nodes[0][0].id)
  }
  const legacy = create(),
    safe = create("safe"),
    bold = create("bold"),
    plain = startRunBattle(legacy),
    s = startRunBattle(safe),
    b = startRunBattle(bold)
  expect(legacy.promise).toBeUndefined()
  expect(s.player.health).toBe(plain.player.health + 2)
  expect(b.enemy.maxHealth).toBe(Math.round(plain.enemy.maxHealth * 1.12))
  plain.result = "win"
  b.result = "win"
  expect(
    settleRunCombat(bold, b).supplies - settleRunCombat(legacy, plain).supplies,
  ).toBe(8)
})
