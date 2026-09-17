import { RewardInstance } from "./models"

export function getVisibleRewards(
  rewards: RewardInstance[],
  pendingRevealRewardId: string | null,
): RewardInstance[] {
  if (!pendingRevealRewardId) return rewards
  return rewards.filter((reward) => reward.id !== pendingRevealRewardId)
}
