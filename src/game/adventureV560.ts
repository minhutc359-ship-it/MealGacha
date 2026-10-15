export { GAME_INTRO_IMAGES as ADVENTURE_LOADING_IMAGES } from "./loadingImages"

export type AdventureHomeTab = "village" | "campaign" | "dungeon" | "heroes" | "help"
export type BattlePresentationPhase = "enter" | "ready" | "start" | "wave-clear" | "wave-enter" | "fight" | "win" | "fail"

export interface BattlePresentationBeat {
  phase: BattlePresentationPhase
  duration: number
}

export function battlePresentationSequence(
  wave: number,
  reducedMotion = false,
): BattlePresentationBeat[] {
  const scale = reducedMotion ? 0.35 : 1
  const beat = (phase: BattlePresentationPhase, duration: number) => ({
    phase,
    duration: Math.round(duration * scale),
  })
  return wave === 0
    ? [
        beat("enter", 720),
        beat("ready", 620),
        beat("start", 460),
        beat("fight", 0),
      ]
    : [
        beat("wave-clear", 720),
        beat("wave-enter", 620),
        beat("start", 420),
        beat("fight", 0),
      ]
}

export interface AdventureVillagePlace {
  id: Exclude<AdventureHomeTab, "village">
  name: string
  hint: string
  x: number
  y: number
  symbol: string
}

export const ADVENTURE_VILLAGE_PLACES: AdventureVillagePlace[] = [
  {
    id: "campaign",
    name: "Cổng Ký Ức",
    hint: "Đi map và tiếp tục câu chuyện",
    x: 21,
    y: 32,
    symbol: "◇",
  },
  {
    id: "dungeon",
    name: "Kho Sương",
    hint: "Farm tài nguyên qua 5 tầng",
    x: 77,
    y: 29,
    symbol: "✦",
  },
  {
    id: "heroes",
    name: "Nhà Giao Ước",
    hint: "Đội hình và hồ sơ Vị Linh",
    x: 24,
    y: 72,
    symbol: "♢",
  },
  {
    id: "help",
    name: "Đình Đèn",
    hint: "Hướng dẫn và trận giới thiệu",
    x: 76,
    y: 73,
    symbol: "?",
  },
]

export function nearbyVillagePlace(
  point: {
    x: number
    y: number
  },
  radius = 11,
) {
  return ADVENTURE_VILLAGE_PLACES.find(
    (place) => Math.hypot(place.x - point.x, place.y - point.y) <= radius,
  )
}
