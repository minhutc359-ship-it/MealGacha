import { useCallback, useEffect, useRef, useState } from "react"
import {
  AW2_UI_PREFERENCES_KEY,
  AW2_UI_PREFERENCES_EVENT,
  decodeAw2UiPreferences,
  DEFAULT_AW2_UI_PREFERENCES,
  encodeAw2UiPreferences,
  updateAw2UiPreferences,
  type Aw2UiPreferences,
} from "../../src/aw2/ui/preferences"

function readPreferences(): Aw2UiPreferences {
  try {
    return decodeAw2UiPreferences(
      window.localStorage.getItem(AW2_UI_PREFERENCES_KEY),
    )
  } catch {
    return DEFAULT_AW2_UI_PREFERENCES
  }
}

export function useGameAccessibility() {
  const [preferences, setPreferences] = useState(readPreferences)
  const [announcement, setAnnouncement] = useState("")
  const current = useRef(preferences)
  current.current = preferences

  useEffect(() => {
    const root = document.documentElement
    root.dataset.aw2Text = preferences.largeText ? "large" : "normal"
    root.dataset.aw2Contrast = preferences.highContrast ? "high" : "standard"
    root.dataset.aw2Motion = preferences.reducedMotion ? "reduced" : "system"
    root.dataset.aw2Touch = preferences.largeTouchTargets ? "large" : "standard"
    window.dispatchEvent(new Event(AW2_UI_PREFERENCES_EVENT))
    return () => {
      delete root.dataset.aw2Text
      delete root.dataset.aw2Contrast
      delete root.dataset.aw2Motion
      delete root.dataset.aw2Touch
    }
  }, [preferences])

  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.key !== AW2_UI_PREFERENCES_KEY) return
      const next = decodeAw2UiPreferences(event.newValue)
      current.current = next
      setPreferences(next)
      setAnnouncement("Tùy chọn hiển thị đã đổi ở tab khác.")
    }
    window.addEventListener("storage", changed)
    return () => window.removeEventListener("storage", changed)
  }, [])

  const update = useCallback(
    (patch: Partial<Omit<Aw2UiPreferences, "version">>) => {
      const next = updateAw2UiPreferences(current.current, patch)
      current.current = next
      setPreferences(next)
      try {
        window.localStorage.setItem(
          AW2_UI_PREFERENCES_KEY,
          encodeAw2UiPreferences(next),
        )
        setAnnouncement("Đã lưu tùy chọn hiển thị trên trình duyệt này.")
      } catch {
        setAnnouncement(
          "Đã áp dụng cho phiên này nhưng trình duyệt chưa cho lưu tùy chọn.",
        )
      }
    },
    [],
  )

  const reset = useCallback(() => {
    current.current = DEFAULT_AW2_UI_PREFERENCES
    setPreferences(DEFAULT_AW2_UI_PREFERENCES)
    try {
      window.localStorage.removeItem(AW2_UI_PREFERENCES_KEY)
      setAnnouncement("Đã đưa tùy chọn hiển thị về mặc định hệ thống.")
    } catch {
      setAnnouncement(
        "Đã dùng mặc định cho phiên này; chưa xóa được tùy chọn đã lưu.",
      )
    }
  }, [])

  return { preferences, announcement, update, reset }
}
