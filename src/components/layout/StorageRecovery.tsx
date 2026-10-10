import {saveFile} from "../../infrastructure/share/saveFile"
import { useState, useSyncExternalStore, type ReactNode } from "react"
import { useLocation } from "react-router-dom"
import { parseGame, GAME_KEY } from "../../game/storage"
import { migrateUserState } from "../../infrastructure/storage/repository"
import {
  getStorageIssues,
  subscribeStorageIssues,
  recoveryCandidates,
  exportRecovery,
  writeProtectedBatch,
  USER_KEY,
} from "../../infrastructure/storage/protectedStorage"
import type { GameSave } from "../../game/types"
import type { UserState } from "../../domain/models"
import "./storageRecovery.css"

export function StorageRecovery({ children }: { children: ReactNode }) {
  const issues = useSyncExternalStore(
    subscribeStorageIssues,
    getStorageIssues,
    getStorageIssues,
  )
  const [exported, setExported] = useState(false)
  const [message, setMessage] = useState("")
  const [input, setInput] = useState("")
  const [imported, setImported] = useState<{
    key: string
    value: unknown
  }[] | null>(null)
  const location = useLocation()
  if (!issues.length || location.pathname.startsWith("/legal/")) return children
  const download = async () => {
    try {
      await saveFile(new Blob([exportRecovery()],{type:"application/json"}),"SoulOfMeal-phuc-hoi.json")
      setExported(true)
    } catch {
      setMessage(
        "Chưa xuất được bản gốc. Hãy cho phép lưu dữ liệu rồi thử lại.",
      )
    }
  }
  const restore = (key: string, value: unknown) => {
    try {
      writeProtectedBatch([{ key, value }], true)
      window.location.reload()
    } catch {
      setMessage("Chưa lưu được bản phục hồi. Dữ liệu gốc vẫn được giữ.")
    }
  }
  const inspect = async () => {
    setImported(null)
    setMessage("")
    try {
      const raw = input.trim().startsWith("MGC1.")
        ? await (await import("../../game/saveCode")).readSaveCode(input.trim())
        : JSON.parse(input)
      const gameRaw =
        raw.save ?? raw.tcg ?? (raw.version === 1 ? raw : undefined)
      const userRaw = raw.user ?? (raw.schemaVersion ? raw : undefined)
      const game = gameRaw === undefined ? undefined : parseGame(gameRaw)
      const user = userRaw === undefined ? undefined : migrateUserState(userRaw)
      if (game === null || user === null || (!game && !user))
        throw new Error(
          "Bản lưu không hợp lệ hoặc thuộc phiên bản chưa hỗ trợ.",
        )
      setImported([
        ...(game ? [{ key: GAME_KEY, value: game }] : []),
        ...(user ? [{ key: USER_KEY, value: user }] : []),
      ])
      setMessage(
        "Bản lưu hợp lệ. Chỉ thay tiến trình khi bạn xác nhận bên dưới; ảnh đang có không bị xóa.",
      )
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Chưa đọc được bản lưu.",
      )
    }
  }
  return (
    <main className="save-recovery" aria-labelledby="recovery-title">
      <span className="save-recovery-mark" aria-hidden="true">
        ✦
      </span>
      <p className="save-recovery-kicker">
        Soul of Meal · Giữ hành trình của bạn
      </p>
      <h1 id="recovery-title">Bản lưu cần được kiểm tra</h1>
      <p>
        Game đã tạm dừng ghi tiến trình để bảo vệ bộ sưu tập và hành trình. Xuất
        bản gốc trước khi chọn bản muốn tiếp tục.
      </p>
      <button onClick={download}>Xuất bản gốc để phục hồi</button>
      {issues.map((issue) => {
        const candidates =
          issue.key === GAME_KEY
            ? recoveryCandidates<GameSave>(issue.key, parseGame)
            : recoveryCandidates<UserState>(issue.key, migrateUserState)
        return (
          <section key={issue.key}>
            <h2>
              {issue.key === USER_KEY
                ? "Rương, hồ sơ và khẩu vị"
                : "TCG và Chợ Đêm"}
            </h2>
            <p>{issue.message}</p>
            {candidates.map((candidate, i) => (
              <div className="save-recovery-option" key={i}>
                <p>
                  <strong>{candidate.label}</strong>
                  <br />
                  {"coins" in candidate.value
                    ? `${candidate.value.coins} xu · ${candidate.value.clearedStages.length} màn đã qua · ${Object.keys(candidate.value.cards).length} loại thẻ`
                    : `${candidate.value.displayName} · ${candidate.value.rewards.length} món · ${candidate.value.keys} chìa khóa`}
                </p>
                <button
                  disabled={!exported}
                  onClick={() => restore(issue.key, candidate.value)}
                >
                  Tiếp tục với bản này
                </button>
              </div>
            ))}
            {!candidates.length && (
              <p>
                Chưa tìm thấy bản hợp lệ. Giữ file phục hồi và nhập bản sao lưu
                bằng phiên bản phù hợp; không xóa dữ liệu website.
              </p>
            )}
          </section>
        )
      })}
      {message && <p role="alert">{message}</p>}
      <section>
        <h2>Nhập bản sao lưu của bạn</h2>
        <label htmlFor="recovery-import">Mã MGC1 hoặc JSON tiến trình</label>
        <textarea
          id="recovery-import"
          rows={4}
          value={input}
          onChange={(event) => {
            setInput(event.target.value)
            setImported(null)
          }}
          spellCheck={false}
        />
        <input
          type="file"
          accept=".json,.txt"
          aria-label="Chọn file tiến trình JSON hoặc mã MGC1"
          onChange={async (event) => {
            const file = event.target.files?.[0]
            if (file) {
              setInput(await file.text())
              setImported(null)
            }
          }}
        />
        <button disabled={!input.trim()} onClick={inspect}>
          Kiểm tra bản lưu
        </button>
        {imported && (
          <button
            disabled={!exported}
            onClick={() => {
              try {
                writeProtectedBatch(imported, true)
                window.location.reload()
              } catch {
                setMessage("Chưa lưu được bản nhập. Bản gốc vẫn được giữ.")
              }
            }}
          >
            Xác nhận thay bằng bản sao lưu này
          </button>
        )}
      </section>
      <p>
        <a href="/legal/privacy">Quyền riêng tư</a> ·{" "}
        <a
          href="https://github.com/minhutc359-ship-it/MealGacha/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          Yêu cầu hỗ trợ
        </a>
        . Không đăng file tiến trình công khai.
      </p>
    </main>
  )
}
