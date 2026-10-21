import { useEffect, useReducer, useRef, useState } from "react"
import { STARTER_ASSETS } from "../../src/aw2/assets/starters"
import {
  CHESS_UNITS,
  chessCapacity,
  chessUnit,
} from "../../src/aw2/chess/catalog"
import {
  applyChessCommand,
  chessOpponent,
  createChessSession,
  reduceChessSession,
} from "../../src/aw2/chess/rules"
import type {
  ChessActor,
  ChessCommand,
  ChessPiece,
} from "../../src/aw2/chess/types"
import "./chess.css"

interface Props {
  error: string
  onReturn: () => void
  onReread: () => void
}
interface PortraitProps {
  spiritId: string
  name: string
}
function ChessPortrait({ spiritId, name }: PortraitProps) {
  const [failed, setFailed] = useState(false)
  return failed ? (
    <span role="alert">Không tải được ảnh {name}.</span>
  ) : (
    <img
      src={STARTER_ASSETS[spiritId].assets.portrait.url}
      alt={`Ảnh tham chiếu ${name}`}
      onError={() => setFailed(true)}
    />
  )
}
export function ChessPractice({ error, onReturn, onReread }: Props) {
  const [session, dispatch] = useReducer(
    reduceChessSession,
    undefined,
    createChessSession,
  )
  const [selected, setSelected] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const game = session.game,
    planning = game.phase === "planning",
    fighting = game.phase === "battle",
    finished = game.phase === "finished"
  useEffect(() => {
    heading.current?.focus()
  }, [])
  useEffect(() => {
    if (!fighting || paused) return
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 650)
    return () => clearInterval(timer)
  }, [fighting, paused])
  const command = (action: ChessCommand) => {
    dispatch(action)
    setSelected(null)
  }
  const reason = (action: ChessCommand) => {
    try {
      applyChessCommand(game, action)
      return ""
    } catch (cause) {
      return cause instanceof Error ? cause.message : "Chưa thể thực hiện."
    }
  }
  const chosen = game.units.find((unit) => unit.uid === selected)
  const placed = game.units.filter((unit) => unit.cell !== null)
  const diversity = new Set(placed.map((unit) => unit.spiritId)).size
  const pieceLabel = (piece: ChessPiece) =>
    `${chessUnit(piece.spiritId).name} ${piece.stars} sao`
  const pieceView = (piece: ChessPiece) => (
    <>
      <ChessPortrait
        spiritId={piece.spiritId}
        name={chessUnit(piece.spiritId).name}
      />
      <strong>{pieceLabel(piece)}</strong>
    </>
  )
  const actorView = (actor: ChessActor) => (
    <article
      key={actor.uid}
      className={`chess-actor chess-${actor.side}`}
      data-actor-id={actor.uid}
    >
      <ChessPortrait
        spiritId={actor.spiritId}
        name={chessUnit(actor.spiritId).name}
      />
      <strong>
        {chessUnit(actor.spiritId).name} · {actor.stars}★
      </strong>
      <span>
        {actor.side === "player" ? "Bạn" : "Đối thủ"} · Máu {actor.health}/
        {actor.maxHealth} · Công {actor.attack} · Khiên {actor.shield}
      </span>
    </article>
  )
  const roundLabel =
    game.battle?.status === "player-win"
      ? "Bạn thắng vòng"
      : game.battle?.status === "opponent-win"
        ? "Bạn thua vòng"
        : "Vòng hòa"
  return (
    <main
      className="aw2-save chess-practice"
      data-testid="chess-practice"
      data-phase={game.phase}
      data-status={game.status}
      data-round={game.round}
      data-tick={game.battle?.tick ?? 0}
    >
      <p className="eyebrow">BÀN CỜ · ĐỘI MƯỢN</p>
      <h1 ref={heading} tabIndex={-1}>
        Auto Chess · Luyện tập
      </h1>
      <p>
        5 vòng với Vị Linh mượn. Vàng tại bàn chỉ dùng trong ván này; không tiêu
        túi đồ hoặc nhận thưởng hành trình. Rời bàn/tải lại sẽ bỏ ván.
      </p>
      <p role="status">
        Vòng {game.round}/5 · Máu {game.health}/12 · Vàng luyện tập{" "}
        <strong data-testid="chess-gold">{game.gold}</strong> ·{" "}
        {planning
          ? "Chuẩn bị đội"
          : fighting
            ? `Giao tranh · Nhịp ${game.battle!.tick}`
            : finished
              ? game.status === "player-win"
                ? "Bạn hoàn thành ván luyện tập"
                : "Bạn thua ván luyện tập"
              : roundLabel}
      </p>
      {error && <p role="alert">{error}</p>}
      {session.feedback && <p role="alert">{session.feedback}</p>}
      {planning && (
        <>
          <section aria-label="Quầy tuyển quân">
            <h2>Quầy tuyển quân</h2>
            <p>
              3 lá giữ trước từ nguồn hữu hạn; mỗi danh tính có 9 bản. Mua 3 bản
              một sao tự ghép 2 sao.
            </p>
            <div className="chess-shop">
              {game.offers.map((id, slot) => (
                <article
                  className="chess-card"
                  key={slot}
                  data-offer={id ?? "empty"}
                >
                  {id ? (
                    <>
                      <ChessPortrait spiritId={id} name={chessUnit(id).name} />
                      <h3>{chessUnit(id).name}</h3>
                      <p>
                        {chessUnit(id).cost} vàng · Nguồn còn {game.pool[id]}
                      </p>
                      <button
                        disabled={!!reason({ type: "buy", slot })}
                        onClick={() => command({ type: "buy", slot })}
                      >
                        Mua {chessUnit(id).name}
                      </button>
                      <small>{reason({ type: "buy", slot })}</small>
                    </>
                  ) : (
                    <p>Ô {slot + 1} đã mua</p>
                  )}
                </article>
              ))}
            </div>
            <div className="actions">
              <button
                disabled={!!reason({ type: "refresh" })}
                onClick={() => command({ type: "refresh" })}
              >
                Đổi quầy · 1 vàng
              </button>
              <button
                aria-pressed={game.locked}
                onClick={() => command({ type: "lock" })}
              >
                {game.locked ? "Mở khóa quầy" : "Khóa quầy"}
              </button>
            </div>
          </section>
          <section aria-label="Đội hình của bạn">
            <h2>
              Đội hình · {placed.length}/{chessCapacity(game.round)}
            </h2>
            <p>
              Hàng trước ở gần địch hơn. Đủ 3 danh tính khác nhau: cả đội +1
              công; đủ 5: thêm 2 máu.
            </p>
            <p data-testid="chess-diversity">
              Đa dạng {diversity}/5 ·{" "}
              {diversity >= 3 ? "+1 công" : "Chưa có cộng công"}
              {diversity === 5 ? ", +2 máu" : ""}
            </p>
            <p role="status">
              {chosen
                ? `Đang chọn ${pieceLabel(chosen)}. Chọn ô để xếp hoặc đổi chỗ.`
                : "Chọn quân ở hàng chờ hoặc trên bàn, rồi chọn ô đích."}
            </p>
            <div className="chess-formation">
              {Array.from({ length: 6 }, (_, cell) => {
                const piece = game.units.find((unit) => unit.cell === cell)
                return (
                  <button
                    key={cell}
                    data-cell={cell}
                    data-piece-id={piece?.uid}
                    data-spirit-id={piece?.spiritId}
                    data-stars={piece?.stars}
                    aria-pressed={!!piece && selected === piece.uid}
                    aria-label={`Ô ${cell + 1} ${
                      cell < 3 ? "hàng trước" : "hàng sau"
                    }${piece ? `: ${pieceLabel(piece)}` : ": trống"}`}
                    onClick={() =>
                      chosen
                        ? command({ type: "move", uid: chosen.uid, cell })
                        : piece && setSelected(piece.uid)
                    }
                  >
                    {piece ? (
                      pieceView(piece)
                    ) : (
                      <span>
                        Ô {cell + 1} · {cell < 3 ? "Trước" : "Sau"}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="actions">
              <button onClick={() => command({ type: "arrange" })}>
                Xếp đội gợi ý
              </button>
              {chosen && (
                <>
                  <button onClick={() => setSelected(null)}>
                    Hủy chọn quân
                  </button>
                  <button
                    disabled={
                      !!reason({ type: "move", uid: chosen.uid, cell: null })
                    }
                    onClick={() =>
                      command({ type: "move", uid: chosen.uid, cell: null })
                    }
                  >
                    Đưa về hàng chờ
                  </button>
                  <button
                    onClick={() => command({ type: "sell", uid: chosen.uid })}
                  >
                    Bán quân đã chọn ·{" "}
                    {chessUnit(chosen.spiritId).cost *
                      (chosen.stars === 2 ? 3 : 1)}{" "}
                    vàng
                  </button>
                </>
              )}
            </div>
          </section>
          <section aria-label="Hàng chờ">
            <h2>
              Hàng chờ ·{" "}
              {game.units.filter((unit) => unit.cell === null).length}/6
            </h2>
            <div className="chess-bench">
              {game.units
                .filter((unit) => unit.cell === null)
                .map((unit) => (
                  <button
                    key={unit.uid}
                    data-piece-id={unit.uid}
                    data-spirit-id={unit.spiritId}
                    data-stars={unit.stars}
                    aria-pressed={selected === unit.uid}
                    onClick={() => setSelected(unit.uid)}
                  >
                    {pieceView(unit)}
                  </button>
                ))}
            </div>
          </section>
          <section aria-label="Đội đối thủ vòng tới">
            <h2>Đội đối thủ vòng {game.round}</h2>
            <p>{chessOpponent(game.round).map(pieceLabel).join(" · ")}</p>
            <p>
              Cộng công vòng này: {[0, 0, 1, 1, 2][game.round - 1]}. Cùng luật
              kỹ năng và đa dạng với bạn.
            </p>
          </section>
          <div className="actions">
            <button
              disabled={!!reason({ type: "start" })}
              onClick={() => command({ type: "start" })}
            >
              Bắt đầu giao tranh
            </button>
          </div>
        </>
      )}
      {game.battle && (
        <section aria-label="Bàn giao tranh">
          <h2>
            {fighting ? "Giao tranh tự động" : roundLabel} · Nhịp{" "}
            {game.battle.tick}
          </h2>
          <p>
            Đối thủ ở phía trên, đội bạn phía dưới. Mỗi nhịp xử lý ý định
            đánh/hồi/khiên cùng lúc; thanh máu và nhật ký lấy từ luật thực.
          </p>
          <div className="chess-battle-grid">
            {[3, 2, 1, 0].flatMap((y) =>
              [0, 1, 2].map((x) => (
                <div
                  className="chess-battle-cell"
                  key={`${x}:${y}`}
                  data-battle-cell={`${x}:${y}`}
                >
                  {game
                    .battle!.actors.filter(
                      (actor) =>
                        actor.health > 0 && actor.x === x && actor.y === y,
                    )
                    .map(actorView)}
                </div>
              )),
            )}
          </div>
          {fighting && (
            <div className="actions">
              <button onClick={() => setPaused((value) => !value)}>
                {paused ? "Tiếp tục giao tranh" : "Tạm dừng giao tranh"}
              </button>
              <button
                disabled={!paused}
                onClick={() => command({ type: "tick" })}
              >
                Tiến một nhịp
              </button>
            </div>
          )}
          <ol className="chess-log">
            {game.battle.events.slice(-10).map((event, index) => (
              <li key={`${game.battle!.tick}:${index}`}>{event}</li>
            ))}
          </ol>
        </section>
      )}
      <div className="actions">
        {game.phase === "round-result" && (
          <button onClick={() => command({ type: "next" })}>
            Vòng tiếp · nhận 6 vàng
          </button>
        )}
        {finished ? (
          <button
            onClick={() => {
              setPaused(false)
              command({ type: "rematch" })
            }}
          >
            Chơi ván cờ mới
          </button>
        ) : (
          <button onClick={() => command({ type: "surrender" })}>
            Nhận thua ván cờ
          </button>
        )}
      </div>
      <details>
        <summary>Luật và kỹ năng cờ luyện tập</summary>
        <p>
          12 máu; thua vòng mất 3, hòa mất 1. Hết máu là thua ván; sống qua vòng
          5 là thắng ván. Tối đa 80 nhịp mỗi vòng. Hàng chờ 6, đội ra trận tăng
          3→4→5; chọn ô có quân sẽ đổi chỗ. Quân hồi đầy trước vòng sau.
        </p>
        <p>
          Vàng ban đầu 10, vòng mới thêm 6, đổi quầy tốn 1. Khóa giữ quầy qua
          vòng sau. Bán hoàn đủ vàng và trả bản vào nguồn. Các bản còn trong
          nguồn được rút đều; không dùng tỷ lệ gacha RPG. Ghép 3 bản 1 sao thành
          2 sao: máu ×1,8, công ×1,6 (làm tròn); không ghép 3 sao.
        </p>
        <ul>
          {CHESS_UNITS.map((unit) => (
            <li key={unit.id}>
              {unit.name}: {unit.cost} vàng, máu {unit.health}, công{" "}
              {unit.attack}, tầm {unit.range}. {unit.skill}
            </li>
          ))}
        </ul>
        <p>
          Tầm đánh tính theo số bước ngang/dọc. Ngoài tầm sẽ tìm ô trống gần mục
          tiêu hơn. Hồi máu được chặn ở máu tối đa trước khi nhận sát thương
          cùng nhịp; khiên tối đa 12. Thông số riêng cho cờ thử nghiệm, ảnh tham
          chiếu hiện có; chưa phải art/kỹ năng RPG hoàn tất.
        </p>
      </details>
      <details open>
        <summary>Nhật ký ván cờ</summary>
        <ol className="chess-log">
          {game.log.slice(-10).map((event, index) => (
            <li key={`${game.round}:${index}`}>{event}</li>
          ))}
        </ol>
      </details>
      <div className="actions">
        <button onClick={onReturn}>
          {finished ? "Trở về hành trình" : "Dừng ván cờ và về hành trình"}
        </button>
        <button onClick={onReread}>Đọc lại hành trình và rời bàn cờ</button>
      </div>
    </main>
  )
}
