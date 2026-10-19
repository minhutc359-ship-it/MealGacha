import { create } from "zustand"

export type IntroMode = "tcg" | "auto" | "adventure" | "chest"
export const INTRO_DURATION = 25_000
export const INTRO_NAMES: Record<IntroMode, string> = {
  tcg: "TCG · Nối vị thành combo",
  auto: "Auto chess · Xếp đội, giữ bàn",
  adventure: "Adventure · Giao ước Vị Linh",
  chest: "Rương · Mở món, sưu tầm",
}

interface IntroState {
  mode: IntroMode | null
  comic: boolean
  library: "manga" | "culture" | null
  cultureId: string | null
  comicTrigger: HTMLButtonElement | null
  open: (mode: IntroMode) => void
  openComic: (trigger?: HTMLButtonElement) => void
  openLibrary: (tab?: "manga" | "culture", id?: string, trigger?: HTMLButtonElement) => void
  close: () => void
}
// Transient UI only: never persist this state or dispatch a live game action.
export const useModeIntroStore = create<IntroState>((set) => ({
  mode: null,
  comic: false,
  library: null,
  cultureId: null,
  comicTrigger: null,
  open: (mode) => set({ mode, comic: false, library: null, cultureId: null, comicTrigger: null }),
  openComic: (trigger) =>
    set({ mode: "tcg", comic: true, library: null, cultureId: null, comicTrigger: trigger ?? null }),
  openLibrary: (tab = "manga", id, trigger) => set({ mode: "tcg", comic: false, library: tab, cultureId: id ?? null, comicTrigger: trigger ?? null }),
  close: () => set({ mode: null, comic: false, library: null, cultureId: null, comicTrigger: null }),
}))

export function introTime(elapsed: number, delta: number, running: boolean) {
  if (!running) return elapsed
  return Math.min(
    INTRO_DURATION,
    Math.max(0, elapsed + Math.max(0, Math.min(delta, 250))),
  )
}
