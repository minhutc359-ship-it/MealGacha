import { Capacitor } from "@capacitor/core"

type Snapshot = { phase: "unsupported" | "preparing" | "ready" | "error"; update: boolean }
let snapshot: Snapshot = { phase: "preparing", update: false }
let registration: ServiceWorkerRegistration | undefined
let started = false
const listeners = new Set<() => void>()
const publish = (next: Snapshot) => { snapshot = next; listeners.forEach(listener => listener()) }
export const offlineSnapshot = () => snapshot
export const subscribeOffline = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }

export function startWebOffline() {
  if (started) return
  started = true
  const visibility = () => { document.documentElement.dataset.webHidden = String(document.hidden) }
  document.addEventListener("visibilitychange", visibility)
  visibility()
  if (!import.meta.env.PROD || Capacitor.isNativePlatform() || !("serviceWorker" in navigator)) {
    publish({ phase: "unsupported", update: false }); return
  }
  // This never asks a new worker to activate during gameplay.
  void navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then(async reg => {
    registration = reg
    let warmed = false
    const changed = () => {
      publish({ phase: navigator.serviceWorker.controller ? "ready" : "preparing", update: !!reg.waiting })
      if (!warmed && navigator.serviceWorker.controller) {
        warmed = true
        const urls = [...document.images].filter(img => img.complete && img.naturalWidth && img.getClientRects().length).map(img => img.currentSrc)
        urls.push(...performance.getEntriesByType("resource").filter(entry => /\.mp3(?:\?|$)/.test(entry.name)).map(entry => entry.name))
        navigator.serviceWorker.controller.postMessage({type:"WARM_WEB_ASSETS",urls:[...new Set(urls)].slice(0,32)})
      }
    }
    const track = () => {
      const installing = reg.installing
      installing?.addEventListener("statechange", () => {
        changed()
        // The registration's waiting slot is populated after the state event.
        if (installing.state === "installed") setTimeout(changed, 0)
        if (installing.state === "redundant" && !navigator.serviceWorker.controller) publish({phase:"error",update:false})
      })
    }
    track(); reg.addEventListener("updatefound", track)
    navigator.serviceWorker.addEventListener("controllerchange", changed)
    await navigator.serviceWorker.ready
    changed()
  }).catch(() => publish({ phase: "error", update: false }))
}
export async function checkWebUpdate() {
  try { await registration?.update() } catch { /* current cached version remains playable */ }
}
/** User invokes this from Settings after leaving combat. No storage is cleared. */
export function applyWebUpdate() {
  if (!registration?.waiting) return
  navigator.serviceWorker.addEventListener("controllerchange", () => location.reload(), { once: true })
  registration.waiting.postMessage({ type: "APPLY_WEB_UPDATE" })
}
