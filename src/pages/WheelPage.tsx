import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { repository } from "../infrastructure/storage/repository"
import { useAppStore } from "../store/useAppStore"
import { playSound } from "../infrastructure/audio/soundEngine"

function secureRandInt(max: number): number {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return arr[0] % max
}

const WHEEL_COLORS = [
  "#00d4ff",
  "#f5a623",
  "#a855f7",
  "#10b981",
  "#ef4444",
  "#f59e0b",
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f97316",
]

function parseItems(text: string, dedup: boolean): string[] {
  let lines = text
    .split(/[\n,]/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (dedup) lines = [...new Set(lines)]
  return lines
}

function drawWheel(
  canvas: HTMLCanvasElement,
  items: string[],
  angleDeg: number,
) {
  const ctx = canvas.getContext("2d")!
  const W = canvas.width
  const cx = W / 2
  const cy = W / 2
  const r = cx - 12
  const n = items.length

  ctx.clearRect(0, 0, W, W)

  if (n === 0) {
    // placeholder circle
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = "rgba(0,212,255,0.15)"
    ctx.lineWidth = 2
    ctx.stroke()
    return
  }

  const arc = (Math.PI * 2) / n
  const angleRad = (angleDeg * Math.PI) / 180

  for (let i = 0; i < n; i++) {
    const startAngle = angleRad + arc * i - Math.PI / 2
    const endAngle = startAngle + arc

    // segment fill
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, startAngle, endAngle)
    ctx.closePath()
    ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length]
    ctx.globalAlpha = 0.9
    ctx.fill()
    ctx.globalAlpha = 1

    // segment border
    ctx.strokeStyle = "rgba(8,12,24,0.7)"
    ctx.lineWidth = 2
    ctx.stroke()

    // label
    const midAngle = startAngle + arc / 2
    const textR = r * 0.68
    ctx.save()
    ctx.translate(
      cx + Math.cos(midAngle) * textR,
      cy + Math.sin(midAngle) * textR,
    )
    ctx.rotate(midAngle + Math.PI / 2)
    ctx.textAlign = "center"
    ctx.fillStyle = "#fff"
    ctx.font = `bold ${Math.min(13, Math.max(9, 130 / n))}px "Be Vietnam Pro", sans-serif`
    ctx.shadowColor = "rgba(0,0,0,0.6)"
    ctx.shadowBlur = 3
    const label = items[i].length > 12 ? items[i].slice(0, 11) + "…" : items[i]
    ctx.fillText(label, 0, 0)
    ctx.restore()
  }

  // outer ring
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = "rgba(0,212,255,0.4)"
  ctx.lineWidth = 3
  ctx.stroke()

  // center hub
  const hubGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 22)
  hubGrad.addColorStop(0, "#1a2a4a")
  hubGrad.addColorStop(1, "#080c18")
  ctx.beginPath()
  ctx.arc(cx, cy, 22, 0, Math.PI * 2)
  ctx.fillStyle = hubGrad
  ctx.fill()
  ctx.strokeStyle = "#00d4ff"
  ctx.lineWidth = 2
  ctx.stroke()

  // hub icon
  ctx.fillStyle = "#00d4ff"
  ctx.font = "14px sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.shadowBlur = 0
  ctx.fillText("🎡", cx, cy)
  ctx.textBaseline = "alphabetic"
}

