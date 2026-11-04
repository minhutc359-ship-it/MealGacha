import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
describe("Tactical battle UI", () => {
  const page = readFileSync("src/pages/TCGPage.tsx", "utf8"),
    battle = readFileSync(
      "src/components/game/TacticalBattleScreen.tsx",
      "utf8",
    ),
    campaign = readFileSync(
      "src/components/game/TacticalCampaignScreen.tsx",
      "utf8",
    ),
    css = readFileSync("src/game/tacticalBattle.css", "utf8")
  it("defaults to the battle and retains only Manga and Chest links", () => {
    expect(page).toContain('"battle"')
    expect(page).toContain("MangaChronicle")
    expect(page).toContain('to="/chest"')
    expect(page).not.toContain("ModeSwitch")
  })
  it("renders sixteen cells and manual ultimates", () => {
    expect(battle).toMatch(/\[0,\s*1,\s*2,\s*3\]/)
    expect(battle).toContain("Tuyệt kỹ")
    expect(battle).toContain("claimBattleReward")
    expect(battle).toContain("Bẫy phản ứng")
    expect(battle).toContain("tactical-boss-badge")
    expect(battle).toContain("Hướng dẫn trận đầu")
    expect(battle).toContain("CommanderPanel")
    expect(battle).toContain("tactical-unit-inspector")
    expect(battle).toContain('role="progressbar"')
    expect(battle).toContain("ROLE_LABELS")
  })
  it("exposes readable trap, campaign and battle progress states", () => {
    expect(battle).toContain("aria-pressed={trapColumn === column}")
    expect(battle).toContain("tactical-trap-heading")
    expect(campaign).toContain("tactical-campaign-progress")
    expect(campaign).toContain('aria-label="Tiến trình chiến dịch"')
  })
  it("has responsive and reduced-motion layouts", () => {
    expect(css).toContain("@media (max-width: 760px)")
    expect(css).toContain("@media (max-width: 430px)")
    expect(css).toContain("prefers-reduced-motion")
  })
})
