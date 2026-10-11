import { create } from "zustand"

export type IntroMode = "tcg" | "auto" | "adventure" | "chest"
export const INTRO_DURATION = 25_000
export const INTRO_NAMES: Record<IntroMode, string> = {
  tcg: "TCG · Nối vị thành combo",
  auto: "Auto chess · Xếp đội, giữ bàn",
  adventure: "Phiêu lưu · Gặp gỡ Vị Linh",
  chest: "Rương · Mở món, sưu tầm",
}

interface IntroState {
  mode: IntroMode | null
  open: (mode: IntroMode) => void
  close: () => void
}
// Transient UI only: never persist this state or dispatch a live game action.
export const useModeIntroStore = create<IntroState>((set) => ({
  mode: null,
  open: (mode) => set({ mode }),
  close: () => set({ mode: null }),
}))

export function introTime(elapsed: number, delta: number, running: boolean) {
  if (!running) return elapsed
  return Math.min(INTRO_DURATION, Math.max(0, elapsed + Math.max(0, Math.min(delta, 250))))
}
