import { TACTICAL_CARD_MAP } from "../cards"
import { directedReadiness, directedTargets } from "../engine/directedRules"
import type { TacticalBattleState } from "../engine/types"

const record = (v: unknown): v is Record<string, any> =>
  !!v && typeof v === "object" && !Array.isArray(v)
const integer = (v: unknown) =>
  typeof v === "number" && Number.isInteger(v) && v >= 0
const card = (id: unknown) =>
  typeof id === "string" &&
  Object.prototype.hasOwnProperty.call(TACTICAL_CARD_MAP, id)
export function validDirectedState(s: TacticalBattleState) {
  const game = s.cardGame
  if (game?.rulesVersion !== undefined && game.rulesVersion !== 3) return false
  if (
    game?.botLevel !== undefined &&
    !["normal", "hard", "extreme"].includes(game.botLevel)
  )
    return false
  if (game?.stats !== undefined) {
    if (!record(game.stats)) return false
    for (const side of ["player", "enemy"] as const)
      if (
        !record(game.stats[side]) ||
        !["spells", "traps", "summons", "kills", "healing"].every((k) =>
          integer((game.stats![side] as any)[k]),
        )
      )
        return false
  }
  const d = s.cardGame?.directed
  if (d === undefined) return true
  if (!record(d) || d.version !== 2 || !["player", "enemy"].includes(d.turn))
    return false
  for (const u of s.units) {
    if (game?.rulesVersion === 3 && u.shield > 3) return false
    if (u.spellShield !== undefined && typeof u.spellShield !== "boolean")
      return false
    if (
      u.rootedUntil !== undefined &&
      (!integer(u.rootedUntil) || u.rootedUntil > s.round + 1)
    )
      return false
    if (
      u.burn !== undefined &&
      (!record(u.burn) ||
        u.burn.damage !== (game?.rulesVersion === 3 ? 1 : 4) ||
        ![1, 2].includes(u.burn.remaining) ||
        u.defeated)
    )
      return false
    if (
      u.summonedRound !== undefined &&
      (!integer(u.summonedRound) || u.summonedRound > s.round)
    )
      return false
    if (
      u.stunnedUntil !== undefined &&
      (!integer(u.stunnedUntil) || u.stunnedUntil > s.round + 1)
    )
      return false
  }
  if (
    s.traps.some(
      (t) => t.revealed !== undefined && typeof t.revealed !== "boolean",
    )
  )
    return false
  const e = d.event
  if (
    e?.impacts !== undefined &&
    (!Array.isArray(e.impacts) ||
      e.impacts.length > s.units.length + 2 ||
      e.impacts.some(
        (v) =>
          !record(v) ||
          typeof v.id !== "string" ||
          !(
            v.id === "hero:player" ||
            v.id === "hero:enemy" ||
            s.units.some((u) => u.instanceId === v.id)
          ) ||
          !integer(v.hp) ||
          !integer(v.shield),
      ) ||
      new Set(e.impacts.map((v) => v.id)).size !== e.impacts.length)
  )
    return false
  if (
    e !== null &&
    (!record(e) ||
      typeof e.id !== "string" ||
      !s.processedActionIds.includes(e.id) ||
      ![
        "attack",
        "ultimate",
        "summon",
        "upgrade",
        "spell",
        "trap",
        "reaction",
        "negate",
        "turn",
        "intent",
        "move",
      ].includes(e.kind) ||
      !["player", "enemy"].includes(e.side) ||
      typeof e.sourceId !== "string" ||
      !(e.cardId === null || card(e.cardId)) ||
      (e.trapCardId !== undefined &&
        (!card(e.trapCardId) ||
          TACTICAL_CARD_MAP[e.trapCardId].kind !== "trap")) ||
      (e.targetId !== undefined && typeof e.targetId !== "string") ||
      (e.note !== undefined && typeof e.note !== "string"))
  )
    return false
  const p = d.pending
  if (p === null) return s.phase === "result" || s.phase === "planning"
  if (
    !record(p) ||
    s.phase !== "reaction" ||
    d.turn !== "enemy" ||
    !["before", "after"].includes(p.stage) ||
    typeof p.id !== "string" ||
    !record(p.action) ||
    !(p.cardId === null || card(p.cardId)) ||
    !(p.affectedUnitId === null || typeof p.affectedUnitId === "string")
  )
    return false
  const t = s.traps.find(
    (t) => t.instanceId === p.trapInstanceId && t.side === "player" && t.armed,
  )
  if (!t?.cardId || !card(t.cardId)) return false
  const a = p.action
  if (p.legacyTarget !== undefined && p.legacyTarget !== true) return false
  if (
    typeof a.id !== "string" ||
    !a.id ||
    p.id !== `${a.id}|${t.instanceId}|${p.stage}` ||
    !s.processedActionIds.includes(`intent:${p.id}`) ||
    s.processedActionIds.includes(a.id) !== (p.stage === "after")
  )
    return false
  if (a.type === "play-card") {
    if (
      a.choiceIndex !== undefined &&
      (![0, 1].includes(a.choiceIndex) ||
        !p.cardId ||
        !TACTICAL_CARD_MAP[p.cardId].choices?.[a.choiceIndex])
    )
      return false
    if (a.side !== "enemy" || !integer(a.handIndex) || !p.cardId) return false
    const c = TACTICAL_CARD_MAP[p.cardId]
    if (
      a.cell !== undefined &&
      (!record(a.cell) ||
        ![0, 1].includes(a.cell.row) ||
        ![0, 1, 2, 3].includes(a.cell.column))
    )
      return false
    if (a.targetId !== undefined && typeof a.targetId !== "string") return false
    if (p.stage === "before")
      return (
        t.cardId === "trap-seal" &&
        c.kind === "spell" &&
        c.cost >= 2 &&
        s.cardGame!.sides.enemy.hand[a.handIndex] === c.id &&
        s.cardGame!.sides.enemy.mana >= c.cost &&
        p.affectedUnitId === null
      )
    const born = s.units.find(
      (u) =>
        u.instanceId === p.affectedUnitId &&
        u.side === "enemy" &&
        u.cardId === c.id &&
        u.summonedRound === s.round,
    )
    return (
      c.kind === "unit" &&
      !!born &&
      ((t.cardId === "trap-root" && c.cost >= 3) ||
        (t.cardId === "trap-pantry" && c.cost >= 4))
    )
  }
  if (a.type !== "basic" && a.type !== "ultimate") return false
  const source = s.units.find(
    (u) => u.instanceId === a.unitId && u.side === "enemy",
  )
  if (
    !source ||
    typeof a.targetId !== "string" ||
    (source.cardId ?? null) !== p.cardId
  )
    return false
  if (p.stage === "before") {
    const readiness = directedReadiness(s, source)
    return (
      !source.defeated &&
      (directedTargets(s, source).includes(a.targetId) ||
        (p.legacyTarget === true &&
          s.cardGame?.rulesVersion === 3 &&
          (a.targetId === "hero:player" ||
            s.units.some(
              (u) =>
                u.instanceId === a.targetId &&
                u.side === "player" &&
                !u.defeated,
            )))) &&
      p.affectedUnitId === a.targetId &&
      !["stunned", "summoning"].includes(readiness) &&
      (a.type === "basic" ? readiness === "ready" : source.energy >= 100) &&
      (t.cardId === "trap-mirror" ||
        t.cardId === "trap-embers" ||
        (t.cardId === "trap-lid" && a.targetId === "hero:player") ||
        (t.cardId === "trap-ward" && !a.targetId.startsWith("hero:")))
    )
  }
  const fallen = s.units.find(
    (u) =>
      u.instanceId === p.affectedUnitId &&
      u.side === "player" &&
      u.defeated &&
      u.cardId &&
      TACTICAL_CARD_MAP[u.cardId].cost <= 4,
  )
  return (
    t.cardId === "trap-recall" &&
    !!fallen &&
    s.units.filter((u) => u.side === "player" && !u.defeated).length < 5
  )
}
