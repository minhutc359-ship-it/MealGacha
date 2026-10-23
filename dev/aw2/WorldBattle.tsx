import { useCallback, useEffect, useRef, useState } from "react"
import { BattleCanvas } from "./BattleCanvas"
import { ROSTER_ASSETS } from "../../src/aw2/assets/roster"
import {
  nhienBusy,
  createCombatPresentation,
  reduceCombatPresentation,
} from "../../src/aw2/combat"
import { KITCHEN_BOSS_ID } from "../../src/aw2/world/ids"
import type { WorldBossEncounter } from "../../src/aw2/world/encounter"
import { useBattleAudio } from "./useBattleAudio"
import { BossTelegraph } from "./BossTelegraph"

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
  const rematch = frame.view.purpose === "rematch"
  const finished = frame.view.retreated || battle.status !== "active"
  const audio = useBattleAudio(battle, paused || finished)
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
    <main
      className="aw2-save aw2-battle"
      data-testid="world-battle"
      data-purpose={frame.view.purpose}
      data-boss-position={
        battle.actors.find((actor) => actor.id === KITCHEN_BOSS_ID)?.position
      }
    >
      <p className="eyebrow">
        {rematch ? "ĐẤU LẠI BOSS · LUYỆN ĐỘI HÌNH" : "THỬ THÁCH BÊN BẾP"}
      </p>
      <h1>Người Giữ Bàn Quên</h1>
      {rematch && (
        <p role="note">
          Lượt luyện tập không nhận EXP, vật phẩm hoặc phần thưởng. Thắng, thua
          hoặc rút lui đều trở về Phòng Bàn; giữ nguyên kết thúc và đội hình đã
          lưu.
        </p>
      )}
      <details className="aw2-combat-help">
        <summary>Cách chơi và điểm lưu</summary>
        <p>
          Đội tự chiến đấu với cấp đã tích lũy. Chọn thời điểm dùng tuyệt kỹ để
          bảo vệ cả đội. Mời hụt và Tắt bếp báo trước ba nhịp; đợi Ghế trống vỡ
          rồi dùng tuyệt kỹ gây sát thương. Boss có bộ hình tham chiếu riêng.
        </p>
        <p>
          Điểm kiểm tra đã lưu. Tải lại giữa trận sẽ bỏ lượt đang chơi, trở về
          Phòng Bàn và không ghi nhận kết quả lượt này.
        </p>
      </details>
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
          {rematch ? "Rút lui về Phòng Bàn" : "Rút lui về Sân"}
        </button>
        <label>
          <input
            type="checkbox"
            checked={audio.enabled}
            onChange={audio.toggle}
          />{" "}
          Âm thanh
        </label>
        <label>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(event) => setReducedMotion(event.target.checked)}
          />{" "}
          Giảm chuyển động
        </label>
      </section>
      <BossTelegraph battle={battle} stopped={frame.view.retreated} />
      <nav className="aw2-battle-jumps" aria-label="Chuyển vùng trận đấu">
        <a href="#battle-ultimates">Đến tuyệt kỹ</a>
        <a href="#battle-arena">Đến đấu trường</a>
      </nav>
      <BattleCanvas
        battle={battle}
        presentation={frame.presentation}
        reducedMotion={reducedMotion}
        paused={paused || finished}
        stopped={frame.view.retreated}
        labels={labels}
      />
      <p data-testid="encounter-status" role="status">
        Nhịp {battle.tick} ·{" "}
        {frame.view.retreated
          ? "Đã rút lui"
          : battle.status === "player-win"
            ? "Đã thắng — cần lưu kết quả"
            : finished
              ? rematch
                ? "Lượt luyện tập đã kết thúc — trở về Phòng Bàn"
                : "Chưa vượt thử thách — trở về Sân"
              : "Đang chiến đấu"}
      </p>
      <section
        aria-label="Tuyệt kỹ đội năm Vị Linh"
        className="aw2-ultimate-grid"
        id="battle-ultimates"
        tabIndex={-1}
      >
        {battle.actors
          .filter((actor) => actor.side === "player")
          .map((actor) => (
            <article
              key={actor.id}
              data-testid={`world-unit-${actor.spiritId}`}
              data-state={JSON.stringify(actor)}
            >
              <img
                src={ROSTER_ASSETS[actor.spiritId].assets.portrait.url}
                alt=""
                width={64}
                height={64}
              />
              <div>
                <strong>{ROSTER_ASSETS[actor.spiritId].displayName}</strong>
                <small>
                  HP {actor.hp}/{actor.maxHp}
                  {actor.spiritId === "aw2-van"
                    ? ` · Nhấn ${actor.vanEmphasis === "attack" ? "Tấn công" : "Bảo hộ"}`
                    : ""}
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
                  !!actor.cast ||
                  !!actor.lienUltimate ||
                  !!actor.mocBurst ||
                  !!actor.bachStrike ||
                  nhienBusy(actor, battle.tick)
                }
                onClick={() => command("ultimate", actor.id)}
              >
                Tuyệt kỹ · {actor.energy}/100
              </button>
            </article>
          ))}
      </section>
      {audio.error && <p role="status">{audio.error}</p>}
      {finished && (
        <section
          aria-label="Kết quả lượt đấu này"
          data-testid="battle-outcome-summary"
        >
          <h2>Kết quả lượt đấu này</h2>
          <p data-testid="battle-survivors">
            Đồng đội còn đứng:{" "}
            {
              battle.actors.filter(
                (actor) => actor.side === "player" && actor.hp > 0,
              ).length
            }
            /5
          </p>
          {battle.actors
            .filter((actor) => actor.id === KITCHEN_BOSS_ID)
            .map((boss) => (
              <p key={boss.id} data-testid="battle-boss-hp">
                Máu boss còn lại: {boss.hp}/{boss.maxHp}
              </p>
            ))}
          <p>
            Sau khi trở về, mở Đội và túi đồ để xem vai trò, chỉ số hoặc chọn
            đội khởi đầu rồi lưu cho trận mới.
          </p>
        </section>
      )}
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
