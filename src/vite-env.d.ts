/// <reference types="vite/client" />

declare const __AW2_PRODUCTION__: boolean

declare module "pixi.js/unsafe-eval"

declare module "virtual:dev-content-panel" {
  export const DevContentPanel: import("react").ComponentType
}

declare module "virtual:aw2-review-build" {
  import type { ReviewBuildInfo } from "./aw2/review/feedback"
  const build: ReviewBuildInfo
  export default build
}
