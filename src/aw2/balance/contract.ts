import {
  COMBAT_KITS,
  STARTER_SPIRIT_IDS,
  type CombatKit,
} from "../combat/roster"
import {
  DEVELOPMENT_LEVELING_ID,
  DEVELOPMENT_STAT_GROWTH,
  LEVEL_EXPERIENCE_CURVE,
  MAX_DEVELOPMENT_LEVEL,
} from "../combat/progression"
import {
  CHEST_REWARD,
  ECONOMY_TUNING_ID,
  QUEST_REWARDS,
  SHARE_MEAL_EXPERIENCE,
  WARM_BOWL_RECIPE,
} from "../economy/model"
import {
  DUPLICATE_SHARDS,
  GACHA_BASE_RATES,
  GACHA_PROPOSAL_ID,
  GACHA_PROPOSAL_STATUS,
  GACHA_RUNTIME_CAPABILITIES,
  PITY_LIMITS,
  TIERS,
  WEIGHTS,
} from "../gacha/proposal"

export const BALANCE_CONTRACT_ID = "aw2-balance-development-v1" as const
export const BALANCE_CONTRACT_STATUS = "DEVELOPMENT_FROZEN" as const
export const COMBAT_GUARDRAILS = {
  hp: [100, 300],
  attack: [20, 50],
  defense: [5, 35],
  range: [1, 50],
  moveSpeed: [1, 12],
  basicCooldown: [1, 12],
  autoCooldown: [1, 15],
  autoCastTicks: [1, 4],
  ultimateCastTicks: [1, 4],
  projectileTicks: [0, 4],
} as const

function kitSnapshot(kit: CombatKit) {
  return {
    spiritId: kit.spiritId,
    role: kit.role,
    hp: kit.hp,
    attack: kit.attack,
    defense: kit.defense,
    range: kit.range,
    moveSpeed: kit.moveSpeed,
    projectileTicks: kit.projectileTicks,
    basicCooldown: kit.basicCooldown,
    autoCooldown: kit.autoCooldown,
    autoCastTicks: kit.autoCastTicks,
    ultimateCastTicks: kit.ultimateCastTicks,
  }
}

export function developmentBalanceSnapshot() {
  return {
    contractId: BALANCE_CONTRACT_ID,
    status: BALANCE_CONTRACT_STATUS,
    combat: {
      starters: [...STARTER_SPIRIT_IDS],
      kits: Object.values(COMBAT_KITS)
        .map(kitSnapshot)
        .sort((left, right) => left.spiritId.localeCompare(right.spiritId)),
      guardrails: COMBAT_GUARDRAILS,
    },
    progression: {
      tuningId: DEVELOPMENT_LEVELING_ID,
      maxLevel: MAX_DEVELOPMENT_LEVEL,
      experienceCurve: LEVEL_EXPERIENCE_CURVE,
      statGrowth: DEVELOPMENT_STAT_GROWTH,
    },
    economy: {
      tuningId: ECONOMY_TUNING_ID,
      questRewards: QUEST_REWARDS,
      chestReward: CHEST_REWARD,
      warmBowlRecipe: WARM_BOWL_RECIPE,
      shareMealExperience: SHARE_MEAL_EXPERIENCE,
    },
    gacha: {
      proposalId: GACHA_PROPOSAL_ID,
      status: GACHA_PROPOSAL_STATUS,
      tiers: TIERS,
      weights: WEIGHTS,
      baseRatesPercent: GACHA_BASE_RATES,
      pityLimits: PITY_LIMITS,
      duplicateShards: DUPLICATE_SHARDS,
      runtime: GACHA_RUNTIME_CAPABILITIES,
    },
  }
}

export type DevelopmentBalanceSnapshot = ReturnType<typeof developmentBalanceSnapshot>

export function serializeDevelopmentBalance(
  snapshot: DevelopmentBalanceSnapshot = developmentBalanceSnapshot(),
): string {
  return JSON.stringify(snapshot)
}

export function validateDevelopmentBalance(
  snapshot: DevelopmentBalanceSnapshot = developmentBalanceSnapshot(),
): string[] {
  const issues: string[] = []
  if (snapshot.contractId !== BALANCE_CONTRACT_ID)
    issues.push("Balance contract ID không khớp.")
  if (snapshot.status !== BALANCE_CONTRACT_STATUS)
    issues.push("Balance contract chưa ở trạng thái development frozen.")

  const kitIds = snapshot.combat.kits.map((kit) => kit.spiritId)
  if (kitIds.length !== 12 || new Set(kitIds).size !== 12)
    issues.push("Combat phải có đúng 12 kit duy nhất.")
  if (
    snapshot.combat.starters.length !== 5 ||
    new Set(snapshot.combat.starters).size !== 5 ||
    snapshot.combat.starters.some((id) => !kitIds.includes(id))
  )
    issues.push("Starter phải là năm kit duy nhất thuộc roster.")

  for (const kit of snapshot.combat.kits) {
    for (const [field, bounds] of Object.entries(COMBAT_GUARDRAILS)) {
      const value = kit[(field as keyof typeof kit)]
      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < bounds[0] ||
        value > bounds[1]
      )
        issues.push(`${kit.spiritId}.${field} nằm ngoài guardrail.`)
    }
  }

  if (
    snapshot.progression.maxLevel !== MAX_DEVELOPMENT_LEVEL ||
    Object.values(snapshot.progression.experienceCurve).some(
      (value) => !Number.isFinite(value) || value <= 0,
    ) ||
    Object.values(snapshot.progression.statGrowth).some(
      (value) => !Number.isFinite(value) || value <= 0,
    )
  )
    issues.push("Progression curve không hợp lệ.")
  if (snapshot.economy.questRewards.length !== 4)
    issues.push("Economy phải có đúng bốn quest reward.")
  if (
    snapshot.gacha.status !== GACHA_PROPOSAL_STATUS ||
    snapshot.gacha.tiers.join(",") !== "N,R,SR,SSR,UR" ||
    snapshot.gacha.weights.reduce((sum, value) => sum + value, 0) !== 10000 ||
    snapshot.gacha.duplicateShards.length !== snapshot.gacha.tiers.length ||
    snapshot.gacha.pityLimits.sr !== 10 ||
    snapshot.gacha.pityLimits.ssr !== 80 ||
    snapshot.gacha.pityLimits.ur !== 200
  )
    issues.push("Đề xuất gacha D11 không nhất quán.")
  if (Object.values(snapshot.gacha.runtime).some(Boolean))
    issues.push("Đề xuất gacha không được bật capability runtime.")
  return issues
}
