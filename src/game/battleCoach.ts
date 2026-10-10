import { cardBranches, flavoredCard } from "./v4Cards"
import {
  actBattle,
  cardCost,
  playError,
  previewTarget,
  type BattleAction,
} from "./battle"
import { CARD_MAP } from "./catalog"
import { recipeReady } from "./recipes"
import type { Battle } from "./types"

type SuggestedAction = Extract<BattleAction, { type: "play" | "attack" }>
export interface BattleHint {
  title: string
  reason: string
  action: SuggestedAction | null
}
interface Candidate extends BattleHint {
  action: SuggestedAction
  score: number
}

// A small, deterministic coach. It previews legal moves; it never plays or saves.
export function getBattleHint(battle: Battle): BattleHint | null {
  if (battle.opening || battle.result || battle.settled) return null
  const candidates: Candidate[] = []
  const targets = ["hero", ...battle.enemy.board.map((unit) => unit.uid)]
  const evaluate = (action: SuggestedAction) => {
    const attempt = actBattle(battle, action)
    if (attempt.error || attempt.battle.result === "loss") return
    const next = attempt.battle
    const card = flavoredCard(
      CARD_MAP[
        action.type === "play"
          ? battle.player.hand[action.index]
          : battle.player.board.find((unit) => unit.uid === action.uid)!.cardId
      ], action.type === "play" ? action.branch : undefined)
    const removed = battle.enemy.board.filter(
      (unit) => !next.enemy.board.some((other) => other.uid === unit.uid),
    )
    const damage = battle.enemy.health - next.enemy.health
    const fieldDamage = battle.enemy.board.reduce((sum, unit) => {
      const survivor = next.enemy.board.find((other) => other.uid === unit.uid)
      return sum + unit.health - (survivor?.health ?? 0)
    }, 0)
    const healed = next.player.health - battle.player.health
    let score = 0,
      reason = "",
      title = ""
    if (action.type === "attack") {
      const forecast = previewTarget(battle, action, action.target)
      score =
        (action.target === "hero" ? 40 : 20) +
        damage * 2 +
        fieldDamage * 2 +
        removed.length * 15 +
        removed.filter((unit) => unit.keywords.includes("guard")).length * 25 -
        forecast.counter -
        (forecast.attackerDefeated ? 14 : 0)
      title = `Cho ${card.name} tấn công`
      reason =
        action.target === "hero"
          ? `Nhấn chủ tướng địch: gây ${forecast.damage} sát thương, không tốn năng lượng.`
          : `Nhấn ${CARD_MAP[battle.enemy.board.find((unit) => unit.uid === action.target)!.cardId].name}: ${forecast.text.toLocaleLowerCase("vi")}.`
    } else if (card.kind === "unit") {
      const cost = cardCost(battle.player, card)
      score =
        (battle.player.board.length ? 32 : 60) +
        card.attack +
        card.health / 2 -
        cost +
        (card.keywords.includes("rush") ? 8 : 0) +
        (card.keywords.includes("guard") && battle.player.health < 15
          ? 20
          : 0) +
        (cost < card.cost ? 5 : 0)
      title = `Gọi ${card.name}`
      reason = `${cost} năng lượng${
        cost < card.cost ? " nhờ Cộng hưởng" : ""
      }. ${
        card.keywords.includes("rush")
          ? "Xung phong: đánh ngay."
          : "Vị Linh sẽ đánh từ lượt sau."
      }`
    } else {
      score =
        damage +
        fieldDamage * 3 +
        removed.length * 30 +
        removed.filter((unit) => unit.keywords.includes("guard")).length * 20
      if (card.ability?.startsWith("steep-")) score += card.power! * 8 + 10
      if (card.ability === "unsteep") score += 45
      if (card.effect === "heal")
        score +=
          healed > 0
            ? 20 + healed * 3 + (battle.player.health < 12 ? 55 : 0)
            : 0
      if (card.effect === "draw")
        score +=
          Math.max(0, next.player.hand.length - battle.player.hand.length + 1) *
          8
      if (card.effect === "buff")
        score += battle.player.board.reduce((sum, unit) => {
          const other = next.player.board.find(
            (after) => after.uid === unit.uid,
          )
          if (!other) return sum - unit.attack * 2 - unit.health
          return (
            sum + (other.attack - unit.attack) * 3 + other.health - unit.health
          )
        }, 0)
      if (card.effect === "ward")
        score +=
          next.player.board.reduce((sum, unit) => sum + unit.shield, 0) -
          battle.player.board.reduce((sum, unit) => sum + unit.shield, 0)
      const revived = next.player.board.filter(unit => !battle.player.board.some(old => old.uid === unit.uid))
      score += revived.reduce((sum, unit) => sum + 20 + unit.attack * 3 + unit.health, 0)
      score += next.enemy.board.filter(unit => unit.frozen && !battle.enemy.board.find(old => old.uid === unit.uid)?.frozen)
        .reduce((sum, unit) => sum + 12 + unit.attack * 5, 0)
      if (card.effect === "heal") score += battle.player.board.reduce((sum, unit) => {
        const healedUnit = next.player.board.find(other => other.uid === unit.uid)
        return sum + Math.max(0, (healedUnit?.health ?? unit.health) - unit.health) * 3
      }, 0)
      if (!battle.player.board.some(unit => unit.keywords.includes("guard")) && next.player.board.some(unit => unit.keywords.includes("guard"))) score += 15
      if (healed < 0) score += healed * 15
      title = `Dùng ${card.name}`
      reason =
        card.effect === "damage"
          ? `Chọn ${
              action.target === "hero"
                ? "chủ tướng địch"
                : CARD_MAP[
                    battle.enemy.board.find(
                      (unit) => unit.uid === action.target,
                    )!.cardId
                  ].name
            }. Phép vượt Hộ vệ và không nhận phản đòn.`
          : card.text
    }
    if (action.type === "play") {
      const recipe = recipeReady(battle.player, card)
      if (recipe && attempt.frames.some((f) => f.event.kind === "combo")) {
        score += 35
        title = `Hoàn thành ${recipe.name}`
        reason = `${recipe.reward} ${reason}`
      }
    }
    if (attempt.battle.result === "win") {
      score = 10000
      reason = `Nước đi này giúp thắng ngay. ${reason}`
    }
    if (score > 0) candidates.push({ title, reason, action, score })
  }
  for (const unit of battle.player.board.filter((unit) => unit.ready))
    for (const target of targets)
      evaluate({ type: "attack", uid: unit.uid, target })
  battle.player.hand.forEach((id, index) => {
    for (const branch of cardBranches(CARD_MAP[id])) {
      if (playError(battle, index, branch)) continue
      const card = flavoredCard(CARD_MAP[id], branch)
      if (card.ability === "unsteep") {
        for (const effect of battle.pendingFlavors ?? []) if (effect.owner === "enemy") evaluate({ type: "play", index, branch, target: effect.id })
      } else if (card.kind === "spell" && card.effect === "damage") {
        for (const target of targets) evaluate({ type: "play", index, branch, target })
      } else evaluate({ type: "play", index, branch })
    }
  })
  const best = candidates.sort((a, b) => b.score - a.score)[0]
  return (
    best ?? {
      title: "Nhường lượt để lấy đà",
      reason:
        "Kết thúc lượt để hồi năng lượng và rút bài. Bạn vẫn có thể giữ bài cho một thời điểm tốt hơn.",
      action: null,
    }
  )
}

export const DUEL_BASICS = [
  {
    title: "1 · Gọi Vị Linh",
    text: "Chọn thẻ sáng trên tay, rồi nhấn Triệu hồi. Con số trên thẻ là năng lượng cần dùng.",
  },
  {
    title: "2 · Chọn mục tiêu",
    text: "Chọn đồng minh sẵn sàng, rồi nhấn mục tiêu sáng. Quân mới chờ lượt sau; Xung phong đánh ngay.",
  },
  {
    title: "3 · Nhường lượt",
    text: "Kết thúc lượt để đối thủ chơi. Lượt sau bạn rút 1 lá, tăng và hồi đầy năng lượng.",
  },
] as const
