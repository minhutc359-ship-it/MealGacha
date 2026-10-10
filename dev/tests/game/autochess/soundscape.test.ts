import { describe, expect, it } from "vitest"
import { createAutoRun } from "@/game/autochess/economy"
import { createCombat } from "@/game/autochess/combat"
import { autoCue, AutoSoundscape } from "@/game/autochess/soundscape"
import type { CombatEvent } from "@/game/autochess/types"
const actors = createCombat(createAutoRun("survival", 42, "2026-10-09", "sfx")).actors
const event = (id: number, kind: CombatEvent["kind"], amount = 10): CombatEvent => ({ id, kind, amount, tick: id, source: actors[0].uid, target: actors[1].uid, cell: 0, school: "ember" })
describe("battle sound cadence", () => {
  it("prioritizes boss/defeat over ordinary blows and consumes skipped events", () => {
    const s = new AutoSoundscape()
    const burst = [event(1, "attack"), event(2, "hit"), event(3, "death"), event(4, "phase")]
    expect(s.collect(burst, actors, 1000).map(c => c.cue)).toEqual(["auto-boss", "auto-fall"])
    expect(s.collect(burst, actors, 2000)).toEqual([])
    expect(s.collect([event(5, "hit")], actors, 1020)).toEqual([])
    expect(s.collect([event(5, "hit")], actors, 2000)).toEqual([])
  })
  it("limits hit cadence in wall time at x3 and does not replay events on resume", () => {
    const s = new AutoSoundscape(10)
    expect(s.collect([event(10, "hit")], actors, 1000)).toEqual([])
    expect(s.collect([event(11, "hit")], actors, 1000)).toHaveLength(1)
    expect(s.collect([event(12, "hit")], actors, 1100)).toHaveLength(0)
    expect(s.collect([event(13, "hit")], actors, 1130)).toHaveLength(1)
  })
  it("distinguishes wind-up, actual elemental cast and ranged shots with bounded stereo", () => {
    expect(autoCue(event(1, "cast", 0), actors)?.cue).toBe("auto-channel")
    expect(autoCue(event(2, "cast"), actors)?.cue).toBe("fire")
    const ranged = structuredClone(actors); ranged[0].range = 3
    expect(autoCue(event(3, "attack"), ranged)?.cue).toBe("auto-shot")
    for (let cell = 0; cell < 36; cell++) expect(Math.abs(autoCue({ ...event(4, "hit"), cell }, actors)!.pan)).toBeLessThanOrEqual(.7)
  })
})
