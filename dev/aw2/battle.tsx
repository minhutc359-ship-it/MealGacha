import { StrictMode, useEffect, useReducer, useState } from "react"
import { createRoot } from "react-dom/client"
import { ROSTER_ASSETS } from "../../src/aw2/assets/roster"
import type { CombatSpiritId } from "../../src/aw2/combat"
import { nhienBusy } from "../../src/aw2/combat"
import { BattleCanvas } from "./BattleCanvas"
import { useBattleAudio } from "./useBattleAudio"
import {
  createBattlePreviewSession,
  reduceBattlePreviewSession,
} from "./battleSession"
import "./styles.css"

const LEVELS = [1, 5, 10, 20] as const

function BattlePreview() {
  const practice =
    new URLSearchParams(location.search).get("team") === "muoi"
      ? "muoi"
      : new URLSearchParams(location.search).get("team") === "nhien"
        ? "nhien"
        : undefined
  const [level, setLevel] = useState(5)
  const [{ battle, presentation, level: activeLevel, message }, dispatch] =
    useReducer(reduceBattlePreviewSession, 5, (level) =>
      createBattlePreviewSession(level, practice),
    )
  const [skillTarget, setSkillTarget] = useState("enemy-than")
  const [paused, setPaused] = useState(false)
  const audio = useBattleAudio(battle, paused)
  const [reducedMotion, setReducedMotion] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  )

  useEffect(() => {
    if (paused || battle.status !== "active") return
    const interval = window.setInterval(() => {
      dispatch({ type: "advance" })
    }, 650)
    return () => window.clearInterval(interval)
  }, [paused, battle.status])

  const reset = () => {
    dispatch({ type: "reset", level, practice })
    setPaused(false)
  }

  const step = () => {
    dispatch({ type: "advance", manual: true })
  }

  const ultimate = (actorId: string) => {
    dispatch({
      type: "ultimate",
      actorId,
      ...(["player-aw2-muoi", "player-aw2-nhien"].includes(actorId)
        ? { targetId: skillTarget }
        : {}),
    })
  }

  const playerRows = battle.actors.filter((actor) => actor.side === "player")
  const nhien = playerRows.find((actor) => actor.spiritId === "aw2-nhien")

  return (
    <main className="aw2-save aw2-battle">
      <p className="eyebrow">AW2-007B · DEVELOPMENT-ONLY EVENT RENDERER</p>
      <h1>
        {practice === "nhien"
          ? "Luyện kỹ năng Nhiên"
          : practice
            ? "Luyện kỹ năng Muối Đen"
            : "Giao ước bên bếp"}
      </h1>
      <p>
        <a
          href={
            practice ? "/dev/aw2/battle.html" : "/dev/aw2/battle.html?team=muoi"
          }
        >
          {practice ? "Trở về đội khởi đầu" : "Luyện kỹ năng Muối Đen"}
        </a>{" "}
        · <a href="/dev/aw2/world.html">Về hành trình</a> ·{" "}
        <a href="/dev/aw2/battle.html?team=nhien">Luyện kỹ năng Nhiên</a>
      </p>
      {practice === "muoi" && (
        <p>
          Đội luyện tạm có 5 người, thay Sương Lành bằng Muối Đen. Dấu giảm
          công20%, gia hạn có giới hạn; tuyệt kỹ bóc một phần khiên thường.
          Trang này không cấp nhân vật hoặc ghi save.
        </p>
      )}
      {practice === "nhien" && (
        <p>
          Đội luyện 5 người thay Lửa Nhỏ bằng Nhiên. Chuỗi cận chiến và ba nhịp
          tuyệt kỹ có hồi thế; đánh trúng hai địch khác nhau mới hồi năng lượng
          có giới hạn. Có thể thử ngắt chuỗi, không cấp nhân vật hay ghi save.
        </p>
      )}
      <p className="note">
        Canvas chỉ trình bày event đã được combat core quyết định. Cấp và chỉ số
        dùng <code>aw2-leveling-development-v1</code>; không ghi XP, phần thưởng
        hoặc save. Phe địch tạm tái dùng atlas starter với màu phân biệt, chưa
        phải asset địch hoàn chỉnh.
      </p>

      <section className="aw2-battle-controls" aria-label="Điều khiển trận đấu">
        <label>
          <input
            type="checkbox"
            checked={audio.enabled}
            onChange={audio.toggle}
          />{" "}
          Âm thanh
        </label>
        {audio.error && <p role="status">{audio.error}</p>}
        <label>
          Cấp thử nghiệm
          <select
            value={level}
            onChange={(event) => setLevel(Number(event.target.value))}
          >
            {LEVELS.map((option) => (
              <option key={option} value={option}>
                Cấp {option}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={reset}>
          Tạo lại trận
        </button>
        <button type="button" onClick={() => setPaused((value) => !value)}>
          {paused ? "Tiếp tục" : "Tạm dừng"}
        </button>
        <button
          type="button"
          onClick={step}
          disabled={!paused || battle.status !== "active"}
        >
          Bước 1 nhịp
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

      <nav className="aw2-battle-jumps" aria-label="Chuyển vùng trận đấu">
        <a href="#battle-ultimates">Đến tuyệt kỹ</a>
        <a href="#battle-arena">Đến đấu trường</a>
      </nav>
      {practice === "muoi" && (
        <section className="actions" aria-label="Thử kỹ năng Muối Đen">
          <label>
            Mục tiêu Muối Đen
            <select
              aria-label="Mục tiêu Muối Đen"
              value={skillTarget}
              onChange={(event) => setSkillTarget(event.target.value)}
            >
              {battle.actors
                .filter((a) => a.side === "enemy")
                .map((a) => (
                  <option key={a.id} value={a.id} disabled={a.hp <= 0}>
                    {ROSTER_ASSETS[a.spiritId]?.displayName ?? a.id}
                    {a.hp <= 0 ? " · đã gục" : ""}
                  </option>
                ))}
            </select>
          </label>
          <button
            data-testid="muoi-cleanse"
            disabled={
              battle.status !== "active" ||
              !battle.actors.some(
                (a) =>
                  a.id === skillTarget &&
                  Object.keys(a.muoiMarks ?? {}).length > 0,
              )
            }
            onClick={() => dispatch({ type: "cleanse", targetId: skillTarget })}
          >
            Đối thủ tẩy dấu
          </button>
        </section>
      )}

      {practice === "muoi" && (
        <p
          data-testid="muoi-mark-state"
          data-marks={JSON.stringify(
            battle.actors.flatMap((target) =>
              Object.entries(target.muoiMarks ?? {}).map(([source, mark]) => ({
                targetId: target.id,
                sourceId: source,
                ...mark,
              })),
            ),
          )}
        >
          Dấu đang có:{" "}
          {battle.actors
            .filter((target) => Object.keys(target.muoiMarks ?? {}).length > 0)
            .map(
              (target) =>
                `${ROSTER_ASSETS[target.spiritId]?.displayName ?? target.id} đến nhịp ${Object.values(target.muoiMarks!)[0].expiresAtTick}`,
            )
            .join("; ") || "chưa có"}
          .
        </p>
      )}

      {practice === "muoi" && (
        <section aria-label="Kết quả kỹ năng Muối Đen">
          <h2>Kỹ năng vừa xảy ra</h2>
          <ol data-testid="muoi-outcomes">
            {battle.events
              .filter(
                (event) =>
                  event.skillId?.startsWith("aw2-muoi:") && event.statusChange,
              )
              .slice(-6)
              .map((event) => (
                <li key={event.serial}>
                  Nhịp {event.tick}: {event.text}
                </li>
              ))}
          </ol>
        </section>
      )}

      {practice === "nhien" && nhien && (
        <section aria-label="Thử kỹ năng Nhiên">
          <div className="actions">
            <label>
              Mục tiêu Nhiên
              <select
                aria-label="Mục tiêu Nhiên"
                value={skillTarget}
                onChange={(e) => setSkillTarget(e.target.value)}
              >
                {battle.actors
                  .filter((a) => a.side === "enemy")
                  .map((a) => (
                    <option key={a.id} value={a.id} disabled={a.hp <= 0}>
                      {ROSTER_ASSETS[a.spiritId]?.displayName ?? a.id}
                      {a.hp <= 0 ? " · đã gục" : ""}
                    </option>
                  ))}
              </select>
            </label>
            <button
              data-testid="nhien-interrupt"
              disabled={
                battle.status !== "active" ||
                nhien.hp <= 0 ||
                !(nhien.cast || nhien.nhienSequence)
              }
              onClick={() => dispatch({ type: "interrupt-nhien" })}
            >
              Đối thủ ngắt nhịp
            </button>
          </div>
          <p data-testid="nhien-state" data-state={JSON.stringify(nhien)}>
            Năng lượng {nhien.energy}/100 ·{" "}
            {nhien.nhienSequence
              ? `Đang nối nhịp ${nhien.nhienSequence.nextIndex + 1}`
              : (nhien.nhienRecoveryUntilTick ?? 0) > battle.tick
                ? `Hồi thế đến nhịp ${nhien.nhienRecoveryUntilTick}`
                : nhien.cast
                  ? "Đang chuẩn bị"
                  : "Sẵn sàng"}{" "}
            · Bếp Đông đã hồi {nhien.nhienRhythm?.energyGranted ?? 0}/24 năng
            lượng.
          </p>
          <h2>Nhịp vừa xảy ra</h2>
          <ol data-testid="nhien-outcomes">
            {battle.events
              .filter(
                (event) =>
                  event.skillId?.startsWith("aw2-nhien:") &&
                  [
                    "hit",
                    "miss",
                    "status",
                    "interrupt",
                    "interrupt-resist",
                  ].includes(event.kind),
              )
              .slice(-8)
              .map((event) => (
                <li
                  key={event.serial}
                  data-kind={event.kind}
                  data-index={event.contactIndex}
                  data-action={event.actionId}
                >
                  Nhịp {event.tick}:{" "}
                  {event.contactIndex !== undefined
                    ? `điểm chạm ${event.contactIndex + 1} · `
                    : ""}
                  {event.text ??
                    (event.kind === "hit"
                      ? `trúng ${event.targetIds.join(", ")} · sát thương ${event.amount ?? 0}`
                      : event.kind)}
                </li>
              ))}
          </ol>
        </section>
      )}

      <BattleCanvas
        battle={battle}
        presentation={presentation}
        reducedMotion={reducedMotion}
        paused={paused}
      />
      <p data-testid="battle-message" role="status">
        {message}
      </p>
      <p className="aw2-battle-summary">
        <strong>Tick {battle.tick}</strong> · {battle.status} · event #
        {presentation.lastSerial} ·{" "}
        {Object.keys(presentation.projectiles).length} projectile đang bay
      </p>

      <section id="battle-ultimates" tabIndex={-1}>
        <h2>Tuyệt kỹ đội 5 Vị Linh</h2>
        <div className="aw2-ultimate-grid">
          {playerRows.map((actor) => {
            const spiritId = actor.spiritId as CombatSpiritId
            return (
              <article key={actor.id} data-testid={`unit-${spiritId}`}>
                <img
                  src={ROSTER_ASSETS[spiritId].assets.portrait.url}
                  alt=""
                  width="72"
                  height="72"
                />
                <div>
                  <strong>{ROSTER_ASSETS[spiritId].displayName}</strong>
                  <small>
                    {" "}
                    Cấp {activeLevel} · HP {actor.hp}/{actor.maxHp} · ATK{" "}
                    {actor.attack}
                  </small>
                </div>
                <button
                  type="button"
                  data-testid={`ultimate-${spiritId}`}
                  disabled={
                    actor.hp <= 0 ||
                    actor.energy < 100 ||
                    nhienBusy(actor, battle.tick) ||
                    battle.status !== "active"
                  }
                  onClick={() => ultimate(actor.id)}
                >
                  Tuyệt kỹ · {actor.energy}/100
                </button>
              </article>
            )
          })}
        </div>
      </section>

      <section>
        <h2>Event gần nhất</h2>
        <ol className="aw2-event-log" data-testid="event-log">
          {battle.events
            .slice(-8)
            .reverse()
            .map((item) => (
              <li key={item.serial}>
                <code>
                  #{item.serial} t{item.tick}
                </code>{" "}
                {item.kind} {item.skillId ?? ""} {item.text ?? ""}
              </li>
            ))}
        </ol>
      </section>
    </main>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BattlePreview />
  </StrictMode>,
)
