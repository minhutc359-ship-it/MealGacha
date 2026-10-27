import { afterEach, describe, expect, it, vi } from "vitest"
import { ScenePreflight } from "@/aw2/assets/scenePreflight"
import {
  SceneLifetime,
  firstWorldFrame,
  initializeWorldScene,
} from "../../aw2/sceneLifecycle"
import type { Application, Ticker } from "pixi.js"

afterEach(() => vi.useRealTimers())
function fixture(timeout = 30_000, abort = new AbortController()) {
  const discard = vi.fn(),
    validate = vi.fn()
  const scene = new ScenePreflight(abort.signal, discard, timeout)
  // Observe rejection immediately, including a signal aborted before construction.
  const outcome = scene.ready.then(
    () => "ready",
    (cause) => cause,
  )
  return {
    scene,
    abort,
    discard,
    validate,
    outcome,
    ready: () => scene.report({ ready: true, assertUsable: validate }),
  }
}

describe("016D preflight ownership and write readiness", () => {
  it("does not accept initial loading as readiness", async () => {
    const f = fixture()
    f.scene.report({ ready: false })
    expect(() => f.scene.assertReady()).toThrow(/chưa sẵn sàng/)
    expect(f.discard).not.toHaveBeenCalled()
    f.ready()
    expect(await f.outcome).toBe("ready")
    f.scene.dispose()
  })
  it("validates again at commit time and transfers without destroying the candidate", async () => {
    const f = fixture()
    f.ready()
    await f.scene.ready
    f.scene.assertReady()
    expect(f.validate).toHaveBeenCalledTimes(2)
    f.scene.transfer()
    f.abort.abort()
    f.scene.dispose()
    f.scene.report({ ready: false, error: "obsolete callback" })
    expect(f.discard).not.toHaveBeenCalled()
  })
  it("rejects an init/first-frame failure without accepting late ready callbacks", async () => {
    const f = fixture()
    f.scene.report({ ready: false, error: "first frame failed" })
    f.ready()
    expect(await f.outcome).toMatchObject({ message: "first frame failed" })
    expect(() => f.scene.assertReady()).toThrow("first frame failed")
    expect(f.validate).not.toHaveBeenCalled()
    expect(f.discard).toHaveBeenCalledTimes(1)
  })
  it("invalidates a ready renderer that loses readiness while the save lock is held", async () => {
    const f = fixture()
    f.ready()
    await f.scene.ready
    f.scene.report({ ready: false })
    expect(() => f.scene.assertReady()).toThrow(/không còn sẵn sàng/)
    expect(f.discard).toHaveBeenCalledTimes(1)
  })
  it("detects context loss synchronously even before an event is delivered", async () => {
    const f = fixture()
    f.ready()
    await f.scene.ready
    f.validate.mockImplementation(() => {
      throw Error("context lost")
    })
    expect(() => f.scene.assertReady()).toThrow("context lost")
    expect(f.discard).toHaveBeenCalledTimes(1)
  })
  it("rejects an unusable first frame rather than resolving readiness", async () => {
    const f = fixture()
    f.validate.mockImplementation(() => {
      throw Error("no GPU")
    })
    f.ready()
    expect(await f.outcome).toMatchObject({ message: "no GPU" })
    expect(f.discard).toHaveBeenCalledTimes(1)
  })
  it.each([false, true])("cancels once with ready=%s", async (ready) => {
    const f = fixture()
    if (ready) {
      f.ready()
      await f.scene.ready
    }
    f.abort.abort()
    f.scene.dispose()
    f.ready()
    expect(() => f.scene.assertReady()).toThrow(/hủy/)
    expect(f.discard).toHaveBeenCalledTimes(1)
    if (!ready) expect(await f.outcome).toMatchObject({ name: "AbortError" })
  })
  it("handles a signal aborted before preparation begins", async () => {
    const abort = new AbortController()
    abort.abort()
    const f = fixture(10, abort)
    expect(await f.outcome).toMatchObject({ name: "AbortError" })
    expect(f.discard).toHaveBeenCalledTimes(1)
  })
  it("bounds a stuck renderer and ignores a late ready callback", async () => {
    vi.useFakeTimers()
    const f = fixture()
    await vi.advanceTimersByTimeAsync(29_999)
    expect(f.discard).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(await f.outcome).toMatchObject({ name: "TimeoutError" })
    f.ready()
    expect(() => f.scene.assertReady()).toThrow(/quá lâu/)
    expect(f.discard).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })
  it("removes the renderer timeout after readiness but still observes cancellation", async () => {
    vi.useFakeTimers()
    const f = fixture(1)
    f.ready()
    await f.scene.ready
    await vi.advanceTimersByTimeAsync(100)
    expect(vi.getTimerCount()).toBe(0)
    expect(f.discard).not.toHaveBeenCalled()
    f.abort.abort()
    expect(f.discard).toHaveBeenCalledTimes(1)
  })
})

