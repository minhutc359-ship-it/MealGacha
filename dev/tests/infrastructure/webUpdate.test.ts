import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => false },
}))

class Registration extends EventTarget {
  waiting: { postMessage: ReturnType<typeof vi.fn> } | null = null
  installing: EventTarget & { state: string } | null = null
  update = vi.fn(async () => {})
}

async function fixture(waiting = true, controlled = true) {
  class TestMessageChannel {
    port1: {
      onmessage: ((event: MessageEvent) => void) | null
      close: ReturnType<typeof vi.fn>
    }
    port2: {
      postMessage: (data: unknown) => void
      close: ReturnType<typeof vi.fn>
    }
    constructor() {
      this.port1 = { onmessage: null, close: vi.fn() }
      this.port2 = {
        postMessage: (data) => this.port1.onmessage?.({ data } as MessageEvent),
        close: vi.fn(),
      }
    }
  }
  const registration = new Registration()
  registration.waiting = waiting ? { postMessage: vi.fn() } : null
  const controller = {
    postMessage: vi.fn(
      (message: { type?: string }, ports?: readonly MessagePort[]) => {
        if (message.type === "WEB_CACHE_STATUS")
          ports?.[0]?.postMessage({
            version: "cache-v1",
            entries: 7,
            bytes: 2048,
            previousCaches: 1,
          })
      },
    ),
  }
  const serviceWorker = Object.assign(new EventTarget(), {
    controller: controlled ? controller : null,
    ready: Promise.resolve(registration),
    register: vi.fn(async () => registration),
  })
  const document = Object.assign(new EventTarget(), {
    hidden: false,
    images: [],
    documentElement: { dataset: {} },
  })
  const window = Object.assign(new EventTarget(), {
      matchMedia: vi.fn(() => ({ matches: false })),
    }),
    reload = vi.fn()
  const storage = {
    persisted: vi.fn(async () => false),
    persist: vi.fn(async () => true),
    estimate: vi.fn(async () => ({ usage: 3_000_000, quota: 50_000_000 })),
  }
  const navigator = { serviceWorker, storage, onLine: true }
  vi.stubGlobal("navigator", navigator)
  vi.stubGlobal("MessageChannel", TestMessageChannel)
  vi.stubGlobal("document", document)
  vi.stubGlobal("window", window)
  vi.stubGlobal("location", { reload })
  const api = await import("../../../src/infrastructure/web/offline")
  api.startWebOffline()
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
  return {
    api,
    registration,
    serviceWorker,
    controller,
    document,
    window,
    navigator,
    storage,
    reload,
  }
}

beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers()
  vi.stubEnv("PROD", true)
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe("explicit web updates", () => {
  it("warms loaded artwork and lazy code twice when the first worker takes control", async () => {
    const urls = [
      "https://meal.example/assets/model.webp",
      "https://meal.example/assets/realm.png?rev=2",
      "https://meal.example/assets/sound.mp3",
      "https://meal.example/assets/app.js",
      "https://meal.example/assets/theme.css",
    ]
    const resources = vi
      .spyOn(performance, "getEntriesByType")
      .mockReturnValue(
        [...urls, "https://meal.example/assets/retired.mp4"].map(
          (name) => ({ name }) as PerformanceEntry,
        ),
      )
    try {
      const f = await fixture(false, false)
      f.serviceWorker.controller = f.controller
      f.serviceWorker.dispatchEvent(new Event("controllerchange"))
      const warmCalls = () =>
        f.controller.postMessage.mock.calls.filter(
          ([message]) => message.type === "WARM_WEB_ASSETS",
        )
      expect(warmCalls()).toEqual([[{ type: "WARM_WEB_ASSETS", urls }]])
      await vi.advanceTimersByTimeAsync(1_500)
      expect(warmCalls()).toEqual([
        [{ type: "WARM_WEB_ASSETS", urls }],
        [{ type: "WARM_WEB_ASSETS", urls }],
      ])
    } finally {
      resources.mockRestore()
    }
  })
  it("does not show a new-version prompt for the first installation", async () => {
    const f = await fixture(false, false)
    expect(f.api.offlineSnapshot().update).toBe(false)
    expect(f.reload).not.toHaveBeenCalled()
  })
  it("detects a waiting worker at startup without activating it", async () => {
    const f = await fixture()
    expect(f.api.offlineSnapshot()).toMatchObject({
      phase: "ready",
      update: true,
      applying: false,
    })
    expect(f.registration.waiting!.postMessage).not.toHaveBeenCalled()
    f.api.startWebOffline()
    expect(f.serviceWorker.register).toHaveBeenCalledTimes(1)
    expect(f.registration.update).toHaveBeenCalledTimes(1)
  })
  it("rechecks when the browser reconnects or the page becomes visible", async () => {
    const f = await fixture()
    f.window.dispatchEvent(new Event("online"))
    f.document.hidden = true
    f.document.dispatchEvent(new Event("visibilitychange"))
    f.document.hidden = false
    f.document.dispatchEvent(new Event("visibilitychange"))
    expect(f.registration.update).toHaveBeenCalledTimes(3)
  })
  it("publishes live connectivity, storage and worker cache status", async () => {
    const f = await fixture(false)
    await f.api.refreshWebReadiness()
    await Promise.resolve()
    expect(f.api.offlineSnapshot()).toMatchObject({
      online: true,
      persistent: false,
      storageUsage: 3_000_000,
      storageQuota: 50_000_000,
      cacheVersion: "cache-v1",
      cacheEntries: 7,
      cacheBytes: 2048,
      previousCaches: 1,
    })
    f.navigator.onLine = false
    f.window.dispatchEvent(new Event("offline"))
    expect(f.api.offlineSnapshot().online).toBe(false)
    f.navigator.onLine = true
    f.window.dispatchEvent(new Event("online"))
    expect(f.api.offlineSnapshot().online).toBe(true)
    await f.api.requestPersistentStorage()
    expect(f.storage.persist).toHaveBeenCalledOnce()
    expect(f.api.offlineSnapshot().persistent).toBe(true)
  })
  it("captures an install prompt and records accepted or installed state", async () => {
    const f = await fixture(false, false)
    const prompt = vi.fn(async () => {})
    const event = Object.assign(
      new Event("beforeinstallprompt", { cancelable: true }),
      {
        prompt,
        userChoice: Promise.resolve({
          outcome: "accepted" as const,
          platform: "web",
        }),
      },
    )
    f.window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(f.api.offlineSnapshot().install).toBe("available")
    await expect(f.api.promptWebInstall()).resolves.toBe(true)
    expect(prompt).toHaveBeenCalledOnce()
    expect(f.api.offlineSnapshot().install).toBe("installed")
    f.window.dispatchEvent(new Event("appinstalled"))
    expect(f.api.offlineSnapshot().install).toBe("installed")
  })
  it("records a dismissed install prompt without retrying the consumed event", async () => {
    const f = await fixture(false, false)
    const prompt = vi.fn(async () => {})
    f.window.dispatchEvent(
      Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
        prompt,
        userChoice: Promise.resolve({
          outcome: "dismissed" as const,
          platform: "web",
        }),
      }),
    )
    await expect(f.api.promptWebInstall()).resolves.toBe(false)
    await expect(f.api.promptWebInstall()).resolves.toBe(false)
    expect(prompt).toHaveBeenCalledOnce()
    expect(f.api.offlineSnapshot().install).toBe("dismissed")
  })
  it("notices the waiting slot populated after an installed event", async () => {
    const f = await fixture(false)
    const installing = Object.assign(new EventTarget(), { state: "installing" })
    f.registration.installing = installing
    f.registration.dispatchEvent(new Event("updatefound"))
    installing.state = "installed"
    installing.dispatchEvent(new Event("statechange"))
    f.registration.waiting = { postMessage: vi.fn() }
    await vi.advanceTimersByTimeAsync(0)
    expect(f.api.offlineSnapshot().update).toBe(true)
  })
  it("activates on click and reloads once after the controller changes", async () => {
    const f = await fixture()
    f.api.applyWebUpdate()
    f.api.applyWebUpdate()
    expect(f.registration.waiting!.postMessage).toHaveBeenCalledExactlyOnceWith(
      { type: "APPLY_WEB_UPDATE" },
    )
    expect(f.api.offlineSnapshot().applying).toBe(true)
    expect(f.reload).not.toHaveBeenCalled()
    f.serviceWorker.dispatchEvent(new Event("controllerchange"))
    f.serviceWorker.dispatchEvent(new Event("controllerchange"))
    expect(f.reload).toHaveBeenCalledTimes(1)
  })
  it("keeps other tabs running until they choose to reload", async () => {
    const f = await fixture()
    f.serviceWorker.dispatchEvent(new Event("controllerchange"))
    expect(f.reload).not.toHaveBeenCalled()
  })
  it("unlocks retry after an activation timeout", async () => {
    const f = await fixture()
    f.api.applyWebUpdate()
    await vi.advanceTimersByTimeAsync(15_000)
    expect(f.api.offlineSnapshot()).toMatchObject({
      applying: false,
      updateError: true,
    })
    expect(f.reload).not.toHaveBeenCalled()
    f.api.applyWebUpdate()
    f.serviceWorker.dispatchEvent(new Event("controllerchange"))
    expect(f.reload).toHaveBeenCalledTimes(1)
  })
  it("handles messaging failure without leaving the page stuck", async () => {
    const f = await fixture()
    f.registration.waiting!.postMessage.mockImplementation(() => {
      throw Error("closed worker")
    })
    f.api.applyWebUpdate()
    expect(f.api.offlineSnapshot()).toMatchObject({
      applying: false,
      updateError: true,
    })
    f.serviceWorker.dispatchEvent(new Event("controllerchange"))
    expect(f.reload).not.toHaveBeenCalled()
  })
})
