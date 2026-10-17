import { describe, it, expect } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import { SPIRIT_IDS, spiritArt } from "@/game/adventureRpg/spiritArt"
import { CARD_MAP } from "@/game/catalog"
import { CHARACTER_ART } from "@/game/characters"
import { chefPortrait } from "@/game/characterVisuals"
import {
  CAST_SIGILS,
  SHOWCASE_THEMES,
  ultimateShowcase,
} from "@/game/ultimateShowcase"

describe("2D showcase coverage and update cleanup", () => {
  it("ships five distinct realms and one Bach illustration across portrait consumers", () => {
    const scenes = Object.values(SHOWCASE_THEMES).map(t => t.scene)
    expect(new Set(scenes).size).toBe(5)
    for (const scene of scenes) expect(existsSync(`public${scene}`)).toBe(true)
    expect(spiritArt("chef-bach")).toEqual({path: CHARACTER_ART.bach, cell: 0, columns: 1})
    expect(CARD_MAP["chef-bach"].art).toBe(CHARACTER_ART.bach)
    expect(chefPortrait("chef-bach")).toBe(CHARACTER_ART.bach)
    expect(chefPortrait("chef-bach", "joy")).not.toBe(CHARACTER_ART.bach)
  })

  it("can present every existing hero with its own title, portrait and ultimate icon", () => {
    const names = new Set<string>(),
      icons = new Set<number>()
    for (const id of SPIRIT_IDS) {
      const identity = ultimateShowcase(id)!,
        art = spiritArt(id)!
      expect(identity.title.length).toBeGreaterThan(8)
      expect(identity.icon).toBeGreaterThanOrEqual(0)
      expect(identity.icon).toBeLessThan(144)
      expect(existsSync(`public${art.path}`)).toBe(true)
      expect(SHOWCASE_THEMES[CARD_MAP[id].school]).toBeDefined()
      names.add(identity.title)
      icons.add(identity.icon)
    }
    expect(names.size).toBe(139)
    expect(icons.size).toBe(139)
    expect(existsSync(`public${CAST_SIGILS}`)).toBe(true)
    expect(ultimateShowcase("cloud-teapot")).toBeNull()
    expect(
      new Set(Object.values(SHOWCASE_THEMES).map((t) => t.color)).size,
    ).toBe(5)
  })

  it("evicts retired movies from retained own media caches while preserving unrelated data and images/audio", async () => {
    const deleted: string[] = [],
      opened: string[] = [],
      handlers: Record<string, (event: unknown) => void> = {}
    const urls = [
      "https://meal.test/assets/rpg/awakening530/movies/pho-ga.mp4",
      "https://meal.test/assets/characters/pho.webp",
      "https://meal.test/assets/music.mp3",
    ]
    const stores = new Map<string, Set<string>>([
      ["som-web-media-stale", new Set(urls)],
      ["som-web-media-old", new Set(urls)],
      ["unrelated-data", new Set(urls)],
      ["som-web-core-old", new Set(["https://meal.test/index.html"])],
    ])
    runInNewContext(
      readFileSync("web-service-worker.js", "utf8")
        .replace("__VERSION__", '"new"')
        .replace("__CORE__", "[]"),
      {
        URL,
        self: {
          addEventListener: (type: string, handler: (event: unknown) => void) =>
            (handlers[type] = handler),
          clients: { claim: async () => {} },
        },
        caches: {
          keys: async () => [...stores.keys()],
          delete: async (key: string) => stores.delete(key),
          open: async (key: string) => {
            opened.push(key)
            return {
              keys: async () =>
                [...(stores.get(key) ?? [])].map((url) => ({ url })),
              delete: async ({ url }: { url: string }) => {
                deleted.push(url)
                return stores.get(key)?.delete(url)
              },
            }
          },
        },
      },
    )
    let work = Promise.resolve()
    handlers.activate({ waitUntil: (p: Promise<void>) => (work = p) })
    await work
    expect(deleted).toEqual([urls[0]])
    expect([...stores.get("som-web-media-old")!]).toEqual(urls.slice(1))
    expect([...stores.get("unrelated-data")!]).toEqual(urls)
    expect(stores.has("som-web-core-old")).toBe(true)
    expect(opened).not.toContain("som-web-media-stale")
  })
})
