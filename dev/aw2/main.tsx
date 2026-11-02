import { StrictMode, useEffect, useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import {
  AW2_DEV_SAVE_KEY,
  AW2_RESET_CONFIRMATION,
  AW2_SAVE_STORAGE_KEYS,
  type SaveSnapshot,
} from "../../src/aw2/save/schema"
import {
  Aw2DevSaveStore,
  supportsAw2Writes,
  type RecoveryInspection,
  type ResetRequest,
} from "../../src/aw2/save/store"
import "./styles.css"

const labels: Record<SaveSnapshot["status"], string> = {
  empty: "Chưa có bản lưu AW2",
  ready: "Bản lưu AW2 sẵn sàng",
  invalid: "Bản lưu AW2 không hợp lệ — dữ liệu gốc được giữ",
  unsupported: "Bản lưu thuộc schema mới hơn — dữ liệu gốc được giữ",
  unavailable: "Chưa truy cập được kho AW2",
}

function Aw2SaveScreen() {
  const [store] = useState(() => new Aw2DevSaveStore())
  const [snapshot, setSnapshot] = useState<SaveSnapshot>(() => store.load())
  const [recovery, setRecovery] = useState<RecoveryInspection>(() =>
    store.inspectRecovery(),
  )
  const [reset, setReset] = useState<ResetRequest | null>(null)
  const [confirmation, setConfirmation] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const dialog = useRef<HTMLDialogElement>(null)
  const resetButton = useRef<HTMLButtonElement>(null)
  const cancelButton = useRef<HTMLButtonElement>(null)
  const pending = useRef(false)
  const canWrite = supportsAw2Writes()

  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (
        event.key === null ||
        AW2_SAVE_STORAGE_KEYS.some((key) => key === event.key)
      ) {
        setRecovery({ status: "none" })
        setMessage("")
        setError(
          "Dữ liệu đã thay đổi ở tab khác. Đọc lại để tiếp tục; nếu đang reset, hãy mở xác nhận mới.",
        )
      }
    }
    window.addEventListener("storage", changed)
    return () => window.removeEventListener("storage", changed)
  }, [])

  useEffect(() => {
    if (reset) {
      dialog.current?.showModal()
      cancelButton.current?.focus()
    } else if (dialog.current?.open) {
      dialog.current.close()
      resetButton.current?.focus()
    }
  }, [reset])

  function cancelReset() {
    store.cancelReset()
    setReset(null)
    setConfirmation("")
  }

  function read() {
    cancelReset()
    setSnapshot(store.load())
    setRecovery(store.inspectRecovery())
    setMessage("Đã đọc lại kho AW2.")
    setError("")
  }

  function openReset() {
    if (snapshot.status === "unavailable") return
    setMessage("")
    setError("")
    setConfirmation("")
    setReset(store.beginReset(snapshot.raw))
  }

  async function mutate(isReset: boolean) {
    if (
      pending.current ||
      snapshot.status === "unavailable" ||
      (isReset && !reset)
    )
      return
    pending.current = true
    setBusy(true)
    setMessage("")
    setError("")
    try {
      const result =
        isReset && reset
          ? await store.confirmReset(reset, confirmation)
          : await store.save(snapshot.raw)
      setSnapshot(result)
      setRecovery(store.inspectRecovery())
      setMessage(
        isReset
          ? "Đã bắt đầu lại bản lưu phát triển AW2."
          : "Đã lưu AW2. Có thể tải lại trang để kiểm tra.",
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Thao tác chưa hoàn tất. Hãy đọc lại kho AW2.",
      )
    } finally {
      if (isReset) cancelReset()
      pending.current = false
      setBusy(false)
    }
  }

  async function recover() {
    if (
      pending.current ||
      snapshot.status === "unavailable" ||
      recovery.status !== "available"
    )
      return
    pending.current = true
    setBusy(true)
    setMessage("")
    setError("")
    try {
      const result = await store.recover(snapshot.raw, recovery.candidate)
      setSnapshot(result)
      setRecovery({ status: "none" })
      setMessage("Đã phục hồi bản lưu AW2 đã được xác minh.")
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Chưa phục hồi được AW2. Hãy đọc lại kho.",
      )
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  return (
    <main className="aw2-save">
      <p className="eyebrow">ADVENTURE WORLD 2 · AW2-001</p>
      <h1>Kho phát triển</h1>
      <p>
        Nền tảng lưu tiến trình cho AW2. Bản này chưa có bản đồ, nhân vật hay
        phần thưởng.
      </p>
      <section aria-labelledby="save-heading">
        <h2 id="save-heading">{labels[snapshot.status]}</h2>
        <p>
          Kho riêng: <code>{AW2_DEV_SAVE_KEY}</code>
        </p>
        {snapshot.status === "ready" && (
          <dl>
            <div>
              <dt>Mã bản lưu</dt>
              <dd data-testid="save-id">{snapshot.save.saveId}</dd>
            </div>
            <div>
              <dt>Lần ghi</dt>
              <dd data-testid="revision">{snapshot.save.revision}</dd>
            </div>
            <div>
              <dt>Schema</dt>
              <dd>{snapshot.save.schemaVersion}</dd>
            </div>
            <div>
              <dt>Tạo lúc</dt>
              <dd>{snapshot.save.createdAt}</dd>
            </div>
            <div>
              <dt>Lưu lúc</dt>
              <dd>{snapshot.save.updatedAt}</dd>
            </div>
          </dl>
        )}
        {snapshot.status === "unavailable" && (
          <p role="alert">Kiểm tra quyền lưu dữ liệu rồi chọn Đọc lại.</p>
        )}
        {!canWrite && (
          <p role="alert">
            Cần Web Locks để ghi an toàn giữa các tab. Mở bằng localhost hoặc
            HTTPS trên trình duyệt hỗ trợ.
          </p>
        )}
        {recovery.status === "available" && (
          <p role="status">
            Có bản an toàn lần ghi {recovery.candidate.save.revision}, lưu lúc{" "}
            {recovery.candidate.save.updatedAt}. Phục hồi sẽ giữ dữ liệu lỗi
            hiện tại trong vùng cách ly AW2.
          </p>
        )}
        <div className="actions">
          <button
            onClick={() => void mutate(false)}
            disabled={
              busy ||
              !canWrite ||
              recovery.status === "available" ||
              !["empty", "ready"].includes(snapshot.status)
            }
          >
            {snapshot.status === "empty" ? "Tạo bản lưu AW2" : "Lưu thử AW2"}
          </button>
          <button onClick={read} disabled={busy}>
            Đọc lại
          </button>
          {recovery.status === "available" && (
            <button onClick={() => void recover()} disabled={busy || !canWrite}>
              Phục hồi bản an toàn
            </button>
          )}
          <button
            ref={resetButton}
            className="danger"
            onClick={openReset}
            disabled={
              busy ||
              !canWrite ||
              snapshot.status === "unavailable" ||
              snapshot.status === "empty"
            }
          >
            Bắt đầu lại AW2…
          </button>
        </div>
        <p role="status" aria-live="polite">
          {busy ? "Đang xử lý…" : message}
        </p>
        {error && <p role="alert">{error}</p>}
      </section>
      <p className="note">
        Màn hình thử nghiệm độc lập. Reset chỉ thay bản lưu phát triển AW2. Tiến
        trình Soul of Meal giữ nguyên.
      </p>
      <dialog
        ref={dialog}
        aria-labelledby="reset-heading"
        aria-describedby="reset-description"
        onCancel={(event) => {
          event.preventDefault()
          if (!pending.current) cancelReset()
        }}
      >
        <h2 id="reset-heading">Bắt đầu lại dữ liệu AW2?</h2>
        <p id="reset-description">
          Thao tác thay toàn bộ bản lưu phát triển AW2 bằng bản mới, kể cả dữ
          liệu lỗi hoặc schema mới hơn. Không thể hoàn tác trên màn hình này.
          Tiến trình Soul of Meal giữ nguyên.
        </p>
        <label htmlFor="reset-confirmation">
          Nhập <strong>{AW2_RESET_CONFIRMATION}</strong> để xác nhận lần reset
          này
        </label>
        <input
          id="reset-confirmation"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          disabled={busy}
        />
        <div className="actions">
          <button ref={cancelButton} onClick={cancelReset} disabled={busy}>
            Hủy
          </button>
          <button
            className="danger"
            onClick={() => void mutate(true)}
            disabled={busy || confirmation !== AW2_RESET_CONFIRMATION}
          >
            Xác nhận reset AW2
          </button>
        </div>
      </dialog>
    </main>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Aw2SaveScreen />
  </StrictMode>,
)
