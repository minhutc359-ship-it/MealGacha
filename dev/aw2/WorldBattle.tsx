import { useCallback, useEffect, useRef, useState } from "react"
import { BattleCanvas } from "./BattleCanvas"
import { STARTER_ASSETS } from "../../src/aw2/assets/starters"
import {
  createCombatPresentation,
  reduceCombatPresentation,
} from "../../src/aw2/combat"
import { KITCHEN_BOSS_ID } from "../../src/aw2/world/ids"
import type { WorldBossEncounter } from "../../src/aw2/world/encounter"

const visualIds = { [KITCHEN_BOSS_ID]: "aw2-than" }
const labels = { [KITCHEN_BOSS_ID]: "Người Giữ Bàn Quên" }
interface Props {
  encounter: WorldBossEncounter
  busy: boolean
  error: string
  onFinish: () => void
  onReread: () => void
}

export function WorldBattle({
  encounter,
  busy,
  error,
  onFinish,
  onReread,
}: Props) {
  const [frame, setFrame] = useState(() => ({
    view: encounter.snapshot(),
    presentation: createCombatPresentation(),
  }))
  const current = useRef(frame)
  const [paused, setPaused] = useState(false)
  const [commandError, setCommandError] = useState("")
  const [reducedMotion, setReducedMotion] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  )
  const battle = frame.view.battle
  const finished = frame.view.retreated || battle.status !== "active"
  const command = useCallback(
    (kind: "advance" | "ultimate" | "retreat", actorId?: string) => {
      try {
        if (kind === "advance") encounter.advance()
        else if (kind === "ultimate") encounter.ultimate(actorId!)
        else encounter.retreat()
        const view = encounter.snapshot()
        const next = {
          view,
          presentation: reduceCombatPresentation(
            current.current.presentation,
            view.battle.events,
          ),
        }
        current.current = next
        setFrame(next)
        setCommandError("")
      } catch (cause) {
        setCommandError(
          cause instanceof Error
            ? cause.message
            : "Thao tác chưa thực hiện được.",
        )
      }
    },
    [encounter],
  )

  useEffect(() => {
    if (paused || finished) return
    const timer = window.setInterval(() => command("advance"), 650)
    return () => clearInterval(timer)
  }, [paused, finished, command])

  return (
    <main className="aw2-save aw2-battle" data-testid="world-battle">
      <p className="eyebrow">AW2-007C · THỬ THÁCH BÊN BẾP</p>
      <h1>Người Giữ Bàn Quên</h1>
      <p>
        Đội năm Vị Linh cấp 1 thử nghiệm tự chiến đấu; chọn thời điểm dùng tuyệt
        kỹ. Địch tạm dùng atlas Than đổi màu; hình ảnh và bộ chiêu boss riêng
        chưa hoàn tất. Chưa có XP hoặc vật phẩm.
      </p>
      <p>
        Điểm kiểm tra đã lưu. Tải lại giữa trận sẽ bỏ lượt đang chơi, trở về
        Phòng Bàn và không tính thắng.
      </p>
      <section
        className="aw2-battle-controls"
        aria-label="Điều khiển thử thách"
      >
        <button
          type="button"
          disabled={finished || busy}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? "Tiếp tục" : "Tạm dừng"}
        </button>
        <button
          type="button"
          disabled={!paused || finished || busy}
          onClick={() => command("advance")}
        >
          Bước 1 nhịp
        </button>
        <button
          type="button"
          disabled={finished || busy}
          onClick={() => command("retreat")}
        >
          Rút lui về Sân
        </button>
        <label>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(event) => setReducedMotion(event.target.checked)}
          />{" "}
          Giảm chuyển động
        </label>
      </section>
      <BattleCanvas
        battle={battle}
        presentation={frame.presentation}
        reducedMotion={reducedMotion}
        visualIds={visualIds}
        labels={labels}
      />
      <p data-testid="encounter-status" role="status">
        Nhịp {battle.tick} ·{" "}
        {frame.view.retreated
          ? "Đã rút lui"
          : battle.status === "player-win"
            ? "Đã thắng — cần lưu kết quả"
            : finished
              ? "Chưa vượt thử thách — trở về Sân"
              : "Đang chiến đấu"}
      </p>
      <section
        aria-label="Tuyệt kỹ đội năm Vị Linh"
        className="aw2-ultimate-grid"
      >
        {battle.actors
          .filter((actor) => actor.side === "player")
          .map((actor) => (
            <article key={actor.id}>
              <div>
                <strong>{STARTER_ASSETS[actor.spiritId].displayName}</strong>
                <small>
                  HP {actor.hp}/{actor.maxHp}
                </small>
              </div>
              <button
                type="button"
                data-testid={`world-ultimate-${actor.spiritId}`}
                disabled={
                  finished ||
                  busy ||
                  actor.hp <= 0 ||
                  actor.energy < 100 ||
                  !!actor.cast
                }
                onClick={() => command("ultimate", actor.id)}
              >
                Tuyệt kỹ · {actor.energy}/100
              </button>
            </article>
          ))}
      </section>
      {finished && (
        <button type="button" disabled={busy} onClick={onFinish}>
          Lưu kết quả và trở về
        </button>
      )}
      <button type="button" disabled={busy} onClick={onReread}>
        Đọc lại và rời trận
      </button>
      {busy && <p role="status">Đang lưu kết quả…</p>}
      {(error || commandError) && <p role="alert">{error || commandError}</p>}
    </main>
  )
}
