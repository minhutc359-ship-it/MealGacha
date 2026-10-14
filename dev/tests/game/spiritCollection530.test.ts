import { describe, it, expect, vi } from "vitest";
import { applyOpenChest } from "@/domain/drawReward";
import { collectedSpiritCards, chestSpiritCard } from "@/domain/spiritCollection";
import { migrateUserState, repository } from "@/infrastructure/storage/repository";
import type { RewardInstance } from "@/domain/models";
import { SEED_DISHES } from "@/infrastructure/catalog/seedCatalog";
function reward(id: string, source: "chest" | "fusion" = "chest", status: "consumed" | "available" = "available"): RewardInstance { return { id: crypto.randomUUID(), dishId: id, dish: { id, name: id, searchQuery: id }, source, status, acquiredAt: "2026-10-14T00:00:00Z", acquiredDate: "2026-10-14", mealSlot: "lunch", favorite: false }; }
describe("5.3 food-chest card ledger", () => {
    it("migrates consumed and fresh historical chest cards once, excludes fusion and keeps spendable food fragments", () => {
        const u = repository.loadUser();
        u.keys = 93;
        u.fragments = { "pho-bo": 7 };
        delete u.spiritCards;
        u.rewards = [reward("pho-bo"), reward("pho-bo", "chest", "consumed"), reward("pho-bo", "fusion"), reward("chef-hai")];
        const next = migrateUserState(u)!;
        expect(next.spiritCards).toEqual({ "pho-bo": 2, "chef-hai": 1 });
        expect(next.keys).toBe(93);
        expect(next.fragments).toEqual(u.fragments);
        expect(next.rewards).toEqual(u.rewards);
        expect(migrateUserState(next)).toEqual(next);
        next.rewards = [];
        expect(collectedSpiritCards(next)).toEqual({ "pho-bo": 2, "chef-hai": 1 });
    });
    it("commits a named spirit card, one key charge and a durable counter in the same chest transaction", () => {
        const u = repository.loadUser();
        u.keys = 10;
        u.spiritCards = { "chef-hai": 3 };
        u.spiritWish = "chef-hai";
        u.spiritPity = 4;
        const original = structuredClone(u), r = applyOpenChest(u, SEED_DISHES, "lunch");
        expect(u).toEqual(original);
        expect(r.reward.spiritCardId).toBe("chef-hai");
        expect(r.state.spiritCards).toEqual({ "chef-hai": 4 });
        expect(r.state.spiritPity).toBe(0);
        expect(r.state.keys).toBe(9);
        expect(r.state.rewards.at(-1)).toEqual(r.reward);
        expect(r.state.keyTransactions.filter(t => t.referenceId === r.reward.id)).toHaveLength(1);
        expect(migrateUserState(JSON.parse(JSON.stringify(r.state)))!.spiritCards).toEqual(r.state.spiritCards);
    });
    it("guarantees every fifth draw for the selected wish while preserving the rhythm across a wish change", () => {
        let u = repository.loadUser();
        u.keys = 20;
        u.spiritWish = "chef-nhien";
        u.spiritPity = 0;
        for (let i = 0; i < 4; i++)
            u = applyOpenChest(u, SEED_DISHES, "lunch").state;
        expect(u.spiritPity).toBe(4);
        u.spiritWish = "chef-lien";
        const fifth = applyOpenChest(u, SEED_DISHES, "lunch");
        expect(fifth.reward.spiritCardId).toBe("chef-lien");
        expect(fifth.state.spiritPity).toBe(0);
    });
    it("counts the actual new spirit reward rather than the food and never credits a fusion", () => {
        const r = reward("pho-bo");
        r.spiritCardId = "chef-moc";
        expect(collectedSpiritCards({ rewards: [r], spiritCards: undefined })).toEqual({ "chef-moc": 1 });
        expect(chestSpiritCard({ ...r, source: "fusion" })).toBeNull();
    });
});
