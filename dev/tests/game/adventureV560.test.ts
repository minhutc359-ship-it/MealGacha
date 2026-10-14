import { describe, expect, it } from "vitest"
import {
  ADVENTURE_LOADING_IMAGES,
  ADVENTURE_VILLAGE_PLACES,
  battlePresentationSequence,
  nearbyVillagePlace,
} from "@/game/adventureV560"
import { newGame } from "@/game/progression"
import {
  advanceRpgBattle,
  createRpgBattle,
  newRpgSave,
} from "@/game/adventureRpg/engine"
import { rpgSaveSchema } from "@/game/adventureRpg/schema"
import { existsSync } from "node:fs"

describe("Adventure 5.6 presentation", () => {
  it("uses five optimized loading illustrations and four reachable village locations", () => {
    expect(ADVENTURE_LOADING_IMAGES).toHaveLength(5)
    expect(new Set(ADVENTURE_LOADING_IMAGES).size).toBe(5)
    for (const image of ADVENTURE_LOADING_IMAGES)
      expect(existsSync(`public${image}`), image).toBe(true)
    expect(ADVENTURE_VILLAGE_PLACES.map((place) => place.id)).toEqual([
      "campaign",
      "dungeon",
      "heroes",
      "help",
    ])
    for (const place of ADVENTURE_VILLAGE_PLACES)
      expect(nearbyVillagePlace(place)?.id).toBe(place.id)
  })

  it("orders the opening and wave-clear ceremony without storing UI timers in the save", () => {
    expect(battlePresentationSequence(0).map((beat) => beat.phase)).toEqual([
      "enter",
      "ready",
      "start",
      "fight",
    ])
    expect(battlePresentationSequence(1).map((beat) => beat.phase)).toEqual([
      "wave-clear",
      "wave-enter",
      "start",
      "fight",
    ])
    expect(
      battlePresentationSequence(0, true).reduce(
        (sum, beat) => sum + beat.duration,
        0,
      ),
    ).toBeLessThan(
      battlePresentationSequence(0).reduce(
        (sum, beat) => sum + beat.duration,
        0,
      ),
    )
    expect(rpgSaveSchema.safeParse(newRpgSave(newGame())).success).toBe(true)
  })

  it("halts a batched advance at a wave boundary so the next enemies cannot act behind the overlay", () => {
    const save = newRpgSave(newGame())
    const waves = [
      [
        {
          uid: "wave-1",
          id: "ink-crab",
          name: "Đợt một",
          school: "tide" as const,
          boss: false,
          level: 1,
        },
      ],
      [
        {
          uid: "wave-2",
          id: "char-hound",
          name: "Đợt hai",
          school: "ember" as const,
          boss: false,
          level: 1,
        },
      ],
    ]
    const battle = createRpgBattle(save, waves, "presentation-boundary")
    const enemy = battle.actors.find((actor) => actor.side === "enemy")!
    enemy.hp = 0
    const next = advanceRpgBattle(battle, 8)
    expect(next.wave).toBe(1)
    expect(next.tick).toBe(battle.tick + 1)
    expect(next.actors.find((actor) => actor.uid === "wave-2")?.motionAt).toBe(
      next.tick,
    )
    expect(next.events.at(-1)).toMatchObject({ kind: "wave", value: 2 })
  })
})
