import { DUEL_CARD_MAP, combatCard, duelTrait, isDuel } from "../duelCards"
import type { BattleSide, BattleUnit, TacticalBattleState } from "./types"

export function upgradeDuelBattle(
  current: TacticalBattleState,
): TacticalBattleState {
  if (!current.cardGame || isDuel(current)) return current
  const s = structuredClone(current)
  s.cardGame!.rulesVersion = 3
  s.cardGame!.botLevel ??= "hard"
  s.cardGame!.stats = {
    player: { spells: 0, traps: 0, summons: 0, kills: 0, healing: 0 },
    enemy: { spells: 0, traps: 0, summons: 0, kills: 0, healing: 0 },
  }
  for (const u of s.units) {
    const maxHp = Math.max(1, Math.round(u.maxHp / 10))
    u.hp = u.defeated ? 0 : Math.max(1, Math.ceil((maxHp * u.hp) / u.maxHp))
    u.maxHp = maxHp
    u.attack = Math.max(0, Math.round(u.attack / 6))
    u.ultimatePower = Math.max(3, Math.round(u.ultimatePower / 6))
    u.shield = Math.min(3, Math.ceil(u.shield / 10))
    if (u.cardId && DUEL_CARD_MAP[u.cardId])
      u.name = DUEL_CARD_MAP[u.cardId].name
    if (s.boss?.unitId === u.instanceId) {
      u.role = "guardian"
      if (s.round === 1 && !s.processedActionIds.length) u.summonedRound = 1
    }
    if (u.burn) u.burn.damage = 1
    u.spellShield = !u.defeated && duelTrait(s, u, "spellshield")
  }
  if (s.cardGame!.directed?.pending)
    s.cardGame!.directed.pending.legacyTarget = true
  if (s.cardGame!.directed?.event) delete s.cardGame!.directed.event.impacts
  s.log.push({
    id: `duel-v3:${s.log.length}`,
    text: "Luật Giao Ước: chỉ số gọn, sát thương thống nhất; Hộ vệ chắn chủ tướng. Bài và tiến trình được giữ nguyên.",
  })
  return s
}
export function duelTargets(s: TacticalBattleState, u: BattleUnit) {
  const foe = u.side === "player" ? "enemy" : "player"
  const units = s.units.filter((v) => v.side === foe && !v.defeated),
    guards = units.filter((v) => v.role === "guardian")
  return guards.length
    ? guards.map((v) => v.instanceId)
    : [...units.map((v) => v.instanceId), `hero:${foe}`]
}
export function duelBonus(s: TacticalBattleState, side: BattleSide) {
  const units = s.units.filter((u) => u.side === side && !u.defeated),
    schools = units.flatMap((u) =>
      u.cardId ? [combatCard(s, u.cardId).school] : [],
    )
  return [...new Set(schools)].some(
    (school) => schools.filter((v) => v === school).length >= 4,
  )
    ? 2
    : new Set(schools).size >= 3
      ? 1
      : 0
}
export function hurtDuel(u: BattleUnit, damage: number) {
  const blocked = Math.min(u.shield, damage)
  u.shield -= blocked
  u.hp = Math.max(0, u.hp - damage + blocked)
  u.defeated = u.hp === 0
}
export function protectDuelSpell(s: TacticalBattleState, u: BattleUnit) {
  if (!isDuel(s) || !u.spellShield) return false
  u.spellShield = false
  s.log.push({
    id: `${s.log.length}`,
    text: `Hộ pháp của ${u.name} chặn hiệu ứng rồi tan biến.`,
  })
  return true
}
export function duelStrike(
  s: TacticalBattleState,
  attacker: BattleUnit,
  power: number,
  targetId: string | undefined,
  ultimate: boolean,
) {
  const foe: BattleSide = attacker.side === "player" ? "enemy" : "player"
  targetId ??= duelTargets(s, attacker)[0]
  const target = s.units.find((u) => u.instanceId === targetId && !u.defeated)
  const ability = attacker.cardId
    ? combatCard(s, attacker.cardId).ability
    : null
  const extra =
    target &&
    ((ability === "duelist" && target.hp === target.maxHp) ||
      (ability === "execute" && target.hp < target.maxHp))
      ? 2
      : 0
  const damage = Math.max(0, power + duelBonus(s, attacker.side) + extra)
  if (target) {
    if (ability === "siphon") {
      const stolen = Math.min(2, target.shield)
      target.shield -= stolen
      attacker.shield += stolen
    }
    const retaliation =
      !ultimate && (target.stunnedUntil ?? 0) < s.round
        ? target.attack + duelBonus(s, target.side)
        : 0
    const excess = Math.max(0, damage - target.hp - target.shield)
    hurtDuel(target, damage)
    if (duelTrait(s, attacker, "overwhelm") && excess)
      s.commanders[foe].hp = Math.max(0, s.commanders[foe].hp - excess)
    const counter =
      retaliation > 0 && !(duelTrait(s, attacker, "quick") && target.defeated)
    if (counter) {
      hurtDuel(attacker, retaliation)
      target.energy = Math.min(100, target.energy + 10)
    }
    s.log.push({
      id: `${s.log.length}`,
      text: `${attacker.name} ${
        ultimate ? "tung tuyệt kỹ" : "đánh"
      } ${target.name}: ${damage} sát thương${
        counter ? `, nhận ${retaliation} phản đòn` : ""
      }${
        excess && duelTrait(s, attacker, "overwhelm")
          ? `, xuyên ${excess} vào chủ tướng`
          : ""
      }.`,
    })
  } else {
    s.commanders[foe].hp = Math.max(0, s.commanders[foe].hp - damage)
    s.log.push({
      id: `${s.log.length}`,
      text: `${attacker.name} đánh chủ tướng: −${damage} HP (cùng thang với công).`,
    })
  }
  if (
    damage > 0 &&
    attacker.cardId &&
    combatCard(s, attacker.cardId).keywords.includes("drain")
  )
    s.commanders[attacker.side].hp = Math.min(
      30,
      s.commanders[attacker.side].hp + 1,
    )
  attacker.energy = Math.min(100, attacker.energy + 25)
}
