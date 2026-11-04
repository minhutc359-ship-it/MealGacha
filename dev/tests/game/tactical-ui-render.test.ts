import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { TacticalBattleScreen } from "@/components/game/TacticalBattleScreen"
import { TacticalCampaignScreen } from "@/components/game/TacticalCampaignScreen"

class MemoryStorage {
  private data = new Map<string, string>()
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
}

function maximumButtonDepth(html: string) {
  let depth = 0,
    maximum = 0
  for (const token of html.match(/<button\b|<\/button>/g) ?? []) {
    depth += token.startsWith("</") ? -1 : 1
    maximum = Math.max(maximum, depth)
  }
  return maximum
}

describe("Tactical production UI render", () => {
  beforeEach(() => vi.stubGlobal("localStorage", new MemoryStorage()))

  it("renders the complete battle hierarchy without nested buttons", () => {
    const html = renderToStaticMarkup(
      createElement(TacticalBattleScreen, {
        options: { battleId: "ui-render" },
      }),
    )
    expect(html).toContain("tactical-commanders")
    expect(html).toContain("tactical-unit-inspector")
    expect(html).toContain("tactical-trap-heading")
    expect(html.match(/class="tactical-cell /g)).toHaveLength(16)
    expect(html.match(/role="progressbar"/g)?.length).toBeGreaterThan(10)
    expect(maximumButtonDepth(html)).toBe(1)
  })

  it("renders campaign progress and all eight nodes", () => {
    const html = renderToStaticMarkup(createElement(TacticalCampaignScreen))
    expect(html).toContain("tactical-campaign-progress")
    expect(html.match(/<button/g)).toHaveLength(8)
    expect(html).toContain("Con đường Giao Ước")
  })
})
