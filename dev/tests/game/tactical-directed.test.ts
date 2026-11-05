import { describe, expect, it } from "vitest"
import {
  TACTICAL_CARDS,
  TACTICAL_CARD_MAP,
  TACTICAL_STARTER,
} from "@/game/tacticalTcg/cards"
import {
  createTacticalBattle,
  reduceTacticalBattle,
  type BattleUnit,
  type TacticalBattleState,
} from "@/game/tacticalTcg/engine"
import {
  directedReadiness,
  directedTargets,
  enableDirectedBattle,
  DIRECTED_TRAP_TEXT,
} from "@/game/tacticalTcg/engine/directedRules"
import { validTacticalCheckpoint } from "@/game/tacticalTcg/progression/checkpoint"
import { emptyCardCell } from "@/game/tacticalTcg/engine/cardRuntime"
import { TACTICAL_DECK_LIBRARY } from "@/game/tacticalTcg/deckLibrary"
const unit = (
  id: string,
  side: "player" | "enemy",
  column: 0 | 1 | 2 | 3 = 0,
): BattleUnit => {
  const c = TACTICAL_CARD_MAP[id]
  return {
    id,
    cardId: id,
    instanceId: `${side}:${id}:${column}`,
    name: c.name,
    art: c.art ?? "",
    role: c.tacticalRole,
    traits: [c.school],
    maxHp: c.health,
    hp: c.health,
    attack: c.attack,
    ultimatePower: Math.max(18, c.attack * 2),
    side,
    cell: { row: 0, column },
    energy: 0,
    star: 1,
    shield: 0,
    defeated: false,
    summonedRound: 1,
  }
}
function fixture(trap?: string) {
  let s = createTacticalBattle({
    battleId: "directed-fixture",
    manual: true,
    deck: TACTICAL_STARTER,
    seed: 5,
  })
  s.round = 2
  s.units = [unit("banh-mi", "player"), unit("com-tam", "enemy")]
  for (const side of ["player", "enemy"] as const) {
    s.cardGame!.sides[side].mana = 10
    s.cardGame!.sides[side].maxMana = 10
    s.cardGame!.sides[side].hand = []
  }
  if (trap) {
    s.cardGame!.sides.player.hand = [trap]
    s = reduceTacticalBattle(s, {
      id: "arm",
      type: "play-card",
      side: "player",
      handIndex: 0,
    })
    expect(s.traps[0].armed).toBe(true)
  }
  return s
}
const end = (s: TacticalBattleState) =>
  reduceTacticalBattle(s, { id: "end-player", type: "end-turn" })
const attack = (
  s: TacticalBattleState,
  targetId = s.units.find((u) => u.side === "player")?.instanceId ??
    "hero:player",
) =>
  reduceTacticalBattle(s, {
    id: "enemy-basic",
    type: "basic",
    unitId: s.units.find((u) => u.side === "enemy")!.instanceId,
    targetId,
  })
