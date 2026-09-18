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
import { getDishRarity, getPriceTierFromWeight, getRarityFromWeight } from "../domain/drawReward"
import { useAppStore } from "../store/useAppStore"
import { RaritySticker } from "../components/ui/RaritySticker"
import limitedEvents from "../infrastructure/events/limitedEvents.json"
import { LimitedEvent } from "../domain/models"
import { useLanguage } from "../i18n"
import { convertImageToWebp } from "../infrastructure/assets/imageProcessing"

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
          <small>{t("collectionJourney")}</small>
          <h1>{t("achievementTitle")}</h1>
          <p>{t("achievementDescription")}</p>
          <div className="achievement-reward">
            <span aria-hidden="true">◆</span>
            <div>
              <strong>{unlimited ? t("unlimitedUnlocked") : t("wholeReward")}</strong>
              <small>{unlimited ? t("noKeyCost") : t("openUnlimited")}</small>
            </div>
          </div>
        </div>

        <div
          className="achievement-total-ring"
          style={{ "--progress": `${globalProgress.percentage * 3.6}deg` } as React.CSSProperties}
          aria-label={`${globalProgress.unlocked}/${globalProgress.total} ${t("dishCount")}`}
        >
          <div>
            <strong>{globalProgress.percentage}%</strong>
            <small>{globalProgress.unlocked}/{globalProgress.total} {t("dishCount")}</small>
          </div>
        </div>
      </header>

      <nav className="achievement-tabs" aria-label={t("chooseBanner")}>
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
                <b aria-label={t("completed")}>✓</b>
              )}
            </button>
          )
        })}
        <button className={slot === "events" ? "is-active" : ""} onClick={() => setSlot("events")}>
          <span>⏳</span>
          <div><strong>{t("limitedEvent")}</strong><small>{dishes.filter((dish) => dish.type === "limited").length} {t("dishCount")}</small></div>
        </button>
      </nav>

      {slot !== "events" && <section className="achievement-section">
        <div className="achievement-section-heading">
          <div>
            <small>BANNER {MEAL_SLOT_LABELS[slot].toUpperCase()}</small>
            <h2>{t("collectionSet")}</h2>
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
              <AchievementDishCard
                key={dish.id}
                dish={dish}
                unlocked={unlocked}
                onOpen={() => unlocked && setPlaceDish(dish)}
              />
            )
          })}
        </div>
      </section>}
      {slot === "events" && (
        <section className="achievement-section limited-achievement-section">
          <div className="achievement-section-heading"><div><small>{t("limitedEvent")}</small><h2>{t("limitedCollection")}</h2></div></div>
          {(limitedEvents as LimitedEvent[]).map((event) => {
            const eventDishes = dishes.filter((dish) => dish.type === "limited" && dish.limitedEventId === event.id)
            if (eventDishes.length === 0) return null
            const unlocked = new Set(user.rewards.map((reward) => reward.dishId))
            return <div className="limited-achievement-group" key={event.id}>
              <div className="limited-achievement-heading"><strong>{event.title}</strong><span>{eventDishes.filter((dish) => unlocked.has(dish.id)).length}/{eventDishes.length}</span></div>
              <div className="achievement-grid">{eventDishes.map((dish) => {
                const rarity = getDishRarity(dish)
                const isUnlocked = unlocked.has(dish.id)
                return <AchievementDishCard key={dish.id} dish={dish} unlocked={isUnlocked} onOpen={() => isUnlocked && setPlaceDish(dish)} />
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
              <AchievementStat label={t("openedDishes")} value={achievementProgress.opened} icon="🍜" />
              <AchievementStat label="Lần ghép" value={achievementProgress.fused} icon="✨" />
              <AchievementStat label={t("bestStreak")} value={achievementProgress.streak} icon="🔥" />
              <AchievementStat label={t("questsSolved")} value={achievementProgress.quests} icon="🧩" />
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

function AchievementDishCard({
  dish,
  unlocked,
  onOpen,
}: {
  dish: Dish
  unlocked: boolean
  onOpen(): void
}) {
  const updateDish = useAppStore((state) => state.updateDish)
  const deleteDish = useAppStore((state) => state.deleteDish)
  const { t } = useLanguage()
  const [editing, setEditing] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [label, setLabel] = useState(dish.name)
  const [weight, setWeight] = useState(dish.weight)
  const [rarity, setRarity] = useState(dish.rarity ?? getRarityFromWeight(dish.weight))
  const [priceTier, setPriceTier] = useState<1 | 2 | 3 | 4>(dish.priceTier ?? getPriceTierFromWeight(dish.weight))
  const effectiveRarity = getDishRarity({ ...dish, name: label, rarity })

  const save = async () => {
    const result = await updateDish(dish.id, { name: label, rarity, weight, priceTier })
    if (result.success) setEditing(false)
  }

  const handleWeightChange = (nextWeight: number) => {
    const normalizedWeight = Math.min(1000, Math.max(1, nextWeight || 1))
    setWeight(normalizedWeight)
    setRarity(getRarityFromWeight(normalizedWeight))
    setPriceTier(getPriceTierFromWeight(normalizedWeight))
  }

  const handleRarityChange = (nextRarity: NonNullable<Dish["rarity"]>) => {
    const suggestedWeight = nextRarity === "diamond" ? 8 : nextRarity === "epic" ? 25 : nextRarity === "rare" ? 50 : 100
    setRarity(nextRarity)
    setWeight(suggestedWeight)
    setPriceTier(getPriceTierFromWeight(suggestedWeight))
  }

  const replaceImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) return
    setImageUploading(true)
    try {
      const imageData = await convertImageToWebp(file)
      await updateDish(dish.id, { name: label, rarity, imageData })
    } finally {
      setImageUploading(false)
    }
  }

  const removeDish = async () => {
    if (!window.confirm(t("confirmDelete"))) return
    await deleteDish(dish.id)
  }

  return (
    <div className={`achievement-card-shell rarity-${effectiveRarity}`}>
      <button
        className={`achievement-card ${unlocked ? "is-unlocked" : "is-locked"}`}
        onClick={onOpen}
        aria-label={unlocked ? `${label}, đã mở` : `${label}, chưa mở`}
      >
        <RarityFrame rarity={effectiveRarity} className="achievement-art">
          <FoodImage dishId={dish.id} name={label} imageUrl={dish.imageUrl} variant="card" />
          <RaritySticker priceTier={priceTier} rarity={effectiveRarity} />
          {!unlocked && <div className="achievement-lock" aria-hidden="true"><span>⌾</span><b>{t("notUnlocked")}</b></div>}
        </RarityFrame>
        <div className="achievement-card-info">
          <div><strong>{label}</strong><small>{"₫".repeat(priceTier)} · {RARITY_LABELS[effectiveRarity]}</small></div>
          <span>{unlocked ? "✓" : "🔒"}</span>
        </div>
      </button>
      {import.meta.env.DEV && (
        <div className="achievement-dev-editor" onClick={(event) => event.stopPropagation()}>
          {!editing ? <button type="button" onClick={() => setEditing(true)}>{t("editLabel")}</button> : (
            <>
              <input aria-label={t("label")} value={label} onChange={(event) => setLabel(event.target.value)} />
              <input aria-label="Weight" type="number" min={1} max={1000} value={weight} onChange={(event) => handleWeightChange(Number(event.target.value))} />
              <select aria-label={t("rarity")} value={rarity} onChange={(event) => handleRarityChange(event.target.value as NonNullable<Dish["rarity"]>)}>
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="diamond">Diamond</option>
              </select>
              <output className="achievement-dev-price">Price {priceTier}/4</output>
              <button type="button" onClick={save}>{t("saveChanges")}</button>
              <button type="button" onClick={() => { setLabel(dish.name); setWeight(dish.weight); setRarity(dish.rarity ?? getRarityFromWeight(dish.weight)); setPriceTier(dish.priceTier ?? getPriceTierFromWeight(dish.weight)); setEditing(false) }}>{t("undo")}</button>
            </>
          )}
          <label className="achievement-dev-image-button">
            {imageUploading ? t("uploadingImage") : `▣ ${t("replaceImage")}`}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={replaceImage} disabled={imageUploading} />
          </label>
          <button type="button" className="achievement-dev-delete" onClick={removeDish}>{t("deleteDish")}</button>
        </div>
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
