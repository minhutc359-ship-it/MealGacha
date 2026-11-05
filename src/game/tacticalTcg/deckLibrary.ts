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
  weakness: ({
    "ember-road": "Dễ cạn tay; cần chọn đúng nhịp tăng công và đánh.",
    "tide-letters":
      "Rút quá nhiều làm đầy tay và nhanh cạn bộ; bảo vệ nguồn rút.",
    "hearth-garden": "Thiếu áp lực kết thúc, dễ chịu Lửa Lớn hoặc phá khiên.",
    "five-hosts": "Chủ lực đắt, dễ mất nhịp nếu tay đầu chỉ có Đầu bếp.",
    "moon-garden":
      "Phụ thuộc quân hỗ trợ; khóa quân hoặc dọn bàn sẽ phá chuỗi.",
    "spell-chain":
      "Phép bị Niêm Phong không kích nội tại. Cần giữ nguồn Lửa và quân liên hoàn.",
    "trap-counter": "Chỉ giữ một bẫy; quá nhiều bẫy trên tay sẽ thiếu quân.",
    "memory-return":
      "Bẫy hồi sinh chỉ bắt quân giá tối đa 4; phải chừa ô và chờ lượt sau.",
  } as Record<string, string>)[id],
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
// Advanced directed-TCG recipes do not alter the existing intro receipt or owned decks.
TACTICAL_DECK_LIBRARY.push(
  recipe(
    "spell-chain",
    "Nhịp Phép Bên Bếp",
    "Liên hoàn · Tài nguyên",
    "Giữ Xôi xéo để phép thứ hai hồi Lửa; Bún riêu hưởng phép khác hệ. Xen kẽ phép, rút bài và đòn đánh đã tăng sức.",
    "Giữ quân rẻ và một phép; đừng giữ cả tay chỉ có phép.",
    false,
    [
      "bun-rieu",
      "xoi-xeo",
      "banh-tet",
      "pho-bo",
      "banh-mi",
      "caravan-letter",
      "chef-nhien",
      "seasoning",
      "spark",
      "recipe-scroll",
      "trap-seal",
      "v45-uncover",
    ],
  ),
  recipe(
    "trap-counter",
    "Bàn Cờ Úp Hương",
    "Phản chế · Thăm dò",
    "Niêm Phong bắt phép, Dây Lá bắt quân lớn, Gương Nước đảo đòn. Nếm Trước chỉ lộ danh tính; Lật Khăn mới gỡ bẫy.",
    "Giữ một quân rẻ và một bẫy phù hợp; tránh tay đầu toàn bẫy.",
    false,
    [
      "pho-bo",
      "banh-mi",
      "caravan-herbalist",
      "caravan-ferryman",
      "cha-ca-la-vong",
      "bun-bo-hue",
      "trap-lid",
      "trap-mirror",
      "trap-root",
      "trap-seal",
      "v45-taste",
      "v45-uncover",
    ],
  ),
  recipe(
    "memory-return",
    "Ký Ức Chưa Tắt",
    "Khi bị hạ · Hồi sinh",
    "Trao đổi quân có hiệu ứng khi bị hạ; Lá Thư giữ quân then chốt, Giỏ Hương bù tay bài. Chừa ô để nối đội hình.",
    "Giữ hộ vệ rẻ và nguồn rút/hồi; chỉ giữ hồi sinh khi có quân chơi trước.",
    false,
    [
      "banh-tet",
      "banh-chung",
      "caravan-cook",
      "caravan-pastry",
      "caravan-letter",
      "caravan-porter",
      "goi-cuon-tom-thit",
      "rebloom",
      "herb",
      "trap-recall",
      "trap-pantry",
      "v4-warm-towel",
    ],
  ),
)
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
