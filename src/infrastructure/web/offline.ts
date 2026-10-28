import { Capacitor } from "@capacitor/core"

type Snapshot = { phase: "unsupported" | "preparing" | "ready" | "error"; update: boolean; applying: boolean; updateError: boolean }
let snapshot: Snapshot = { phase: "preparing", update: false, applying: false, updateError: false }
let registration: ServiceWorkerRegistration | undefined
let started = false
const listeners = new Set<() => void>()
const publish = (next: Partial<Snapshot>) => { snapshot = { ...snapshot, ...next }; listeners.forEach(listener => listener()) }
export const offlineSnapshot = () => snapshot
export const subscribeOffline = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }

export function startWebOffline() {
  if (started) return
  started = true
  const visibility = () => {
    document.documentElement.dataset.webHidden = String(document.hidden)
    if (!document.hidden) void checkWebUpdate()
  }
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
      publish({ phase: navigator.serviceWorker.controller ? "ready" : "preparing", update: !!reg.waiting && !!navigator.serviceWorker.controller })
      if (!warmed && navigator.serviceWorker.controller) {
        warmed = true
        const urls = [...document.images].filter(img => img.complete && img.naturalWidth && img.getClientRects().length).map(img => img.currentSrc)
        urls.push(...performance.getEntriesByType("resource").filter(entry => /\.(?:webp|png|jpe?g|mp3|wav)(?:\?|$)/.test(entry.name)).map(entry => entry.name))
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
    window.addEventListener("online", () => { void checkWebUpdate() })
    void checkWebUpdate()
  }).catch(() => publish({ phase: "error", update: false }))
}
export async function checkWebUpdate() {
  try { await registration?.update() } catch { /* current cached version remains playable */ }
}
/** Activate only on an explicit click. Player storage is never cleared. */
export function applyWebUpdate() {
  if (snapshot.applying) return
  const waiting = registration?.waiting
  if (!waiting) { publish({ updateError: true }); void checkWebUpdate(); return }
  publish({ applying: true, updateError: false })
  const changed = () => { clearTimeout(timer); location.reload() }
  const failed = () => {
    navigator.serviceWorker.removeEventListener("controllerchange", changed)
    clearTimeout(timer)
    publish({ applying: false, updateError: true })
  }
  const timer = setTimeout(failed, 15_000)
  navigator.serviceWorker.addEventListener("controllerchange", changed, { once: true })
  try { waiting.postMessage({ type: "APPLY_WEB_UPDATE" }) } catch { failed() }
}
