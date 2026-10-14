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
    const combo = scenes.find(scene => scene.battle.comboCounts?.home === 1)!
    expect(combo.battle.player.board.every(unit => unit.shield > 0)).toBe(true)
    expect(combo.battle.player.health).toBeGreaterThan(12)
    const opened = scenes.find(scene => !scene.battle.enemy.board.length)!
    expect(opened).toBeDefined()
    const counter = scenes.filter(scene => scene.frame?.event.side === "enemy")
    expect(counter.some(scene => scene.frame?.event.kind === "rule")).toBe(true)
    expect(counter.some(scene => scene.frame?.event.kind === "play")).toBe(true)
    expect(counter.some(scene => scene.battle.player.health < combo.battle.player.health)).toBe(true)
    expect(scenes[scenes.length - 1].battle.result).toBe("win")
    expect(scenes[0].battle.enemy.board).toHaveLength(1)
  })
  it("Auto chess really merges three copies, spends gold, triggers skills and wins", () => {
    const scenes = buildModeIntro("auto").frames.map(frame => frame.scene).filter(scene => scene.mode === "auto")
    const merged = scenes.find(scene => scene.run.roster.some(piece => piece.id === "pho-bo" && piece.star === 2))!
    expect(merged.run.gold).toBe(8)
    expect(merged.run.roster.filter(piece => piece.id === "pho-bo")).toHaveLength(1)
    expect(traitCounts(merged.run.roster).tide).toBe(2)
    expect(traitCounts(merged.run.roster).storyteller).toBe(3)
    const last = scenes[scenes.length - 1].run
    expect(last.combat?.result).toBe("win")
    const boss = last.combat!.actors.find(actor => actor.id === last.combat!.boss)!
    expect(boss.casts).toBeGreaterThan(0)
    expect(boss.phase).toBeGreaterThan(0)
    expect(scenes.some(scene => scene.run.combat?.actors.some(actor => actor.side === "ally" && actor.hp < actor.maxHp))).toBe(true)
    expect(last.combat?.actors.filter(actor => actor.side === "ally").every(actor => actor.casts > 0)).toBe(true)
    expect(scenes[0].run.gold).toBe(10)
    expect(scenes[0].run.roster.find(piece => piece.id === "pho-bo")?.star).toBe(1)
  })
  it("TCG demonstrates a real one-use trap and resumes the boss turn",()=>{
    const frames=buildModeIntro("tcg").frames.flatMap(f=>f.scene.mode==="tcg"&&f.scene.frame?[f.scene.frame]:[])
    expect(frames.some(f=>f.event.kind==="trap-window")).toBe(true)
    expect(frames.some(f=>f.event.kind==="trap"&&f.event.cardId==="trap-seal")).toBe(true)
    expect(frames.some(f=>f.event.kind==="negated")).toBe(true)
    expect(frames.some(f=>f.event.kind==="play"&&f.event.side==="enemy")).toBe(true)
  })
  it("Adventure uses squad skills, manual bursts, boss warnings and a real victory", () => {
    const scenes = buildModeIntro("adventure").frames.map(f => f.scene).filter(s => s.mode === "adventure")
    const first = scenes[0].save.run!.battle, last = scenes.at(-1)!.save.run!.battle
    expect(first.actors.filter(a => a.side === "ally")).toHaveLength(5)
    const events = scenes.flatMap(s => s.save.run!.battle.events)
    expect(events.some(e => e.kind === "skill")).toBe(true)
    expect(events.some(e => e.kind === "burst")).toBe(true)
    expect(events.some(e => e.kind === "guard")).toBe(true)
    expect(events.some(e => e.kind === "boss")).toBe(true)
    expect(scenes.some(s => s.save.run!.battle.warning)).toBe(true)
    expect(last.result).toBe("win")
    expect(last.settled).toBe(true)
    expect(first.result).toBeNull()
    expect(scenes[0].save.stars["lantern-6"]).toBeUndefined()
  })
  it("intro controls stay in guides and the TCG view cannot call the live save store", () => {
    expect(readFileSync("src/components/layout/ModeSwitch.tsx", "utf8")).not.toContain("ModeIntroButton")
    const board = readFileSync("src/components/game/BattleBoard.tsx", "utf8").split("export function BattleBoardView")[1]
    expect(board).not.toContain("useGameStore")
    const scenes = readFileSync("src/components/game/ModeIntroScenes.tsx", "utf8")
    expect(scenes).toContain("<BattleBoardView")
    expect(scenes).toContain("<AutoBoard")
    expect(scenes).toContain("<RpgBattleView")
    expect(scenes).toContain("<ChestScene")
    expect(scenes).not.toMatch(/useGameStore|useAppStore|localStorage|sessionStorage/)
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
