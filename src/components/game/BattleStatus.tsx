import type { BattlePresentationPhase } from "../../game/adventureV560"

export function BattleStatus({
  phase,
  wave,
}: {
  phase: BattlePresentationPhase
  wave: number
}) {
  if (phase === "fight") return null
  const [title, subtitle] = {
    enter: ["XUẤT TRẬN", "GIAO ƯỚC LINH VỊ"],
    ready: ["SẴN SÀNG", "READY"],
    start: ["BẮT ĐẦU", "START"],
    "wave-clear": [`ĐỢT ${wave} HOÀN TẤT`, "GIỮ VỮNG NHỊP ĐẤU"],
    "wave-enter": [`ĐỢT ${wave + 1}`, "NEXT WAVE"],
    win: ["CHIẾN THẮNG", "HƯƠNG VỊ ĐƯỢC GIỮ LẠI"],
    fail: ["THẤT BẠI", "MỘT CƠ HỘI ĐỂ TRỞ LẠI"],
  }[phase]
  return (
    <div
      key={phase}
      className={`rpg-battle-opening battle-status phase-${phase}`}
      role="status"
      aria-live="polite"
      aria-label={`${subtitle} · ${title}`}
    >
      <div className="battle-status-type">
        <small>{subtitle}</small>
        <span aria-hidden="true" className="battle-status-rule">
          ✦
        </span>
        <strong>{title}</strong>
        <span aria-hidden="true" className="battle-status-rule" />
      </div>
    </div>
  )
}
