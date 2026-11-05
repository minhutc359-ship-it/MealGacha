import { describe, expect, it } from "vitest"
import {
  createTacticalBattle,
  reduceTacticalBattle,
  type BattleUnit,
  type TacticalBattleState,
} from "@/game/tacticalTcg/engine"
import {
  DUEL_CARDS,
  DUEL_CARD_MAP,
  combatCard,
} from "@/game/tacticalTcg/duelCards"
import { TACTICAL_STARTER, TACTICAL_CARDS } from "@/game/tacticalTcg/cards"
import {
  directedTargets,
  directedReadiness,
  enableDirectedBattle,
} from "@/game/tacticalTcg/engine/directedRules"
import { upgradeDuelBattle } from "@/game/tacticalTcg/engine/duelRules"
import { validTacticalCheckpoint } from "@/game/tacticalTcg/progression/checkpoint"

function unit(
  id: string,
  side: "player" | "enemy",
  column: 0 | 1 | 2 | 3 = 0,
): BattleUnit {
  const c = DUEL_CARD_MAP[id]
  return {
    id,
    cardId: id,
    name: c.name,
    art: "",
    role: c.tacticalRole,
    traits: [c.school],
    hp: c.health,
    maxHp: c.health,
    attack: c.attack,
    ultimatePower: Math.max(3, c.attack * 2),
    instanceId: `${side}:${id}`,
    side,
    cell: { row: 0, column },
    star: 1,
    energy: 0,
    shield: 0,
    defeated: false,
    spellShield: c.duelTraits?.includes("spellshield"),
  }
}
function fixture() {
  const s = createTacticalBattle({
    battleId: "duel-v3",
    manual: true,
    duel: true,
    deck: TACTICAL_STARTER,
    seed: 5,
  })
  s.round = 2
  s.units = [unit("com-tam", "player"), unit("pho-bo", "enemy")]
  for (const side of ["player", "enemy"] as const) {
    s.cardGame!.sides[side].mana = s.cardGame!.sides[side].maxMana = 10
    s.cardGame!.sides[side].hand = []
  }
  return s
}
const attack = (s: TacticalBattleState, targetId: string) =>
  reduceTacticalBattle(s, {
    id: `attack:${s.processedActionIds.length}`,
    type: "basic",
    unitId: s.units[0].instanceId,
    targetId,
  })
