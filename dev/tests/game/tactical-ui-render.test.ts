import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { TacticalBattleScreen } from "@/components/game/TacticalBattleScreen"
import { TacticalCampaignScreen } from "@/components/game/TacticalCampaignScreen"
import {
  TacticalCollection,
  TacticalDeckBuilder,
  TacticalPacks,
} from "@/components/game/TacticalCardHub"
import { TacticalHome, TacticalGuide } from "@/components/game/TacticalHome"
import {
  ensureTacticalAccount,
  saveTacticalCheckpoint,
  claimTacticalDaily,
} from "@/game/tacticalTcg/progression"
import { createTacticalBattle } from "@/game/tacticalTcg/engine"
import { TacticalBackupPanel } from "@/components/game/TacticalBackupPanel"
import { TACTICAL_STARTER } from "@/game/tacticalTcg/cards"
import { MemoryRouter } from "react-router-dom"

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
  it("resumes a saved campaign and shows a clear home/daily state", () => {
    ensureTacticalAccount(localStorage)
    saveTacticalCheckpoint(
      localStorage,
      createTacticalBattle({
        battleId: "campaign:act-1-hearth:v1",
        nodeId: "act-1-hearth",
        deck: TACTICAL_STARTER,
      }),
    )
    const progress = claimTacticalDaily(localStorage)
    const home = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(TacticalHome, {
          progress,
          go: () => {},
          onDaily: () => {},
          onResume: () => {},
        }),
      ),
    )
    expect(home).toContain("Tiếp tục trận đang chơi")
    expect(home).toContain("Đã nhận hôm nay")
    const campaign = renderToStaticMarkup(
      createElement(TacticalCampaignScreen, {
        deck: TACTICAL_STARTER,
        resumeNodeId: "act-1-hearth",
      }),
    )
    expect(campaign).toContain("Linh Chiến 4×2")
    expect(campaign).toContain("Tay bài của bạn")
  })
  it("makes backup import and its paste alternative reachable", () => {
    const html = renderToStaticMarkup(
      createElement(TacticalBackupPanel, { onRestored: () => {} }),
    )
    expect(html).toContain("Chọn tệp bản sao JSON")
    expect(html).toContain("Nội dung bản sao JSON")
    expect(html).toContain("Kiểm tra bản sao")
    expect(maximumButtonDepth(html)).toBe(1)
  })
  it("renders a card match with an empty board and an actual four-card hand", () => {
    const html = renderToStaticMarkup(
      createElement(TacticalBattleScreen, {
        options: { battleId: "deck-ui", deck: TACTICAL_STARTER },
      }),
    )
    expect(html.match(/class="tactical-cell is-empty/g)).toHaveLength(16)
    expect(html).toContain("Tay bài của bạn")
    expect(html).toContain("LỬA BẾP")
    expect(html).toContain("Đổi tay đầu")
    expect(maximumButtonDepth(html)).toBe(1)
  })
  it("makes collection, deck editing, packs, guide and home reachable with real account data", () => {
    const progress = ensureTacticalAccount(localStorage)
    const props = { progress, onProgress: () => {} }
    const collection = renderToStaticMarkup(
      createElement(TacticalCollection, props),
    )
    const deck = renderToStaticMarkup(createElement(TacticalDeckBuilder, props))
    const packs = renderToStaticMarkup(createElement(TacticalPacks, props))
    const guide = renderToStaticMarkup(
      createElement(TacticalGuide, { onPlay: () => {} }),
    )
    const home = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(TacticalHome, {
          progress,
          go: () => {},
          onDaily: () => {},
        }),
      ),
    )
    expect(collection).toContain("Bộ sưu tập")
    expect(collection).toContain("Tìm thẻ")
    expect(deck).toContain("Lưu &amp; trang bị")
    expect(deck).toContain("Bếp nhà")
    expect(packs).toContain("Mở 5 lá")
    expect(packs).toContain("Huyền thoại 2%")
    expect(guide).toContain("24 lá")
    expect(home).toContain("Tiếp tục hành trình")
    for (const html of [collection, deck, packs, guide, home])
      expect(maximumButtonDepth(html)).toBeLessThanOrEqual(1)
  })
})
