import { INTRO_NAMES, useModeIntroStore, type IntroMode } from "../../game/modeIntroState"
import { useAppStore } from "../../store/useAppStore"

export function ModeIntroButton({ mode }: { mode: IntroMode }) {
  const open = useModeIntroStore((state) => state.open)
  const revealing = useAppStore((state) => state.pendingRevealRewardId)
  return <button className="meal-mode-intro-button" type="button"
    disabled={mode === "chest" && !!revealing}
    aria-haspopup="dialog" aria-label={`Giới thiệu ${INTRO_NAMES[mode]} · demo tự động 25 giây`}
    title={mode === "chest" && revealing ? "Xem xong món đang mở để xem giới thiệu" : "Xem demo tự động 25 giây"}
    onClick={() => open(mode)}><span aria-hidden="true">▶</span> Giới thiệu</button>
}
