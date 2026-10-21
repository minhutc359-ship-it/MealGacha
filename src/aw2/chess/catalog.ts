export const CHESS_PROFILE = "aw2-chess-practice-v1" as const
export const CHESS_SEED = 20261021
export const CHESS_POOL_COPIES = 9
export const CHESS_BENCH_LIMIT = 6
export const CHESS_ROUNDS = 5
export const CHESS_TICK_LIMIT = 80
export const CHESS_UNITS = [
  {
    id: "aw2-than",
    name: "Than",
    cost: 2,
    health: 36,
    attack: 5,
    range: 1,
    skill: "Mỗi nhịp 4: tự nhận 4 khiên.",
  },
  {
    id: "aw2-lua",
    name: "Lửa Nhỏ",
    cost: 2,
    health: 20,
    attack: 9,
    range: 1,
    skill: "Mỗi nhịp 4: thêm 4 sát thương khi đánh mục tiêu trong tầm.",
  },
  {
    id: "aw2-lam",
    name: "Lam Lam",
    cost: 2,
    health: 22,
    attack: 4,
    range: 3,
    skill: "Mỗi nhịp 4: hồi 6 máu cho đồng đội có tỷ lệ máu thấp nhất.",
  },
  {
    id: "aw2-moc-non",
    name: "Mộc Non",
    cost: 3,
    health: 26,
    attack: 5,
    range: 2,
    skill: "Mỗi nhịp 4: cho đồng đội ít máu nhất 4 khiên.",
  },
  {
    id: "aw2-suong",
    name: "Sương Lành",
    cost: 3,
    health: 22,
    attack: 7,
    range: 3,
    skill: "Mỗi nhịp 4: gây 2 sát thương lên toàn bộ đối thủ.",
  },
] as const
export type ChessSpiritId = typeof CHESS_UNITS[number]["id"]
export function chessUnit(id: ChessSpiritId) {
  const unit = CHESS_UNITS.find((candidate) => candidate.id === id)
  if (!unit) throw Error("Vị Linh chưa thuộc bộ cờ luyện tập.")
  return unit
}
export const chessCapacity = (round: number) => Math.min(5, round + 2)
