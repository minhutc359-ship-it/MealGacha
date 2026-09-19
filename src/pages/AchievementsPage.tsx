import { useMemo, useState } from "react"
import { FoodImage } from "../components/food/FoodImage"
import { PlacesModal } from "../components/places/PlacesModal"
import { RarityFrame, RARITY_LABELS } from "../components/ui/RarityFrame"
import {
  getBannerDishes,
  getCollectionProgress,
  getUnlockedDishIds,
} from "../domain/achievements"
import {
  Dish,
  MealSlot,
  MEAL_SLOT_ICONS,
  MEAL_SLOT_LABELS,
} from "../domain/models"
import { getDishRarity } from "../domain/drawReward"
import { useAppStore } from "../store/useAppStore"
import { TITLES, TitleDefinition, titleProgress } from "../domain/titles"

const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner"]

export function AchievementsPage() {
  const [tab, setTab] = useState<"titles" | "collection">("titles")
  const [selectedTitle, setSelectedTitle] = useState<TitleDefinition | null>(null)
  const user = useAppStore((state) => state.user)
  const dishes = useAppStore((state) => state.dishes)
  const equip = useAppStore((state) => state.equipTitle)
  return <div className="achievements-shell">
    <nav className="achievement-main-tabs"><button className={tab === "titles" ? "is-active" : ""} onClick={() => setTab("titles")}>Danh hiệu</button><button className={tab === "collection" ? "is-active" : ""} onClick={() => setTab("collection")}>Hồ sơ chiến tích</button></nav>
    {tab === "titles" ? <section className="titles-page"><header><small>CHINH PHỤC VỊ GIÁC</small><h1>Danh hiệu</h1><p>Hoàn thành nhiệm vụ để trang trí Hồ sơ vị giác của bạn.</p></header><div className="title-grid">{TITLES.map((title) => { const progress = titleProgress(title, user, dishes); const unlocked = user.unlockedTitleIds.includes(title.id); return <button key={title.id} className={`title-card ${unlocked ? "is-unlocked" : "is-locked"}`} onClick={() => setSelectedTitle(title)}><span>{title.icon}</span><strong>{title.name}</strong><small>{unlocked ? "ĐÃ MỞ" : `${progress.percentage}% hoàn thành`}</small><i><b style={{ width: `${progress.percentage}%` }} /></i></button> })}</div></section> : <BattleRecord />}
    {selectedTitle && <div className="title-modal-backdrop" role="dialog" aria-modal="true" aria-label={selectedTitle.name} onClick={(event) => { if (event.target === event.currentTarget) setSelectedTitle(null) }}><div className="title-modal"><button className="title-modal-close" onClick={() => setSelectedTitle(null)}>×</button><span>{selectedTitle.icon}</span><h2>{selectedTitle.name}</h2><p>{selectedTitle.description}</p><h3>NHIỆM VỤ</h3>{titleProgress(selectedTitle, user, dishes).tasks.map((task, index) => <div className="title-task" key={index}><span>{task.complete ? "✓" : "○"}</span><strong>{task.label}</strong><small>{task.current}/{task.target}</small></div>)}<p>Phần thưởng: phông nền {selectedTitle.reward.background} · hiệu ứng {selectedTitle.reward.effect}</p>{user.unlockedTitleIds.includes(selectedTitle.id) && <button className="title-equip" onClick={() => { equip(selectedTitle.id); setSelectedTitle(null) }}>{user.equippedTitleId === selectedTitle.id ? "Đang trang bị" : "Trang bị danh hiệu"}</button>}</div></div>}
  </div>
}

function BattleRecord() {
  const user = useAppStore((state) => state.user)
  const dishes = useAppStore((state) => state.dishes)
  const [slot, setSlot] = useState<MealSlot>("breakfast")
  const [placeDish, setPlaceDish] = useState<Dish | null>(null)

  const unlockedIds = useMemo(
    () => getUnlockedDishIds(user.rewards),
    [user.rewards],
  )
  const globalProgress = useMemo(
    () => getCollectionProgress(user.rewards, dishes),
    [dishes, user.rewards],
  )
  const bannerDishes = useMemo(
    () => getBannerDishes(dishes, slot),
    [dishes, slot],
  )
  const bannerProgress = useMemo(
    () => getCollectionProgress(user.rewards, dishes, slot),
    [dishes, slot, user.rewards],
  )
  const unlimited = Boolean(user.unlimitedChestUnlockedAt)

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
      </nav>

      <section className="achievement-section">
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
                  <FoodImage dishId={dish.id} name={dish.name} variant="card" />
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
      </section>

      {placeDish && (
        <PlacesModal dish={placeDish} onClose={() => setPlaceDish(null)} />
      )}
    </div>
  )
}
