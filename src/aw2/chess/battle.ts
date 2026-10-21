import { CHESS_TICK_LIMIT, chessUnit } from "./catalog"
import type { ChessActor, ChessBattle, ChessPiece } from "./types"

const distance = (a: ChessActor, b: ChessActor) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
const living = (battle: ChessBattle, side: ChessActor["side"]) =>
  battle.actors.filter((actor) => actor.side === side && actor.health > 0)
export function createChessBattle(
  players: ChessPiece[],
  opponents: ChessPiece[],
  enemyBonus = 0,
): ChessBattle {
  const actors: ChessActor[] = []
  for (const [side, pieces] of [
    ["player", players],
    ["opponent", opponents],
  ] as const) {
    const deployed = pieces.filter((piece) => piece.cell !== null)
    if (
      !deployed.length ||
      deployed.length > 5 ||
      new Set(deployed.map((piece) => piece.cell)).size !== deployed.length ||
      new Set(deployed.map((piece) => piece.uid)).size !== deployed.length ||
      deployed.some(
        (piece) =>
          !Number.isInteger(piece.cell) || piece.cell! < 0 || piece.cell! > 5,
      )
    )
      throw Error("Mỗi đội cần 1–5 quân ở các ô đội hình khác nhau.")
    const diversity = new Set(deployed.map((piece) => piece.spiritId)).size
    for (const piece of deployed) {
      if (piece.cell === null) continue
      const kit = chessUnit(piece.spiritId),
        cell = piece.cell
      const health =
        Math.round(kit.health * (piece.stars === 2 ? 1.8 : 1)) +
        (diversity === 5 ? 2 : 0)
      actors.push({
        uid: `${side}:${piece.uid}`,
        spiritId: piece.spiritId,
        stars: piece.stars,
        side,
        x: cell % 3,
        y: side === "player" ? (cell < 3 ? 1 : 0) : cell < 3 ? 2 : 3,
        health,
        maxHealth: health,
        attack:
          Math.round(kit.attack * (piece.stars === 2 ? 1.6 : 1)) +
          (diversity >= 3 ? 1 : 0) +
          (side === "opponent" ? enemyBonus : 0),
        range: kit.range,
        shield: 0,
      })
    }
  }
  return {
    tick: 0,
    status: "active",
    actors,
    events: ["Hai đội đã vào bàn. Vị trí quyết định khoảng cách và mục tiêu."],
  }
}
export function stepChessBattle(battle: ChessBattle): ChessBattle {
  if (battle.status !== "active") throw Error("Giao tranh đã kết thúc.")
  const next = structuredClone(battle)
  next.tick++
  const before = battle.actors.filter((actor) => actor.health > 0)
  const damage = new Map<string, number>(),
    healing = new Map<string, number>(),
    shields = new Map<string, number>()
  const add = (map: Map<string, number>, uid: string, value: number) =>
    map.set(uid, (map.get(uid) ?? 0) + value)
  const emit = (text: string) => next.events.push(`Nhịp ${next.tick}: ${text}`)
  // Alternate movement priority; attack/heal/shield intents always use the same pre-tick snapshot.
  const movers = next.tick % 2 ? before : [...before].reverse()
  for (const original of movers) {
    const enemy = before
      .filter((actor) => actor.side !== original.side)
      .sort(
        (a, b) =>
          distance(original, a) - distance(original, b) ||
          a.uid.localeCompare(b.uid),
      )[0]
    if (!enemy) continue
    const name = chessUnit(original.spiritId).name
    if (distance(original, enemy) <= original.range) {
      add(damage, enemy.uid, original.attack)
      emit(
        `${name} đánh ${chessUnit(enemy.spiritId).name}: ${original.attack}.`,
      )
      if (next.tick % 4 === 0 && original.spiritId === "aw2-lua") {
        add(damage, enemy.uid, 4)
        emit(`${name} bồi thêm 4 sát thương trong tầm.`)
      }
    } else {
      const actor = next.actors.find((actor) => actor.uid === original.uid)!
      const options = [
        [actor.x - 1, actor.y],
        [actor.x + 1, actor.y],
        [actor.x, actor.y + 1],
        [actor.x, actor.y - 1],
      ]
        .filter(
          ([x, y]) =>
            x >= 0 &&
            x < 3 &&
            y >= 0 &&
            y < 4 &&
            !next.actors.some(
              (other) => other.health > 0 && other.x === x && other.y === y,
            ),
        )
        .map(([x, y]) => ({
          x,
          y,
          distance: Math.abs(x - enemy.x) + Math.abs(y - enemy.y),
        }))
        .filter((position) => position.distance < distance(original, enemy))
        .sort((a, b) => a.distance - b.distance || a.x - b.x || a.y - b.y)
      if (options[0]) {
        actor.x = options[0].x
        actor.y = options[0].y
        emit(`${name} tiến đến ô ${actor.x + 1},${actor.y + 1}.`)
      }
    }
    if (next.tick % 4 !== 0) continue
    const allies = before.filter((actor) => actor.side === original.side)
    if (original.spiritId === "aw2-than") {
      add(shields, original.uid, 4)
      emit(`${name} tạo 4 khiên.`)
    }
    if (original.spiritId === "aw2-lam") {
      const target = allies.sort(
        (a, b) =>
          a.health / a.maxHealth - b.health / b.maxHealth ||
          a.uid.localeCompare(b.uid),
      )[0]
      add(healing, target.uid, 6)
      emit(`${name} hồi tối đa 6 máu cho ${chessUnit(target.spiritId).name}.`)
    }
    if (original.spiritId === "aw2-moc-non") {
      const target = allies.sort(
        (a, b) => a.health - b.health || a.uid.localeCompare(b.uid),
      )[0]
      add(shields, target.uid, 4)
      emit(`${name} tạo 4 khiên cho ${chessUnit(target.spiritId).name}.`)
    }
    if (original.spiritId === "aw2-suong") {
      before
        .filter((actor) => actor.side !== original.side)
        .forEach((actor) => add(damage, actor.uid, 2))
      emit(`${name} gây 2 sát thương lên mỗi đối thủ.`)
    }
  }
  for (const actor of next.actors.filter((actor) => actor.health > 0)) {
    actor.shield = Math.min(12, actor.shield + (shields.get(actor.uid) ?? 0))
    const hit = damage.get(actor.uid) ?? 0,
      absorbed = Math.min(actor.shield, hit)
    actor.shield -= absorbed
    actor.health = Math.max(
      0,
      Math.min(actor.maxHealth, actor.health + (healing.get(actor.uid) ?? 0)) -
        hit +
        absorbed,
    )
    if (actor.health === 0) emit(`${chessUnit(actor.spiritId).name} rời bàn.`)
  }
  const player = living(next, "player").length,
    opponent = living(next, "opponent").length
  next.status =
    !player && !opponent
      ? "draw"
      : !player
        ? "opponent-win"
        : !opponent
          ? "player-win"
          : next.tick >= CHESS_TICK_LIMIT
            ? "draw"
            : "active"
  if (next.status !== "active")
    emit(
      next.status === "draw"
        ? "Vòng hòa."
        : next.status === "player-win"
          ? "Bạn thắng vòng."
          : "Đối thủ thắng vòng.",
    )
  next.events = next.events.slice(-40)
  return next
}
