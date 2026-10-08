import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { actBattle, startBattle } from "./battle"
import { CARDS, CARD_MAP, STARTER_DECK } from "./catalog"
import { battleInvocation } from "./combatDirection"
import { FLAVOR_SPIRITS, foodSpirit } from "./flavorSpirits"

const unit = (uid: string, cardId: string, health = 4) => ({
  uid,
  cardId,
  health,
  maxHealth: health,
  attack: 3,
  shield: 0,
  ready: true,
  keywords: [],
})

describe("memory spirits and read-only battle direction", () => {
  it("ships real illustration files for every card, every spirit and the commander", () => {
    expect(
      CARDS.every(
        (card) => card.art && existsSync(resolve("public", card.art.slice(1))),
      ),
    ).toBe(true)
    for (const spirit of Object.values(FLAVOR_SPIRITS))
      expect(existsSync(resolve("public", spirit.art.slice(1)))).toBe(true)
    expect(
      existsSync(
        resolve("public/assets/tcg/characters/anime/hero-command.webp"),
      ),
    ).toBe(true)
    expect(foodSpirit(CARD_MAP["pho-bo"])?.name).toBe("Long Ngư Hơi Nước")
    expect(foodSpirit(CARD_MAP["chef-hai"])).toBeUndefined()
    expect(foodSpirit(CARD_MAP["caravan-ferryman"])).toBeUndefined()
  })

  it("presents a food summon separately from a spell and never changes either reducer snapshot", () => {
    for (const cardId of ["pho-bo", "spark", "caravan-scout"]) {
      const battle = startBattle(STARTER_DECK, null)
      battle.player.mana = battle.player.maxMana = 7
      battle.player.hand = [cardId]
      const result = actBattle(battle, {
        type: "play",
        index: 0,
        target: "hero",
      })
      expect(result.error).toBeNull()
      const frame = result.frames[0],
        snapshot = JSON.stringify(frame)
      const direction = battleInvocation(frame)!
      expect(direction.card.id).toBe(cardId)
      expect(direction.kind).toBe(cardId === "spark" ? "cast" : "summon")
      expect(!!direction.spirit).toBe(cardId === "pho-bo")
      for (let n = 0; n < 4; n++) battleInvocation(frame)
      expect(JSON.stringify(frame)).toBe(snapshot)
    }
  })

  it("keeps a fallen attacker visible from the before snapshot and identifies enemy commands", () => {
    const battle = startBattle(STARTER_DECK, null)
    battle.player.board = [unit("ally", "pho-bo", 1)]
    battle.enemy.board = [unit("foe", "com-tam")]
    const result = actBattle(battle, {
      type: "attack",
      uid: "ally",
      target: "foe",
    })
    expect(result.battle.player.board).toHaveLength(0)
    const frame = result.frames[0]
    expect(
      battleInvocation({
        ...frame,
        event: { ...frame.event, cardId: undefined },
      })?.card.id,
    ).toBe("pho-bo")
    const enemy = {
      ...frame,
      event: { ...frame.event, side: "enemy" as const, cardId: "chef-bach" },
    }
    expect(battleInvocation(enemy)?.detail).toBe("Bách · Bếp trưởng")
    expect(
      battleInvocation({
        ...frame,
        event: { kind: "turn", side: "enemy", label: "Lượt mới" },
      }),
    ).toBeNull()
  })
})
