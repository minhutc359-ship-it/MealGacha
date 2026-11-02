import { createElement } from "react"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import {
  BALANCE_CONTRACT_ID,
  developmentBalanceSnapshot,
  serializeDevelopmentBalance,
  validateDevelopmentBalance,
} from "@/aw2/balance/contract"
import {
  GACHA_PROPOSAL_STATUS,
  GACHA_RUNTIME_CAPABILITIES,
  PITY_LIMITS,
  TIERS,
  WEIGHTS,
} from "@/aw2/gacha/proposal"
import { BalanceDisclosure } from "../../aw2/BalanceDisclosure"

describe("AW2 development balance contract", () => {
  it("freezes one deterministic 12-kit/economy/progression snapshot", () => {
    const snapshot = developmentBalanceSnapshot()
    const serialized = serializeDevelopmentBalance(snapshot)
    expect(snapshot.contractId).toBe(BALANCE_CONTRACT_ID)
    expect(snapshot.combat.kits).toHaveLength(12)
    expect(snapshot.combat.starters).toHaveLength(5)
    expect(validateDevelopmentBalance(snapshot)).toEqual([])
    expect(createHash("sha256").update(serialized).digest("hex")).toBe(
      "3e24fb95ed32c24d30917e0847aaeaa6a49f145529ab85c7653906c3c1bb136b",
    )
  })

  it("reports independent drift instead of hiding later contract failures", () => {
    const changed = structuredClone(developmentBalanceSnapshot()) as any
    changed.combat.kits[0].hp = 999
    changed.combat.kits.push(changed.combat.kits[0])
    changed.gacha.weights[0] = 1
    changed.gacha.runtime.draw = true
    expect(validateDevelopmentBalance(changed)).toEqual(
      expect.arrayContaining([
        "Combat phải có đúng 12 kit duy nhất.",
        expect.stringContaining("hp nằm ngoài guardrail"),
        "Đề xuất gacha D11 không nhất quán.",
        "Đề xuất gacha không được bật capability runtime.",
      ]),
    )
  })

  it("keeps D11 proposal-only with exact tiers, weights and hard caps", () => {
    expect(GACHA_PROPOSAL_STATUS).toBe("PROPOSED_NOT_APPROVED")
    expect(TIERS).toEqual(["N", "R", "SR", "SSR", "UR"])
    expect(WEIGHTS.reduce((sum, value) => sum + value, 0)).toBe(10000)
    expect(PITY_LIMITS).toEqual({ sr: 10, ssr: 80, ur: 200 })
    expect(Object.values(GACHA_RUNTIME_CAPABILITIES)).toEqual([
      false,
      false,
      false,
      false,
      false,
    ])
  })

  it("renders an honest production disclosure without importing simulator", () => {
    const html = renderToStaticMarkup(createElement(BalanceDisclosure))
    expect(html).toContain(BALANCE_CONTRACT_ID)
    expect(html).toContain("PROPOSED_NOT_APPROVED")
    expect(html).toContain("không có nút")
    expect(html).toContain("không lưu pity")
    for (const source of [
      "dev/aw2/BalanceDisclosure.tsx",
      "src/aw2/balance/contract.ts",
    ])
      expect(readFileSync(source, "utf8")).not.toContain("gacha/simulator")
  })
})
