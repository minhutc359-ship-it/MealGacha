import { useEffect, useState } from "react"
import { CARD_MAP, SCHOOLS } from "../../game/catalog"
import { STAGE_MAP } from "../../game/story"
import { useGameStore } from "../../game/useGameStore"
import type { BattleUnit } from "../../game/types"
import { GameCardView } from "./GameCardView"
import { Dialog } from "./Dialog"

interface SpellSelection {
  type: "play"
  index: number
}
interface AttackSelection {
  type: "attack"
  uid: string
}

export function BattleBoard({ onExit }: { onExit: () => void }) {
  const battle = useGameStore((s) => s.save.battle)!
  const act = useGameStore((s) => s.act)
  const leaveBattle = useGameStore((s) => s.leaveBattle)
  const [selection, setSelection] =
    useState<SpellSelection | AttackSelection | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [showLog, setShowLog] = useState(false)
  useEffect(() => {
    setSelection(null)
  }, [battle.id, battle.round])
  const target = (uid: string) => {
    if (selection) {
      act({ ...selection, target: uid })
      setSelection(null)
    }
  }
  const unit = (u: BattleUnit, enemy: boolean) => {
    const c = CARD_MAP[u.cardId]
    const selected = selection?.type === "attack" && selection.uid === u.uid
    return (
      <button
        key={u.uid}
        className={`tcg-unit ${u.ready ? "is-ready" : ""} ${
          selected ? "is-selected" : ""
        } ${enemy && selection ? "is-target" : ""}`}
        onClick={() =>
          enemy
            ? target(u.uid)
            : setSelection(
                selected || !u.ready ? null : { type: "attack", uid: u.uid },
              )
        }
        disabled={!!battle.result}
        aria-label={`${
          enemy ? "Địch" : "Đồng minh"
        } ${c.name}, công ${u.attack}, máu ${u.health}${
          u.keywords.includes("guard") ? ", Hộ vệ" : ""
        }`}
      >
        {c.art ? (
          <img src={c.art} alt="" />
        ) : (
          <span className="tcg-unit-symbol">{c.symbol}</span>
        )}
        <span className="tcg-unit-name">{c.name}</span>
        <span className="tcg-unit-stats">
          <b>⚔ {u.attack}</b>
          {u.shield > 0 && <b className="shield">◇ {u.shield}</b>}
          <b>♥ {u.health}</b>
        </span>
        <small>
          {u.keywords.includes("guard")
            ? "HỘ VỆ"
            : u.keywords.includes("drain")
              ? "HÚT VỊ"
              : enemy
                ? SCHOOLS[c.school].name
                : u.ready
                  ? "SẴN SÀNG"
                  : "ĐANG CHỜ"}
        </small>
      </button>
    )
  }
  const exit = () => {
    leaveBattle()
    onExit()
  }
  const stage = battle.stageId ? STAGE_MAP[battle.stageId] : null
  return (
    <section className="tcg-battle">
      <header className="tcg-battle-top">
        <div>
          <span className="tcg-kicker">
            {stage ? stage.chapter.title : "LUYỆN TẬP · ĐẤU VỚI AI"}
          </span>
          <h1>{stage?.title ?? "Bàn ăn thử thách"}</h1>
        </div>
        <button
          className="tcg-button ghost"
          onClick={() => (battle.result ? exit() : setConfirm(true))}
        >
          Rời trận
        </button>
      </header>
      <div className="tcg-arena">
        <div className="tcg-arena-top">
          <span>
            AI · {battle.enemy.hand.length} lá trên tay ·{" "}
            {battle.enemy.deck.length} lá trong bộ
          </span>
          <button
            className="tcg-button ghost"
            onClick={() => setShowLog(!showLog)}
          >
            Nhật ký trận
          </button>
        </div>
        <button
          className={`tcg-hero enemy ${selection ? "is-target" : ""}`}
          onClick={() => target("hero")}
          disabled={!selection || !!battle.result}
          aria-label={`Chủ tướng địch ${battle.opponent}, ${battle.enemy.health} máu`}
        >
          <span className="tcg-avatar">☽</span>
          <span>
            <strong>{battle.opponent}</strong>
            <small>
              {battle.enemy.mana}/{battle.enemy.maxMana} năng lượng
            </small>
          </span>
          <b>
            ♥ {Math.max(0, battle.enemy.health)}
            <small>/{battle.enemy.maxHealth}</small>
          </b>
        </button>
        <div className="tcg-field enemy">
          {battle.enemy.board.map((u) => unit(u, true))}
          {Array.from({ length: 3 - battle.enemy.board.length }, (_, i) => (
            <span className="tcg-empty-slot" key={i}>
              ◇
            </span>
          ))}
        </div>
        <div className="tcg-turn-bar">
          <span>LƯỢT {battle.round}</span>
          <p aria-live="polite">
            {selection
              ? selection.type === "attack"
                ? "Chọn mục tiêu địch để tấn công"
                : "Chọn mục tiêu cho phép thuật"
              : "Chọn bài trên tay hoặc đồng minh sẵn sàng"}
          </p>
          {selection ? (
            <button
              className="tcg-button ghost"
              onClick={() => setSelection(null)}
            >
              Hủy chọn
            </button>
          ) : (
            <button
              className="tcg-button gold"
              onClick={() => {
                act({ type: "end" })
                setSelection(null)
              }}
              disabled={!!battle.result}
            >
              Kết thúc lượt →
            </button>
          )}
        </div>
        <div className="tcg-field">
          {battle.player.board.map((u) => unit(u, false))}
          {Array.from({ length: 3 - battle.player.board.length }, (_, i) => (
            <span className="tcg-empty-slot" key={i}>
              ◇
            </span>
          ))}
        </div>
        <div className="tcg-hero">
          <span className="tcg-avatar player">✦</span>
          <span>
            <strong>Người giữ vị</strong>
            <small>
              {battle.player.deck.length} lá trong bộ ·{" "}
              {battle.player.hand.length}/8 lá trên tay
            </small>
          </span>
          <b>
            ♥ {Math.max(0, battle.player.health)}
            <small>/{battle.player.maxHealth}</small>
          </b>
          <span className="tcg-mana">
            {Array.from({ length: battle.player.maxMana }, (_, i) => (
              <i key={i} className={i < battle.player.mana ? "filled" : ""} />
            ))}
            <strong>
              {battle.player.mana}/{battle.player.maxMana}
            </strong>
          </span>
        </div>
      <p className="tcg-hand-label">THẺ TRÊN TAY · VUỐT NGANG ĐỂ XEM THÊM →</p>
      <div className="tcg-hand">
          {battle.player.hand.map((id, index) => (
            <GameCardView
              key={`${index}-${id}`}
              card={CARD_MAP[id]}
              compact
              muted={CARD_MAP[id].cost > battle.player.mana}
              selected={selection?.type === "play" && selection.index === index}
              disabled={!!battle.result}
              onClick={() => {
                const card = CARD_MAP[id]
                if (card.kind === "spell" && card.effect === "damage")
                  setSelection({ type: "play", index })
                else {
                  act({ type: "play", index })
                  setSelection(null)
                }
              }}
            />
          ))}
          {!battle.player.hand.length && (
            <p className="tcg-empty">
              Hết bài trên tay. Kết thúc lượt để rút thêm.
            </p>
          )}
        </div>
        <p className="tcg-arena-hint">
          Hộ vệ bảo vệ chủ tướng · Đồng minh cùng hệ nhận +1 lá chắn khi vào sân
          · Hết bộ bài sẽ chịu kiệt sức tăng dần.
        </p>
      </div>
      {showLog && (
        <section className="tcg-panel tcg-combat-log">
          <h2>Nhật ký</h2>
          <ol>
            {battle.log.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </section>
      )}
      {confirm && (
        <Dialog title="Đầu hàng trận đấu?" onClose={() => setConfirm(false)}>
          <p>
            Trận này sẽ được tính là thua. Bạn có thể thử lại bất kỳ lúc nào.
          </p>
          <div className="tcg-dialog-actions">
            <button
              className="tcg-button ghost"
              onClick={() => setConfirm(false)}
            >
              Tiếp tục chơi
            </button>
            <button className="tcg-button primary" onClick={exit}>
              Đầu hàng
            </button>
          </div>
        </Dialog>
      )}
      {battle.result && (
        <Dialog
          title={
            battle.result === "win"
              ? "Hương vị chiến thắng"
              : "Ngọn lửa vẫn còn"
          }
          onClose={exit}
          wide
        >
          <div className={`tcg-result ${battle.result}`}>
            <span className="tcg-result-symbol">
              {battle.result === "win" ? "✦" : "☽"}
            </span>
            <p>
              {battle.result === "win"
                ? (stage?.ending ??
                  "Bạn đã hoàn thành trận luyện tập. Một công thức tốt bắt đầu từ những lần thử.")
                : "Mỗi thất bại là một công thức cần nêm lại. Thử thêm thẻ giá thấp, Hộ vệ hoặc phép hồi máu."}
            </p>
            <div className="tcg-reward-row">
              <span>◉ +{battle.loot?.coins ?? 0} xu</span>
              <span>✧ +{battle.loot?.xp ?? 0} XP</span>
              {!!battle.loot?.tickets && (
                <span>▱ +{battle.loot.tickets} vé</span>
              )}
            </div>
            {battle.loot?.cardId && (
              <div className="tcg-result-card">
                <GameCardView card={CARD_MAP[battle.loot.cardId]} compact />
                <p>
                  Phần thưởng hoàn thành lần đầu.
                  <br />
                  Nếu đã có 2 bản, nhận tinh chất thay thế.
                </p>
              </div>
            )}
            <button className="tcg-button primary" onClick={exit}>
              Trở về hành trình →
            </button>
          </div>
        </Dialog>
      )}
    </section>
  )
}
