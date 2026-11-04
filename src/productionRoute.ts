import {
  RETIRED_PRODUCTION_PREFIXES,
  TACTICAL_ROUTES,
} from "./game/tacticalTcg/productContract"
export type ProductionSurface = "tcg" | "chest" | "legal" | "redirect"
export interface ProductionRoute {
  surface: ProductionSurface
  destination: string | null
}
export function productionRoute(pathname: string): ProductionRoute {
  if (/^\/chest\/?$/.test(pathname))
    return { surface: "chest", destination: null }
  if (/^\/legal\/(privacy|terms|rights)\.html$/.test(pathname))
    return { surface: "legal", destination: null }
  const legal = pathname.match(/^\/legal\/(privacy|terms|rights)\/?$/)
  if (legal)
    return { surface: "redirect", destination: `/legal/${legal[1]}.html` }
  if (/^\/manga\/?$/.test(pathname))
    return { surface: "redirect", destination: TACTICAL_ROUTES.manga }
  if (/^\/pvp\/?$/.test(pathname))
    return { surface: "redirect", destination: TACTICAL_ROUTES.pvp }
  if (pathname === "/") return { surface: "tcg", destination: null }
  if (
    RETIRED_PRODUCTION_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  )
    return { surface: "redirect", destination: "/" }
  return { surface: "redirect", destination: "/" }
}
export const productionSurface = (pathname: string) =>
  productionRoute(pathname).surface
