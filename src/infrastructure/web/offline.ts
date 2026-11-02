import { Capacitor } from "@capacitor/core"

type Snapshot = {
  phase: "unsupported" | "preparing" | "ready" | "error"
  update: boolean
  applying: boolean
  updateError: boolean
  online: boolean
  install: "unavailable" | "available" | "installing" | "installed" | "dismissed"
  persistent: boolean | null
  storageUsage: number | null
  storageQuota: number | null
  cacheVersion: string | null
  cacheEntries: number | null
  cacheBytes: number | null
  previousCaches: number | null
}
let snapshot: Snapshot = {
  phase: "preparing",
  update: false,
  applying: false,
  updateError: false,
  online: true,
  install: "unavailable",
  persistent: null,
  storageUsage: null,
  storageQuota: null,
  cacheVersion: null,
  cacheEntries: null,
  cacheBytes: null,
  previousCaches: null,
}
interface InstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}
interface CacheStatus {
  version: string
  entries: number
  bytes: number
  previousCaches: number
}
let registration: ServiceWorkerRegistration | undefined
let installPrompt: InstallPromptEvent | undefined
let started = false
const listeners = new Set<() => void>()
const publish = (next: Partial<Snapshot>) => {
  snapshot = { ...snapshot, ...next }
  listeners.forEach((listener) => listener())
}
export const offlineSnapshot = () => snapshot
export const subscribeOffline = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function installedStandalone() {
  const iosNavigator = navigator as Navigator & { standalone?: boolean }
  return (
    iosNavigator.standalone === true ||
    window.matchMedia?.("(display-mode: standalone)").matches === true
  )
}

function requestCacheStatus() {
  const controller = navigator.serviceWorker?.controller
  if (!controller || typeof MessageChannel === "undefined") return
  const channel = new MessageChannel()
  const close = () => {
    channel.port1.close()
    channel.port2.close()
  }
  channel.port1.onmessage = (event: MessageEvent<CacheStatus>) => {
    const status = event.data
    if (
      status &&
      typeof status.version === "string" &&
      Number.isFinite(status.entries) &&
      Number.isFinite(status.bytes) &&
      Number.isFinite(status.previousCaches)
    )
      publish({
        cacheVersion: status.version,
        cacheEntries: status.entries,
        cacheBytes: status.bytes,
        previousCaches: status.previousCaches,
      })
    close()
  }
  controller.postMessage({ type: "WEB_CACHE_STATUS" }, [channel.port2])
  setTimeout(close, 2_000)
}

export async function refreshWebReadiness() {
  const storage = navigator.storage
  if (storage) {
    const [persistent, estimate] = await Promise.all([
      storage.persisted?.().catch(() => null) ?? Promise.resolve(null),
      storage.estimate?.().catch(() => ({}) as StorageEstimate) ??
        Promise.resolve({} as StorageEstimate),
    ])
    publish({
      persistent,
      storageUsage: typeof estimate.usage === "number" ? estimate.usage : null,
      storageQuota: typeof estimate.quota === "number" ? estimate.quota : null,
    })
  }
  requestCacheStatus()
}

export async function requestPersistentStorage() {
  const granted =
    (await navigator.storage?.persist?.().catch(() => false)) ?? false
  publish({ persistent: granted })
  return granted
}

export async function promptWebInstall() {
  const prompt = installPrompt
  if (!prompt || snapshot.install !== "available") return false
  installPrompt = undefined
  publish({ install: "installing" })
  try {
    await prompt.prompt()
    const choice = await prompt.userChoice
    publish({
      install: choice.outcome === "accepted" ? "installed" : "dismissed",
    })
    return choice.outcome === "accepted"
  } catch {
    publish({ install: "dismissed" })
    return false
  }
}

