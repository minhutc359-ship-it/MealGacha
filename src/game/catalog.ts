import { SEED_DISHES } from "../infrastructure/catalog/seedCatalog"
import { hasFoodAsset } from "../infrastructure/assets/foodAssets"
import localDishes from "../infrastructure/catalog/localDishes.json"
import type { Dish } from "../domain/models"
import type { GameCard, School, CardRarity, Keyword, Effect } from "./types"

export const SCHOOLS: Record<School, {
  name: string
  symbol: string
  color: string
  identity: string
}> = {
  ember: {
    name: "Hỏa vị",
    symbol: "✹",
    color: "#f39665",
    identity: "Áp lực nhanh · Xung phong",
  },
  tide: {
    name: "Hải vị",
    symbol: "◈",
    color: "#72c7df",
    identity: "Kiểm soát · Rút bài",
  },
  grove: {
    name: "Thanh vị",
    symbol: "❧",
    color: "#97caa0",
    identity: "Hồi phục · Bảo vệ",
  },
  hearth: {
    name: "Gia vị",
    symbol: "⬡",
    color: "#e4bd70",
    identity: "Phòng thủ · Cường hóa",
  },
  sugar: {
    name: "Ngọt vị",
    symbol: "✧",
    color: "#d5a7dd",
    identity: "Lá chắn · Hồi phục",
  },
}
export const RARITIES: Record<CardRarity, {
  name: string
  dust: number
  salvage: number
}> = {
  common: { name: "Thường", dust: 25, salvage: 5 },
  rare: { name: "Hiếm", dust: 70, salvage: 15 },
  epic: { name: "Sử thi", dust: 180, salvage: 40 },
  legendary: { name: "Huyền thoại", dust: 400, salvage: 100 },
}
export const KEYWORDS: Record<Keyword, string> = {
  guard: "Hộ vệ: phải bị tấn công trước chủ tướng.",
  rush: "Xung phong: có thể tấn công ngay khi triệu hồi.",
  shield: "Lá chắn: chặn 1 sát thương, tiêu hao trước máu.",
  drain: "Hút vị: hồi máu chủ tướng bằng sát thương thực gây ra.",
}
function hash(value: string) {
  return [...value].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 17)
}
function schoolFor(category: string, tags: string[]): School {
  if (/dessert|drink|bakery/.test(category) || tags.includes("sweet"))
    return "sugar"
  if (/seafood|soup|noodle/.test(category)) return "tide"
  if (/salad|rice-roll|side/.test(category) || tags.includes("light"))
    return "grove"
  if (/grilled|fried|roast|meat|curry/.test(category) || tags.includes("spicy"))
    return "ember"
  return "hearth"
}
const dishCatalog = [
  ...new Map(
    [...SEED_DISHES, ...localDishes as Dish[]].map((d) => [d.id, d]),
  ).values(),
]
const foods: GameCard[] = dishCatalog
  .filter(
    (d) =>
      d.active &&
      (hasFoodAsset(d.id) || d.imageUrl?.startsWith("/assets/food/")),
  )
  .map((d) => {
    const h = hash(d.id)
    const school = schoolFor(d.category ?? "", d.tags)
    const cost = 1 + (h % 6)
    const defensive = school === "hearth" || school === "grove"
    const attack = Math.max(1, cost + (defensive ? -1 : 0))
    const health = cost + (defensive ? 3 : 2)
    const keywords: Keyword[] =
      school === "ember" && h % 2 === 0
        ? ["rush"]
        : school === "hearth"
          ? ["guard"]
          : school === "sugar"
            ? ["shield"]
            : []
    const effect: Effect | undefined =
      school === "grove"
        ? "heal"
        : school === "tide" && h % 3 === 0
          ? "draw"
          : undefined
    const rarity: CardRarity =
      d.rarity === "diamond" ? "legendary" : (d.rarity ?? "common")
    const text =
      [
        keywords
          .map((k) =>
            k === "guard"
              ? "Hộ vệ."
              : k === "rush"
                ? "Xung phong."
                : "Lá chắn 1.",
          )
          .join(" "),
        effect === "heal"
          ? "Khi vào sân: hồi 2 máu chủ tướng."
          : effect === "draw"
            ? "Khi vào sân: rút 1 lá."
            : "",
      ]
        .filter(Boolean)
        .join(" ") ||
      "Đồng hệ: nhận 1 lá chắn nếu trên sân có đồng minh cùng hệ."
    return {
      id: d.id,
      name: d.name,
      school,
      rarity,
      kind: "unit",
      cost,
      attack,
      health,
      keywords,
      effect,
      power: effect === "heal" ? 2 : 1,
      text,
      lore: `${d.description ?? d.name}. Khi Sương Nhạt nuốt lấy ký ức, hương vị này vẫn dẫn người lữ khách trở về nhà.`,
      art: d.imageUrl?.startsWith("/assets/food/")
        ? d.imageUrl
        : `/assets/food/full/${d.id}.webp`,
      symbol: SCHOOLS[school].symbol,
      set: d.limitedEventId ? "Di sản thế giới" : "Khởi nguyên",
    }
  })

