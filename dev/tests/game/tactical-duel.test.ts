import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { TacticalDuelField } from "@/components/game/TacticalDuelField"
import { TacticalCardFace } from "@/components/game/TacticalTable"
import { TACTICAL_CARD_MAP, TACTICAL_STARTER } from "@/game/tacticalTcg/cards"
import {
  createTacticalBattle,
  type BattleUnit,
} from "@/game/tacticalTcg/engine"
import {
  duelPlacement,
  duelStatuses,
} from "@/game/tacticalTcg/presentation/duel"
import { tacticalTransition } from "@/game/tacticalTcg/presentation/transitions"

describe("Splash-art TCG table", () => {
  const fixture = () => {
    const s = createTacticalBattle({
      battleId: "duel-presentation",
      manual: true,
      deck: TACTICAL_STARTER,
      seed: 1,
    })
    const c = TACTICAL_CARD_MAP["banh-mi"]
    s.units = Array.from(
      { length: 10 },
      (_, i): BattleUnit => ({
        id: c.id,
        cardId: c.id,
        name: c.name,
        art: c.art ?? "",
        role: c.tacticalRole,
        traits: [c.school],
        maxHp: 50,
        hp: 50,
        attack: 6,
        ultimatePower: 18,
        instanceId: `duel:${i}`,
        side: i < 5 ? "player" : "enemy",
        cell: { row: i % 5 < 3 ? 0 : 1, column: ((i % 5) % 3) as 0 | 1 | 2 },
        energy: 0,
        star: 1,
        shield: 0,
        defeated: false,
      }),
    )
    return s
  }
  it("renders ten real card anchors, no empty grid tiles, models or food photos", () => {
    const s = fixture()
    const html = (["player", "enemy"] as const)
      .map((side) =>
        renderToStaticMarkup(
          createElement(TacticalDuelField, {
            battle: s,
            side,
            card: null,
            targets: [],
            busy: false,
            planning: true,
            transition: null,
            contacted: true,
            effects: {},
            onCell: () => {},
          }),
        ),
      )
      .join("")
    expect(html.match(/data-unit=/g)).toHaveLength(10)
    expect(html.match(/spirit-portrait-crop/g)).toHaveLength(10)
    expect(html).not.toContain("is-empty")
    expect(html).not.toContain("character-sprite")
    expect(html).not.toContain("/assets/food/")
    expect(html).toContain("Hộ vệ")
    expect(html).not.toContain("HẬU")
    expect(duelPlacement(s, 0)).toEqual({ row: 0, column: 3 })
    expect(duelPlacement(s, 1)).toEqual({ row: 1, column: 2 })
  })
  it("keeps atlas cropping inside a square surface for differently shaped card frames", () => {
    const html = renderToStaticMarkup(
      createElement(TacticalCardFace, { card: TACTICAL_CARD_MAP["banh-mi"] }),
    )
    expect(html).toContain('class="spirit-portrait-crop"')
    expect(html).toContain("background-size:400% 400%")
  })
  it("announces only actual statuses and records their appearance in immutable transitions", () => {
    const before = fixture(),
      after = structuredClone(before)
    const u = after.units[0]
    u.burn = { damage: 4, remaining: 2 }
    u.stunnedUntil = 2
    u.rootedUntil = 2
    u.shield = 20
    expect(duelStatuses(after, u).map((s) => s.kind)).toEqual([
      "root",
      "freeze",
      "burn",
      "shield",
    ])
    after.processedActionIds.push("status-event")
    after.cardGame!.directed!.event = {
      id: "status-event",
      kind: "reaction",
      side: "player",
      sourceId: "hero:player",
      cardId: "trap-root",
    }
    const saved = JSON.stringify([before, after]),
      t = tacticalTransition(before, after)
    expect(t?.deltas[0].statuses).toEqual(["root", "freeze", "burn", "shield"])
    expect(JSON.stringify([before, after])).toBe(saved)
    after.round = 3
    delete u.burn
    u.shield = 0
    expect(duelStatuses(after, u)).toHaveLength(0)
  })
})
