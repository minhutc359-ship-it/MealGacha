import { useEffect, useState, useSyncExternalStore } from "react"
import {
  applyWebUpdate,
  checkWebUpdate,
  offlineSnapshot,
  promptWebInstall,
  refreshWebReadiness,
  requestPersistentStorage,
  startWebOffline,
  subscribeOffline,
} from "../../infrastructure/web/offline"

const size = (bytes: number | null) =>
  bytes === null
    ? "chưa rõ"
    : new Intl.NumberFormat("vi-VN", {
        maximumFractionDigits: 1,
        style: "unit",
        unit: bytes >= 1_000_000 ? "megabyte" : "kilobyte",
        unitDisplay: "short",
      }).format(bytes / (bytes >= 1_000_000 ? 1_000_000 : 1_000))

export function WebReadiness({ compact = false }: { compact?: boolean }) {
  const status = useSyncExternalStore(
    subscribeOffline,
    offlineSnapshot,
    offlineSnapshot,
  )
  const [checking, setChecking] = useState(false)
  useEffect(() => {
    startWebOffline()
    void refreshWebReadiness()
  }, [])
  if (status.phase === "unsupported") return null
  return (
    <section
      className={`web-readiness${compact ? " aw2-web-readiness" : ""}`}
      aria-label="Web offline, cài đặt và lưu tiến trình"
    >
      <h2>Chơi tiếp khi mất mạng</h2>
      <p role="status">
        {status.online ? "Đang có mạng" : "Đang offline"} ·{" "}
        {status.phase === "ready"
          ? "giao diện đã sẵn sàng"
          : status.phase === "error"
            ? "offline chưa sẵn sàng"
            : "đang chuẩn bị offline"}
      </p>
      <p>
        Cache đã ghé: {size(status.cacheBytes)} / {status.cacheEntries ?? "?"}{" "}
        tệp. Bộ nhớ trình duyệt: {size(status.storageUsage)} /{" "}
        {size(status.storageQuota)}.
      </p>
      {status.cacheVersion && (
        <p className="note">
          Bản cache {status.cacheVersion.slice(0, 8)} · giữ{" "}
          {status.previousCaches ?? 0} cache cũ cho tab đang mở.
        </p>
      )}
      {status.update ? (
        <>
          <p>Có phiên bản mới. Tiến trình và bộ sưu tập được giữ nguyên.</p>
          <button disabled={status.applying} onClick={applyWebUpdate}>
            {status.applying ? "Đang cập nhật…" : "Cập nhật và tải lại"}
          </button>
          {status.updateError && (
            <p role="alert">Chưa cập nhật được. Kiểm tra mạng rồi thử lại.</p>
          )}
        </>
      ) : (
        <button
          disabled={checking || !status.online}
          onClick={async () => {
            setChecking(true)
            try {
              await checkWebUpdate()
              await refreshWebReadiness()
            } finally {
              setChecking(false)
            }
          }}
        >
          {checking ? "Đang kiểm tra…" : "Kiểm tra phiên bản mới"}
        </button>
      )}
      {status.install === "available" && (
        <button onClick={() => void promptWebInstall()}>
          Cài Soul of Meal
        </button>
      )}
      {status.install === "installed" && (
        <p>Game đã chạy như ứng dụng độc lập.</p>
      )}
      {status.install === "dismissed" && (
        <p className="note">Đã để sau việc cài ứng dụng.</p>
      )}
      <p>
        {status.persistent
          ? "Trình duyệt đã cho phép giữ dữ liệu lâu dài."
          : "Tiến trình vẫn cần bản sao lưu khi đổi máy hoặc xóa dữ liệu trình duyệt."}
      </p>
      {status.persistent === false && (
        <button onClick={() => void requestPersistentStorage()}>
          Yêu cầu giữ dữ liệu lâu dài
        </button>
      )}
    </section>
  )
}
