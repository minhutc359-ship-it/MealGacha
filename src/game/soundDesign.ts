import type { MusicTrack } from "./audioScore"
export type AmbienceKind = "market" | "water" | "garden" | "kitchen" | "night"
export function ambienceFor(track?: MusicTrack): AmbienceKind | null {
 if (!track) return null
 if (track.startsWith("v4-")) return /harbor/.test(track) ? "water" : /market/.test(track) ? "market" : "kitchen"
 if (/boss|battle|pressure/.test(track)) return null
 if (/harbor|expedition/.test(track)) return "water"
 if (/market|lobby|prepare/.test(track)) return "market"
 if (/mystery/.test(track)) return "night"
 if (/kitchen|warm|story/.test(track)) return "kitchen"
 return "garden"
}
/** Original loop synthesis: soft wind/water, tiny bells and periodic night chirps. */
export function fillAmbience(data: Float32Array, sampleRate: number, kind: AmbienceKind) {
 let seed = 440, smooth = 0
 const length = data.length
 for (let i=0;i<length;i++) {
  const t=i/sampleRate, phase=i/length*Math.PI*2
  seed=(Math.imul(seed,1664525)+1013904223)>>>0
  const noise=seed/2147483648-1
  smooth=smooth*.965+noise*.035
  const swell=.65+.35*Math.sin(phase*2)
  const bell=Math.sin(t*2*Math.PI*784)*Math.exp(-((t%2.4)*9))*.045
  const chirp=Math.sin(t*2*Math.PI*(2400+Math.sin(phase*8)*650))*Math.max(0,Math.sin(phase*6))**12*.02
  data[i]=kind==="water" ? smooth*.48*swell+noise*.006 : kind==="market" ? smooth*.17+bell : kind==="kitchen" ? smooth*.23+noise*.003 : smooth*.2+chirp
 }
 // Smooth both ends to zero; no discontinuity at the loop boundary.
 const fade=Math.min(Math.floor(sampleRate*.035),Math.floor(length/2))
 for(let i=0;i<fade;i++){const g=Math.sin(i/fade*Math.PI*.5)**2;data[i]*=g;data[length-1-i]*=g}
}
