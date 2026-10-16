import { describe, expect, it } from "vitest"
import { existsSync } from "node:fs"
import { newGame } from "@/game/progression"
import { newRpgSave, reduceRpg } from "@/game/adventureRpg/engine"
import { parseGame } from "@/game/storage"
import {
  STARTER_CHARACTER_IDS,
  STARTER_STATES,
  starterPose,
  ultimatePhase,
} from "@/game/starterCharacters"
import { unitCharacter } from "@/infrastructure/assets/characterSprites"
import { SPRITE_SHEETS } from "@/game/autochess/presentation"
import { actorPose } from "@/game/autochess/actorPresentation"
import { tcgCharacter } from "@/game/tcgCharacterMotion"
import { CARD_MAP } from "@/game/catalog"
import { CARDS } from "@/game/catalog"
import type { Actor } from "@/game/autochess/types"

describe("starter production contract", () => {
  it("binds exactly the five existing starters to the same identity in TCG and Auto Chess", () => {
    const s = newRpgSave(newGame())
    expect(
      s.formation.map((uid) => s.roster.find((h) => h.uid === uid)!.cardId),
    ).toEqual(STARTER_CHARACTER_IDS)
    const models = STARTER_CHARACTER_IDS.map((id) => unitCharacter(id))
    expect(new Set(models.map((m) => `${m.sheet}:${m.row}`)).size).toBe(5)
    for (const id of STARTER_CHARACTER_IDS)
      expect(tcgCharacter(CARD_MAP[id])?.sheet).toBe(unitCharacter(id).sheet)
    expect(unitCharacter("goi-cuon").sheet).toBe(
      unitCharacter("goi-cuon-tom-thit").sheet,
    )
  })
  it("never lends a starter identity to an unrelated TCG unit", () => {
    const groups = new Map<string, string[]>()
    for (const card of CARDS.filter((c) => c.kind === "unit")) {
      const m = tcgCharacter(card)!,
        key = `${m.sheet}:${m.row}`
      groups.set(key, [...(groups.get(key) ?? []), card.id])
    }
    expect([...groups.values()].filter((ids) => ids.length > 1)).toEqual([])
  })
  it("keeps every HD/pixel frame in bounds and every authored action independently addressable", () => {
    for (const id of STARTER_CHARACTER_IDS) {
      for (const suffix of ["", "-pixel"]) {
        const key = `starter-${id}${suffix}` as keyof typeof SPRITE_SHEETS,
          sheet = SPRITE_SHEETS[key]
        expect(existsSync(`public${sheet.path}`)).toBe(true)
        expect(sheet.rows[0].frames).toHaveLength(32)
        for (const [x, y, w, h, ax, ay] of sheet.rows[0].frames) {
          expect(x + w).toBeLessThanOrEqual(sheet.width)
          expect(y + h).toBeLessThanOrEqual(sheet.height)
          expect(ax).toBe(w / 2)
          expect(ay).toBeLessThan(h)
        }
      }
      for (const motion of STARTER_STATES)
        for (let age = 0; age < 2600; age += 37) {
          const p = starterPose(id, motion, age)
          expect(p).toBeGreaterThanOrEqual(0)
          expect(p).toBeLessThan(32)
        }
      expect(starterPose(id, "ultimate", 959)).toBe(17)
      expect(starterPose(id, "ultimate", 960)).toBe(18)
      expect(starterPose(id, "fall", 4000)).toBe(27)
      expect(starterPose(id, "attack", 4000)).toBe(0)
    }
  })
  it("uses actual Auto Chess contact when attack speed changes", () => {
    const actor = {
      id: "banh-mi",
      hp: 100,
      action: { kind: "attack", start: 10, hit: 18, end: 24 },
    } as Actor
    expect(actorPose(actor, "starter-banh-mi", 17.9, null, false, false)).toBe(
      9,
    )
    expect(actorPose(actor, "starter-banh-mi", 18, null, false, false)).toBe(10)
    actor.action!.hit = 12
    expect(actorPose(actor, "starter-banh-mi", 12, null, false, false)).toBe(10)
  })
  it("has five ordered non-overlapping ultimate phases", () => {
    expect(
      [0, 359, 360, 959, 960, 1499, 1500, 1979, 1980, 2399].map(ultimatePhase),
    ).toEqual([
      "preparation",
      "preparation",
      "casting",
      "casting",
      "impact",
      "impact",
      "finisher",
      "finisher",
      "recovery",
      "recovery",
    ])
  })
  it("reloads a committed ultimate and handles skip twice without recasting or changing rewards", () => {
    const game = newGame()
    let s = newRpgSave(game)
    s = reduceRpg(s, { type: "start", stageId: "lantern-1" }, game).save
    s.run!.battle.actors.find((a) => a.side === "ally")!.energy = 100
    s = reduceRpg(s, { type: "burst", uid: s.formation[0] }, game).save
    const loaded = parseGame({ ...game, adventureRpg: s })!.adventureRpg!
    const before = structuredClone(loaded.run!.battle.actors),
      resources = structuredClone(loaded.resources),
      serial = loaded.run!.battle.cinematic!.serial
    s = reduceRpg(loaded, { type: "cinematicDone", serial }, game).save
    s = reduceRpg(s, { type: "cinematicDone", serial }, game).save
    expect(s.run!.battle.actors).toEqual(before)
    expect(s.resources).toEqual(resources)
  })
})
