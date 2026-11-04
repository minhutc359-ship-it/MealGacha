import { useMemo, useState } from "react"
import {
  createTacticalBattle,
  playAutomaticRound,
  reduceTacticalBattle,
  type CreateBattleOptions,
  type TacticalBattleState,
  type TrapId,
} from "../../game/tacticalTcg/engine"
import { claimBattleReward } from "../../game/tacticalTcg/progression"
import "../../game/tacticalBattle.css"

const TUTORIAL_KEY = "soul-of-meal.tactical-tcg.battle-tutorial.v1"
interface TrapChoice {
  id: TrapId
  name: string
  detail: string
}
const TRAPS: TrapChoice[] = [
  { id: "bamboo-guard", name: "Mành Tre", detail: "Chắn 20 sát thương" },
  {
    id: "steam-counter",
    name: "Hơi Nóng",
    detail: "Phản lại 12 sát thương",
  },
  { id: "warm-broth", name: "Nước Dùng", detail: "Hồi 18 khi nguy cấp" },
]

export function TacticalBattleScreen({
  options,
  mangaChapterId,
  onProgress,
}: {
  options?: Partial<CreateBattleOptions>
  mangaChapterId?: string | null
  onProgress?: () => void
}) {
  const battleId = options?.battleId ?? "practice-v1",
    initial = useMemo(
      () =>
        createTacticalBattle({
          battleId,
          mode: options?.mode ?? "campaign",
          nodeId: options?.nodeId ?? null,
          seed: options?.seed,
          player: options?.player,
          enemy: options?.enemy,
          boss: options?.boss,
        }),
      [battleId],
    )
  const [battle, setBattle] = useState<TacticalBattleState>(initial),
    [selected, setSelected] = useState<string | null>(null),
    [trapColumn, setTrapColumn] = useState<0 | 1 | 2 | 3>(1),
    [showTutorial, setShowTutorial] = useState(
      () => localStorage.getItem(TUTORIAL_KEY) !== "done",
    ),
    [claimStatus, setClaimStatus] = useState("")
  const living = (side: "player" | "enemy") =>
    battle.units.filter((unit) => unit.side === side && !unit.defeated)
  const selectedUnit = battle.units.find(
      (unit) => unit.instanceId === selected && !unit.defeated,
    ),
    activeTrap = battle.traps.find(
      (trap) => trap.side === "player" && trap.armed,
    )
  const move = (row: 0 | 1, column: 0 | 1 | 2 | 3) => {
    if (selected)
      setBattle((current) =>
        reduceTacticalBattle(current, {
          id: `move:${current.round}:${selected}:${row}:${column}`,
          type: "move",
          unitId: selected,
          cell: { row, column },
        }),
      )
  }
  const placeTrap = (trapId: TrapId) => {
    const column = selectedUnit?.cell.column ?? trapColumn
    setTrapColumn(column)
    setBattle((current) =>
      reduceTacticalBattle(current, {
        id: `trap:${current.round}:${trapId}:${column}:${current.processedActionIds.length}`,
        type: "place-trap",
        side: "player",
        trapId,
        column,
      }),
    )
  }
  const closeTutorial = () => {
    localStorage.setItem(TUTORIAL_KEY, "done")
    setShowTutorial(false)
  }
  const claim = () => {
    if (!battle.reward) return
    try {
      const result = claimBattleReward(
        localStorage,
        battle.reward,
        mangaChapterId,
      )
      setClaimStatus(
        result.status === "duplicate"
          ? "Phần thưởng này đã được ghi nhận trước đó."
          : `Đã nhận ${battle.reward.tinhVi} Tinh Vị và lưu an toàn.`,
      )
      onProgress?.()
    } catch (error) {
      setClaimStatus(
        error instanceof Error
          ? error.message
          : "Chưa lưu được phần thưởng; bạn có thể thử lại.",
      )
    }
  }
  return (
    <section
      className="tactical-battle"
      aria-label="Bàn Linh Chiến 4 x 2"
      data-phase={battle.phase}
      data-boss-phase={battle.boss?.phase ?? undefined}
    >
      <header className="tactical-battle__header">
        <div>
          <small>
            VÒNG {battle.round} · {battle.phase.toUpperCase()}
          </small>
          <h1>Linh Chiến 4×2</h1>
        </div>
        <div className="tactical-commanders">
          <span>
            Bạn <b>{battle.commanders.player.hp}</b>
          </span>
          <span>
            Địch <b>{battle.commanders.enemy.hp}</b>
          </span>
        </div>
      </header>
      {showTutorial && (
        <aside className="tactical-tutorial" aria-label="Hướng dẫn trận đầu">
          <div>
            <strong>Trận đầu trong 30 giây</strong>
            <span>1. Dàn Vị Linh · 2. Chọn cột và đặt bẫy</span>
            <span>3. Giao chiến · 4. Tung Tuyệt kỹ khi đủ 100 ⚡</span>
          </div>
          <button onClick={closeTutorial} aria-label="Đã hiểu hướng dẫn">
            Đã hiểu
          </button>
        </aside>
      )}
      <div className="tactical-trap-bar" aria-label="Bẫy phản ứng">
        <div className="tactical-trap-columns" aria-label="Cột đặt bẫy">
          {([0, 1, 2, 3] as const).map((column) => (
            <button
              key={column}
              className={trapColumn === column ? "is-active" : ""}
              onClick={() => setTrapColumn(column)}
              disabled={battle.phase !== "planning"}
              aria-label={`Chọn cột ${column + 1}`}
            >
              {column + 1}
            </button>
          ))}
        </div>
        {TRAPS.map((trap) => (
          <button
            key={trap.id}
            className={activeTrap?.trapId === trap.id ? "is-active" : ""}
            onClick={() => placeTrap(trap.id)}
            disabled={battle.phase !== "planning"}
          >
            <strong>{trap.name}</strong>
            <small>{trap.detail}</small>
          </button>
        ))}
      </div>
      {battle.lastReaction && battle.phase !== "planning" && (
        <p className="tactical-reaction-banner" role="status">
          {battle.lastReaction}
        </p>
      )}
      <div className="tactical-arena">
        {(["enemy", "player"] as const).map((side) => (
          <div className={`tactical-board tactical-board--${side}`} key={side}>
            {([0, 1] as const).flatMap((row) =>
              ([0, 1, 2, 3] as const).map((column) => {
                const unit = living(side).find(
                    (item) =>
                      item.cell.row === row && item.cell.column === column,
                  ),
                  trap = battle.traps.find(
                    (item) =>
                      item.armed &&
                      item.side === side &&
                      item.column === column,
                  )
                return (
                  <div
                    key={`${row}-${column}`}
                    className={`tactical-cell ${
                      selected === unit?.instanceId ? "is-selected" : ""
                    }`}
                  >
                    <button
                      className="tactical-cell__select"
                      onClick={() =>
                        unit && side === "player"
                          ? setSelected(unit.instanceId)
                          : move(row, column)
                      }
                      aria-label={`Ô ${row + 1}-${column + 1}`}
                    >
                      {unit && (
                        <article
                          className={`tactical-unit tactical-unit--${unit.role}`}
                        >
                          <img src={unit.art} alt="" draggable={false} />
                          <strong>
                            {unit.name} <i>{"★".repeat(unit.star)}</i>
                          </strong>
                          <span className="tactical-meter">
                            <i
                              style={{
                                width: `${(unit.hp / unit.maxHp) * 100}%`,
                              }}
                            />
                          </span>
                          <small>
                            {unit.hp}/{unit.maxHp} · ⚡{unit.energy}
                          </small>
                          {battle.boss?.unitId === unit.instanceId && (
                            <b className="tactical-boss-badge">
                              {battle.boss.title} · Pha {battle.boss.phase}
                            </b>
                          )}
                        </article>
                      )}
                    </button>
                    {trap && row === 0 && (
                      <span
                        className="tactical-trap-marker"
                        aria-label="Bẫy đã đặt"
                      >
                        ◆
                      </span>
                    )}
                    {side === "player" &&
                      unit &&
                      unit.energy >= 100 &&
                      ["reaction", "ultimate"].includes(battle.phase) && (
                        <button
                          className="tactical-ultimate"
                          onClick={() =>
                            setBattle((current) =>
                              reduceTacticalBattle(current, {
                                id: `ult:${current.round}:${unit.instanceId}`,
                                type: "ultimate",
                                unitId: unit.instanceId,
                              }),
                            )
                          }
                        >
                          Tuyệt kỹ
                        </button>
                      )}
                  </div>
                )
              }),
            )}
          </div>
        ))}
      </div>
      <footer className="tactical-controls">
        {battle.phase !== "result" ? (
          <>
            <button
              className="tcg-button primary"
              onClick={() =>
                setBattle((current) => playAutomaticRound(current))
              }
            >
              {battle.phase === "planning"
                ? `Giao chiến vòng ${battle.round}`
                : `Kết thúc vòng ${battle.round}`}
            </button>
            <p>
              {battle.phase === "planning"
                ? "Chọn Vị Linh rồi chọn ô trống để đổi đội hình. Đặt một bẫy trước khi giao chiến."
                : "Cửa sổ phản ứng đang mở: tung Tuyệt kỹ đã đầy hoặc kết thúc vòng."}
            </p>
          </>
        ) : (
          <div className="tactical-result" role="status">
            <h2>
              {battle.winner === "player"
                ? "Chiến thắng — Giao ước được giữ"
                : "Đội hình tan vỡ"}
            </h2>
            {battle.reward && (
              <button className="tcg-button primary" onClick={claim}>
                Nhận {battle.reward.tinhVi} Tinh Vị
              </button>
            )}
            <button
              className="tcg-button ghost"
              onClick={() => {
                setBattle(initial)
                setSelected(null)
                setClaimStatus("")
              }}
            >
              Đấu lại
            </button>
            {claimStatus && <p>{claimStatus}</p>}
          </div>
        )}
      </footer>
      <details className="tactical-log">
        <summary>Nhật ký giao chiến</summary>
        {battle.log.slice(-8).map((entry) => (
          <p key={entry.id}>{entry.text}</p>
        ))}
      </details>
    </section>
  )
}
