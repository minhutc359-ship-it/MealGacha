import { describe, expect, it } from "vitest"
import { newGame } from "@/game/progression"
import { parseGame } from "@/game/storage"
import { RPG_MAPS, RPG_STAGE_IDS, rpgStage } from "@/game/adventureRpg/content"
import { newRpgSave, reduceRpg, stageUnlocked } from "@/game/adventureRpg/engine"
import { nearestRpgOpponent } from "@/game/adventureRpg/autoTarget"
import type { RpgActor, RpgDifficulty, RpgSave } from "@/game/adventureRpg/types"

const game = newGame()
const start = (difficulty: RpgDifficulty) =>
  reduceRpg(newRpgSave(game), { type: "start", stageId: "lantern-1", difficulty }, game).save

describe("Web 5.7 advanced campaign", () => {
  it("adds four complete 6-stage chapters with original bosses without changing existing IDs", () => {
    expect(RPG_MAPS).toHaveLength(8)
    expect(RPG_STAGE_IDS).toHaveLength(48)
    expect(RPG_STAGE_IDS.slice(0, 24)).toEqual([
      ...["lantern","harbor","garden","tide"].flatMap(id =>
        Array.from({length:6}, (_, i) => `${id}-${i+1}`)),
    ])
    for (const map of RPG_MAPS.slice(4)) {
      expect(map.stages).toHaveLength(6)
      expect(rpgStage(`${map.id}-6`)!.boss).toBe(true)
      expect(map.stages.every(stage => stage.before.text.length > 40)).toBe(true)
    }
    expect(new Set(RPG_MAPS.map(map => map.boss)).size).toBe(8)
  })

  it("applies exact x1/x3/x8 to each enemy's health, attack and armor", () => {
    const normal = start("normal").run!.battle.actors.filter(a => a.side === "enemy")
    const hard = start("hard").run!.battle.actors.filter(a => a.side === "enemy")
    const extreme = start("extreme").run!.battle.actors.filter(a => a.side === "enemy")
    expect(hard.map(a=>a.hp)).toEqual(normal.map(a=>a.hp*3))
    expect(extreme.map(a=>a.hp)).toEqual(normal.map(a=>a.hp*8))
    expect(hard.map(a=>a.attack)).toEqual(normal.map(a=>a.attack*3))
    expect(extreme.map(a=>a.attack)).toEqual(normal.map(a=>a.attack*8))
    expect(hard.map(a=>a.armor)).toEqual(normal.map(a=>a.armor*3))
    expect(extreme.map(a=>a.armor)).toEqual(normal.map(a=>a.armor*8))
  })

  it("awards hard stars without overwriting normal clears or old saves", () => {
    const hard = start("hard")
    const battle = hard.run!.battle
    battle.wave = battle.waves.length - 1
    battle.actors = battle.actors.filter(actor=>actor.side === "ally")
    battle.result = "win"
    battle.stars = 2
    const complete = reduceRpg(hard, { type: "settle" }, game).save
    expect(complete.stars["lantern-1"]).toBeUndefined()
    expect(complete.modeStars?.["hard:lantern-1"]).toBe(2)
    expect(stageUnlocked(complete,"lantern-2")).toBe(false)
    expect(stageUnlocked(complete,"lantern-2","hard")).toBe(true)
    expect(parseGame({ ...game, adventureRpg: complete })?.adventureRpg?.modeStars?.["hard:lantern-1"]).toBe(2)
    const old = newRpgSave(game)
    delete old.modeStars
    expect(parseGame({ ...game, adventureRpg: old })?.adventureRpg?.modeStars).toBeUndefined()
  })

  it("retains difficulty and enhanced HP on reloading an extreme encounter", () => {
    const save = start("extreme")
    expect(save.run?.difficulty).toBe("extreme")
    expect(save.run?.battle.difficulty).toBe("extreme")
    expect(parseGame({ ...game, adventureRpg: save })?.adventureRpg?.run?.difficulty).toBe("extreme")
  })

  it("targets the closest living enemy by formation position, not arbitrary slot order", () => {
    const ally = { side: "ally" as const, slot: 0 }
    const enemies = [
      { uid:"back", side:"enemy", slot: 4, hp: 1 },
      { uid:"front", side:"enemy", slot: 0, hp: 1 },
      { uid:"dead", side:"enemy", slot: 1, hp: 0 },
    ] as RpgActor[]
    expect(nearestRpgOpponent(ally,enemies)?.uid).toBe("front")
    expect(nearestRpgOpponent(ally,enemies.filter(a=>a.uid!=="front"))?.uid).toBe("back")
  })
})
