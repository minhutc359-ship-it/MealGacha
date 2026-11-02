import { useEffect, useReducer, useRef, useState } from "react"
import { STARTER_ASSETS } from "../../src/aw2/assets/starters"
import { TCG_CARDS, tcgCard } from "../../src/aw2/tcg/catalog"
import {
  legalTcgActions,
  tcgLeaderTarget,
  tcgPlayOptions,
} from "../../src/aw2/tcg/rules"
import {
  createTcgSession,
  reduceTcgSession,
  selectedTcgActions,
} from "../../src/aw2/tcg/session"
import type {
  TcgCardInstance,
  TcgCommand,
  TcgSide,
  TcgUnit,
} from "../../src/aw2/tcg/types"
import "./tcg.css"
import { ActivityFrame, ActivityPages, ActivityCopy } from "./ActivityFrame"

interface PracticeProps {
  compact?: boolean
  error: string
  onReturn: () => void
  onReread: () => void
}
interface PortraitProps {
  spiritId: string
  name: string
}
function Portrait({ spiritId, name }: PortraitProps) {
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
export function TcgPractice({
  error,
  onReturn,
  onReread,
  compact = false,
}: PracticeProps) {
  const [page, setPage] = useState("hand")
  const [handPage, setHandPage] = useState(0)
  const [unitPage, setUnitPage] = useState(0)
  const [enemyPage, setEnemyPage] = useState(0)
  useEffect(() => {
    if (error && compact) setPage("notice")
  }, [error, compact])
  const [session, dispatch] = useReducer(reduceTcgSession, undefined, () =>
    createTcgSession(),
  )
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus()
  }, [])
  const game = session.match,
    player = game.players.player,
    enemy = game.players.opponent
  const active = game.status === "active"
  const legal = legalTcgActions(game, "player"),
    selected = selectedTcgActions(session)
  const command = (action: TcgCommand) => {
    dispatch({ type: "command", command: action })
    if (compact) setPage("hand")
  }
  const targetAction = (uid: string) =>
    selected.find((action) => "targetUid" in action && action.targetUid === uid)
  const targetButton = (uid: string, label: string) => {
    const action = targetAction(uid)
    return (
      action && (
        <button className="tcg-target" onClick={() => command(action)}>
          Nhắm {label}
        </button>
      )
    )
  }
  const unitCard = (unit: TcgUnit, side: TcgSide) => {
    const card = tcgCard(unit.cardId)
    const canAttack = legal.some(
      (action) => action.type === "attack" && action.uid === unit.uid,
    )
    return (
      <article
        className="tcg-card"
        key={unit.uid}
        data-unit-id={unit.uid}
        data-ready={unit.ready}
      >
        <Portrait spiritId={card.spiritId} name={card.name} />
        <h3>{card.name}</h3>
        <p>
          Công {unit.attack} · Máu {unit.health}/{unit.maxHealth} · Khiên{" "}
          {unit.shield}
        </p>
        <p>
          {card.effect === "guard" ? "Hộ vệ · " : ""}
          {unit.ready ? "Sẵn sàng" : "Đang nghỉ"}
        </p>
        {side === "player" ? (
          <button
            disabled={!canAttack}
            aria-pressed={
              session.selection?.kind === "attack" &&
              session.selection.uid === unit.uid
            }
            onClick={() => {
              dispatch({
                type: "select",
                selection: { kind: "attack", uid: unit.uid },
              })
              if (compact) {
                setPage("opponent")
                setEnemyPage(0)
              }
            }}
          >
            Tấn công bằng {card.name}
          </button>
        ) : (
          targetButton(unit.uid, card.name)
        )}
      </article>
    )
  }
  const handCard = (instance: TcgCardInstance) => {
    const card = tcgCard(instance.cardId),
      options = tcgPlayOptions(game, "player", instance.uid)
    return (
      <article
        className="tcg-card"
        key={instance.uid}
        data-card-id={instance.cardId}
      >
        <Portrait spiritId={card.spiritId} name={card.name} />
        <h3>{card.name}</h3>
        <p>
          Năng lượng {card.cost}
          {card.kind === "unit"
            ? ` · Công ${card.attack} · Máu ${card.health}`
            : " · Chiến thuật"}
        </p>
        <p>{card.description}</p>
        <button
          disabled={!options.actions.length}
          aria-pressed={
            session.selection?.kind === "play" &&
            session.selection.uid === instance.uid
          }
          onClick={() => {
            if (card.effect === "bolt-2") {
              dispatch({
                type: "select",
                selection: { kind: "play", uid: instance.uid },
              })
              if (compact) {
                setPage("opponent")
                setEnemyPage(0)
              }
            } else command(options.actions[0])
          }}
        >
          Dùng {card.name}
        </button>
        {options.reason && <small>{options.reason}</small>}
      </article>
    )
  }
  const result =
    game.status === "player-win"
      ? "Bạn thắng ván này"
      : game.status === "opponent-win"
        ? "Chủ bàn thắng ván này"
        : "Ván hòa"
  if (compact)
    return (
      <ActivityFrame
        title="TCG · Luyện tập"
        status={
          active
            ? `Lượt ${game.turn} · Bạn ${player.health}♥ · Địch ${enemy.health}♥ · NL ${player.energy}/${player.maxEnergy}`
            : result
        }
        pages={[
          ["hand", "Bài trên tay"],
          ["player", "Đội của bạn"],
          ["opponent", "Bàn và mục tiêu đối thủ"],
          ["turn", "Nước đi và ván mới"],
          ["rules", "Luật và bộ bài"],
          ["log", "Nhật ký"],
          ["notice", "Thông báo / đọc lại"],
        ]}
        page={page}
        onPage={setPage}
        data-testid="tcg-practice"
        data-status={game.status}
        data-turn={game.turn}
        data-event-serial={game.eventSerial}
        footer={
          <>
            <button type="button" onClick={onReturn}>
              {active ? "Dừng ván và về hành trình" : "Trở về hành trình"}
            </button>
            {session.selection ? (
              <button
                type="button"
                onClick={() => dispatch({ type: "cancel" })}
              >
                Hủy chọn mục tiêu
              </button>
            ) : (
              <button
                type="button"
                disabled={!active}
                onClick={() => command({ type: "end-turn", side: "player" })}
              >
                Kết thúc lượt
              </button>
            )}
          </>
        }
      >
        {page === "hand" && (
          <ActivityPages
            items={player.hand}
            page={handPage}
            onPage={setHandPage}
            label="Lá"
          >
            {handCard}
          </ActivityPages>
        )}
        {page === "player" && (
          <ActivityPages
            items={player.board}
            page={unitPage}
            onPage={setUnitPage}
            label="Đồng đội"
          >
            {(unit) => unitCard(unit, "player")}
          </ActivityPages>
        )}
        {page === "opponent" && (
          <ActivityPages
            items={[null, ...enemy.board]}
            page={enemyPage}
            onPage={setEnemyPage}
            label="Mục tiêu"
          >
            {(unit) =>
              unit ? (
                unitCard(unit, "opponent")
              ) : (
                <article>
                  <h2>Chủ bàn · Máu {enemy.health}/18</h2>
                  <p>
                    Tay {enemy.hand.length} · Bộ bài {enemy.deck.length} · Bỏ{" "}
                    {enemy.discard.length}
                  </p>
                  {targetButton(tcgLeaderTarget("opponent"), "Chủ bàn") || (
                    <p>
                      Chọn quân tấn công hoặc chiến thuật để nhắm mục tiêu hợp
                      lệ.
                    </p>
                  )}
                </article>
              )
            }
          </ActivityPages>
        )}
        {page === "turn" && (
          <div className="aw2-activity-actions">
            <button
              disabled={!active}
              onClick={() => {
                dispatch({ type: "recommend" })
                setPage("hand")
              }}
            >
              Chơi nước gợi ý
            </button>
            <button
              disabled={!active}
              onClick={() => command({ type: "surrender", side: "player" })}
            >
              Nhận thua
            </button>
            {!active && (
              <button
                onClick={() => {
                  dispatch({ type: "rematch" })
                  setPage("hand")
                }}
              >
                Chơi ván mới
              </button>
            )}
          </div>
        )}
        {page === "rules" && (
          <ActivityCopy
            text={`Mỗi bên mượn 20 lá, mở 3 rồi rút 1 đầu lượt. 18 máu, tối đa 3 quân và 7 lá trên tay. Năng lượng hồi và tăng 1 mỗi lượt đến 6. Quân mới nghỉ một lượt; sau đó tấn công một lần. Sát thương trao đồng thời, khiên chịu trước máu. Hộ vệ chặn đòn thường; chiến thuật có thể bỏ qua. Đầy tay bỏ lá rút thêm. Hết bài mất máu tăng dần 1, 2, 3… Hòa sau 60 lượt. Gợi ý chỉ đọc bàn công khai. Không tốn vật phẩm/nhận thưởng; rời hoặc tải lại bỏ ván. Mã xáo ${game.seed}. ${TCG_CARDS.map((c) => `${c.name}: ${c.description}`).join(" ")}`}
          />
        )}
        {page === "log" && (
          <ActivityCopy
            text={
              game.events
                .slice(-12)
                .map((e) => e.text)
                .join("\n") || "Chưa có sự kiện."
            }
          />
        )}
        {page === "notice" && (
          <>
            <ActivityCopy
              text={
                error ||
                session.feedback ||
                "Điểm khám phá được giữ. Đọc lại sẽ bỏ ván hiện tại và tải tiến trình hành trình mới nhất."
              }
            />
            <button onClick={onReread}>Đọc lại hành trình và rời ván</button>
          </>
        )}
      </ActivityFrame>
    )
  return (
    <main
      className="aw2-save tcg-practice"
      data-testid="tcg-practice"
      data-status={game.status}
      data-turn={game.turn}
      data-event-serial={game.eventSerial}
    >
      <p className="eyebrow">BÀN BÀI · BỘ BÀI MƯỢN</p>
      <h1 ref={heading} tabIndex={-1}>
        TCG · Luyện tập
      </h1>
      <p>
        Luật thử nghiệm v1 · Không tốn vật phẩm, không nhận thưởng. Rời bàn hoặc
        tải lại sẽ bỏ ván; điểm khám phá vẫn được giữ.
      </p>
      <p role="status">
        {active ? `Lượt ${game.turn} · Đến lượt bạn` : result} ·{" "}
        {session.feedback}
      </p>
      {error && <p role="alert">{error}</p>}
      <section aria-label="Bàn Chủ bàn">
        <h2>Chủ bàn · Máu {enemy.health}/18</h2>
        <p>
          Năng lượng {enemy.energy}/{enemy.maxEnergy} · Tay {enemy.hand.length}{" "}
          · Bộ bài {enemy.deck.length} · Bỏ {enemy.discard.length}
        </p>
        {targetButton(tcgLeaderTarget("opponent"), "Chủ bàn")}
        <div className="tcg-board">
          {enemy.board.map((unit) => unitCard(unit, "opponent"))}
        </div>
        {!enemy.board.length && <p>Bàn trống.</p>}
      </section>
      <section aria-label="Bàn của bạn">
        <h2>Bạn · Máu {player.health}/18</h2>
        <p data-testid="tcg-resources">
          Năng lượng {player.energy}/{player.maxEnergy} · Tay{" "}
          {player.hand.length} · Bộ bài {player.deck.length} · Bỏ{" "}
          {player.discard.length}
        </p>
        <div className="tcg-board">
          {player.board.map((unit) => unitCard(unit, "player"))}
        </div>
        {!player.board.length && <p>Gọi tối đa 3 Vị Linh vào bàn.</p>}
      </section>
      <div className="actions tcg-controls">
        {session.selection && (
          <button onClick={() => dispatch({ type: "cancel" })}>
            Hủy chọn mục tiêu
          </button>
        )}
        <button
          disabled={!active}
          onClick={() => command({ type: "end-turn", side: "player" })}
        >
          Kết thúc lượt
        </button>
        <button
          disabled={!active}
          onClick={() => dispatch({ type: "recommend" })}
        >
          Chơi nước gợi ý
        </button>
        <button
          disabled={!active}
          onClick={() => command({ type: "surrender", side: "player" })}
        >
          Nhận thua
        </button>
        {!active && (
          <button onClick={() => dispatch({ type: "rematch" })}>
            Chơi ván mới
          </button>
        )}
      </div>
      <section aria-label="Bài trên tay">
        <h2>Bài trên tay bạn</h2>
        <div className="tcg-hand">{player.hand.map(handCard)}</div>
      </section>
      <details>
        <summary>Luật và bộ bài luyện tập</summary>
        <p>
          Mỗi bên mượn 20 lá: mỗi Vị Linh 3 bản, Chén ấm 3 bản, Hơi sương 2 bản.
          Mở đầu 3 lá rồi rút 1 đầu mỗi lượt; bạn đi trước. Thứ tự xáo có thể
          tái lập, mã ván {game.seed}.
        </p>
        <p>
          18 máu, 3 chỗ trên bàn, tối đa 7 lá trên tay. Năng lượng hồi đầu lượt,
          tăng 1 mỗi lượt của mình đến 6. Đầy tay sẽ bỏ lá rút thêm. Hết bài:
          mất máu tăng dần 1, 2, 3… mỗi lần rút. Hòa sau 60 lượt nếu chưa có bên
          hết máu.
        </p>
        <p>
          Vị Linh nghỉ lượt mới gọi, sau đó đánh một lần mỗi lượt. Hai Vị Linh
          trao sát thương đồng thời; khiên chịu trước máu. Hộ vệ chặn đòn đánh
          thường, chiến thuật chọn mục tiêu vẫn có thể bỏ qua. Máu hồi tối đa
          18.
        </p>
        <p>
          Chọn Tấn công, rồi Nhắm mục tiêu; Hơi sương cũng cần chọn mục tiêu.
          Gợi ý thực hiện một nước hợp lệ dựa trên bài của bạn và bàn công khai.
          Chủ bàn dùng cùng cách chọn, không xem bài ẩn của bạn.
        </p>
        <ul>
          {TCG_CARDS.map((card) => (
            <li key={card.id}>
              {card.name}: {card.description}
            </li>
          ))}
        </ul>
        <p>
          Ảnh là các bộ tham chiếu hiện có; thông số riêng cho TCG thử nghiệm,
          còn cần cân bằng.
        </p>
      </details>
      <details open>
        <summary>Nhật ký lượt gần đây</summary>
        <ol className="tcg-log">
          {game.events.slice(-12).map((event) => (
            <li key={event.serial}>{event.text}</li>
          ))}
        </ol>
      </details>
      <div className="actions">
        <button onClick={onReturn}>
          {active ? "Dừng ván và về hành trình" : "Trở về hành trình"}
        </button>
        <button onClick={onReread}>Đọc lại hành trình và rời ván</button>
      </div>
    </main>
  )
}
