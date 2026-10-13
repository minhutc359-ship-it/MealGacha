import { describe, expect, it } from "vitest"
import { existsSync } from "node:fs"
import {
  ADVENTURE_AREAS,
  ADVENTURE_STARTERS,
  captureChance,
  newAdventure,
  reduceAdventure,
  schoolMultiplier,
  spiritMaxHp,
  type AdventureSave,
  type AdventureEncounter,
  type AdventureAction,
} from "@/game/adventure"
import {
  ADVENTURE_MAPS,
  ADVENTURE_MAP_BY_ID,
  canWalk,
  pathTo,
} from "@/game/adventureWorld"
import {
  ADVENTURE_SKILLS,
  fullPP,
  skillsFor,
  SCHOOL_ORDER,
} from "@/game/adventureSkills"
import { CARD_MAP } from "@/game/catalog"
import { newGame } from "@/game/progression"
import { parseGame } from "@/game/storage"

const start = () =>
  reduceAdventure(undefined, { type: "start", cardId: "pho-bo" }).save
function act(save: AdventureSave, action: AdventureAction) {
  const result = reduceAdventure(save, action)
  expect(result.error).toBeUndefined()
  const game = newGame()
  game.adventure = result.save
  expect(parseGame(JSON.parse(JSON.stringify(game)))?.adventure).toBeDefined()
  return result.save
}
function wild(
  save: AdventureSave,
  overrides: Partial<AdventureEncounter> = {},
) {
  save.encounter = {
    id: "capture-test",
    kind: "wild",
    cardId: "banh-mi",
    level: 4,
    hp: spiritMaxHp("banh-mi", 4),
    maxHp: spiritMaxHp("banh-mi", 4),
    activeUid: save.team[0].uid,
    turn: 1,
    playerGuard: 0,
    enemyGuard: 0,
    enemyWeaken: 0,
    attempts: 0,
    log: [],
    enemyPP: fullPP("banh-mi", 4),
    enemyStatus: null,
    enemyStatusTurns: 0,
    participants: [save.team[0].uid],
    ...overrides,
  }
  return save
}
describe("Adventure world", () => {
  it("has five regions and fifteen accessible furnished houses, with original vector sprites", () => {
    expect(ADVENTURE_AREAS).toHaveLength(5)
    expect(ADVENTURE_MAPS).toHaveLength(20)
    expect(existsSync("dev/archive/legacy-adventure-v490/assets/world.svg")).toBe(true)
    for (const map of ADVENTURE_MAPS) {
      expect(canWalk(map, map.spawn.x, map.spawn.y)).toBe(true)
      expect(map.grid.every((row) => row.length === map.grid[0].length)).toBe(
        true,
      )
      for (const exit of map.exits) {
        const next = ADVENTURE_MAP_BY_ID[exit.to]
        expect(next).toBeDefined()
        expect(canWalk(next, exit.toX, exit.toY)).toBe(true)
      }
      for (const npc of map.npcs) {
        expect(pathTo(map, map.spawn, npc).length).toBeGreaterThan(0)
        for (const spirit of npc.roster ?? [])
          expect(CARD_MAP[spirit.cardId]?.kind).toBe("unit")
      }
      for (let y = 0; y < map.grid.length; y++)
        for (let x = 0; x < map.grid[0].length; x++)
          if (canWalk(map, x, y) && (x !== map.spawn.x || y !== map.spawn.y))
            expect(
              pathTo(map, map.spawn, { x, y }).length,
              `${map.id}: ${x},${y}`,
            ).toBeGreaterThan(0)
    }
  })
  it("preserves old state, starts a companion, blocks walls and records a following position", () => {
    const old = newAdventure(),
      raw = JSON.stringify(old)
    let save = act(old, { type: "start", cardId: "pho-bo" })
    expect(JSON.stringify(old)).toBe(raw)
    expect(save.team[0].level).toBe(5)
    save = act(save, { type: "move", direction: "up" })
    expect(save.follower).toEqual({ x: 2, y: 14 })
    save = { ...save, x: 1, y: 2 }
    const collision = act(save, { type: "move", direction: "left" })
    expect([collision.x, collision.y]).toEqual([1, 2])
    expect(
      reduceAdventure(old, { type: "start", cardId: "spark" }).error,
    ).toBeTruthy()
  })
  it("enters/exits a house, buys from the merchant, and does not allow remote services", () => {
    let save = { ...start(), x: 11, y: 7 }
    save = act(save, { type: "move", direction: "up" })
    expect(save.mapId).toBe("lantern-quarter:shop")
    save = { ...save, x: 5, y: 4, facing: "up" }
    save = act(save, { type: "interact" })
    const coins = save.coins
    save = act(save, { type: "buy", item: "seal" })
    expect(save.coins).toBe(coins - 18)
    expect(save.aromaSeals).toBe(7)
    save = { ...save, x: 5, y: 7 }
    save = act(save, { type: "move", direction: "down" })
    expect(save.mapId).toBe("lantern-quarter")
    expect([save.x, save.y]).toEqual([11, 7])
    expect(
      reduceAdventure(save, { type: "buy", item: "seal" }).error,
    ).toBeTruthy()
    expect(reduceAdventure(save, { type: "heal" }).error).toBeTruthy()
  })
  it("grants finds and memory quest rewards once, and gates region travel", () => {
    let save = { ...start(), x: 17, y: 12 }
    save = act(save, { type: "move", direction: "right" })
    expect(save.claimedFinds).toContain("lantern-basket")
    const seals = save.aromaSeals
    save = act(save, { type: "move", direction: "left" })
    save = act(save, { type: "move", direction: "right" })
    expect(save.aromaSeals).toBe(seals)
    save = { ...save, x: 21, y: 14 }
    save = act(save, { type: "move", direction: "right" })
    expect(save.areaId).toBe("lantern-quarter")
    save = {
      ...save,
      mapId: "lantern-quarter:home",
      x: 5,
      y: 4,
      facing: "up",
      follower: null,
      discovered: ["pho-bo", "banh-mi", "xoi"],
    }
    save = act(save, { type: "interact" })
    const coins = save.coins
    expect(save.completedQuests).toContain("memory:lantern-quarter")
    save = act(save, { type: "interact" })
    expect(save.coins).toBe(coins)
    expect(
      reduceAdventure(save, { type: "travel", areaId: "moon-table" }).error,
    ).toBeTruthy()
  })
  it("makes every advantage reciprocal with resistance and leaves unrelated types neutral", () => {
    for (const school of SCHOOL_ORDER)
      expect(schoolMultiplier(school, school)).toBe(1)
    for (let i = 0; i < 5; i++) {
      const a = SCHOOL_ORDER[i],
        d = SCHOOL_ORDER[(i + 1) % 5]
      expect(schoolMultiplier(a, d)).toBe(1.5)
      expect(schoolMultiplier(d, a)).toBe(0.67)
      expect(schoolMultiplier(a, SCHOOL_ORDER[(i + 2) % 5])).toBe(1)
    }
    expect(ADVENTURE_SKILLS).toHaveLength(16)
  })
  it("consumes PP, rejects unlearned moves and empty PP, and restores all at the clinic", () => {
    let save = wild(start())
    const skill = skillsFor(save.team[0].cardId, 5).find((move) => move.school)!
    const before = save.team[0].pp![skill.id]
    save = act(save, { type: "battle", move: "skill", skillId: skill.id })
    expect(save.team[0].pp![skill.id]).toBe(before - 1)
    expect(
      reduceAdventure(save, {
        type: "battle",
        move: "skill",
        skillId: "ember-feast",
      }).error,
    ).toBeTruthy()
    save.team[0].pp![skill.id] = 0
    expect(
      reduceAdventure(save, {
        type: "battle",
        move: "skill",
        skillId: skill.id,
      }).error,
    ).toBeTruthy()
    save = {
      ...save,
      encounter: null,
      mapId: "lantern-quarter:clinic",
      x: 5,
      y: 4,
      facing: "up",
    }
    save.team[0].status = "burn"
    save.team[0].statusTurns = 3
    save = act(save, { type: "interact" })
    expect(save.team[0].pp).toEqual(fullPP("pho-bo", save.team[0].level))
    expect(save.team[0].status).toBeNull()
    expect(save.team[0].hp).toBe(spiritMaxHp("pho-bo", save.team[0].level))
  })
  it("applies status attrition, processes fast enemy knockouts, and rescues the exhausted team", () => {
    let save = wild(start(), {
      level: 25,
      hp: spiritMaxHp("banh-mi", 25),
      maxHp: spiritMaxHp("banh-mi", 25),
      enemyPP: fullPP("banh-mi", 25),
    })
    save.team[0].hp = 1
    save = act(save, { type: "battle", move: "skill" })
    expect(save.encounter).toBeNull()
    expect(save.mapId).toBe("lantern-quarter:clinic")
    expect(save.team[0].hp).toBe(spiritMaxHp("pho-bo", 5))
    save = wild(start(), { enemyStatus: "burn", enemyStatusTurns: 3 })
    const before = save.encounter!.hp
    save = act(save, { type: "battle", move: "guard" })
    expect(save.encounter!.hp).toBeLessThan(before)
    expect(save.encounter!.enemyStatusTurns).toBe(2)
  })
  it("captures to a six-member team then the reserve without charging a full inventory", () => {
    let save = wild(start(), {
      hp: 1,
      enemyStatus: "drowsy",
      enemyStatusTurns: 3,
    })
    expect(captureChance(save.encounter!)).toBeGreaterThan(0.9)
    for (let i = 1; i < 6; i++)
      save.team.push({
        ...save.team[0],
        uid: `member-${i}`,
        pp: { ...save.team[0].pp },
      })
    for (let attempt = 0; attempt < 8 && save.encounter; attempt++)
      save = act(save, { type: "battle", move: "befriend" })
    expect(save.reserve).toHaveLength(1)
    expect(save.team).toHaveLength(6)
    save = wild(save)
    save.reserve = Array.from({ length: 60 }, (_, i) => ({
      ...save.team[0],
      uid: `reserve-${i}`,
      pp: { ...save.team[0].pp },
    }))
    const seals = save.aromaSeals,
      result = reduceAdventure(save, { type: "battle", move: "befriend" })
    expect(result.error).toBeTruthy()
    expect(result.save.aromaSeals).toBe(seals)
  })
  it("uses battle items as a turn, prevents free healing, and accesses reserve only at the cupboard", () => {
    let save = wild(start())
    save.team[0].hp = 5
    save = act(save, { type: "battle", move: "item", item: "potion" })
    expect(save.inventory.potion).toBe(2)
    expect(save.encounter!.turn).toBe(2)
    expect(reduceAdventure(save, { type: "heal" }).error).toBeTruthy()
    save = {
      ...save,
      encounter: null,
      mapId: "lantern-quarter:clinic",
      x: 7,
      y: 5,
      facing: "right",
    }
    save.reserve.push({
      ...save.team[0],
      uid: "reserve-one",
      hp: 10,
      pp: { ...save.team[0].pp },
    })
    save = act(save, { type: "interact" })
    expect(save.service).toBe("storage")
    save = act(save, { type: "withdraw", uid: "reserve-one" })
    save = act(save, { type: "deposit", uid: "reserve-one" })
    expect(save.team).toHaveLength(1)
    expect(save.reserve).toHaveLength(1)
  })
  it.each(ADVENTURE_STARTERS)(
    "finishes all five multi-spirit keeper battles and the ending with %s",
    (starter) => {
      let save = reduceAdventure(undefined, {
        type: "start",
        cardId: starter,
      }).save
      for (const area of ADVENTURE_AREAS) {
        save = {
          ...save,
          areaId: area.id,
          mapId: `${area.id}:clinic`,
          x: 5,
          y: 7,
        }
        // Levelled team fixture verifies the campaign's transitions, not difficulty balance.
        save.team = ADVENTURE_STARTERS.map((id, i) => ({
          uid: `campaign-${i}`,
          cardId: i === 0 ? starter : id,
          level: 30,
          xp: 0,
          hp: 1,
          pp: fullPP(i === 0 ? starter : id, 30),
          status: null,
          statusTurns: 0,
        }))
        save = act(save, { type: "heal" })
        save = { ...save, mapId: area.id, x: 19, y: 7, facing: "right" }
        save = act(save, { type: "interact" })
        expect(save.encounter!.roster).toHaveLength(2)
        expect(
          reduceAdventure(save, { type: "battle", move: "befriend" }).error,
        ).toBeTruthy()
        for (let turn = 0; turn < 80 && save.encounter; turn++) {
          const member = save.team.find(
            (m) => m.uid === save.encounter!.activeUid,
          )!
          const skill = skillsFor(member.cardId, member.level)
            .filter((move) => move.power && (member.pp?.[move.id] ?? 0) > 0)
            .sort(
              (a, b) =>
                b.power *
                  (b.school
                    ? schoolMultiplier(
                        b.school,
                        CARD_MAP[save.encounter!.cardId].school,
                      )
                    : 1) -
                a.power *
                  (a.school
                    ? schoolMultiplier(
                        a.school,
                        CARD_MAP[save.encounter!.cardId].school,
                      )
                    : 1),
            )[0]
          save = act(
            save,
            skill
              ? { type: "battle", move: "skill", skillId: skill.id }
              : { type: "battle", move: "strike" },
          )
        }
        expect(save.encounter).toBeNull()
        expect(save.badges).toContain(area.keeper.badge)
        if (area.chapter < 5) {
          save = { ...save, x: 21, y: 14 }
          save = act(save, { type: "move", direction: "right" })
          expect(save.areaId).toBe(ADVENTURE_AREAS[area.chapter].id)
        }
      }
      expect(save.completed).toBe(true)
      expect(save.badges).toHaveLength(5)
    },
  )
  it("migrates v1 progress and in-flight battles, while rejecting malformed imports without throwing", () => {
    const old = newGame()
    delete old.adventure
    expect(parseGame(old)?.adventure).toBeUndefined()
    const legacy = {
      version: 1,
      started: true,
      areaId: "rain-harbor",
      x: 2,
      y: 7,
      facing: "up",
      steps: 23,
      aromaSeals: 4,
      team: [
        { uid: "starter-pho-bo", cardId: "pho-bo", level: 8, xp: 2, hp: 12 },
      ],
      reserve: [],
      discovered: ["pho-bo"],
      badges: ["lantern"],
      completedQuests: [],
      claimedFinds: [],
      encounter: null,
      message: null,
      completed: false,
    }
    const game = newGame()
    game.adventure = (legacy as unknown as AdventureSave)
    const parsed = parseGame(JSON.parse(JSON.stringify(game)))!.adventure!
    expect(parsed.version).toBe(2)
    expect(parsed.mapId).toBe("rain-harbor")
    expect([parsed.x, parsed.y]).toEqual([2, 14])
    expect(parsed.team[0].hp).toBe(12)
    expect(parsed.badges).toEqual(["lantern"])
    const encounter = wild(start()).encounter!
    game.adventure = ({
      ...legacy,
      areaId: "lantern-quarter",
      encounter,
    } as unknown as AdventureSave)
    expect(
      parseGame(JSON.parse(JSON.stringify(game)))?.adventure?.encounter
        ?.activeUid,
    ).toBe("starter-pho-bo")
    const malformed = newGame()
    malformed.adventure = start()
    malformed.adventure.team[0].cardId = "unknown-card"
    expect(() => parseGame(malformed)).not.toThrow()
    expect(parseGame(malformed)).toBeNull()
    malformed.adventure = start()
    malformed.adventure.mapId = "unknown-map"
    expect(() => parseGame(malformed)).not.toThrow()
    expect(parseGame(malformed)).toBeNull()
  })
})
