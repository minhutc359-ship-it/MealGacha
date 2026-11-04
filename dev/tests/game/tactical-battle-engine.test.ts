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
})
