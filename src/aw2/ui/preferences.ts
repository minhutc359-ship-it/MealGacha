export const AW2_UI_PREFERENCES_KEY = "aw2.ui.preferences.v1"
export const AW2_UI_PREFERENCES_EVENT = "aw2-ui-preferences"

export interface Aw2UiPreferences {
  readonly version: 1
  readonly largeText: boolean
  readonly highContrast: boolean
  readonly reducedMotion: boolean
  readonly largeTouchTargets: boolean
}

export const DEFAULT_AW2_UI_PREFERENCES: Aw2UiPreferences = Object.freeze({
  version: 1,
  largeText: false,
  highContrast: false,
  reducedMotion: false,
  largeTouchTargets: false,
})

const PREFERENCE_KEYS = new Set([
  "version",
  "largeText",
  "highContrast",
  "reducedMotion",
  "largeTouchTargets",
])

export function decodeAw2UiPreferences(raw: string | null): Aw2UiPreferences {
  if (raw === null) return DEFAULT_AW2_UI_PREFERENCES
  try {
    const value: unknown = JSON.parse(raw)
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      Object.keys(value).length !== PREFERENCE_KEYS.size ||
      Object.keys(value).some((key) => !PREFERENCE_KEYS.has(key)) ||
      !("version" in value) ||
      value.version !== 1 ||
      !("largeText" in value) ||
      typeof value.largeText !== "boolean" ||
      !("highContrast" in value) ||
      typeof value.highContrast !== "boolean" ||
      !("reducedMotion" in value) ||
      typeof value.reducedMotion !== "boolean" ||
      !("largeTouchTargets" in value) ||
      typeof value.largeTouchTargets !== "boolean"
    )
      return DEFAULT_AW2_UI_PREFERENCES
    return Object.freeze({
      version: 1,
      largeText: value.largeText,
      highContrast: value.highContrast,
      reducedMotion: value.reducedMotion,
      largeTouchTargets: value.largeTouchTargets,
    })
  } catch {
    return DEFAULT_AW2_UI_PREFERENCES
  }
}

export function encodeAw2UiPreferences(value: Aw2UiPreferences): string {
  return JSON.stringify({
    version: 1,
    largeText: value.largeText,
    highContrast: value.highContrast,
    reducedMotion: value.reducedMotion,
    largeTouchTargets: value.largeTouchTargets,
  })
}

export function updateAw2UiPreferences(
  current: Aw2UiPreferences,
  patch: Partial<Omit<Aw2UiPreferences, "version">>,
): Aw2UiPreferences {
  return Object.freeze({ ...current, ...patch, version: 1 })
}