describe("Duel-v3 small numbers, guardians and meaningful card identities", () => {
  it("keeps every immutable ID while mapping139 own splash portraits to unique names and small stats", () => {
    expect(DUEL_CARDS.map((c) => c.id)).toEqual(TACTICAL_CARDS.map((c) => c.id))
    const units = DUEL_CARDS.filter((c) => c.kind === "unit")
    expect(units).toHaveLength(139)
    expect(new Set(units.map((c) => c.name)).size).toBe(139)
    for (const c of units) {
      expect(c.health).toBeGreaterThan(0)
      expect(c.health).toBeLessThanOrEqual(15)
      expect(c.attack).toBeLessThanOrEqual(10)
      expect(c.legacyName).toBeTruthy()
    }
    expect(DUEL_CARD_MAP["pho-bo"].name).toContain("Long")
    expect(DUEL_CARD_MAP["caravan-porter"].name).toContain("Hổ")
  })
  it("deals the same3damage to commander or unit, allowing commander attacks through non-guard units", () => {
    const s = fixture()
    s.units[0].attack = 3
    s.units[0].cardId = "pho-bo"
    expect(directedTargets(s, s.units[0])).toContain("hero:enemy")
    expect(attack(s, "hero:enemy").commanders.enemy.hp).toBe(27)
    const n = attack(s, s.units[1].instanceId)
    expect(n.units[1].hp).toBe(0)
    expect(n.units[0].hp).toBe(s.units[0].hp - s.units[1].attack)
  })
  it("every living Guardian gates units and commander, independent of saved row", () => {
    const s = fixture(),
      guard = unit("banh-mi", "enemy", 1)
    guard.cell.row = 1
    s.units.push(guard)
    expect(directedTargets(s, s.units[0])).toEqual([guard.instanceId])
    expect(attack(s, "hero:enemy")).toBe(s)
    expect(attack(s, s.units[1].instanceId)).toBe(s)
    guard.defeated = true
    guard.hp = 0
    expect(directedTargets(s, s.units[0])).toContain("hero:enemy")
  })
  it("first strike prevents counter only on a kill; ordinary exchange can cause a double defeat", () => {
    const s = fixture()
    s.units[0] = unit("caravan-scout", "player")
    s.units[0].attack = 3
    s.units[0].hp = 1
    const n = attack(s, s.units[1].instanceId)
    expect(n.units[0].hp).toBe(1)
    expect(n.units[1].defeated).toBe(true)
    s.units[0].cardId = "pho-bo"
    s.units[0].attack = 3
    s.units[1].attack = 1
    const both = attack(s, s.units[1].instanceId)
    expect(both.units.every((u) => u.defeated)).toBe(true)
    expect(both.cardGame!.sides.player.discard).toContain("pho-bo")
    expect(both.cardGame!.sides.enemy.discard).toContain("pho-bo")
  })
  it("overwhelm spills only excess after HP and shield, while ultimate has no counter", () => {
    const s = fixture()
    s.units[0].attack = 7
    s.units[1].shield = 2
    const n = attack(s, s.units[1].instanceId)
    expect(n.commanders.enemy.hp).toBe(28)
    s.units[0].energy = 100
    const u = reduceTacticalBattle(s, {
      id: "ult",
      type: "ultimate",
      unitId: s.units[0].instanceId,
      targetId: s.units[1].instanceId,
    })
    expect(u.units[0].hp).toBe(s.units[0].hp)
  })
  it("spell protection consumes once and targeted spells may hit commander past Guardians", () => {
    let s = fixture()
    s.units[1] = unit("caravan-pastry", "enemy")
    s.cardGame!.sides.player.hand = ["spark", "spark"]
    const first = reduceTacticalBattle(s, {
      id: "spell1",
      type: "play-card",
      side: "player",
      handIndex: 0,
      targetId: s.units[1].instanceId,
    })
    expect(first.units[1].hp).toBe(s.units[1].hp)
    expect(first.units[1].spellShield).toBe(false)
    const second = reduceTacticalBattle(first, {
      id: "spell2",
      type: "play-card",
      side: "player",
      handIndex: 0,
      targetId: s.units[1].instanceId,
    })
    expect(second.units[1].hp).toBe(
      s.units[1].hp - DUEL_CARD_MAP.spark.tacticalPower,
    )
    s = fixture()
    s.units[1] = unit("banh-mi", "enemy")
    s.cardGame!.sides.player.hand = ["spark"]
    expect(
      reduceTacticalBattle(s, {
        id: "face",
        type: "play-card",
        side: "player",
        handIndex: 0,
        targetId: "hero:enemy",
      }).commanders.enemy.hp,
    ).toBe(30 - DUEL_CARD_MAP.spark.tacticalPower)
  })
  it("choice spells use the chosen effect with one card and mana cost", () => {
    const s = fixture()
    s.cardGame!.sides.player.hand = ["v4-crossroads-tea"]
    s.commanders.player.hp = 20
    const heal = reduceTacticalBattle(s, {
      id: "tea-heal",
      type: "play-card",
      side: "player",
      handIndex: 0,
      choiceIndex: 0,
    })
    expect(heal.commanders.player.hp).toBe(24)
    expect(heal.cardGame!.sides.player.hand).toHaveLength(0)
    const draw = reduceTacticalBattle(s, {
      id: "tea-draw",
      type: "play-card",
      side: "player",
      handIndex: 0,
      choiceIndex: 1,
    })
    expect(draw.commanders.player.hp).toBe(20)
    expect(draw.cardGame!.sides.player.hand).toHaveLength(1)
    expect(draw.cardGame!.sides.player.mana).toBe(8)
    expect(validTacticalCheckpoint(draw)).toBe(true)
  })
  it("additively upgrades old checkpoints once, preserving missing-health ratio, resources and pending trap IDs", () => {
    let s = createTacticalBattle({
      battleId: "old-save",
      manual: true,
      deck: TACTICAL_STARTER,
      seed: 5,
    })
    s.round = 2
    s.units = [unit("com-tam", "player"), unit("banh-mi", "enemy")]
    s.units[0].attack = 18
    s.units[0].maxHp = 70
    s.units[0].hp = 35
    s.units[0].shield = 20
    s.traps = [
      {
        instanceId: "lid",
        cardId: "trap-lid",
        trapId: "bamboo-guard",
        side: "player",
        column: 0,
        armed: true,
        triggeredRound: null,
      },
    ]
    s.units = s.units.filter((u) => u.side === "enemy")
    s.cardGame!.directed!.turn = "enemy"
    s = reduceTacticalBattle(s, {
      id: "old-intent",
      type: "basic",
      unitId: s.units[0].instanceId,
      targetId: "hero:player",
    })
    const pending = s.cardGame!.directed!.pending!.id,
      hand = [...s.cardGame!.sides.player.hand],
      ledger = [...s.processedActionIds]
    const upgraded = upgradeDuelBattle(s)
    expect(upgraded.cardGame!.directed!.pending!.id).toBe(pending)
    expect(upgraded.cardGame!.sides.player.hand).toEqual(hand)
    expect(upgraded.processedActionIds).toEqual(ledger)
    expect(validTacticalCheckpoint(upgraded)).toBe(true)
    expect(upgradeDuelBattle(upgraded)).toBe(upgraded)
    const resolved = reduceTacticalBattle(upgraded, {
      id: "hold-old",
      type: "react",
      reactionId: pending,
      activate: true,
    })
    expect(resolved.commanders.player.hp).toBe(30)
    expect(resolved.traps[0].armed).toBe(false)
    expect(validTacticalCheckpoint(resolved)).toBe(true)
  })
  it("regeneration and burn tick once at end of round; state and action IDs remain valid", () => {
    const s = fixture()
    s.units[0] = unit("caravan-herbalist", "player")
    s.units[0].hp = 2
    s.units[0].burn = { damage: 1, remaining: 2 }
    s.cardGame!.directed!.turn = "enemy"
    for (const u of s.units) s.cardGame!.attacks[u.instanceId] = s.round
    const n = reduceTacticalBattle(s, { id: "next", type: "enemy-step" })
    expect(n.round).toBe(3)
    expect(n.units[0].hp).toBe(2)
    expect(n.units[0].burn?.remaining).toBe(1)
    expect(validTacticalCheckpoint(n)).toBe(true)
    expect(reduceTacticalBattle(n, { id: "next", type: "enemy-step" })).toBe(n)
  })
})
