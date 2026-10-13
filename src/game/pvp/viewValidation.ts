import { CARD_MAP } from "../catalog"
import { UNIT_MAP, MONSTER_MAP } from "../autochess/catalog"
import { ITEM_MAP } from "../autochess/items"
import type { RoomView } from "./room"
// Snapshots are untrusted input even though one peer owns the simulation.
type Obj = Record<string, any>
const obj = (v: unknown): v is Obj =>
  !!v && typeof v === "object" && !Array.isArray(v)
const text = (v: unknown, max = 100) => typeof v === "string" && v.length <= max
const num = (v: unknown, max = 1000000) =>
  typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= max
const list = (v: unknown, max: number, check: (v: any) => boolean): boolean =>
  Array.isArray(v) && v.length <= max && v.every(check)
const known = (map: object, id: unknown) =>
  typeof id === "string" && Object.prototype.hasOwnProperty.call(map, id)
const card = (id: unknown) => known(CARD_MAP, id)
const pair = (v: unknown) =>
  list(v, 2, (x) => typeof x === "boolean") && (v as unknown[]).length === 2
const side = (v: unknown) => v === "player" || v === "enemy"
const piece = (p: unknown) =>
  obj(p) &&
  text(p.uid) &&
  known(UNIT_MAP, p.id) &&
  [1, 2, 3].includes(p.star) &&
  (p.cell === null ||
    (Number.isInteger(p.cell) && p.cell >= 18 && p.cell <= 35)) &&
  list(p.items, 2, (id) => known(ITEM_MAP, id))
function battle(b: unknown): boolean {
  if (
    !obj(b) ||
    !text(b.id) ||
    !obj(b.pvp) ||
    !obj(b.pvp.names) ||
    !text(b.pvp.names.player, 24) ||
    !text(b.pvp.names.enemy, 24) ||
    !side(b.turnSide) ||
    b.stageId !== null ||
    !num(b.round) ||
    !list(b.log, 40, (x) => text(x, 500))
  )
    return false
  for (const s of ["player", "enemy"]) {
    const c = b[s]
    if (
      !obj(c) ||
      !num(c.health) ||
      !num(c.mana) ||
      !num(c.maxMana) ||
      !list(c.deck, 24, (id) => id === "hidden") ||
      !list(c.hand, 8, (id) => (s === "enemy" ? id === "hidden" : card(id))) ||
      !list(c.graveyard ?? [], 60, card) ||
      !list(
        c.board,
        4,
        (u) =>
          obj(u) &&
          text(u.uid) &&
          card(u.cardId) &&
          ["attack", "health", "maxHealth", "shield"].every((k) => num(u[k])),
      )
    )
      return false
    if (
      c.trap &&
      (!obj(c.trap) ||
        !(s === "enemy" && !c.trap.revealed
          ? c.trap.cardId === "hidden"
          : card(c.trap.cardId)))
    )
      return false
  }
  if (
    b.pendingReaction &&
    (!obj(b.pendingReaction) ||
      !text(b.pendingReaction.id) ||
      !obj(b.pendingReaction.intent) ||
      !side(b.pendingReaction.intent.actor))
  )
    return false
  return b.result === null || b.result === "win" || b.result === "loss"
}
function run(r: unknown): boolean {
  if (
    !obj(r) ||
    !text(r.id) ||
    !["prepare", "combat", "result"].includes(r.phase) ||
    !["health", "gold", "xp", "wave", "rounds", "rng", "nextUid"].every((k) =>
      num(r[k]),
    ) ||
    !list(r.roster, 18, piece) ||
    !list(r.shop, 5, (id) => id === null || known(UNIT_MAP, id)) ||
    r.shop.length !== 5 ||
    !list(r.inventory, 120, (id) => known(ITEM_MAP, id)) ||
    !list(r.augments, 30, (id) => text(id)) ||
    !list(r.log, 40, (x) => text(x, 500))
  )
    return false
  if (!r.combat) return true
  const b = r.combat
  return (
    obj(b) &&
    text(b.id) &&
    num(b.tick, 2000) &&
    list(
      b.actors,
      60,
      (u) =>
        obj(u) &&
        text(u.uid) &&
        (known(UNIT_MAP, u.id) || known(MONSTER_MAP, u.id)) &&
        ["ally", "enemy"].includes(u.side) &&
        [
          "cell",
          "hp",
          "maxHp",
          "attack",
          "armor",
          "mana",
          "shield",
          "interval",
          "range",
          "power",
          "star",
          "next",
          "casts",
        ].every((k) => num(u[k])) &&
        list(u.items, 2, (id) => known(ITEM_MAP, id)) &&
        (!u.action ||
          (obj(u.action) &&
            ["move", "attack", "cast"].includes(u.action.kind) &&
            ["start", "hit", "end", "from", "to"].every((k) =>
              num(u.action[k]),
            ))),
    ) &&
    list(
      b.events,
      120,
      (e) =>
        obj(e) &&
        text(e.source) &&
        text(e.target) &&
        num(e.cell) &&
        num(e.tick) &&
        num(e.amount) &&
        ["ember", "tide", "grove", "hearth", "sugar"].includes(e.school),
    )
  )
}
export function validRoomView(v: unknown): v is RoomView {
  if (
    !obj(v) ||
    !text(v.id) ||
    !["tcg", "auto"].includes(v.mode) ||
    ![0, 1].includes(v.seat) ||
    !Number.isSafeInteger(v.revision) ||
    v.revision < 0 ||
    !pair(v.connected) ||
    !pair(v.ready) ||
    !list(v.names, 2, (n) => n === null || text(n, 24)) ||
    v.names.length !== 2 ||
    !["lobby", "playing", "finished"].includes(v.phase) ||
    ![null, 0, 1, "draw"].includes(v.winner) ||
    typeof v.canAct !== "boolean" ||
    !num(v.cooldownMs, 60000)
  )
    return false
  if (v.mode === "tcg") {
    if (v.auto !== null || (v.tcg !== null && !battle(v.tcg))) return false
    const p = v.presentation
    return (
      p === null ||
      (obj(p) &&
        text(p.battleId) &&
        num(p.sequence) &&
        battle(p.before) &&
        list(
          p.frames,
          64,
          (f) =>
            obj(f) &&
            obj(f.event) &&
            side(f.event.side) &&
            text(f.event.kind) &&
            text(f.event.label, 500) &&
            (f.event.cardId === undefined || card(f.event.cardId)) &&
            battle(f.before) &&
            battle(f.battle),
        ))
    )
  }
  const a = v.auto
  return (
    v.tcg === null &&
    v.presentation === null &&
    (a === null ||
      (obj(a) &&
        run(a.run) &&
        obj(a.opponent) &&
        list(a.opponent.roster, 18, piece) &&
        ["health", "gold", "xp"].every((k) => num(a.opponent[k])) &&
        num(a.round) &&
        ["farm", "pvp"].includes(a.kind) &&
        ["prepare", "combat", "result"].includes(a.phase) &&
        pair(a.ready) &&
        (!a.last ||
          (obj(a.last) &&
            ["farm", "pvp"].includes(a.last.kind) &&
            [null, 0, 1, "draw"].includes(a.last.winner) &&
            list(a.last.damage, 2, (n) => num(n))))))
  )
}
