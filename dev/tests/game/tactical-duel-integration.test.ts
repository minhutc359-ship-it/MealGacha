import { describe, expect, it } from "vitest"
import {
  createTacticalBattle,
  reduceTacticalBattle,
  type BattleUnit,
} from "@/game/tacticalTcg/engine"
import { DUEL_CARD_MAP } from "@/game/tacticalTcg/duelCards"
import { TACTICAL_STARTER } from "@/game/tacticalTcg/cards"
import { validTacticalCheckpoint } from "@/game/tacticalTcg/progression/checkpoint"
import { duelAttackPreview } from "@/game/tacticalTcg/presentation/duelPreview"
import { tacticalTransition } from "@/game/tacticalTcg/presentation/transitions"
import { duelSounds } from "@/game/tacticalTcg/presentation/duelAudio"
function unit(id: string, side: "player" | "enemy"): BattleUnit {
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
    cell: { row: 0, column: 0 },
    star: 1,
    energy: 0,
    shield: 0,
    defeated: false,
  }
}
function fixture(trap?: string) {
  const s = createTacticalBattle({
    battleId: "integration",
    manual: true,
    duel: true,
    deck: TACTICAL_STARTER,
    seed: 5,
  })
  s.round = 2
  s.units = [unit("com-tam", "player"), unit("com-tam", "enemy")]
  s.units[1].hp = s.units[1].maxHp = 10
  s.cardGame!.directed!.turn = "enemy"
  for (const side of ["player", "enemy"] as const) {
    s.cardGame!.sides[side].hand = []
    s.cardGame!.sides[side].mana = s.cardGame!.sides[side].maxMana = 10
  }
  if (trap)
    s.traps = [
      {
        instanceId: "test-trap",
        cardId: trap,
        trapId: "bamboo-guard",
        side: "player",
        column: 0,
        armed: true,
        triggeredRound: null,
      },
    ]
  return s
}
function hit(
  s: ReturnType<typeof fixture>,
  targetId = s.units[0]?.instanceId ?? "hero:player",
) {
  return reduceTacticalBattle(s, {
    id: "enemy-hit",
    type: "basic",
    unitId: s.units.find((u) => u.side === "enemy")!.instanceId,
    targetId,
  })
}
function react(s: ReturnType<typeof fixture>) {
  expect(s.cardGame!.directed!.pending).toBeTruthy()
  expect(validTacticalCheckpoint(s)).toBe(true)
  const n = reduceTacticalBattle(s, {
    id: "activate",
    type: "react",
    reactionId: s.cardGame!.directed!.pending!.id,
    activate: true,
  })
  expect(validTacticalCheckpoint(n)).toBe(true)
  expect(n.traps[0].armed).toBe(false)
  expect(
    reduceTacticalBattle(n, {
      id: "activate",
      type: "react",
      reactionId: "anything",
      activate: true,
    }),
  ).toBe(n)
  return n
}
describe("Duel production integration", () => {
  it("lid and mirror consume the attack, with mirror capped at3 same-scale damage", () => {
    for (const id of ["trap-lid", "trap-mirror"]) {
      const s = fixture(id)
      s.units = s.units.filter((u) => u.side === "enemy")
      const n = react(hit(s, "hero:player"))
      expect(n.commanders.player.hp).toBe(30)
      expect(n.commanders.enemy.hp).toBe(id === "trap-mirror" ? 27 : 30)
      expect(n.cardGame!.attacks[s.units[0].instanceId]).toBe(2)
    }
  })
  it("embers deal2 and burn1×2; ward absorbs the announced hit with shield capped at3", () => {
    let s = fixture("trap-embers"),
      n = react(hit(s))
    expect(n.units[1].burn).toEqual({ damage: 1, remaining: 2 })
    expect(n.units[1].hp).toBe(5)
    s = fixture("trap-ward")
    s.units[0].shield = 2
    n = react(hit(s))
    expect(n.units[0].hp).toBe(7)
    expect(n.units[0].shield).toBe(0)
  })
  it("root and pantry react after a paid summon, without refunding the enemy card", () => {
    for (const id of ["trap-root", "trap-pantry"]) {
      const s = fixture(id)
      s.units = s.units.filter((u) => u.side === "player")
      s.commanders.player.hp = 20
      s.cardGame!.sides.enemy.hand = ["com-tam"]
      const n = react(
        reduceTacticalBattle(s, {
          id: "call",
          type: "play-card",
          side: "enemy",
          handIndex: 0,
          cell: { row: 0, column: 0 },
        }),
      )
      expect(n.cardGame!.sides.enemy.mana).toBe(6)
      expect(n.cardGame!.sides.enemy.hand).toHaveLength(0)
      if (id === "trap-root") {
        expect(n.units[1].hp).toBe(5)
        expect(n.units[1].stunnedUntil).toBe(3)
      } else {
        expect(n.commanders.player.hp).toBe(23)
        expect(n.cardGame!.sides.player.hand).toHaveLength(2)
      }
    }
  })
  it("seal cancels a choice spell while spending its card and mana", () => {
    const s = fixture("trap-seal")
    s.commanders.enemy.hp = 20
    s.cardGame!.sides.enemy.hand = ["v4-crossroads-tea"]
    const n = react(
      reduceTacticalBattle(s, {
        id: "tea",
        type: "play-card",
        side: "enemy",
        handIndex: 0,
        choiceIndex: 0,
      }),
    )
    expect(n.commanders.enemy.hp).toBe(20)
    expect(n.cardGame!.sides.enemy.hand).toHaveLength(0)
    expect(n.cardGame!.sides.enemy.mana).toBe(8)
  })
  it("recall restores the actual casualty with2HP and no immediate attack", () => {
    const s = fixture("trap-recall")
    s.units[0] = unit("caravan-letter", "player")
    s.units[0].hp = 1
    const n = react(hit(s))
    expect(n.units[0].defeated).toBe(false)
    expect(n.units[0].hp).toBe(2)
    expect(n.units[0].summonedRound).toBe(2)
    expect(n.cardGame!.sides.player.hand).toHaveLength(0)
  })
  it("boss victory settles on defeating the named boss, preserving the commander alternative", () => {
    const s = createTacticalBattle({
      battleId: "boss-goal",
      manual: true,
      duel: true,
      deck: TACTICAL_STARTER,
      boss: { definitionId: "boss-kiln-phoenix", title: "Phượng Lửa" },
    })
    s.round = 2
    s.units.push(unit("com-tam", "player"))
    s.units[0].hp = 1
    const n = reduceTacticalBattle(s, {
      id: "boss-last-hit",
      type: "basic",
      unitId: s.units[1].instanceId,
      targetId: s.units[0].instanceId,
    })
    expect(n.winner).toBe("player")
    expect(n.commanders.enemy.hp).toBeGreaterThan(0)
    expect(n.reward?.tinhVi).toBe(60)
    expect(validTacticalCheckpoint(n)).toBe(true)
  })
  it("the visible damage preview matches actual HP/counter damage and timed sound contact", () => {
    const s = fixture()
    s.cardGame!.directed!.turn = "player"
    const before = JSON.stringify(s),
      preview = duelAttackPreview(s, s.units[0], s.units[1].instanceId)!
    const n = reduceTacticalBattle(s, {
      id: "preview-hit",
      type: "basic",
      unitId: s.units[0].instanceId,
      targetId: s.units[1].instanceId,
    })
    expect(JSON.stringify(s)).toBe(before)
    expect(preview.hp).toBe(s.units[1].hp - n.units[1].hp)
    expect(preview.counter).toBe(s.units[0].hp - n.units[0].hp)
    const transition = tacticalTransition(s, n)!
    const sounds = duelSounds(transition)
    expect(sounds).toContainEqual({ cue: "impact", delay: transition.contact })
    expect(new Set(sounds.map((v) => v.cue)).size).toBe(sounds.length)
  })
  it("bot actions are invariant to unseen player hand identities at all3levels", () => {
    for (const level of ["normal", "hard", "extreme"] as const) {
      const s = fixture()
      s.cardGame!.botLevel = level
      s.cardGame!.sides.enemy.hand = ["spark", "banh-mi"]
      s.cardGame!.sides.player.hand = ["herb", "spark"]
      const other = structuredClone(s)
      other.cardGame!.sides.player.hand = ["trap-seal", "chef-bach"]
      const a = reduceTacticalBattle(s, {
          id: "bot-action",
          type: "enemy-step",
        }),
        b = reduceTacticalBattle(other, {
          id: "bot-action",
          type: "enemy-step",
        })
      expect(a.cardGame!.directed!.event).toEqual(b.cardGame!.directed!.event)
      expect(a.commanders).toEqual(b.commanders)
      expect(a.units).toEqual(b.units)
    }
  })
})
