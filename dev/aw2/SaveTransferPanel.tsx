import { useEffect, useRef, useState } from "react"
import type { SaveSnapshot } from "../../src/aw2/save/schema"
import {
  exportAw2Backup,
  inspectAw2Backup,
  AW2_BACKUP_MAX_BYTES,
} from "../../src/aw2/save/transfer"
import { sceneName } from "../../src/aw2/world/scene"

export function SaveTransferPanel({
  snapshot,
  busy,
  onRestore,
}: {
  snapshot: SaveSnapshot
  busy: boolean
  onRestore: (raw: string) => Promise<void>
}) {
  const [candidate, setCandidate] =
    useState<Awaited<ReturnType<typeof inspectAw2Backup>> | null>(null)
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState("")
  const [backupUrl, setBackupUrl] = useState("")
  const urlRef = useRef("")
  const mounted = useRef(true)
  const request = useRef(0)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      request.current++
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [])
  async function prepareExport() {
    setWorking(true)
    setMessage("")
    try {
      const text = await exportAw2Backup(snapshot)
      if (!mounted.current) return
      const url = URL.createObjectURL(
        new Blob([text], { type: "application/json" }),
      )
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      urlRef.current = url
      setBackupUrl(url)
      setMessage("Bản sao lưu đã sẵn sàng. Tải về và giữ ở nơi riêng tư.")
    } catch (error) {
      if (mounted.current)
        setMessage(
          error instanceof Error ? error.message : "Chưa tạo được bản sao lưu.",
        )
    } finally {
      if (mounted.current) setWorking(false)
    }
  }
  async function inspect(file: File | undefined) {
    const sequence = ++request.current
    setCandidate(null)
    if (!file) return
    setWorking(true)
    setMessage("")
    try {
      if (file.size > AW2_BACKUP_MAX_BYTES)
        throw Error("Chọn bản sao lưu nhỏ hơn 256 KB.")
      const next = await inspectAw2Backup(await file.text())
      if (mounted.current && sequence === request.current) setCandidate(next)
    } catch (error) {
      if (mounted.current && sequence === request.current)
        setMessage(
          error instanceof Error ? error.message : "Chưa đọc được tệp.",
        )
    } finally {
      if (mounted.current && sequence === request.current) setWorking(false)
    }
  }
  async function restore() {
    if (!candidate) return
    setWorking(true)
    try {
      await onRestore(candidate.raw)
      if (mounted.current) {
        setCandidate(null)
        setMessage("Đã khôi phục hành trình.")
      }
    } catch (error) {
      if (mounted.current)
        setMessage(
          error instanceof Error
            ? error.message
            : "Chưa khôi phục được hành trình.",
        )
    } finally {
      if (mounted.current) setWorking(false)
    }
  }
  return (
    <details className="aw2-save-transfer">
      <summary>Sao lưu và chuyển thiết bị</summary>
      <p>
        Tệp chứa tiến trình đã lưu, đội và túi đồ. Bấm Lưu vị trí trước khi sao
        lưu nếu bạn vừa di chuyển.
      </p>
      <button
        type="button"
        disabled={busy || working || snapshot.status !== "ready"}
        onClick={() => void prepareExport()}
      >
        Chuẩn bị bản sao lưu
      </button>
      {backupUrl && (
        <a href={backupUrl} download="Soul-of-Meal-hanh-trinh.json">
          Tải bản sao lưu JSON
        </a>
      )}
      <label>
        Chọn bản sao lưu để khôi phục
        <input
          type="file"
          accept="application/json,.json"
          disabled={busy || working}
          onChange={(event) => {
            void inspect(event.target.files?.[0])
            event.target.value = ""
          }}
        />
      </label>
      {candidate && (
        <div className="aw2-restore-confirmation">
          <p>
            {sceneName(candidate.save.progress)} · nhiệm vụ{" "}
            {candidate.save.progress.questIndex}/4 ·{" "}
            {candidate.save.economy.teamExperience} EXP.
          </p>
          <p>
            Khôi phục sẽ thay hành trình hiện tại bằng tệp này. Bản hiện tại
            được giữ ở bản an toàn.
          </p>
          <button
            type="button"
            disabled={busy || working}
            onClick={() => void restore()}
          >
            Xác nhận khôi phục hành trình
          </button>
          <button
            type="button"
            disabled={busy || working}
            onClick={() => {
              request.current++
              setCandidate(null)
            }}
          >
            Hủy khôi phục
          </button>
        </div>
      )}
      <p role="status" aria-live="polite">
        {working ? "Đang kiểm tra bản sao lưu…" : message}
      </p>
    </details>
  )
}
