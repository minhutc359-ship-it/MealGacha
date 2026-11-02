import { useEffect, useRef, useState } from "react"
import build from "virtual:aw2-review-build"
import type { SaveSnapshot } from "../../src/aw2/save/schema"
import {
  createPlaytestFeedback,
  type FrameCadence,
} from "../../src/aw2/review/feedback"
import { measurePageCadence } from "./feedbackRuntime"

export function PlaytestFeedback({
  snapshot,
  busy,
}: {
  snapshot: SaveSnapshot
  busy: boolean
}) {
  const [device, setDevice] = useState("")
  const [notes, setNotes] = useState("")
  const [cadence, setCadence] = useState<FrameCadence | null>(null)
  const [measuring, setMeasuring] = useState(false)
  const [report, setReport] = useState("")
  const [url, setUrl] = useState("")
  const [message, setMessage] = useState("")
  const ownedUrl = useRef("")
  const output = useRef<HTMLTextAreaElement>(null)
  const cancel = useRef<(() => void) | null>(null)
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      cancel.current?.()
      if (ownedUrl.current) URL.revokeObjectURL(ownedUrl.current)
    }
  }, [])
  const secure = window.isSecureContext,
    locks = typeof navigator.locks?.request === "function"
  function measure() {
    setCadence(null)
    setMeasuring(true)
    setMessage("Giữ trang hiển thị trong ba giây.")
    cancel.current = measurePageCadence((result) => {
      if (!mounted.current) return
      setMeasuring(false)
      setCadence(result)
      setMessage(
        result
          ? `Nhịp khung hình trang: ${result.rafHz} Hz. Đây là mẫu quan sát tại trang hiện tại.`
          : "Mẫu đo đã hủy; giữ trang hiển thị rồi thử lại.",
      )
      cancel.current = null
    })
  }
  function generate() {
    const memory = (
      performance as Performance & { memory?: { usedJSHeapSize?: number } }
    ).memory
    const nav = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined
    const next = createPlaytestFeedback({
      build,
      snapshot,
      declaredDevice: device,
      notes,
      cadence,
      now: new Date().toISOString(),
      environment: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        secureContext: secure,
        webLocks: locks,
        viewport: {
          width: innerWidth,
          height: innerHeight,
          pixelRatio: devicePixelRatio,
        },
        reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
        jsHeapBytes: memory?.usedJSHeapSize ?? null,
        pageLoadMs: nav?.loadEventEnd ?? null,
      },
    })
    const text = JSON.stringify(next, null, 2) + "\n"
    const nextUrl = URL.createObjectURL(
      new Blob([text], { type: "application/json" }),
    )
    if (ownedUrl.current) URL.revokeObjectURL(ownedUrl.current)
    ownedUrl.current = nextUrl
    setUrl(nextUrl)
    setReport(text)
    setMessage(
      "Đã tạo phiếu tại thời điểm này. Bạn có thể đọc, tải hoặc sao chép để gửi phản hồi.",
    )
  }
  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw Error("Unavailable")
      await navigator.clipboard.writeText(report)
      if (mounted.current) setMessage("Đã sao chép phiếu.")
    } catch {
      if (!mounted.current) return
      output.current?.focus()
      output.current?.select()
      setMessage(
        "Không sao chép tự động được. Phiếu đã được chọn; dùng Sao chép trên thiết bị hoặc tải tệp.",
      )
    }
  }
  return (
    <details
      className="aw2-playtest-feedback"
      data-testid="playtest-feedback"
      onToggle={(e) => {
        if (!e.currentTarget.open) cancel.current?.()
      }}
    >
      <summary>Phiếu phản hồi chơi thử</summary>
      <p>
        Mô tả bước bạn vừa làm và điều chưa hoạt động. Phiếu được tạo trên thiết
        bị này; bạn chọn cách gửi sau khi xem nội dung.
      </p>
      <p>
        Mã bản chơi:{" "}
        <code data-testid="review-build-id">
          {build.codeFingerprint.slice(0, 16)}
        </code>{" "}
        · {build.mode === "compiled" ? "Bản biên dịch" : "Bản phát triển"}.
      </p>
      {!secure || !locks ? (
        <p role="status">
          Thiết bị này chưa đủ điều kiện ghi bản lưu. Trên iPhone, mở bản chơi
          bằng HTTPS được trình duyệt tin cậy và kiểm tra lại khả năng lưu.
        </p>
      ) : (
        <p>Trình duyệt có kết nối an toàn và hỗ trợ khóa khi ghi bản lưu.</p>
      )}
      <label>
        Thiết bị bạn đang thử
        <input
          value={device}
          maxLength={160}
          onChange={(e) => setDevice(e.target.value)}
          placeholder="Ví dụ: iPhone 13, iOS…, Safari"
        />
      </label>
      <label>
        Bước đã làm, kết quả mong đợi và lỗi gặp phải
        <textarea
          value={notes}
          maxLength={4000}
          rows={4}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <div className="actions">
        <button type="button" disabled={busy || measuring} onClick={measure}>
          Đo nhịp khung hình (3 giây)
        </button>
        <button type="button" disabled={busy || measuring} onClick={generate}>
          Tạo phiếu phản hồi
        </button>
      </div>
      <p>
        Thông số bộ nhớ chỉ có khi trình duyệt cung cấp. Mẫu nhịp trang không
        thay cho phép đo FPS của game hoặc kiểm tra điện thoại thật.
      </p>
      <p role="status" data-testid="feedback-status">
        {message}
      </p>
      {report && (
        <>
          <label>
            Nội dung phiếu đã tạo
            <textarea
              ref={output}
              value={report}
              readOnly
              rows={10}
              data-testid="feedback-report"
            />
          </label>
          <div className="actions">
            <button type="button" onClick={() => void copy()}>
              Sao chép phiếu
            </button>
            {url && (
              <a
                href={url}
                download={`aw2-playtest-${build.codeFingerprint.slice(0, 12)}.json`}
              >
                Tải phiếu JSON
              </a>
            )}
          </div>
          <p>
            Phiếu giữ dữ liệu lúc bấm Tạo phiếu. Tạo lại sau khi chơi tiếp; kết
            quả nghiệm thu sẽ được tổng hợp từ lượt chơi và phản hồi thực tế.
          </p>
        </>
      )}
    </details>
  )
}
