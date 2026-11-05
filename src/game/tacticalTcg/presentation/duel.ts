import type {
  BattleSide,
  BattleUnit,
  BoardCell,
  TacticalBattleState,
} from "../engine/types"

/** The saved coordinates still determine front/rear rules; empty cells are not board tiles. */
export function duelPlacement(
  s: TacticalBattleState,
  row: 0 | 1,
  moving?: string,
): BoardCell | null {
  for (const column of [0, 1, 2, 3] as const)
    if (
      !s.units.some(
        (u) =>
          !u.defeated &&
          u.side === "player" &&
          u.instanceId !== moving &&
          u.cell.row === row &&
          u.cell.column === column,
      )
    )
      return { row, column }
  return null
}
export function duelUnits(
  s: TacticalBattleState,
  side: BattleSide,
  fallen: string[] = [],
) {
  return s.units
    .filter(
      (u) => u.side === side && (!u.defeated || fallen.includes(u.instanceId)),
    )
    .sort((a, b) => a.cell.row - b.cell.row || a.cell.column - b.cell.column)
}
export function duelStatuses(s: TacticalBattleState, u: BattleUnit) {
  const statuses: { kind: string; label: string }[] = []
  if ((u.rootedUntil ?? 0) >= s.round)
    statuses.push({
      kind: "root",
      label: `Trói chân · ${u.rootedUntil! - s.round + 1} vòng`,
    })
  if ((u.stunnedUntil ?? 0) >= s.round)
    statuses.push({
      kind: "freeze",
      label: `Khống chế · ${u.stunnedUntil! - s.round + 1} vòng`,
    })
  if (u.burn)
    statuses.push({
      kind: "burn",
      label: `Thiêu đốt · ${u.burn.damage} × ${u.burn.remaining}`,
    })
  if (u.shield > 0)
    statuses.push({ kind: "shield", label: `Khiên · ${u.shield}` })
  return statuses
}
