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
import { ActivityFrame, ActivityPages, ActivityCopy } from "./ActivityFrame"

interface Props {
  compact?: boolean
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
export function ChessPractice({
  error,
  onReturn,
  onReread,
  compact = false,
}: Props) {
  const [page, setPage] = useState("shop")
  const [shopPage, setShopPage] = useState(0)
  const [benchPage, setBenchPage] = useState(0)
  const [actorPage, setActorPage] = useState(0)
  useEffect(() => {
    if (error && compact) setPage("notice")
  }, [error, compact])
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
    if (
      !fighting ||
      paused ||
      (compact && !["battle", "actors"].includes(page))
    )
      return
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 650)
    return () => clearInterval(timer)
  }, [fighting, paused, compact, page])
  const command = (action: ChessCommand) => {
    dispatch(action)
    setSelected(null)
    if (compact && action.type === "start") setPage("battle")
    if (compact && ["next", "rematch"].includes(action.type)) setPage("shop")
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
  if (compact)
    return (
      <ActivityFrame
        title="Auto Chess · Luyện tập"
        status={`Vòng ${game.round}/5 · ${game.health}♥ · ${game.gold} vàng · ${
          planning
            ? "Chuẩn bị"
            : fighting
              ? `Nhịp ${game.battle!.tick}`
              : finished
                ? game.status === "player-win"
                  ? "Hoàn thành"
                  : "Đã thua"
                : roundLabel
        }`}
        page={page}
        onPage={setPage}
        pages={[
          ["shop", "Quầy tuyển quân"],
          ["formation", "Đội hình"],
          ["bench", "Hàng chờ"],
          ["unit", "Quân đã chọn"],
          ["enemy", "Đội đối thủ"],
          ["battle", "Bàn giao tranh"],
          ["actors", "Máu và trạng thái quân"],
          ["actions", "Điều khiển ván cờ"],
          ["rules", "Luật và kỹ năng"],
          ["log", "Nhật ký"],
          ["notice", "Thông báo / đọc lại"],
        ]}
        data-testid="chess-practice"
        data-phase={game.phase}
        data-status={game.status}
        data-round={game.round}
        data-tick={game.battle?.tick ?? 0}
        footer={
          <>
            <button onClick={onReturn}>
              {finished ? "Trở về hành trình" : "Dừng ván cờ và về hành trình"}
            </button>
            {planning ? (
              <button
                disabled={!!reason({ type: "start" })}
                onClick={() => command({ type: "start" })}
              >
                Bắt đầu giao tranh
              </button>
            ) : fighting ? (
              <button
                onClick={() => {
                  if (paused || !["battle", "actors"].includes(page)) {
                    setPaused(false)
                    setPage("battle")
                  } else setPaused(true)
                }}
              >
                {paused || !["battle", "actors"].includes(page)
                  ? "Tiếp tục giao tranh"
                  : "Tạm dừng giao tranh"}
              </button>
            ) : game.phase === "round-result" ? (
              <button onClick={() => command({ type: "next" })}>
                Vòng tiếp · nhận 6 vàng
              </button>
            ) : (
              <button
                onClick={() => {
                  setPaused(false)
                  command({ type: "rematch" })
                }}
              >
                Chơi ván cờ mới
              </button>
            )}
          </>
        }
      >
        {page === "shop" &&
          (planning ? (
            <ActivityPages
              items={game.offers}
              page={shopPage}
              onPage={setShopPage}
              label="Quầy"
            >
              {(id, slot) =>
                id ? (
                  <article
                    className="aw2-shop-offer"
                    data-offer={id}
                    data-owned={game.units.some((u) => u.spiritId === id)}
                  >
                    <div className="aw2-activity-portrait">
                      <ChessPortrait spiritId={id} name={chessUnit(id).name} />
                      <h2>{chessUnit(id).name}</h2>
                    </div>
                    <p>
                      {chessUnit(id).cost} vàng · Nguồn {game.pool[id]} · Đang
                      có{" "}
                      {game.units
                        .filter((u) => u.spiritId === id)
                        .reduce((n, u) => n + (u.stars === 2 ? 3 : 1), 0)}{" "}
                      bản
                    </p>
                    <button
                      disabled={!!reason({ type: "buy", slot })}
                      onClick={() => command({ type: "buy", slot })}
                    >
                      Mua {chessUnit(id).name}
                    </button>
                    {reason({ type: "buy", slot }) && (
                      <p>{reason({ type: "buy", slot })}</p>
                    )}
                  </article>
                ) : (
                  <p>Ô {slot + 1} đã mua. Đổi quầy tại Điều khiển ván cờ.</p>
                )
              }
            </ActivityPages>
          ) : (
            <ActivityCopy text="Quầy chỉ mở trong giai đoạn chuẩn bị. Chọn Bàn giao tranh để xem trận hoặc Điều khiển ván cờ để thao tác." />
          ))}
        {page === "formation" &&
          (planning ? (
            <>
              <p>
                Đội {placed.length}/{chessCapacity(game.round)} · Đa dạng{" "}
                {diversity}/5
                {chosen
                  ? ` · Chọn ô cho ${chessUnit(chosen.spiritId).name}`
                  : ""}
              </p>
              <div className="chess-formation">
                {Array.from({ length: 6 }, (_, cell) => {
                  const piece = game.units.find((u) => u.cell === cell)
                  return (
                    <button
                      key={cell}
                      data-cell={cell}
                      data-piece-id={piece?.uid}
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
                      {piece
                        ? pieceView(piece)
                        : `Ô ${cell + 1} · ${cell < 3 ? "Trước" : "Sau"}`}
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <ActivityCopy text="Đội ra trận đã chốt cho vòng này. Chọn Máu và trạng thái quân để xem kết quả thực." />
          ))}
        {page === "bench" && (
          <ActivityPages
            items={game.units.filter((u) => u.cell === null)}
            page={benchPage}
            onPage={setBenchPage}
            label="Hàng chờ"
          >
            {(piece) => (
              <article>
                <div className="aw2-activity-portrait">{pieceView(piece)}</div>
                <button
                  disabled={!planning}
                  data-piece-id={piece.uid}
                  aria-pressed={selected === piece.uid}
                  onClick={() => {
                    setSelected(piece.uid)
                    setPage("formation")
                  }}
                >
                  Chọn {pieceLabel(piece)} để xếp
                </button>
              </article>
            )}
          </ActivityPages>
        )}
        {page === "unit" &&
          (chosen ? (
            <>
              <div className="aw2-activity-portrait">{pieceView(chosen)}</div>
              <div className="aw2-activity-actions">
                <button
                  disabled={
                    !planning ||
                    !!reason({ type: "move", uid: chosen.uid, cell: null })
                  }
                  onClick={() =>
                    command({ type: "move", uid: chosen.uid, cell: null })
                  }
                >
                  Đưa về hàng chờ
                </button>
                <button
                  disabled={!planning}
                  onClick={() => command({ type: "sell", uid: chosen.uid })}
                >
                  Bán quân đã chọn ·{" "}
                  {chessUnit(chosen.spiritId).cost *
                    (chosen.stars === 2 ? 3 : 1)}{" "}
                  vàng
                </button>
                <button onClick={() => setSelected(null)}>Hủy chọn quân</button>
              </div>
            </>
          ) : (
            <ActivityCopy text="Chọn một quân trên Đội hình hoặc Hàng chờ. Chọn ô đích để di chuyển/đổi chỗ; trang này có thao tác bán hoặc đưa về hàng chờ." />
          ))}
        {page === "enemy" && (
          <ActivityPages
            items={chessOpponent(game.round)}
            page={actorPage}
            onPage={setActorPage}
            label="Đối thủ"
          >
            {(piece) => (
              <>
                <div className="aw2-activity-portrait">{pieceView(piece)}</div>
                <p>Cộng công vòng này: {[0, 0, 1, 1, 2][game.round - 1]}.</p>
              </>
            )}
          </ActivityPages>
        )}
        {page === "battle" &&
          (game.battle ? (
            <div className="chess-battle-grid" aria-label="Bàn giao tranh">
              {[3, 2, 1, 0].flatMap((y) =>
                [0, 1, 2].map((x) => (
                  <div
                    className="chess-battle-cell"
                    key={`${x}:${y}`}
                    data-battle-cell={`${x}:${y}`}
                  >
                    {game
                      .battle!.actors.filter(
                        (a) => a.health > 0 && a.x === x && a.y === y,
                      )
                      .map(actorView)}
                  </div>
                )),
              )}
            </div>
          ) : (
            <ActivityCopy text="Xếp đội rồi Bắt đầu giao tranh. Đối thủ phía trên, đội bạn phía dưới; từng ô và kết quả lấy từ luật trận thực." />
          ))}
        {page === "actors" && (
          <ActivityPages
            items={game.battle?.actors ?? []}
            page={actorPage}
            onPage={setActorPage}
            label="Quân"
          >
            {actorView}
          </ActivityPages>
        )}
        {page === "actions" && (
          <div className="aw2-activity-actions">
            <button
              disabled={!planning || !!reason({ type: "refresh" })}
              onClick={() => command({ type: "refresh" })}
            >
              Đổi quầy · 1 vàng
            </button>
            <button
              disabled={!planning}
              aria-pressed={game.locked}
              onClick={() => command({ type: "lock" })}
            >
              {game.locked ? "Mở khóa quầy" : "Khóa quầy"}
            </button>
            <button
              disabled={!planning}
              onClick={() => command({ type: "arrange" })}
            >
              Xếp đội gợi ý
            </button>
            <button
              disabled={!fighting}
              onClick={() => command({ type: "tick" })}
            >
              Tiến một nhịp
            </button>
            <button
              disabled={finished}
              onClick={() => command({ type: "surrender" })}
            >
              Nhận thua ván cờ
            </button>
          </div>
        )}
        {page === "rules" && (
          <ActivityCopy
            text={`12 máu; thua vòng mất 3, hòa mất 1. Sống qua 5 vòng là thắng. Tối đa 80 nhịp/vòng. Hàng chờ 6, đội tăng 3→4→5 quân. Chọn quân rồi chọn ô đích để xếp hoặc đổi chỗ. Vàng đầu 10, vòng mới +6, đổi quầy tốn 1. Khóa giữ quầy qua vòng sau. Bán hoàn đủ vàng/trả bản về nguồn. Mỗi danh tính 9 bản, rút đều; 3 bản 1 sao ghép 2 sao, máu ×1,8 công ×1,6 làm tròn. Đủ 3 danh tính cả đội +1 công, đủ 5 thêm 2 máu. Hồi đầy máu trước vòng sau. Tầm theo bước ngang/dọc, khiên tối đa 12. Không dùng tỷ lệ gacha RPG, không nhận thưởng hành trình. Mở trang ngoài giao tranh tự tạm dừng. ${CHESS_UNITS.map((u) => `${u.name}: ${u.cost} vàng, máu ${u.health}, công ${u.attack}, tầm ${u.range}. ${u.skill}`).join(" ")}`}
          />
        )}
        {page === "log" && (
          <ActivityCopy
            text={
              [
                ...game.log.slice(-10),
                ...(game.battle?.events.slice(-10) ?? []),
              ].join("\n") || "Chưa có sự kiện."
            }
          />
        )}
        {page === "notice" && (
          <>
            <ActivityCopy
              text={
                error ||
                session.feedback ||
                "Vàng tại bàn chỉ dùng trong ván này, không tiêu túi đồ. Đọc lại hành trình sẽ bỏ ván cờ hiện tại."
              }
            />
            <button onClick={onReread}>Đọc lại hành trình và rời bàn cờ</button>
          </>
        )}
      </ActivityFrame>
    )
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
