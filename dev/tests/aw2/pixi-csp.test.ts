import { readFileSync } from "node:fs"
import { describe, expect, it, vi } from "vitest"

const mockPixi = vi.hoisted(() => ({ order: [] as string[] }))

vi.mock("pixi.js/unsafe-eval", () => {
  mockPixi.order.push("unsafe-eval")
  return {}
})

vi.mock("pixi.js", () => {
  mockPixi.order.push("pixi")
  return { marker: "pixi" }
})

import { loadPixi } from "../../../src/infrastructure/presentation/loadPixi"

const runtimeEntries = [
  "dev/aw2-scenes/VillageLandscape.tsx",
  "dev/aw2-scenes/TeaRoomCanvas.tsx",
  "dev/aw2-scenes/JourneyLandscape.tsx",
  "dev/aw2/WorldCanvas.tsx",
  "dev/aw2/prepareDestination.ts",
  "src/components/chest/LootVfxCanvas.tsx",
  "src/components/game/ArenaScene.tsx",
]

describe("Pixi strict-CSP bootstrap", () => {
  it("installs the compatibility module before exposing one cached Pixi module", async () => {
    const [first, second] = await Promise.all([loadPixi(), loadPixi()])

    expect(first).toBe(second)
    expect(mockPixi.order).toEqual(["unsafe-eval", "pixi"])
  })

  it.each(runtimeEntries)("routes %s through the shared loader", (path) => {
    const source = readFileSync(path, "utf8")

    expect(source).toContain("loadPixi")
    expect(source).toContain("loadPixi()")
    expect(source).not.toContain('await import("pixi.js")')
  })

  it("keeps the deployed script policy strict", () => {
    const config = JSON.parse(readFileSync("vercel.json", "utf8"))
    const global = config.headers.find(
      (rule: { source: string }) => rule.source === "/:path*",
    )
    const csp = global.headers.find(
      (header: { key: string }) => header.key === "Content-Security-Policy",
    ).value as string

    expect(csp).toContain("script-src 'self'")
    expect(csp).not.toContain("'unsafe-eval'")
  })
})
