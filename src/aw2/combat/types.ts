export type CombatSide = "player" | "enemy"
export type CombatStatus = "active" | "player-win" | "enemy-win" | "draw"
export type CombatSkillSlot = "basic" | "auto" | "passive" | "ultimate"
export type CombatEffectKind = "damage" | "heal" | "shield" | "interrupt-guard"
export type CombatEventKind = "cast-start" | "cast-commit" | "move" | "projectile-launch" | "hit" | "heal" | "shield" | "status" | "interrupt" | "interrupt-resist" | "miss" | "defeat" | "battle-end"

export interface ForgottenHostIntent {
  kind: "sweep" | "snuff"
  startedTick: number
  resolveTick: number
  areaCenter: number
  areaRadius: number
}

export interface ForgottenHostState {
  profile: "aw2-forgotten-host-development-v2"
  nextSkillTick: number
  phase: number
  barrierHits: number
  barrierExpiresAtTick: number
  intent: ForgottenHostIntent | null
}

export interface MuoiMark {
  appliedTick: number
  expiresAtTick: number
  capTick: number
}

export interface NhienSequence {
  id: string
  slot: "basic" | "auto" | "ultimate"
  targetId: string
  facing: 1 | -1
  firstContactTick: number
  nextIndex: number
}

export interface NhienRhythm {
  windowStartTick: number
  targetIds: string[]
  nextProcTick: number
  procs: number
  energyGranted: number
}

export interface CombatEvent {
  serial: number
  tick: number
  kind: CombatEventKind
  sourceId: string | null
  targetIds: string[]
  skillId?: string
  amount?: number
  absorbed?: number
  projectileId?: string
  resolveTick?: number
  text?: string
  statusEffect?: "muoi-mark" | "ordinary-shield" | "nhien-energy" | "nhien-recovery"
  statusChange?: "apply" | "refresh" | "remove" | "dispel" | "gain-energy"
  expiresAtTick?: number
  actionId?: string
  contactIndex?: number
}

export interface CombatPassiveState {
  thanArmed: boolean
  thanCooldownUntil: number
  luaFocusTargetId: string | null
  luaFocus: number
  mocSupportedIds: string[]
  suongSlowCooldowns: Record<string, number>
}

export interface CombatCast {
  id: string
  sourceId: string
  skillId: string
  slot: "auto" | "ultimate"
  targetId: string | null
  commitTick: number
  facing?: 1 | -1
}

export interface CombatEffect {
  id: string
  serial: number
  sourceId: string
  skillId: string
  kind: CombatEffectKind
  resolveTick: number
  targetId: string | null
  amount: number
  projectileId?: string
  areaCenter?: number
  areaRadius?: number
  pull?: number
}

export interface CombatActor {
  id: string
  spiritId: string
  side: CombatSide
  slot: number
  boss: boolean
  controlImmune: boolean
  position: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  range: number
  moveSpeed: number
  projectileTicks: number
  energy: number
  shield: number
  shieldExpiresAtTick: number
  weakenUntilTick: number
  slowUntilTick: number
  interruptGuardCharges: number
  interruptGuardUntilTick: number
  nextBasicTick: number
  nextAutoTick: number
  cast: CombatCast | null
  passive: CombatPassiveState

  /** Ephemeral optional state; absent in older battle JSON. */
  damageDealt?: number
  debuffImmune?: boolean
  muoiMarks?: Record<string, MuoiMark>
  summoned?: boolean
  nhienSequence?: NhienSequence
  nhienRecoveryUntilTick?: number
  nhienRhythm?: NhienRhythm
  bossKit?: ForgottenHostState
}

export interface CombatBattle {
  rulesVersion: 1
  tuningId: "aw2-combat-development-v1"
  id: string
  tick: number
  status: CombatStatus
  actors: CombatActor[]
  effects: CombatEffect[]
  events: CombatEvent[]
  eventSerial: number
  actionSerial: number
}

export interface CombatUnitSeed {
  id: string
  spiritId: string
  boss?: boolean

  bossProfile?: "aw2-forgotten-host-development-v2"
  debuffImmune?: boolean
  summoned?: boolean
  controlImmune?: boolean
  position?: number
  hp?: number
  maxHp?: number
  attack?: number
  defense?: number
  range?: number
  moveSpeed?: number
  projectileTicks?: number
  energy?: number
  nextBasicTick?: number
  nextAutoTick?: number
}

export interface CreateCombatBattleInput {
  id: string
  players: CombatUnitSeed[]
  enemies: CombatUnitSeed[]
}
