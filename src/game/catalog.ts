import { foodProfile, specializeCard } from "./cardAbilities"
import { BUILT_IN_DISHES } from "../infrastructure/catalog/dishCatalog"
import { hasFoodAsset } from "../infrastructure/assets/foodAssets"
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
  common: { name: "Thường", dust: 50, salvage: 5 },
  rare: { name: "Hiếm", dust: 140, salvage: 15 },
  epic: { name: "Sử thi", dust: 360, salvage: 40 },
  legendary: { name: "Huyền thoại", dust: 800, salvage: 100 },
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
const dishCatalog = BUILT_IN_DISHES
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
    return foodProfile({
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
      lore: `${d.description ?? d.name}. Tâm huyết người nấu lưu thành Ấn Vị trong món ăn. Chủ tướng gọi Vị Linh từ hương thơm để bảo vệ ký ức bếp nhà trước Sương Nhạt.`,
      art: d.imageUrl?.startsWith("/assets/food/")
        ? d.imageUrl
        : `/assets/food/full/${d.id}.webp`,
      symbol: SCHOOLS[school].symbol,
      set: d.limitedEventId ? "Di sản thế giới" : "Khởi nguyên",
    }, h)
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
// The caravan set opens low-cost alternatives and an area-damage strategy.
const caravan: GameCard[] = [
  {
    id: "caravan-scout",
    name: "Trinh sát than hồng",
    school: "ember",
    rarity: "common",
    kind: "unit",
    cost: 1,
    attack: 1,
    health: 2,
    keywords: ["rush"],
    symbol: "↟",
    text: "Xung phong.",
    lore: "An đánh dấu đường về bằng những đốm than trong chiếc đèn nhỏ.",
    set: "Đoàn lữ hành",
  },
  {
    id: "caravan-smith",
    name: "Thợ rèn lửa đỏ",
    school: "ember",
    rarity: "rare",
    kind: "unit",
    cost: 3,
    attack: 3,
    health: 3,
    keywords: ["drain"],
    symbol: "♨",
    text: "Hút vị.",
    lore: "Anh rèn muôi, chưa từng rèn một thanh kiếm. Cả hai đều cần can đảm.",
    set: "Đoàn lữ hành",
  },
  {
    id: "caravan-letter",
    name: "Người đưa thư biển",
    school: "tide",
    rarity: "rare",
    kind: "unit",
    cost: 2,
    attack: 1,
    health: 3,
    keywords: [],
    effect: "draw",
    power: 1,
    symbol: "✉",
    text: "Khi vào sân: rút 1 lá.",
    lore: "Không lá thư nào bị bỏ lại, kể cả thư gửi cho một thành phố đã mất tên.",
    set: "Đoàn lữ hành",
  },
  {
    id: "caravan-ferryman",
    name: "Lái đò sương bạc",
    school: "tide",
    rarity: "common",
    kind: "unit",
    cost: 3,
    attack: 2,
    health: 5,
    keywords: ["guard"],
    symbol: "◈",
    text: "Hộ vệ.",
    lore: "Ông thuộc lòng mọi bến đò, nhưng vẫn hỏi mỗi hành khách muốn về đâu.",
    set: "Đoàn lữ hành",
  },
  {
    id: "caravan-herbalist",
    name: "Cô hái lá thuốc",
    school: "grove",
    rarity: "common",
    kind: "unit",
    cost: 2,
    attack: 1,
    health: 4,
    keywords: [],
    effect: "heal",
    power: 2,
    symbol: "❧",
    text: "Khi vào sân: hồi 2 máu chủ tướng.",
    lore: "Cô mang theo một chiếc giỏ trống để luôn có chỗ cho điều bất ngờ.",
    set: "Đoàn lữ hành",
  },
  {
    id: "caravan-gardener",
    name: "Người trồng bình minh",
    school: "grove",
    rarity: "epic",
    kind: "unit",
    cost: 4,
    attack: 2,
    health: 6,
    keywords: ["guard"],
    effect: "heal",
    power: 3,
    symbol: "♧",
    text: "Hộ vệ. Khi vào sân: hồi 3 máu chủ tướng.",
    lore: "Anh gieo cây ở nơi bếp đã tắt. Mỗi gốc cây là một lời mời trở về.",
    set: "Đoàn lữ hành",
  },
  {
    id: "caravan-porter",
    name: "Người gánh bếp",
    school: "hearth",
    rarity: "common",
    kind: "unit",
    cost: 1,
    attack: 1,
    health: 3,
    keywords: ["guard"],
    symbol: "⬡",
    text: "Hộ vệ.",
    lore: "Một bên là nồi cơm. Bên kia là chỗ dành cho ký ức người khác.",
    set: "Đoàn lữ hành",
  },
  {
    id: "caravan-cook",
    name: "Bếp trưởng đường xa",
    school: "hearth",
    rarity: "rare",
    kind: "unit",
    cost: 4,
    attack: 3,
    health: 6,
    keywords: ["shield"],
    symbol: "♨",
    text: "Lá chắn 1.",
    lore: "Chỉ cần ba hòn đá và một đốm lửa, anh có thể biến đường xa thành nhà.",
    set: "Đoàn lữ hành",
  },
  {
    id: "caravan-pastry",
    name: "Thợ bánh mặt trăng",
    school: "sugar",
    rarity: "common",
    kind: "unit",
    cost: 2,
    attack: 2,
    health: 3,
    keywords: ["shield"],
    symbol: "☾",
    text: "Lá chắn 1.",
    lore: "Cô để một chiếc bánh trên cửa sổ mỗi đêm, cho vì sao đi lạc.",
    set: "Đoàn lữ hành",
  },
  {
    id: "caravan-cartographer",
    name: "Người vẽ đường sao",
    school: "sugar",
    rarity: "epic",
    kind: "unit",
    cost: 3,
    attack: 2,
    health: 4,
    keywords: [],
    effect: "draw",
    power: 1,
    symbol: "✦",
    text: "Khi vào sân: rút 1 lá.",
    lore: "Bản đồ của cô không đánh dấu kho báu. Nó đánh dấu nơi có người đợi.",
    set: "Đoàn lữ hành",
  },
  {
    id: "caravan-flare",
    name: "Chảo lửa rực trời",
    school: "ember",
    rarity: "rare",
    kind: "spell",
    cost: 3,
    attack: 0,
    health: 0,
    keywords: [],
    effect: "sweep",
    power: 2,
    symbol: "✹",
    text: "Quét sân: gây 2 sát thương lên mọi đồng minh địch.",
    lore: "Nhiên hất chiếc chảo lên, những đốm lửa vẽ một mặt trời giữa sương.",
    set: "Đoàn lữ hành",
  },
  {
    id: "caravan-rain",
    name: "Mưa muối bạc",
    school: "tide",
    rarity: "common",
    kind: "spell",
    cost: 2,
    attack: 0,
    health: 0,
    keywords: [],
    effect: "sweep",
    power: 1,
    symbol: "◈",
    text: "Quét sân: gây 1 sát thương lên mọi đồng minh địch.",
    lore: "Cơn mưa rửa đi điều dối trá, để lại những ký ức còn nguyên vị.",
    set: "Đoàn lữ hành",
  },
  {
    id: "caravan-thorns",
    name: "Rễ xuyên màn sương",
    school: "grove",
    rarity: "epic",
    kind: "spell",
    cost: 4,
    attack: 0,
    health: 0,
    keywords: [],
    effect: "sweep",
    power: 3,
    symbol: "❧",
    text: "Quét sân: gây 3 sát thương lên mọi đồng minh địch.",
    lore: "Cây nhớ đường về, kể cả khi con người đã quên.",
    set: "Đoàn lữ hành",
  },
  {
    id: "caravan-banquet",
    name: "Bữa cơm lữ hành",
    school: "hearth",
    rarity: "rare",
    kind: "spell",
    cost: 4,
    attack: 0,
    health: 0,
    keywords: [],
    effect: "heal",
    power: 12,
    symbol: "⬡",
    text: "Hồi 12 máu chủ tướng.",
    lore: "Một chiếc khăn trải xuống đất cũng đủ thành bàn ăn cho mọi người.",
    set: "Đoàn lữ hành",
  },
  {
    id: "caravan-map",
    name: "Bản đồ đường sao",
    school: "sugar",
    rarity: "rare",
    kind: "spell",
    cost: 2,
    attack: 0,
    health: 0,
    keywords: [],
    effect: "draw",
    power: 2,
    symbol: "✧",
    text: "Rút 2 lá.",
    lore: "Đi theo chòm sao hình chiếc muôi. Phía cuối trời có bếp đang chờ.",
    set: "Đoàn lữ hành",
  },
]
const chefPortraits: Record<string, string> = {
  "chef-nhien": "nhien",
  "chef-moc": "moc",
  "chef-lien": "lien",
  "chef-bach": "bach",
  "chef-hai": "hai",
}
export const CARDS: GameCard[] = [...foods, ...extras, ...champions, ...caravan].map((card) => ({
  ...specializeCard(card),
  art: card.art ?? (chefPortraits[card.id]
    ? `/assets/tcg/characters/anime/${chefPortraits[card.id]}.webp`
    : `/assets/tcg/cards/${card.id}.webp`),
}))
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
