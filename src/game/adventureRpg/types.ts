import type { CharacterId } from "../characters"
import type { MusicTrack } from "../audioScore"
import type { School } from "../types"

export type RpgRole = "guardian" | "striker" | "mage" | "healer" | "trickster"
export type DungeonKind = "experience" | "skills" | "forge"
export type EnemyStyle = "bulwark" | "raider" | "hexer" | "mender"
export interface RpgHero {
  uid: string
  cardId: string
  level: number
  xp: number
  rank: number
  skills: [number, number, number, number]
  gear: [number, number, number]
  path?: "assault" | "support"
}
export interface RpgResources {
  coins: number
  experience: number
  books: number
  ore: number
  essence: number
  broth: number
  leaves: number
  seals: number
}
export interface RpgLine {
  speaker: CharacterId
  text: string
}
export interface RpgMap {
  id: string
  name: string
  subtitle: string
  art: string
  music: MusicTrack
  school: School
  guide: CharacterId
  boss: string
  bossName: string
  stages: {
    name: string
    before: RpgLine
    after: RpgLine
  }[]
  ending: [RpgLine, RpgLine]
  choices: [string, string]
}
export interface RpgEnemy {
  strength?: number
  uid: string
  id: string
  name: string
  school: School
  boss: boolean
  level: number
  elite?: boolean
  style?: EnemyStyle
}
export interface RpgActor {
  uid: string
  id: string
  name: string
  side: "ally" | "enemy"
  slot: number
  school: School
  role: RpgRole
  level: number
  rank: number
  skills: [number, number, number, number]
  hp: number
  maxHp: number
  attack: number
  armor: number
  energy: number
  shield: number
  burn: number
  weaken: number
  stun: number
  wither?: number
  nextAttack: number
  nextSkill: number
  nextSupport: number
  boss: boolean
  phase: number
  motion: "idle" | "attack" | "cast" | "hit" | "fall" | "victory"
  motionAt: number
  path?: "assault" | "support"
  mark?: {school: School; until: number}
  elite?: boolean
  style?: EnemyStyle
}
export interface RpgEvent {
  serial: number
  tick: number
  kind: "hit" | "skill" | "burst" | "heal" | "shield" | "boss" | "wave" | "guard" | "reaction"
  source: string
  targets: string[]
  value: number
  values?: Record<string, number>
  text: string
  school: School
  animation?: "attack" | "primary" | "support" | "ultimate" | "enemy"
}
export interface RpgBattle {
  rulesVersion?: 510 | 520
  focus?: string | null
  chain?: {source: string; until: number; count: number}
  id: string
  tick: number
  wave: number
  waves: RpgEnemy[][]
  actors: RpgActor[]
  events: RpgEvent[]
  serial: number
  result: "win" | "loss" | null
  settled: boolean
  stars: number
  paused: boolean
  auto: boolean
  speed: 1 | 2
  guardUntil: number
  guardReady: number
  guardRow: "front" | "back"
  warning: {
    until: number
    source: string
    row: "front" | "back"
    skill?: string
  } | null
  reward: Partial<RpgResources> | null
}
export interface RpgDungeon {
  scaling?: { average: number; baseLevel: number }
  kind: DungeonKind
  tier: number
  floor: number
  status: "battle" | "camp" | "ready" | "complete" | "lost"
  health: Record<string, {
    hp: number
    energy: number
  }>
  bonus: number
}
export interface RpgRun {
  kind: "campaign" | "dungeon"
  stageId: string | null
  battle: RpgBattle
  dungeon: RpgDungeon | null
}
export interface RpgSave {
  version: 1
  roster: RpgHero[]
  formation: string[]
  resources: RpgResources
  stars: Record<string, number>
  choices: Record<string, 0 | 1>
  dungeonClears: Record<string, number>
  run: RpgRun | null
  serial: number
  legacy: {
    imported: boolean
    badges: string[]
    discoveries: number
    completed: boolean
  }
}
export type RpgAction = { type: "sync" } | {type: "path"; uid: string; path: "assault" | "support"} | {type: "focus"; uid: string | null} | {
  type: "formation"
  uids: string[]
} | { type: "train"
  uid: string
} | {
  type: "skill"
  uid: string
  index: number
} | { type: "gear"
  uid: string
  index: number
} | {
  type: "rank"
  uid: string
} | { type: "start"
  stageId: string
} | {
  type: "dungeon"
  kind: DungeonKind
  tier: number
} | { type: "tick"
  steps: number
} | { type: "burst"
  uid: string
} | {
  type: "guard"
  row: "front" | "back"
} | { type: "pause" | "auto" | "speed" | "settle" | "next" | "close" } | {
  type: "camp"
  choice: "rest" | "power"
} | { type: "broth" } | { type: "revive"
  uid: string
} | {
  type: "choice"
  mapId: string
  choice: 0 | 1
}
