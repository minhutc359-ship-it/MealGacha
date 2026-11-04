import { RARITIES } from "../catalog"
import {
  TACTICAL_CARD_MAP,
  ownedTacticalCards,
  tacticalDeckErrors,
} from "./cards"
import { ensureTacticalAccount } from "./progression/cardEconomy"
import { commitTacticalProgress } from "./progression/storage"
import type { StorageLike } from "./migration/schema"

const recipe = (
  id: string,
  name: string,
  style: string,
  plan: string,
  opening: string,
  free: boolean,
  ids: string[],
) => ({
  id,
  name,
  style,
  plan,
  opening,
  free,
  cards: ids.flatMap((card) => [card, card]),
})
export const TACTICAL_DECK_LIBRARY = [
  recipe(
    "ember-road",
    "Đường Than Hồng",
    "Chủ động · Áp lực",
    "Quân rẻ lên sân sớm, tăng công rồi dùng phép dọn đường cho đòn đánh Chỉ huy.",
    "Giữ Trinh sát/Người gánh bếp; đừng giữ tất cả phép khi tay đầu chưa có quân.",
    true,
    [
      "caravan-scout",
      "caravan-smith",
      "banh-mi",
      "pho-bo",
      "com-tam",
      "bun-cha",
      "caravan-porter",
      "spark",
      "seasoning",
      "caravan-flare",
      "sugar-veil",
      "trap-ward",
    ],
  ),
  recipe(
    "tide-letters",
    "Thư Từ Bến Nước",
    "Kiểm soát · Rút bài",
    "Phở và Người đưa thư giữ tay bài; hộ vệ chắn tiền tuyến, phép xử lý địch mạnh.",
    "Giữ Phở bò/Người đưa thư và một hộ vệ. Dành Lửa cho lượt triệu hồi tiếp theo.",
    true,
    [
      "pho-bo",
      "caravan-letter",
      "caravan-ferryman",
      "caravan-porter",
      "caravan-herbalist",
      "caravan-pastry",
      "banh-mi",
      "spark",
      "sugar-veil",
      "caravan-rain",
      "herb",
      "trap-lid",
    ],
  ),
  recipe(
    "hearth-garden",
    "Khu Vườn Bên Bếp",
    "Phòng thủ · Hồi phục",
    "Khiên, hồi Ý chí và quân bền giữ bàn, sau đó tăng công để kết thúc trước Lửa Lớn.",
    "Giữ Người gánh bếp/Cô hái lá thuốc. Đặt hỗ trợ sau hộ vệ; đừng hồi khi đã đầy máu.",
    true,
    [
      "caravan-herbalist",
      "caravan-pastry",
      "caravan-cook",
      "caravan-porter",
      "banh-mi",
      "com-tam",
      "caravan-ferryman",
      "herb",
      "sweet-dream",
      "seasoning",
      "sugar-veil",
      "trap-ward",
    ],
  ),
  recipe(
    "five-hosts",
    "Mâm Chung Năm Vị",
    "Cộng hưởng · Đa hệ",
    "Phối đủ ba hệ để có Mâm Chung; giữ quân rẻ trước khi gọi các Người Giữ Vị.",
    "Giữ quân 1–2 Lửa; đổi tay nếu chỉ có Đầu bếp giá cao.",
    false,
    [
      "chef-nhien",
      "chef-hai",
      "chef-moc",
      "chef-lien",
      "chef-bach",
      "caravan-scout",
      "caravan-porter",
      "caravan-map",
      "caravan-rain",
      "family-table",
      "herb",
      "trap-ward",
    ],
  ),
  recipe(
    "moon-garden",
    "Bình Minh Dưới Trăng",
    "Bảo vệ · Duy trì bàn",
    "Ghép khiên Ngọt vị và hồi phục Thanh vị; nâng sao quân bền để giữ hiệu ứng hỗ trợ.",
    "Ưu tiên quân rẻ và một lá tạo khiên; để quân hỗ trợ ở hậu tuyến.",
    false,
    [
      "chef-moc",
      "chef-lien",
      "caravan-gardener",
      "caravan-herbalist",
      "caravan-pastry",
      "caravan-ferryman",
      "caravan-cook",
      "herb",
      "sweet-dream",
      "family-table",
      "sugar-veil",
      "trap-pantry",
    ],
  ),
]
export function deckRecipeMissing(
  cards: string[],
  copies: Record<string, number>,
) {
  const owned = ownedTacticalCards(copies)
  return [...new Set(cards)].flatMap((id) => {
    const count = Math.max(
      0,
      cards.filter((c) => c === id).length - (owned[id] ?? 0),
    )
    return count
      ? [
          {
            id,
            count,
            cost: count * RARITIES[TACTICAL_CARD_MAP[id].rarity].dust,
          },
        ]
      : []
  })
}
/** Additive welcome library: existing cards, decks, active deck and currency stay intact. */
export function ensureTacticalDeckLibrary(storage: StorageLike) {
  const progress = ensureTacticalAccount(storage)
  const receiptId = "tcg:deck-library:v1"
  if (progress.claimedRewardReceiptIds.includes(receiptId)) return progress
  const owned = ownedTacticalCards(progress.cardCopies),
    grants: Record<string, number> = {}
  const decks = [...progress.decks]
  for (const template of TACTICAL_DECK_LIBRARY.filter((t) => t.free)) {
    if (tacticalDeckErrors(template.cards).length)
      throw Error("Công thức bộ bài không hợp lệ.")
    for (const id of new Set(template.cards))
      grants[`card:${id}`] = Math.max(0, 2 - (owned[id] ?? 0))
    if (decks.length < 12) {
      let id = `intro:${template.id}`
      while (decks.some((d) => d.id === id)) id += "-new"
      decks.push({ id, name: template.name, cards: [...template.cards] })
    }
  }
  return commitTacticalProgress(storage, {
    receiptId,
    cardCopies: grants,
    decks,
  }).progress
}
