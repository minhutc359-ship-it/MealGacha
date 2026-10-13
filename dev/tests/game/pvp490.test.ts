import { describe, it, expect } from "vitest"
import { STARTER_DECK, CARDS, CARD_MAP } from "@/game/catalog"
import { startPvpBattle, actPvpBattle } from "@/game/battle"
import { frameDuration } from "@/game/combatDirection"
import { createPvpCombat, advanceCombat } from "@/game/autochess/combat"
import { createAutoRun } from "@/game/autochess/economy"
import { randomKey, normalizeKey, formatKey, validKey } from "@/game/pvp/peer"
import {
  createHostRoom,
  admitGuest,
  applyRoomCommand,
  setGuestConnected,
  roomView,
  tickRoom,
  validCommand,
  validProfile,
  roundKind,
  type HostRoom,
  type RoomCommand,
  type Seat,
} from "@/game/pvp/room"
import { validRoomView } from "@/game/pvp/viewValidation"
import type { Battle, BattleUnit } from "@/game/types"
const profile = (name = "H", auto = false) => ({
  name,
  deck: auto ? [] : [...STARTER_DECK],
})
function room(mode: "auto" | "tcg" = "tcg") {
  const r = createHostRoom(mode, profile("H", mode === "auto"), "room-test")
  expect(admitGuest(r, profile("G", mode === "auto"))).toBeNull()
  return r
}
function command(
  r: HostRoom,
  seat: Seat,
  c: RoomCommand,
  rev = r.revision,
  now = 100000,
) {
  return applyRoomCommand(r, seat, c, r.lastSequence[seat] + 1, rev, now, 173)
}
function started(mode: "auto" | "tcg" = "tcg") {
  const r = room(mode)
  expect(command(r, 0, { type: "ready", value: true })).toBeNull()
  expect(command(r, 1, { type: "ready", value: true })).toBeNull()
  return r
}
const unit = (uid: string, cardId = "banh-mi"): BattleUnit => ({
  uid,
  cardId,
  attack: 3,
  health: 20,
  maxHealth: 20,
  shield: 0,
  ready: true,
  keywords: [],
})
function arena(side: "player" | "enemy" = "player"): Battle {
  const b = startPvpBattle([STARTER_DECK, STARTER_DECK], ["H", "G"], () => 0.2)
  b.turnSide = side
  b.turnSerial = 7
  b.round = 4
  for (const s of ["player", "enemy"] as const) {
    b[s].board = [unit(s)]
    b[s].mana = b[s].maxMana = 7
    b[s].hand = []
  }
  return b
}
describe("two-seat host rooms", () => {
  it("generates pasteable 80-bit codes and rejects malformed codes", () => {
    const keys = Array.from({ length: 100 }, () => randomKey())
    expect(new Set(keys).size).toBe(100)
    for (const key of keys) {
      expect(validKey(key)).toBe(true)
      expect(normalizeKey(formatKey(key).toLowerCase())).toBe(key)
    }
    expect(validKey("1234")).toBe(false)
  })
  it("admits only one guest and reserves the seat while disconnected", () => {
    const r = room()
    expect(admitGuest(r, profile("Third"))).toMatch(/2/)
    setGuestConnected(r, false)
    expect(admitGuest(r, profile("Third"))).toMatch(/2/)
    expect(command(r, 1, { type: "ready", value: true })).toBeTruthy()
    expect(r.profiles[1]?.name).toBe("G")
  })
  it("validates 24-card decks, copy limits and incoming command allowlists", () => {
    expect(validProfile(profile(), "tcg")).toBe(true)
    expect(
      validProfile({ name: "H", deck: STARTER_DECK.slice(0, 18) }, "tcg"),
    ).toBe(false)
    expect(
      validProfile({ name: "H", deck: Array(24).fill("toString") }, "tcg"),
    ).toBe(false)
    expect(
      validCommand({ type: "auto", action: { type: "checkpoint", run: {} } }),
    ).toBe(false)
    expect(validCommand({ type: "auto", action: { type: "start" } })).toBe(
      false,
    )
    expect(
      validCommand({
        type: "auto",
        action: { type: "move", uid: "a", cell: NaN },
      }),
    ).toBe(false)
    expect(
      validCommand({ type: "tcg", action: { type: "tactic", id: "courage" } }),
    ).toBe(false)
  })
  it("deduplicates actions, rejects stale hands and enforces turn ownership", () => {
    const r = started()
    const active = r.tcg!.turnSide === "player" ? 0 : 1,
      old = r.revision,
      seq = r.lastSequence[active] + 1
    expect(
      applyRoomCommand(
        r,
        active,
        { type: "tcg", action: { type: "end" } },
        seq,
        old,
        100000,
      ),
    ).toBeNull()
    expect(
      applyRoomCommand(
        r,
        active,
        { type: "tcg", action: { type: "end" } },
        seq,
        old,
        100000,
      ),
    ).toBeTruthy()
    expect(
      command(r, active, { type: "tcg", action: { type: "end" } }, old, 200000),
    ).toBeTruthy()
    expect(
      command(
        r,
        active,
        { type: "tcg", action: { type: "end" } },
        r.revision,
        200000,
      ),
    ).toBeTruthy()
    expect(r.tcg?.enemyPhase).toBeUndefined()
  })
  it("starts with equal resources and no AI or solo campaign hooks", () => {
    const r = started()
    expect(r.tcg?.player.health).toBe(34)
    expect(r.tcg?.enemy.health).toBe(34)
    expect(r.tcg?.enemyChallenge).toBeUndefined()
    expect(r.tcg?.tactic).toBeUndefined()
    expect(r.tcg!.player.hand.length + r.tcg!.player.deck.length).toBe(24)
    const a = started("auto").auto!
    expect(a.runs[0].shop).toEqual(a.runs[1].shop)
    expect(a.runs.map((r) => r.health)).toEqual([100, 100])
    expect(a.runs.map((r) => r.scene)).toEqual([null, null])
  })
  it("keeps hidden trap identity out of every opponent snapshot and animation", () => {
    const r = started()
    r.tcg = arena()
    r.tcg.player.hand = ["trap-lid"]
    expect(
      command(r, 0, { type: "tcg", action: { type: "play", index: 0 } }),
    ).toBeNull()
    const guest = roomView(r, 1, 200000),
      host = roomView(r, 0, 200000)
    expect(host.tcg?.player.trap?.cardId).toBe("trap-lid")
    expect(guest.tcg?.enemy.trap?.cardId).toBe("hidden")
    expect(JSON.stringify(guest)).not.toContain("trap-lid")
    expect(JSON.stringify(guest)).not.toContain(CARD_MAP["trap-lid"].name)
    expect(guest.tcg?.enemy.hand.every((id) => id === "hidden")).toBe(true)
    expect(guest.tcg?.player.deck.every((id) => id === "hidden")).toBe(true)
  })
  for (const owner of ["player", "enemy"] as const)
    it(`lets ${owner} manually activate or hold a trap`, () => {
      const actor = owner === "player" ? "enemy" : "player",
        b = arena(actor)
      b[owner].trap = { uid: "trap", cardId: "trap-lid", setTurn: 6 }
      const offered = actPvpBattle(b, actor, {
        type: "attack",
        uid: actor,
        target: "hero",
      })
      expect(offered.error).toBeNull()
      expect(offered.battle.pvp?.reactionOwner).toBe(owner)
      expect(offered.battle[owner].health).toBe(34)
      expect(
        actPvpBattle(offered.battle, actor, { type: "end" }).error,
      ).toBeTruthy()
      const held = actPvpBattle(offered.battle, owner, {
        type: "react",
        id: offered.battle.pendingReaction!.id,
        activate: false,
      })
      expect(held.error).toBeNull()
      expect(held.battle[owner].health).toBe(31)
      expect(held.battle[owner].trap).toBeTruthy()
      const activated = actPvpBattle(offered.battle, owner, {
        type: "react",
        id: offered.battle.pendingReaction!.id,
        activate: true,
      })
      expect(activated.battle[owner].health).toBe(34)
      expect(activated.battle[owner].trap).toBeNull()
      expect(
        activated.frames.filter((f) => f.event.kind === "trap"),
      ).toHaveLength(1)
      expect(
        frameDuration(activated.frames.find((f) => f.event.kind === "trap")),
      ).toBe(2250)
    })
  it("pauses a qualifying spell before spending it, then negates it once", () => {
    const b = arena()
    b.enemy.trap = { uid: "trap", cardId: "trap-silence", setTurn: 6 }
    const trap = CARDS.find(
      (c) => c.kind === "trap" && c.trap?.effect === "negate",
    )!
    b.enemy.trap.cardId = trap.id
    const spell = CARDS.find(
      (c) =>
        c.kind === "spell" &&
        c.effect === "damage" &&
        c.cost >= (trap.trap?.minCost ?? 0) &&
        c.ability !== "wash",
    )!
    b.player.hand = [spell.id]
    const offered = actPvpBattle(b, "player", {
      type: "play",
      index: 0,
      target: "hero",
    })
    expect(offered.error).toBeNull()
    expect(offered.battle.pendingReaction).toBeTruthy()
    expect(offered.battle.player.hand).toEqual([spell.id])
    expect(offered.battle.player.mana).toBe(7)
    const out = actPvpBattle(offered.battle, "enemy", {
      type: "react",
      id: offered.battle.pendingReaction!.id,
      activate: true,
    })
    expect(out.error).toBeNull()
    expect(out.battle.player.hand).toEqual([])
    expect(out.battle.player.mana).toBe(7 - spell.cost)
    expect(out.battle.enemy.health).toBe(34)
  })
  it("holds the host command window through the full trap reveal", () => {
    const r = started()
    r.tcg = arena()
    r.tcg.enemy.trap = { uid: "trap", cardId: "trap-lid", setTurn: 6 }
    expect(
      command(r, 0, {
        type: "tcg",
        action: { type: "attack", uid: "player", target: "hero" },
      }),
    ).toBeNull()
    expect(
      command(
        r,
        1,
        {
          type: "tcg",
          action: {
            type: "react",
            id: r.tcg!.pendingReaction!.id,
            activate: true,
          },
        },
        r.revision,
        200000,
      ),
    ).toBeNull()
    expect(r.actionReadyAt - 200000).toBeGreaterThanOrEqual(2250)
    expect(
      command(
        r,
        0,
        { type: "tcg", action: { type: "end" } },
        r.revision,
        200001,
      ),
    ).toBeTruthy()
  })
  it("builds a mirrored human army with real stars, equipment and unique actor IDs", () => {
    const h = createAutoRun("campaign", 1, "pvp", "h"),
      g = createAutoRun("campaign", 1, "pvp", "g")
    h.roster[0].star = 3
    h.roster[0].items = ["spark"]
    const b = createPvpCombat(h, g)
    expect(
      b.actors.some(
        (a) =>
          a.id === g.roster[0].id &&
          a.side === "enemy" &&
          a.cell === 35 - g.roster[0].cell!,
      ),
    ).toBe(true)
    expect(b.actors.find((a) => a.uid === `h:${h.roster[0].uid}`)?.star).toBe(3)
    expect(new Set(b.actors.map((a) => a.uid)).size).toBe(b.actors.length)
    expect(() =>
      advanceCombat({ ...h, phase: "combat", combat: b }, 200),
    ).not.toThrow()
  })
  it("repeats three farm rounds then PvP, with pauses and symmetric projection", () => {
    const r = started("auto")
    for (let round = 1; round <= 8; round++) {
      const a = r.auto!,
        health = a.runs.map((r) => r.health)
      expect(roundKind(a.round)).toBe(round % 4 === 0 ? "pvp" : "farm")
      expect(
        command(r, 0, { type: "auto", action: { type: "battle" } }),
      ).toBeNull()
      expect(a.phase).toBe("prepare")
      expect(
        command(r, 1, { type: "auto", action: { type: "battle" } }),
      ).toBeNull()
      expect(a.phase).toBe("combat")
      if (round % 4 === 0) {
        const guest = roomView(r, 1).auto!.run.combat!,
          host = a.runs[0].combat!
        expect(guest.actors[0].cell).toBe(35 - host.actors[0].cell)
        expect(guest.actors[0].side).not.toBe(host.actors[0].side)
      }
      setGuestConnected(r, false)
      const tick = a.runs[0].combat?.tick
      expect(tickRoom(r, 20)).toBe(false)
      expect(a.runs[0].combat?.tick).toBe(tick)
      setGuestConnected(r, true)
      for (let i = 0; i < 46 && a.phase === "combat"; i++) tickRoom(r, 40)
      expect(a.phase).toBe("result")
      if (round % 4 !== 0) expect(a.runs.map((r) => r.health)).toEqual(health)
      expect(a.runs[0].lastResult!.gold).toBeGreaterThanOrEqual(5)
      expect(
        command(r, 0, { type: "auto", action: { type: "next" } }),
      ).toBeNull()
      expect(
        command(r, 1, { type: "auto", action: { type: "next" } }),
      ).toBeNull()
      expect(a.round).toBe(round + 1)
    }
  })
  it("locks ready formation until the player cancels readiness", () => {
    const r = started("auto")
    expect(
      command(r, 0, { type: "auto", action: { type: "battle" } }),
    ).toBeNull()
    expect(
      command(r, 0, { type: "auto", action: { type: "reroll" } }),
    ).toBeTruthy()
    expect(
      command(r, 0, { type: "auto", action: { type: "battle" } }),
    ).toBeNull()
    expect(
      command(r, 0, { type: "auto", action: { type: "reroll" } }),
    ).toBeNull()
  })
  it("supports concurrent independent shopping from the same shared revision", () => {
    const r = started("auto"),
      rev = r.revision
    expect(
      command(r, 0, { type: "auto", action: { type: "buy", index: 0 } }, rev),
    ).toBeNull()
    expect(
      command(r, 1, { type: "auto", action: { type: "buy", index: 0 } }, rev),
    ).toBeNull()
    expect(r.auto!.runs.every((r) => r.shop[0] === null)).toBe(true)
  })
  it("validates masked views and rejects unknown card identifiers", () => {
    const r = started()
    for (const seat of [0, 1] as const)
      expect(validRoomView(roomView(r, seat))).toBe(true)
    const bad = roomView(r, 0)
    bad.tcg!.player.hand[0] = "toString"
    expect(validRoomView(bad)).toBe(false)
    const a = started("auto")
    for (const seat of [0, 1] as const)
      expect(validRoomView(roomView(a, seat))).toBe(true)
    command(a, 0, { type: "auto", action: { type: "battle" } })
    command(a, 1, { type: "auto", action: { type: "battle" } })
    tickRoom(a, 20)
    for (const seat of [0, 1] as const)
      expect(validRoomView(roomView(a, seat))).toBe(true)
  })
  it("finishes a room-only match by surrender and resets it for rematch", () => {
    const r = started("auto")
    const gold = r.auto!.runs[1].gold
    expect(command(r, 0, { type: "surrender" })).toBeNull()
    expect(r.phase).toBe("finished")
    expect(r.winner).toBe(1)
    expect(r.auto!.runs[1].gold).toBe(gold)
    expect(command(r, 1, { type: "rematch" })).toBeTruthy()
    expect(command(r, 0, { type: "rematch" })).toBeNull()
    expect(r.ready).toEqual([false, false])
    expect(r.auto).toBeNull()
  })
})
