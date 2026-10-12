import { configureSoundEffects } from "../../infrastructure/audio/soundEngine"
import { useEffect, useSyncExternalStore } from "react"
import { useAppStore } from "../../store/useAppStore"
import { renderIsLight, setRenderPreference, subscribeRenderQuality } from "../../infrastructure/presentation/renderQuality"
export function PresentationSettings() {
 const prefs = useAppStore(state => state.user.preferences)
 const light = useSyncExternalStore(subscribeRenderQuality, renderIsLight, () => false)
 useEffect(() => configureSoundEffects(prefs.soundEnabled,prefs.effectsVolume),[prefs.soundEnabled,prefs.effectsVolume])
 useEffect(() => setRenderPreference(prefs.graphicsQuality === "low"), [prefs.graphicsQuality])
 useEffect(() => {
  const query = matchMedia("(prefers-reduced-motion: reduce)")
  const sync = () => { document.body.classList.toggle("presentation-light", light); document.body.classList.toggle("presentation-quiet", prefs.reducedMotion || query.matches) }
  sync(); query.addEventListener("change",sync)
  return () => { query.removeEventListener("change",sync); document.body.classList.remove("presentation-light","presentation-quiet") }
 }, [light, prefs.reducedMotion])
 return null
}
