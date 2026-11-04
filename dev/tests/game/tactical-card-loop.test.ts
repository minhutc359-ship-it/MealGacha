import { describe, expect, it } from "vitest"
import { existsSync, writeFileSync } from "node:fs"
import { CARDS } from "@/game/catalog"
import {
  TACTICAL_CARDS,
  TACTICAL_CARD_MAP,
  TACTICAL_STARTER,
  ownedTacticalCards,
  tacticalDeckErrors,
} from "@/game/tacticalTcg/cards"
import {
  createTacticalBattle,
  playAutomaticRound,
  reduceTacticalBattle,
  type TacticalBattleState,
} from "@/game/tacticalTcg/engine"
import { emptyCardCell } from "@/game/tacticalTcg/engine/cardRuntime"
import { TACTICAL_CAMPAIGN_NODES } from "@/game/tacticalTcg/campaign"
import { TACTICAL_SCENES } from "@/game/tacticalTcg/campaign/story"
import {
  migrateTacticalStorage,
  TACTICAL_PROFILE_KEY,
} from "@/game/tacticalTcg/migration"
import {
  claimBattleReward,
  claimTacticalDaily,
  commitTacticalProgress,
  craftTacticalCard,
  ensureTacticalAccount,
  openTacticalPack,
  readTacticalProgress,
  saveTacticalCheckpoint,
  saveTacticalDeck,
  TACTICAL_PROGRESS_KEY,
} from "@/game/tacticalTcg/progression"

class MemoryStorage {
  data = new Map<string, string>()
  fail = false
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string) {
    if (this.fail && key === TACTICAL_PROGRESS_KEY) throw Error("quota")
    this.data.set(key, value)
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
}
function prepare() {
  const storage = new MemoryStorage()
  migrateTacticalStorage(storage)
  ensureTacticalAccount(storage)
  return storage
}

/** Plays only public legal commands, never edits HP, energy or results. */
export function playLegalCardMatch(initial: TacticalBattleState, strategy = 0) {
  let state = initial,
    serial = 0
  if (strategy >= 3)
    state = reduceTacticalBattle(state, {
      id: "test-mulligan",
      type: "mulligan",
    })
  for (let tick = 0; tick < 70 && state.phase !== "result"; tick++) {
    if (state.phase === "planning") {
      for (let play = 0; play < 8; play++) {
        let changed = false
        const hand = state.cardGame!.sides.player.hand
        const indices = hand
          .map((_, i) => i)
          .sort((a, b) => {
            const ca = TACTICAL_CARD_MAP[hand[a]],
              cb = TACTICAL_CARD_MAP[hand[b]]
            const hasAllies = state.units.some(
              (u) => u.side === "player" && !u.defeated,
            )
            const priority = (c: typeof ca) =>
              strategy % 3 === 2 && hasAllies && c.tacticalEffect === "buff"
                ? 4
                : c.kind === "unit"
                  ? 3
                  : c.tacticalEffect === "damage"
                    ? 2
                    : 1
            return (
              priority(cb) - priority(ca) ||
              (strategy % 3 === 1 ? cb.cost - ca.cost : ca.cost - cb.cost)
            )
          })
        for (const handIndex of indices) {
          const card = TACTICAL_CARD_MAP[hand[handIndex]]
          const same = state.units.find(
            (u) =>
              u.side === "player" &&
              !u.defeated &&
              u.cardId === card.id &&
              u.star === 1,
          )
          const target =
            card.tacticalEffect === "buff"
              ? state.units
                  .filter((u) => u.side === "player" && !u.defeated)
                  .sort((a, b) => b.attack - a.attack)[0]
              : card.tacticalEffect === "damage"
                ? state.units
                    .filter((u) => u.side === "enemy" && !u.defeated)
                    .sort((a, b) =>
                      strategy === 1 ? b.attack - a.attack : a.hp - b.hp,
                    )[0]
                : undefined
          const next = reduceTacticalBattle(state, {
            id: `test:${serial++}`,
            type: "play-card",
            side: "player",
            handIndex,
            cell:
              same?.cell ??
              emptyCardCell(
                state,
                "player",
                card.tacticalRole !== "guardian",
              ) ??
              undefined,
            column: 0,
            targetId: target?.instanceId,
          })
          if (next !== state) {
            state = next
            changed = true
            break
          }
        }
        if (!changed || state.phase === "result") break
      }
    } else {
      for (const unit of state.units.filter(
        (u) => u.side === "player" && !u.defeated && u.energy >= 100,
      ))
        state = reduceTacticalBattle(state, {
          id: `test-ult:${serial++}`,
          type: "ultimate",
          unitId: unit.instanceId,
        })
    }
    if (state.phase !== "result") state = playAutomaticRound(state)
  }
  return state
}

