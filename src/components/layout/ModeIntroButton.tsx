import { INTRO_NAMES, useModeIntroStore, type IntroMode } from "../../game/modeIntroState"
import { useAppStore } from "../../store/useAppStore"

export function ModeIntroButton({ mode, beforeOpen }: { mode: IntroMode; beforeOpen?: () => void }) {
  const open = useModeIntroStore((state) => state.open)
  const openComic = useModeIntroStore((state) => state.openComic)
  const revealing = useAppStore((state) => state.pendingRevealRewardId)
  return <div className="meal-intro-actions"><button className="meal-mode-intro-button" type="button"
    disabled={mode === "chest" && !!revealing}
    aria-haspopup="dialog" aria-label={`Giới thiệu ${INTRO_NAMES[mode]} · demo tự động 25 giây`}
    title={mode === "chest" && revealing ? "Xem xong món đang mở để xem giới thiệu" : "Xem demo tự động 25 giây"}
    onClick={() => { beforeOpen?.(); open(mode) }}><span aria-hidden="true">▶</span> Giới thiệu · Tự chơi 25 giây</button>
    <button className="meal-mode-intro-button" type="button" aria-haspopup="dialog"
      disabled={mode === "chest" && !!revealing}
      onClick={event => { beforeOpen?.(); openComic(event.currentTarget) }}>Đọc manga giới thiệu · 4 chương</button>
  </div>
}
