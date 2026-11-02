import type {
  CombatActor,
  CombatBattle,
  CombatUnitSeed,
  ForgottenHostState,
} from "./types"

export const FORGOTTEN_HOST_ID = "aw2-enemy-forgotten-host"
export const FORGOTTEN_HOST_PROFILE =
  "aw2-forgotten-host-development-v2" as const
export function createForgottenHostSeed(): CombatUnitSeed {
  return {
    id: FORGOTTEN_HOST_ID,
    spiritId: FORGOTTEN_HOST_ID,
    boss: true,
    bossProfile: FORGOTTEN_HOST_PROFILE,
    hp: 1000,
    maxHp: 1000,
    attack: 135,
    defense: 14,
    position: 82,
    range: 8,
    nextBasicTick: 2,
  }
}
export const FORGOTTEN_HOST_SKILLS = {
  sweep: {
    id: `${FORGOTTEN_HOST_ID}:skill:missed-invitation`,
    name: "Mời hụt",
  },
  snuff: { id: `${FORGOTTEN_HOST_ID}:skill:snuff-hearth`, name: "Tắt bếp" },
  barrier: { id: `${FORGOTTEN_HOST_ID}:skill:empty-chair`, name: "Ghế trống" },
} as const

export function newForgottenHostState(): ForgottenHostState {
  return {
    profile: FORGOTTEN_HOST_PROFILE,
    nextSkillTick: 3,
    phase: 0,
    barrierHits: 0,
    barrierExpiresAtTick: 0,
    intent: null,
  }
}

/** Same current eligibility used by rules and telegraph UI; not a result prediction. */
export function forgottenHostTargets(
  battle: CombatBattle,
  source: CombatActor,
): CombatActor[] {
  const intent = source.bossKit?.intent
  if (!intent || source.hp <= 0 || battle.status !== "active") return []
  return battle.actors.filter(
    (actor) =>
      actor.hp > 0 &&
      actor.side !== source.side &&
      Math.abs(actor.position - intent.areaCenter) <= intent.areaRadius,
  )
}