export function startWebOffline() {
  if (started) return
  started = true
  publish({
    online: navigator.onLine !== false,
    install: installedStandalone() ? "installed" : "unavailable",
  })
  const connection = () => publish({ online: navigator.onLine !== false })
  const captureInstall = (event: Event) => {
    const prompt = event as InstallPromptEvent
    if (typeof prompt.prompt !== "function" || installedStandalone()) return
    prompt.preventDefault()
    installPrompt = prompt
    publish({ install: "available" })
  }
  window.addEventListener("online", connection)
  window.addEventListener("offline", connection)
  window.addEventListener("beforeinstallprompt", captureInstall)
  window.addEventListener("appinstalled", () => {
    installPrompt = undefined
    publish({ install: "installed" })
  })
  const visibility = () => {
    document.documentElement.dataset.webHidden = String(document.hidden)
    if (!document.hidden) void checkWebUpdate()
  }
  document.addEventListener("visibilitychange", visibility)
  visibility()
  if (
    !import.meta.env.PROD ||
    Capacitor.isNativePlatform() ||
    !("serviceWorker" in navigator)
  ) {
    publish({ phase: "unsupported", update: false })
    return
  }
  // This never asks a new worker to activate during gameplay.
  void navigator.serviceWorker
    .register("/sw.js", { updateViaCache: "none" })
    .then(async (reg) => {
      registration = reg
      let warmPasses = 0
      const warmLoadedAssets = () => {
        if (!navigator.serviceWorker.controller || warmPasses >= 2) return
        warmPasses++
        const urls = [...document.images]
          .filter(
            (img) =>
              img.complete && img.naturalWidth && img.getClientRects().length,
          )
          .map((img) => img.currentSrc)
        urls.push(
          ...performance
            .getEntriesByType("resource")
            .filter((entry) =>
              /\.(?:webp|png|jpe?g|mp3|wav|js|css)(?:\?|$)/.test(entry.name),
            )
            .map((entry) => entry.name),
        )
        navigator.serviceWorker.controller.postMessage({
          type: "WARM_WEB_ASSETS",
          urls: [...new Set(urls)].slice(0, 48),
        })
      }
      const changed = () => {
        publish({
          phase: navigator.serviceWorker.controller ? "ready" : "preparing",
          update: !!reg.waiting && !!navigator.serviceWorker.controller,
        })
        if (warmPasses === 0 && navigator.serviceWorker.controller) {
          warmLoadedAssets()
          setTimeout(warmLoadedAssets, 1_500)
        }
        if (navigator.serviceWorker.controller) void refreshWebReadiness()
      }
      const track = () => {
        const installing = reg.installing
        installing?.addEventListener("statechange", () => {
          changed()
          // The registration's waiting slot is populated after the state event.
          if (installing.state === "installed") setTimeout(changed, 0)
          if (
            installing.state === "redundant" &&
            !navigator.serviceWorker.controller
          )
            publish({ phase: "error", update: false })
        })
      }
      track()
      reg.addEventListener("updatefound", track)
      navigator.serviceWorker.addEventListener("controllerchange", changed)
      await navigator.serviceWorker.ready
      changed()
      window.addEventListener("online", () => {
        void checkWebUpdate()
      })
      void checkWebUpdate()
    })
    .catch(() => publish({ phase: "error", update: false }))
}
export async function checkWebUpdate() {
  try {
    await registration?.update()
    return true
  } catch {
    return false
  }
}
/** Activate only on an explicit click. Player storage is never cleared. */
export function applyWebUpdate() {
  if (snapshot.applying) return
  const waiting = registration?.waiting
  if (!waiting) {
    publish({ updateError: true })
    void checkWebUpdate()
    return
  }
  publish({ applying: true, updateError: false })
  const changed = () => {
    clearTimeout(timer)
    location.reload()
  }
  const failed = () => {
    navigator.serviceWorker.removeEventListener("controllerchange", changed)
    clearTimeout(timer)
    publish({ applying: false, updateError: true })
  }
  const timer = setTimeout(failed, 15_000)
  navigator.serviceWorker.addEventListener("controllerchange", changed, {
    once: true,
  })
  try {
    waiting.postMessage({ type: "APPLY_WEB_UPDATE" })
  } catch {
    failed()
  }
}
