import type { BattleFrame } from "./battle"
import { CARD_MAP } from "./catalog"
import { combatCues } from "./combatEffects"
import { battleRule } from "./encounters"
import type { StoryArtId } from "./storyArt"
import type { Battle } from "./types"
import { TCG_IMPACT_MS } from "./battleVfx"

export const MUSIC_TRACKS = {
  "mode-chest": "assets/music580/mode-chest.mp3",
  "mode-tcg": "assets/music580/mode-tcg.mp3",
  "mode-autochess": "assets/music580/mode-autochess.mp3",
  "mode-adventure": "assets/music580/mode-adventure.mp3",
  "map-lantern": "assets/music580/map-lantern.mp3",
  "map-harbor": "assets/music580/map-harbor.mp3",
  "map-garden": "assets/music580/map-garden.mp3",
  "map-tide": "assets/music580/map-tide.mp3",
  "map-tea": "assets/music580/map-tea.mp3",
  "map-salt": "assets/music580/map-salt.mp3",
  "map-lotus": "assets/music580/map-lotus.mp3",
  "map-aroma": "assets/music580/map-aroma.mp3",
  boss: "assets/music580/boss.mp3",
} as const
export type MusicTrack = keyof typeof MUSIC_TRACKS
export type MusicStyle = "original"
export type MusicAsset = MusicTrack
export function musicAsset(track: MusicTrack, _style: MusicStyle): MusicAsset { return track }
export function musicPath(asset: MusicAsset): string { return MUSIC_TRACKS[asset] }
export type GameSound = "trap-set" | "footstep" | "door" | "capture" | "select" | "deselect" | "confirm" | "cast" | "impact" | "fire" | "water" | "leaves" | "sparkle" | "heal" | "buff" | "shield" | "break" | "summon" | "draw" | "resonance" | "turn" | "awaken" | "vanish" | "victory" | "defeat" | "story-next" | "combo" | "auto-slash" | "auto-shot" | "auto-contact" | "auto-channel" | "auto-fall" | "auto-boss" | "auto-overtime" | "auto-victory" | "auto-defeat"
export interface TimedSound {
  cue: GameSound
  delay: number
}

export function battleMusic(battle: Battle): MusicTrack {
  if (battle.stageId && /^(living-market|rain-harbor|tomorrow-table)-/.test(battle.stageId)) return livingMusic(battle.stageId, !!battleRule(battle) || battle.player.health <= 8)

  return battleRule(battle) ||
    battle.player.health <= 8 ||
    (battle.expedition?.enemyBoost ?? 0) >= 2
    ? "boss"
    : "mode-tcg"
}

export function livingMusic(id: string, tension = false): MusicTrack {
 if (tension) return "boss"
 return id.startsWith("living-market") ? "map-lantern" : id.startsWith("rain-harbor") ? "map-harbor" : "map-garden"
}
export function storyMusic(art: StoryArtId): MusicTrack {
 if (["living-market", "rain-harbor", "tomorrow-table"].includes(art)) return livingMusic(art)
  return ["garden", "tide", "last-table", "harbor", "memory-flare"].includes(
    art,
  )
    ? "map-tide"
    : "mode-tcg"
}

// One sound per kind even for a sweep. Cast -> contact -> secondary effect;
// health/shield changes come from actual reducer frames, never UI guesses.
export function frameSounds(frame: BattleFrame): TimedSound[] {
  const card = frame.event.cardId ? CARD_MAP[frame.event.cardId] : undefined
  const cues = combatCues(frame)
  const sounds: TimedSound[] = []
  const add = (cue: GameSound, delay: number) => {
    if (!sounds.some((sound) => sound.cue === cue)) sounds.push({ cue, delay })
  }
  if(frame.event.kind==="set-trap")add("trap-set",0)
  if(frame.event.kind==="trap") {add("resonance",0);add("cast",180)}
  if(frame.event.kind==="negated")add("break",100)
  if (frame.event.kind === "play")
    add(card?.kind === "unit" ? "summon" : "cast", 0)
  if (frame.event.kind === "attack") {
    add("cast", 0)
    add("impact", TCG_IMPACT_MS)
  }
  if (frame.event.kind === "combo") add("combo", 0)
  if (frame.event.kind === "assist") add("resonance", 0)
  if (frame.event.kind === "tactic") add("resonance", 0)
  if (frame.event.kind === "mulligan") add("draw", 0)
  if (frame.event.kind === "turn" && frame.event.side === "player")
    add("turn", 0)
  for (const cue of cues) {
    if (cue.kind === "finish" || cue.kind === "turn") continue
    add(
      cue.kind === "strike" ? "impact" : cue.kind,
      cue.kind === "resonance" ? 60 : ["play", "attack"].includes(frame.event.kind) ? TCG_IMPACT_MS : 130,
    )
  }
  return sounds.slice(0, 5)
}
