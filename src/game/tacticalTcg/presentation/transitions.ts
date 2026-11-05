import type {
  BattleSide,
  BattleUnit,
  TacticalBattleState,
} from "../engine/types"
import { TACTICAL_CARD_MAP } from "../cards"
import { isDuel } from "../duelCards"
import type { School } from "../../types"
import type { CharacterMotion } from "../../tcgCharacterMotion"

export interface TacticalDelta {
  id: string
  side: BattleSide
  hp: number
  shield: number
  attack: number
  spawned: boolean
  fallen: boolean
  upgraded: boolean
  statuses: ("root" | "freeze" | "burn" | "heal" | "shield")[]
}
export interface TacticalTransition {
  impacts: { id: string ; hp: number ; shield: number }[]
  id: string
  kind: "attack" | "ultimate" | "summon" | "upgrade" | "spell" | "trap" | "move" | "round" | "reaction" | "negate" | "turn" | "intent"
  targetId?: string
  trapCardId?: string
  note?: string
  side: BattleSide
  sourceId: string
  cardId: string | null
  school: School
  contact: number
  duration: number
  deltas: TacticalDelta[]
  combo: { name: string ; detail: string } | null
  before: TacticalBattleState
}
const livingSchools = (s: TacticalBattleState, side: BattleSide) =>
  new Set(
    s.units
      .filter((u) => u.side === side && !u.defeated && u.cardId)
      .map((u) => TACTICAL_CARD_MAP[u.cardId!].school),
  ).size
