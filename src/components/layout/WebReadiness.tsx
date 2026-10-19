import { useEffect, useState, useSyncExternalStore } from "react"
import { applyWebUpdate, checkWebUpdate, offlineSnapshot, startWebOffline, subscribeOffline } from "../../infrastructure/web/offline"

export function WebReadiness() {
  const status = useSyncExternalStore(subscribeOffline, offlineSnapshot, offlineSnapshot)
  const [persistent, setPersistent] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)
  useEffect(() => { startWebOffline(); void navigator.storage?.persisted?.().then(setPersistent).catch(() => {}) }, [])
  if (status.phase === "unsupported") return null
  return <section className="web-readiness" aria-label="Web offline và lưu tiến trình">
    <h2>Chơi tiếp khi mất mạng</h2>
    <p role="status">{status.phase === "ready" ? "Giao diện đã sẵn sàng offline. Ảnh và nhạc đã dùng được giữ trong bộ nhớ đệm; nội dung chưa tải và Tìm quán vẫn cần mạng." : status.phase === "error" ? "Chưa chuẩn bị được offline. Kiểm tra kết nối rồi mở lại web." : "Đang chuẩn bị giao diện để chơi offline…"}</p>
    {status.update ? <><p>Có phiên bản mới. Tiến trình và bộ sưu tập được giữ nguyên khi cập nhật.</p><button disabled={status.applying} onClick={applyWebUpdate}>{status.applying ? "Đang cập nhật…" : "Cập nhật và tải lại"}</button>{status.updateError && <p role="alert">Chưa cập nhật được. Kiểm tra kết nối rồi thử lại.</p>}</> : <button disabled={checking} onClick={async () => { setChecking(true); try { await checkWebUpdate() } finally { setChecking(false) } }}>{checking ? "Đang kiểm tra…" : "Kiểm tra phiên bản mới"}</button>}
    <p>{persistent ? "Trình duyệt đã cho phép giữ dữ liệu lâu dài. Vẫn nên xuất bản sao lưu khi qua một chương." : "Tiến trình nằm trên trình duyệt này. Hãy xuất bản sao lưu khi qua chương hoặc đổi máy."}</p>
    {persistent === false && navigator.storage?.persist && <button onClick={() => { void navigator.storage.persist().then(setPersistent).catch(() => {}) }}>Yêu cầu trình duyệt giữ dữ liệu</button>}
  </section>
}
