import type { CSSProperties } from "react"
import { SCHOOLS } from "../../game/catalog"
import {
  TACTICAL_CARD_MAP,
  type TacticalCard,
} from "../../game/tacticalTcg/cards"
import type {
  BattleSide,
  BattleUnit,
  BoardCell,
  TacticalBattleState,
} from "../../game/tacticalTcg/engine"
import { directedReadiness } from "../../game/tacticalTcg/engine/directedRules"
import {
  duelPlacement,
  duelStatuses,
  duelUnits,
} from "../../game/tacticalTcg/presentation/duel"
import type { TacticalTransition } from "../../game/tacticalTcg/presentation/transitions"
import { CharacterPortrait } from "./CharacterPortrait"
import { TacticalSpiritArt } from "./TacticalSpirit"

export function DuelCommander({
  battle: b,
  side,
  hp,
  target,
  onTarget,
  speech,
  onTrap,
}: {
  battle: TacticalBattleState
  side: BattleSide
  hp: number
  target?: boolean
  onTarget?: () => void
  speech: string
  onTrap: () => void
}) {
  const owner = b.cardGame!.sides[side]
  const trap = b.traps.find((t) => t.side === side && t.armed)
  return (
    <div
      className={`table-commander duel-commander is-${side} ${
        target ? "is-target" : ""
      }`}
      data-hero={side}
    >
      <button
        className="duel-commander-avatar"
        disabled={!target}
        onClick={onTarget}
        aria-label={
          side === "enemy"
            ? `Tấn công Chỉ huy địch, ${hp} Ý chí`
            : "Người giữ vị"
        }
      >
        <CharacterPortrait
          id={side === "player" ? "hero" : b.nodeId ? "mist" : "bach"}
          decorative
        />
        {target && <span>⚔</span>}
      </button>
      <div className="duel-commander-info">
        <b>
          {side === "player"
            ? "NGƯỜI GIỮ VỊ"
            : (b.boss?.title ??
              (b.nodeId ? "LINH ẢNH · ĐỐI THỦ" : "BÁCH · ĐỐI THỦ"))}
        </b>
        <small>
          {owner.deck.length} lá trong bộ · {owner.hand.length}/8 lá tay
          {b.boss ? ` · Pha ${b.boss.phase}` : ""}
        </small>
        <span
          className="duel-mana-gems"
          aria-label={`${owner.mana}/${owner.maxMana} Lửa Bếp`}
        >
          {Array.from({ length: owner.maxMana }, (_, i) => (
            <i key={i} className={i < owner.mana ? "is-filled" : ""} />
          ))}
        </span>
      </div>
      <p className="duel-commander-speech" role="status">
        “{speech}”
      </p>
      {trap && (
        <button
          key={trap.instanceId}
          className="duel-trap-back"
          onClick={onTrap}
          data-trap={side}
          aria-label={
            side === "player" || trap.revealed
              ? `Bẫy đang gài: ${TACTICAL_CARD_MAP[trap.cardId ?? ""]?.name ?? "Bẫy Hương"}`
              : "Bẫy úp địch, chưa lộ danh tính"
          }
        >
          <b>◇</b>
          <small>{trap.revealed ? "ĐÃ LỘ" : "ÚP"}</small>
        </button>
      )}
      <strong
        aria-label={`${
          side === "player" ? "Bạn" : "Địch"
        }: ${hp}/${b.commanders[side].maxHp} Ý chí`}
      >
        ♥ {hp}
        <small>/{b.commanders[side].maxHp}</small>
      </strong>
      <meter
        min={0}
        max={b.commanders[side].maxHp}
        value={hp}
        aria-label={`Ý chí ${side === "player" ? "của bạn" : "địch"}`}
      />
    </div>
  )
}

