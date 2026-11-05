import { writeFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  TACTICAL_CAMPAIGN_NODES,
  isCampaignNodeAvailable,
} from "@/game/tacticalTcg/campaign"
import { TACTICAL_SCENES } from "@/game/tacticalTcg/campaign/story"
import { campaignQuestResult } from "@/game/tacticalTcg/campaign/expanded"
import { TACTICAL_DECK_LIBRARY } from "@/game/tacticalTcg/deckLibrary"
import { tacticalDeckErrors } from "@/game/tacticalTcg/cards"
import { createTacticalBattle } from "@/game/tacticalTcg/engine"
import { validTacticalCheckpoint } from "@/game/tacticalTcg/progression/checkpoint"
import {
  claimCampaignQuest,
  ensureTacticalAccount,
  saveTacticalCheckpoint,
} from "@/game/tacticalTcg/progression"
import { driveDuel } from "./helpers/duelDriver"
class MemoryStorage {
  data = new Map<string, string>()
  getItem(k: string) {
    return this.data.get(k) ?? null
  }
  setItem(k: string, v: string) {
    this.data.set(k, v)
  }
  removeItem(k: string) {
    this.data.delete(k)
  }
}
describe("Expanded journey and free bot ladder", () => {
  it("has24reachable nodes,12boss encounters and16authored optional quest scenes", () => {
    expect(TACTICAL_CAMPAIGN_NODES).toHaveLength(24)
    expect(
      TACTICAL_CAMPAIGN_NODES.filter((n) => n.kind === "boss"),
    ).toHaveLength(12)
    const completed: string[] = []
    for (let step = 0; step < 24; step++) {
      const next = TACTICAL_CAMPAIGN_NODES.find(
        (n) =>
          !completed.includes(n.id) && isCampaignNodeAvailable(n, completed),
      )
      expect(next).toBeTruthy()
      completed.push(next!.id)
    }
    for (const n of TACTICAL_CAMPAIGN_NODES) {
      expect(TACTICAL_SCENES[n.id].before.length).toBeGreaterThanOrEqual(2)
      expect(TACTICAL_SCENES[n.id].after.length).toBeGreaterThanOrEqual(2)
      if (n.battle) expect(tacticalDeckErrors(n.battle.enemyDeck!)).toEqual([])
    }
    expect(TACTICAL_CAMPAIGN_NODES.filter((n) => n.quest)).toHaveLength(16)
  })
  it("all10recipes are legal and every bot difficulty finishes by legal actions without resource cheats", () => {
    expect(TACTICAL_DECK_LIBRARY).toHaveLength(10)
    for (const d of TACTICAL_DECK_LIBRARY) {
      expect(tacticalDeckErrors(d.cards)).toEqual([])
      expect(d.weakness).toBeTruthy()
    }
    const results = []
    for (const botLevel of ["normal", "hard", "extreme"] as const)
      for (const d of TACTICAL_DECK_LIBRARY) {
        const start = createTacticalBattle({
          battleId: `bot:${botLevel}:${d.id}`,
          manual: true,
          duel: true,
          mode: "pvp",
          deck: d.cards,
          enemyDeck: TACTICAL_DECK_LIBRARY[2].cards,
          botLevel,
          seed: 11,
        })
        expect(start.cardGame!.sides.enemy.maxMana).toBe(3)
        const result = driveDuel(start, (s) =>
          expect(validTacticalCheckpoint(s)).toBe(true),
        )
        expect(result.winner, `${botLevel}:${d.id}`).toBeTruthy()
        expect(result.reward?.tinhVi ?? 0).toBe(0)
        results.push({
          level: botLevel,
          deck: d.id,
          winner: result.winner,
          round: result.round,
        })
      }
    if (process.env.TCG_WRITE_EVIDENCE)
      writeFileSync(
        ".asset-work/tcg011-bot-games.json",
        JSON.stringify(results, null, 2),
      )
  }, 120000)
  it("every campaign encounter has a legal winning route with an owned-recipe fixture", () => {
    const results = []
    for (const n of TACTICAL_CAMPAIGN_NODES.filter((n) => n.battle)) {
      let winner = false,
        attempts = 0
      const outcomes = []
      for (const recipe of TACTICAL_DECK_LIBRARY) {
        const start = createTacticalBattle({
          ...n.battle,
          battleId: `journey:${n.id}:${attempts}`,
          nodeId: n.id,
          deck: recipe.cards,
          duel: true,
          manual: true,
        })
        const result = driveDuel(start, (s) =>
          expect(validTacticalCheckpoint(s)).toBe(true),
        )
        attempts++
        outcomes.push({
          deck: recipe.id,
          winner: result.winner,
          round: result.round,
          hp: result.commanders,
          units: result.units,
          log: result.log,
        })
        if (result.winner === "player") {
          winner = true
          results.push({
            node: n.id,
            deck: recipe.id,
            round: result.round,
            quest: campaignQuestResult(result)?.complete ?? null,
          })
          break
        }
      }
      if (!winner) {
        writeFileSync(
          ".asset-work/tcg011-unsolved.json",
          JSON.stringify({ node: n.id, outcomes }, null, 2),
        )
        console.info("UNSOLVED", n.id)
      }
      expect(winner, n.id).toBe(true)
    }
    if (process.env.TCG_WRITE_EVIDENCE)
      writeFileSync(
        ".asset-work/tcg011-journey-games.json",
        JSON.stringify(results, null, 2),
      )
  }, 120000)
  it("quest rewards read actual saved outcomes and remain exact-once after reload", () => {
    const storage = new MemoryStorage()
    ensureTacticalAccount(storage)
    expect(() => claimCampaignQuest(storage)).toThrow()
    const start = createTacticalBattle({
      battleId: "quest-win",
      nodeId: "side-market-names",
      manual: true,
      duel: true,
      deck: TACTICAL_DECK_LIBRARY[2].cards,
      seed: 3,
    })
    const result = driveDuel(start)
    expect(result.winner).toBe("player")
    expect(result.commanders.player.hp).toBeGreaterThanOrEqual(10)
    saveTacticalCheckpoint(storage, result, null)
    const first = claimCampaignQuest(storage),
      raw = [...storage.data.entries()]
    expect(first.status).toBe("committed")
    expect(claimCampaignQuest(storage).status).toBe("duplicate")
    expect([...storage.data.entries()]).toEqual(raw)
  })
})
