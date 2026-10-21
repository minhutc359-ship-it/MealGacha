import { StrictMode, useEffect, useReducer, useState } from "react"
import { createRoot } from "react-dom/client"
import { STARTER_ASSETS } from "../../src/aw2/assets/starters"
import type { StarterSpiritId } from "../../src/aw2/combat"
import { BattleCanvas } from "./BattleCanvas"
import { useBattleAudio } from "./useBattleAudio"
import {
  createBattlePreviewSession,
  reduceBattlePreviewSession,
} from "./battleSession"
import "./styles.css"

const LEVELS = [1, 5, 10, 20] as const

function BattlePreview() {
  const [level, setLevel] = useState(5)
  const [{ battle, presentation, level: activeLevel, message }, dispatch] =
    useReducer(reduceBattlePreviewSession, 5, createBattlePreviewSession)
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
    dispatch({ type: "reset", level })
    setPaused(false)
  }

  const step = () => {
    dispatch({ type: "advance", manual: true })
  }

  const ultimate = (actorId: string) => {
    dispatch({ type: "ultimate", actorId })
  }

  const playerRows = battle.actors.filter((actor) => actor.side === "player")

  return (
    <main className="aw2-save aw2-battle">
      <p className="eyebrow">AW2-007B · DEVELOPMENT-ONLY EVENT RENDERER</p>
      <h1>Giao ước bên bếp</h1>
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
            const spiritId = actor.spiritId as StarterSpiritId
            return (
              <article key={actor.id} data-testid={`unit-${spiritId}`}>
                <img
                  src={STARTER_ASSETS[spiritId].assets.portrait.url}
                  alt=""
                  width="72"
                  height="72"
                />
                <div>
                  <strong>{STARTER_ASSETS[spiritId].displayName}</strong>
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
