import { describe, expect, it } from "vitest"
import { existsSync } from "node:fs"
import {
  ADVENTURE_AREAS,
  ADVENTURE_AREA_MAP,
  captureChance,
  newAdventure,
  reduceAdventure,
  schoolMultiplier,
  spiritMaxHp,
} from "@/game/adventure"
import { CARD_MAP } from "@/game/catalog"
import { newGame } from "@/game/progression"
import { parseGame } from "@/game/storage"

describe("Phiêu lưu Vị Linh", () => {
  it("builds five connected areas entirely from valid cards and existing art", () => {
    expect(ADVENTURE_AREAS).toHaveLength(5)
    expect(ADVENTURE_AREAS.map((area) => area.chapter)).toEqual([1, 2, 3, 4, 5])
    for (const area of ADVENTURE_AREAS) {
      expect(area.grid).toHaveLength(9)
      expect(area.grid.every((row) => row.length === 12)).toBe(true)
      expect(existsSync(`public${area.art}`)).toBe(true)
      expect(CARD_MAP[area.keeper.cardId]?.kind).toBe("unit")
      expect(area.encounters.every((id) => CARD_MAP[id]?.kind === "unit")).toBe(true)
      expect(area.exits.every((exit) => !!ADVENTURE_AREA_MAP[exit.to])).toBe(true)
    }
  })

  it("starts with one of three companions without mutating the old state", () => {
    const old = newAdventure(), raw = JSON.stringify(old)
    const result = reduceAdventure(old, { type: "start", cardId: "pho-bo" })
    expect(result.error).toBeUndefined()
    expect(result.save.started).toBe(true)
    expect(result.save.team).toHaveLength(1)
    expect(result.save.team[0]).toMatchObject({ cardId: "pho-bo", level: 5, uid: "starter-pho-bo" })
    expect(result.save.team[0].hp).toBe(spiritMaxHp("pho-bo", 5))
    expect(JSON.stringify(old)).toBe(raw)
    expect(reduceAdventure(old, { type: "start", cardId: "spark" }).error).toBeTruthy()
  })

  it("supports collision, NPC interaction, finds, a keeper win and gated travel", () => {
    let save = reduceAdventure(undefined, { type: "start", cardId: "com-tam" }).save
    save = reduceAdventure(save, { type: "move", direction: "up" }).save
    expect([save.x, save.y, save.facing]).toEqual([2, 7, "up"])
    save = reduceAdventure(save, { type: "interact" }).save
    expect(save.message).toContain("Hương Ấn")

    save = { ...save, x: 3, y: 5, message: null }
    save = reduceAdventure(save, { type: "move", direction: "right" }).save
    expect(save.aromaSeals).toBe(9)
    expect(save.claimedFinds).toContain("lantern-basket")
    const once = reduceAdventure(save, { type: "move", direction: "left" }).save
    const twice = reduceAdventure(once, { type: "move", direction: "right" }).save
    expect(twice.aromaSeals).toBe(9)

    save = { ...twice, x: 9, y: 1, facing: "right", message: null }
    save = reduceAdventure(save, { type: "interact" }).save
    expect(save.encounter?.kind).toBe("keeper")
    save = { ...save, encounter: { ...save.encounter!, hp: 1 } }
    save = reduceAdventure(save, { type: "battle", move: "strike" }).save
    expect(save.badges).toContain("lantern")
    expect(save.encounter).toBeNull()

    save = { ...save, x: 9, y: 7, message: null }
    save = reduceAdventure(save, { type: "move", direction: "right" }).save
    expect(save.areaId).toBe("rain-harbor")
    expect([save.x, save.y]).toEqual([2, 7])
  })

  it("runs deterministic capture, switching and school advantage rules", () => {
    let save = reduceAdventure(undefined, { type: "start", cardId: "pho-bo" }).save
    save.team.push({ uid: "backup", cardId: "goi-cuon-tom-thit", level: 5, xp: 0, hp: spiritMaxHp("goi-cuon-tom-thit", 5) })
    save.encounter = { id: "capture-test", kind: "wild", cardId: "banh-mi", level: 4, hp: 1, maxHp: spiritMaxHp("banh-mi", 4), activeUid: save.team[0].uid, turn: 1, playerGuard: 0, enemyGuard: 0, enemyWeaken: 0, attempts: 0, log: [] }
    expect(captureChance(save.encounter)).toBeGreaterThan(.9)
    const switched = reduceAdventure(save, { type: "battle", move: "switch", uid: "backup" }).save
    expect(switched.encounter?.activeUid).toBe("backup")
    expect(switched.encounter?.turn).toBe(2)
    expect(schoolMultiplier("tide", "ember")).toBeGreaterThan(1)
    expect(schoolMultiplier("ember", "tide")).toBeLessThan(1)

    save.encounter!.activeUid = save.team[0].uid
    for (let attempt = 0; attempt < 5 && save.encounter; attempt++)
      save = reduceAdventure(save, { type: "battle", move: "befriend" }).save
    expect(save.encounter).toBeNull()
    expect(save.team.some((member) => member.cardId === "banh-mi")).toBe(true)
  })

  it("round-trips the optional adventure through the existing save schema", () => {
    const old = newGame()
    delete old.adventure
    expect(parseGame(old)?.adventure).toBeUndefined()
    const current = newGame()
    current.adventure = reduceAdventure(current.adventure, { type: "start", cardId: "goi-cuon-tom-thit" }).save
    const parsed = parseGame(JSON.parse(JSON.stringify(current)))
    expect(parsed?.adventure?.team[0].cardId).toBe("goi-cuon-tom-thit")
    expect(parsed?.adventure?.areaId).toBe("lantern-quarter")
  })
})
