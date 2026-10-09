import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { actBattle, startBattle } from "@/game/battle"
import { CARDS, STARTER_DECK } from "@/game/catalog"
import { combatCues } from "@/game/combatEffects"
import {
  battleMusic,
  frameSounds,
  MUSIC_TRACKS,
  storyMusic,
} from "@/game/audioScore"
import {
  migrateUserState,
  repository,
} from "@/infrastructure/storage/repository"

describe("soundtrack and combat signals", () => {
  it("uses boss music for bosses and danger, mystery music for reveals", () => {
    const battle = startBattle(STARTER_DECK, null)
    expect(battleMusic(battle)).toBe("battle")
    battle.player.health = 8
    expect(battleMusic(battle)).toBe("boss")
    expect(battleMusic(startBattle(STARTER_DECK, "lantern-3"))).toBe("boss")
    expect(storyMusic("tet-kitchen")).toBe("story-warm")
    expect(storyMusic("last-table")).toBe("story-mystery")
  })
  it("deduplicates sweep sounds and announces destruction and a finishing blow from real damage", () => {
    const battle = startBattle(STARTER_DECK, null)
    const sweep = CARDS.find(
      (c) => c.kind === "spell" && c.effect === "sweep" && c.school === "tide",
    )!
    battle.player.hand = [sweep.id]
    battle.player.mana = 7
    battle.enemy.board = ["a", "b", "c"].map((uid) => ({
      uid,
      cardId: "pho-bo",
      attack: 3,
      health: 1,
      maxHealth: 4,
      shield: 0,
      ready: true,
      keywords: [],
    }))
    const frame = actBattle(battle, { type: "play", index: 0 }).frames[0]
    const frozen = JSON.stringify(frame),
      sounds = frameSounds(frame)
    expect(sounds.filter((s) => s.cue === "water")).toHaveLength(1)
    expect(sounds.some((s) => s.cue === "vanish")).toBe(true)
    expect(sounds[0]).toEqual({ cue: "cast", delay: 0 })
    expect(JSON.stringify(frame)).toBe(frozen)
  })
  it("signals boss awakening at the threshold and a finish only on a real knockout", () => {
    const battle = startBattle(STARTER_DECK, "lantern-3")
    battle.player.hand = ["spark"]
    battle.player.mana = 7
    battle.enemy.health = Math.floor(battle.enemy.maxHealth / 2) + 1
    const awakened = actBattle(battle, {
      type: "play",
      index: 0,
      target: "hero",
    }).frames[0]
    expect(combatCues(awakened).some((c) => c.kind === "awaken")).toBe(true)
    expect(frameSounds(awakened).some((s) => s.cue === "awaken")).toBe(true)
    battle.enemy.health = 1
    const finished = actBattle(battle, {
      type: "play",
      index: 0,
      target: "hero",
    }).frames[0]
    expect(combatCues(finished).some((c) => c.kind === "finish")).toBe(true)
    expect(combatCues(finished).some((c) => c.kind === "awaken")).toBe(false)
  })
  it("ships compact real MP3 assets, not LFS pointers", () => {
    let total = 0
    for (const path of Object.values(MUSIC_TRACKS).filter(path => path.includes("/tcg/"))) {
      const buffer = readFileSync(`public/${path}`)
      total += buffer.length
      expect(buffer.length).toBeGreaterThan(100000)
      expect(buffer.subarray(0, 3).toString()).toBe("ID3")
      expect(buffer.subarray(0, 100).toString()).not.toContain("git-lfs")
    }
    expect(total).toBeLessThan(1100000)
  })
  it("migrates old muted saves and bad new sliders without resetting rewards or profile", () => {
    const old = repository.loadUser()
    old.keys = 731
    old.displayName = "Bếp Việt"
    old.preferences = { ...old.preferences, soundEnabled: false }
    delete old.preferences.musicEnabled
    delete old.preferences.musicVolume
    delete old.preferences.effectsVolume
    const migrated = migrateUserState(old)!
    expect(migrated.keys).toBe(731)
    expect(migrated.displayName).toBe("Bếp Việt")
    expect(migrated.preferences).toMatchObject({
      soundEnabled: false,
      musicEnabled: true,
      musicVolume: 0.38,
      effectsVolume: 0.7,
    })
    const damaged = structuredClone(old) as unknown as {
      preferences: Record<string, unknown>
    }
    damaged.preferences.musicVolume = 10
    damaged.preferences.effectsVolume = "bad"
    damaged.preferences.musicEnabled = null
    expect(migrateUserState(damaged)).toMatchObject({
      keys: 731,
      preferences: {
        soundEnabled: false,
        musicVolume: 0.38,
        effectsVolume: 0.7,
        musicEnabled: true,
      },
    })
  })
})
