import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const text = (path: string) => readFileSync(path, "utf8")

describe("AW2-018F production accessibility surface", () => {
  it("wires onboarding only for an empty main without a recovery candidate", () => {
    const game = text("dev/aw2/WorldGame.tsx")
    expect(game).toContain(
      'snapshot.status === "empty" && !props.recoveryAvailable',
    )
    expect(game).toContain("<FirstJourneyOnboarding")
    expect(game).toContain("onStart={props.onSave}")
    expect(game).toContain("Phục hồi bản an toàn")
  })

  it("provides a focusable skip target and labeled gameplay region", () => {
    const game = text("dev/aw2/WorldGame.tsx")
    expect(game).toContain('href="#aw2-game-map"')
    expect(game).toContain('id="aw2-game-map"')
    expect(game).toContain('aria-label="Bản đồ khám phá và điều khiển"')
    expect(game).toContain("tabIndex={-1}")
  })

  it("separates polite status from assertive errors", () => {
    const game = text("dev/aw2/WorldGame.tsx")
    expect(game).toContain('role="status"')
    expect(game).toContain('aria-live="polite"')
    expect(game).toContain('className="aw2-game-error" role="alert"')
    expect(game).not.toContain('role={props.error ? "alert" : "status"}')
  })

  it("publishes matching J/I/P/M/H shortcuts and help copy", () => {
    const game = text("dev/aw2/WorldGame.tsx")
    for (const dockItem of [
      '["quest", "Nhiệm vụ", "J"]',
      '["party", "Đội", "P"]',
      '["bag", "Túi", "I"]',
    ])
      expect(game).toContain(dockItem)
    expect(game).toContain("aria-keyshortcuts={shortcut}")
    for (const shortcut of ["M", "H"])
      expect(game).toContain(`aria-keyshortcuts="${shortcut}"`)
    expect(game).toContain("J nhiệm vụ; I túi; P đội; M bản đồ; H hướng dẫn")
    expect(text("dev/aw2/world.tsx")).toContain("event.shiftKey")
  })

  it("keeps focus trap, Escape cancellation and opener restoration", () => {
    const panels = text("dev/aw2/GamePanels.tsx")
    expect(panels).toContain("onKeyDown={trapPanelTab}")
    expect(panels).toContain("onCancel={(e) =>")
    expect(panels).toContain("opener.focus({ preventScroll: true })")
  })

  it("covers safe area, small portrait, low landscape and 44px controls", () => {
    const css = text("dev/aw2/game.css")
    expect(css).toContain("env(safe-area-inset-top)")
    expect(css).toContain("@media (max-width: 359px)")
    expect(css).toContain("(orientation: landscape) and (max-height: 450px)")
    expect(css).toContain("repeat(3,44px)")
    expect(css).toContain("min-height: 48px")
  })

  it("supports explicit/system reduced motion, contrast and forced colors", () => {
    const css = text("dev/aw2/game.css")
    expect(css).toContain('html[data-aw2-motion="reduced"]')
    expect(css).toContain("@media (prefers-reduced-motion: reduce)")
    expect(css).toContain('html[data-aw2-contrast="high"]')
    expect(css).toContain('html[data-aw2-contrast="high"] .aw2-game-panel')
    expect(css).toContain("@media (forced-colors: active)")
  })

  it("keeps accessibility preferences separate from progress save APIs", () => {
    const hook = text("dev/aw2/useGameAccessibility.ts")
    expect(hook).toContain("AW2_UI_PREFERENCES_KEY")
    expect(hook).not.toContain("AW2_DEV_SAVE_KEY")
    expect(hook).not.toContain("Aw2DevSaveStore")
    expect(hook).toContain('window.addEventListener("storage", changed)')
  })
})
