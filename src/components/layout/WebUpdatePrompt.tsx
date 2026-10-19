import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { applyWebUpdate, offlineSnapshot, subscribeOffline } from "../../infrastructure/web/offline"
import "./webUpdatePrompt.css"

function UpdateDialog({ onLater }: { onLater: () => void }) {
  const status = useSyncExternalStore(subscribeOffline, offlineSnapshot, offlineSnapshot)
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!, previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = "hidden"
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [])
  return <dialog ref={ref} className="web-update-dialog" aria-labelledby="web-update-title" aria-describedby="web-update-description"
    aria-busy={status.applying} onCancel={event => { event.preventDefault(); if (!status.applying) onLater() }}
    onKeyDown={event => {
      if (event.key !== "Tab") return
      const controls = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")]
      const first = controls[0], last = controls.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }}>
    <span className="web-update-mark" aria-hidden="true">✦</span>
    <small>SOUL OF MEAL</small>
    <h2 id="web-update-title">Có phiên bản mới!</h2>
    <p id="web-update-description">Hành trình cùng Vị Linh đã có nội dung mới. Cập nhật để trải nghiệm phiên bản mới nhất nhé!</p>
    <p className="web-update-save">Tiến trình và bộ sưu tập của bạn được giữ nguyên.</p>
    {status.applying && <p role="status">Đang cập nhật… Game sẽ tự tải lại trong giây lát.</p>}
    {status.updateError && <p role="alert">Chưa cập nhật được. Hãy kiểm tra kết nối rồi thử lại. Nếu vẫn thấy bản cũ, hãy đóng tab và mở lại game.</p>}
    <div className="web-update-actions">
      <button type="button" autoFocus disabled={status.applying} onClick={applyWebUpdate}>{status.applying ? "Đang cập nhật…" : "Cập nhật và tải lại"}</button>
      <button type="button" disabled={status.applying} onClick={onLater}>Để sau</button>
    </div>
  </dialog>
}

export function WebUpdatePrompt() {
  const status = useSyncExternalStore(subscribeOffline, offlineSnapshot, offlineSnapshot)
  const [dismissed, setDismissed] = useState(false)
  return status.update && !dismissed ? <UpdateDialog onLater={() => setDismissed(true)} /> : null
}
