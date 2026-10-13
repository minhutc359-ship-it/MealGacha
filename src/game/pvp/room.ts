import {
  actPvpBattle,
  startPvpBattle,
  type BattleAction,
  type BattlePresentation,
} from "../battle"
import { assertDeckForRules, CARD_MAP } from "../catalog"
import { CURRENT_TCG_RULES } from "../tcgRules"
import { frameDuration } from "../combatDirection"
import type { Battle, BattleSide } from "../types"
import {
  advanceCombat,
  combatantsAlive,
  combatReady,
  createCombat,
  createPvpCombat,
} from "../autochess/combat"
import { createAutoRun, refreshShop, random } from "../autochess/economy"
import { reduceAuto, type AutoAction } from "../autochess/reducer"
import { emptyAutoSave, type AutoRun, type Piece } from "../autochess/types"
import { ITEM_COMPONENTS } from "../autochess/items"
export const ROOM_VERSION = 490
export type Seat = 0 | 1
export type RoomMode = "tcg" | "auto"
export type Profile = { name: string; deck: string[] }
export type RoomCommand =
  | { type: "ready"; value: boolean }
  | { type: "tcg"; action: BattleAction }
  | { type: "auto"; action: AutoAction }
  | { type: "rematch" }
  | { type: "surrender" }
export type AutoRoom = {
  runs: [AutoRun, AutoRun]
  round: number
  farmWave: number
  phase: "prepare" | "combat" | "result"
  ready: [boolean, boolean]
  last: {
    kind: "farm" | "pvp"
    winner: Seat | "draw" | null
    damage: [number, number]
  } | null
}
export type HostRoom = {
  id: string
  mode: RoomMode
  revision: number
  profiles: [Profile, Profile | null]
  connected: [boolean, boolean]
  ready: [boolean, boolean]
  phase: "lobby" | "playing" | "finished"
  winner: Seat | "draw" | null
  tcg: Battle | null
  auto: AutoRoom | null
  presentation: BattlePresentation | null
  actionReadyAt: number
  lastSequence: [number, number]
  changedAt: [number, number]
}
export type RoomView = {
  id: string
  mode: RoomMode
  revision: number
  seat: Seat
  names: [string, string | null]
  connected: [boolean, boolean]
  ready: [boolean, boolean]
  phase: HostRoom["phase"]
  winner: HostRoom["winner"]
  tcg: Battle | null
  presentation: BattlePresentation | null
  canAct: boolean
  cooldownMs: number
  auto: null | {
    run: AutoRun
    opponent: { roster: Piece[]; health: number; gold: number; xp: number }
    round: number
    kind: "farm" | "pvp"
    phase: AutoRoom["phase"]
    ready: [boolean, boolean]
    last: AutoRoom["last"]
  }
}
const sideOf = (seat: Seat): BattleSide => (seat === 0 ? "player" : "enemy")
const flipSide = (side: BattleSide): BattleSide =>
  side === "player" ? "enemy" : "player"
const clone = <T>(value: T): T => structuredClone(value)
export const roundKind = (round: number) =>
  round % 4 === 0 ? ("pvp" as const) : ("farm" as const)
