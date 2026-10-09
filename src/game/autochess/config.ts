import { TICKS_PER_SECOND } from "./types"

export const BENCH_SLOTS = 9
export const MAX_LEVEL = 9
// Cumulative XP: levels 3–9. Existing levels keep their original gates.
export const LEVEL_XP = [0, 8, 20, 38, 62, 92, 128] as const
export const OVERTIME_SECONDS = 55
export const OVERTIME_TICKS = OVERTIME_SECONDS * TICKS_PER_SECOND
export const battleSpeed = (tick: number, selected: number) => tick >= OVERTIME_TICKS ? 3 : selected
