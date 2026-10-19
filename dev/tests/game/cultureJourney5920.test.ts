import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import {
  CULTURAL_PAGES,
  advanceCulture,
  cultureOpen,
  discoveredCulture,
  type CulturalPage,
} from "@/game/culture"
import { newGame } from "@/game/progression"
import { parseGame } from "@/game/storage"
import { RPG_MAPS } from "@/game/adventureRpg/content"
import { newRpgSave } from "@/game/adventureRpg/engine"
import { createSaveCode, readSaveCode } from "@/game/saveCode"
import { useModeIntroStore } from "@/game/modeIntroState"

const pages: CulturalPage[] = JSON.parse(
  readFileSync("public/assets/culture5920/journeys.json", "utf8"),
)

describe("culture journeys and shared library", () => {
  it("covers all nine TCG discoveries and every Adventure region with three guided actions", () => {
    expect(pages.map((p) => p.id)).toEqual(CULTURAL_PAGES.map((p) => p.id))
    expect(new Set(pages.map((p) => p.mapId))).toEqual(
      new Set(RPG_MAPS.map((m) => m.id)),
    )
    expect(pages).toEqual(
      JSON.parse(readFileSync("dev/content/culture5920.json", "utf8")),
    )
    for (const page of pages) {
      expect(page.teacher.length).toBeGreaterThan(0)
      expect(page.dish.length).toBeGreaterThan(2)
      expect(page.opening.length).toBeGreaterThan(70)
      expect(page.ending.length).toBeGreaterThan(70)
      expect(page.steps).toHaveLength(3)
      for (const step of page.steps) {
        expect(step.choices).toHaveLength(2)
        expect(step.choices.filter((c) => c.advance)).toHaveLength(1)
        expect(step.choices.every((c) => c.reply.length > 20)).toBe(true)
      }
    }
  })
  it("starts with the kitchen encounter and uses either mode's story progress to unlock later meetings", () => {
    const save = newGame()
    expect(
      CULTURAL_PAGES.filter((p) => cultureOpen(save, p)).map((p) => p.id),
    ).toEqual(["tet"])
    const page = CULTURAL_PAGES[1]
    expect(
      cultureOpen({ ...save, clearedStages: [page.unlockStageId] }, page),
    ).toBe(true)
    const adventure = newRpgSave(save)
    expect(
      cultureOpen(
        { ...save, adventureRpg: { ...adventure, stars: { "harbor-1": 1 } } },
        page,
      ),
    ).toBe(true)
  })
  it("rejects locked, unknown, repeated and out-of-order actions", () => {
    const save = newGame()
    for (const [id, step] of [
      ["bai-choi", 0],
      ["missing", 0],
      ["tet", 2],
      ["tet", -1],
      ["tet", 0.5],
    ] as const)
      expect(advanceCulture(save, id, step)).toBe(save)
    const first = advanceCulture(save, "tet", 0)
    expect(advanceCulture(first, "tet", 0)).toBe(first)
  })
  it("checkpoints all 27 steps without changing resources, collection, battles or story choices", () => {
    let save = {
      ...newGame(),
      clearedStages: CULTURAL_PAGES.map((p) => p.unlockStageId),
    }
    const before = JSON.stringify(save)
    for (const page of CULTURAL_PAGES)
      for (let step = 0; step < 3; step++) {
        save = advanceCulture(save, page.id, step)
        const parsed = parseGame(save)
        expect(parsed?.cultureJourney?.[page.id]).toBe(step + 1)
      }
    const { cultureJourney, ...rest } = save
    expect(JSON.stringify(rest)).toBe(before)
    expect(Object.values(cultureJourney!)).toEqual(Array(9).fill(3))
    expect(advanceCulture(save, "tet", 3)).toBe(save)
    expect(discoveredCulture([], cultureJourney)).toHaveLength(9)
  })
  it("keeps old v1 saves valid and round-trips an in-progress step through the existing backup code", async () => {
    const old = newGame(),
      parsed = parseGame(old)!
    expect(parsed.cultureJourney).toBeUndefined()
    const next = advanceCulture(parsed, "tet", 0)
    const code = await createSaveCode(next)
    const decoded = await readSaveCode(code)
    expect(decoded.save.cultureJourney).toEqual({ tet: 1 })
    expect(parseGame({ ...old, cultureJourney: { tet: 4 } })).toBeNull()
    expect(parseGame({ ...old, cultureJourney: { unknown: 1 } })).toBeNull()
  })
  it("clears transient library selection when switching to another intro or closing", () => {
    useModeIntroStore.getState().openLibrary("culture", "tet")
    expect(useModeIntroStore.getState().library).toBe("culture")
    useModeIntroStore.getState().openComic()
    expect(useModeIntroStore.getState().library).toBeNull()
    useModeIntroStore.getState().close()
    expect(useModeIntroStore.getState().cultureId).toBeNull()
    expect(useModeIntroStore.getState().mode).toBeNull()
  })
})