export function TacticalDuelField({
  battle: b,
  side,
  card,
  selected,
  targets,
  busy,
  planning,
  transition,
  contacted,
  effects,
  onCell,
}: {
  battle: TacticalBattleState
  side: BattleSide
  card: TacticalCard | null
  selected?: BattleUnit
  targets: string[]
  busy: boolean
  planning: boolean
  transition: TacticalTransition | null
  contacted: boolean
  effects: Record<string, string>
  onCell: (side: BattleSide, cell: BoardCell, unit?: BattleUnit) => void
}) {
  const fallen =
    transition?.deltas.filter((d) => d.fallen).map((d) => d.id) ?? []
  const units = duelUnits(b, side, fallen)
  const owner = b.cardGame!.sides.player
  const placing = side === "player" && planning && card?.kind === "unit"
  const moving =
    side === "player" && planning && !card && selected?.side === "player"
  const canMove =
    moving &&
    b.cardGame!.movedRound !== b.round &&
    (selected.rootedUntil ?? 0) < b.round &&
    (selected.stunnedUntil ?? 0) < b.round
  return (
    <div
      className={`table-field table-field--${side} duel-field`}
      aria-label={side === "player" ? "Sân của bạn" : "Sân địch"}
      data-count={units.filter((u) => !u.defeated).length}
    >
      <span className="duel-field-caption">
        {side === "player" ? "ĐỒNG MINH" : "ĐỐI THỦ"} ·{" "}
        {units.filter((u) => !u.defeated).length}/5
      </span>
      <div
        className="duel-card-row"
        style={{ "--duel-count": Math.max(1, units.length) } as CSSProperties}
      >
        {units.map((u) => {
          const c = u.cardId ? TACTICAL_CARD_MAP[u.cardId] : null
          const displayed =
            !contacted &&
            transition?.before.units.find((v) => v.instanceId === u.instanceId)
          const shown = displayed || u
          const status = duelStatuses(b, shown)
          const readiness = b.cardGame!.directed
            ? directedReadiness(b, u)
            : "ready"
          const cardTarget =
            !!card &&
            planning &&
            !busy &&
            owner.mana >= card.cost &&
            !u.defeated &&
            (card.kind === "unit"
              ? side === "player" && u.cardId === card.id && u.star === 1
              : card.kind === "spell" &&
                (card.tacticalEffect === "damage"
                  ? side === "enemy"
                  : card.tacticalEffect === "buff" && side === "player"))
          const target = cardTarget || targets.includes(u.instanceId)
          const source =
            transition?.sourceId === u.instanceId &&
            ["attack", "ultimate"].includes(transition.kind)
          const hit = transition?.impacts.some((d) => d.id === u.instanceId)
          return (
            <button
              key={u.instanceId}
              className={`table-slot duel-unit is-occupied is-${readiness} ${
                target ? "is-target" : ""
              } ${selected?.instanceId === u.instanceId ? "is-selected" : ""} ${
                u.defeated ? "is-fallen" : ""
              } ${source ? "is-acting" : ""} ${hit ? "is-hit" : ""} ${
                effects[u.instanceId] ? `fx-${effects[u.instanceId]}` : ""
              }`}
              style={
                {
                  "--card-color": c ? SCHOOLS[c.school].color : "#c6b582",
                  "--contact": `${transition?.contact ?? 0}ms`,
                } as CSSProperties
              }
              data-side={side}
              data-unit={u.instanceId}
              data-cell={`${u.cell.row}:${u.cell.column}`}
              data-status={status.map((s) => s.kind).join(" ")}
              disabled={busy || u.defeated || (!!card && !target)}
              onClick={() => onCell(side, u.cell, u)}
              aria-label={`${
                side === "enemy" ? "Địch" : "Bạn"
              }: ${u.name}, công ${u.attack}, máu ${shown.hp}/${u.maxHp}, ${
                u.cell.row === 0 ? "tiền tuyến" : "hậu tuyến"
              }, ${status.map((s) => s.label).join(", ")}${
                target ? ", mục tiêu hợp lệ" : ""
              }`}
            >
              <TacticalSpiritArt id={u.cardId ?? u.id} />
              <span className="duel-unit-position">
                {u.cell.row === 0 ? "TIỀN" : "HẬU"} <i>{"★".repeat(u.star)}</i>
              </span>
              <span className="duel-unit-name">{u.name}</span>
              <span className="duel-unit-stats">
                <b>⚔ {u.attack}</b>
                <b>♥ {shown.hp}</b>
                {shown.shield > 0 && <b>◇ {shown.shield}</b>}
              </span>
              <span className="duel-unit-energy">
                <i style={{ width: `${u.energy}%` }} />
              </span>
              <span className="duel-unit-ready">
                {readiness === "ready"
                  ? "✦ Sẵn sàng"
                  : readiness === "stunned"
                    ? "❄ Khống chế"
                    : readiness === "summoning"
                      ? "◷ Vừa gọi"
                      : "✓ Đã đánh"}
                {u.energy >= 100 ? " · ✧100" : ""}
              </span>
              {status.length > 0 && (
                <span className="duel-status-icons">
                  {status.map((s) => (
                    <i
                      key={s.kind}
                      className={`duel-status-${s.kind}`}
                      title={s.label}
                      aria-label={s.label}
                    >
                      {s.kind === "root"
                        ? "⌁"
                        : s.kind === "freeze"
                          ? "❄"
                          : s.kind === "burn"
                            ? "♨"
                            : "◇"}
                    </i>
                  ))}
                </span>
              )}
              {status.some((s) => s.kind === "root") && (
                <span className="duel-root-vines" aria-hidden="true" />
              )}
              {status.some((s) => s.kind === "burn") && (
                <span className="duel-burn-aura" aria-hidden="true" />
              )}
            </button>
          )
        })}
        {!units.length && (
          <p className="duel-empty-field">
            {side === "player"
              ? "Chọn lá trên tay để gọi Vị Linh"
              : "Sân trống · Có thể đánh Chủ tướng"}
          </p>
        )}
      </div>
      {(placing || moving) && (
        <div
          className="duel-placement"
          aria-label={
            placing ? "Chọn tuyến triệu hồi" : "Đổi tuyến một lần mỗi vòng"
          }
        >
          {([0, 1] as const).map((row) => {
            const cell = duelPlacement(
              b,
              row,
              moving ? selected?.instanceId : undefined,
            )
            const disabled =
              busy ||
              !cell ||
              (placing
                ? owner.mana < card!.cost ||
                  units.filter((u) => !u.defeated).length >= 5
                : !canMove || selected?.cell.row === row)
            return (
              <button
                key={row}
                disabled={disabled}
                onClick={() => cell && onCell("player", cell)}
              >
                {placing ? "+ Gọi" : "↔ Sang"}{" "}
                {row === 0 ? "tiền tuyến" : "hậu tuyến"}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
