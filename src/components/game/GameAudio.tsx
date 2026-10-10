import {
  useEffect,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react"
import { gameAudio } from "../../infrastructure/audio/gameAudio"
import type { MusicTrack } from "../../game/audioScore"
import { useAppStore } from "../../store/useAppStore"
import { Dialog } from "./Dialog"

export function useGameAudio() {
  const prefs = useAppStore((s) => s.user.preferences)
  useEffect(() => gameAudio.mount(), [])
  useEffect(
    () => gameAudio.configure(prefs),
    [
      prefs.soundEnabled,
      prefs.musicEnabled,
      prefs.musicStyle,
      prefs.musicVolume,
      prefs.effectsVolume,
    ],
  )
}

export function useGameMusic(track: MusicTrack | null, priority = 5) {
  useEffect(
    () => (track ? gameAudio.acquire(track, priority) : undefined),
    [track, priority],
  )
}

// Closed journal details and off-screen readers must not claim the soundtrack.
export function useStoryMusic(
  ref: RefObject<HTMLElement | null>,
  track: MusicTrack,
) {
  useEffect(() => {
    const element = ref.current
    if (!element) return
    let release: (() => void) | undefined
    let intersecting = false
    const update = () => {
      const visible =
        intersecting &&
        element.getClientRects().length > 0 &&
        !element.closest("details:not([open])")
      if (visible && !release)
        release = gameAudio.acquire(track, element.closest("dialog") ? 30 : 10)
      if (!visible && release) {
        release()
        release = undefined
      }
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        intersecting = entry.isIntersecting
        update()
      },
      { threshold: 0.05 },
    )
    observer.observe(element)
    const details = [...document.querySelectorAll("details")].filter((node) =>
      node.contains(element),
    )
    details.forEach((node) => node.addEventListener("toggle", update))
    return () => {
      observer.disconnect()
      details.forEach((node) => node.removeEventListener("toggle", update))
      release?.()
    }
  }, [ref, track])
}

const trackNames: Record<MusicTrack, string> = {
 "v4-market-warm": "Chợ có hai giọng · Lời mời",
 "v4-market-tension": "Chợ có hai giọng · Giữ bàn",
 "v4-harbor-warm": "Bến sau mưa · Lời mời",
 "v4-harbor-tension": "Bến sau mưa · Giữ bàn",
 "v4-kitchen-warm": "Bữa cơm ngày mai · Lời mời",
 "v4-kitchen-tension": "Bữa cơm ngày mai · Giữ bàn",

  "auto-prepare": "Đèn lên phiên chợ",
  "auto-battle": "Vị Linh giữ bàn",
  "auto-boss": "Tên gọi trong sương",
  "auto-story": "Chuyện bên bếp",
  "auto-pressure": "Đêm không tắt bếp",
  battle: "Bếp lửa lên nhịp",
  boss: "Năm ngọn lửa",
  "story-warm": "Lời mời bên bếp",
  "story-mystery": "Điều sương chưa kể",
}

export function AudioControls() {
  const prefs = useAppStore((s) => s.user.preferences)
  const update = useAppStore((s) => s.updatePreference)
  const status = useSyncExternalStore(
    gameAudio.subscribe,
    gameAudio.getSnapshot,
    gameAudio.getSnapshot,
  )
  return (
    <div className="tcg-audio-controls">
      <label>
        <span>Âm thanh game</span>
        <input
          type="checkbox"
          checked={prefs.soundEnabled}
          onChange={(e) => update("soundEnabled", e.target.checked)}
        />
      </label>
      <fieldset className="tcg-music-styles">
        <legend>Phong cách nhạc</legend>
        {(["original", "8bit"] as const).map((style) => (
          <label key={style}>
            <input
              type="radio"
              name="music-style"
              value={style}
              checked={(prefs.musicStyle ?? "original") === style}
              onChange={() => update("musicStyle", style)}
            />
            <span>
              <strong>
                {style === "original" ? "Bếp Việt" : "8-bit phiêu lưu"}
              </strong>
              <small>
                {style === "original"
                  ? "Nhạc ấm áp như hiện tại"
                  : "Giai điệu Soul of Meal · âm sắc retro"}
              </small>
            </span>
          </label>
        ))}
      </fieldset>
      <label>
        <span>Nhạc nền trận đấu & cutscene</span>
        <input
          type="checkbox"
          checked={prefs.musicEnabled ?? true}
          disabled={!prefs.soundEnabled}
          onChange={(e) => update("musicEnabled", e.target.checked)}
        />
      </label>
      <label>
        <span>
          Âm lượng nhạc · {Math.round((prefs.musicVolume ?? 0.38) * 100)}%
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step=".01"
          value={prefs.musicVolume ?? 0.38}
          disabled={!prefs.soundEnabled}
          onChange={(e) => update("musicVolume", Number(e.target.value))}
        />
      </label>
      <label>
        <span>
          Âm lượng hiệu ứng · {Math.round((prefs.effectsVolume ?? 0.7) * 100)}%
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step=".01"
          value={prefs.effectsVolume ?? 0.7}
          disabled={!prefs.soundEnabled}
          onChange={(e) => update("effectsVolume", Number(e.target.value))}
        />
      </label>
      <p role="status">
        {!prefs.soundEnabled
          ? "Đang tắt mọi âm thanh."
          : status.phase === "waiting"
            ? "Chạm Phát thử để bật âm thanh."
            : status.phase === "error"
              ? "Chưa tải được nhạc. Phát thử để thử lại."
              : status.phase === "playing" && status.track
                ? `Đang phát · ${trackNames[status.track]} · ${
                    status.style === "8bit" ? "8-bit" : "Bếp Việt"
                  }`
                : "Âm thanh đã sẵn sàng."}
      </p>
      <button
        type="button"
        className="tcg-button ghost"
        disabled={!prefs.soundEnabled}
        onClick={() =>
          void gameAudio.unlock().then(() => gameAudio.play("select"))
        }
      >
        ♫ Phát thử
      </button>
    </div>
  )
}

export function AudioButton({
  label = "Âm thanh & âm nhạc",
}: {
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const enabled = useAppStore((s) => s.user.preferences.soundEnabled)
  return (
    <>
      <button
        type="button"
        className="tcg-button ghost tcg-audio-button"
        aria-label={label}
        title={label}
        onClick={() => setOpen(true)}
      >
        {enabled ? "♫" : "♫̸"}
      </button>
      {open && (
        <Dialog title="Âm thanh & âm nhạc" onClose={() => setOpen(false)}>
          <AudioControls />
        </Dialog>
      )}
    </>
  )
}
