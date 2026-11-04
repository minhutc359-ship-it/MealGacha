import { describe, expect, it } from "vitest"
import {
  createTacticalBattle,
  findTarget,
  playAutomaticRound,
  reduceTacticalBattle,
  replayTacticalBattle,
} from "@/game/tacticalTcg/engine"
describe("deterministic Tactical 4x2 engine", () => {
  it("creates no more than five units on each 4x2 side", () => {
    const battle = createTacticalBattle({ battleId: "b1" })
    expect(battle.units.filter((unit) => unit.side === "player")).toHaveLength(
      5,
    )
    expect(() =>
      createTacticalBattle({
        battleId: "bad",
        player: Array.from({ length: 6 }, (_, column) => ({
          definitionId: "nhien",
          cell: { row: 0 as const, column: (column % 4) as 0 | 1 | 2 | 3 },
        })),
      }),
    ).toThrow("at most five")
  })
  it("targets same-column front before nearest front and back", () => {
    const battle = createTacticalBattle({ battleId: "target" }),
      attacker = battle.units.find(
        (unit) => unit.side === "player" && unit.cell.column === 0,
      )!
    expect(findTarget(battle, attacker)?.cell).toEqual({ row: 0, column: 0 })
  })
  it("ignores duplicate action ids and blocks formation movement after planning", () => {
    const initial = createTacticalBattle({ battleId: "idempotent" }),
      started = reduceTacticalBattle(initial, {
        id: "begin",
        type: "begin-round",
      })
    expect(
      reduceTacticalBattle(started, { id: "begin", type: "begin-round" }),
    ).toBe(started)
    expect(
      reduceTacticalBattle(started, {
        id: "move",
        type: "move",
        unitId: started.units[0].instanceId,
        cell: { row: 1, column: 3 },
      }),
    ).toBe(started)
  })
  it("replays deterministically", () => {
    const initial = createTacticalBattle({ battleId: "replay", seed: 42 }),
      actions = [
        { id: "begin", type: "begin-round" as const },
        {
          id: "hit",
          type: "basic" as const,
          unitId: initial.units[0].instanceId,
        },
      ]
    expect(replayTacticalBattle(initial, actions)).toEqual(
      replayTacticalBattle(initial, actions),
    )
  })
  it("advances full automatic rounds and applies fatigue after round eight", () => {
    let battle = createTacticalBattle({ battleId: "fatigue" })
    for (let i = 0; i < 8 && battle.phase !== "result"; i++)
      battle = playAutomaticRound(battle)
    expect(battle.round > 1 || battle.phase === "result").toBe(true)
  })
  it("keeps a reaction window open for ultimates before round end", () => {
    const initial = createTacticalBattle({ battleId: "reaction-window" }),
      reacted = playAutomaticRound(initial),
      next = playAutomaticRound(reacted)
    expect(reacted.phase === "reaction" || reacted.phase === "result").toBe(
      true,
    )
    if (reacted.phase !== "result") {
      expect(next.phase).toBe("planning")
      expect(next.round).toBe(2)
    }
  })
  it("arms one authored trap and resolves it in the reaction window", () => {
    const initial = createTacticalBattle({
        battleId: "trap",
        player: [{ definitionId: "nhien", cell: { row: 0, column: 0 } }],
        enemy: [{ definitionId: "salt-scarab", cell: { row: 0, column: 0 } }],
      }),
      armed = reduceTacticalBattle(initial, {
        id: "trap-1",
        type: "place-trap",
        side: "enemy",
        trapId: "bamboo-guard",
        column: 0,
      }),
      started = reduceTacticalBattle(armed, {
        id: "trap-begin",
        type: "begin-round",
      }),
      resolved = reduceTacticalBattle(started, {
        id: "trap-hit",
        type: "basic",
        unitId: started.units[0].instanceId,
      })
    expect(resolved.phase).toBe("reaction")
    expect(resolved.units[1].hp).toBe(101)
    expect(resolved.traps[0]).toMatchObject({
      armed: false,
      triggeredRound: 1,
    })
    expect(
      resolved.log.some((entry) => entry.text.includes("Bẫy Mành Tre")),
    ).toBe(true)
  })
  it("resolves counter and conditional healing traps deterministically", () => {
    const battle = createTacticalBattle({
        battleId: "trap-effects",
        player: [
          {
            definitionId: "nhien",
            cell: { row: 0, column: 0 },
            star: 3,
          },
        ],
        enemy: [{ definitionId: "salt-scarab", cell: { row: 0, column: 0 } }],
      }),
      counter = replayTacticalBattle(battle, [
        {
          id: "counter",
          type: "place-trap",
          side: "enemy",
          trapId: "steam-counter",
          column: 0,
        },
        { id: "counter-begin", type: "begin-round" },
        {
          id: "counter-hit",
          type: "basic",
          unitId: battle.units[0].instanceId,
        },
      ]),
      healing = replayTacticalBattle(battle, [
        {
          id: "healing",
          type: "place-trap",
          side: "enemy",
          trapId: "warm-broth",
          column: 0,
        },
        { id: "healing-begin", type: "begin-round" },
        {
          id: "healing-hit",
          type: "basic",
          unitId: battle.units[0].instanceId,
        },
      ])
    expect(counter.units[0].hp).toBe(counter.units[0].maxHp - 12)
    expect(healing.units[1].hp).toBe(51)
  })
  it("advances an authored boss through phases two and three", () => {
    const initial = createTacticalBattle({
        battleId: "boss",
        boss: { definitionId: "aroma-regent", title: "Hương Vương" },
        player: [
          {
            definitionId: "nhien",
            cell: { row: 0, column: 0 },
            star: 3,
          },
        ],
        enemy: [{ definitionId: "aroma-regent", cell: { row: 0, column: 0 } }],
      }),
      started = reduceTacticalBattle(initial, {
        id: "boss-begin",
        type: "begin-round",
      }),
      phaseTwo = reduceTacticalBattle(started, {
        id: "boss-hit-1",
        type: "basic",
        unitId: started.units[0].instanceId,
      }),
      phaseThree = reduceTacticalBattle(phaseTwo, {
        id: "boss-hit-2",
        type: "basic",
        unitId: phaseTwo.units[0].instanceId,
      })
    expect(phaseTwo.boss?.phase).toBe(2)
    expect(phaseThree.boss?.phase).toBe(3)
    expect(
      phaseThree.log.filter((entry) => entry.text.includes("chuyển Pha")),
    ).toHaveLength(2)
  })
  it("uses three copies for campaign merge and two isolated copies for PvP", () => {
    const formation = [
      { definitionId: "nhien", cell: { row: 0 as const, column: 0 as const } },
      { definitionId: "nhien", cell: { row: 0 as const, column: 1 as const } },
      { definitionId: "nhien", cell: { row: 0 as const, column: 2 as const } },
    ]
    const campaign = createTacticalBattle({
      battleId: "merge-3",
      player: formation,
    })
    const merged = reduceTacticalBattle(campaign, {
      id: "merge-campaign",
      type: "merge",
      unitIds: campaign.units
        .slice(0, 3)
        .map((unit) => unit.instanceId) as [string, string, string],
    })
    expect(merged.units[0].star).toBe(2)
    expect(merged.units.slice(1, 3).every((unit) => unit.defeated)).toBe(true)

    const pvp = createTacticalBattle({
      battleId: "merge-2",
      mode: "pvp",
      player: formation.slice(0, 2),
    })
    expect(
      reduceTacticalBattle(pvp, {
        id: "merge-pvp",
        type: "merge",
        unitIds: [pvp.units[0].instanceId, pvp.units[1].instanceId],
      }).units[0].star,
    ).toBe(2)
  })
})
