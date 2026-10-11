import { useAppStore } from "../../store/useAppStore"
import type { StoryArtId } from "../../game/storyArt"

/** Ambient motion, drawn over existing illustration; no additional raster frames. */
export function SceneAtmosphere({ art }: { art: StoryArtId }) {
  const quiet = useAppStore(s => s.user.preferences.reducedMotion || s.user.preferences.graphicsQuality === "low")
  if (quiet) return null
  const kind = ["rain-harbor", "harbor", "tide"].includes(art) ? "rain"
    : ["tomorrow-table", "tet-kitchen", "last-table"].includes(art) ? "steam" : "fireflies"
  return <div className={`scene-atmosphere is-${kind}`} aria-hidden="true">{Array.from({length: kind === "rain" ? 14 : 7},(_,i) => <i key={i} style={{left:`${(i*17+8)%100}%`,top:`${(i*23+11)%80}%`,animationDelay:`${-i*.71}s`,animationDuration:`${kind === "rain" ? 1.3+i%3*.4 : 5+i%4}s`}}/>)}</div>
}
