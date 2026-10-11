import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { buildModeIntro, introAt } from "@/game/modeIntro"
import { INTRO_DURATION, introTime, useModeIntroStore, type IntroMode } from "@/game/modeIntroState"
import { traitCounts } from "@/game/autochess/economy"

describe("25-second isolated mode introductions", () => {
  for (const mode of ["tcg", "auto", "adventure", "chest"] as IntroMode[]) {
    it(`${mode}: has ordered scenes and a complete 25-second script`, () => {
      const clip = buildModeIntro(mode)
      expect(clip.duration).toBe(25_000)
      expect(clip.frames[0].at).toBe(0)
      expect(clip.beats[0].at).toBe(0)
      expect(clip.beats.every(beat => beat.at < clip.duration && beat.text.length > 20)).toBe(true)
      expect(clip.frames.every((frame, i) => frame.at < clip.duration && (!i || frame.at > clip.frames[i - 1].at))).toBe(true)
      expect(introAt(clip.beats, INTRO_DURATION)).toBe(clip.beats[clip.beats.length - 1])
    })
  }
  it("TCG uses the live engine for resonance, healing, shields, removing guard and winning", () => {
    const frames = buildModeIntro("tcg").frames
    const scenes = frames.map(frame => frame.scene).filter(scene => scene.mode === "tcg")
    expect(scenes[0].battle.player.health).toBe(12)
    expect(scenes[2].battle.comboCounts?.home).toBe(1)
    expect(scenes[2].battle.player.board.every(unit => unit.shield > 0)).toBe(true)
    expect(scenes[2].battle.player.health).toBeGreaterThan(12)
    expect(scenes[3].battle.enemy.board).toHaveLength(0)
    expect(scenes[4].battle.result).toBe("win")
    expect(scenes[0].battle.enemy.board).toHaveLength(1)
  })
  it("Auto chess really merges three copies, spends gold, triggers skills and wins", () => {
    const scenes = buildModeIntro("auto").frames.map(frame => frame.scene).filter(scene => scene.mode === "auto")
    const merged = scenes.find(scene => scene.run.roster.some(piece => piece.id === "pho-bo" && piece.star === 2))!
    expect(merged.run.gold).toBe(8)
    expect(merged.run.roster.filter(piece => piece.id === "pho-bo")).toHaveLength(1)
    expect(traitCounts(merged.run.roster).tide).toBe(1)
    expect(traitCounts(merged.run.roster).storyteller).toBe(2)
    const last = scenes[scenes.length - 1].run
    expect(last.combat?.result).toBe("win")
    expect(last.combat?.actors.filter(actor => actor.side === "ally").every(actor => actor.casts > 0)).toBe(true)
    expect(scenes[0].run.gold).toBe(10)
    expect(scenes[0].run.roster.find(piece => piece.id === "pho-bo")?.star).toBe(1)
  })
  it("Adventure uses PP, changes type, lowers HP and captures using the live reducer", () => {
    const scenes = buildModeIntro("adventure").frames.map(frame => frame.scene).filter(scene => scene.mode === "adventure")
    const attack = scenes.find(scene => scene.save.team[0].pp?.["grove-leaf"] === 17)!
    expect(attack).toBeDefined()
    const wave = scenes.find(scene => scene.save.team.find(member => member.uid === "intro-pho")?.pp?.["tide-wave"] === 17)!
    expect(wave.opponent!.hp).toBeLessThan(wave.opponent!.maxHp)
    expect(wave.opponent!.activeUid).toBe("intro-pho")
    const last = scenes[scenes.length - 1].save
    expect(last.encounter).toBeNull()
    expect(last.team.map(member => member.cardId)).toContain("banh-mi")
    expect(last.aromaSeals).toBe(5)
    expect(scenes[0].save.team).toHaveLength(2)
    expect(scenes[0].save.aromaSeals).toBe(6)
  })
  it("opening/replaying/closing cannot write save state or invoke live store actions", () => {
    const source = readFileSync("src/game/modeIntro.ts", "utf8") + readFileSync("src/game/modeIntroState.ts", "utf8")
    expect(source).not.toMatch(/useGameStore|useAppStore|localStorage|sessionStorage|\.persist\(/)
    for (const mode of ["tcg", "auto", "adventure", "chest"] as IntroMode[]) {
      useModeIntroStore.getState().open(mode)
      const first = buildModeIntro(mode)
      expect(buildModeIntro(mode)).toEqual(first)
      useModeIntroStore.getState().close()
      expect(useModeIntroStore.getState().mode).toBeNull()
    }
  })
  it("pauses without skipping and clamps timing after a background stall", () => {
    expect(introTime(3_000, 60_000, false)).toBe(3_000)
    expect(introTime(3_000, 60_000, true)).toBe(3_250)
    expect(introTime(24_990, 100, true)).toBe(INTRO_DURATION)
    expect(introTime(3_000, -100, true)).toBe(3_000)
  })
})
