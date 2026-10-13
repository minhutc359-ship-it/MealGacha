import type { Battle, BattleSide } from "../../game/types"
import type { BattleFrame } from "../../game/battle"
import { CARD_MAP } from "../../game/catalog"
import { TRAP_BACK } from "../../game/trapCards"
import { trapReady, TRIGGER_LABEL } from "../../game/traps"
import { Dialog } from "./Dialog"
export function TrapSlot({
  battle,
  side,
  onInspect,
  onSet,
  setting = false,
  stamp = "",
}: {
  battle: Battle
  side: BattleSide
  onInspect: (id?: string) => void
  onSet: () => void
  setting?: boolean
  stamp?: string
}) {
  const slot = battle[side].trap,
    visible = side === "player" || !!slot?.revealed
  const card = slot && visible ? CARD_MAP[slot.cardId] : null,
    ready = trapReady(battle, slot)
  return (
    <div
      className={`tcg-trap-slot ${slot ? "has-trap" : "is-empty"} ${
        ready ? "is-armed" : ""
      } ${setting ? "is-setting" : ""}`}
      data-side={side}
      data-state={
        !slot
          ? "empty"
          : slot.revealed
            ? "revealed"
            : ready
              ? "armed"
              : "preparing"
      }
    >
      <button
        type="button"
        onClick={() =>
          slot ? onInspect(card?.id) : side === "player" ? onSet() : onInspect()
        }
        aria-label={
          !slot
            ? `${
                side === "player"
                  ? "Ô bẫy của bạn: chọn bẫy trên tay"
                  : "Ô bẫy địch đang trống"
              }`
            : card
              ? `${card.name} · ${
                  ready ? "Sẵn sàng" : "Chờ lượt kế"
                } · Xem điều kiện`
              : `Bẫy địch đang úp · ${ready ? "Sẵn sàng" : "Chờ lượt kế"}`
        }
      >
        {slot ? (
          <img src={card?.art ?? TRAP_BACK} alt="" decoding="async" />
        ) : (
          null
        )}
        {setting && <i key={stamp} className="tcg-trap-set-ring" aria-hidden="true" />}
      </button>
    </div>
  )
}
export function TrapDecision({
  battle,
  onDecision,
}: {
  battle: Battle
  onDecision: (activate: boolean) => void
}) {
  const reaction = battle.pendingReaction,
    slot = battle.player.trap
  if (!reaction || !slot) return null
  const card = CARD_MAP[slot.cardId],
    intent = reaction.intent,
    announced = CARD_MAP[intent.cardId]
  const attacker =
    intent.trigger === "attack"
      ? battle.enemy.board.find((unit) => unit.uid === intent.source)
      : null
  const target =
    intent.target === "hero"
      ? "chủ tướng bạn"
      : battle.player.board.find((u) => u.uid === intent.target)
  const targetName =
    typeof target === "string"
      ? target
      : target
        ? CARD_MAP[target.cardId].name
        : "đồng minh bạn"
  return (
    <Dialog
      title="Cơ hội phản ứng"
      onClose={() => {}}
      dismissible={false}
      className="tcg-trap-decision"
    >
      <div className="trap-threat">
        <span>{TRIGGER_LABEL[intent.trigger]}</span>
        <strong>
          {announced.name}
          {attacker && (
            <em aria-label={`${attacker.attack} sức tấn công`}>
              ⚔ {attacker.attack}
            </em>
          )}
        </strong>
        <p>
          {intent.trigger === "attack"
            ? `Chuẩn bị đánh ${targetName}. Đòn đang chờ quyết định của bạn.`
            : intent.trigger === "spell"
              ? "Phép đang chờ giải quyết. Kích hoạt bẫy để chặn, hoặc giữ cho phép tiếp theo."
              : intent.trigger === "fallen"
                ? "Đồng minh đã bị hạ; bạn có thể gọi lại ngay trước khi địch tiếp tục."
                : "Quân mới đã vào sân; bẫy có thể phản ứng trước hành động tiếp theo."}
        </p>
      </div>
      <div className="trap-decision-card">
        <img src={card.art} alt="" />
        <div>
          <span>BẪY CỦA BẠN · ĐÃ TRẢ NĂNG LƯỢNG KHI ÚP</span>
          <h3>{card.name}</h3>
          <p>{card.text}</p>
          <small>Dùng một lần · Kích hoạt xong rời ô bẫy.</small>
        </div>
      </div>
      <div className="trap-decision-actions">
        <button
          type="button"
          className="tcg-button primary"
          onClick={() => onDecision(true)}
        >
          ◇ Kích hoạt bẫy
        </button>
        <button
          type="button"
          className="tcg-button ghost"
          onClick={() => onDecision(false)}
        >
          Giữ bẫy
        </button>
      </div>
    </Dialog>
  )
}
export function TrapReveal({
  frame,
  quiet,
}: {
  frame?: BattleFrame
  quiet: boolean
}) {
  const event = frame?.event
  if (event?.kind !== "trap" || !event.cardId) return null
  const card = CARD_MAP[event.cardId]
  return (
    <div
      className={`tcg-trap-reveal ${quiet ? "is-quiet" : ""}`}
      aria-hidden="true"
      data-effect="trap-reveal"
    >
      <img src={card.art} alt="" />
      <div>
        <small>
          {event.side === "player" ? "BẪY CỦA BẠN" : "ĐỊCH LẬT BẪY"}
        </small>
        <strong>{card.name}</strong>
        <p>{card.text}</p>
      </div>
      <i />
    </div>
  )
}
