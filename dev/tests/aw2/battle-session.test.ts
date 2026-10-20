import { describe, expect, it } from "vitest"
import {
  createBattlePreviewSession,
  reduceBattlePreviewSession,
} from "../../aw2/battleSession"

describe("BATTLE-01 development battle session", () => {
  it("keeps each combat update and presentation coherent through a complete battle", () => {
    let session = createBattlePreviewSession(10)
    const initial = session
    const original = JSON.stringify(initial)
    let previousSerial = 0
    for (
      let tick = 0;
      tick < 240 && session.battle.status === "active";
      tick++
    ) {
      const before = session
      session = reduceBattlePreviewSession(session, { type: "advance" })
      expect(session.battle.tick).toBe(before.battle.tick + 1)
      const lastSerial = session.battle.events.at(-1)?.serial ?? 0
      expect(session.presentation.lastSerial).toBe(lastSerial)
      expect(lastSerial).toBeGreaterThanOrEqual(previousSerial)
      previousSerial = lastSerial
    }
    expect(initial.battle.tick).toBe(0)
    expect(JSON.stringify(initial)).toBe(original)
    expect(session.battle.status).not.toBe("active")
    expect(session.presentation.terminal?.text).toBe(session.battle.status)
    expect(session.presentation.projectiles).toEqual({})
    expect(
      session.battle.events.filter((event) => event.kind === "battle-end"),
    ).toHaveLength(1)
    expect(reduceBattlePreviewSession(session, { type: "advance" })).toBe(
      session,
    )
  })

  it("queues manual and automatic commands without mutating or dropping prior state", () => {
    const initial = createBattlePreviewSession(5)
    const before = JSON.stringify(initial)
    const command = { type: "ultimate", actorId: "player-aw2-lua" } as const
    const cast = reduceBattlePreviewSession(initial, command)
    expect(JSON.stringify(initial)).toBe(before)
    expect(reduceBattlePreviewSession(initial, command)).toEqual(cast)
    expect(
      cast.battle.actors.find((actor) => actor.id === command.actorId)?.energy,
    ).toBe(0)
    const rejected = reduceBattlePreviewSession(cast, command)
    expect(rejected.battle).toBe(cast.battle)
    expect(rejected.presentation).toBe(cast.presentation)
    expect(rejected.message).not.toBe(cast.message)
    const advanced = reduceBattlePreviewSession(rejected, {
      type: "advance",
      manual: true,
    })
    expect(advanced.battle.tick).toBe(1)
    expect(advanced.presentation.lastSerial).toBe(
      advanced.battle.events.at(-1)?.serial,
    )
    expect(advanced.level).toBe(5)
  })

  it("resets combat, events and the applied level together without altering the old session", () => {
    const cast = reduceBattlePreviewSession(createBattlePreviewSession(5), {
      type: "ultimate",
      actorId: "player-aw2-than",
    })
    const before = JSON.stringify(cast)
    const reset = reduceBattlePreviewSession(cast, { type: "reset", level: 20 })
    expect(JSON.stringify(cast)).toBe(before)
    expect(reset.level).toBe(20)
    expect(reset.battle.tick).toBe(0)
    expect(reset.presentation.lastSerial).toBe(0)
    expect(reset.presentation.projectiles).toEqual({})
    expect(reset.presentation.terminal).toBeNull()
    expect(reset.battle.events).toEqual([])
    expect(
      reset.battle.actors
        .filter((actor) => actor.side === "player")
        .every((actor) => actor.hp === actor.maxHp && actor.energy === 100),
    ).toBe(true)
  })
})
