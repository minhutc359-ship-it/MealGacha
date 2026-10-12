import { CARD_MAP } from "./catalog"
import type { Battle, BattleSide, SetTrap, TrapIntent } from "./types"
export function trapReady(b: Battle, trap?: SetTrap | null) {
  return (
    !!trap &&
    (b.rulesVersion ?? 350) >= 450 &&
    trap.setTurn < (b.turnSerial ?? 1)
  )
}
export function trapMatches(b: Battle, owner: BattleSide, intent: TrapIntent) {
  const slot = b[owner].trap,
    card = slot ? CARD_MAP[slot.cardId] : undefined,
    def = card?.trap
  if (
    b.result ||
    !def ||
    !trapReady(b, slot) ||
    owner === intent.actor ||
    def.trigger !== intent.trigger
  )
    return false
  if (def.target === "hero" && intent.target !== "hero") return false
  if (
    def.target === "unit" &&
    !b[owner].board.some((u) => u.uid === intent.target)
  )
    return false
  if (def.minCost && (CARD_MAP[intent.cardId]?.cost ?? 0) < def.minCost)
    return false
  if (
    intent.trigger === "summon" &&
    !b[intent.actor].board.some((u) => u.uid === intent.source)
  )
    return false
  if (intent.trigger === "fallen")
    return (
      !!intent.fallenCardId &&
      CARD_MAP[intent.fallenCardId]?.kind === "unit" &&
      CARD_MAP[intent.fallenCardId].cost <= 4 &&
      b[owner].board.length < 3 &&
      !!b[owner].graveyard?.includes(intent.fallenCardId)
    )
  return true
}
/** UI/coach forecasts use public information; a face-down trap cannot become an oracle. */
export function publicBattle(b: Battle): Battle {
  if (!b.enemy.trap || b.enemy.trap.revealed) return b
  return { ...b, enemy: { ...b.enemy, trap: null } }
}
export const TRIGGER_LABEL = {
  attack: "Địch tấn công",
  spell: "Địch dùng phép",
  summon: "Địch triệu hồi",
  fallen: "Đồng minh bị hạ",
} as const
export function trapStateIssue(b: Battle): string | null {
  const slots = [b.player.trap, b.enemy.trap].filter(
    (slot): slot is SetTrap => !!slot,
  )
  if ((b.rulesVersion ?? 350) < 450)
    return slots.length ||
      b.pendingReaction ||
      b.enemyPhase ||
      b.turnSerial !== undefined ||
      b.turnSide !== undefined
      ? "Trận cũ không nhận trạng thái bẫy 4.5."
      : null
  if (
    !b.turnSide ||
    b.turnSerial !== b.round * 2 - (b.turnSide === "player" ? 1 : 0)
  )
    return "Nhịp lượt bẫy không nhất quán."
  if (
    new Set(slots.map((t) => t.uid)).size !== slots.length ||
    slots.some(
      (t) =>
        t.setTurn > (b.turnSerial ?? 1) || Number(t.uid.slice(1)) >= b.nextUid,
    )
  )
    return "Ô bẫy không nhất quán."
  for (const side of ["player", "enemy"] as const) {
    const slot = b[side].trap
    if (slot && slot.setTurn % 2 !== (side === "player" ? 1 : 0))
      return "Bẫy được úp sai lượt."
  }
  const phase = b.enemyPhase,
    reaction = b.pendingReaction
  if (b.turnSide === "player" && (phase || reaction))
    return "Phản ứng bẫy nằm ngoài lượt địch."
  if (b.turnSide === "enemy" && !b.result && (!phase || !reaction))
    return "Thiếu điểm tiếp tục lượt địch."
  if (!phase && !reaction) return null
  if (
    !phase ||
    !reaction ||
    b.result ||
    b.turnSide !== "enemy" ||
    phase.cursor > phase.attacks.length ||
    new Set(phase.attacks).size !== phase.attacks.length
  )
    return "Lượt địch tạm dừng không hợp lệ."
  if (phase.phase === "plays" && (phase.attacks.length || phase.cursor))
    return "Con trỏ tấn công nằm trong pha dùng bài."
  const intent = reaction.intent,
    slot = b.player.trap
  if (
    !slot ||
    reaction.trapUid !== slot.uid ||
    intent.actor !== "enemy" ||
    !trapMatches(b, "player", intent) ||
    reaction.id !==
      `${slot.uid}:${b.turnSerial}:${phase.steps}:${phase.cursor}:${intent.trigger}`
  )
    return "Cửa sổ bẫy không khớp điều kiện."
  if (intent.trigger === "spell") {
    const card = CARD_MAP[intent.cardId],
      cost = Math.max(
        0,
        card.cost -
          (b.enemy.chainSchool === card.school && !b.enemy.resonanceUsed
            ? 1
            : 0),
      )
    if (
      intent.resume !== "play" ||
      phase.phase !== "plays" ||
      !phase.steps ||
      intent.index === undefined ||
      b.enemy.hand[intent.index] !== intent.cardId ||
      card.kind !== "spell" ||
      cost > b.enemy.mana ||
      !!card.choices !== !!intent.branch ||
      intent.source ||
      intent.fallenCardId
    )
      return "Phép đang chờ bẫy không hợp lệ."
    if (
      card.effect === "damage" &&
      intent.target !== "hero" &&
      !b.player.board.some((u) => u.uid === intent.target)
    )
      return "Mục tiêu phép đang chờ đã mất."
  } else if (intent.trigger === "attack") {
    const unit = b.enemy.board.find((u) => u.uid === intent.source),
      defender = b.player.board.find((u) => u.uid === intent.target)
    if (
      intent.resume !== "attack" ||
      phase.phase !== "attacks" ||
      phase.attacks[phase.cursor - 1] !== intent.source ||
      !unit?.ready ||
      unit.cardId !== intent.cardId ||
      intent.index !== undefined ||
      intent.branch ||
      intent.fallenCardId ||
      (intent.target !== "hero" && !defender)
    )
      return "Đòn đang chờ bẫy không hợp lệ."
    if (
      b.player.board.some((u) => u.keywords.includes("guard")) &&
      !defender?.keywords.includes("guard")
    )
      return "Đòn đang chờ vượt Hộ vệ."
  } else if (
    intent.resume !== "continue" ||
    intent.index !== undefined ||
    intent.branch
  )
    return "Bẫy sau hành động có điểm tiếp tục sai."
  return null
}
