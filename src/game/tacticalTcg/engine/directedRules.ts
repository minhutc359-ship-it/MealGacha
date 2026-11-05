import { TACTICAL_CARD_MAP, type TacticalCard } from "../cards"
import type { BattleUnit, TacticalBattleState } from "./types"

export const DIRECTED_TRAP_TEXT: Record<string, string> = {
  "trap-lid":
    "Khi Chỉ huy bị tấn công: chọn lật để chặn hoàn toàn đòn đánh. Địch vẫn tiêu lượt đánh hoặc Hương lực đã dùng.",
  "trap-mirror":
    "Khi địch tấn công: chặn đòn, phản lên Chỉ huy địch sát thương bằng công kẻ đánh/10 làm tròn lên, tối đa 4.",
  "trap-embers":
    "Trước đòn đánh địch: gây 12 sát thương và Thiêu đốt mọi quân địch chưa đánh vòng này (4 sát thương cuối vòng, 2 lần; không cộng dồn). Hủy đòn nếu kẻ đánh bị hạ.",
  "trap-root":
    "Sau khi địch triệu hồi quân giá từ 3: gây 20 sát thương, trói chân và khống chế đến hết vòng kế tiếp: không di chuyển, đánh hoặc dùng Tuyệt kỹ. Hiệu ứng vào sân đã giải quyết.",
  "trap-seal":
    "Khi địch dùng phép giá từ 2: vô hiệu phép. Địch mất lá và Lửa; phép không kích nội tại hoặc công thức.",
  "trap-ward":
    "Trước đòn đánh vào quân bạn: mọi đồng minh nhận 20 khiên, rồi đòn đánh tiếp tục.",
  "trap-recall":
    "Sau đòn đánh địch hạ đồng minh giá tối đa 4: gọi lại đúng quân đó với tối đa 20 HP nếu còn ô. Không kích vào sân, chưa được đánh.",
  "trap-pantry":
    "Sau khi địch triệu hồi quân giá từ 4: hồi 3 Ý chí và rút 2 lá. Lá dư khi tay đầy vào ký ức.",
}
export function directedCardText(c: TacticalCard) {
  if (DIRECTED_TRAP_TEXT[c.id]) return DIRECTED_TRAP_TEXT[c.id]
  if (c.ability === "reveal-trap")
    return "Lộ danh tính bẫy địch (vẫn còn hiệu lực), rồi rút 1 lá."
  if (c.ability === "disarm")
    return "Gỡ bẫy địch, đưa vào ký ức và rút 1 lá. Không kích bẫy."
  if (c.ability === "thaw")
    return `Giải trói chân/khống chế đồng minh; hồi ${c.tacticalPower} Ý chí và ${c.tacticalPower * 5} HP mỗi quân. Không hoàn đòn đã đánh.`
  if (c.ability === "thawer")
    return (
      "Vào sân: giải đóng băng đồng minh khác và cho họ +10 Hương lực. " +
      c.text
        .replace(/^Vào sân: mọi đồng minh khác \+10 Hương lực\. /, "")
        .replace("Tự đánh ", "Tấn công ")
    )
  return c.text
    .replace(
      "Vào sân: +25 Hương lực.",
      "Xung kích: được đánh ngay khi triệu hồi; +25 Hương lực.",
    )
    .replace("Tự đánh ", "Tấn công ")
}
export function enableDirectedBattle(
  s: TacticalBattleState,
): TacticalBattleState {
  if (!s.cardGame || s.cardGame.directed) return s
  const next = structuredClone(s)
  next.cardGame!.directed = {
    version: 2,
    turn: "player",
    pending: null,
    event: null,
  }
  if (!next.winner) next.phase = "planning"
  return next
}
export function directedReadiness(s: TacticalBattleState, u: BattleUnit) {
  if (u.defeated) return "fallen"
  if ((u.stunnedUntil ?? 0) >= s.round) return "stunned"
  if (
    u.summonedRound === s.round &&
    !(u.cardId && TACTICAL_CARD_MAP[u.cardId].keywords.includes("rush"))
  )
    return "summoning"
  if (s.cardGame!.attacks[u.instanceId] === s.round) return "exhausted"
  return "ready"
}
export function directedTargets(s: TacticalBattleState, u: BattleUnit) {
  const side = u.side === "player" ? "enemy" : "player",
    foes = s.units.filter((v) => v.side === side && !v.defeated)
  const front = foes.filter((v) => v.cell.row === 0),
    guards = front.filter((v) => v.role === "guardian")
  return foes.length
    ? (guards.length
        ? guards
        : u.role === "mage"
          ? foes
          : front.length
            ? front
            : foes
      ).map((v) => v.instanceId)
    : [`hero:${side}`]
}
