import type { BattleFrame } from "./battle"
import { CARD_MAP } from "./catalog"
import { combatCues } from "./combatEffects"
import { battleRule } from "./encounters"
import type { StoryArtId } from "./storyArt"
import type { Battle } from "./types"

export const MUSIC_TRACKS = {
  battle: "assets/tcg/audio/battle.mp3",
  boss: "assets/tcg/audio/boss.mp3",
  "story-warm": "assets/tcg/audio/story-warm.mp3",
  "story-mystery": "assets/tcg/audio/story-mystery.mp3",
} as const
export type MusicTrack = keyof typeof MUSIC_TRACKS
export type GameSound = "select" | "deselect" | "confirm" | "cast" | "impact" | "fire" | "water" | "leaves" | "sparkle" | "heal" | "buff" | "shield" | "break" | "summon" | "draw" | "resonance" | "turn" | "awaken" | "vanish" | "victory" | "defeat" | "story-next" | "combo"
export interface TimedSound {
  cue: GameSound
  delay: number
}

export function battleMusic(battle: Battle): MusicTrack {
  return battleRule(battle) ||
    battle.player.health <= 8 ||
    (battle.expedition?.enemyBoost ?? 0) >= 2
    ? "boss"
    : "battle"
}

export function storyMusic(art: StoryArtId): MusicTrack {
  return ["garden", "tide", "last-table", "harbor", "memory-flare"].includes(
    art,
  )
    ? "story-mystery"
    : "story-warm"
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
  if (frame.event.kind === "play")
    add(card?.kind === "unit" ? "summon" : "cast", 0)
  if (frame.event.kind === "attack") add("impact", 0)
  if (frame.event.kind === "combo") add("combo", 0)
  if (frame.event.kind === "assist") add("resonance", 0)
  if (frame.event.kind === "mulligan") add("draw", 0)
  if (frame.event.kind === "turn" && frame.event.side === "player")
    add("turn", 0)
  for (const cue of cues) {
    if (cue.kind === "finish" || cue.kind === "turn") continue
    add(
      cue.kind === "strike" ? "impact" : cue.kind,
      cue.kind === "resonance" ? 60 : 130,
    )
  }
  return sounds.slice(0, 5)
}
