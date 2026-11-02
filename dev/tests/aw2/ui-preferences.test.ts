import { describe, expect, it } from "vitest"
import {
  AW2_UI_PREFERENCES_KEY,
  decodeAw2UiPreferences,
  DEFAULT_AW2_UI_PREFERENCES,
  encodeAw2UiPreferences,
  updateAw2UiPreferences,
} from "@/aw2/ui/preferences"

describe("AW2-018F versioned UI preferences", () => {
  it("uses a separate versioned UI key and safe defaults without save fields", () => {
    expect(AW2_UI_PREFERENCES_KEY).toBe("aw2.ui.preferences.v1")
    expect(AW2_UI_PREFERENCES_KEY).not.toContain("development.save")
    expect(decodeAw2UiPreferences(null)).toEqual(DEFAULT_AW2_UI_PREFERENCES)
  })

  it.each([
    ["largeText", true],
    ["highContrast", true],
    ["reducedMotion", true],
    ["largeTouchTargets", true],
  ] as const)("round-trips %s=%s", (key, enabled) => {
    const value = updateAw2UiPreferences(DEFAULT_AW2_UI_PREFERENCES, {
      [key]: enabled,
    })
    expect(decodeAw2UiPreferences(encodeAw2UiPreferences(value))).toEqual(value)
  })

  it.each([
    "{broken",
    "null",
    "[]",
    JSON.stringify({ ...DEFAULT_AW2_UI_PREFERENCES, version: 2 }),
    JSON.stringify({ version: 1, largeText: true }),
    JSON.stringify({ ...DEFAULT_AW2_UI_PREFERENCES, extra: true }),
    JSON.stringify({ ...DEFAULT_AW2_UI_PREFERENCES, largeText: "yes" }),
  ])("falls back atomically for malformed/future value %s", (raw) => {
    expect(decodeAw2UiPreferences(raw)).toBe(DEFAULT_AW2_UI_PREFERENCES)
  })

  it("updates immutably and never accepts a version patch", () => {
    const before = DEFAULT_AW2_UI_PREFERENCES
    const next = updateAw2UiPreferences(before, {
      largeText: true,
      reducedMotion: true,
    })
    expect(next).not.toBe(before)
    expect(before.largeText).toBe(false)
    expect(next).toMatchObject({
      version: 1,
      largeText: true,
      reducedMotion: true,
    })
    expect(Object.isFrozen(next)).toBe(true)
  })
})
