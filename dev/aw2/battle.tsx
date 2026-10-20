import { StrictMode, useEffect, useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import { STARTER_ASSETS } from "../../src/aw2/assets/starters"
import {
  STARTER_SPIRIT_IDS,
  advanceCombatBattle,
  castCombatUltimate,
  createCombatBattle,
  createCombatPresentation,
  createDevelopmentStarterSeed,
  developmentStarterStats,
  experienceToReachLevel,
  reduceCombatPresentation,
  type CombatBattle,
  type CombatPresentation,
  type StarterSpiritId,
} from "../../src/aw2/combat"
import { BattleCanvas } from "./BattleCanvas"
import "./styles.css"

const LEVELS = [1, 5, 10, 20] as const

function createPreviewBattle(level: number): CombatBattle {
  const experience = experienceToReachLevel(level)
  const players = STARTER_SPIRIT_IDS.map((spiritId, slot) =>
    createDevelopmentStarterSeed(`player-${spiritId}`, spiritId, experience, {
      position: 12 + slot * 4,
      energy: 100,
      nextBasicTick: 1 + slot,
      nextAutoTick: 3 + slot,
    }),
  )
  const enemyScale = 1 + (level - 1) * 0.035
  return createCombatBattle({
    id: `aw2-007b-level-${level}`,
    players,
    enemies: [
      {
        id: "enemy-than",
        spiritId: "aw2-than",
        position: 82,
        hp: Math.round(440 * enemyScale),
        maxHp: Math.round(440 * enemyScale),
        attack: Math.round(27 * enemyScale),
        defense: Math.round(18 * enemyScale),
        nextBasicTick: 2,
        nextAutoTick: 5,
      },
      {
        id: "enemy-suong",
        spiritId: "aw2-suong",
        boss: true,
        position: 88,
        hp: Math.round(620 * enemyScale),
        maxHp: Math.round(620 * enemyScale),
        attack: Math.round(32 * enemyScale),
        defense: Math.round(14 * enemyScale),
        range: 42,
        projectileTicks: 2,
        nextBasicTick: 1,
        nextAutoTick: 4,
      },
      {
        id: "enemy-lua",
        spiritId: "aw2-lua",
        position: 76,
        hp: Math.round(360 * enemyScale),
        maxHp: Math.round(360 * enemyScale),
        attack: Math.round(34 * enemyScale),
        defense: Math.round(10 * enemyScale),
        nextBasicTick: 3,
        nextAutoTick: 6,
      },
    ],
  })
}

function BattlePreview() {
  const [level, setLevel] = useState(5)
  const [battle, setBattle] = useState(() => createPreviewBattle(5))
  const [presentation, setPresentation] = useState<CombatPresentation>(() =>
    createCombatPresentation(),
  )
  const [paused, setPaused] = useState(false)
  const [message, setMessage] = useState("Auto combat đang chạy.")
  const [reducedMotion, setReducedMotion] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  )

  const applyBattle = (next: CombatBattle) => {
    setPresentation((current) => reduceCombatPresentation(current, next.events))
    setBattle(next)
  }

  useEffect(() => {
    if (paused || battle.status !== "active") return
    const interval = window.setInterval(() => {
      setBattle((current) => {
        if (current.status !== "active") return current
        const next = advanceCombatBattle(current)
        setPresentation((view) => reduceCombatPresentation(view, next.events))
        return next
      })
    }, 650)
    return () => window.clearInterval(interval)
  }, [paused, battle.status])

  const reset = () => {
    setBattle(createPreviewBattle(level))
    setPresentation(createCombatPresentation())
    setPaused(false)
    setMessage(`Đã tạo trận development cấp ${level}; chưa ghi save/XP.`)
  }

  const step = () => {
    if (battle.status !== "active") return
    applyBattle(advanceCombatBattle(battle))
    setMessage("Đã xử lý đúng một tick từ combat core.")
  }

  const ultimate = (actorId: string, spiritId: StarterSpiritId) => {
    try {
      const target = battle.actors.find(
        (actor) => actor.side === "enemy" && actor.hp > 0,
      )
      const needsEnemy = spiritId === "aw2-lua" || spiritId === "aw2-suong"
      const next = castCombatUltimate(
        battle,
        actorId,
        needsEnemy ? target?.id : undefined,
      )
      applyBattle(next)
      setMessage(`${STARTER_ASSETS[spiritId].displayName} đã bắt đầu tuyệt kỹ.`)
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Không thể dùng tuyệt kỹ.",
      )
    }
  }

  const playerRows = useMemo(
    () => battle.actors.filter((actor) => actor.side === "player"),
    [battle],
  )

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

      <BattleCanvas
        battle={battle}
        presentation={presentation}
        reducedMotion={reducedMotion}
      />
      <p data-testid="battle-message" role="status">
        {message}
      </p>
      <p className="aw2-battle-summary">
        <strong>Tick {battle.tick}</strong> · {battle.status} · event #
        {presentation.lastSerial} ·{" "}
        {Object.keys(presentation.projectiles).length} projectile đang bay
      </p>

      <section>
        <h2>Tuyệt kỹ đội 5 Vị Linh</h2>
        <div className="aw2-ultimate-grid">
          {playerRows.map((actor) => {
            const spiritId = actor.spiritId as StarterSpiritId
            const progressionStats = developmentStarterStats(spiritId, level)
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
                    Cấp {level} · HP {actor.hp}/{actor.maxHp} · ATK{" "}
                    {progressionStats.attack}
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
                  onClick={() => ultimate(actor.id, spiritId)}
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
