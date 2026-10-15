export const GAME_INTRO_IMAGES = [
  "/assets/loading/v560/intro-lantern-market.webp",
  "/assets/loading/v560/intro-jade-adventure.webp",
  "/assets/loading/v560/intro-card-duel.webp",
  "/assets/loading/v560/intro-auto-chess.webp",
  "/assets/loading/v560/intro-card-collection.webp",
] as const

export function randomGameIntroImage(random: () => number = Math.random) {
  const roll = Math.max(0, Math.min(0.999999999999, random()))
  return GAME_INTRO_IMAGES[Math.floor(roll * GAME_INTRO_IMAGES.length)]
}
