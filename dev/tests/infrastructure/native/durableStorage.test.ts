import { afterEach, expect, it, vi } from "vitest"
import {
  installDurableStorage,
  type DurableBridge,
} from "@/infrastructure/native/durableStorage"
afterEach(() => vi.unstubAllGlobals())
function fixture(raw = '{"foodchest.tcg.v1":"old"}') {
  vi.stubGlobal("window", {})
  let disk = raw,
    fail = false
  const bridge: DurableBridge = {
    readAll: () => disk,
    setItem: (key, value) => {
      if (fail) return false
      const data = JSON.parse(disk)
      data[key] = value
      disk = JSON.stringify(data)
      return true
    },
    removeItem: (key) => {
      if (fail) return false
      const data = JSON.parse(disk)
      delete data[key]
      disk = JSON.stringify(data)
      return true
    },
    clear: () => {
      if (fail) return false
      disk = "{}"
      return true
    },
  }
  return {
    bridge,
    fail: () => {
      fail = true
    },
    disk: () => disk,
  }
}
it("hydrates durable data first and a second bootstrap sees the last acknowledged commit", () => {
  const f = fixture(),
    storage = installDurableStorage(f.bridge)
  expect(storage.getItem("foodchest.tcg.v1")).toBe("old")
  storage.setItem("foodchest.tcg.v1", "new")
  expect(JSON.parse(f.disk())["foodchest.tcg.v1"]).toBe("new")
  expect(installDurableStorage(f.bridge).getItem("foodchest.tcg.v1")).toBe(
    "new",
  )
})
it("keeps memory and disk at the previous checkpoint when native commit fails", () => {
  const f = fixture(),
    storage = installDurableStorage(f.bridge)
  f.fail()
  expect(() => storage.setItem("foodchest.tcg.v1", "replacement")).toThrow()
  expect(storage.getItem("foodchest.tcg.v1")).toBe("old")
  expect(JSON.parse(f.disk())["foodchest.tcg.v1"]).toBe("old")
  expect(() => storage.clear()).toThrow()
  expect(storage.length).toBe(1)
})
it("blocks invalid durable data before installing a storage replacement", () => {
  for (const raw of ["null", "[]", '{"key":4}', "{bad"]) {
    const f = fixture(raw)
    expect(() => installDurableStorage(f.bridge)).toThrow()
    expect(f.disk()).toBe(raw)
  }
})
