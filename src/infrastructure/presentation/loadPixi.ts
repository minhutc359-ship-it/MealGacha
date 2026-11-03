let pixiPromise: Promise<typeof import("pixi.js")> | undefined

/** Install Pixi's static renderer factories before exposing Pixi under strict CSP. */
export function loadPixi(): Promise<typeof import("pixi.js")> {
  pixiPromise ??= import("pixi.js/unsafe-eval").then(() => import("pixi.js"))
  return pixiPromise
}
