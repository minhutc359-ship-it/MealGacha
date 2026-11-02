import { describe, expect, it } from "vitest"
import {
  AW2_ONBOARDING_STEPS,
  onboardingStepFromKey,
} from "@/aw2/ui/onboarding"

describe("AW2-018F first journey onboarding contract", () => {
  it("has four unique, complete steps in the intended order", () => {
    expect(AW2_ONBOARDING_STEPS.map((step) => step.id)).toEqual([
      "welcome",
      "move",
      "interact",
      "protect",
    ])
    expect(new Set(AW2_ONBOARDING_STEPS.map((step) => step.title)).size).toBe(4)
    expect(AW2_ONBOARDING_STEPS.every((step) => step.body.length > 70)).toBe(
      true,
    )
  })

  it("teaches all production shortcuts and explicit save recovery", () => {
    const copy = AW2_ONBOARDING_STEPS.map((step) => step.body).join(" ")
    for (const key of ["J", "I", "P", "M", "H", "E"])
      expect(copy).toContain(key)
    expect(copy).toContain("Lưu vị trí")
    expect(copy).toContain("Phục hồi bản an toàn")
  })

  it.each([
    [0, "ArrowLeft", 0],
    [0, "ArrowRight", 1],
    [2, "ArrowLeft", 1],
    [2, "ArrowRight", 3],
    [3, "ArrowRight", 3],
  ] as const)("moves step %i with %s to %i", (current, key, expected) => {
    expect(onboardingStepFromKey(current, key)).toBe(expected)
  })

  it("leaves native controls and unrelated keys untouched", () => {
    expect(onboardingStepFromKey(1, "ArrowRight", true)).toBe(1)
    expect(onboardingStepFromKey(1, "Enter")).toBe(1)
    expect(onboardingStepFromKey(1, "Tab")).toBe(1)
  })
})
