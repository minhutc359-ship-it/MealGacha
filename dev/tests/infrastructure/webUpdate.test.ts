import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => false } }))

class Registration extends EventTarget {
  waiting: { postMessage: ReturnType<typeof vi.fn> } | null = null
  installing: (EventTarget & { state: string }) | null = null
  update = vi.fn(async () => {})
}

async function fixture(waiting = true, controlled = true) {
  const registration = new Registration()
  registration.waiting = waiting ? { postMessage: vi.fn() } : null
  const serviceWorker = Object.assign(new EventTarget(), {
    controller: controlled ? { postMessage: vi.fn() } : null,
    ready: Promise.resolve(registration),
    register: vi.fn(async () => registration),
  })
  const document = Object.assign(new EventTarget(), { hidden: false, images: [], documentElement: { dataset: {} } })
  const window = new EventTarget(), reload = vi.fn()
  vi.stubGlobal("navigator", { serviceWorker })
  vi.stubGlobal("document", document)
  vi.stubGlobal("window", window)
  vi.stubGlobal("location", { reload })
  const api = await import("../../../src/infrastructure/web/offline")
  api.startWebOffline()
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve()
  return { api, registration, serviceWorker, document, window, reload }
}

beforeEach(() => { vi.resetModules(); vi.useFakeTimers(); vi.stubEnv("PROD", true) })
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs() })

describe("explicit web updates", () => {
  it("warms already loaded Canvas and CSS artwork when the first worker takes control", async () => {
    const urls = ["https://meal.example/assets/model.webp", "https://meal.example/assets/realm.png?rev=2", "https://meal.example/assets/sound.mp3"]
    const resources = vi.spyOn(performance, "getEntriesByType").mockReturnValue(
      [...urls, "https://meal.example/assets/app.js", "https://meal.example/assets/retired.mp4"].map(name=>({name}) as PerformanceEntry),
    )
    try {
      const f = await fixture(false, false)
      f.serviceWorker.controller = { postMessage: vi.fn() }
      f.serviceWorker.dispatchEvent(new Event("controllerchange"))
      expect(f.serviceWorker.controller.postMessage).toHaveBeenCalledExactlyOnceWith({type:"WARM_WEB_ASSETS",urls})
    } finally { resources.mockRestore() }
  })
  it("does not show a new-version prompt for the first installation", async () => {
    const f = await fixture(false, false)
    expect(f.api.offlineSnapshot().update).toBe(false)
    expect(f.reload).not.toHaveBeenCalled()
  })
  it("detects a waiting worker at startup without activating it", async () => {
    const f = await fixture()
    expect(f.api.offlineSnapshot()).toMatchObject({ phase: "ready", update: true, applying: false })
    expect(f.registration.waiting!.postMessage).not.toHaveBeenCalled()
    f.api.startWebOffline()
    expect(f.serviceWorker.register).toHaveBeenCalledTimes(1)
    expect(f.registration.update).toHaveBeenCalledTimes(1)
  })
  it("rechecks when the browser reconnects or the page becomes visible", async () => {
    const f = await fixture()
    f.window.dispatchEvent(new Event("online"))
    f.document.hidden = true; f.document.dispatchEvent(new Event("visibilitychange"))
    f.document.hidden = false; f.document.dispatchEvent(new Event("visibilitychange"))
    expect(f.registration.update).toHaveBeenCalledTimes(3)
  })
  it("notices the waiting slot populated after an installed event", async () => {
    const f = await fixture(false)
    const installing = Object.assign(new EventTarget(), { state: "installing" })
    f.registration.installing = installing
    f.registration.dispatchEvent(new Event("updatefound"))
    installing.state = "installed"; installing.dispatchEvent(new Event("statechange"))
    f.registration.waiting = { postMessage: vi.fn() }
    await vi.advanceTimersByTimeAsync(0)
    expect(f.api.offlineSnapshot().update).toBe(true)
  })
  it("activates on click and reloads once after the controller changes", async () => {
    const f = await fixture()
    f.api.applyWebUpdate(); f.api.applyWebUpdate()
    expect(f.registration.waiting!.postMessage).toHaveBeenCalledExactlyOnceWith({ type: "APPLY_WEB_UPDATE" })
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
    expect(f.api.offlineSnapshot()).toMatchObject({ applying: false, updateError: true })
    expect(f.reload).not.toHaveBeenCalled()
    f.api.applyWebUpdate()
    f.serviceWorker.dispatchEvent(new Event("controllerchange"))
    expect(f.reload).toHaveBeenCalledTimes(1)
  })
  it("handles messaging failure without leaving the page stuck", async () => {
    const f = await fixture()
    f.registration.waiting!.postMessage.mockImplementation(() => { throw Error("closed worker") })
    f.api.applyWebUpdate()
    expect(f.api.offlineSnapshot()).toMatchObject({ applying: false, updateError: true })
    f.serviceWorker.dispatchEvent(new Event("controllerchange"))
    expect(f.reload).not.toHaveBeenCalled()
  })
})