type Extra = [string, string, School, CardRarity, number, Effect, number, string, string]
const spells: Extra[] = [
  [
    "spark",
    "Tia lửa đầu bếp",
    "ember",
    "common",
    1,
    "damage",
    2,
    "Gây 2 sát thương lên mục tiêu địch.",
    "Một tia lửa nhỏ đủ thắp lại cả căn bếp.",
  ],
  [
    "wok-storm",
    "Bão chảo lửa",
    "ember",
    "rare",
    3,
    "damage",
    5,
    "Gây 5 sát thương lên mục tiêu địch.",
    "Tiếng chảo reo át cả tiếng sấm.",
  ],
  [
    "dragon-breath",
    "Hơi thở Hỏa Long",
    "ember",
    "epic",
    5,
    "damage",
    8,
    "Gây 8 sát thương lên mục tiêu địch.",
    "Công thức được viết bằng tro đỏ.",
  ],
  [
    "last-flame",
    "Ngọn lửa cuối cùng",
    "ember",
    "legendary",
    7,
    "damage",
    11,
    "Gây 11 sát thương lên mục tiêu địch.",
    "Nhiên trao bạn ngọn lửa mà cô đã gìn giữ.",
  ],
  [
    "tea-break",
    "Một chén trà",
    "tide",
    "common",
    1,
    "draw",
    1,
    "Rút 1 lá.",
    "Đôi khi chiến thuật bắt đầu từ một khoảng lặng.",
  ],
  [
    "recipe-scroll",
    "Cuộn bí truyền",
    "tide",
    "rare",
    3,
    "draw",
    3,
    "Rút 3 lá. Tay tối đa 8 lá.",
    "Mỗi nét mực là một hành trình chưa kể.",
  ],
  [
    "tidal-cut",
    "Lưỡi dao thủy triều",
    "tide",
    "epic",
    4,
    "damage",
    6,
    "Gây 6 sát thương lên mục tiêu địch.",
    "Đầu bếp giỏi lắng nghe nhịp của biển.",
  ],
  [
    "sea-memory",
    "Ký ức đại dương",
    "tide",
    "legendary",
    4,
    "draw",
    4,
    "Rút 4 lá.",
    "Biển giữ những công thức mà người đã quên.",
  ],
  [
    "herb",
    "Lá thơm chữa lành",
    "grove",
    "common",
    1,
    "heal",
    4,
    "Hồi 4 máu chủ tướng.",
    "Mộc tìm thấy hy vọng dưới gốc cây cuối cùng.",
  ],
  [
    "spring-feast",
    "Yến tiệc mùa xuân",
    "grove",
    "rare",
    3,
    "heal",
    9,
    "Hồi 9 máu chủ tướng.",
    "Bữa cơm đầu tiên sau mùa sương.",
  ],
  [
    "forest-oath",
    "Lời thề rừng xanh",
    "grove",
    "epic",
    3,
    "ward",
    3,
    "Mọi đồng minh nhận 3 lá chắn.",
    "Không ai bị bỏ lại phía sau.",
  ],
  [
    "rebloom",
    "Mùa xanh trở lại",
    "grove",
    "legendary",
    5,
    "heal",
    16,
    "Hồi 16 máu chủ tướng.",
    "Một hạt giống đủ khiến cả lục địa thức giấc.",
  ],
  [
    "seasoning",
    "Nêm thêm hy vọng",
    "hearth",
    "common",
    1,
    "buff",
    1,
    "Mọi đồng minh nhận +1 công và +1 máu.",
    "Một chút gia vị, một chút can đảm.",
  ],
  [
    "family-table",
    "Bàn ăn sum vầy",
    "hearth",
    "rare",
    3,
    "buff",
    2,
    "Mọi đồng minh nhận +2 công và +2 máu.",
    "Sức mạnh đến từ những người cùng bàn.",
  ],
  [
    "iron-ladle",
    "Muôi sắt cổ đại",
    "hearth",
    "epic",
    2,
    "ward",
    2,
    "Mọi đồng minh nhận 2 lá chắn.",
    "Bách rèn nó để bảo vệ những bữa cơm bình yên.",
  ],
  [
    "hearth-legacy",
    "Di sản bếp nhà",
    "hearth",
    "legendary",
    5,
    "buff",
    3,
    "Mọi đồng minh nhận +3 công và +3 máu.",
    "Đây là công thức không nằm trong bất kỳ cuốn sách nào.",
  ],
  [
    "sugar-veil",
    "Màn đường tinh thể",
    "sugar",
    "common",
    1,
    "ward",
    1,
    "Mọi đồng minh nhận 1 lá chắn.",
    "Ánh sáng xuyên qua lớp đường như qua cửa kính.",
  ],
  [
    "sweet-dream",
    "Giấc mơ ngọt ngào",
    "sugar",
    "rare",
    2,
    "heal",
    6,
    "Hồi 6 máu chủ tướng.",
    "Liên kể chuyện cho những linh hồn lạc lối.",
  ],
  [
    "starlight",
    "Đường sao rơi",
    "sugar",
    "epic",
    3,
    "damage",
    4,
    "Gây 4 sát thương lên mục tiêu địch.",
    "Một vì sao rơi, một điều ước thành hình.",
  ],
  [
    "moon-banquet",
    "Dạ tiệc ánh trăng",
    "sugar",
    "legendary",
    4,
    "ward",
    4,
    "Mọi đồng minh nhận 4 lá chắn.",
    "Vầng trăng là đĩa bánh lớn nhất của trời đêm.",
  ],
]
const extras: GameCard[] = spells.map(
  ([id, name, school, rarity, cost, effect, power, text, lore]) => ({
    id,
    name,
    school,
    rarity,
    cost,
    effect,
    power,
    text,
    lore,
    kind: "spell",
    attack: 0,
    health: 0,
    keywords: [],
    symbol: SCHOOLS[school].symbol,
    set: "Bí thuật vị giác",
  }),
)
const champions: GameCard[] = [
  {
    id: "chef-nhien",
    name: "Nhiên · Giữ lửa",
    school: "ember",
    rarity: "legendary",
    kind: "unit",
    cost: 5,
    attack: 4,
    health: 5,
    keywords: ["rush", "drain"],
    symbol: "✹",
    text: "Xung phong. Hút vị.",
    lore: "Cô đầu bếp bến cảng nấu cả khi thành phố đã chìm trong sương.",
    set: "Người giữ vị",
  },
  {
    id: "chef-moc",
    name: "Mộc · Mầm sống",
    school: "grove",
    rarity: "legendary",
    kind: "unit",
    cost: 5,
    attack: 3,
    health: 8,
    keywords: ["guard"],
    effect: "heal",
    power: 4,
    symbol: "❧",
    text: "Hộ vệ. Khi vào sân: hồi 4 máu chủ tướng.",
    lore: "Người trồng lại khu vườn bằng những ký ức chưa mất.",
    set: "Người giữ vị",
  },
  {
    id: "chef-lien",
    name: "Liên · Dệt sao",
    school: "sugar",
    rarity: "legendary",
    kind: "unit",
    cost: 5,
    attack: 4,
    health: 7,
    keywords: ["shield"],
    effect: "draw",
    power: 1,
    symbol: "✧",
    text: "Lá chắn 1. Khi vào sân: rút 1 lá.",
    lore: "Chiếc bánh của cô luôn mang theo một lời hứa.",
    set: "Người giữ vị",
  },
  {
    id: "chef-bach",
    name: "Bách · Bếp trưởng",
    school: "hearth",
    rarity: "legendary",
    kind: "unit",
    cost: 6,
    attack: 4,
    health: 10,
    keywords: ["guard", "shield"],
    symbol: "⬡",
    text: "Hộ vệ. Lá chắn 1.",
    lore: "Anh không bảo vệ ngai vàng. Anh bảo vệ bàn ăn.",
    set: "Người giữ vị",
  },
  {
    id: "chef-hai",
    name: "Hải · Nghe sóng",
    school: "tide",
    rarity: "legendary",
    kind: "unit",
    cost: 5,
    attack: 3,
    health: 7,
    keywords: [],
    effect: "draw",
    power: 2,
    symbol: "◈",
    text: "Khi vào sân: rút 2 lá.",
    lore: "Mỗi con sóng mang về một câu chuyện, mỗi câu chuyện thành một công thức.",
    set: "Người giữ vị",
  },
]
export const CARDS: GameCard[] = [...foods, ...extras, ...champions]
export const CARD_MAP = Object.fromEntries(
  CARDS.map((c) => [c.id, c]),
) as Record<string, GameCard>
export const DECK_SIZE = 18
// Nine different cards, two copies each. A playable curve without grinding first.
const starterFood = [
  "banh-mi",
  "pho-bo",
  "com-tam",
  "banh-cuon",
  "bun-cha",
  "xoi",
].filter((id) => CARD_MAP[id])
export const STARTER_IDS = [...starterFood, "spark", "herb", "seasoning"]
export const STARTER_DECK = STARTER_IDS.flatMap((id) => [id, id])
export function deckErrors(
  cards: string[],
  owned: Record<string, number>,
): string[] {
  const errors: string[] = []
  if (cards.length !== DECK_SIZE)
    errors.push(`Bộ bài cần đúng ${DECK_SIZE} lá (hiện ${cards.length}).`)
  const counts: Record<string, number> = {}
  for (const id of cards) counts[id] = (counts[id] ?? 0) + 1
  for (const [id, count] of Object.entries(counts)) {
    if (!CARD_MAP[id]) errors.push("Bộ bài có thẻ không còn trong catalog.")
    else if (count > 2 || count > (owned[id] ?? 0))
      errors.push(`${CARD_MAP[id].name}: tối đa 2 lá và phải sở hữu đủ.`)
  }
  return errors
}
