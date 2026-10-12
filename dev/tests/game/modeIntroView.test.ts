import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { ModeIntroScene } from "@/components/game/ModeIntroScenes"
import { buildModeIntro, introAt } from "@/game/modeIntro"
import { useGameStore } from "@/game/useGameStore"
import { useAppStore } from "@/store/useAppStore"

beforeAll(() => vi.stubGlobal("document", { hidden: false }))
afterAll(() => vi.unstubAllGlobals())

describe("the live game renderers used in introductions", () => {
  for (const [mode, at, classes] of [
    ["tcg", 6500, ["tcg-viewport-battle", "tcg-field", "tcg-hand"]],
    ["auto", 16000, ["ac-cell-grid", "ac-battle-layout", "ac-hud"]],
    ["adventure", 14000, ["adv-battle-arena", "adv-skill-grid", "adv-combatant"]],
    ["chest", 6000, ["chest-model", "chest-scene", "taste-key"]],
    ["chest", 13000, ["reward-reveal-card", "reward-art-frame", "reward-shine"]],
  ] as const) {
    it(`${mode} at ${at}ms renders the actual playing surface, read-only, with no save mutation`, () => {
      const game = JSON.stringify(useGameStore.getState().save)
      const account = JSON.stringify(useAppStore.getState().user)
      const clip = buildModeIntro(mode), frame = introAt(clip.frames, at)
      const html = renderToStaticMarkup(createElement(ModeIntroScene, { frame, elapsed: at, paused: false, quiet: true }))
      for (const name of classes) expect(html).toContain(name)
      expect(html).toContain("inert")
      expect(html).not.toMatch(/intro-tcg-stage|intro-auto-stage|intro-adventure-stage|intro-chest-stage/)
      expect(JSON.stringify(useGameStore.getState().save)).toBe(game)
      expect(JSON.stringify(useAppStore.getState().user)).toBe(account)
    })
  }
})
