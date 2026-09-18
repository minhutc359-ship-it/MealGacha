import { useMemo, useState } from "react"
import { FoodImage } from "../components/food/FoodImage"
import { PlacesModal } from "../components/places/PlacesModal"
import { RarityFrame, RARITY_LABELS } from "../components/ui/RarityFrame"
import {
  getBannerDishes,
  getCollectionProgress,
  getUnlockedDishIds,
  getAchievementProgress,
  getThemeProgress,
} from "../domain/achievements"
import {
  Dish,
  MealSlot,
  MEAL_SLOT_ICONS,
  MEAL_SLOT_LABELS,
} from "../domain/models"
import { getDishRarity } from "../domain/drawReward"
import { useAppStore } from "../store/useAppStore"
import { RaritySticker } from "../components/ui/RaritySticker"
import limitedEvents from "../infrastructure/events/limitedEvents.json"
import { LimitedEvent } from "../domain/models"
import { useLanguage } from "../i18n"

const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner"]

export function AchievementsPage() {
  const user = useAppStore((state) => state.user)
  const dishes = useAppStore((state) => state.dishes)
  const [slot, setSlot] = useState<MealSlot | "events">("breakfast")
  const [placeDish, setPlaceDish] = useState<Dish | null>(null)
  const [showExtendedAchievements, setShowExtendedAchievements] = useState(false)

  const unlockedIds = useMemo(
    () => getUnlockedDishIds(user.rewards),
    [user.rewards],
  )
  const globalProgress = useMemo(
    () => getCollectionProgress(user.rewards, dishes),
    [dishes, user.rewards],
  )
  const bannerDishes = useMemo(
    () => slot === "events" ? [] : getBannerDishes(dishes, slot),
    [dishes, slot],
  )
  const bannerProgress = useMemo(
    () => slot === "events" ? { unlocked: 0, total: 0, percentage: 0 } : getCollectionProgress(user.rewards, dishes, slot),
    [dishes, slot, user.rewards],
  )
  const unlimited = Boolean(user.unlimitedChestUnlockedAt)
  const achievementProgress = getAchievementProgress(user, dishes)
  const themeProgress = getThemeProgress(user.rewards, dishes)
  const { t } = useLanguage()

  return (
    <div className="achievements-page">
      <header className={`achievement-hero ${unlimited ? "is-complete" : ""}`}>
        <div className="achievement-hero-copy">
          <small>HÀNH TRÌNH SƯU TẦM</small>
          <h1>Thành tựu Vị Giác</h1>
          <p>
            Mở mỗi món ít nhất một lần. Hoàn thành toàn bộ danh mục để mở
            khóa rương vô hạn vĩnh viễn trên thiết bị này.
          </p>
          <div className="achievement-reward">
            <span aria-hidden="true">◆</span>
            <div>
              <strong>{unlimited ? "RƯƠNG VÔ HẠN ĐÃ MỞ" : "PHẦN THƯỞNG TOÀN BỘ"}</strong>
              <small>{unlimited ? "Không còn tiêu hao chìa khóa" : "Mở rương vô hạn lần"}</small>
            </div>
          </div>
        </div>

        <div
          className="achievement-total-ring"
          style={{ "--progress": `${globalProgress.percentage * 3.6}deg` } as React.CSSProperties}
          aria-label={`Đã mở ${globalProgress.unlocked} trên ${globalProgress.total} món`}
        >
          <div>
            <strong>{globalProgress.percentage}%</strong>
            <small>{globalProgress.unlocked}/{globalProgress.total} MÓN</small>
          </div>
        </div>
      </header>

      <nav className="achievement-tabs" aria-label="Chọn banner thành tựu">
        {SLOTS.map((item) => {
          const progress = getCollectionProgress(user.rewards, dishes, item)
          return (
            <button
              key={item}
              className={slot === item ? "is-active" : ""}
              onClick={() => setSlot(item)}
            >
              <span>{MEAL_SLOT_ICONS[item]}</span>
              <div>
                <strong>{MEAL_SLOT_LABELS[item]}</strong>
                <small>{progress.unlocked}/{progress.total}</small>
              </div>
              {progress.total > 0 && progress.unlocked === progress.total && (
                <b aria-label="Đã hoàn thành">✓</b>
              )}
            </button>
          )
        })}
        <button className={slot === "events" ? "is-active" : ""} onClick={() => setSlot("events")}>
          <span>⏳</span>
          <div><strong>SỰ KIỆN GIỚI HẠN</strong><small>{dishes.filter((dish) => dish.type === "limited").length} món</small></div>
        </button>
      </nav>

      {slot !== "events" && <section className="achievement-section">
        <div className="achievement-section-heading">
          <div>
            <small>BANNER {MEAL_SLOT_LABELS[slot].toUpperCase()}</small>
            <h2>Bộ sưu tập món</h2>
          </div>
          <div className="banner-progress-copy">
            <span><i style={{ width: `${bannerProgress.percentage}%` }} /></span>
            <strong>{bannerProgress.unlocked}/{bannerProgress.total}</strong>
          </div>
        </div>

        <div className="achievement-grid">
          {bannerDishes.map((dish) => {
            const unlocked = unlockedIds.has(dish.id)
            const rarity = getDishRarity(dish)
            return (
              <button
                key={dish.id}
                className={`achievement-card rarity-${rarity} ${unlocked ? "is-unlocked" : "is-locked"}`}
                onClick={() => unlocked && setPlaceDish(dish)}
                aria-label={unlocked ? `${dish.name}, đã mở` : `${dish.name}, chưa mở`}
              >
                <RarityFrame rarity={rarity} className="achievement-art">
                  <FoodImage dishId={dish.id} name={dish.name} imageUrl={dish.imageUrl} variant="card" />
                  <RaritySticker priceTier={dish.priceTier} rarity={rarity} />
                  {!unlocked && (
                    <div className="achievement-lock" aria-hidden="true">
                      <span>⌾</span>
                      <b>CHƯA MỞ</b>
                    </div>
                  )}
                </RarityFrame>
                <div className="achievement-card-info">
                  <div>
                    <strong>{dish.name}</strong>
                    <small>{"₫".repeat(dish.priceTier ?? 1)} · {RARITY_LABELS[rarity]}</small>
                  </div>
                  <span>{unlocked ? "✓" : "🔒"}</span>
                </div>
              </button>
            )
          })}
        </div>
      </section>}
      {slot === "events" && (
        <section className="achievement-section limited-achievement-section">
          <div className="achievement-section-heading"><div><small>SỰ KIỆN GIỚI HẠN</small><h2>Bộ sưu tập theo event</h2></div></div>
          {(limitedEvents as LimitedEvent[]).map((event) => {
            const eventDishes = dishes.filter((dish) => dish.type === "limited" && dish.limitedEventId === event.id)
            if (eventDishes.length === 0) return null
            const unlocked = new Set(user.rewards.map((reward) => reward.dishId))
            return <div className="limited-achievement-group" key={event.id}>
              <div className="limited-achievement-heading"><strong>{event.title}</strong><span>{eventDishes.filter((dish) => unlocked.has(dish.id)).length}/{eventDishes.length}</span></div>
              <div className="achievement-grid">{eventDishes.map((dish) => {
                const rarity = getDishRarity(dish)
                const isUnlocked = unlocked.has(dish.id)
                return <button key={dish.id} className={`achievement-card rarity-${rarity} ${isUnlocked ? "is-unlocked" : "is-locked"}`} onClick={() => isUnlocked && setPlaceDish(dish)}>
                  <RarityFrame rarity={rarity} className="achievement-art"><FoodImage dishId={dish.id} name={dish.name} imageUrl={dish.imageUrl} variant="card" /><RaritySticker priceTier={dish.priceTier} rarity={rarity} />{!isUnlocked && <div className="achievement-lock"><span>⌾</span><b>CHƯA MỞ</b></div>}</RarityFrame>
                  <div className="achievement-card-info"><div><strong>{dish.name}</strong><small>{RARITY_LABELS[rarity]}</small></div><span>{isUnlocked ? "✓" : "🔒"}</span></div>
                </button>
              })}</div>
            </div>
          })}
        </section>
      )}
      <section className="achievement-section mt-6">
        <button
          type="button"
          className="achievement-collapse-toggle"
          aria-expanded={showExtendedAchievements}
          onClick={() => setShowExtendedAchievements((open) => !open)}
        >
          <span>
            <small>{t("extendedAchievements")}</small>
            <strong>{t("achievementProfile")}</strong>
          </span>
          <b aria-hidden="true">{showExtendedAchievements ? "⌃" : "⌄"}</b>
        </button>
        {showExtendedAchievements && (
          <div className="achievement-collapse-content">
            <div className="grid grid-cols-2 gap-2 mb-5">
              <AchievementStat label="Món đã mở" value={achievementProgress.opened} icon="🍜" />
              <AchievementStat label="Lần ghép" value={achievementProgress.fused} icon="✨" />
              <AchievementStat label="Streak tốt nhất" value={achievementProgress.streak} icon="🔥" />
              <AchievementStat label="Quest đã giải" value={achievementProgress.quests} icon="🧩" />
            </div>
            <div className="theme-progress-list">
              {themeProgress.map((theme) => (
                <div key={theme.id} className="theme-progress-row">
                  <span>{theme.label}</span>
                  <i><b style={{ width: `${theme.percentage}%` }} /></i>
                  <strong>{theme.unlocked}/{theme.total}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {placeDish && (
        <PlacesModal dish={placeDish} onClose={() => setPlaceDish(null)} />
      )}
    </div>
  )
}
function AchievementStat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="achievement-stat">
      <span>{icon}</span>
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  )
}
