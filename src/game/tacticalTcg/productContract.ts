export const TACTICAL_PRODUCT_ID = "soul-of-meal-tactical-tcg"
export const TACTICAL_PRODUCT_VERSION = 1
export const TACTICAL_ROUTES = {
  root: "/",
  chest: "/chest",
  manga: "/?tab=manga",
  pvp: "/?tab=play&queue=pvp",
  privacy: "/legal/privacy.html",
  terms: "/legal/terms.html",
  rights: "/legal/rights.html",
} as const
export const RETIRED_PRODUCTION_PREFIXES = [
  "/game",
  "/autochess",
  "/adventure",
  "/aw2",
] as const
