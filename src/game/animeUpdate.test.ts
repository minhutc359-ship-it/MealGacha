import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { actBattle, startBattle } from "./battle"
import { STARTER_DECK } from "./catalog"
import { newGame } from "./progression"
import { parseGame } from "./storage"
import { createSaveCode, readSaveCode } from "./saveCode"
import { tacticError, visibleThreat } from "./tactics"
import { speakerCharacter, CHARACTER_ART } from "./characters"
import { SCENES, WORLD_PRIMER } from "./narrative"
import { DRAMATIC_BEATS } from "./dramaticBeats"
import { midScene } from "./encounters"
import { RETRO_MUSIC_TRACKS, musicAsset, musicPath } from "./audioScore"
import {
  migrateUserState,
  repository,
} from "../infrastructure/storage/repository"

function pending() {
  const b = startBattle(STARTER_DECK, null)
  b.round = 4
  b.tactic = { status: "pending" }
  b.player.board = [
    {
      uid: "p",
      cardId: "pho-bo",
      attack: 3,
      health: 4,
      maxHealth: 4,
      shield: 1,
      ready: true,
      keywords: ["guard"],
    },
  ]
  return b
}
describe("turn-four tactical choice", () => {
  it("opens only at turn four, blocks ordinary actions and consumes the choice once", () => {
    let b = startBattle(STARTER_DECK, null)
    b.enemy.hand = []
    b.enemy.deck = Array(12).fill("herb")
    for (let i = 0; i < 2; i++) {
      b = actBattle(b, { type: "end" }).battle
      expect(b.tactic?.status).toBe("waiting")
    }
    b = actBattle(b, { type: "end" }).battle
    expect(b.round).toBe(4)
    expect(b.tactic?.status).toBe("pending")
    expect(actBattle(b, { type: "end" }).battle).toBe(b)
    expect(actBattle(b, { type: "play", index: 0 }).error).toContain("ứng biến")
    const result = actBattle(b, { type: "tactic", id: "shelter" })
    expect(result.error).toBeNull()
    expect(result.frames[0].event).toMatchObject({
      kind: "tactic",
      tacticId: "shelter",
    })
    expect(
      actBattle(result.battle, { type: "tactic", id: "shelter" }).error,
    ).toBeTruthy()
    b = actBattle(result.battle, { type: "end" }).battle
    expect(b.tactic?.status).toBe("chosen")
  })
  it("flame changes only existing allies and preserves mana, readiness, decks and combo trail", () => {
    const b = pending()
    b.player.recipeTrail = ["pho-bo"]
    const original = JSON.stringify(b)
    const r = actBattle(b, { type: "tactic", id: "flame" }).battle
    expect(r.player.board[0].attack).toBe(4)
    expect(r.player.board[0].ready).toBe(true)
    expect(r.player.mana).toBe(b.player.mana)
    expect(r.player.hand).toEqual(b.player.hand)
    expect(r.player.recipeTrail).toEqual(["pho-bo"])
    expect(JSON.stringify(b)).toBe(original)
    b.player.board = []
    expect(tacticError(b, "flame")).toContain("đồng minh")
  })
  it("shelter caps healing and insight never burns a full hand or draws fatigue", () => {
    const b = pending()
    b.player.health = b.player.maxHealth - 1
    const safe = actBattle(b, { type: "tactic", id: "shelter" }).battle
    expect(safe.player.health).toBe(b.player.maxHealth)
    expect(safe.player.board[0].shield).toBe(2)
    b.player.hand = Array(7).fill("spark")
    b.player.deck = ["herb"]
    const draw = actBattle(b, { type: "tactic", id: "insight" }).battle
    expect(draw.player.hand).toHaveLength(8)
    expect(draw.player.deck).toEqual([])
    expect(draw.player.fatigue).toBe(b.player.fatigue)
    b.player.hand.push("spark")
    expect(tacticError(b, "insight")).toContain("chỗ trống")
  })
  it("round-trips pending and chosen choices through encrypted progress, validates bad state and leaves legacy battles intact", async () => {
    for (const battle of [
      pending(),
      actBattle(pending(), { type: "tactic", id: "flame" }).battle,
    ]) {
      const save = { ...newGame(), battle }
      const restored = await readSaveCode(await createSaveCode(save))
      expect(restored.save.battle?.tactic).toEqual(battle.tactic)
      expect(restored.save.battle?.player).toEqual(battle.player)
    }
    const legacy = pending()
    delete legacy.tactic
    expect(
      parseGame({ ...newGame(), battle: legacy })?.battle?.tactic,
    ).toBeUndefined()
    expect(actBattle(legacy, { type: "end" }).error).toBeNull()
    expect(
      parseGame({ ...newGame(), battle: { ...pending(), round: 2 } }),
    ).toBeNull()
    expect(
      parseGame({
        ...newGame(),
        battle: { ...pending(), tactic: { status: "chosen" } },
      }),
    ).toBeNull()
  })
  it("shows visible board strength without reading hidden hand or changing state", () => {
    const b = pending()
    b.enemy.board = [
      { ...b.player.board[0], uid: "e", attack: 5, ready: false },
    ]
    b.enemy.maxMana = 7
    const old = JSON.stringify(b)
    expect(visibleThreat(b)).toEqual({ attack: 5, guards: 1, nextMana: 7 })
    expect(JSON.stringify(b)).toBe(old)
  })
})
describe("speaking characters and original retro score", () => {
  it("resolves every campaign speaker, including memories and supporting roles", () => {
    const lines = [
      ...WORLD_PRIMER,
      ...Object.values(SCENES).flatMap((s) => [...s.before, ...s.after]),
      ...Object.values(DRAMATIC_BEATS).flatMap((s) => s.lines),
    ]
    for (const line of lines) {
      const id = speakerCharacter(line.speaker)
      if (line.speaker === "Người kể") expect(id).toBeNull()
      else expect(id, line.speaker).not.toBeNull()
    }
    expect(speakerCharacter("Bà nghệ nhân Hiệu")).toBe("hieu")
    expect(speakerCharacter("Bạn · Ký ức")).toBe("hero")
    expect(speakerCharacter("Hải Vương")).toBe("mist")
    expect(speakerCharacter("Sương Nhạt")).toBe("echo")
    expect(new Set(Object.values(CHARACTER_ART)).size).toBe(16)
  })
  it("gives six campaign bosses distinct reveals without exposing them in other modes", () => {
    const titles = new Set<string>()
    for (const [id, beat] of Object.entries(DRAMATIC_BEATS)) {
      const battle = startBattle(STARTER_DECK, id)
      expect(midScene(`awaken:${id}`, battle)).toEqual(beat)
      titles.add(beat.title)
      battle.weekly = { week: "2026-10-05", index: 2, seed: 1 }
      expect(midScene(`awaken:${id}`, battle).title).not.toBe(beat.title)
    }
    expect(titles.size).toBe(6)
    expect(
      SCENES["last-table-2"].before.some((l) => l.speaker === "Liên"),
    ).toBe(true)
    expect(
      SCENES["last-table-2"].before.map((l) => l.text).join(" "),
    ).toContain("sáu tuổi")
  })
  it("ships four separate playable MP3 arrangements and migrates music style safely", () => {
    let bytes = 0
    for (const [track, src] of Object.entries(RETRO_MUSIC_TRACKS).filter(([track]) => !track.startsWith("auto-"))) {
      const file = readFileSync(`public/${src}`)
      expect(file.subarray(0, 3).toString()).toBe("ID3")
      expect(file.length).toBeGreaterThan(150000)
      bytes += file.length
      expect(
        musicPath(musicAsset(track as keyof typeof RETRO_MUSIC_TRACKS, "8bit")),
      ).toBe(src)
    }
    expect(bytes).toBeLessThan(1000000)
    const user = repository.loadUser()
    user.preferences.musicStyle = "8bit"
    expect(migrateUserState(user)?.preferences.musicStyle).toBe("8bit")
    delete user.preferences.musicStyle
    expect(migrateUserState(user)?.preferences.musicStyle).toBe("original")
    const bad = {
      ...user,
      preferences: { ...user.preferences, musicStyle: "unknown" },
    }
    expect(migrateUserState(bad)?.preferences.musicStyle).toBe("original")
  })
})