describe("restored Tactical card loop", () => {
  it("retains every original card ID, artwork and lore with explicit Tactical rules", () => {
    expect(TACTICAL_CARDS.map((c) => c.id)).toEqual(CARDS.map((c) => c.id))
    for (const card of TACTICAL_CARDS) {
      expect(card.text.length).toBeGreaterThan(20)
      expect(card.lore).toBeTruthy()
      expect(card.art).toBeTruthy()
      expect(existsSync(`public${card.art}`), card.art).toBe(true)
    }
  })
  it("recovers a legal starter once and keeps migrated decks unchanged", () => {
    const storage = new MemoryStorage()
    migrateTacticalStorage(storage)
    const profile = JSON.parse(storage.getItem(TACTICAL_PROFILE_KEY)!)
    profile.tcg = {
      decks: [
        {
          id: "old-deck",
          name: "Bộ bài xưa",
          cards: TACTICAL_STARTER.slice(0, 18),
        },
      ],
      activeDeckId: "old-deck",
      packTickets: 3,
      dust: 55,
    }
    storage.setItem(TACTICAL_PROFILE_KEY, JSON.stringify(profile))
    const first = ensureTacticalAccount(storage),
      second = ensureTacticalAccount(storage)
    expect(second).toEqual(first)
    expect(first.decks[0].cards).toEqual(TACTICAL_STARTER.slice(0, 18))
    expect(first.packTickets).toBe(5)
    expect(first.tinhVi).toBe(55)
    expect(
      tacticalDeckErrors(
        first.decks.find((d) => d.id === first.activeDeckId)!.cards,
        ownedTacticalCards(first.cardCopies),
      ),
    ).toEqual([])
  })
  it("opens a durable five-card pack once, with a rare guarantee and duplicate conversion", () => {
    const storage = prepare(),
      first = openTacticalPack(storage, "origin", "stable-id", () => 0.99)
    expect(first.receipt.cards).toHaveLength(5)
    expect(
      first.receipt.cards.some(
        (id) => TACTICAL_CARD_MAP[id].rarity !== "common",
      ),
    ).toBe(true)
    expect(first.progress.packTickets).toBe(1)
    expect(openTacticalPack(storage, "origin", "stable-id").progress).toEqual(
      first.progress,
    )
    expect(
      Object.values(ownedTacticalCards(first.progress.cardCopies)).every(
        (n) => n <= 2,
      ),
    ).toBe(true)
    expect(first.receipt.duplicateTinhVi).toBeGreaterThan(0)
  })
  it("guarantees Epic by pack eight and never charges when storage fails", () => {
    const storage = prepare()
    let progress = readTacticalProgress(storage)
    progress.packTickets = 8
    storage.setItem(TACTICAL_PROGRESS_KEY, JSON.stringify(progress))
    for (let i = 0; i < 8; i++)
      progress = openTacticalPack(
        storage,
        "origin",
        `pity-${i}`,
        () => 0.99,
      ).progress
    expect(
      progress.lastPack!.cards.some((id) =>
        ["epic", "legendary"].includes(TACTICAL_CARD_MAP[id].rarity),
      ),
    ).toBe(true)
    expect(progress.packPity).toBe(0)
    const before = storage.getItem(TACTICAL_PROGRESS_KEY)
    storage.fail = true
    expect(() => claimTacticalDaily(storage)).toThrow()
    expect(storage.getItem(TACTICAL_PROGRESS_KEY)).toBe(before)
  })
  it("rejects unavailable crafts and illegal decks without spending", () => {
    const storage = prepare(),
      before = readTacticalProgress(storage)
    expect(() => craftTacticalCard(storage, "chef-bach")).toThrow("Không đủ")
    expect(() =>
      saveTacticalDeck(storage, {
        id: "bad",
        name: "Bad",
        cards: Array(24).fill("spark"),
      }),
    ).toThrow()
    expect(readTacticalProgress(storage)).toEqual(before)
  })
  it("starts with the selected 24-card deck, four drawn cards and an empty player board", () => {
    const battle = createTacticalBattle({
      battleId: "real-deck",
      deck: TACTICAL_STARTER,
      seed: 9,
    })
    expect(battle.units.filter((u) => u.side === "player")).toHaveLength(0)
    expect(battle.commanders.player.hp).toBe(30)
    expect(battle.cardGame!.sides.player.hand).toHaveLength(4)
    expect(battle.cardGame!.sides.player.deck).toHaveLength(20)
    expect(battle.cardGame!.sides.player.mana).toBe(3)
    expect(battle).toEqual(
      createTacticalBattle({
        battleId: "real-deck",
        deck: TACTICAL_STARTER,
        seed: 9,
      }),
    )
  })
  it("enforces card cost, board cells, one move and one basic attack per round", () => {
    const initial = createTacticalBattle({
      battleId: "legal-commands",
      deck: TACTICAL_STARTER,
      seed: 1,
    })
    let battle = initial
    const index = battle.cardGame!.sides.player.hand.findIndex(
      (id) =>
        TACTICAL_CARD_MAP[id].kind === "unit" &&
        TACTICAL_CARD_MAP[id].cost <= 3,
    )
    expect(index).toBeGreaterThanOrEqual(0)
    const played = reduceTacticalBattle(battle, {
      id: "summon",
      type: "play-card",
      side: "player",
      handIndex: index,
      cell: { row: 0, column: 0 },
    })
    expect(played.units.some((u) => u.side === "player")).toBe(true)
    expect(
      reduceTacticalBattle(played, {
        id: "summon",
        type: "play-card",
        side: "player",
        handIndex: index,
        cell: { row: 0, column: 1 },
      }),
    ).toBe(played)
    battle = reduceTacticalBattle(played, { id: "begin", type: "begin-round" })
    const unit = battle.units.find((u) => u.side === "player")!
    battle = reduceTacticalBattle(battle, {
      id: "basic-1",
      type: "basic",
      unitId: unit.instanceId,
    })
    expect(
      reduceTacticalBattle(battle, {
        id: "basic-2",
        type: "basic",
        unitId: unit.instanceId,
      }),
    ).toBe(battle)
    expect(initial.units).toHaveLength(0)
  })
  it("requires a real trap card, charges mana and preserves a failed action", () => {
    const initial = Array.from({ length: 200 }, (_, i) =>
      createTacticalBattle({
        battleId: "trap-card",
        deck: TACTICAL_STARTER,
        seed: i + 1,
      }),
    ).find((s) => s.cardGame!.sides.player.hand.includes("trap-ward"))!
    const index = initial.cardGame!.sides.player.hand.indexOf("trap-ward")
    expect(
      reduceTacticalBattle(initial, {
        id: "free",
        type: "place-trap",
        side: "player",
        trapId: "bamboo-guard",
        column: 0,
      }),
    ).toBe(initial)
    const armed = reduceTacticalBattle(initial, {
      id: "paid",
      type: "play-card",
      side: "player",
      handIndex: index,
      column: 2,
    })
    expect(armed.traps[0]).toMatchObject({
      cardId: "trap-ward",
      column: 2,
      armed: true,
    })
    expect(armed.cardGame!.sides.player.mana).toBe(1)
    expect(armed.cardGame!.sides.player.hand.length).toBe(
      initial.cardGame!.sides.player.hand.length - 1,
    )
    expect(
      reduceTacticalBattle(armed, {
        id: "bad-index",
        type: "play-card",
        side: "player",
        handIndex: 99,
      }),
    ).toBe(armed)
  })
  it("resolves entry draw, spell passives and a same-school recipe through real cards", () => {
    const custom = [...TACTICAL_STARTER].map((id) =>
      id === "banh-mi" ? "bun-rieu" : id,
    )
    const initial = Array.from({ length: 1500 }, (_, i) =>
      createTacticalBattle({ battleId: "passive", deck: custom, seed: i + 1 }),
    ).find((s) =>
      ["bun-rieu", "caravan-scout", "spark"].every((id) =>
        s.cardGame!.sides.player.hand.includes(id),
      ),
    )!
    expect(initial).toBeDefined()
    let battle = initial
    for (const [id, column] of [
      ["bun-rieu", 0],
      ["caravan-scout", 1],
      ["spark", 0],
    ] as const) {
      battle = reduceTacticalBattle(battle, {
        id: `play-${id}`,
        type: "play-card",
        side: "player",
        handIndex: battle.cardGame!.sides.player.hand.indexOf(id),
        cell: { row: 1, column },
      })
    }
    const scout = battle.units.find((u) => u.cardId === "caravan-scout")!
    expect(scout.attack).toBe(TACTICAL_CARD_MAP["caravan-scout"].attack + 6)
    expect(scout.shield).toBeGreaterThanOrEqual(10)
    expect(battle.commanders.enemy.hp).toBe(28)
    expect(battle.cardGame!.sides.player.mana).toBe(0)
  })
  it("persists real mid-battle hands and rewards across reload", () => {
    const storage = prepare()
    const battle = playAutomaticRound(
      createTacticalBattle({ battleId: "checkpoint", deck: TACTICAL_STARTER }),
    )
    saveTacticalCheckpoint(storage, battle)
    expect(readTacticalProgress(storage).checkpoint).toEqual(battle)
    expect(battle.phase).not.toBe("result")
    const won = playLegalCardMatch(
      createTacticalBattle({
        battleId: "earned",
        deck: TACTICAL_STARTER,
        seed: 101,
      }),
    )
    expect(won.phase).toBe("result")
    if (won.reward) {
      claimBattleReward(storage, won.reward)
      const once = readTacticalProgress(storage)
      claimBattleReward(storage, won.reward)
      expect(readTacticalProgress(storage)).toEqual(once)
    }
  })
  it("all campaign encounters terminate using legal card commands and authored stories", () => {
    const storage = prepare()
    let deck = [...TACTICAL_STARTER]
    const results = TACTICAL_CAMPAIGN_NODES.filter((n) => n.battle).map(
      (node) => {
        expect(TACTICAL_SCENES[node.id].before).toHaveLength(2)
        const owned = ownedTacticalCards(
          readTacticalProgress(storage).cardCopies,
        )
        const improved = [...deck]
        for (const id of [
          "chef-hai",
          "chef-bach",
          "recipe-scroll",
          "family-table",
          "chef-lien",
        ]) {
          if (!(owned[id] > 0) || improved.includes(id)) continue
          const replace = improved.findIndex(
            (c) =>
              TACTICAL_CARD_MAP[c].kind === TACTICAL_CARD_MAP[id].kind &&
              TACTICAL_CARD_MAP[c].cost < TACTICAL_CARD_MAP[id].cost,
          )
          if (replace >= 0) improved[replace] = id
        }
        expect(tacticalDeckErrors(improved, owned)).toEqual([])
        const attempts = [deck, improved].flatMap((cards) =>
          [0, 1, 2, 3, 4, 5].map((strategy) =>
            playLegalCardMatch(
              createTacticalBattle({
                ...node.battle!,
                battleId: `sim:${node.id}`,
                nodeId: node.id,
                deck: cards,
              }),
              strategy,
            ),
          ),
        )
        for (const finished of attempts) {
          expect(finished.phase, node.id).toBe("result")
          expect(finished.cardGame!.sides.player.mana).toBeGreaterThanOrEqual(0)
        }
        const won = attempts.find((s) => s.winner === "player")
        if (won?.reward)
          claimBattleReward(storage, won.reward, node.mangaChapterId)
        if (attempts.slice(6).some((s) => s.winner === "player"))
          deck = improved
        if (node.id === "act-3-regent")
          commitTacticalProgress(storage, {
            receiptId: "story:act-4-vow",
            completedNodeId: "act-4-vow",
            campaignChoice: { nodeId: "act-4-vow", choice: "share" },
          })
        return {
          node: node.id,
          winner: won?.winner ?? "enemy",
          outcomes: attempts.map((s) => `${s.winner}:${s.round}`),
        }
      },
    )
    console.info("Campaign legal-command simulation", JSON.stringify(results))
    expect(results.filter((r) => r.winner !== "player")).toEqual([])
    expect(readTacticalProgress(storage).completedCampaignNodes).toHaveLength(8)
    if (process.env.TCG_WRITE_EVIDENCE === "1")
      writeFileSync(
        "docs/tactical-tcg/evidence/TCG-005-simulation.json",
        JSON.stringify(
          {
            base: "32e089cac3a344b760ba110cd415f5326d956afd",
            catalogCards: TACTICAL_CARDS.length,
            simulations: 84,
            allTerminal: true,
            completedNodes:
              readTacticalProgress(storage).completedCampaignNodes,
            results,
          },
          null,
          2,
        ) + "\n",
      )
  })
})
