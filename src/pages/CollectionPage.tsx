import { useState, useMemo } from "react"
import { useAppStore } from "../store/useAppStore"
import {
  RewardInstance,
  MealSlot,
  MEAL_SLOT_LABELS,
  MEAL_SLOT_ICONS,
} from "../domain/models"
import { PlacesModal } from "../components/places/PlacesModal"
import { getDateKey } from "../domain/dateKey"
import { FoodImage } from "../components/food/FoodImage"
import { RevealModal } from "../components/chest/RevealModal"
import { playSound, preloadRewardReceivedTrack, startSpinResultTrack } from "../infrastructure/audio/soundEngine"
import { RARITY_LABELS } from "../components/ui/RarityFrame"
import { FusionRitual } from "../components/chest/FusionRitual"
import { getFeaturedEvents } from "../domain/events"
import { buildPool } from "../domain/drawReward"

type SlotFilter = "all" | MealSlot
type StatusFilter = "all" | "available" | "consumed"

export function CollectionPage() {
  const user = useAppStore((s) => s.user)
  const dishes = useAppStore((s) => s.dishes)
  const fuse = useAppStore((s) => s.fuse)
  const toggleFavorite = useAppStore((s) => s.toggleFavorite)
  const showToast = useAppStore((s) => s.showToast)

  const [slotFilter, setSlotFilter] = useState<SlotFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [favOnly, setFavOnly] = useState(false)
  const [fusionMode, setFusionMode] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [targetSlot, setTargetSlot] = useState<MealSlot>("lunch")
  const [selectedEventId, setSelectedEventId] = useState("")
  const [placeDish, setPlaceDish] = useState<RewardInstance | null>(null)
  const [fusionResult, setFusionResult] = useState<RewardInstance | null>(null)
  const [fusionRitual, setFusionRitual] = useState<{ materials: RewardInstance[]; result: RewardInstance } | null>(null)

  const today = getDateKey()
  const featuredEvents = getFeaturedEvents(dishes)
  const eventTitles = new Map(featuredEvents.map((event) => [event.id, event.title]))
  const activeEvents = featuredEvents.filter((event) => event.active &&
    (["breakfast", "lunch", "dinner"] as MealSlot[]).some((slot) => buildPool(dishes, slot, [], event.id).length > 0))

  const filtered = useMemo(() => {
    return [...user.rewards].reverse().filter((r) => {
      if (slotFilter !== "all" && r.mealSlot !== slotFilter) return false
      if (statusFilter !== "all" && r.status !== statusFilter) return false
      if (favOnly && !r.favorite) return false
      return true
    })
  }, [user.rewards, slotFilter, statusFilter, favOnly])

  const grouped = useMemo(() => {
    const map = new Map<string, RewardInstance[]>()
    for (const r of filtered) {
      const list = map.get(r.acquiredDate) ?? []
      list.push(r)
      map.set(r.acquiredDate, list)
    }
    return map
  }, [filtered])

  // Date locked to first selected item's date
  const lockedDate =
    selected.length > 0
      ? user.rewards.find((r) => r.id === selected[0])?.acquiredDate
      : null

  const canSelect = (r: RewardInstance) => {
    if (!fusionMode) return false
    if (r.status !== "available") return false
    if (lockedDate && r.acquiredDate !== lockedDate) return false
    if (selected.includes(r.id)) return true
    if (selected.length >= 3) return false
    return true
  }

  const toggleSelect = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id))
    } else if (selected.length < 3) {
      setSelected([...selected, id])
    }
  }

  const handleFuse = () => {
    if (selected.length !== 3) return
    const result = fuse(selected as [string, string, string], targetSlot, selectedEventId || undefined)
    if (result.error) {
      showToast(result.error, "error")
      return
    }
    if (result.reward) {
      preloadRewardReceivedTrack()
      setFusionRitual({ materials: selected.map((id) => user.rewards.find((item) => item.id === id)!), result: result.reward })
      playSound("fusion", user.preferences.soundEnabled)
    }
    showToast(`✨ Ghép thành công: ${result.reward?.dish.name}!`, "success")
    setFusionMode(false)
    setSelected([])
    setSelectedEventId("")
  }

  const availableToday = user.rewards.filter(
    (r) => r.status === "available" && r.acquiredDate === today,
  )
  const canFuseToday = availableToday.length >= 3

  return (
    <div className="min-h-dvh pb-20 flex flex-col max-w-md mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1
            className="text-xl font-extrabold"
            style={{ fontFamily: "Exo 2, sans-serif" }}
          >
            Bộ sưu tập
          </h1>
          <p className="text-xs" style={{ color: "#6b7f99" }}>
            {user.rewards.length} phần thưởng · {user.fusions.length} ghép
          </p>
        </div>
        <button
          onClick={() => {
            setFusionMode(!fusionMode)
            setSelected([])
            setSelectedEventId("")
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all"
          style={
            fusionMode
              ? {
                  background: "rgba(168,85,247,0.15)",
                  color: "#a855f7",
                  border: "1px solid rgba(168,85,247,0.4)",
                }
              : {
                  background: "rgba(14,22,40,0.8)",
                  color: canFuseToday ? "#a855f7" : "#6b7f99",
                  border: `1px solid ${
                    canFuseToday
                      ? "rgba(168,85,247,0.3)"
                      : "rgba(107,127,153,0.2)"
                  }`,
                }
          }
        >
          <span>✨</span>
          {fusionMode ? "Huỷ ghép" : "Ghép món"}
        </button>
      </div>

      {/* Fusion panel */}
      {fusionMode && (
        <div
          className="mt-3 mb-2 p-4 rounded-2xl"
          style={{
            background: "rgba(168,85,247,0.07)",
            border: "1px solid rgba(168,85,247,0.2)",
          }}
        >
          <label className="fusion-event-selector">
            <span>Banner nhận món</span>
            <select aria-label="Banner nhận món sau dung hợp" value={selectedEventId} onChange={(event) => {
              const id = event.target.value
              setSelectedEventId(id)
              if (id && !buildPool(dishes, targetSlot, [], id).length) {
                const firstSlot = (["breakfast", "lunch", "dinner"] as MealSlot[]).find((slot) => buildPool(dishes, slot, [], id).length)
                if (firstSlot) setTargetSlot(firstSlot)
              }
            }}>
              <option value="">Món thường · quanh năm</option>
              {activeEvents.map((event) => <option key={event.id} value={event.id}>{event.icon} {event.title} · chỉ trong sự kiện</option>)}
            </select>
            <small>{selectedEventId ? "Chỉ ghép ra món riêng của sự kiện đang diễn ra. Hết hạn không thể ghép ra nữa." : "Ghép ra món thuộc pool sáng, trưa hoặc tối quanh năm."}</small>
          </label>
          {/* Selection progress */}
          <div className="flex items-center gap-2 mb-3">
            {[0, 1, 2].map((i) => {
              const r = selected[i]
                ? user.rewards.find((x) => x.id === selected[i])
                : null
              return (
                <div
                  key={i}
                  className="flex-1 flex items-center justify-center h-10 rounded-xl text-xs font-medium transition-all"
                  style={
                    r
                      ? {
                          background: "rgba(168,85,247,0.15)",
                          border: "1px solid rgba(168,85,247,0.4)",
                          color: "#a855f7",
                        }
                      : {
                          background: "rgba(22,32,64,0.6)",
                          border: "1px dashed rgba(107,127,153,0.3)",
                          color: "#6b7f99",
                        }
                  }
                >
                  {r ? (
                    <FoodImage
                      dishId={r.dishId}
                      name={r.dish.name}
                      imageUrl={r.dish.imageUrl}
                      variant="thumb"
                    />
                  ) : (
                    `${i + 1}`
                  )}
                </div>
              )
            })}
            <div className="text-[#6b7f99] text-xs font-bold">→</div>
            <div
              className="flex items-center justify-center h-10 w-10 rounded-xl"
              style={{
                background:
                  selected.length === 3
                    ? "rgba(168,85,247,0.2)"
                    : "rgba(22,32,64,0.6)",
                border: `1px solid ${
                  selected.length === 3
                    ? "rgba(168,85,247,0.4)"
                    : "rgba(107,127,153,0.2)"
                }`,
              }}
            >
              <span className="text-lg">✨</span>
            </div>
          </div>

          {selected.length < 3 ? (
            <p className="text-xs text-center" style={{ color: "#a8b8d0" }}>
              {lockedDate
                ? `Chọn từ ngày ${lockedDate} · Đã chọn ${selected.length}/3`
                : `Chọn 3 phần thưởng cùng ngày · Đã chọn ${selected.length}/3`}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {(["breakfast", "lunch", "dinner"] as MealSlot[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setTargetSlot(s)}
                    disabled={Boolean(selectedEventId && !buildPool(dishes, s, [], selectedEventId).length)}
                    className="py-2 rounded-xl text-xs font-semibold transition-all"
                    style={
                      targetSlot === s
                        ? {
                            background: "rgba(168,85,247,0.2)",
                            color: "#a855f7",
                            border: "1px solid rgba(168,85,247,0.4)",
                          }
                        : {
                            background: "rgba(14,22,40,0.5)",
                            color: "#6b7f99",
                            border: "1px solid rgba(107,127,153,0.15)",
                          }
                    }
                  >
                    {MEAL_SLOT_ICONS[s]} {MEAL_SLOT_LABELS[s]}
                  </button>
                ))}
              </div>
              <button
                onClick={handleFuse}
                className="w-full py-3 rounded-xl text-sm font-bold"
                style={{
                  background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                  color: "#fff",
                  boxShadow: "0 4px 16px rgba(168,85,247,0.3)",
                }}
              >
                ✨ Xác nhận ghép
              </button>
            </>
          )}

          {!canFuseToday && selected.length === 0 && (
            <p
              className="text-xs text-center mt-2"
              style={{ color: "#6b7f99" }}
            >
              Cần ≥ 3 phần thưởng còn dùng hôm nay để ghép. Hiện có{" "}
              {availableToday.length}/3.
            </p>
          )}
        </div>
      )}

      {/* Filters */}
      <div
        className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1"
        style={{ scrollbarWidth: "none" }}
      >
        {(["all", "breakfast", "lunch", "dinner"] as SlotFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setSlotFilter(s)}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all"
            style={
              slotFilter === s
                ? {
                    background: "rgba(0,212,255,0.12)",
                    color: "#00d4ff",
                    border: "1px solid rgba(0,212,255,0.3)",
                  }
                : {
                    background: "rgba(14,22,40,0.5)",
                    color: "#6b7f99",
                    border: "1px solid rgba(107,127,153,0.12)",
                  }
            }
          >
            {s === "all"
              ? "Tất cả"
              : `${MEAL_SLOT_ICONS[s]} ${MEAL_SLOT_LABELS[s]}`}
          </button>
        ))}
        <div
          className="w-px flex-shrink-0 self-stretch my-0.5"
          style={{ background: "rgba(107,127,153,0.15)" }}
        />
        {(["all", "available", "consumed"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all"
            style={
              statusFilter === s
                ? {
                    background: "rgba(245,166,35,0.12)",
                    color: "#f5a623",
                    border: "1px solid rgba(245,166,35,0.3)",
                  }
                : {
                    background: "rgba(14,22,40,0.5)",
                    color: "#6b7f99",
                    border: "1px solid rgba(107,127,153,0.12)",
                  }
            }
          >
            {s === "all"
              ? "Tất cả"
              : s === "available"
                ? "✅ Còn dùng"
                : "🔄 Đã ghép"}
          </button>
        ))}
        <div
          className="w-px flex-shrink-0 self-stretch my-0.5"
          style={{ background: "rgba(107,127,153,0.15)" }}
        />
        <button
          onClick={() => setFavOnly(!favOnly)}
          className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all"
          style={
            favOnly
              ? {
                  background: "rgba(236,72,153,0.15)",
                  color: "#ec4899",
                  border: "1px solid rgba(236,72,153,0.35)",
                }
              : {
                  background: "rgba(14,22,40,0.5)",
                  color: "#6b7f99",
                  border: "1px solid rgba(107,127,153,0.12)",
                }
          }
        >
          ❤️ Yêu thích
        </button>
      </div>

      {/* Content */}
      {user.rewards.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-10">
          <span className="text-4xl opacity-30">🔍</span>
          <p className="text-sm" style={{ color: "#6b7f99" }}>
            Không có phần thưởng nào khớp bộ lọc.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {Array.from(grouped.entries()).map(([date, rewards]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <p
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "#6b7f99" }}
                >
                  {date === today ? "🗓️ Hôm nay" : date}
                </p>
                <div
                  className="flex-1 h-px"
                  style={{ background: "rgba(107,127,153,0.12)" }}
                />
                <p className="text-xs" style={{ color: "#6b7f99" }}>
                  {rewards.length} món
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {rewards.map((r) => (
                  <RewardCard
                    key={r.id}
                    reward={r}
                    eventTitle={eventTitles.get(dishes.find((dish) => dish.id === r.dishId)?.limitedEventId ?? "")}
                    fusionMode={fusionMode}
                    isSelected={selected.includes(r.id)}
                    selectable={canSelect(r)}
                    lockedReason={
                      fusionMode && !canSelect(r) && !selected.includes(r.id)
                        ? r.status === "consumed"
                          ? "Đã ghép"
                          : lockedDate && r.acquiredDate !== lockedDate
                            ? "Khác ngày"
                            : ""
                        : ""
                    }
                    onSelect={() => toggleSelect(r.id)}
                    onFavorite={() => toggleFavorite(r.id)}
                    onFindPlaces={() => setPlaceDish(r)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {placeDish && (
        <PlacesModal dish={placeDish.dish} onClose={() => setPlaceDish(null)} />
      )}
      {fusionResult && (
        <RevealModal
          reward={fusionResult}
          canOpenAgain={false}
          onClose={() => setFusionResult(null)}
          onOpenAgain={() => setFusionResult(null)}
          onGoCollection={() => setFusionResult(null)}
        />
      )}
      {fusionRitual && <FusionRitual materials={fusionRitual.materials} result={fusionRitual.result} reducedMotion={user.preferences.reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches} onComplete={() => { startSpinResultTrack(user.preferences.soundEnabled); setFusionResult(fusionRitual.result); setFusionRitual(null) }} />}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
        style={{
          background: "rgba(14,22,40,0.8)",
          border: "1px solid rgba(107,127,153,0.15)",
        }}
      >
        📦
      </div>
      <div>
        <p
          className="text-base font-semibold mb-1"
          style={{ color: "#a8b8d0" }}
        >
          Bộ sưu tập trống
        </p>
        <p className="text-sm" style={{ color: "#6b7f99" }}>
          Mở rương để nhận phần thưởng đầu tiên!
        </p>
      </div>
    </div>
  )
}

function RewardCard({
  reward,
  eventTitle,
  fusionMode,
  isSelected,
  selectable,
  lockedReason,
  onSelect,
  onFavorite,
  onFindPlaces,
}: {
  reward: RewardInstance
  eventTitle?: string
  fusionMode: boolean
  isSelected: boolean
  selectable: boolean
  lockedReason: string
  onSelect(): void
  onFavorite(): void
  onFindPlaces(): void
}) {
  const isConsumed = reward.status === "consumed"
  const isLocked = fusionMode && !selectable && !isSelected

  return (
    <div
      onClick={() => (selectable ? onSelect() : undefined)}
      className="flex items-center gap-3 p-3 rounded-2xl transition-all"
      style={{
        background: isSelected
          ? "rgba(168,85,247,0.08)"
          : isConsumed
            ? "rgba(14,22,40,0.4)"
            : "rgba(14,22,40,0.7)",
        border: isSelected
          ? "1.5px solid rgba(168,85,247,0.5)"
          : "1px solid rgba(107,127,153,0.12)",
        opacity: isLocked ? 0.45 : 1,
        cursor: fusionMode && selectable ? "pointer" : "default",
        boxShadow: isSelected ? "0 0 12px rgba(168,85,247,0.15)" : "none",
      }}
    >
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
        style={{
          background: isConsumed ? "rgba(22,32,64,0.4)" : "rgba(22,32,64,0.8)",
          opacity: isConsumed ? 0.5 : 1,
        }}
      >
        <FoodImage
          dishId={reward.dishId}
          name={reward.dish.name}
          imageUrl={reward.dish.imageUrl}
          variant="thumb"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold truncate ${
            isConsumed ? "line-through" : ""
          }`}
          style={{ color: isConsumed ? "#6b7f99" : "#e8edf5" }}
        >
          {reward.dish.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs" style={{ color: "#6b7f99" }}>
            {MEAL_SLOT_ICONS[reward.mealSlot]}{" "}
            {MEAL_SLOT_LABELS[reward.mealSlot]}
          </span>
          <span
            className={`reward-rarity-inline rarity-${reward.rarity ?? "common"}`}
          >
            {RARITY_LABELS[reward.rarity ?? "common"]}
          </span>
          {eventTitle && <span className="reward-event-inline" title="Món chỉ nhận được trong thời gian sự kiện">✦ {eventTitle}</span>}
          {reward.source === "fusion" && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-md"
              style={{ background: "rgba(168,85,247,0.12)", color: "#a855f7" }}
            >
              ✨ Ghép
            </span>
          )}
          {isConsumed && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-md"
              style={{ background: "rgba(107,127,153,0.1)", color: "#6b7f99" }}
            >
              Đã ghép
            </span>
          )}
          {fusionMode && isLocked && lockedReason && (
            <span className="text-xs" style={{ color: "#6b7f99" }}>
              🔒 {lockedReason}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {!fusionMode ? (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onFindPlaces()
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors"
            style={{ background: "rgba(0,212,255,0.08)", color: "#00d4ff" }}
            title="Tìm quán"
          >
            📍
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onFavorite()
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors"
            title={reward.favorite ? "Bỏ yêu thích" : "Yêu thích"}
          >
            {reward.favorite ? "❤️" : "🤍"}
          </button>
        </div>
      ) : isSelected ? (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: "#a855f7",
            boxShadow: "0 0 8px rgba(168,85,247,0.4)",
          }}
        >
          <span className="text-white text-sm font-bold">✓</span>
        </div>
      ) : selectable ? (
        <div
          className="w-7 h-7 rounded-full border-2 flex-shrink-0"
          style={{ borderColor: "rgba(168,85,247,0.4)" }}
        />
      ) : null}
    </div>
  )
}
