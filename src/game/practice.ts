import { startBattle, actBattle, type BattleAction } from "./battle"
import { CARD_MAP, STARTER_DECK } from "./catalog"
import type { Battle, BattleUnit } from "./types"

export const PRACTICE_LESSONS = [
  { title: "Mở đường qua Hộ vệ", goal: "Hạ Hộ vệ, rồi dùng đồng minh còn lại đánh chủ tướng.", hint: "Hộ vệ chặn đòn đánh vào chủ tướng. Mỗi đồng minh chỉ đánh một lần khi đang sẵn sàng." },
  { title: "Tự chọn nhánh Nêm vị", goal: "Đưa ý chí địch từ 3 về 0 bằng Hai nhúm gia vị.", hint: "Dậy lửa gây 3 sát thương; phép có thể nhắm chủ tướng qua Hộ vệ. Chọn nhánh trước khi xác nhận." },
  { title: "Nối Bữa cơm nhà", goal: "Ra Phở bò, rồi hồi phục bằng Ấm trà ngã rẽ để kích Bữa cơm nhà.", hint: "Triệu hồi món thuộc công thức trước, rồi dùng phép hồi. Mời ngồi lại là nhánh hồi; Gói mang theo là nhánh rút." },
] as const
const unit = (uid: string, cardId: string, attack: number, health: number, guard = false): BattleUnit => ({uid,cardId,attack,health,maxHealth:health,shield:0,ready:true,keywords:guard?["guard"]:[]})
export function practiceBattle(lesson: number): Battle {
  const b = startBattle(STARTER_DECK, null, "courage", () => .41)
  b.player.board = []; b.enemy.board = []; b.player.hand = []
  b.player.mana = b.player.maxMana = 7
  b.player.health = 20; b.enemy.health = b.enemy.maxHealth = 20
  if (lesson === 0) {
    b.player.board = [unit("practice-pho","pho-bo",4,6),unit("practice-rice","com-tam",4,6)]
    b.enemy.board = [unit("practice-guard","banh-mi",1,3,true)]
    b.enemy.health = 4
  } else if (lesson === 1) {
    b.player.hand = ["v4-two-spices"];b.player.mana = b.player.maxMana = 2
    b.player.board = [unit("practice-pho","pho-bo",2,6)]
    b.enemy.board = [unit("practice-guard","banh-mi",2,8,true)]
    b.enemy.health = 3
  } else b.player.hand = ["pho-bo","v4-crossroads-tea"]
  return b
}
export function practiceSolved(lesson: number, b: Battle) {
  return lesson === 2 ? (b.comboCounts?.home ?? 0)>0 : b.result === "win"
}
export function practiceAction(b: Battle, action: BattleAction) {
  return actBattle(b, action, () => .41)
}
export const practiceCardName = (id: string) => CARD_MAP[id]?.name ?? id