export function WheelPage() {
  const preferences = useAppStore((state) => state.user.preferences)
  const dishes = useAppStore((state) => state.dishes)
  const [inputText, setInputText] = useState(() =>
    repository.loadWheelItems().join("\n"),
  )
  const [dedup, setDedup] = useState(true)
  const [removeWinner, setRemoveWinner] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [angleDeg, setAngleDeg] = useState(0)
  const [history, setHistory] = useState<string[]>([])
  const [usedSuggestionIds, setUsedSuggestionIds] = useState<string[]>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const angleDegRef = useRef(0)

  const items = useMemo(() => parseItems(inputText, dedup), [inputText, dedup])
  const suggestions = useMemo(() => {
    const entered = new Set(items.map((item) => item.toLocaleLowerCase()))
    const used = new Set(usedSuggestionIds)
    return dishes
      .filter((dish) => dish.active && !used.has(dish.id) && !entered.has(dish.name.toLocaleLowerCase()))
      .slice(0, 5)
  }, [dishes, items, usedSuggestionIds])

  const addSuggestion = (dishId: string, name: string) => {
    setInputText((current) => current.trim() ? `${current.trim()}\n${name}` : name)
    setUsedSuggestionIds((current) => [...current, dishId])
  }

  useEffect(() => {
    repository.saveWheelItems(items)
  }, [items])

  // Redraw when items or angle change (but not during animation — animation handles its own draws)
  useEffect(() => {
    if (spinning) return
    const canvas = canvasRef.current
    if (!canvas) return
    drawWheel(canvas, items, angleDeg)
  }, [items, angleDeg, spinning])

  const handleSpin = useCallback(() => {
    if (spinning || items.length < 2) return
    setResult(null)
    setSpinning(true)

    const winnerIndex = secureRandInt(items.length)
    const arc = 360 / items.length
    const extraRotations = (6 + secureRandInt(4)) * 360
    // land the pointer (top = -90°) on winner
    const targetOffset = 360 - (winnerIndex * arc + arc / 2)
    const endAngle =
      angleDegRef.current +
      extraRotations +
      targetOffset -
      (angleDegRef.current % 360)
    const startAngle = angleDegRef.current
    const duration = preferences.reducedMotion ? 650 : 4200
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - t, 4)
      const current = startAngle + (endAngle - startAngle) * ease
      angleDegRef.current = current

      const canvas = canvasRef.current
      if (canvas) drawWheel(canvas, items, current)

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        const finalAngle = endAngle % 360
        angleDegRef.current = finalAngle
        setAngleDeg(finalAngle)
        setResult(items[winnerIndex])
        setHistory((h) => [items[winnerIndex], ...h].slice(0, 10))
        setSpinning(false)
        playSound("reveal", preferences.soundEnabled)
        if (removeWinner) {
          const remaining = items.filter((_, i) => i !== winnerIndex)
          setInputText(remaining.join("\n"))
        }
      }
    }

    cancelAnimationFrame(animFrameRef.current)
    animFrameRef.current = requestAnimationFrame(animate)
  }, [
    spinning,
    items,
    removeWinner,
    preferences.reducedMotion,
    preferences.soundEnabled,
  ])

  // cleanup on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [])

  const canSpin = items.length >= 2 && !spinning

  return (
    <div className="min-h-dvh pb-20 flex flex-col max-w-md mx-auto px-4 pt-4">
      {/* Header */}
      <div className="mb-4">
        <h1
          className="text-xl font-extrabold"
          style={{ fontFamily: "Exo 2, sans-serif" }}
        >
          Vòng quay tự do
        </h1>
        <p className="text-xs text-[#6b7f99]">
          Không tiêu chìa khóa · Nhập danh sách, quay ngẫu nhiên
        </p>
      </div>

      {/* Wheel */}
      <div
        className="relative flex items-center justify-center mb-4"
        style={{ minHeight: 300 }}
      >
        {/* Glow backdrop */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: spinning
              ? "radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%)"
              : "transparent",
            transition: "background 0.5s",
          }}
        />

        <div className="relative" style={{ width: 280, height: 280 }}>
          <canvas
            ref={canvasRef}
            width={280}
            height={280}
            style={{ borderRadius: "50%" }}
          />

          {/* Pointer arrow at top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
            <svg viewBox="0 0 20 24" width={20} height={24}>
              <polygon
                points="10,0 20,20 10,14 0,20"
                fill="#f5a623"
                stroke="#080c18"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Empty overlay */}
          {items.length === 0 && (
            <div
              className="absolute inset-0 flex items-center justify-center rounded-full"
              style={{ background: "rgba(8,12,24,0.6)" }}
            >
              <p className="text-sm text-[#6b7f99] text-center px-8 leading-relaxed">
                Nhập danh sách
                <br />
                bên dưới để bắt đầu
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Result */}
      {result && (
        <div
          className="mb-4 p-4 rounded-2xl text-center animate-fade-in-up"
          style={{
            background: "rgba(0,212,255,0.08)",
            border: "1px solid rgba(0,212,255,0.35)",
            boxShadow: "0 0 20px rgba(0,212,255,0.1)",
          }}
        >
          <p className="text-xs text-[#6b7f99] uppercase tracking-widest mb-1">
            Kết quả
          </p>
          <p
            className="text-2xl font-extrabold"
            style={{ color: "#00d4ff", fontFamily: "Exo 2, sans-serif" }}
          >
            {result}
          </p>
        </div>
      )}

      {/* Spin button */}
      <button
        onClick={handleSpin}
        disabled={!canSpin}
        className="w-full py-4 rounded-2xl font-bold text-lg tracking-wide mb-4 transition-all"
        style={{
          fontFamily: "Exo 2, sans-serif",
          background: canSpin
            ? "linear-gradient(135deg, #00d4ff, #0088cc)"
            : "rgba(107,127,153,0.15)",
          color: canSpin ? "#080c18" : "#6b7f99",
          boxShadow: canSpin ? "0 4px 20px rgba(0,212,255,0.3)" : "none",
          cursor: canSpin ? "pointer" : "not-allowed",
        }}
      >
        {spinning ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Đang quay...
          </span>
        ) : (
          "🎡 Quay ngay"
        )}
      </button>

      {/* Input */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-[#6b7f99] uppercase tracking-widest">
            Danh sách
          </label>
          <span
            className="text-xs"
            style={{ color: items.length < 2 ? "#f87171" : "#4ade80" }}
          >
            {items.length} mục{items.length < 2 ? " (cần ≥ 2)" : ""}
          </span>
        </div>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            "Phở bò\nCơm tấm\nBánh mì\n\nhoặc phân cách bằng dấu phẩy"
          }
          rows={5}
          className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none transition-colors"
          style={{
            background: "rgba(14,22,40,0.8)",
            border: "1px solid rgba(0,212,255,0.15)",
            color: "#e8edf5",
            fontFamily: "Be Vietnam Pro, sans-serif",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "rgba(0,212,255,0.4)"
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "rgba(0,212,255,0.15)"
          }}
        />
        {suggestions.length > 0 && (
          <div className="wheel-suggestions" aria-label="Gợi ý món ăn">
            <span className="wheel-suggestions-label">Gợi ý món</span>
            <div className="wheel-suggestions-list">
              {suggestions.map((dish) => (
                <button
                  type="button"
                  key={dish.id}
                  onClick={() => addSuggestion(dish.id, dish.name)}
                  disabled={spinning}
                  className="wheel-suggestion"
                >
                  + {dish.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4 text-xs text-[#6b7f99]">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dedup}
            onChange={(e) => setDedup(e.target.checked)}
            className="accent-[#00d4ff]"
          />
          Loại trùng
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={removeWinner}
            onChange={(e) => setRemoveWinner(e.target.checked)}
            className="accent-[#00d4ff]"
          />
          Xóa mục vừa trúng
        </label>
        {inputText.trim() && (
          <button
            onClick={() => {
              setInputText("")
              setResult(null)
              setHistory([])
            }}
            className="ml-auto"
            style={{ color: "#6b7f99" }}
          >
            Xoá hết
          </button>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#6b7f99] uppercase tracking-widest mb-2">
            Lịch sử
          </p>
          <div className="flex flex-wrap gap-2">
            {history.map((h, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full text-xs"
                style={{
                  background: "rgba(14,22,40,0.8)",
                  border: "1px solid rgba(107,127,153,0.2)",
                  color: i === 0 ? "#00d4ff" : "#6b7f99",
                }}
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
