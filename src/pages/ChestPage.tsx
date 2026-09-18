import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import gsap from "gsap"
import { useAppStore } from "../store/useAppStore"
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
import { LootVfxCanvas } from "../components/chest/LootVfxCanvas"
import { ChestOddsModal } from "../components/chest/ChestOddsModal"
import { preloadFoodAsset } from "../infrastructure/assets/foodAssets"
import {
  playSound,
  preloadChestOpeningTrack,
  startChestOpeningTrack,
  stopChestOpeningTrack,
} from "../infrastructure/audio/soundEngine"
import { getVisibleRewards } from "../domain/rewardPresentation"
import { hasUnlimitedChestAccess } from "../domain/achievements"
import { canClaimFreeChest } from "../domain/drawReward"
import { isGoldenHour } from "../domain/dateKey"
import { DailyQuest } from "../components/layout/DailyQuest"

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
  const user = useAppStore((state) => state.user)
  const dishes = useAppStore((state) => state.dishes)
  const checkIn = useAppStore((state) => state.checkIn)
  const openFreeChest = useAppStore((state) => state.openFreeChest)
  const openChest = useAppStore((state) => state.openChest)
  const showToast = useAppStore((state) => state.showToast)
  const pendingRevealRewardId = useAppStore((state) => state.pendingRevealRewardId)
  const completeRewardReveal = useAppStore((state) => state.completeRewardReveal)
  const navigate = useNavigate()
  const [slot, setSlot] = useState<MealSlot>(defaultSlot)
  const [chestState, setChestState] = useState<ChestState>("idle")
  const [reward, setReward] = useState<RewardInstance | null>(null)
  const [showReveal, setShowReveal] = useState(false)
  const [showOdds, setShowOdds] = useState(false)
  const [skipAnimation, setSkipAnimation] = useState(false)
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
  const freeChestReady = canClaimFreeChest(user)
  const goldenHour = isGoldenHour()

  const finishReveal = useCallback(() => {
    const nextReward = pendingRewardRef.current
    if (!nextReward) return
    setChestState("result")
    setReward(nextReward)
    setShowReveal(true)
    completeRewardReveal()
    processingRef.current = false
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
    const result = openChest(slot)
    if (!result.reward) {
      showToast(result.error ?? "Không thể mở rương.", "error")
      processingRef.current = false
      return
    }

    pendingRewardRef.current = result.reward
    setRitualRarity(result.reward.rarity ?? "common")
    preloadFoodAsset(result.reward.dishId, "full")
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

      <DailyQuest compact />

      {goldenHour && (
        <div className="golden-hour-banner">
          ✦ GIỜ VÀNG · Cơ hội món Rare+ tăng trong khung 18:00–21:00
        </div>
      )}

      <button
        className={`mobile-checkin ${freeChestReady ? "is-ready" : "is-done"}`}
        onClick={() => freeChestReady && openFreeChest(slot)}
        disabled={!freeChestReady || isAnimating || showReveal}
      >
        <span>🎁</span>
        <p>
          <strong>{freeChestReady ? "Rương miễn phí hôm nay" : "Đã dùng rương miễn phí"}</strong>
          <small>{freeChestReady ? "Không tốn chìa khóa" : "Quay lại vào ngày mai"}</small>
        </p>
        <b>{freeChestReady ? "MỞ" : "✓"}</b>
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
          <button onClick={() => setShowOdds(true)}>XEM TỈ LỆ</button>
        </footer>
      </section>

      {showReveal && reward && (
        <RevealModal
          reward={reward}
          canOpenAgain={unlimited || user.keys >= 1}
          onClose={closeReveal}
          onOpenAgain={openAgain}
          onGoCollection={() => {
            closeReveal()
            navigate("/collection")
          }}
        />
      )}
      {showOdds && (
        <ChestOddsModal
          dishes={dishes}
          slot={slot}
          onClose={() => setShowOdds(false)}
        />
      )}
    </div>
  )
}

function ChestScene({
  state,
  accent,
  reducedMotion,
  rarity,
}: {
  state: ChestState
  accent: string
  reducedMotion: boolean
  rarity: RewardRarity | null
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

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width - 0.5
    const y = (event.clientY - bounds.top) / bounds.height - 0.5
    event.currentTarget.style.setProperty("--tilt-x", `${y * -7}deg`)
    event.currentTarget.style.setProperty("--tilt-y", `${x * 9}deg`)
  }

  const resetPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty("--tilt-x", "0deg")
    event.currentTarget.style.setProperty("--tilt-y", "0deg")
  }

  return (
    <div
      className={`chest-scene scene-${state} scene-rarity-${rarity ?? "common"}`}
      style={{ "--scene-accent": accent } as React.CSSProperties}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <LootVfxCanvas
        state={state}
        accent={accent}
        reducedMotion={reducedMotion}
        rarity={rarity}
      />
      <div className="scene-stars" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
      </div>
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
      <div className="energy-column" />
      <div className="scene-vignette" />
      <div className="cinematic-bar cinematic-bar-top" />
      <div className="cinematic-bar cinematic-bar-bottom" />
      <div className="scene-flash" />
      <div className="lens-flare" />
      <div className="shockwave shockwave-primary" />
      <div className="shockwave shockwave-secondary" />

      <div className="taste-key" aria-hidden="true">
        <span className="key-head">◇</span>
        <span className="key-shaft" />
        <span className="key-tooth" />
        <i className="key-spark" />
      </div>

      <div className="chest-parallax">
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
