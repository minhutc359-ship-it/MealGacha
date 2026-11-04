import { useMemo, useState } from "react"
import {
  createTacticalBattle,
  playAutomaticRound,
  reduceTacticalBattle,
  type CreateBattleOptions,
  type TacticalBattleState,
} from "../../game/tacticalTcg/engine"
import { claimBattleReward } from "../../game/tacticalTcg/progression"
import "../../game/tacticalBattle.css"
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
        }),
      [battleId],
    )
  const [battle, setBattle] = useState<TacticalBattleState>(initial),
    [selected, setSelected] = useState<string | null>(null),
    [claimStatus, setClaimStatus] = useState("")
  const living = (side: "player" | "enemy") =>
    battle.units.filter((unit) => unit.side === side && !unit.defeated)
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
    <section className="tactical-battle" aria-label="Bàn Linh Chiến 4 x 2">
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
      <div className="tactical-arena">
        {(["enemy", "player"] as const).map((side) => (
          <div className={`tactical-board tactical-board--${side}`} key={side}>
            {([0, 1] as const).flatMap((row) =>
              ([0, 1, 2, 3] as const).map((column) => {
                const unit = living(side).find(
                  (item) =>
                    item.cell.row === row && item.cell.column === column,
                )
                return (
                  <button
                    key={`${row}-${column}`}
                    className={`tactical-cell ${
                      selected === unit?.instanceId ? "is-selected" : ""
                    }`}
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
                        {side === "player" && unit.energy >= 100 && (
                          <button
                            className="tactical-ultimate"
                            onClick={(event) => {
                              event.stopPropagation()
                              setBattle((current) =>
                                reduceTacticalBattle(current, {
                                  id: `ult:${current.round}:${unit.instanceId}`,
                                  type: "ultimate",
                                  unitId: unit.instanceId,
                                }),
                              )
                            }}
                          >
                            Tuyệt kỹ
                          </button>
                        )}
                      </article>
                    )}
                  </button>
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
              Giao chiến vòng {battle.round}
            </button>
            <p>
              Chọn Vị Linh rồi chọn ô trống để đổi đội hình. Mục tiêu ưu tiên
              hàng trước cùng cột.
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
