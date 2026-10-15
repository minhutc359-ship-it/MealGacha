import { SoundtrackRoom } from "./SoundtrackRoom"
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
      prefs.ambienceVolume,
    ],
  )
}

export function useGameMusic(track: MusicTrack | null, priority = 5, pressure = 0) {
  useEffect(
    () => (track ? gameAudio.acquire(track, priority) : undefined),
    [track, priority],
  )
  useEffect(()=>gameAudio.updatePressure(pressure,track),[track,pressure])
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
  "mode-chest": "Lời Mời Khai Vị",
  "mode-tcg": "Ván Bài Bên Bếp",
  "mode-autochess": "Bày Mâm Xuất Trận",
  "mode-adventure": "Đường Qua Sương",
  "map-lantern": "Phố Đèn Gọi Tên",
  "map-harbor": "Than Hồng Sau Mưa",
  "map-garden": "Lời Hứa Dưới Tán",
  "map-tide": "Trăng Trên Lòng Chảo",
  "map-tea": "Mây Qua Đỉnh Trà",
  "map-salt": "Nhịp Lò Muối Đỏ",
  "map-lotus": "Sen Nguyệt Thức Giấc",
  "map-aroma": "Vũ Khúc Vạn Hương",
  boss: "Ngũ Vị Quyết Chiến",
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
      <label><span>Âm lượng môi trường · {Math.round((prefs.ambienceVolume ?? .18)*100)}%</span>
        <input type="range" min="0" max="1" step=".01" value={prefs.ambienceVolume ?? .18} disabled={!prefs.soundEnabled} onChange={e=>update("ambienceVolume",Number(e.target.value))}/></label>
      <label><span>Đồ họa nhẹ</span><input type="checkbox" checked={prefs.graphicsQuality === "low"} onChange={e=>update("graphicsQuality",e.target.checked?"low":"normal")}/></label>
      <p>Game tự giảm chi tiết trang trí khi tải chậm. Bật Đồ họa nhẹ để ưu tiên sự ổn định; Giảm chuyển động dành cho hiệu ứng tĩnh.</p>
      <SoundtrackRoom />
      <p role="status">
        {!prefs.soundEnabled
          ? "Đang tắt mọi âm thanh."
          : status.phase === "waiting"
            ? "Chạm Phát thử để bật âm thanh."
            : status.phase === "error"
              ? "Chưa tải được nhạc. Phát thử để thử lại."
              : status.phase === "playing" && status.track
                ? `Đang phát · ${trackNames[status.track]}`
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
