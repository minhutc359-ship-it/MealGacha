// Development-only full-board fixture. Never reads or writes the player's checkpoint.
import React, { useState } from "react"
import { DUEL_CARD_MAP as TACTICAL_CARD_MAP } from "../src/game/tacticalTcg/duelCards"
import { createRoot } from "react-dom/client"
import "../src/game/tcg.css"
import { TacticalTable } from "../src/components/game/TacticalTable"
import { TACTICAL_STARTER } from "../src/game/tacticalTcg/cards"
import {
  createTacticalBattle,
  reduceTacticalBattle,
  type BattleUnit,
} from "../src/game/tacticalTcg/engine"
function initial() {
  const s = createTacticalBattle({
    battleId: "qa:ten-card-duel",
    manual: true,
    duel: true,
    deck: TACTICAL_STARTER,
    seed: 15,
  })
  s.round = 3
  const ids = [
    "banh-mi",
    "pho-bo",
    "com-tam",
    "caravan-herbalist",
    "caravan-pastry",
  ]
  s.units = Array.from({ length: 10 }, (_, i): BattleUnit => {
    const c = TACTICAL_CARD_MAP[ids[i % 5]]
    return {
      id: c.id,
      cardId: c.id,
      name: c.name,
      art: c.art ?? "",
      role: c.tacticalRole,
      traits: [c.school],
      maxHp: c.health,
      hp: c.health,
      attack: c.attack,
      ultimatePower: Math.max(3, c.attack * 2),
      instanceId: `qa:${i}`,
      side: i < 5 ? "player" : "enemy",
      cell: { row: i % 5 < 3 ? 0 : 1, column: ((i % 5) % 3) as 0 | 1 | 2 },
      energy: i === 1 ? 100 : 0,
      star: 1,
      shield: 0,
      defeated: false,
    }
  })
  s.units[0].rootedUntil = 4
  s.units[0].stunnedUntil = 4
  s.units[6].burn = { damage: 1, remaining: 2 }
  s.units[2].hp = Math.max(1, s.units[2].hp - 2)
  s.cardGame!.sides.player.hand = [
    "herb",
    "spark",
    "trap-embers",
    "trap-root",
    "seasoning",
    "sugar-veil",
    "pho-bo",
    "banh-mi",
  ]
  s.cardGame!.sides.player.mana = s.cardGame!.sides.player.maxMana = 10
  s.cardGame!.sides.enemy.hand = []
  return s
}
function Review() {
  const [b, setBattle] = useState(initial),
    [selected, setSelected] = useState<string | null>(null),
    [card, setCard] = useState<number | null>(null),
    [mode, setMode] = useState<"basic" | "ultimate">("basic")
  const act = (a: Parameters<typeof reduceTacticalBattle>[1]) => {
    setBattle((old) => reduceTacticalBattle(old, a))
    setCard(null)
  }
  const id = () => `qa:${b.processedActionIds.length}`
  return (
    <TacticalTable
      battle={b}
      selectedCard={card}
      selectedUnit={selected}
      attackMode={mode}
      onAttackMode={setMode}
      busy={false}
      notice="QA fixture · không lưu tiến trình"
      claimed={false}
      trapColumn={0}
      onSelectCard={setCard}
      onSelectUnit={setSelected}
      onCell={(side, cell, u) => {
        if (card !== null)
          act({
            id: id(),
            type: "play-card",
            side: "player",
            handIndex: card,
            cell,
            targetId: u?.instanceId,
          })
        else if (side === "enemy" && u && selected)
          act({
            id: id(),
            type: mode,
            unitId: selected,
            targetId: u.instanceId,
          })
        else setSelected(u?.instanceId ?? null)
      }}
      onPlay={() =>
        card !== null &&
        act({ id: id(), type: "play-card", side: "player", handIndex: card })
      }
      onAdvance={() =>
        act({
          id: id(),
          type:
            b.cardGame!.directed!.turn === "player" ? "end-turn" : "enemy-step",
        })
      }
      onUltimate={(uid) => {
        setSelected(uid)
        setMode("ultimate")
      }}
      onMulligan={() => {}}
      onColumn={() => {}}
      onClaim={() => {}}
      onRestart={() => setBattle(initial())}
      onForfeit={() => {}}
      onExit={() => {}}
      onCommander={() =>
        selected &&
        act({ id: id(), type: mode, unitId: selected, targetId: "hero:enemy" })
      }
      onReact={(reactionId, activate) =>
        act({ id: id(), type: "react", reactionId, activate })
      }
    />
  )
}
createRoot(document.getElementById("root")!).render(<Review />)
