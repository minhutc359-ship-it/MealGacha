import { NavLink } from "react-router-dom"
import { FoodImage } from "../food/FoodImage"
import { useAppStore } from "../../store/useAppStore"
import { getVisibleRewards } from "../../domain/rewardPresentation"

export function InventoryPanel() {
  const rewards = useAppStore((state) => state.user.rewards)
  const pendingRevealRewardId = useAppStore((state) => state.pendingRevealRewardId)
  const visibleRewards = getVisibleRewards(rewards, pendingRevealRewardId)
  const recent = [...visibleRewards].reverse().slice(0, 8)

  return (
    <aside
      className="client-panel inventory-panel"
      aria-label="Kho phần thưởng"
    >
      <div className="panel-heading">
        <div>
          <small>KHO VỊ GIÁC</small>
          <h2>Phần thưởng</h2>
        </div>
        <span className="panel-count">{visibleRewards.length}</span>
      </div>

      {recent.length > 0 ? (
        <div className="inventory-grid">
          {recent.map((reward) => (
            <div
              className={`inventory-slot rarity-${reward.rarity ?? "common"}`}
              key={reward.id}
              title={reward.dish.name}
            >
              <FoodImage
                dishId={reward.dishId}
                name={reward.dish.name}
                variant="thumb"
              />
              {reward.status === "consumed" && (
                <span className="slot-consumed">ĐÃ GHÉP</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="inventory-empty">
          <span aria-hidden="true">◇</span>
          <p>Kho đang trống</p>
          <small>Mở rương để nhận món đầu tiên</small>
        </div>
      )}

      <NavLink to="/collection" className="panel-link">
        Xem toàn bộ kho <span>›</span>
      </NavLink>
    </aside>
  )
}
