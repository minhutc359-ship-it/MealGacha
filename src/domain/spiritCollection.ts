import type { RewardInstance, UserState } from "./models";
import { SPIRIT_RARITY, SPIRIT_THRESHOLDS } from "./spiritSummons";
/** The ledger counts chest cards, including consumed food rewards, without spending them. */
export function collectedSpiritCards(user: Pick<UserState, "rewards" | "spiritCards">): Record<string, number> {
    if (user.spiritCards)
        return user.spiritCards;
    const cards: Record<string, number> = {};
    for (const reward of user.rewards) {
        if (reward.source !== "chest")
            continue;
        // Before 5.3 the food card itself was the only chest card.
        const id = reward.spiritCardId ?? reward.dishId;
        if (SPIRIT_RARITY[id])
            cards[id] = Math.min(1000000000, (cards[id] ?? 0) + 1);
    }
    return cards;
}
export function spiritProgress(id: string, cards: Record<string, number>) {
    const needed = SPIRIT_THRESHOLDS[SPIRIT_RARITY[id]] ?? 45;
    const collected = cards[id] ?? 0;
    return { collected, needed, ready: collected >= needed };
}
export function chestSpiritCard(reward: RewardInstance) {
    return reward.source === "chest" ? reward.spiritCardId ?? (SPIRIT_RARITY[reward.dishId] ? reward.dishId : null) : null;
}