export function validProfile(input: unknown, mode: RoomMode): input is Profile {
  if (!input || typeof input !== "object") return false
  const p = input as Profile
  if (
    typeof p.name !== "string" ||
    !p.name.trim() ||
    p.name.length > 24 ||
    /[\u0000-\u001f]/.test(p.name) ||
    !Array.isArray(p.deck)
  )
    return false
  if (mode === "auto") return p.deck.length === 0
  if (
    !p.deck.every(
      (id) =>
        typeof id === "string" &&
        Object.prototype.hasOwnProperty.call(CARD_MAP, id),
    )
  )
    return false
  try {
    assertDeckForRules(p.deck, CURRENT_TCG_RULES)
    return true
  } catch {
    return false
  }
}
/** Allowlist incoming actions before invoking either game engine. */
export function validCommand(input: unknown): input is RoomCommand {
  if (!input || typeof input !== "object" || Array.isArray(input)) return false
  const p = input as Record<string, unknown>,
    a = p.action as Record<string, unknown> | undefined
  const text = (v: unknown) =>
    typeof v === "string" &&
    v.length > 0 &&
    v.length <= 100 &&
    !/[\u0000-\u001f]/.test(v)
  const index = (v: unknown, max = 119) =>
    Number.isInteger(v) && Number(v) >= 0 && Number(v) <= max
  if (p.type === "ready") return typeof p.value === "boolean"
  if (p.type === "rematch" || p.type === "surrender") return true
  if (!a || typeof a !== "object" || Array.isArray(a)) return false
  if (p.type === "tcg")
    switch (a.type) {
      case "play":
        return (
          index(a.index, 7) &&
          (a.target === undefined || text(a.target)) &&
          (a.branch === undefined ||
            a.branch === "first" ||
            a.branch === "second")
        )
      case "attack":
        return text(a.uid) && text(a.target)
      case "react":
        return text(a.id) && typeof a.activate === "boolean"
      case "clear-trap":
      case "end":
        return true
      default:
        return false
    }
  if (p.type === "auto")
    switch (a.type) {
      case "buy":
        return index(a.index, 4)
      case "move":
        return (
          text(a.uid) &&
          (a.cell === null || index(a.cell, 35)) &&
          (a.swapUid === undefined || text(a.swapUid)) &&
          (a.benchSlot === undefined || index(a.benchSlot, 8))
        )
      case "sell":
        return text(a.uid)
      case "equip":
      case "unequip":
        return text(a.uid) && text(a.item)
      case "craft":
        return index(a.index) && index(a.target)
      case "reroll":
      case "lock":
      case "xp":
      case "auto-place":
      case "battle":
      case "next":
        return true
      default:
        return false
    }
  return false
}
export function createHostRoom(
  mode: RoomMode,
  profile: Profile,
  id: string = crypto.randomUUID(),
): HostRoom {
  if (!validProfile(profile, mode))
    throw Error(
      mode === "tcg"
        ? "Hãy trang bị bộ hợp lệ gồm 24 lá, tối đa 2 bản mỗi thẻ."
        : "Tên người chơi không hợp lệ.",
    )
  return {
    id,
    mode,
    profiles: [{ name: profile.name, deck: [...profile.deck] }, null],
    revision: 0,
    connected: [true, false],
    ready: [false, false],
    phase: "lobby",
    winner: null,
    tcg: null,
    auto: null,
    presentation: null,
    actionReadyAt: 0,
    lastSequence: [0, 0],
    changedAt: [0, 0],
  }
}
export function admitGuest(room: HostRoom, profile: Profile): string | null {
  if (room.profiles[1]) return "Phòng đã đủ 2 người."
  if (!validProfile(profile, room.mode))
    return "Tên hoặc bộ bài của khách không hợp lệ. Cần cùng phiên bản web."
  room.profiles[1] = { name: profile.name, deck: [...profile.deck] }
  room.connected[1] = true
  room.revision++
  room.changedAt = [room.revision, room.revision]
  return null
}
export function setGuestConnected(room: HostRoom, connected: boolean) {
  room.connected[1] = connected
  room.revision++
  room.changedAt = [room.revision, room.revision]
}
function startRoom(room: HostRoom, seed: number) {
  room.phase = "playing"
  room.winner = null
  const rng = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  if (room.mode === "tcg")
    room.tcg = startPvpBattle(
      [room.profiles[0].deck, room.profiles[1]!.deck],
      [room.profiles[0].name, room.profiles[1]!.name],
      rng,
    )
  else {
    const runs = [0, 1].map((seat) => {
      const r = createAutoRun("campaign", seed, "pvp", `${room.id}:${seat}`)
      r.scene = null
      return r
    }) as [AutoRun, AutoRun]
    room.auto = {
      runs,
      round: 1,
      farmWave: 1,
      phase: "prepare",
      ready: [false, false],
      last: null,
    }
  }
}
function beginAuto(a: AutoRoom) {
  a.phase = "combat"
  a.ready = [false, false]
  for (const r of a.runs) {
    r.rounds++
    r.phase = "combat"
    r.paused = false
    r.scene = null
    r.wave = a.farmWave
    r.lastResult = null
  }
  if (roundKind(a.round) === "pvp") {
    a.runs[0].combat = createPvpCombat(...a.runs)
    a.runs[1].combat = null
  } else for (const r of a.runs) r.combat = createCombat(r)
}
function nextAuto(a: AutoRoom) {
  if (roundKind(a.round) === "farm") a.farmWave++
  a.round++
  a.phase = "prepare"
  a.ready = [false, false]
  for (const r of a.runs) {
    r.phase = "prepare"
    r.combat = null
    r.scene = null
    r.wave = a.farmWave
    if (!r.locked) refreshShop(r)
  }
}
export function surrenderRoom(room: HostRoom, seat: Seat) {
  room.phase = "finished"
  room.winner = seat === 0 ? 1 : 0
  room.presentation = null
  if (room.tcg) room.tcg.result = seat === 0 ? "loss" : "win"
  if (room.auto) {
    const a = room.auto
    a.phase = "result"
    a.ready = [false, false]
    a.last = { kind: roundKind(a.round), winner: room.winner, damage: [0, 0] }
    for (const i of [0, 1] as const) {
      const r = a.runs[i]
      r.phase = "result"
      if (r.combat) {
        r.combat.result = i === room.winner ? "win" : "loss"
        r.combat.settled = true
      }
      r.lastResult = {
        id: `${room.id}:surrender:${i}`,
        wave: a.round,
        result: i === room.winner ? "win" : "loss",
        seconds: (r.combat?.tick ?? 0) / 20,
        survivors: 0,
        points: 0,
        damage: 0,
        gold: 0,
        reason: "Một người đã rời hoặc nhường trận giao hữu.",
      }
    }
  }
}
/** Commands are deduplicated per seat. Revision guards prevent stale hand/shop actions. */
export function applyRoomCommand(
  room: HostRoom,
  seat: Seat,
  command: RoomCommand,
  sequence: number,
  revision: number,
  now = Date.now(),
  seed = crypto.getRandomValues(new Uint32Array(1))[0],
): string | null {
  if (!validCommand(command)) return "Lệnh không hợp lệ."
  if (!Number.isSafeInteger(sequence) || sequence <= room.lastSequence[seat])
    return "Lệnh đã được xử lý."
  if (!room.connected[seat] || !room.profiles[seat])
    return "Người chơi chưa kết nối."
  room.lastSequence[seat] = sequence
  // Independent auto shops can be edited concurrently without invalidating each other.
  if (
    command.type !== "ready" &&
    (room.mode === "tcg"
      ? revision !== room.revision
      : revision < room.changedAt[seat] || revision > room.revision)
  )
    return "Bàn vừa cập nhật; hãy thử lại."
  const oldPhase = room.phase,
    oldAutoPhase = room.auto?.phase,
    oldRound = room.auto?.round
  if (command.type === "rematch") {
    if (seat !== 0 || room.phase !== "finished")
      return "Chủ phòng có thể mở trận mới sau khi trận kết thúc."
    room.phase = "lobby"
    room.ready = [false, false]
    room.winner = null
    room.tcg = null
    room.auto = null
    room.presentation = null
    room.actionReadyAt = 0
  } else if (command.type === "surrender") {
    if (room.phase !== "playing") return "Trận chưa bắt đầu."
    surrenderRoom(room, seat)
  } else if (command.type === "ready") {
    if (room.phase !== "lobby") return "Trận đã bắt đầu."
    room.ready[seat] = command.value
    if (room.ready.every(Boolean) && room.connected.every(Boolean))
      startRoom(room, seed)
  } else {
    if (room.phase !== "playing" || !room.connected.every(Boolean))
      return "Trận tạm dừng; chờ đủ hai người kết nối."
    if (command.type === "tcg") {
      if (!room.tcg || room.mode !== "tcg") return "Phòng này không chơi TCG."
      if (now < room.actionReadyAt)
        return "Đợi hiệu ứng hoàn tất để đọc bàn đấu."
      const result = actPvpBattle(room.tcg, sideOf(seat), command.action)
      if (result.error) return result.error
      room.presentation = {
        battleId: room.tcg.id,
        sequence: room.revision + 1,
        before: clone(room.tcg),
        frames: result.frames,
      }
      room.tcg = result.battle
      room.actionReadyAt =
        now +
        frameDuration(undefined) +
        result.frames.reduce((sum, f) => sum + frameDuration(f), 0)
      if (room.tcg.result) {
        room.phase = "finished"
        room.winner =
          room.tcg.player.health <= 0 && room.tcg.enemy.health <= 0
            ? "draw"
            : room.tcg.result === "win"
              ? 0
              : 1
      }
    } else {
      const a = room.auto
      if (!a || room.mode !== "auto") return "Phòng này không chơi Auto chess."
      const action = command.action
      if (action.type === "battle" || action.type === "next") {
        if (a.phase === "combat") return "Vòng đang giao chiến."
        if (a.phase === "prepare" && !combatReady(a.runs[seat]))
          return "Đặt ít nhất một quân lên bàn trong giới hạn cấp hiện tại."
        a.ready[seat] = !a.ready[seat]
        if (a.ready.every(Boolean))
          a.phase === "result" ? nextAuto(a) : beginAuto(a)
      } else {
        if (a.phase !== "prepare" || a.ready[seat])
          return "Hủy sẵn sàng trước khi đổi đội hình."
        const result = reduceAuto(
          { ...emptyAutoSave(), run: a.runs[seat] },
          action,
        )
        if (result.error) return result.error
        a.runs[seat] = result.save.run!
      }
    }
  }
  room.revision++
  room.changedAt[seat] = room.revision
  if (
    room.mode === "tcg" ||
    room.phase !== oldPhase ||
    room.auto?.phase !== oldAutoPhase ||
    room.auto?.round !== oldRound
  )
    room.changedAt = [room.revision, room.revision]
  return null
}
/** Only the host advances combat. Peer-supplied ticks/checkpoints are never accepted. */
export function tickRoom(room: HostRoom, ticks = 1): boolean {
  const a = room.auto
  if (
    room.phase !== "playing" ||
    !room.connected.every(Boolean) ||
    !a ||
    a.phase !== "combat"
  )
    return false
  const pvp = roundKind(a.round) === "pvp",
    indices: Seat[] = pvp ? [0] : [0, 1]
  for (const i of indices) {
    const r = advanceCombat(a.runs[i], ticks)
    if (r.combat?.pendingScene) {
      r.seenScenes.push(r.combat.pendingScene)
      r.combat.pendingScene = null
      r.scene = null
    }
    a.runs[i] = r
  }
  if (
    indices.some(
      (i) => !a.runs[i].combat?.result && (a.runs[i].combat?.tick ?? 0) < 1800,
    )
  )
    return true
  const damage: [number, number] = [0, 0]
  let winner: Seat | "draw" | null = null
  if (pvp) {
    const b = a.runs[0].combat!,
      allies = combatantsAlive(b, "ally"),
      enemies = combatantsAlive(b, "enemy")
    winner =
      (!allies && !enemies) || (allies && enemies) ? "draw" : !enemies ? 0 : 1
    if (winner !== "draw")
      damage[winner === 0 ? 1 : 0] = Math.min(
        25,
        10 + 2 * (winner === 0 ? allies : enemies),
      )
  }
  for (const i of [0, 1] as const) {
    const r = a.runs[i],
      won = pvp ? winner === i : r.combat?.result === "win",
      gold = 5 + (won ? 1 : 0) + Math.min(3, Math.floor(r.gold / 10))
    r.health = Math.max(0, r.health - damage[i])
    r.gold += gold
    r.xp = Math.min(1000, r.xp + 2)
    if (!pvp && won && r.inventory.length < 120)
      r.inventory.push(
        ITEM_COMPONENTS[Math.floor(random(r) * ITEM_COMPONENTS.length)].id,
      )
    r.phase = "result"
    r.lastResult = {
      id: `${room.id}:${a.round}:${i}`,
      wave: a.round,
      result: won ? "win" : "loss",
      seconds: (pvp ? a.runs[0].combat?.tick : (r.combat?.tick ?? 0))! / 20,
      survivors: 0,
      points: 0,
      damage: damage[i],
      gold,
      reason: pvp
        ? winner === "draw"
          ? "Hòa · không mất ý chí."
          : "Đối đầu người chơi · quân trở lại ở vòng sau."
        : "Farm đồ · không mất ý chí khi thua quái.",
    }
    r.log = [
      `Vòng ${a.round} · ${pvp ? "PvP" : "Farm"} · +${gold} vàng${damage[i] ? ` · −${damage[i]} ý chí` : ""}`,
      ...r.log,
    ].slice(0, 20)
  }
  a.phase = "result"
  a.last = { kind: pvp ? "pvp" : "farm", winner, damage }
  a.ready = [false, false]
  if (a.runs.some((r) => r.health === 0)) {
    room.phase = "finished"
    room.winner = a.runs.every((r) => r.health === 0)
      ? "draw"
      : a.runs[0].health === 0
        ? 1
        : 0
  }
  room.revision++
  room.changedAt = [room.revision, room.revision]
  return true
}
/** Project before serialization, including every animation's before/after state. */
export function battleView(input: Battle, seat: Seat): Battle {
  const b = clone(input)
  if (seat === 1) {
    ;[b.player, b.enemy] = [b.enemy, b.player]
    if (b.turnSide) b.turnSide = flipSide(b.turnSide)
    if (b.result) b.result = b.result === "win" ? "loss" : "win"
    for (const f of b.pendingFlavors ?? []) f.owner = flipSide(f.owner)
    if (b.pendingReaction)
      b.pendingReaction.intent.actor = flipSide(b.pendingReaction.intent.actor)
    if (b.pvp) {
      ;[b.pvp.names.player, b.pvp.names.enemy] = [
        b.pvp.names.enemy,
        b.pvp.names.player,
      ]
      if (b.pvp.reactionOwner)
        b.pvp.reactionOwner = flipSide(b.pvp.reactionOwner)
    }
  }
  b.opponent = b.pvp!.names.enemy
  b.player.deck = b.player.deck.map(() => "hidden")
  b.enemy.deck = b.enemy.deck.map(() => "hidden")
  b.enemy.hand = b.enemy.hand.map(() => "hidden")
  if (b.enemy.trap && !b.enemy.trap.revealed) b.enemy.trap.cardId = "hidden"
  if (b.pvp?.reactionOwner !== "player") delete b.pendingReaction
  else if (b.pendingReaction) delete b.pendingReaction.intent.index
  delete b.rngState
  return b
}
function mirrorAuto(r: AutoRun, own: AutoRun): AutoRun {
  const b = clone(r.combat!)
  for (const actor of b.actors) {
    actor.side = actor.side === "ally" ? "enemy" : "ally"
    actor.cell = 35 - actor.cell
    if (actor.action) {
      actor.action.from = 35 - actor.action.from
      actor.action.to = 35 - actor.action.to
    }
  }
  for (const event of b.events) event.cell = 35 - event.cell
  if (b.result) b.result = b.result === "win" ? "loss" : "win"
  if (b.pvp) {
    ;[b.pvp.traits.ally, b.pvp.traits.enemy] = [
      b.pvp.traits.enemy,
      b.pvp.traits.ally,
    ]
    ;[b.pvp.augments.ally, b.pvp.augments.enemy] = [
      b.pvp.augments.enemy,
      b.pvp.augments.ally,
    ]
  }
  return { ...clone(own), combat: b, phase: r.phase }
}
export function roomView(
  room: HostRoom,
  seat: Seat,
  now = Date.now(),
): RoomView {
  const project = (b: Battle) => battleView(b, seat)
  const presentation = room.presentation
    ? {
        ...room.presentation,
        before: project(room.presentation.before),
        frames: room.presentation.frames.map((f) => {
          const event = clone(f.event)
          if (seat === 1) event.side = flipSide(event.side)
          if (
            event.side === "enemy" &&
            ["set-trap", "trap-window", "clear-trap"].includes(event.kind)
          )
            delete event.cardId
          return { event, before: project(f.before), battle: project(f.battle) }
        }),
      }
    : null
  const canAct =
    room.connected.every(Boolean) &&
    now >= room.actionReadyAt &&
    !!room.tcg &&
    (room.tcg.pendingReaction
      ? room.tcg.pvp!.reactionOwner === sideOf(seat)
      : room.tcg.turnSide === sideOf(seat))
  const a = room.auto,
    r = a?.runs[seat],
    op = a?.runs[seat === 0 ? 1 : 0]
  return {
    id: room.id,
    mode: room.mode,
    revision: room.revision,
    seat,
    names: [room.profiles[0].name, room.profiles[1]?.name ?? null],
    connected: [...room.connected],
    ready: [...room.ready],
    phase: room.phase,
    winner: room.winner,
    tcg: room.tcg ? project(room.tcg) : null,
    presentation,
    canAct: canAct && room.phase === "playing",
    cooldownMs: Math.max(0, room.actionReadyAt - now),
    auto:
      a && r && op
        ? {
            run:
              roundKind(a.round) === "pvp" && seat === 1 && a.runs[0].combat
                ? mirrorAuto(a.runs[0], r)
                : clone(r),
            opponent: {
              roster: clone(op.roster),
              health: op.health,
              gold: op.gold,
              xp: op.xp,
            },
            round: a.round,
            kind: roundKind(a.round),
            phase: a.phase,
            ready: [...a.ready],
            last: clone(a.last),
          }
        : null,
  }
}
