export const TCG_PROFILE = "aw2-tcg-practice-v1" as const
export const LEADER_HEALTH = 18
export const BOARD_LIMIT = 3
export const HAND_LIMIT = 7
export const ENERGY_LIMIT = 6
export const TURN_LIMIT = 60
export const DEFAULT_TCG_SEED = 20261021

export type TcgSpiritId = "aw2-than" | "aw2-lua" | "aw2-lam" | "aw2-moc-non" | "aw2-suong"
export type TcgEffect = "guard" | "none" | "heal-2" | "shield-others" | "mist-1" | "heal-3" | "bolt-2"
export interface TcgCardDefinition {
  id: string
  name: string
  spiritId: TcgSpiritId
  kind: "unit" | "tactic"
  cost: number
  attack: number
  health: number
  effect: TcgEffect
  description: string
}

/** Borrowed practice cards. These values do not change RPG kits or save inventory. */
export const TCG_CARDS = [
  {
    id: "aw2-tcg-than",
    name: "Than",
    spiritId: "aw2-than",
    kind: "unit",
    cost: 2,
    attack: 1,
    health: 6,
    effect: "guard",
    description:
      "Hộ vệ: đối thủ phải tấn công Than trước khi đánh mục tiêu khác.",
  },
  {
    id: "aw2-tcg-lua",
    name: "Lửa Nhỏ",
    spiritId: "aw2-lua",
    kind: "unit",
    cost: 2,
    attack: 3,
    health: 2,
    effect: "none",
    description: "Sức công cao, ít máu. Nghỉ lượt đầu như các Vị Linh khác.",
  },
  {
    id: "aw2-tcg-lam",
    name: "Lam Lam",
    spiritId: "aw2-lam",
    kind: "unit",
    cost: 2,
    attack: 1,
    health: 3,
    effect: "heal-2",
    description: "Khi vào bàn: hồi 2 máu cho bạn.",
  },
  {
    id: "aw2-tcg-moc-non",
    name: "Mộc Non",
    spiritId: "aw2-moc-non",
    kind: "unit",
    cost: 3,
    attack: 2,
    health: 4,
    effect: "shield-others",
    description: "Khi vào bàn: cho mỗi đồng đội khác 1 khiên, tối đa 3 khiên.",
  },
  {
    id: "aw2-tcg-suong",
    name: "Sương Lành",
    spiritId: "aw2-suong",
    kind: "unit",
    cost: 3,
    attack: 2,
    health: 3,
    effect: "mist-1",
    description: "Khi vào bàn: gây 1 sát thương lên mỗi Vị Linh đối phương.",
  },
  {
    id: "aw2-tcg-warm-bowl",
    name: "Chén ấm",
    spiritId: "aw2-lam",
    kind: "tactic",
    cost: 1,
    attack: 0,
    health: 0,
    effect: "heal-3",
    description:
      "Hồi 3 máu cho bạn. Không tiêu Chén cơm ấm trong túi đồ hành trình.",
  },
  {
    id: "aw2-tcg-gentle-mist",
    name: "Hơi sương",
    spiritId: "aw2-suong",
    kind: "tactic",
    cost: 2,
    attack: 0,
    health: 0,
    effect: "bolt-2",
    description:
      "Chọn một Vị Linh địch để gây 2 sát thương, có thể bỏ qua Hộ vệ.",
  },
] as const satisfies readonly TcgCardDefinition[]

export type TcgCardId = typeof TCG_CARDS[number]["id"]
export function tcgCard(id: TcgCardId): TcgCardDefinition {
  const definition = TCG_CARDS.find((card) => card.id === id)
  if (!definition) throw Error("Lá bài TCG chưa hợp lệ.")
  return definition
}
export const TCG_DECK: readonly TcgCardId[] = TCG_CARDS.flatMap((card, index) =>
  Array.from({ length: index === 6 ? 2 : 3 }, () => card.id),
)
