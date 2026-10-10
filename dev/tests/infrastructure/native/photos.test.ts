import { afterEach, beforeEach, expect, it, vi } from "vitest"
const fs = vi.hoisted(() => ({
  writeFile: vi.fn(),
  readFile: vi.fn(),
  deleteFile: vi.fn(),
}))
vi.mock("@capacitor/filesystem", () => ({
  Filesystem: fs,
  Directory: { Data: "DATA" },
}))
import { nativePutImage, nativeGetImage } from "@/infrastructure/native/photos"
let values: Map<string, string>,
  files: Map<string, string>,
  writes: number,
  failWrite: number,
  failCommit: boolean
beforeEach(() => {
  values = new Map()
  files = new Map()
  writes = 0
  failWrite = 0
  failCommit = false
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (failCommit) throw Error("disk full")
      values.set(k, v)
    },
  })
  vi.stubGlobal(
    "FileReader",
    class {
      result = ""
      onload?: () => void
      async readAsDataURL(blob: Blob) {
        this.result =
          "data:;base64," +
          Buffer.from(await blob.arrayBuffer()).toString("base64")
        this.onload?.()
      }
    },
  )
  fs.writeFile.mockImplementation(
    async ({ path, data }: {
      path: string
      data: string
    }) => {
      if (++writes === failWrite) throw Error("disk full")
      files.set(path, data)
      return { uri: path }
    },
  )
  fs.readFile.mockImplementation(async ({ path }: { path: string }) => ({
    data: files.get(path),
  }))
  fs.deleteFile.mockImplementation(async ({ path }: { path: string }) => {
    files.delete(path)
  })
})
afterEach(() => vi.unstubAllGlobals())
const image = (value: string) => ({
  id: "photo-one",
  blob: new Blob([value]),
  thumbnail: new Blob(["thumb-" + value]),
  mimeType: "image/webp",
  width: 8,
  height: 8,
  createdAt: "2026-10-10",
})
it("commits both files before exposing an image and keeps byte-identical reads", async () => {
  await nativePutImage(image("old"))
  const loaded = await nativeGetImage("photo-one")
  expect(await loaded!.blob.text()).toBe("old")
  expect(await loaded!.thumbnail.text()).toBe("thumb-old")
  expect(files.size).toBe(2)
})
it("preserves the previous full image and thumbnail when the second file fails", async () => {
  await nativePutImage(image("old"))
  const before = values.get("meal.native.photos.v1")
  failWrite = writes + 2
  await expect(nativePutImage(image("new"))).rejects.toThrow("disk full")
  expect(values.get("meal.native.photos.v1")).toBe(before)
  expect(files.size).toBe(2)
  expect(await (await nativeGetImage("photo-one"))!.blob.text()).toBe("old")
})
it("removes new files when durable metadata rejects the commit", async () => {
  await nativePutImage(image("old"))
  failCommit = true
  await expect(nativePutImage(image("new"))).rejects.toThrow("disk full")
  expect(files.size).toBe(2)
  expect(await (await nativeGetImage("photo-one"))!.thumbnail.text()).toBe(
    "thumb-old",
  )
})
