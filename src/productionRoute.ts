export type ProductionSurface = "aw2" | "chest"

/** Production has exactly one retained legacy surface: the original taste chest. */
export function productionSurface(pathname: string): ProductionSurface {
  return /^\/chest\/?$/.test(pathname) ? "chest" : "aw2"
}
