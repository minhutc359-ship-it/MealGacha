import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import gsap from "gsap"
import { useAppStore } from "../store/useAppStore"
import { useModeIntroStore } from "../game/modeIntroState"
import { ModeIntroButton } from "../components/layout/ModeIntroButton"
import {
  MealSlot,
  RewardInstance,
  RewardRarity,
  MEAL_SLOT_LABELS,
  MEAL_SLOT_ICONS,
} from "../domain/models"
import { canCheckIn } from "../domain/checkIn"
import { getCurrentHour, getDateKey } from "../domain/dateKey"
import { RevealModal } from "../components/chest/RevealModal"
import { ChestScene } from "../components/chest/ChestScene"
import { ChestOddsModal } from "../components/chest/ChestOddsModal"
import { cacheFoodAsset, preloadFoodAsset } from "../infrastructure/assets/foodAssets"
import {
  playSound,
  preloadChestOpeningTrack,
  startChestOpeningTrack,
  stopChestOpeningTrack,
  preloadRewardReceivedTrack,
  startSpinResultTrack,
} from "../infrastructure/audio/soundEngine"
import { getVisibleRewards } from "../domain/rewardPresentation"
import { hasUnlimitedChestAccess } from "../domain/achievements"
import { getDailyQuestions } from "../domain/dailyQuiz"
import { getFeaturedEvents } from "../domain/events"
import { buildPool } from "../domain/drawReward"
import { useGameAudio, useGameMusic } from "../components/game/GameAudio"

type ChestState =
  | "idle"
  | "key-flight"
  | "inserting"
  | "locking"
  | "charging"
  | "pulse"
  | "anticipation"
  | "impact"
  | "opening"
  | "reward-rise"
  | "result"

const STATE_LABELS: Record<ChestState, string> = {
  idle: "Sẵn sàng khai mở",
  "key-flight": "Chìa khóa đang cộng hưởng",
  inserting: "Kích hoạt lõi vị giác",
  locking: "Khóa cổ ngữ đã khớp",
  charging: "Tích tụ năng lượng",
  pulse: "Cộng hưởng cực đại",
  anticipation: "Lắng nghe khoảnh khắc thức tỉnh",
  impact: "Khai mở!",
  opening: "Rương đã mở",
  "reward-rise": "Triệu hồi món ăn",
  result: "Đã nhận phần thưởng",
}

const RITUAL_STEPS: ChestState[] = [
  "key-flight",
  "inserting",
  "locking",
  "charging",
  "pulse",
  "anticipation",
  "impact",
  "opening",
  "reward-rise",
]

function vibrate(pattern: number | number[], reducedMotion: boolean) {
  if (!reducedMotion && "vibrate" in navigator) navigator.vibrate(pattern)
}

function defaultSlot(): MealSlot {
  const hour = getCurrentHour()
  if (hour >= 5 && hour < 11) return "breakfast"
  if (hour >= 11 && hour < 16) return "lunch"
  return "dinner"
}

const SLOT_THEME: Record<MealSlot, {
  accent: string
  glow: string
  title: string
  subtitle: string
}> = {
  breakfast: {
    accent: "#e8c777",
    glow: "rgba(232,199,119,.42)",
    title: "BÌNH MINH",
    subtitle: "Món ngon khởi đầu ngày mới",
  },
  lunch: {
    accent: "#19c7e8",
    glow: "rgba(25,199,232,.42)",
    title: "THIÊN QUANG",
    subtitle: "Nạp năng lượng giữa ngày",
  },
  dinner: {
    accent: "#a78bfa",
    glow: "rgba(167,139,250,.42)",
    title: "DẠ YẾN",
    subtitle: "Khép ngày bằng một lựa chọn xứng đáng",
  },
}

