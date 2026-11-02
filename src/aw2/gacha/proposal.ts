/**
 * D11 is proposal metadata only. This module is safe to render as disclosure;
 * it deliberately has no draw, currency, purchase, storage or save operation.
 */
export const GACHA_PROPOSAL_ID = "aw2-d11-simulation-v1" as const
export const GACHA_PROPOSAL_STATUS = "PROPOSED_NOT_APPROVED" as const
export const TIERS = ["N", "R", "SR", "SSR", "UR"] as const
export const WEIGHTS = [5500, 3000, 1100, 350, 50] as const
export const DUPLICATE_SHARDS = [1, 3, 8, 20, 50] as const
export const PITY_LIMITS = { sr: 10, ssr: 80, ur: 200 } as const
export const GACHA_RUNTIME_CAPABILITIES = {
  draw: false,
  spend: false,
  purchase: false,
  savePity: false,
  storyGate: false,
} as const

export const GACHA_BASE_RATES = Object.freeze(
  Object.fromEntries(
    TIERS.map((tier, index) => [tier, WEIGHTS[index] / 100]),
  ) as Record<typeof TIERS[number], number>,
)
