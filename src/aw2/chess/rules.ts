import {
  CHESS_BENCH_LIMIT,
  CHESS_POOL_COPIES,
  CHESS_PROFILE,
  CHESS_ROUNDS,
  CHESS_SEED,
  CHESS_UNITS,
  chessCapacity,
  chessUnit,
} from "./catalog"
import { createChessBattle, stepChessBattle } from "./battle"
import type { ChessSpiritId } from "./catalog"
import type {
  ChessCommand,
  ChessMatch,
  ChessPiece,
  ChessSession,
} from "./types"

const log = (game: ChessMatch, text: string) => {
  game.log.push(text)
  game.log = game.log.slice(-30)
}
const copies = (unit: ChessPiece) => (unit.stars === 2 ? 3 : 1)
function refresh(game: ChessMatch) {
  for (const offer of game.offers) if (offer) game.pool[offer]++
  game.offers = []
  for (let slot = 0; slot < 3; slot++) {
    const available = CHESS_UNITS.flatMap((unit) =>
      Array.from({ length: game.pool[unit.id] }, () => unit.id),
    )
    if (!available.length) {
      game.offers.push(null)
      continue
    }
    game.rng = (Math.imul(game.rng, 1664525) + 1013904223) >>> 0
    const chosen = available[game.rng % available.length]
    game.pool[chosen]--
    game.offers.push(chosen)
  }
}
export function createChessMatch(seed = CHESS_SEED): ChessMatch {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
    throw Error("Seed cờ phải là uint32.")
  const pool = Object.fromEntries(
    CHESS_UNITS.map((unit) => [unit.id, CHESS_POOL_COPIES]),
  ) as Record<ChessSpiritId, number>
  const game: ChessMatch = {
    profile: CHESS_PROFILE,
    seed,
    rng: seed,
    serial: 0,
    round: 1,
    health: 12,
    gold: 10,
    locked: false,
    phase: "planning",
    status: "active",
    pool,
    offers: [],
    units: [],
    battle: null,
    history: [],
    log: ["Bạn mượn 10 vàng luyện tập. Hãy mua và xếp đội trước khi đấu."],
  }
  refresh(game)
  return game
}
function combine(game: ChessMatch, spiritId: ChessSpiritId) {
  const single = game.units
    .filter((unit) => unit.spiritId === spiritId && unit.stars === 1)
    .sort((a, b) => (a.cell === null ? 1 : 0) - (b.cell === null ? 1 : 0))
  if (single.length < 3) return
  const [kept, ...consumed] = single.slice(0, 3)
  kept.stars = 2
  game.units = game.units.filter(
    (unit) => !consumed.some((other) => other.uid === unit.uid),
  )
  log(
    game,
    `${chessUnit(spiritId).name} ghép thành 2 sao; giữ vị trí của bản đã xếp.`,
  )
}
function assertFormation(game: ChessMatch) {
  if (
    game.units.filter((unit) => unit.cell === null).length > CHESS_BENCH_LIMIT
  )
    throw Error("Hàng chờ đã đủ 6 chỗ.")
  const placed = game.units.filter((unit) => unit.cell !== null)
  if (placed.length > chessCapacity(game.round))
    throw Error("Đội đã đủ quân cho vòng này.")
  if (new Set(placed.map((unit) => unit.cell)).size !== placed.length)
    throw Error("Ô cờ đã có quân.")
}
function arrangeChessTeam(game: ChessMatch): ChessMatch {
  const next = structuredClone(game)
  const sorted = [...next.units].sort(
    (a, b) =>
      b.stars - a.stars ||
      chessUnit(b.spiritId).cost - chessUnit(a.spiritId).cost ||
      a.uid.localeCompare(b.uid),
  )
  next.units.forEach((unit) => {
    unit.cell = null
  })
  const used = new Set<number>()
  sorted.slice(0, chessCapacity(game.round)).forEach((unit) => {
    const preference =
      chessUnit(unit.spiritId).range === 1
        ? [0, 1, 2, 3, 4, 5]
        : [3, 4, 5, 0, 1, 2]
    unit.cell = preference.find((cell) => !used.has(cell))!
    used.add(unit.cell)
  })
  assertFormation(next)
  return next
}
export function chessOpponent(round: number): ChessPiece[] {
  const formations: ChessSpiritId[][] = [
    ["aw2-than", "aw2-lua"],
    ["aw2-than", "aw2-lua", "aw2-lam"],
    ["aw2-than", "aw2-suong", "aw2-moc-non"],
    ["aw2-than", "aw2-lua", "aw2-lam", "aw2-suong"],
    ["aw2-than", "aw2-lua", "aw2-lam", "aw2-moc-non", "aw2-suong"],
  ]
  const cells = [1, 0, 4, 3, 5]
  return formations[round - 1].map((spiritId, index) => ({
    uid: `round${round}:${index}`,
    spiritId,
    stars: 1,
    cell: cells[index],
  }))
}
export function applyChessCommand(
  game: ChessMatch,
  command: ChessCommand,
): ChessMatch {
  if (command.type === "rematch") {
    if (game.phase !== "finished")
      throw Error("Hãy hoàn tất ván trước khi chơi lại.")
    return createChessMatch((game.seed + 1) >>> 0)
  }
  if (game.phase === "finished") throw Error("Ván cờ đã kết thúc.")
  if (command.type === "surrender") {
    const next = structuredClone(game)
    next.phase = "finished"
    next.status = "opponent-win"
    log(next, "Bạn nhận thua ván luyện tập.")
    return next
  }
  if (command.type === "tick") {
    if (game.phase !== "battle" || !game.battle)
      throw Error("Chưa có giao tranh đang chạy.")
    const next = structuredClone(game)
    next.battle = stepChessBattle(game.battle)
    if (next.battle.status !== "active") {
      next.history.push(next.battle.status)
      const loss =
        next.battle.status === "opponent-win"
          ? 3
          : next.battle.status === "draw"
            ? 1
            : 0
      next.health = Math.max(0, next.health - loss)
      log(
        next,
        `Vòng ${next.round}: ${
          next.battle.status === "player-win"
            ? "bạn thắng"
            : next.battle.status === "draw"
              ? "hòa"
              : "bạn thua"
        }; mất ${loss} máu.`,
      )
      if (next.health === 0 || next.round === CHESS_ROUNDS) {
        next.phase = "finished"
        next.status = next.health > 0 ? "player-win" : "opponent-win"
        log(
          next,
          next.status === "player-win"
            ? "Bạn hoàn thành 5 vòng luyện tập."
            : "Bạn hết máu, ván luyện tập kết thúc.",
        )
      } else next.phase = "round-result"
    }
    return next
  }
  if (command.type === "next") {
    if (game.phase !== "round-result")
      throw Error("Vòng này chưa kết thúc hoặc đã được nhận.")
    const next = structuredClone(game)
    next.round++
    next.gold += 6
    next.phase = "planning"
    next.battle = null
    if (!next.locked) refresh(next)
    log(
      next,
      `Vòng ${next.round}: nhận 6 vàng; ${
        next.locked ? "giữ quầy đã khóa" : "đổi quầy"
      }.`,
    )
    return next
  }
  if (game.phase !== "planning")
    throw Error("Chỉ chỉnh đội hoặc mua bán khi chuẩn bị.")
  if (command.type === "arrange") return arrangeChessTeam(game)
  const next = structuredClone(game)
  if (command.type === "buy") {
    if (!Number.isInteger(command.slot) || command.slot < 0 || command.slot > 2)
      throw Error("Ô quầy không hợp lệ.")
    const spiritId = next.offers[command.slot]
    if (!spiritId) throw Error("Ô quầy đã trống.")
    const kit = chessUnit(spiritId)
    if (next.gold < kit.cost) throw Error("Chưa đủ vàng luyện tập.")
    next.gold -= kit.cost
    next.offers[command.slot] = null
    next.units.push({
      uid: `piece:${++next.serial}`,
      spiritId,
      stars: 1,
      cell: null,
    })
    combine(next, spiritId)
    log(next, `Mua ${kit.name}: ${kit.cost} vàng.`)
  } else if (command.type === "move" || command.type === "sell") {
    const unit = next.units.find((unit) => unit.uid === command.uid)
    if (!unit) throw Error("Quân cờ không còn ở đây.")
    if (command.type === "sell") {
      next.gold += chessUnit(unit.spiritId).cost * copies(unit)
      next.pool[unit.spiritId] += copies(unit)
      next.units = next.units.filter((candidate) => candidate.uid !== unit.uid)
      log(next, `Bán ${chessUnit(unit.spiritId).name}, trả bản về nguồn.`)
    } else {
      if (
        command.cell !== null &&
        (!Number.isInteger(command.cell) ||
          command.cell < 0 ||
          command.cell > 5)
      )
        throw Error("Chọn một trong 6 ô đội hình.")
      const other =
        command.cell === null
          ? undefined
          : next.units.find((other) => other.cell === command.cell)
      if (other && other.uid !== unit.uid) other.cell = unit.cell
      unit.cell = command.cell
    }
  } else if (command.type === "refresh") {
    if (next.locked) throw Error("Mở khóa quầy trước khi đổi.")
    if (next.gold < 1) throw Error("Cần 1 vàng để đổi quầy.")
    next.gold--
    refresh(next)
    log(next, "Đổi quầy: 1 vàng.")
  } else if (command.type === "lock") {
    next.locked = !next.locked
    log(next, next.locked ? "Đã khóa quầy qua vòng sau." : "Đã mở khóa quầy.")
  } else if (command.type === "start") {
    const players = next.units.filter((unit) => unit.cell !== null)
    if (!players.length) throw Error("Xếp ít nhất một quân trước khi đấu.")
    next.battle = createChessBattle(
      players,
      chessOpponent(next.round),
      [0, 0, 1, 1, 2][next.round - 1],
    )
    next.phase = "battle"
    log(next, `Bắt đầu vòng ${next.round}.`)
  } else throw Error("Lệnh cờ chưa hợp lệ.")
  assertFormation(next)
  return next
}
export function createChessSession(): ChessSession {
  return {
    game: createChessMatch(),
    feedback: "",
  }
}
export function reduceChessSession(
  session: ChessSession,
  command: ChessCommand,
): ChessSession {
  try {
    return { game: applyChessCommand(session.game, command), feedback: "" }
  } catch (cause) {
    return {
      ...session,
      feedback:
        cause instanceof Error
          ? cause.message
          : "Chưa thực hiện được thao tác.",
    }
  }
}