export function ChestPage() {
  useGameAudio()
  useGameMusic("mode-chest", 1)
  const user = useAppStore((state) => state.user)
  const dishes = useAppStore((state) => state.dishes)
  const checkIn = useAppStore((state) => state.checkIn)
  const openChest = useAppStore((state) => state.openChest)
  const showToast = useAppStore((state) => state.showToast)
  const pendingRevealRewardId = useAppStore((state) => state.pendingRevealRewardId)
  const completeRewardReveal = useAppStore((state) => state.completeRewardReveal)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [slot, setSlot] = useState<MealSlot>(defaultSlot)
  const [chestState, setChestState] = useState<ChestState>("idle")
  const [reward, setReward] = useState<RewardInstance | null>(null)
  const [showReveal, setShowReveal] = useState(false)
  const [showOdds, setShowOdds] = useState(false)
  const [skipAnimation, setSkipAnimation] = useState(false)
  const [showSpiritCard, setShowSpiritCard] = useState(false)
  const [ritualRarity, setRitualRarity] = useState<RewardRarity | null>(null)
  const processingRef = useRef(false)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const pendingRewardRef = useRef<RewardInstance | null>(null)
  const customTrackRef = useRef(false)

  const theme = SLOT_THEME[slot]
  const today = getDateKey()
  const visibleRewards = getVisibleRewards(user.rewards, pendingRevealRewardId)
  const todayCount = visibleRewards.filter(
    (item) => item.acquiredDate === today,
  ).length
  const checkedIn = !canCheckIn(user)
  const isAnimating = !["idle", "result"].includes(chestState)
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  }, [])
  const reduceMotion = user.preferences.reducedMotion || prefersReducedMotion
  const unlimited = hasUnlimitedChestAccess(user, dishes)
  const requestedEventId = params.get("event")
  const event = getFeaturedEvents(dishes).find((item) => item.id === requestedEventId && item.active)
  const availableCount = buildPool(dishes, slot, user.recentDishIdsByMeal[slot], event?.id).length
  const normalCount = dishes.filter(dish => dish.active && dish.type !== "limited").length
  const limitedCount = dishes.filter(dish => dish.active && dish.type === "limited").length
  useEffect(() => {
    if (event && !event.dishIds.some((id) => dishes.find((dish) => dish.id === id)?.mealSlots.includes(slot))) {
      const first = dishes.find((dish) => event.dishIds.includes(dish.id))
      if (first) setSlot(first.mealSlots[0])
    }
  }, [event?.id, dishes, slot])
  const quizRemaining = getDailyQuestions(dishes).filter((item) => user.dailyQuiz?.date !== today || !user.dailyQuiz.answers[item.id]).length

  const finishReveal = useCallback(() => {
    const nextReward = pendingRewardRef.current
    if (!nextReward) return
    setChestState("result")
    setReward(nextReward)
    setShowReveal(true)
    completeRewardReveal()
    processingRef.current = false
    stopChestOpeningTrack()
    startSpinResultTrack(user.preferences.soundEnabled)
    playSound(
      "reveal",
      user.preferences.soundEnabled,
      customTrackRef.current ? 0.18 : 1,
    )
    vibrate(
      nextReward.rarity === "diamond"
        ? [35, 35, 70, 35, 110]
        : nextReward.rarity === "epic"
          ? [30, 45, 80]
          : 35,
      reduceMotion,
    )
  }, [completeRewardReveal, reduceMotion, user.preferences.soundEnabled])

  const runTimeline = useCallback(() => {
    timelineRef.current?.kill()
    const timeline = gsap.timeline({ onComplete: finishReveal })
    timelineRef.current = timeline
    const cue = (sound: Parameters<typeof playSound>[0]) => {
      playSound(
        sound,
        user.preferences.soundEnabled,
        customTrackRef.current ? 0.18 : 1,
      )
    }

    timeline
      .call(() => {
        setChestState("key-flight")
        cue("key")
        vibrate(12, reduceMotion)
      })
      .to({}, { duration: 0.56 })
      .call(() => setChestState("inserting"))
      .to({}, { duration: 0.22 })
      .call(() => {
        setChestState("locking")
        cue("lock")
        vibrate(18, reduceMotion)
      })
      .to({}, { duration: 0.36 })
      .call(() => {
        setChestState("charging")
        cue("charge")
      })
      .to({}, { duration: 0.61 })
      .call(() => {
        setChestState("pulse")
        cue("pulse")
        vibrate([12, 40, 20], reduceMotion)
      })
      .to({}, { duration: 0.38 })
      .call(() => setChestState("anticipation"))
      .to({}, { duration: 0.58 })
      .call(() => {
        setChestState("impact")
        cue("impact")
        vibrate([18, 25, 55], reduceMotion)
      })
      .to({}, { duration: 0.16 })
      .call(() => setChestState("opening"))
      .to({}, { duration: 0.54 })
      .call(() => setChestState("reward-rise"))
      .to({}, { duration: 0.73 })
  }, [finishReveal, reduceMotion, user.preferences.soundEnabled])

  const triggerOpen = useCallback(() => {
    if (processingRef.current) return
    processingRef.current = true
    const result = openChest(slot, event?.id)
    if (!result.reward) {
      showToast(result.error ?? "Không thể mở rương.", "error")
      processingRef.current = false
      return
    }

    pendingRewardRef.current = result.reward
    setRitualRarity(result.reward.rarity ?? "common")
    preloadFoodAsset(result.reward.dishId, "full")
    if (result.reward.dish.imageUrl) cacheFoodAsset(result.reward.dish.imageUrl)
    if (skipAnimation || reduceMotion) {
      customTrackRef.current = false
      setChestState("reward-rise")
      window.setTimeout(finishReveal, reduceMotion ? 120 : 40)
      return
    }
    customTrackRef.current = startChestOpeningTrack(
      user.preferences.soundEnabled,
    )
    runTimeline()
  }, [
    finishReveal,
    openChest,
    reduceMotion,
    runTimeline,
    showToast,
    skipAnimation,
    slot,
    event?.id,
    user.preferences.soundEnabled,
  ])

  const skipCurrentAnimation = () => {
    timelineRef.current?.kill()
    stopChestOpeningTrack()
    customTrackRef.current = false
    finishReveal()
  }

  const closeReveal = () => {
    timelineRef.current?.kill()
    stopChestOpeningTrack()
    completeRewardReveal()
    setShowReveal(false)
    setReward(null)
    pendingRewardRef.current = null
    setChestState("idle")
    setRitualRarity(null)
    customTrackRef.current = false
    processingRef.current = false
  }

  const openAgain = () => {
    closeReveal()
    window.setTimeout(triggerOpen, 140)
  }

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (useModeIntroStore.getState().mode) return
      const target = event.target as HTMLElement | null
      if (target?.matches("input, textarea, select, button, a")) return
      if (event.code === "Space" && !isAnimating && !showReveal && !showOdds) {
        event.preventDefault()
        triggerOpen()
      }
      if (event.key.toLowerCase() === "s" && isAnimating) skipCurrentAnimation()
    }
    window.addEventListener("keydown", handleShortcut)
    return () => window.removeEventListener("keydown", handleShortcut)
  }, [isAnimating, showOdds, showReveal, triggerOpen])

  useEffect(() => {
    preloadChestOpeningTrack()
    preloadRewardReceivedTrack()
  }, [])

  useEffect(() => {
    return () => {
      timelineRef.current?.kill()
      stopChestOpeningTrack()
      completeRewardReveal()
    }
  }, [completeRewardReveal])

  return (
    <div
      className={`loot-stage-page ritual-${chestState} ${ritualRarity ? `ritual-rarity-${ritualRarity}` : ""}`}
      style={
        {
          "--slot-accent": theme.accent,
          "--slot-glow": theme.glow,
        } as React.CSSProperties
      }
    >
      <div className="stage-mobile-header">
        <div>
          <h1>RƯƠNG VỊ GIÁC</h1>
          <p>Mở rương, chốt món.</p>
        </div>
        <div className="mobile-wallet">
          <span>◇</span>
          <strong>{unlimited ? "∞" : user.keys}</strong>
        </div>
      </div>

      {event && <div className={`chest-event-banner ${event.themeClass}`}><span>{event.icon}</span><div><strong>{event.title}</strong><small>{event.dishIds.length} món trong banner sự kiện</small></div><Link to="/chest">Đóng ×</Link></div>}
      {!event && <Link className="chest-event-link" to="/events">{requestedEventId ? "Sự kiện đã kết thúc hoặc chưa bắt đầu · Xem danh sách →" : "✦ Khám phá các sự kiện ẩm thực →"}</Link>}

      <p className="chest-catalog-summary">
        {normalCount} món quanh năm · {limitedCount} món giới hạn theo sự kiện
      </p>
      <div className="chest-help">
        <button type="button" className="chest-help-trigger" aria-label="Hướng dẫn mở rương và thẻ Vị Linh" aria-describedby="chest-help-content">ⓘ</button>
        <div className="chest-help-popover" id="chest-help-content">
          <strong>Hướng dẫn mở rương</strong>
          <p>Chọn bữa Sáng, Trưa hoặc Tối, dùng một chìa để nhận món ăn. Xem tỷ lệ bên dưới để biết độ hiếm.</p>
          <p>Mỗi rương còn nhận một thẻ Vị Linh: cần 15 / 25 / 35 / 45 thẻ theo độ hiếm để mở khóa. Tỷ lệ Thường / Hiếm / Sử thi / Huyền thoại lần lượt 71% / 22% / 6% / 1%.</p>
          <a href={user.spiritWish ? `/adventure?hero=${encodeURIComponent(user.spiritWish)}` : "/adventure?hero=chef-nhien"}>
            {user.spiritWish ? `Ước hẹn ${user.spiritPity ?? 0}/5 · lần thứ năm bảo đảm` : "Chọn Vị Linh ước hẹn"} ↗
          </a>
          <ModeIntroButton mode="chest" />
        </div>
      </div>

      <div className="meal-banner-tabs" role="tablist" aria-label="Chọn bữa ăn">
        {(["breakfast", "lunch", "dinner"] as MealSlot[]).map((mealSlot) => {
          const selected = mealSlot === slot
          const itemTheme = SLOT_THEME[mealSlot]
          return (
            <button
              key={mealSlot}
              role="tab"
              aria-selected={selected}
              disabled={isAnimating || Boolean(event && !event.dishIds.some((id) => dishes.find((dish) => dish.id === id)?.mealSlots.includes(mealSlot)))}
              className={selected ? "is-selected" : ""}
              onClick={() => setSlot(mealSlot)}
              style={
                { "--tab-accent": itemTheme.accent } as React.CSSProperties
              }
            >
              <span>{MEAL_SLOT_ICONS[mealSlot]}</span>
              <div>
                <strong>{itemTheme.title}</strong>
                <small>{MEAL_SLOT_LABELS[mealSlot]}</small>
              </div>
            </button>
          )
        })}
      </div>

      <button
        className={`mobile-checkin ${checkedIn ? "is-done" : ""}`}
        onClick={() => !checkedIn && checkIn()}
        disabled={checkedIn}
      >
        <span>◇</span>
        <p>
          <strong>
            {checkedIn ? "Đã điểm danh hôm nay" : "Điểm danh nhận 10 chìa"}
          </strong>
          <small>
            {checkedIn ? "Quay lại vào ngày mai" : "Mỗi ngày một lần"}
          </small>
        </p>
        <b>{checkedIn ? "✓" : "+10"}</b>
      </button>

      <button className="quiz-entry" onClick={() => navigate("/daily-quiz")}>
        <span>✦</span><strong>ĐOÁN MÓN HÔM NAY</strong><small>{quizRemaining ? `${quizRemaining} câu · nhận thêm tối đa ${quizRemaining} chìa` : "Đã hoàn thành hôm nay"}</small><b>→</b>
      </button>

      <section className="ritual-stage" aria-live="polite">
        <header className="ritual-copy">
          <small>
            {theme.title} · {MEAL_SLOT_LABELS[slot]}
          </small>
          <h1>
            Đánh thức lựa chọn
            <br />
            <span>của bạn</span>
          </h1>
          <p>{theme.subtitle}</p>
        </header>

        <ChestScene
          state={chestState}
          accent={theme.accent}
          reducedMotion={reduceMotion}
          rarity={ritualRarity}
        />

        <div className="ritual-status">
          <span className={isAnimating ? "is-live" : ""} />
          <p>{STATE_LABELS[chestState]}</p>
        </div>

        <div className="ritual-progress" aria-label={`Tiến trình: ${STATE_LABELS[chestState]}`}>
          {RITUAL_STEPS.map((step, index) => {
            const currentIndex = RITUAL_STEPS.indexOf(chestState)
            const active = currentIndex >= index || chestState === "result"
            return <i key={step} className={active ? "is-active" : ""} />
          })}
        </div>

        <div className="stage-actions">
          <button
            id="open-chest-button"
            className="hextech-button"
            onClick={triggerOpen}
            disabled={(!unlimited && user.keys < 1) || isAnimating || showReveal}
          >
            <span>
              {isAnimating ? STATE_LABELS[chestState] : "KHAI MỞ RƯƠNG"}
            </span>
            <small>
              {isAnimating
                ? "Năng lượng đang hội tụ"
                : unlimited
                  ? "ĐẶC QUYỀN VÔ HẠN · KHÔNG TỐN CHÌA"
                  : "TIÊU HAO 1 CHÌA KHÓA"}
            </small>
          </button>

          <div className="chest-display-options">
            {isAnimating ? (
              <button type="button" className="skip-action" onClick={skipCurrentAnimation}>
                Bỏ qua hoạt cảnh
              </button>
            ) : (
              <label className="skip-toggle">
                <input
                  type="checkbox"
                  checked={skipAnimation}
                  onChange={(event) => setSkipAnimation(event.target.checked)}
                />
                <span>Bỏ qua hoạt cảnh lần sau</span>
              </label>
            )}
            <label className="skip-toggle chest-spirit-toggle">
              <input
                type="checkbox"
                checked={showSpiritCard}
                onChange={(event) => setShowSpiritCard(event.target.checked)}
              />
              <span>Hiện thẻ Vị Linh ở kết quả</span>
            </label>
          </div>
        </div>

        <footer className="stage-footer">
          <span>
            HÔM NAY <strong>{todayCount}</strong> MÓN
          </span>
          <i />
          <span>
            TRONG RƯƠNG <strong>{availableCount}</strong> MÓN
          </span>
          <button onClick={() => setShowOdds(true)}>XEM MÓN & TỈ LỆ</button>
        </footer>
      </section>

      {showReveal && reward && (
        <RevealModal
          reward={reward}
          showSpiritCard={showSpiritCard}
          canOpenAgain={unlimited || user.keys >= 1}
          onClose={closeReveal}
          onOpenAgain={openAgain}
          onGoCollection={() => {
            closeReveal()
            navigate("/collection")
          }}
          onCheckIn={(dishId) => { closeReveal(); navigate(`/collection?tab=timeline&dish=${encodeURIComponent(dishId)}`) }}
        />
      )}
      {showOdds && (
        <ChestOddsModal
          dishes={dishes}
          slot={slot}
          eventId={event?.id}
          onClose={() => setShowOdds(false)}
        />
      )}
    </div>
  )
}
