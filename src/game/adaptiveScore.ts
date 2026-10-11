import type { MusicAsset, MusicStyle } from "./audioScore"
export const STEM_LOOP = 20
export const STEM_BAR = 2.5
export function usesStems(track: MusicAsset) { return /^((8bit-)?v4-.*-tension)$/.test(track) }
export function stemPaths(style:MusicStyle, track?: MusicAsset) {
 const region = track?.includes("harbor") ? "harbor" : track?.includes("kitchen") ? "kitchen" : "market"
 return ["base","rhythm","pressure"].map(layer=>track ? `assets/v4/audio/web410/${style}-stem-${region}-${layer}.mp3` : `assets/v4/audio/stem-${style}-${layer}.mp3`)
}
export function pressureGains(pressure:number) { return [1,pressure>=.3?.7:.2,pressure>=.65?.75:0] }
export function nextBar(now:number,started:number) { return started + (Math.floor(Math.max(0,now-started)/STEM_BAR)+1)*STEM_BAR }