function renderer() {
  const lifetime = new SceneLifetime(),
    ticks = new Set<(ticker: Ticker) => void>()
  const canvas = Object.assign(new EventTarget(), {
    dataset: {} as Record<string, string>,
  })
  const gl = { isContextLost: vi.fn(() => false) }
  const fake = {
    canvas,
    renderer: { gl },
    stage: { destroy: vi.fn() },
    ticker: {
      add: vi.fn((fn) => ticks.add(fn)),
      remove: vi.fn((fn) => ticks.delete(fn)),
    },
    init: vi.fn(async (_options: unknown) => {}),
    render: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    destroy: vi.fn(),
  }
  const host = { replaceChildren: vi.fn() }
  const update = vi.fn(),
    fail = vi.fn((_cause: unknown) => lifetime.dispose())
  const frame = () =>
    firstWorldFrame(
      fake as unknown as Application,
      host as unknown as HTMLDivElement,
      update,
      lifetime,
      fail,
    )
  const tick = () => [...ticks].forEach((fn) => fn({ deltaMS: 16 } as Ticker))
  return { fake, canvas, gl, host, update, fail, frame, tick, lifetime }
}

describe("016D renderer lifetime", () => {
  it("owns late acquisitions and tears down each resource once in reverse order", () => {
    const l = new SceneLifetime(),
      order: number[] = []
    l.own(() => order.push(1))
    l.own(() => order.push(2))
    l.dispose()
    l.dispose()
    l.own(() => order.push(3))
    expect(order).toEqual([2, 1, 3])
  })
  it("starts stopped and destroys an init that finishes after disposal", async () => {
    const f = renderer()
    let finish: () => void = () => {
      throw Error("Init gate not initialized")
    }
    f.fake.init.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
    )
    const promise = initializeWorldScene(
      f.fake as unknown as Application,
      { width: 640 },
      f.lifetime,
    )
    f.lifetime.dispose()
    finish()
    await promise
    expect(f.fake.init).toHaveBeenCalledWith({ width: 640, autoStart: false })
    expect(f.fake.destroy).toHaveBeenCalledTimes(1)
    expect(f.fake.start).not.toHaveBeenCalled()
  })
  it.each([false, true])(
    "cleans partial init with renderer=%s",
    async (available) => {
      const f = renderer()
      if (!available) Reflect.set(f.fake, "renderer", undefined)
      f.fake.init.mockRejectedValue(Error("init failed"))
      await expect(
        initializeWorldScene(f.fake as unknown as Application, {}, f.lifetime),
      ).rejects.toThrow("init failed")
      expect(
        available ? f.fake.destroy : f.fake.stage.destroy,
      ).toHaveBeenCalledTimes(1)
    },
  )
  it("waits for an actual frame, updates the scene before render, and keeps that ticker", async () => {
    const f = renderer(),
      order: string[] = []
    f.update.mockImplementation(() => {
      order.push("update")
    })
    f.fake.render.mockImplementation(() => {
      order.push("render")
    })
    let ready = false
    const promise = f.frame().then((assertUsable) => {
      ready = true
      return assertUsable
    })
    await Promise.resolve()
    expect(ready).toBe(false)
    f.tick()
    const validate = await promise
    expect(order).toEqual(["update", "render"])
    expect(f.canvas.dataset.worldRenderState).toBe("ready")
    expect(f.host.replaceChildren).toHaveBeenCalledWith(f.canvas)
    expect(validate).not.toThrow()
    f.tick()
    expect(f.fake.render).toHaveBeenCalledTimes(2)
    f.lifetime.dispose()
  })
  it("rejects first-frame drawing failure and stops the candidate", async () => {
    const f = renderer()
    f.fake.render.mockImplementation(() => {
      throw Error("draw failed")
    })
    const outcome = f.frame().catch((cause) => cause)
    f.tick()
    expect(await outcome).toMatchObject({ message: "draw failed" })
    expect(f.fail).toHaveBeenCalledTimes(1)
    expect(f.fake.stop).toHaveBeenCalledTimes(1)
    f.tick()
    expect(f.fake.render).toHaveBeenCalledTimes(1)
  })
  it("catches a later drawing failure on the same promoted ticker", async () => {
    const f = renderer(),
      promise = f.frame()
    f.tick()
    await promise
    f.fake.render.mockImplementation(() => {
      throw Error("later draw failed")
    })
    f.tick()
    expect(f.fail).toHaveBeenCalledWith(
      expect.objectContaining({ message: "later draw failed" }),
    )
    expect(f.canvas.dataset.worldRenderState).toBe("failed")
  })
  it("observes real context-loss events and synchronous validity", async () => {
    const f = renderer(),
      promise = f.frame()
    f.tick()
    const validate = await promise
    f.gl.isContextLost.mockReturnValue(true)
    expect(validate).toThrow(/mất kết nối/)
    f.canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }))
    expect(f.fail).toHaveBeenCalledTimes(1)
    f.canvas.dispatchEvent(new Event("webglcontextlost"))
    expect(f.fail).toHaveBeenCalledTimes(1)
  })
  it("settles an abandoned first-frame wait and ignores late ticks", async () => {
    const f = renderer(),
      outcome = f.frame().catch((cause) => cause)
    f.lifetime.dispose()
    f.tick()
    expect(await outcome).toBeInstanceOf(Error)
    expect(f.fake.render).not.toHaveBeenCalled()
    expect(f.fail).not.toHaveBeenCalled()
  })
})
