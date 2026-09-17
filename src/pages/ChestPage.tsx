import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import gsap from "gsap"
import { useAppStore } from "../store/useAppStore"
import {
  MealSlot,
  RewardInstance,
  MEAL_SLOT_LABELS,
  MEAL_SLOT_ICONS,
} from "../domain/models"
import { canCheckIn } from "../domain/checkIn"
import { getCurrentHour, getDateKey } from "../domain/dateKey"
import { RevealModal } from "../components/chest/RevealModal"
import { LootVfxCanvas } from "../components/chest/LootVfxCanvas"
import { preloadFoodAsset } from "../infrastructure/assets/foodAssets"
import { playSound } from "../infrastructure/audio/soundEngine"

type ChestState = "idle" | "key-flight" | "inserting" | "charging" | "anticipation" | "impact" | "opening" | "reward-rise" | "result"

const STATE_LABELS: Record<ChestState, string> = {
  idle: "Sẵn sàng khai mở",
  "key-flight": "Chìa khóa đang cộng hưởng",
  inserting: "Kích hoạt lõi vị giác",
  charging: "Tích tụ năng lượng",
  anticipation: "Phần thưởng đang thức tỉnh",
  impact: "Khai mở!",
  opening: "Rương đã mở",
  "reward-rise": "Triệu hồi món ăn",
  result: "Đã nhận phần thưởng",
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
  const user = useAppStore((state) => state.user)
  const checkIn = useAppStore((state) => state.checkIn)
  const openChest = useAppStore((state) => state.openChest)
  const showToast = useAppStore((state) => state.showToast)
  const navigate = useNavigate()
  const [slot, setSlot] = useState<MealSlot>(defaultSlot)
  const [chestState, setChestState] = useState<ChestState>("idle")
  const [reward, setReward] = useState<RewardInstance | null>(null)
  const [showReveal, setShowReveal] = useState(false)
  const [skipAnimation, setSkipAnimation] = useState(false)
  const processingRef = useRef(false)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const pendingRewardRef = useRef<RewardInstance | null>(null)

  const theme = SLOT_THEME[slot]
  const today = getDateKey()
  const todayCount = user.rewards.filter(
    (item) => item.acquiredDate === today,
  ).length
  const checkedIn = !canCheckIn(user)
  const isAnimating = !["idle", "result"].includes(chestState)
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  }, [])
  const reduceMotion = user.preferences.reducedMotion || prefersReducedMotion

  const finishReveal = useCallback(() => {
    const nextReward = pendingRewardRef.current
    if (!nextReward) return
    setChestState("result")
    setReward(nextReward)
    setShowReveal(true)
    processingRef.current = false
    playSound("reveal", user.preferences.soundEnabled)
  }, [user.preferences.soundEnabled])

  const runTimeline = useCallback(() => {
    timelineRef.current?.kill()
    const timeline = gsap.timeline({ onComplete: finishReveal })
    timelineRef.current = timeline

    timeline
      .call(() => {
        setChestState("key-flight")
        playSound("key", user.preferences.soundEnabled)
      })
      .to({}, { duration: 0.62 })
      .call(() => setChestState("inserting"))
      .to({}, { duration: 0.28 })
      .call(() => {
        setChestState("charging")
        playSound("charge", user.preferences.soundEnabled)
      })
      .to({}, { duration: 0.82 })
      .call(() => setChestState("anticipation"))
      .to({}, { duration: 0.38 })
      .call(() => {
        setChestState("impact")
        playSound("impact", user.preferences.soundEnabled)
      })
      .to({}, { duration: 0.22 })
      .call(() => setChestState("opening"))
      .to({}, { duration: 0.46 })
      .call(() => setChestState("reward-rise"))
      .to({}, { duration: 0.7 })
  }, [finishReveal, user.preferences.soundEnabled])

  const triggerOpen = useCallback(() => {
    if (processingRef.current) return
    processingRef.current = true
    const result = openChest(slot)
    if (!result.reward) {
      showToast(result.error ?? "Không thể mở rương.", "error")
      processingRef.current = false
      return
    }

    pendingRewardRef.current = result.reward
    preloadFoodAsset(result.reward.dishId, "full")
    if (skipAnimation || reduceMotion) {
      setChestState("reward-rise")
      window.setTimeout(finishReveal, reduceMotion ? 120 : 40)
      return
    }
    runTimeline()
  }, [
    finishReveal,
    openChest,
    reduceMotion,
    runTimeline,
    showToast,
    skipAnimation,
    slot,
  ])

  const skipCurrentAnimation = () => {
    timelineRef.current?.kill()
    finishReveal()
  }

  const closeReveal = () => {
    timelineRef.current?.kill()
    setShowReveal(false)
    setReward(null)
    pendingRewardRef.current = null
    setChestState("idle")
    processingRef.current = false
  }

  const openAgain = () => {
    closeReveal()
    window.setTimeout(triggerOpen, 140)
  }

  useEffect(() => {
    return () => {
      timelineRef.current?.kill()
    }
  }, [])

  return (
    <div
      className="loot-stage-page"
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
          <strong>{user.keys}</strong>
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
              disabled={isAnimating}
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
        />

        <div className="ritual-status">
          <span className={isAnimating ? "is-live" : ""} />
          <p>{STATE_LABELS[chestState]}</p>
        </div>

        <div className="stage-actions">
          <button
            id="open-chest-button"
            className="hextech-button"
            onClick={triggerOpen}
            disabled={user.keys < 1 || isAnimating || showReveal}
          >
            <span>
              {isAnimating ? STATE_LABELS[chestState] : "KHAI MỞ RƯƠNG"}
            </span>
            <small>
              {isAnimating ? "Năng lượng đang hội tụ" : "TIÊU HAO 1 CHÌA KHÓA"}
            </small>
          </button>

          {isAnimating ? (
            <button className="skip-action" onClick={skipCurrentAnimation}>
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
        </div>

        <footer className="stage-footer">
          <span>
            HÔM NAY <strong>{todayCount}</strong> MÓN
          </span>
          <i />
          <span>
            TỶ LỆ HIẾM <strong>28%</strong>
          </span>
        </footer>
      </section>

      {showReveal && reward && (
        <RevealModal
          reward={reward}
          canOpenAgain={user.keys >= 1}
          onClose={closeReveal}
          onOpenAgain={openAgain}
          onGoCollection={() => {
            closeReveal()
            navigate("/collection")
          }}
        />
      )}
    </div>
  )
}

function ChestScene({
  state,
  accent,
  reducedMotion,
}: {
  state: ChestState
  accent: string
  reducedMotion: boolean
}) {
  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, index) => ({
        id: index,
        angle: (360 / 22) * index,
        delay: (index % 6) * 0.07,
        distance: 90 + (index % 5) * 18,
      })),
    [],
  )

  return (
    <div
      className={`chest-scene scene-${state}`}
      style={{ "--scene-accent": accent } as React.CSSProperties}
    >
      <LootVfxCanvas
        state={state}
        accent={accent}
        reducedMotion={reducedMotion}
      />
      <div className="ritual-halo" />
      <div className="ritual-ring ritual-ring-outer">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="ritual-ring ritual-ring-inner">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="vertical-ray" />
      <div className="scene-flash" />
      <div className="shockwave" />

      <div className="taste-key" aria-hidden="true">
        <span className="key-head">◇</span>
        <span className="key-shaft" />
        <span className="key-tooth" />
      </div>

      <div className="chest-model" aria-hidden="true">
        <div className="chest-shadow" />
        <div className="chest-lid">
          <div className="lid-face">
            <span />
            <span />
          </div>
        </div>
        <div className="chest-body">
          <div className="body-panel left" />
          <div className="body-panel right" />
          <div className="chest-core">
            <span>◇</span>
          </div>
          <div className="chest-band" />
        </div>
        <div className="inner-light" />
      </div>

      <div className="reward-sigil">
        <span>✦</span>
      </div>
      <div className="burst-particles" aria-hidden="true">
        {particles.map((particle) => (
          <i
            key={particle.id}
            style={
              {
                "--particle-angle": `${particle.angle}deg`,
                "--particle-delay": `${particle.delay}s`,
                "--particle-distance": `${particle.distance}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  )
}