export function tacticalTransition(
  before: TacticalBattleState,
  after: TacticalBattleState,
): TacticalTransition | null {
  if (before === after || before.battleId !== after.battleId) return null
  const id = after.processedActionIds[after.processedActionIds.length - 1]
  if (!id || before.processedActionIds.includes(id)) return null
  const explicit = after.cardGame?.directed?.event
  const action = explicit?.id === id ? explicit : null
  const source = before.units.find(
    (u) =>
      id.endsWith(`:${u.instanceId}`) ||
      id.startsWith(`move:${before.round}:${u.instanceId}:`),
  )
  const deltas: TacticalDelta[] = after.units
    .map((u) => {
      const old = before.units.find((v) => v.instanceId === u.instanceId)
      return {
        id: u.instanceId,
        side: u.side,
        hp: u.hp - (old?.hp ?? 0),
        shield: u.shield - (old?.shield ?? 0),
        attack: u.attack - (old?.attack ?? 0),
        spawned: !old || !!(old.defeated && !u.defeated),
        fallen: !!old && !old.defeated && u.defeated,
        upgraded: !!old && u.star > old.star,
        statuses: [
          ...((u.rootedUntil ?? 0) >= after.round &&
          (old?.rootedUntil ?? 0) < after.round
            ? ["root" as const]
            : []),
          ...((u.stunnedUntil ?? 0) >= after.round &&
          (old?.stunnedUntil ?? 0) < after.round
            ? ["freeze" as const]
            : []),
          ...((u.burn &&
            (!old?.burn || u.burn.remaining !== old.burn.remaining)) ||
          (old?.burn && !u.burn && u.hp < old.hp)
            ? ["burn" as const]
            : []),
          ...(old && u.hp > old.hp && !old.defeated ? ["heal" as const] : []),
          ...(old && u.shield > old.shield ? ["shield" as const] : []),
        ],
      }
    })
    .filter(
      (d) =>
        d.hp ||
        d.shield ||
        d.attack ||
        d.spawned ||
        d.fallen ||
        d.upgraded ||
        d.statuses.length,
    )
  for (const side of ["player", "enemy"] as const) {
    const hp = after.commanders[side].hp - before.commanders[side].hp
    if (hp)
      deltas.push({
        id: `hero:${side}`,
        side,
        hp,
        shield: 0,
        attack: 0,
        spawned: false,
        fallen: false,
        upgraded: false,
        statuses: hp > 0 ? ["heal"] : [],
      })
  }
  const changedOwner =
    (["player", "enemy"] as const).find(
      (side) =>
        before.cardGame &&
        after.cardGame &&
        after.cardGame.sides[side].hand.length <
          before.cardGame.sides[side].hand.length,
    ) ??
    (["player", "enemy"] as const).find(
      (side) =>
        before.cardGame &&
        after.cardGame &&
        after.cardGame.sides[side].mana < before.cardGame.sides[side].mana,
    )
  const born = after.units.find((u) =>
    deltas.some((d) => d.id === u.instanceId && (d.spawned || d.upgraded)),
  )
  const trap = after.traps.find(
    (t) => !before.traps.some((old) => old.instanceId === t.instanceId),
  )
  const side =
    action?.side ??
    source?.side ??
    changedOwner ??
    born?.side ??
    trap?.side ??
    "player"
  const oldOwner = before.cardGame?.sides[side],
    owner = after.cardGame?.sides[side]
  const spentSpell = owner?.discard
    .slice(oldOwner?.discard.length ?? 0)
    .find((card) => TACTICAL_CARD_MAP[card]?.kind === "spell")
  const kind: TacticalTransition["kind"] =
    action?.kind ??
    (/:basic:/.test(id)
      ? "attack"
      : /(?:ultimate:|enemy-ult:)/.test(id)
        ? "ultimate"
        : spentSpell
          ? "spell"
          : born
            ? deltas.find((d) => d.id === born.instanceId)?.upgraded
              ? "upgrade"
              : "summon"
            : trap
              ? "trap"
              : id.startsWith("move:")
                ? "move"
                : "round")
  const cardId = action
    ? action.cardId
    : (source?.cardId ?? spentSpell ?? born?.cardId ?? trap?.cardId ?? null)
  const school = cardId
    ? (TACTICAL_CARD_MAP[cardId]?.school ?? "hearth")
    : "hearth"
  let combo: TacticalTransition["combo"] = null
  if (
    owner &&
    oldOwner &&
    owner.recipeRound === after.round &&
    oldOwner.recipeRound !== after.round
  )
    combo = {
      name: "CÔNG THỨC ĐỒNG VỊ",
      detail: `Hai lá cùng hệ · toàn đội +${isDuel(after) ? 1 : 5} khiên`,
    }
  else if (livingSchools(before, side) < 3 && livingSchools(after, side) >= 3)
    combo = {
      name: "MÂM CHUNG",
      detail: `Ba hệ cùng bàn · +${isDuel(after) ? 1 : 3} công khi ra đòn`,
    }
  else if (kind === "spell" && owner && owner.spellsThisRound >= 2)
    combo = {
      name: `CHUỖI PHÉP ×${owner.spellsThisRound}`,
      detail: "Nội tại phép kích hoạt theo Vị Linh đang có trên sân",
    }
  const contact =
    kind === "ultimate"
      ? 960
      : ["attack", "spell"].includes(kind)
        ? 560
        : kind === "summon"
          ? 180
          : ["reaction", "negate"].includes(kind)
            ? 380
            : 0
  const duration =
    kind === "ultimate"
      ? 2400
      : ["attack", "spell"].includes(kind)
        ? 1520
        : ["summon", "upgrade"].includes(kind)
          ? 1300
          : kind === "trap"
            ? 650
            : kind === "move"
              ? 600
              : ["turn", "reaction", "negate"].includes(kind)
                ? 1500
                : 180
  return {
    id,
    impacts: [
      ...(action?.impacts ?? []),
      ...deltas
        .filter(
          (d) =>
            (d.hp < 0 || d.shield < 0) &&
            !action?.impacts?.some((v) => v.id === d.id),
        )
        .map((d) => ({
          id: d.id,
          hp: Math.max(0, -d.hp),
          shield: Math.max(0, -d.shield),
        })),
    ],
    kind,
    side,
    sourceId:
      action?.sourceId ??
      source?.instanceId ??
      born?.instanceId ??
      `hero:${side}`,
    targetId: action?.targetId,
    trapCardId: action?.trapCardId,
    note: action?.note,
    cardId,
    school,
    contact,
    duration,
    deltas,
    combo,
    before,
  }
}
export function tacticalUnitMotion(
  unit: BattleUnit,
  transition: TacticalTransition | null,
  winner: BattleSide | null,
): { motion: CharacterMotion ; delay: number ; lead?: "attack" } {
  const d = transition?.deltas.find((d) => d.id === unit.instanceId)
  if (d?.fallen)
    return {
      motion: "fall",
      delay: transition?.contact ?? 0,
      lead: transition?.sourceId === unit.instanceId ? "attack" : undefined,
    }
  if (d?.spawned) return { motion: "summon", delay: 0 }
  if (
    transition?.sourceId === unit.instanceId &&
    transition.kind === "ultimate"
  )
    return { motion: "ultimate", delay: 0 }
  if (transition?.sourceId === unit.instanceId && transition.kind === "attack")
    return { motion: "attack", delay: 0 }
  if (transition?.sourceId === unit.instanceId && transition.kind === "move")
    return { motion: "walk", delay: 0 }
  if (transition?.sourceId === unit.instanceId && transition.kind === "intent")
    return { motion: "channel", delay: 0 }
  if (d && (d.hp < 0 || d.shield < 0))
    return { motion: "hit", delay: transition?.contact ?? 0 }
  if (d?.upgraded) return { motion: "cast", delay: 0 }
  if (d && (d.shield > 0 || d.hp > 0)) return { motion: "guard", delay: 0 }
  return { motion: winner === unit.side ? "victory" : "idle", delay: 0 }
}
