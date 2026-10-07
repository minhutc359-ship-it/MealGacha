import { useEffect, useRef, useState } from "react"
import {
  createSaveCode,
  readSaveCode,
  TRANSFER_BACKUP_KEY,
  type SaveCodePreview,
} from "../../game/saveCode"
import { useGameStore } from "../../game/useGameStore"
import { parseGame } from "../../game/storage"
import { Dialog } from "./Dialog"

export function ProgressTransfer() {
  const [code, setCode] = useState(""),
    [input, setInput] = useState(""),
    [preview, setPreview] = useState<SaveCodePreview | null>(null)
  const [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [compatible, setCompatible] = useState(false)
  const [hasBackup, setHasBackup] = useState(() => {
    try {
      return !!localStorage.getItem(TRANSFER_BACKUP_KEY)
    } catch {
      return false
    }
  })
  const epoch = useRef(0),
    output = useRef<HTMLTextAreaElement>(null)
  useEffect(
    () => () => {
      epoch.current++
    },
    [],
  )
  const generate = async () => {
    const token = ++epoch.current
    setBusy(true)
    setStatus("")
    try {
      const value = await createSaveCode(
        useGameStore.getState().save,
        !compatible,
      )
      if (token === epoch.current) {
        setCode(value)
        setStatus("Mã đã tạo. Copy toàn bộ để tiếp tục ở thiết bị khác.")
      }
    } catch (error) {
      if (token === epoch.current) setStatus((error as Error).message)
    } finally {
      if (token === epoch.current) setBusy(false)
    }
  }
  const inspect = async () => {
    const token = ++epoch.current
    setBusy(true)
    setStatus("")
    setPreview(null)
    try {
      const value = await readSaveCode(input)
      if (token === epoch.current) setPreview(value)
    } catch (error) {
      if (token === epoch.current) setStatus((error as Error).message)
    } finally {
      if (token === epoch.current) setBusy(false)
    }
  }
  const restore = () => {
    if (!preview) return
    try {
      localStorage.setItem(
        TRANSFER_BACKUP_KEY,
        JSON.stringify(useGameStore.getState().save),
      )
    } catch {
      setStatus("Không đủ chỗ giữ bản lưu dự phòng. Chưa thay đổi tiến trình.")
      return
    }
    if (useGameStore.getState().importSave(preview.save)) {
      setPreview(null)
      setInput("")
      setCode("")
      setHasBackup(true)
      setStatus("Đã khôi phục. Bạn có thể đóng cửa sổ để tiếp tục chơi.")
    } else setStatus("Không lưu được tiến trình. Bản hiện tại được giữ nguyên.")
  }
  return (
    <div className="tcg-transfer">
      <p>
        Chuyển cả thẻ, 6 bộ bài, lựa chọn truyện, bạn đồng hành, thử thách tuần
        và trận đang chơi bằng một mã. Không cần tài khoản.
      </p>
      <p className="tcg-builder-tip">
        Mã là bản chụp tại lúc tạo. Ai có mã có thể khôi phục tiến trình đó; hãy
        giữ mã cho riêng bạn.
      </p>
      <label className="tcg-transfer-option">
        <input
          type="checkbox"
          checked={compatible}
          onChange={(e) => setCompatible(e.target.checked)}
        />{" "}
        Mã tương thích cho trình duyệt cũ (dài hơn)
      </label>
      <button className="tcg-button primary" onClick={generate} disabled={busy}>
        {busy ? "Đang xử lý…" : "Tạo mã tiến trình mới"}
      </button>
      {code && (
        <>
          <label>
            Mã của bạn
            <textarea
              ref={output}
              value={code}
              readOnly
              spellCheck={false}
              aria-label="Mã tiến trình đã tạo"
              onFocus={(e) => e.target.select()}
            />
          </label>
          <button
            className="tcg-button ghost"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(code)
                setStatus("Đã copy mã tiến trình.")
              } catch {
                output.current?.focus()
                output.current?.select()
                setStatus("Mã đã được chọn. Dùng thao tác Copy của thiết bị.")
              }
            }}
          >
            Copy toàn bộ mã
          </button>
        </>
      )}
      <hr />
      <label>
        Dán mã từ thiết bị cũ
        <textarea
          value={input}
          maxLength={2_000_000}
          spellCheck={false}
          placeholder="MGC1.…"
          aria-label="Dán mã tiến trình"
          onChange={(e) => {
            epoch.current++
            setBusy(false)
            setInput(e.target.value)
            setPreview(null)
            setStatus("")
          }}
        />
      </label>
      <button
        className="tcg-button ghost"
        disabled={!input.trim() || busy}
        onClick={inspect}
      >
        Kiểm tra mã
      </button>
      {preview && (
        <div className="tcg-transfer-preview">
          <strong>
            Bản lưu lúc {new Date(preview.exportedAt).toLocaleString("vi-VN")}
          </strong>
          <p>
            {Object.values(preview.save.cards).filter((n) => n > 0).length} loại
            thẻ · {preview.save.decks.length} bộ bài ·{" "}
            {preview.save.clearedStages.length} màn · {preview.save.coins} xu
          </p>
          <p>
            {preview.save.battle
              ? `Trận ${preview.save.battle.opponent} · lượt ${preview.save.battle.round}`
              : "Đang ở sảnh hành trình"}
          </p>
          <p>
            Khôi phục sẽ thay tiến trình trên thiết bị này. Bản hiện tại được
            giữ làm dự phòng.
          </p>
          <button className="tcg-button primary" onClick={restore}>
            Khôi phục mã này
          </button>
        </div>
      )}
      {hasBackup && (
        <button
          className="tcg-text-button"
          onClick={() => {
            try {
              const saved = parseGame(
                JSON.parse(localStorage.getItem(TRANSFER_BACKUP_KEY) ?? "null"),
              )
              if (saved && useGameStore.getState().importSave(saved)) {
                setStatus("Đã quay lại bản lưu trước khi chuyển mã.")
                setCode("")
                setPreview(null)
              } else setStatus("Bản dự phòng không hợp lệ.")
            } catch {
              setStatus("Không đọc được bản dự phòng.")
            }
          }}
        >
          Quay lại bản trước khi khôi phục
        </button>
      )}
      {status && <p role="status">{status}</p>}
    </div>
  )
}
export function TransferButton({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        className={`tcg-button ghost ${compact ? "tcg-transfer-short" : ""}`}
        onClick={() => setOpen(true)}
        aria-label="Chuyển tiến trình bằng mã"
      >
        {compact ? "⇄" : "⇄ Mã tiến trình"}
      </button>
      {open && (
        <Dialog
          title="Copy & tiếp tục hành trình"
          onClose={() => setOpen(false)}
        >
          <ProgressTransfer />
        </Dialog>
      )}
    </>
  )
}
