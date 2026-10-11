import { useState } from "react"
import { WEB_SCORES } from "../../game/webSoundtrack"
import type { MusicTrack } from "../../game/audioScore"
import { useGameMusic } from "./GameAudio"
import { useAppStore } from "../../store/useAppStore"
import { gameAudio } from "../../infrastructure/audio/gameAudio"

export function SoundtrackRoom() {
  const [playing, setPlaying] = useState<MusicTrack | null>(null)
  const enabled = useAppStore(s => s.user.preferences.soundEnabled && (s.user.preferences.musicEnabled ?? true))
  useGameMusic(playing, 50)
  return <details className="soundtrack-room" onToggle={e => { if (!e.currentTarget.open) setPlaying(null) }}>
    <summary>Phòng nghe · 9 chủ đề, hai phong cách</summary>
    <p>Nhạc được sáng tác cho Soul of Meal. Chọn Bếp Việt hoặc 8-bit ở trên; bài chỉ tải khi được phát. Đóng phòng nghe để trở lại nhạc của cảnh.</p>
    <div>{Object.entries(WEB_SCORES).map(([track, score]) => <button key={track} type="button" disabled={!enabled} aria-pressed={playing === track} onClick={() => { void gameAudio.unlock(); setPlaying(playing === track ? null : track as MusicTrack) }}>
      <span>{playing === track ? "■" : "♫"}</span><span><strong>{score.title}</strong><small>{score.mood}</small></span>
    </button>)}</div>
    {!enabled && <p>Bật âm thanh và nhạc nền để nghe.</p>}
  </details>
}