function react(s: TacticalBattleState, activate = true) {
  const p = s.cardGame!.directed!.pending!
  expect(p).toBeTruthy()
  expect(validTacticalCheckpoint(s)).toBe(true)
  return reduceTacticalBattle(JSON.parse(JSON.stringify(s)), {
    id: `react:${p.id}:${activate}`,
    type: "react",
    reactionId: p.id,
    activate,
  })
}
describe("Directed TCG and native trap decisions", () => {
  it("reviving a unit does not repeat its entry draw or grant an immediate attack",()=>{
    let s=fixture();s.units[0]=unit("pho-bo","player");s.units[0].hp=0;s.units[0].defeated=true
    const c=TACTICAL_CARDS.find(c=>c.kind==="spell"&&c.tacticalEffect==="revive")!
    s.cardGame!.sides.player.hand=[c.id];s.cardGame!.sides.player.discard=["pho-bo"]
    s=reduceTacticalBattle(s,{id:"revive-paid",type:"play-card",side:"player",handIndex:0})
    expect(s.units[0].defeated).toBe(false);expect(s.units[0].hp).toBe(15);expect(s.cardGame!.sides.player.hand).toHaveLength(0)
    expect(directedReadiness(s,s.units[0])).not.toBe("ready");expect(s.cardGame!.sides.player.discard).not.toContain("pho-bo")
  })
  it("thaw clears freeze but never refunds a previously spent attack",()=>{
    let s=fixture();s.units[0].stunnedUntil=s.round+1;s.cardGame!.attacks[s.units[0].instanceId]=s.round
    s.cardGame!.sides.player.hand=["v4-warm-towel"]
    s=reduceTacticalBattle(s,{id:"thaw-paid",type:"play-card",side:"player",handIndex:0})
    expect(s.units[0].stunnedUntil).toBe(0);expect(directedReadiness(s,s.units[0])).toBe("exhausted")
  })
  it("enemy-step transport commands are idempotent, including a paused reaction",()=>{
    let s=fixture("trap-lid");s.units=s.units.filter(u=>u.side==="enemy");s=end(s)
    const a={id:"same-step",type:"enemy-step" as const},n=reduceTacticalBattle(s,a)
    expect(n.cardGame!.directed!.pending).toBeTruthy();expect(validTacticalCheckpoint(n)).toBe(true)
    expect(reduceTacticalBattle(n,a)).toBe(n)
    const resolved=react(n);expect(reduceTacticalBattle(resolved,a)).toBe(resolved)
  })
  it("upgrades old checkpoints without deletion, resetting resources or replaying attacks", () => {
    const old = createTacticalBattle({
      battleId: "old",
      deck: TACTICAL_STARTER,
    })
    old.phase = "reaction"
    const next = enableDirectedBattle(old)
    expect(next.cardGame!.directed!.turn).toBe("player")
    expect(next.phase).toBe("planning")
    expect(next.units).toEqual(old.units)
    expect(next.cardGame!.sides).toEqual(old.cardGame!.sides)
    expect(next.processedActionIds).toEqual(old.processedActionIds)
    expect(enableDirectedBattle(next)).toBe(next)
    expect(old.cardGame!.directed).toBeUndefined()
    expect(validTacticalCheckpoint(next)).toBe(true)
  })
  it("requires chosen valid targets, respects guards and mage reach, exhausts one attacker", () => {
    const s = fixture()
    s.units.push(unit("pho-bo", "enemy", 1))
    s.units[1].role = "guardian"
    s.units[2].cell.row = 1
    const source = s.units[0],
      a = {
        id: "chosen",
        type: "basic" as const,
        unitId: source.instanceId,
        targetId: s.units[1].instanceId,
      }
    expect(directedTargets(s, source)).toEqual([s.units[1].instanceId])
    for (const targetId of [s.units[2].instanceId, "hero:enemy", undefined])
      expect(reduceTacticalBattle(s, { ...a, targetId })).toBe(s)
    const next = reduceTacticalBattle(s, a)
    expect(next.units[1].hp).toBeLessThan(s.units[1].hp)
    expect(next.cardGame!.attacks[source.instanceId]).toBe(s.round)
    expect(next.cardGame!.directed!.event?.sourceId).toBe(source.instanceId)
    expect(reduceTacticalBattle(next, { ...a, id: "again" })).toBe(next)
    expect(reduceTacticalBattle(next, a)).toBe(next)
    s.units[1].role = "striker"
    source.role = "mage"
    expect(directedTargets(s, source)).toHaveLength(2)
  })
  it("normal summons wait, rush attacks now and freeze blocks both attack and ultimate", () => {
    for (const rush of [false, true]) {
      let s = fixture()
      const c = TACTICAL_CARDS.find(
        (c) => c.kind === "unit" && c.keywords.includes("rush") === rush,
      )!
      s.cardGame!.sides.player.hand = [c.id]
      s = reduceTacticalBattle(s, {
        id: "summon",
        type: "play-card",
        side: "player",
        handIndex: 0,
        cell: { row: 1, column: 0 },
      })
      const born = s.units[s.units.length - 1],
        a = {
          id: "fresh",
          type: "basic" as const,
          unitId: born.instanceId,
          targetId: s.units[1].instanceId,
        }
      expect(directedReadiness(s, born)).toBe(rush ? "ready" : "summoning")
      expect(reduceTacticalBattle(s, a) === s).toBe(!rush)
      born.stunnedUntil = s.round + 1
      born.energy = 100
      expect(reduceTacticalBattle(s, { ...a, type: "ultimate" })).toBe(s)
    }
  })
  it("Nắp Nồi blocks a commander hit, holding survives reload and stale choices cannot duplicate", () => {
    let s = fixture("trap-lid")
    s.units = s.units.filter((u) => u.side === "enemy")
    s = attack(end(s))
    const held = react(s, false)
    expect(held.traps[0].armed).toBe(true)
    expect(held.commanders.player.hp).toBeLessThan(30)
    const blocked = react(s)
    expect(blocked.commanders.player.hp).toBe(30)
    expect(blocked.traps[0].armed).toBe(false)
    expect(
      blocked.cardGame!.sides.player.discard.filter((id) => id === "trap-lid"),
    ).toHaveLength(1)
    expect(
      reduceTacticalBattle(blocked, {
        id: "stale",
        type: "react",
        reactionId: s.cardGame!.directed!.pending!.id,
        activate: true,
      }),
    ).toBe(blocked)
  })
  it("Gương Nước blocks and reflects onto the enemy commander", () => {
    const s = attack(end(fixture("trap-mirror"))),
      n = react(s)
    expect(n.units[0].hp).toBe(s.units[0].hp)
    expect(n.commanders.enemy.hp).toBeLessThan(s.commanders.enemy.hp)
  })
  it("Vòng Than hits ready enemies and stops the killed attacker", () => {
    let s = fixture("trap-embers")
    s.units[1].hp = 10
    s.units.push(unit("pho-bo", "enemy", 1))
    const hp = s.units[2].hp
    s = attack(end(s))
    const n = react(s)
    expect(n.units[1].defeated).toBe(true)
    expect(n.units[2].hp).toBe(hp - 12)
    expect(n.units[0].hp).toBe(s.units[0].hp)
  })
  it("Mâm Đồng shields all allies before damage", () => {
    let s = fixture("trap-ward")
    s.units.push(unit("pho-bo", "player", 1))
    s.units[1].attack = 18
    s = attack(end(s))
    const n = react(s)
    expect(n.units[0].hp).toBe(s.units[0].hp)
    expect(n.units[0].shield).toBe(2)
    expect(n.units[2].shield).toBe(20)
  })
  it("Niêm Phong spends the card/mana, but suppresses spell effects, passives and recipe", () => {
    let s = fixture("trap-seal")
    const c = TACTICAL_CARDS.find(
      (c) => c.kind === "spell" && c.cost >= 2 && c.tacticalEffect === "buff",
    )!
    s.cardGame!.sides.enemy.hand = [c.id]
    s = end(s)
    const pending = reduceTacticalBattle(s, {
        id: "enemy-spell",
        type: "play-card",
        side: "enemy",
        handIndex: 0,
        targetId: s.units[1].instanceId,
      }),
      n = react(pending)
    expect(pending.cardGame!.sides.enemy.hand).toEqual([c.id])
    expect(n.cardGame!.sides.enemy.mana).toBe(10 - c.cost)
    expect(n.cardGame!.sides.enemy.discard).toContain(c.id)
    expect(n.cardGame!.sides.enemy.spellsThisRound).toBe(0)
    expect(n.cardGame!.sides.enemy.lastSchool).toBeNull()
    expect(n.units[1].attack).toBe(s.units[1].attack)
  })
  it.each(["trap-root", "trap-pantry"])(
    "%s reacts after a paid summon with entry effects preserved",
    (trap) => {
      let s = fixture(trap)
      const c = TACTICAL_CARDS.find(
        (c) => c.kind === "unit" && c.cost >= 4 && c.health > 20,
      )!
      s.commanders.player.hp = 20
      s.cardGame!.sides.enemy.hand = [c.id]
      s = end(s)
      const pending = reduceTacticalBattle(s, {
        id: "big-summon",
        type: "play-card",
        side: "enemy",
        handIndex: 0,
        cell: { row: 1, column: 0 },
      })
      expect(pending.cardGame!.directed!.pending?.stage).toBe("after")
      const born = pending.units[pending.units.length - 1],
        n = react(pending),
        after = n.units[n.units.length - 1]
      if (trap === "trap-root") {
        expect(after.hp + after.shield).toBe(born.hp + born.shield - 20)
        expect(after.stunnedUntil).toBe(s.round + 1)
      } else {
        expect(n.commanders.player.hp).toBe(23)
        expect(n.cardGame!.sides.player.hand).toHaveLength(2)
      }
      expect(n.cardGame!.sides.enemy.mana).toBe(10 - c.cost)
      expect(n.units).toHaveLength(3)
    },
  )
  it("Lá Thư revives the exact fallen unit with no entry, fresh shield or fresh attack", () => {
    let s = fixture("trap-recall")
    s.units[0].hp = 1
    s = attack(end(s))
    expect(s.units[0].defeated).toBe(true)
    const n = react(s)
    expect(n.units[0].defeated).toBe(false)
    expect(n.units[0].instanceId).toBe(s.units[0].instanceId)
    expect(n.units[0].hp).toBe(20)
    expect(n.units[0].shield).toBe(0)
    expect(n.cardGame!.sides.player.discard).not.toContain("banh-mi")
    expect(directedReadiness(n, n.units[0])).not.toBe("ready")
  })
  it("revealing preserves a trap whereas disarming removes it", () => {
    for (const id of ["v45-taste", "v45-uncover"]) {
      let s = fixture()
      s.traps = [
        {
          instanceId: "secret",
          side: "enemy",
          column: 0,
          trapId: "bamboo-guard",
          cardId: "trap-ward",
          armed: true,
          triggeredRound: null,
        },
      ]
      s.cardGame!.sides.player.hand = [id]
      s = reduceTacticalBattle(s, {
        id: "counter",
        type: "play-card",
        side: "player",
        handIndex: 0,
      })
      expect(s.traps[0].armed).toBe(id === "v45-taste")
      if (id === "v45-taste") {
        expect(s.traps[0].revealed).toBe(true)
        expect(s.cardGame!.sides.enemy.discard).not.toContain("trap-ward")
      }
    }
  })
  it("rejects forged pending decisions, wrong trap types/targets and wrong turn", () => {
    const s = attack(end(fixture("trap-ward")))
    expect(validTacticalCheckpoint(s)).toBe(true)
    const mutations = [
      (n: TacticalBattleState) => (n.cardGame!.directed!.turn = "player"),
      (n: TacticalBattleState) =>
        (n.cardGame!.directed!.pending!.id = "forged"),
      (n: TacticalBattleState) => (n.traps[0].armed = false),
      (n: TacticalBattleState) => (n.traps[0].cardId = "trap-seal"),
      (n: TacticalBattleState) =>
        (n.cardGame!.directed!.pending!.action.targetId = "hero:enemy"),
    ]
    for (const mutate of mutations) {
      const n = structuredClone(s)
      mutate(n)
      expect(validTacticalCheckpoint(n)).toBe(false)
    }
    expect(validTacticalCheckpoint(react(s))).toBe(true)
  })
  it("eight decks complete legal directed matches, keeping snapshots immutable and reactions reloadable", () => {
    for (const deck of TACTICAL_DECK_LIBRARY)
      for (let seed = 1; seed <= 3; seed++) {
        let s = createTacticalBattle({
            battleId: `directed:${deck.id}:${seed}`,
            manual: true,
            deck: deck.cards,
            seed,
          }),
          serial = 0,
          tick = 0
        for (; tick < 450 && !s.winner; tick++) {
          const before = JSON.stringify(s)
          let n = s
          if (s.cardGame!.directed!.pending) n = react(s)
          else if (s.cardGame!.directed!.turn === "enemy")
            n = reduceTacticalBattle(s, {
              id: `step:${serial++}`,
              type: "enemy-step",
            })
          else {
            for (
              let handIndex = 0;
              handIndex < s.cardGame!.sides.player.hand.length;
              handIndex++
            ) {
              const c =
                  TACTICAL_CARD_MAP[s.cardGame!.sides.player.hand[handIndex]],
                same = s.units.find(
                  (u) =>
                    u.side === "player" &&
                    !u.defeated &&
                    u.cardId === c.id &&
                    u.star === 1,
                )
              const target = s.units.find(
                (u) =>
                  !u.defeated &&
                  u.side === (c.tacticalEffect === "buff" ? "player" : "enemy"),
              )
              n = reduceTacticalBattle(s, {
                id: `play:${serial++}`,
                type: "play-card",
                side: "player",
                handIndex,
                cell:
                  same?.cell ??
                  emptyCardCell(s, "player", c.tacticalRole !== "guardian") ??
                  undefined,
                targetId: target?.instanceId,
                column: 0,
              })
              if (n !== s) break
            }
            if (n === s)
              for (const u of s.units.filter(
                (u) => u.side === "player" && !u.defeated,
              ))
                for (const type of ["ultimate", "basic"] as const) {
                  if (n !== s) break
                  n = reduceTacticalBattle(s, {
                    id: `choose:${serial++}`,
                    type,
                    unitId: u.instanceId,
                    targetId: directedTargets(s, u)[0],
                  })
                }
            if (n === s)
              n = reduceTacticalBattle(s, {
                id: `end:${serial++}`,
                type: "end-turn",
              })
          }
          expect(JSON.stringify(s)).toBe(before)
          expect(n).not.toBe(s)
          expect(
            validTacticalCheckpoint(n),
            `${deck.id}:${seed}:${tick} ${JSON.stringify(n.cardGame!.directed)}`,
          ).toBe(true)
          s = n
        }
        expect(s.phase, `${deck.id}:${seed} after ${tick}`).toBe("result")
      }
    expect(Object.keys(DIRECTED_TRAP_TEXT)).toHaveLength(8)
  })
})
