import { canCheckIn } from "../../domain/checkIn"
import { MEAL_SLOT_ICONS } from "../../domain/models"
import { getDateKey } from "../../domain/dateKey"
import { useAppStore } from "../../store/useAppStore"
import { getVisibleRewards } from "../../domain/rewardPresentation"
import { DailyQuest } from "./DailyQuest"
import { canClaimFreeChest } from "../../domain/drawReward"
import { useNavigate } from "react-router-dom"
import { getWeeklyEventProgress } from "../../domain/weeklyEvent"
import limitedEvents from "../../infrastructure/events/limitedEvents.json"
import { formatRemainingTime, getActiveLimitedEvents } from "../../domain/limitedEvents"
import { useEffect, useState } from "react"
import { useLanguage } from "../../i18n"

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
  const freeChestReady = canClaimFreeChest(user)
  const openFreeChest = useAppStore((state) => state.openFreeChest)
  const navigate = useNavigate()
  const dishes = useAppStore((state) => state.dishes)
  const weeklyEvent = getWeeklyEventProgress(user.rewards, dishes)
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  const limitedEvent = getActiveLimitedEvents(limitedEvents, now)[0]
  const { t } = useLanguage()

  return (
    <aside className="client-panel activity-rail" aria-label="Hoạt động">
      <div className="panel-heading">
        <div>
          <small>HÀNH TRÌNH</small>
          <h2>{t("today")}</h2>
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
          <strong>{canClaim ? t("checkIn") : t("checkedIn")}</strong>
          <small>{canClaim ? `+10 ${t("keys")}` : t("comeBackTomorrow")}</small>
        </span>
        <b>{canClaim ? "+10" : "✓"}</b>
      </button>

      <DailyQuest />

      <div className="weekly-event">
        <small>{t("weeklyEvent")}</small>
        <strong>{weeklyEvent.event.label}</strong>
        <span>{weeklyEvent.opened}/{weeklyEvent.total} món · {weeklyEvent.percentage}%</span>
        <i><b style={{ width: `${weeklyEvent.percentage}%` }} /></i>
      </div>
      {limitedEvent && (
        <div className="limited-event-countdown">
          <small>EVENT GIỚI HẠN · {limitedEvent.title}</small>
          <strong>Còn {formatRemainingTime(limitedEvent.endsAt, now)}</strong>
        </div>
      )}

      <button
        className={`daily-mission ${freeChestReady ? "is-ready" : "is-done"}`}
        onClick={() => {
          if (freeChestReady) {
            openFreeChest("dinner")
            navigate("/")
          }
        }}
        disabled={!freeChestReady}
      >
        <span className="mission-icon">🎁</span>
        <span>
          <strong>{freeChestReady ? "Rương miễn phí" : "Đã dùng rương miễn phí"}</strong>
          <small>{freeChestReady ? "Không tốn chìa khóa" : "Quay lại ngày mai"}</small>
        </span>
        <b>{freeChestReady ? "MỞ" : "✓"}</b>
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
          <strong>{user.checkInStreak}</strong>
          <small>{t("streak")}</small>
        </div>
      </div>

      <div className="activity-economy">
        <span>♢ {user.shards} mảnh</span>
        <span>◇ Pity {Math.min(user.pityCount, 10)}/10</span>
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
