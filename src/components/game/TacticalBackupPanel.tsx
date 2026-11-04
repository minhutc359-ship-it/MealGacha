import { useRef, useState } from "react"
import {
  exportTacticalBackup,
  previewTacticalBackup,
  importTacticalBackup,
  undoTacticalImport,
  tacticalRestoreSnapshot,
  TACTICAL_RESTORE_UNDO_KEY,
  TACTICAL_BACKUP_MAX_BYTES,
  type TacticalBackupPreview,
} from "../../game/tacticalTcg/progression/backup"
import { withTacticalLock } from "../../game/tacticalTcg/progression/cardEconomy"
import { Dialog } from "./Dialog"

export function TacticalBackupPanel({
  onRestored,
}: {
  onRestored: () => void
}) {
  const [text, setText] = useState("")
  const [preview, setPreview] = useState<TacticalBackupPreview | null>(null)
  const [undo, setUndo] = useState<ReturnType<
    typeof tacticalRestoreSnapshot
  > | null>(null)
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  let hasUndo = false
  try {
    hasUndo = !!localStorage.getItem(TACTICAL_RESTORE_UNDO_KEY)
  } catch {
    /* Storage errors are reported on the requested action. */
  }
  const check = (value: string) => {
    try {
      setPreview(previewTacticalBackup(localStorage, value))
      setNotice("")
    } catch (e) {
      setPreview(null)
      setNotice((e as Error).message)
    }
  }
  const restore = async () => {
    if (pending.current || (!preview && !undo)) return
    pending.current = true
    setBusy(true)
    try {
      await withTacticalLock(() => {
        if (preview) importTacticalBackup(localStorage, preview)
        else if (undo) undoTacticalImport(localStorage, undo)
      })
      onRestored()
    } catch (e) {
      setNotice((e as Error).message)
      setPreview(null)
      setUndo(null)
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  const download = () => {
    try {
      const url = URL.createObjectURL(
        new Blob([exportTacticalBackup(localStorage)], {
          type: "application/json",
        }),
      )
      const link = document.createElement("a")
      link.href = url
      link.download = "soul-of-meal-backup.json"
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setNotice("Đã xuất bản sao thẻ, bộ bài, hành trình và dữ liệu Rương.")
    } catch (e) {
      setNotice((e as Error).message)
    }
  }
  return (
    <article className="tactical-backup-panel">
      <h2>Bản sao & khôi phục</h2>
      <p>
        Tiến trình được lưu trên thiết bị. Xuất một bản dự phòng trước khi đổi
        trình duyệt. Nhập lại sẽ thay thế dữ liệu hiện tại sau khi bạn xem và
        xác nhận.
      </p>
      <div className="tactical-backup-actions">
        <button className="tcg-button primary" onClick={download}>
          Xuất bản sao JSON
        </button>
        <label className="tcg-button ghost tactical-file-button">
          Chọn tệp bản sao
          <input
            type="file"
            accept=".json,application/json"
            aria-label="Chọn tệp bản sao JSON"
            onChange={async (event) => {
              const file = event.currentTarget.files?.[0]
              event.currentTarget.value = ""
              if (!file) return
              if (file.size > TACTICAL_BACKUP_MAX_BYTES) {
                setNotice("Bản sao vượt quá 10 MB.")
                return
              }
              try {
                const value = await file.text()
                setText(value)
                check(value)
              } catch {
                setNotice("Chưa đọc được tệp. Chọn lại hoặc dán nội dung JSON.")
              }
            }}
          />
        </label>
      </div>
      <details className="tactical-backup-paste">
        <summary>Hoặc dán nội dung JSON</summary>
        <label>
          Nội dung bản sao
          <textarea
            aria-label="Nội dung bản sao JSON"
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setPreview(null)
            }}
            placeholder="Dán nội dung tệp soul-of-meal-backup.json…"
            spellCheck={false}
          />
        </label>
        <button
          className="tcg-button ghost"
          onClick={() => check(text)}
          disabled={!text.trim()}
        >
          Kiểm tra bản sao
        </button>
      </details>
      {hasUndo && (
        <div className="tactical-backup-undo">
          <p>
            Đã giữ bản lưu trước lần nhập gần nhất. Hoàn tác sẽ thay thế cả tiến
            trình bạn chơi thêm sau lần nhập đó.
          </p>
          <button
            className="tcg-button ghost"
            onClick={() => {
              try {
                setUndo(tacticalRestoreSnapshot(localStorage))
              } catch (e) {
                setNotice((e as Error).message)
              }
            }}
          >
            Hoàn tác lần nhập gần nhất
          </button>
        </div>
      )}
      {notice && (
        <p role="status" className="tactical-form-error">
          {notice}
        </p>
      )}
      {(preview || undo) && (
        <Dialog
          title={preview ? "Xem trước bản sao" : "Hoàn tác nhập tiến trình"}
          onClose={() => {
            setPreview(null)
            setUndo(null)
          }}
          dismissible={!busy}
        >
          {preview ? (
            <>
              <p>
                Bản sao ngày{" "}
                {new Date(preview.exportedAt).toLocaleString("vi-VN", {
                  timeZone: "Asia/Ho_Chi_Minh",
                })}
                . Chưa có dữ liệu nào được thay thế.
              </p>
              <table className="tactical-backup-preview">
                <caption>Tiến trình sau khi nhập</caption>
                <tbody>
                  <tr>
                    <th>Thẻ đã sở hữu</th>
                    <td>
                      {preview.currentCards} → {preview.cards}
                    </td>
                  </tr>
                  <tr>
                    <th>Chặng cốt truyện</th>
                    <td>
                      {preview.currentNodes} → {preview.nodes}/8
                    </td>
                  </tr>
                  <tr>
                    <th>Bộ bài</th>
                    <td>{preview.decks}</td>
                  </tr>
                  <tr>
                    <th>Tinh Vị / Vé mở thẻ</th>
                    <td>
                      {preview.tinhVi} / {preview.tickets}
                    </td>
                  </tr>
                  <tr>
                    <th>Trận đã lưu</th>
                    <td>
                      {preview.checkpointRound
                        ? `Vòng ${preview.checkpointRound}`
                        : "Chưa có"}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p>
                Nhập bản sao sẽ thay thế thẻ, bộ bài, hành trình và Rương hiện
                tại. Bản trước khi nhập được giữ để hoàn tác một lần. Game sẽ
                tải lại để đọc đúng dữ liệu.
              </p>
            </>
          ) : (
            <p>
              Khôi phục toàn bộ bản lưu ngay trước lần nhập gần nhất? Những thay
              đổi sau lần nhập sẽ được thay bằng bản đó. Game sẽ tải lại.
            </p>
          )}
          <div className="tactical-backup-actions">
            <button
              className="tcg-button ghost"
              disabled={busy}
              onClick={() => {
                setPreview(null)
                setUndo(null)
              }}
            >
              Giữ dữ liệu hiện tại
            </button>
            <button
              className="tcg-button primary"
              disabled={busy}
              onClick={restore}
            >
              {busy
                ? "Đang lưu…"
                : preview
                  ? "Xác nhận nhập bản sao"
                  : "Xác nhận hoàn tác"}
            </button>
          </div>
        </Dialog>
      )}
    </article>
  )
}
