import { CARD_MAP } from "./catalog"
import type { BattleFrame } from "./battle"
import type { School } from "./types"
import { battleRule } from "./encounters"

export type EffectKind = "fire" | "water" | "strike" | "leaves" | "sparkle" | "heal" | "buff" | "shield" | "break" | "summon" | "draw" | "resonance" | "turn" | "vanish" | "awaken" | "finish"
export interface EffectCue {
  kind: EffectKind
  side: "player" | "enemy"
  target: string
  school: School
  projectile?: boolean
}
const SCHOOL_HIT: Record<School, EffectKind> = {
  ember: "fire",
  tide: "water",
  grove: "leaves",
  hearth: "strike",
  sugar: "sparkle",
}

// Presentation derives from reducer snapshots; it never changes the saved battle.
export function combatCues(frame: BattleFrame): EffectCue[] {
  const { before, battle, event } = frame
  const card = event.cardId ? CARD_MAP[event.cardId] : undefined
  const school = card?.school ?? "ember"
  const cues: EffectCue[] = []
  const add = (
    kind: EffectKind,
    side: EffectCue["side"],
    target: string,
    projectile = false,
  ) => {
    cues.push({ kind, side, target, school, projectile })
  }
  for (const side of ["player", "enemy"] as const) {
    const old = before[side],
      next = battle[side]
    if (next.health < old.health)
      add(
        SCHOOL_HIT[school],
        side,
        "hero",
        event.target === "hero" && side !== event.side,
      )
    if (next.health > old.health) add("heal", side, "hero")
    for (const unit of next.board) {
      const previous = old.board.find((u) => u.uid === unit.uid)
      if (!previous) {
        add("summon", side, unit.uid)
        if (unit.shield > 0) add("shield", side, unit.uid)
      } else {
        if (
          unit.attack > previous.attack ||
          unit.maxHealth > previous.maxHealth
        )
          add("buff", side, unit.uid)
        if (unit.shield > previous.shield) add("shield", side, unit.uid)
        if (
          unit.health > previous.health &&
          unit.maxHealth === previous.maxHealth
        )
          add("heal", side, unit.uid)
      }
    }
    for (const unit of old.board) {
      const nextUnit = next.board.find((u) => u.uid === unit.uid)
      const health = Math.max(0, nextUnit?.health ?? 0)
      const shield = nextUnit?.shield ?? 0
      if (health < unit.health || shield < unit.shield) {
        add(SCHOOL_HIT[school], side, unit.uid, event.target === unit.uid)
        if (shield < unit.shield) add("break", side, unit.uid)
        if (!nextUnit) add("vanish", side, unit.uid)
      }
    }
    const spent = event.kind === "play" && event.side === side ? 1 : 0
    if (next.hand.length > old.hand.length - spent)
      add("draw", side, side === "player" ? "hand" : "hero")
    if (next.resonanceUsed && !old.resonanceUsed) add("resonance", side, "hero")
  }
  if (
    event.kind === "play" &&
    card?.effect === "heal" &&
    !cues.some((c) => c.kind === "heal")
  )
    add("heal", event.side, "hero")
  if (event.kind === "turn") add("turn", event.side, "hero")
  if (
    battleRule(battle) &&
    before.enemy.health > before.enemy.maxHealth / 2 &&
    battle.enemy.health <= battle.enemy.maxHealth / 2 &&
    battle.enemy.health > 0
  )
    add("awaken", "enemy", "hero")
  for (const side of ["player", "enemy"] as const)
    if (before[side].health > 0 && battle[side].health <= 0)
      add("finish", side, "hero")
  return cues
}
