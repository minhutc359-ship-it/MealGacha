import { describe, expect, it, vi } from "vitest"
import { existsSync } from "node:fs"
import { worldAssetUrls } from "@/aw2/assets/worldAssets"
import { prepareScene } from "@/aw2/assets/prepareScene"
import { newWorldProgress } from "@/aw2/world/model"
import { ZONE_IDS, STARTER_TEAM } from "@/aw2/world/ids"
import { PATROL_VISUAL } from "@/aw2/assets/npcPatrol"
import { ROSTER_ASSETS } from "@/aw2/assets/roster"

function deferred<T>() {
  let resolve: (value: T) => void = () => {
    throw Error("Deferred not initialized")
  }
  let reject: (cause: unknown) => void = () => {
    throw Error("Deferred not initialized")
  }
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
const defaults = () => ({
  urls: ["a", "b"],
  load: vi.fn<(url: string) => Promise<unknown>>(async () => undefined),
  acquire: vi.fn<() => Promise<() => void>>(async () => () => {}),
  signal: new AbortController().signal,
  onProgress: vi.fn(),
})

describe("016C exact destination asset preparation", () => {
  it.each(
    ZONE_IDS.map((zoneId, i) => [zoneId, [9, 10, 11, 4, 5, 6][i]] as const),
  )(
    "%s prepares exactly %s required unique runtime images",
    (zoneId, count) => {
      const world = { ...newWorldProgress(), zoneId },
        before = JSON.stringify(world),
        urls = worldAssetUrls(world)
      expect(urls).toHaveLength(count)
      expect(new Set(urls).size).toBe(urls.length)
      expect(
        urls.every(
          (u) =>
            u.startsWith("/dev/aw2/assets/") &&
            u.endsWith(".webp") &&
            existsSync(u.slice(1)),
        ),
      ).toBe(true)
      expect(urls.some((u) => /portrait|battle|\.png|\.wav/.test(u))).toBe(
        false,
      )
      expect(JSON.stringify(world)).toBe(before)
    },
  )
  it("uses only the committed leader, including pre-intro visual fallback", () => {
    const w = {
      ...newWorldProgress(),
      zoneId: ZONE_IDS[1],
      partyIds: [...STARTER_TEAM],
    }
    const a = worldAssetUrls(w),
      b = worldAssetUrls({ ...w, partyIds: [...STARTER_TEAM].reverse() })
    expect(a[0]).toBe(ROSTER_ASSETS[STARTER_TEAM[0]].assets.world.url)
    expect(b[0]).toBe(ROSTER_ASSETS[STARTER_TEAM[4]].assets.world.url)
    expect(a.slice(1)).toEqual(b.slice(1))
    expect(worldAssetUrls(newWorldProgress())[0]).toBe(
      ROSTER_ASSETS["aw2-than"].assets.world.url,
    )
  })
  it("preloads replacement patrol texture and excludes obsolete street NPC/static atlas", () => {
    const urls = worldAssetUrls({ ...newWorldProgress(), zoneId: ZONE_IDS[1] })
    expect(urls).toContain(PATROL_VISUAL.asset.url)
    expect(
      urls.some(
        (u) =>
          u.includes("dem-nuoc/idle-v1") ||
          u.includes("lantern-street/v1/props.webp"),
      ),
    ).toBe(false)
  })
  it("preserves the actual interior renderer requirements", () => {
    const urls = worldAssetUrls({ ...newWorldProgress(), zoneId: ZONE_IDS[5] })
    expect(
      urls.some((u) => u.includes("forgotten-host/world-v1/world.webp")),
    ).toBe(true)
    expect(urls.some((u) => u.endsWith("/interaction-v1/note.webp"))).toBe(true)
    expect(
      urls.some((u) => u.endsWith("/kitchen-table/v2/landscape.webp")),
    ).toBe(true)
  })
  it("starts independent requests together and reports actual completed counts", async () => {
    const a = deferred<void>(),
      b = deferred<void>(),
      release = vi.fn(),
      opts = defaults()
    opts.load = vi.fn((u: string) => (u === "a" ? a.promise : b.promise))
    opts.acquire = vi.fn(async () => release)
    const ready = prepareScene(opts)
    await vi.waitFor(() => expect(opts.load).toHaveBeenCalledTimes(2))
    expect(opts.onProgress).toHaveBeenLastCalledWith({ completed: 0, total: 2 })
    b.resolve()
    await vi.waitFor(() =>
      expect(opts.onProgress).toHaveBeenLastCalledWith({
        completed: 1,
        total: 2,
      }),
    )
    expect(release).not.toHaveBeenCalled()
    a.resolve()
    const cleanup = await ready
    expect(opts.onProgress).toHaveBeenLastCalledWith({ completed: 2, total: 2 })
    expect(release).not.toHaveBeenCalled()
    cleanup()
    cleanup()
    expect(release).toHaveBeenCalledTimes(1)
  })
  it("deduplicates URLs and does not resolve before the ambient lease is acquired", async () => {
    const lease = deferred<() => void>(),
      opts = defaults()
    opts.urls = ["a", "a"]
    opts.acquire = vi.fn(() => lease.promise)
    let ready = false
    const pending = prepareScene(opts).then((release) => {
      ready = true
      return release
    })
    await vi.waitFor(() => expect(opts.load).toHaveBeenCalledTimes(1))
    expect(ready).toBe(false)
    const release = vi.fn()
    lease.resolve(release)
    ;(await pending)()
    expect(release).toHaveBeenCalledTimes(1)
  })
  it("rejects asset failure without waiting for unrelated slow work, releasing a late lease", async () => {
    const lease = deferred<() => void>(),
      slow = deferred<void>(),
      opts = defaults(),
      release = vi.fn()
    opts.acquire = vi.fn(() => lease.promise)
    opts.load = vi.fn((u: string) =>
      u === "a" ? Promise.reject(Error("missing atlas")) : slow.promise,
    )
    await expect(prepareScene(opts)).rejects.toThrow("missing atlas")
    lease.resolve(release)
    slow.resolve()
    await vi.waitFor(() => expect(release).toHaveBeenCalledTimes(1))
  })
  it("rejects acquisition failure and handles other late rejected requests", async () => {
    const slow = deferred<void>(),
      opts = defaults()
    opts.acquire = vi.fn(async () => {
      throw Error("lease failed")
    })
    opts.load = vi.fn(() => slow.promise)
    await expect(prepareScene(opts)).rejects.toThrow("lease failed")
    slow.reject(Error("late network error"))
    await Promise.resolve()
  })
  it("does no work for an already cancelled preparation", async () => {
    const abort = new AbortController(),
      opts = defaults()
    abort.abort()
    opts.signal = abort.signal
    await expect(prepareScene(opts)).rejects.toMatchObject({
      name: "AbortError",
    })
    expect(opts.load).not.toHaveBeenCalled()
    expect(opts.acquire).not.toHaveBeenCalled()
  })
  it("cancel settles promptly, suppresses late progress and releases late ownership once", async () => {
    const abort = new AbortController(),
      slow = deferred<void>(),
      lease = deferred<() => void>(),
      release = vi.fn(),
      opts = defaults()
    opts.signal = abort.signal
    opts.load = vi.fn(() => slow.promise)
    opts.acquire = vi.fn(() => lease.promise)
    const pending = prepareScene(opts)
    await vi.waitFor(() => expect(opts.load).toHaveBeenCalledTimes(2))
    abort.abort()
    await expect(pending).rejects.toMatchObject({ name: "AbortError" })
    const count = opts.onProgress.mock.calls.length
    lease.resolve(release)
    slow.resolve()
    await vi.waitFor(() => expect(release).toHaveBeenCalledTimes(1))
    expect(opts.onProgress.mock.calls.length).toBe(count)
  })
  it("times out without leaking late ownership", async () => {
    vi.useFakeTimers()
    try {
      const lease = deferred<() => void>(),
        slow = deferred<void>(),
        release = vi.fn(),
        opts = defaults()
      opts.acquire = vi.fn(() => lease.promise)
      opts.load = vi.fn(() => slow.promise)
      const pending = prepareScene({ ...opts, timeoutMs: 20 })
      const rejected = expect(pending).rejects.toMatchObject({
        name: "TimeoutError",
      })
      await vi.advanceTimersByTimeAsync(21)
      await rejected
      lease.resolve(release)
      slow.resolve()
      await vi.advanceTimersByTimeAsync(0)
      expect(release).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })
  it("can retry an identical request after failure with no poisoned gate", async () => {
    const opts = defaults()
    opts.load = vi.fn(async () => {
      throw Error("offline")
    })
    await expect(prepareScene(opts)).rejects.toThrow("offline")
    opts.load = vi.fn(async () => undefined)
    const cleanup = await prepareScene(opts)
    cleanup()
    expect(opts.onProgress).toHaveBeenLastCalledWith({ completed: 2, total: 2 })
  })
  it("handles synchronous cancellation from initial progress", async () => {
    const abort = new AbortController(),
      opts = defaults()
    opts.signal = abort.signal
    opts.onProgress = vi.fn(() => abort.abort())
    await expect(prepareScene(opts)).rejects.toMatchObject({
      name: "AbortError",
    })
  })
})
