export const RULES_VERSION = 4
export const TICKS_PER_SECOND = 20
export type AutoMode = "campaign" | "survival" | "daily"
export type AutoSchool = "ember" | "tide" | "grove" | "hearth" | "sugar"
export type Profession = "keeper" | "traveler" | "storyteller"
export type Skill = "flame" | "steam" | "shield" | "heal" | "cleave" | "dash" | "leaves" | "mana" | "cone" | "shell" | "ginger" | "dodge" | "charge" | "lantern" | "rhythm" | "feast" | "copy" | "drain" | "stun" | "summon" | "seal" | "frost"
export interface UnitDef {
  id: string
  name: string
  spirit: string
  cost: number
  school: AutoSchool
  profession: Profession
  hp: number
  attack: number
  armor: number
  range: number
  interval: number
  skill: Skill
  power: number
  text: string
  lore: string
  art: string
  sprite: number
  portrait: number
  foodId?: string
}
export interface Piece {
  uid: string
  id: string
  star: 1 | 2 | 3
  cell: number | null
  benchSlot?: number
  items: string[]
}
export interface Action {
  kind: "move" | "attack" | "cast"
  start: number
  hit: number
  end: number
  target: string | null
  from: number
  to: number
  skill?: Skill
}
export interface Actor {
  uid: string
  id: string
  side: "ally" | "enemy"
  cell: number
  star: number
  hp: number
  maxHp: number
  attack: number
  baseAttack: number
  armor: number
  range: number
  interval: number
  mana: number
  shield: number
  stunnedUntil: number
  burnUntil: number
  burnPower: number
  next: number
  action: Action | null
  skill: Skill
  power: number
  items: string[]
  lanternUsed: boolean
  casts: number
  phase: number
  diedAt: number | null
  dodgeUntil: number
  sealedUntil: number
}
export type EventKind = "move" | "attack" | "cast" | "hit" | "heal" | "shield" | "death" | "phase" | "summon" | "burn" | "mana" | "stun"
export interface CombatEvent {
  id: number
  tick: number
  kind: EventKind
  source: string
  target: string
  cell: number
  amount: number
  school: AutoSchool
}
export interface AutoCombat {
  id: string
  tick: number
  actors: Actor[]
  events: CombatEvent[]
  nextEvent: number
  result: "win" | "loss" | null
  settled: boolean
  boss: string | null
  pendingScene: string | null
  lastAllySkill: Skill | null
  lastAllyPower: number
  pressure: number
}
export interface RoundResult {
  id: string
  wave: number
  result: "win" | "loss"
  seconds: number
  survivors: number
  points: number
  damage: number
  gold: number
  reason: string
}
export interface AutoRun {
  id: string
  mode: AutoMode
  rulesVersion: number
  seed: number
  rng: number
  day: string
  phase: "prepare" | "combat" | "result" | "reward" | "won" | "lost" | "abandoned"
  wave: number
  rounds: number
  bestWave: number
  health: number
  gold: number
  xp: number
  score: number
  activeTicks: number
  roster: Piece[]
  shop: (string | null)[]
  pool: Record<string, number>
  locked: boolean
  inventory: string[]
  augments: string[]
  reward: { kind: "relic" | "augment"; choices: string[] } | null
  pendingRewards: ("relic" | "augment")[]
  combat: AutoCombat | null
  lastResult: RoundResult | null
  paidWaves: number[]
  seenScenes: string[]
  scene: string | null
  sceneLine: number
  paused: boolean
  freeReroll: boolean
  relicReroll: boolean
  nextUid: number
  log: string[]
  finished: boolean
}
export interface AutoRecord {
  id: string
  mode: AutoMode
  seed: number
  rulesVersion: number
  day: string
  score: number
  wave: number
  seconds: number
  result: "won" | "lost" | "abandoned"
  team: string[]
}
export interface AutoSave {
  version: 1
  run: AutoRun | null
  campaignCleared: number
  ending: "annotations" | "hall" | null
  records: AutoRecord[]
  seals: number
  cosmetics: string[]
  board: string
  tutorialSeen: boolean
}
export const emptyAutoSave = (): AutoSave => ({
  version: 1,
  run: null,
  campaignCleared: 0,
  ending: null,
  records: [],
  seals: 0,
  cosmetics: ["market"],
  board: "market",
  tutorialSeen: false,
})
