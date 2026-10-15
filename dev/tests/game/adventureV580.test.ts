import { describe, expect, it } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { RPG_MAPS } from "@/game/adventureRpg/content"
import { BOSS_SKILLS, encounterWaves } from "@/game/adventureRpg/enemies"
import {
  advanceRpgBattle,
  createRpgBattle,
  newRpgSave,
  reduceRpg,
} from "@/game/adventureRpg/engine"
import { ULTIMATE_MOVES } from "@/game/adventureRpg/awakening"
import { MONSTER_MAP } from "@/game/autochess/catalog"
import { newGame } from "@/game/progression"
import { monsterCharacter } from "@/infrastructure/assets/characterSprites"
import type { RpgDifficulty } from "@/game/adventureRpg/types"
import { GAME_INTRO_IMAGES, randomGameIntroImage } from "@/game/loadingImages"

const game = newGame()
const advancedIds = ["mistwood", "sugartower", "ashalley", "lasttable"]
const enemyIds = [
  "tea-moth",
  "jade-sentinel",
  "tea-oracle",
  "cloud-teapot",
  "salt-scarab",
  "kiln-knight",
  "salt-alchemist",
  "salt-colossus",
  "moon-jelly",
  "lotus-mantis",
  "moon-priestess",
  "moon-heron",
  "spice-kite",
  "bronze-warden",
  "aroma-conductor",
  "aroma-regent",
]

interface MovieManifestEntry {
  path: string
  bytes: number
  width: number
  height: number
}

describe("Web 5.8 supplied campaign assets and combat rules", () => {
  it("shares five random, uncropped intro candidates with mode changes and loading", () => {
    expect(GAME_INTRO_IMAGES).toHaveLength(5)
    expect(new Set(GAME_INTRO_IMAGES).size).toBe(5)
    expect(randomGameIntroImage(() => 0)).toBe(GAME_INTRO_IMAGES[0])
    expect(randomGameIntroImage(() => 0.999999)).toBe(GAME_INTRO_IMAGES[4])
  })

  it("uses four unique supplied arenas and sixteen unique animated enemies", () => {
    const maps = RPG_MAPS.filter((map) => advancedIds.includes(map.id))
    expect(maps.map((map) => map.name)).toEqual([
      "Đỉnh Trà Mây",
      "Lò Muối Đỏ",
      "Đầm Sen Nguyệt",
      "Điện Vạn Hương",
    ])
    expect(new Set(maps.map((map) => map.battleArt)).size).toBe(4)
    for (const map of maps) {
      expect(map.art).toBe(map.battleArt)
      expect(existsSync(`public${map.art}`), map.art).toBe(true)
      const waves = encounterWaves(
        map.school,
        30,
        4,
        { id: map.boss, name: map.bossName },
        false,
        1,
        map.id,
        "extreme",
      )
      const ids = new Set(waves.flat().map((enemy) => enemy.id))
      expect(ids.has(map.boss)).toBe(true)
      expect(waves.at(-1)?.some((enemy) => enemy.elite)).toBe(true)
    }
    for (const id of enemyIds) {
      expect(MONSTER_MAP[id]?.name, id).toBeTruthy()
      expect(monsterCharacter(id).sheet).toMatch(/^campaign[AB]$/)
    }
  })

  it("removes manual focus from current battles while retaining old-save compatibility", () => {
    const current = reduceRpg(
      newRpgSave(game),
      { type: "start", stageId: "lantern-1", difficulty: "normal" },
      game,
    ).save
    const target = current.run!.battle.actors.find(
      (actor) => actor.side === "enemy",
    )!
    const rejected = reduceRpg(
      current,
      { type: "focus", uid: target.uid },
      game,
    )
    expect(rejected.error).toContain("gần nhất")
    current.run!.battle.rulesVersion = 520
    const legacy = reduceRpg(current, { type: "focus", uid: target.uid }, game)
    expect(legacy.error).toBeUndefined()
    expect(legacy.save.run?.battle.focus).toBe(target.uid)
  })

  it("adds stronger elite and boss effects by mode", () => {
    const cast = (difficulty: RpgDifficulty) => {
      const save = newRpgSave(game)
      const waves = encounterWaves(
        "grove",
        30,
        1,
        { id: "cloud-teapot", name: "Ấm Trà Vân Thiên" },
        false,
        1,
        "mistwood",
        difficulty,
      )
      const battle = createRpgBattle(save, waves, `mode:${difficulty}`)
      battle.difficulty = difficulty
      const boss = battle.actors.find((actor) => actor.id === "cloud-teapot")!
      const ally = battle.actors.find((actor) => actor.side === "ally")!
      ally.energy = 80
      for (const actor of battle.actors) {
        actor.nextAttack = actor.nextSkill = actor.nextSupport = 999
      }
      boss.energy = 100
      battle.warning = { source: boss.uid, row: "front", until: 1 }
      return advanceRpgBattle(battle, 1).actors.find(
        (actor) => actor.uid === ally.uid,
      )!
    }
    const normal = cast("normal"),
      hard = cast("hard"),
      extreme = cast("extreme")
    expect(hard.energy).toBeLessThan(normal.energy)
    expect(extreme.energy).toBeLessThan(hard.energy)
    for (const id of [
      "cloud-teapot",
      "salt-colossus",
      "moon-heron",
      "aroma-regent",
    ])
      expect(BOSS_SKILLS[id]?.text.length).toBeGreaterThan(35)
  })

  it("ships readable skill descriptions and sharp 720p cinematics for the full roster", () => {
    expect(ULTIMATE_MOVES.every((move) => move[1].length >= 38)).toBe(true)
    const manifest = JSON.parse(
      readFileSync("dev/docs/web-v530/movie-manifest.json", "utf8"),
    ) as MovieManifestEntry[]
    expect(manifest).toHaveLength(139)
    for (const movie of manifest) {
      expect([movie.width, movie.height]).toEqual([1280, 720])
      expect(movie.bytes).toBeGreaterThan(500_000)
      expect(existsSync(`public${movie.path}`), movie.path).toBe(true)
    }
  })
})
