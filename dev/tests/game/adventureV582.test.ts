import { describe, expect, it } from "vitest"
import { RPG_MAPS } from "@/game/adventureRpg/content"
import { RPG_STORY_ARCS } from "@/game/adventureRpg/story"
import { ultimateIdentity } from "@/game/adventureRpg/ultimateArt"
import { ULTIMATE_MOVES } from "@/game/adventureRpg/awakening"
import { SPIRIT_IDS } from "@/game/adventureRpg/spiritArt"
import { newRpgSave, reduceRpg, advanceRpgBattle } from "@/game/adventureRpg/engine"
import { newGame } from "@/game/progression"
import { parseGame } from "@/game/storage"

describe("Adventure illustrated spells and wards", () => {
  it("records fully absorbed damage separately and only marks the hit that breaks a shield", () => {
    const game = newGame(), save = newRpgSave(game)
    const battle = reduceRpg(save, {type:"start",stageId:"lantern-1"}, game).save.run!.battle
    for (const actor of battle.actors) actor.nextAttack = actor.nextSkill = actor.nextSupport = 1000
    const attacker = battle.actors.find(a=>a.side==="ally")!, target = battle.actors.find(a=>a.side==="enemy")!
    attacker.nextAttack = 0
    target.shield = target.maxHp
    const protectedBattle = advanceRpgBattle(battle, 1)
    const stopped = protectedBattle.events.find(e=>e.source===attacker.uid && e.kind==="hit")!
    expect(stopped.value).toBe(0)
    expect(stopped.absorbed![target.uid]).toBeGreaterThan(0)
    expect(stopped.shieldBroken).toBeUndefined()
    target.shield = 1
    const brokenBattle = advanceRpgBattle(battle, 1)
    const hit = brokenBattle.events.find(e=>e.source===attacker.uid && e.kind==="hit")!
    expect(hit.absorbed).toEqual({[target.uid]:1})
    expect(hit.shieldBroken).toEqual([target.uid])
    expect(brokenBattle.actors.find(a=>a.uid===target.uid)!.shield).toBe(0)
    const fullSave = {...game, adventureRpg: {...save, run: {kind:"campaign" as const, stageId:"lantern-1", dungeon:null, battle:brokenBattle}}}
    expect(parseGame(fullSave)?.adventureRpg?.run?.battle.events).toEqual(brokenBattle.events)
  })
  it("maps every spirit to its own portrait identity and one of twenty spell silhouettes", () => {
    const identities = SPIRIT_IDS.map(ultimateIdentity)
    expect(identities).toHaveLength(139)
    expect(new Set(identities.map(i=>i.id)).size).toBe(139)
    expect(new Set(ULTIMATE_MOVES.map(move=>move[2])).size).toBe(20)
    expect(new Set(identities.map(i=>i.pattern)).size).toBe(19)
  })
})

describe("Eight connected chapter arcs", () => {
  it("provides turning points, confrontations and two consequences for every existing map ID", () => {
    expect(Object.keys(RPG_STORY_ARCS)).toEqual(RPG_MAPS.map(m=>m.id))
    for (const arc of Object.values(RPG_STORY_ARCS)) {
      expect(arc.hook.length).toBeGreaterThan(70)
      for (const beat of [arc.opening,arc.turningPoint,arc.finale,arc.aftermath]) {
        expect(beat).toHaveLength(2)
        expect(beat.every(l=>l.text.length>65)).toBe(true)
      }
      expect(arc.consequences).toHaveLength(2)
      expect(arc.consequences[0]).not.toEqual(arc.consequences[1])
    }
  })
})
