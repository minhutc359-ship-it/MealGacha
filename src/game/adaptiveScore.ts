import type { MusicAsset, MusicStyle } from "./audioScore"
export const STEM_LOOP = 20
export const STEM_BAR = 2.5
export function usesStems(_track: MusicAsset) { return false }
export function stemPaths(_style:MusicStyle, _track?: MusicAsset) { return [] }
export function pressureGains(pressure:number) { return [1,pressure>=.3?.7:.2,pressure>=.65?.75:0] }
export function nextBar(now:number,started:number) { return started + (Math.floor(Math.max(0,now-started)/STEM_BAR)+1)*STEM_BAR }
