import { campaignQuestResult } from "../campaign/expanded"
import { commitTacticalProgress, readTacticalProgress } from "./storage"
import type { StorageLike } from "./schema"

/** Reads the authoritative local checkpoint; callers cannot submit arbitrary quest counters. */
export function claimCampaignQuest(storage: StorageLike) {
  const current = readTacticalProgress(storage),
    battle = current.checkpoint
  if (!battle || battle.mode === "pvp")
    throw Error("Chưa có kết quả thử thách chiến dịch.")
  const quest = campaignQuestResult(battle)
  if (!quest?.complete)
    throw Error("Chưa đạt mục tiêu thử thách; bạn có thể đấu lại.")
  return commitTacticalProgress(storage, {
    receiptId: quest.id,
    tinhVi: quest.reward,
  })
}
