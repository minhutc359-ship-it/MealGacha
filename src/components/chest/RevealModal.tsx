import { useEffect, useRef, useState } from "react"
import {
  RewardInstance,
  MEAL_SLOT_LABELS,
  MEAL_SLOT_ICONS,
} from "../../domain/models"
import { PlacesModal } from "../places/PlacesModal"
import { FoodImage } from "../food/FoodImage"
import { RarityFrame, RARITY_LABELS } from "../ui/RarityFrame"
import { useAppStore } from "../../store/useAppStore"

interface Props {
  reward: RewardInstance
  canOpenAgain: boolean
  onClose(): void
  onOpenAgain(): void
  onGoCollection(): void
}

export function RevealModal({
  reward,
  canOpenAgain,
  onClose,
  onOpenAgain,
  onGoCollection,
}: Props) {
  const [showPlaces, setShowPlaces] = useState(false)
  const firstFocusRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const toggleFavorite = useAppStore((state) => state.toggleFavorite)
  const favorite = useAppStore(
    (state) => state.user.rewards.find((item) => item.id === reward.id)?.favorite ?? reward.favorite,
  )
  const showToast = useAppStore((state) => state.showToast)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key !== "Tab" || !dialogRef.current) return
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", handleKey)
    setTimeout(() => firstFocusRef.current?.focus(), 50)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  const dish = reward.dish
  const rarity = reward.rarity ?? "common"
  const particleCount = rarity === "diamond" ? 34 : rarity === "epic" ? 24 : rarity === "rare" ? 16 : 9

  const shareReward = async () => {
    const text = `Tôi vừa mở được ${dish.name} trong Rương Vị Giác!`
    try {
      if (navigator.share) await navigator.share({ title: "Rương Vị Giác", text })
      else {
        await navigator.clipboard.writeText(text)
        showToast("Đã sao chép kết quả!", "success")
      }
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") showToast("Không thể chia sẻ kết quả.", "error")
    }
  }

  const downloadShareCard = async () => {
    const canvas = document.createElement("canvas")
    canvas.width = 900
    canvas.height = 560
    const context = canvas.getContext("2d")
    if (!context) return
    const gradient = context.createLinearGradient(0, 0, 900, 560)
    gradient.addColorStop(0, "#071827")
    gradient.addColorStop(1, rarity === "diamond" ? "#5d3d9d" : "#0d3041")
    context.fillStyle = gradient
    context.fillRect(0, 0, 900, 560)
    context.fillStyle = "#e8c777"
    context.font = "700 22px Exo 2"
    context.fillText("RUONG VI GIAC", 54, 64)
    context.fillStyle = "#edf8ff"
    context.font = "800 52px Exo 2"
    context.fillText(dish.name, 54, 270)
    context.fillStyle = "#a8f3ff"
    context.font = "700 24px Exo 2"
    context.fillText(RARITY_LABELS[rarity].toUpperCase(), 54, 320)
    context.fillStyle = "#7d94a8"
    context.font = "18px Be Vietnam Pro"
    context.fillText("Một lựa chọn vừa được khai mở.", 54, 380)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `ruong-vi-giac-${dish.id}.png`
    link.click()
    URL.revokeObjectURL(url)
    showToast("Đã tải share card!", "success")
  }

  return (
    <>
      <div
        className={`reward-reveal-backdrop rarity-${rarity} fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4`}
        style={{
          background: "rgba(8,12,24,0.88)",
          backdropFilter: "blur(10px)",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
        role="dialog"
        aria-modal="true"
        aria-label={`Phần thưởng: ${dish.name}`}
      >
        <div
          ref={dialogRef}
          className={`reward-reveal-card rarity-${rarity} w-full max-w-md rounded-3xl overflow-hidden animate-reveal-card`}
          style={{
            background: "linear-gradient(160deg, #0f1a2e 0%, #080c18 100%)",
            border: "1.5px solid rgba(0,212,255,0.3)",
            boxShadow:
              "0 0 80px rgba(0,212,255,0.12), 0 24px 64px rgba(0,0,0,0.6)",
          }}
        >
          {/* Art area */}
          <div
            className="relative h-64 flex items-center justify-center overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(0,212,255,0.06) 0%, rgba(168,85,247,0.06) 100%)",
            }}
          >
            <div className="reward-confetti" aria-hidden="true">
              {Array.from({ length: particleCount }, (_, index) => (
                <i key={index} style={{ "--confetti-index": index } as React.CSSProperties} />
              ))}
            </div>
            <div className="reward-shine" aria-hidden="true" />
            {/* Radial glow */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 60%, rgba(0,212,255,0.12) 0%, transparent 70%)",
              }}
            />
            <RarityFrame rarity={rarity} className="reward-art-frame">
              <FoodImage
                dishId={dish.id}
                name={dish.name}
                imageUrl={dish.imageUrl}
                variant="full"
                eager
              />
            </RarityFrame>
            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-2">
              <span
                className="text-xs px-2 py-1 rounded-full font-medium"
                style={{
                  background: "rgba(0,212,255,0.15)",
                  color: "#00d4ff",
                  border: "1px solid rgba(0,212,255,0.3)",
                  backdropFilter: "blur(4px)",
                }}
              >
                {MEAL_SLOT_ICONS[reward.mealSlot]}{" "}
                {MEAL_SLOT_LABELS[reward.mealSlot]}
              </span>
            </div>
            {reward.source === "fusion" && (
              <div className="absolute top-3 right-3">
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{
                    background: "rgba(168,85,247,0.15)",
                    color: "#a855f7",
                    border: "1px solid rgba(168,85,247,0.3)",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  ✨ Ghép món
                </span>
              </div>
            )}
            <div className={`reward-rarity-badge rarity-${rarity}`}>
              {RARITY_LABELS[rarity]}
            </div>
            {/* Bottom fade */}
            <div
              className="absolute bottom-0 left-0 right-0 h-12"
              style={{
                background: "linear-gradient(to top, #080c18, transparent)",
              }}
            />
          </div>

          {/* Info */}
          <div className="px-5 pb-5">
            <p className="reward-unlocked-label">PHẦN THƯỞNG ĐÃ ĐƯỢC KHAI MỞ</p>
            <h2
              className="text-2xl font-extrabold mb-0.5 mt-1"
              style={{ fontFamily: "Exo 2, sans-serif", color: "#e8edf5" }}
            >
              {dish.name}
            </h2>
            {dish.category && (
              <p
                className="text-xs uppercase tracking-widest mb-4"
                style={{ color: "#6b7f99" }}
              >
                {dish.category}
              </p>
            )}

            <div className="reward-utility-actions">
              <button onClick={() => toggleFavorite(reward.id)} aria-pressed={favorite}>
                {favorite ? "♥ Đã yêu thích" : "♡ Yêu thích"}
              </button>
              <button onClick={shareReward}>↗ Chia sẻ</button>
              <button onClick={downloadShareCard}>▣ Card</button>
            </div>

            {/* Actions */}
            <button
              ref={firstFocusRef}
              onClick={() => setShowPlaces(true)}
              className="w-full py-3 rounded-xl font-bold text-sm mb-3 transition-all"
              style={{
                background: "linear-gradient(135deg, #00d4ff, #0088cc)",
                color: "#080c18",
                boxShadow: "0 4px 16px rgba(0,212,255,0.3)",
              }}
            >
              📍 Tìm quán gần đây
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={onOpenAgain}
                disabled={!canOpenAgain}
                className="py-3 rounded-xl text-sm font-semibold border transition-all"
                style={
                  canOpenAgain
                    ? {
                        borderColor: "rgba(245,166,35,0.35)",
                        color: "#f5a623",
                        background: "rgba(245,166,35,0.07)",
                      }
                    : {
                        borderColor: "rgba(107,127,153,0.15)",
                        color: "#6b7f99",
                        background: "transparent",
                        cursor: "not-allowed",
                      }
                }
              >
                🔑 Mở tiếp
              </button>
              <button
                onClick={onGoCollection}
                className="py-3 rounded-xl text-sm font-semibold border transition-all"
                style={{
                  borderColor: "rgba(107,127,153,0.2)",
                  color: "#a8b8d0",
                  background: "rgba(14,22,40,0.5)",
                }}
              >
                📦 Bộ sưu tập
              </button>
            </div>

            {!canOpenAgain && (
              <p
                className="text-center text-xs mt-2.5"
                style={{ color: "#6b7f99" }}
              >
                Hết chìa · Điểm danh ngày mai để nhận thêm
              </p>
            )}
          </div>
        </div>
      </div>

      {showPlaces && (
        <PlacesModal dish={dish} onClose={() => setShowPlaces(false)} />
      )}
    </>
  )
}
