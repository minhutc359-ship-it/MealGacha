import { canCheckIn } from "../../domain/checkIn"
import { MEAL_SLOT_ICONS } from "../../domain/models"
import { getDateKey } from "../../domain/dateKey"
import { useAppStore } from "../../store/useAppStore"
import { getVisibleRewards } from "../../domain/rewardPresentation"

export function ActivityRail() {
  const user = useAppStore((state) => state.user)
  const pendingRevealRewardId = useAppStore((state) => state.pendingRevealRewardId)
  const checkIn = useAppStore((state) => state.checkIn)
  const visibleRewards = getVisibleRewards(user.rewards, pendingRevealRewardId)
  const available = visibleRewards.filter(
    (reward) => reward.status === "available",
  ).length
  const today = getDateKey()
  const todayRewards = visibleRewards.filter(
    (reward) => reward.acquiredDate === today,
  )
  const canClaim = canCheckIn(user)

  return (
    <aside className="client-panel activity-rail" aria-label="Hoạt động">
      <div className="panel-heading">
        <div>
          <small>HÀNH TRÌNH</small>
          <h2>Hôm nay</h2>
        </div>
        <span className={`status-dot ${canClaim ? "is-ready" : ""}`} />
      </div>

      <button
        className={`daily-mission ${canClaim ? "is-ready" : "is-done"}`}
        onClick={() => canClaim && checkIn()}
        disabled={!canClaim}
      >
        <span className="mission-icon">◇</span>
        <span>
          <strong>{canClaim ? "Điểm danh nhận chìa" : "Đã điểm danh"}</strong>
          <small>{canClaim ? "+10 chìa khóa" : "Quay lại vào ngày mai"}</small>
        </span>
        <b>{canClaim ? "+10" : "✓"}</b>
      </button>

      <div className="activity-stats">
        <div>
          <strong>{todayRewards.length}</strong>
          <small>Món hôm nay</small>
        </div>
        <div>
          <strong>{available}</strong>
          <small>Còn sử dụng</small>
        </div>
        <div>
          <strong>{user.fusions.length}</strong>
          <small>Lần ghép</small>
        </div>
      </div>

      <div className="recent-activity">
        <h3>NHẬT KÝ GẦN ĐÂY</h3>
        {todayRewards
          .slice(-4)
          .reverse()
          .map((reward) => (
            <div key={reward.id}>
              <span>{MEAL_SLOT_ICONS[reward.mealSlot]}</span>
              <p>
                <strong>{reward.dish.name}</strong>
                <small>
                  {reward.source === "fusion" ? "Ghép món" : "Mở rương"}
                </small>
              </p>
            </div>
          ))}
        {todayRewards.length === 0 && (
          <p className="activity-empty">Chưa có hoạt động hôm nay.</p>
        )}
      </div>
    </aside>
  )
}
