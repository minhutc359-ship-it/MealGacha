import type { CharacterId } from "./characters"

export type AdventureAreaId = "lantern-quarter" | "rain-harbor" | "herb-garden" | "tide-pier" | "moon-table"
export type AdventureDirection = "up" | "down" | "left" | "right"
interface AdventureExit {
  x: number
  y: number
  to: AdventureAreaId
  toX: number
  toY: number
  requires?: string
}
interface AdventureFind {
  id: string
  x: number
  y: number
  seals: number
  text: string
}
export interface AdventureArea {
  id: AdventureAreaId
  chapter: number
  name: string
  region: string
  summary: string
  objective: string
  art: string
  music: "v4-market-warm" | "v4-harbor-warm" | "story-warm" | "story-mystery"
  grid: string[]
  spawn: { x: number; y: number }
  encounters: string[]
  npc: { id: CharacterId; x: number; y: number; before: string; after: string }
  keeper: {
    cardId: string
    level: number
    x: number
    y: number
    title: string
    badge: string
    badgeName: string
  }
  exits: AdventureExit[]
  finds: AdventureFind[]
}

export const ADVENTURE_STARTERS = [
  "pho-bo",
  "com-tam",
  "goi-cuon-tom-thit",
] as const

export const ADVENTURE_AREAS: AdventureArea[] = [
  {
    id: "lantern-quarter",
    chapter: 1,
    name: "Phố Đèn Lồng",
    region: "Khu chợ thức giấc",
    summary: "Bách nhờ bạn đánh thức những Vị Linh đang lạc giữa mùi khói sớm.",
    objective: "Gặp Bách, rèn đội hình rồi thách Người Giữ Đèn.",
    art: "/assets/tcg/story/lantern.webp",
    music: "v4-market-warm",
    grid: [
      "############",
      "#....gg...b#",
      "#.##.gg.##.#",
      "#.g......g.#",
      "#.g.####.g.#",
      "#...i..g...#",
      "#.n....g...#",
      "#h........e#",
      "############",
    ],
    spawn: { x: 2, y: 7 },
    encounters: ["banh-mi", "xoi", "banh-cuon", "chao-suon"],
    npc: {
      id: "bach",
      x: 2,
      y: 6,
      before:
        "Đừng vội đi xa. Hãy lắng nghe nhịp chân của Vị Linh và giữ Hương Ấn cho lúc chúng yếu đi.",
      after:
        "Ấn Đèn đã sáng. Con đường ra bến mưa đang mở; cứ để món ăn dẫn lối.",
    },
    keeper: {
      cardId: "bun-cha",
      level: 7,
      x: 10,
      y: 1,
      title: "Người Giữ Đèn",
      badge: "lantern",
      badgeName: "Ấn Đèn",
    },
    exits: [
      { x: 10, y: 7, to: "rain-harbor", toX: 2, toY: 7, requires: "lantern" },
    ],
    finds: [
      {
        id: "lantern-basket",
        x: 4,
        y: 5,
        seals: 3,
        text: "Một giỏ lá thơm còn ấm · nhận 3 Hương Ấn.",
      },
    ],
  },
  {
    id: "rain-harbor",
    chapter: 2,
    name: "Bến Sau Mưa",
    region: "Những mái chèo ký ức",
    summary:
      "Nước triều mang theo tên món đã mất. Hải chờ một người đủ kiên nhẫn để nghe.",
    objective: "Tìm Hải và vượt thử thách của Người Canh Con Nước.",
    art: "/assets/tcg/story/harbor.webp",
    music: "v4-harbor-warm",
    grid: [
      "############",
      "#e..gg.....#",
      "#.##gg.##b.#",
      "#..g....g..#",
      "#..g.##.g..#",
      "#....i.....#",
      "#..n...gg..#",
      "#e....h....#",
      "############",
    ],
    spawn: { x: 2, y: 7 },
    encounters: ["pho-ga", "bun-rieu", "bun-ca", "mi-van-than"],
    npc: {
      id: "hai",
      x: 3,
      y: 6,
      before:
        "Biển không quên; chỉ có người trên bờ ngừng gọi tên. Hãy để đội của bạn nghe con nước trước khi ra cầu cảng.",
      after:
        "Bạn đã nghe được khoảng lặng giữa hai con sóng. Mang Ấn Mưa về phía vườn xanh.",
    },
    keeper: {
      cardId: "sushi",
      level: 10,
      x: 9,
      y: 2,
      title: "Người Canh Con Nước",
      badge: "harbor",
      badgeName: "Ấn Mưa",
    },
    exits: [
      { x: 1, y: 7, to: "lantern-quarter", toX: 9, toY: 7 },
      { x: 1, y: 1, to: "herb-garden", toX: 9, toY: 7, requires: "harbor" },
    ],
    finds: [
      {
        id: "harbor-crate",
        x: 5,
        y: 5,
        seals: 3,
        text: "Trong thùng gỗ là ba Hương Ấn còn khô.",
      },
    ],
  },
  {
    id: "herb-garden",
    chapter: 3,
    name: "Vườn Lá Thơm",
    region: "Lối nhỏ dưới tán xanh",
    summary:
      "Sương Nhạt làm cây quên mùa. Mộc cần bạn khôi phục vòng tuần hoàn của khu vườn.",
    objective: "Đọc lời nhắn của Mộc và đánh thức Linh Gốc Cổ Thụ.",
    art: "/assets/tcg/story/garden.webp",
    music: "story-warm",
    grid: [
      "############",
      "#....g....b#",
      "#.gg.g.gg..#",
      "#....#.....#",
      "#gg..#..gg.#",
      "#..i....g..#",
      "#.n..gg....#",
      "#e.h.....e.#",
      "############",
    ],
    spawn: { x: 9, y: 7 },
    encounters: ["goi-cuon-tom-thit", "banh-cuon", "nom-sua-xoai", "dua-hanh"],
    npc: {
      id: "moc",
      x: 2,
      y: 6,
      before:
        "Mỗi chiếc lá nhớ một bữa cơm. Đi chậm thôi, bạn sẽ thấy khu vườn tự chỉ đường.",
      after: "Rễ cây đã nhớ lại mùa mưa. Ấn Lá sẽ dẫn bạn tới cầu triều.",
    },
    keeper: {
      cardId: "goi-cuon-tom-thit",
      level: 13,
      x: 10,
      y: 1,
      title: "Linh Gốc Cổ Thụ",
      badge: "garden",
      badgeName: "Ấn Lá",
    },
    exits: [
      { x: 9, y: 7, to: "rain-harbor", toX: 2, toY: 1 },
      { x: 1, y: 7, to: "tide-pier", toX: 9, toY: 7, requires: "garden" },
    ],
    finds: [
      {
        id: "garden-satchel",
        x: 3,
        y: 5,
        seals: 4,
        text: "Mộc để lại một túi hạt thơm · nhận 4 Hương Ấn.",
      },
    ],
  },
  {
    id: "tide-pier",
    chapter: 4,
    name: "Cầu Triều Lửa",
    region: "Gió mặn và bếp đỏ",
    summary:
      "Nhiên giữ một ngọn lửa không tắt giữa gió biển, nhưng lối lên bàn trăng đã bị khóa.",
    objective: "Hợp sức với Nhiên, chiến thắng Chủ Bếp Triều Lửa.",
    art: "/assets/tcg/story/tide.webp",
    music: "story-mystery",
    grid: [
      "############",
      "#e..g.....b#",
      "#.##g.###..#",
      "#..gg......#",
      "#.....gg...#",
      "#..i.###...#",
      "#....n..g..#",
      "#e.......h.#",
      "############",
    ],
    spawn: { x: 9, y: 7 },
    encounters: ["bun-bo-hue", "banh-xeo", "com-tam", "mi-cay"],
    npc: {
      id: "nhien",
      x: 5,
      y: 6,
      before:
        "Lửa mạnh không phải lửa cháy lớn nhất. Đó là ngọn lửa biết chờ đúng món, đúng người.",
      after:
        "Giữ lấy Ấn Than. Liên đang chờ trên Bàn Trăng, nơi Sương Nhạt dày nhất.",
    },
    keeper: {
      cardId: "bun-bo-hue",
      level: 16,
      x: 10,
      y: 1,
      title: "Chủ Bếp Triều Lửa",
      badge: "tide",
      badgeName: "Ấn Than",
    },
    exits: [
      { x: 1, y: 7, to: "herb-garden", toX: 8, toY: 7 },
      { x: 1, y: 1, to: "moon-table", toX: 9, toY: 7, requires: "tide" },
    ],
    finds: [
      {
        id: "tide-chest",
        x: 3,
        y: 5,
        seals: 4,
        text: "Một hộp gia vị chống ẩm · nhận 4 Hương Ấn.",
      },
    ],
  },
  {
    id: "moon-table",
    chapter: 5,
    name: "Bàn Trăng",
    region: "Bữa cơm trên tầng mây",
    summary:
      "Liên đã dọn một chỗ trống. Chỉ còn Tiếng Vọng Nuốt Tên đứng giữa bạn và bữa cơm ngày mai.",
    objective: "Chuẩn bị đội hình cuối và hoàn thành Giao Ước Năm Vị.",
    art: "/assets/tcg/story/moon.webp",
    music: "story-mystery",
    grid: [
      "############",
      "#....gg...b#",
      "#.##.gg.##.#",
      "#..g......g#",
      "#..g.##...g#",
      "#....i.....#",
      "#..n..gg...#",
      "#e.......h.#",
      "############",
    ],
    spawn: { x: 9, y: 7 },
    encounters: ["banh-tet", "che-buoi", "croissant", "xiaolongbao"],
    npc: {
      id: "lien",
      x: 3,
      y: 6,
      before:
        "Một chỗ trống không phải là thiếu vắng. Đó là lời mời. Hãy đưa cả đội tới bàn ăn bằng tên thật của từng món.",
      after:
        "Bàn đã đủ người. Từ đây, mọi con đường đều có thể trở thành một công thức mới.",
    },
    keeper: {
      cardId: "banh-tet",
      level: 20,
      x: 10,
      y: 1,
      title: "Tiếng Vọng Nuốt Tên",
      badge: "moon",
      badgeName: "Giao Ước Năm Vị",
    },
    exits: [{ x: 1, y: 7, to: "tide-pier", toX: 2, toY: 1 }],
    finds: [
      {
        id: "moon-gift",
        x: 5,
        y: 5,
        seals: 5,
        text: "Một gói Hương Ấn đặt cạnh chỗ trống · nhận 5.",
      },
    ],
  },
]

export const ADVENTURE_AREA_MAP = Object.fromEntries(
  ADVENTURE_AREAS.map((area) => [area.id, area]),
) as Record<AdventureAreaId, AdventureArea>
