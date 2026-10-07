import { useEffect, useMemo, useRef, useState } from "react"
import { playSound } from "../../infrastructure/audio/soundEngine"
import { CARD_MAP, SCHOOLS } from "../../game/catalog"
import { RELIC_MAP } from "../../game/expedition"
import { STAGE_MAP } from "../../game/story"
import { SCENES, BOSS_RULES, ENDINGS } from "../../game/narrative"
import {
  cardCost,
  playError,
  previewTarget,
  type BattleAction,
  type TargetPreview,
} from "../../game/battle"
import { useGameStore } from "../../game/useGameStore"
import { useAppStore } from "../../store/useAppStore"
import type { BattleUnit, Combatant } from "../../game/types"
import { GameCardView } from "./GameCardView"
import { CombatEffects } from "./CombatEffects"
import { StoryScene } from "./StoryScene"
import { cultureForStage } from "../../game/culture"
import { Dialog } from "./Dialog"
import { getBattleHint } from "../../game/battleCoach"
import { DuelBasics } from "./DuelBasics"
import { stageArtId } from "../../game/storyArt"

interface SpellSelection {
  type: "play"
  index: number
}
interface AttackSelection {
  type: "attack"
  uid: string
}
type Selection = SpellSelection | AttackSelection
interface UnitProps {
  unit: BattleUnit
  enemy: boolean
  selected: boolean
  disabled: boolean
  ghost: boolean
  preview?: TargetPreview
  delta?: number
  shieldDelta?: number
  source: boolean
  summoned: boolean
  hit: boolean
  stamp: string
  onClick(): void
  onInspect(): void
}
function UnitTile({
  unit: u,
  enemy,
  selected,
  disabled,
  ghost,
  preview,
  delta = 0,
  shieldDelta = 0,
  source,
  summoned,
  hit,
  stamp,
  onClick,
  onInspect,
}: UnitProps) {
  const card = CARD_MAP[u.cardId]
  return (
    <div className={`tcg-unit-wrap ${ghost ? "is-fallen" : ""}`}>
      <button
        className={`tcg-unit ${!enemy && u.ready ? "is-ready" : ""} ${
          selected ? "is-selected" : ""
        } ${preview?.legal ? "is-target" : ""} ${hit ? "is-hit" : ""} ${
          source ? "is-acting" : ""
        } ${summoned ? "is-summoned" : ""}`}
        data-unit={u.uid}
        onClick={onClick}
        disabled={disabled || ghost}
        aria-label={`${
          enemy ? "Địch" : "Đồng minh"
        } ${card.name}, công ${u.attack}, máu ${
          ghost ? 0 : u.health
        }, chắn ${u.shield}${preview ? `, ${preview.text}` : ""}`}
      >
        {card.art ? (
          <img src={card.art} alt="" />
        ) : (
          <span className="tcg-unit-symbol">{card.symbol}</span>
        )}
        <span className="tcg-unit-name">{card.name}</span>
        <span className="tcg-unit-stats">
          <b>⚔ {u.attack}</b>
          {u.shield > 0 && <b className="shield">◇ {u.shield}</b>}
          <b>♥ {ghost ? 0 : u.health}</b>
        </span>
        <small>
          {ghost
            ? "BỊ HẠ GỤC"
            : u.keywords.includes("guard")
              ? "HỘ VỆ"
              : u.keywords.includes("drain")
                ? "HÚT VỊ"
                : enemy
                  ? SCHOOLS[card.school].name
                  : u.ready
                    ? "SẴN SÀNG"
                    : "CHỜ LƯỢT SAU"}
        </small>
        {(delta !== 0 || shieldDelta !== 0) && (
          <span
            key={stamp}
            className={`tcg-float-number ${delta > 0 ? "heal" : "damage"}`}
          >
            {delta !== 0 ? `${delta > 0 ? "+" : ""}${delta} ♥` : ""}
            {shieldDelta !== 0 && (
              <small>
                {shieldDelta > 0 ? "+" : ""}
                {shieldDelta} ◇
              </small>
            )}
          </span>
        )}
        {preview?.legal && (
          <span className="tcg-target-preview">
            {preview.defeated ? "✦ HẠ GỤC" : `−${preview.damage} ♥`}
            {preview.counter > 0 && (
              <small>
                Phản đòn −{preview.counter}
                {preview.attackerDefeated ? " · đổi quân" : ""}
              </small>
            )}
          </span>
        )}
      </button>
      <button
        className="tcg-unit-info"
        onClick={onInspect}
        aria-label={`Xem kỹ năng ${card.name}`}
      >
        i
      </button>
    </div>
  )
}
function healthDelta(
  before: Combatant | BattleUnit | undefined,
  after: Combatant | BattleUnit | undefined,
) {
  return before
    ? Math.max(0, after?.health ?? 0) - Math.max(0, before.health)
    : 0
}

export function BattleBoard({ onExit }: { onExit: () => void }) {
  const stored = useGameStore((s) => s.save.battle)!
  const presentation = useGameStore((s) => s.presentation)
  const ending = useGameStore((s) => s.save.storyEnding)
  const act = useGameStore((s) => s.act)
  const leaveBattle = useGameStore((s) => s.leaveBattle)
  const soundEnabled = useAppStore((s) => s.user.preferences.soundEnabled)
  const playedSound = useRef("")
  const reducedMotion = useAppStore((s) => s.user.preferences.reducedMotion)
  const systemReduced =
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
  const [playback, setPlayback] = useState({
    sequence: presentation?.sequence ?? 0,
    index: presentation?.frames.length ?? 0,
  })
  const replay = presentation?.battleId === stored.id ? presentation : null
  const frameIndex =
    replay && playback.sequence === replay.sequence ? playback.index : -1
  const busy =
    !!replay &&
    !reducedMotion &&
    !systemReduced &&
    frameIndex < replay.frames.length
  const frame = busy && frameIndex >= 0 ? replay!.frames[frameIndex] : undefined
  const battle = busy ? (frame?.battle ?? replay!.before) : stored
  const stamp = `${replay?.sequence}-${frameIndex}`
  const arena = useRef<HTMLDivElement>(null)
  const inFlight = useRef(false)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [replace, setReplace] = useState<number[]>([])
  const [openingInspect, setOpeningInspect] = useState<number | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [showLog, setShowLog] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [showTactics, setShowTactics] = useState(false)
  const [detail, setDetail] = useState(false)
  const [inspect, setInspect] = useState<string | null>(null)
  const [endRead, setEndRead] = useState(false)
  const hint = useMemo(
    () => (busy ? null : getBattleHint(battle)),
    [battle, busy],
  )
  const readyCount = battle.player.board.filter((unit) => unit.ready).length
  useEffect(() => {
    if (!busy || !replay) {
      inFlight.current = false
      return
    }
    const timer = window.setTimeout(
      () => setPlayback({ sequence: replay.sequence, index: frameIndex + 1 }),
      frameIndex < 0 ? 90 : frame?.event.kind === "attack" ? 820 : 690,
    )
    return () => window.clearTimeout(timer)
  }, [busy, replay, frameIndex, frame?.event.kind])
  useEffect(() => {
    setSelection(null)
    setReplace([])
    setEndRead(false)
  }, [stored.id])
  useEffect(() => {
    if (!frame || playedSound.current === stamp) return
    playedSound.current = stamp
    const cue =
      frame.event.kind === "attack"
        ? "impact"
        : frame.event.kind === "play"
          ? "pulse"
          : "tick"
    playSound(cue, soundEnabled, 0.65)
  }, [frame, stamp, soundEnabled])
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector("dialog[open]"))
        setSelection(null)
    }
    window.addEventListener("keydown", escape)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", escape)
    }
  }, [])
  const execute = (action: BattleAction) => {
    if (busy || inFlight.current) return
    inFlight.current = true
    playSound("tick", soundEnabled, 0.4)
    setSelection(null)
    setDetail(false)
    if (!act(action)) inFlight.current = false
  }
  const selectedAttacker =
    selection?.type === "attack"
      ? battle.player.board.find((u) => u.uid === selection.uid)
      : null
  const selectedCard =
    selection?.type === "play"
      ? CARD_MAP[battle.player.hand[selection.index]]
      : null
  const selectedError =
    selection?.type === "play" ? playError(battle, selection.index) : null
  const targeting =
    !!selection &&
    (selection.type === "attack" || selectedCard?.effect === "damage") &&
    !selectedError &&
    !busy
  const preview = (uid: string) =>
    targeting ? previewTarget(battle, selection!, uid) : undefined
  const target = (uid: string) => {
    if (selection && preview(uid)?.legal) execute({ ...selection, target: uid })
  }
  const stage = battle.stageId ? STAGE_MAP[battle.stageId] : null
  const culturalPage = stage ? cultureForStage(stage.id) : undefined
  const rule = battle.stageId ? BOSS_RULES[battle.stageId] : null
  const school = battle.player.chainSchool
    ? SCHOOLS[battle.player.chainSchool]
    : null
  const heroPreview = preview("hero")
  const exit = () => {
    leaveBattle()
    onExit()
  }
  const skip = () => {
    if (replay)
      setPlayback({ sequence: replay.sequence, index: replay.frames.length })
    inFlight.current = false
  }
  const field = (side: "player" | "enemy") => {
    const units = [...battle[side].board]
    const ghosts =
      frame?.before[side].board.filter(
        (u) => !units.some((next) => next.uid === u.uid),
      ) ?? []
    return (
      <div className={`tcg-field ${side === "enemy" ? "enemy" : ""}`}>
        {[...units, ...ghosts].map((u) => {
          const previous = frame?.before[side].board.find(
            (old) => old.uid === u.uid,
          )
          const next = battle[side].board.find((next) => next.uid === u.uid)
          const delta = frame ? healthDelta(previous, next) : 0
          const shieldDelta = previous
            ? (next?.shield ?? 0) - previous.shield
            : 0
          const projected = side === "enemy" ? preview(u.uid) : undefined
          return (
            <UnitTile
              key={u.uid}
              unit={u}
              enemy={side === "enemy"}
              ghost={!next}
              selected={selection?.type === "attack" && selection.uid === u.uid}
              disabled={
                busy ||
                !!battle.result ||
                !!battle.opening ||
                (side === "enemy" && !!selection && !projected?.legal)
              }
              preview={projected}
              delta={delta}
              shieldDelta={shieldDelta}
              source={
                frame?.event.kind === "attack" && frame.event.source === u.uid
              }
              summoned={!!frame && !previous && !!next}
              hit={delta < 0 || shieldDelta < 0}
              stamp={stamp}
              onInspect={() => {
                if (!busy && !stored.result) setInspect(u.cardId)
              }}
              onClick={() => {
                if (side === "enemy") {
                  if (targeting) target(u.uid)
                  else setInspect(u.cardId)
                } else if (!u.ready) setInspect(u.cardId)
                else
                  setSelection(
                    selection?.type === "attack" && selection.uid === u.uid
                      ? null
                      : { type: "attack", uid: u.uid },
                  )
              }}
            />
          )
        })}
        {Array.from(
          { length: Math.max(0, 3 - units.length - ghosts.length) },
          (_, i) => (
            <span className="tcg-empty-slot" key={`empty-${i}`}>
              ◇
            </span>
          ),
        )}
      </div>
    )
  }
  const playerDelta = frame
    ? healthDelta(frame.before.player, battle.player)
    : 0
  const enemyDelta = frame ? healthDelta(frame.before.enemy, battle.enemy) : 0
  return (
    <section className="tcg-battle tcg-viewport-battle">
      <header className="tcg-battle-top">
        <div>
          <span className="tcg-kicker">
            {battle.expedition
              ? "CON ĐƯỜNG QUA SƯƠNG · THÁM HIỂM"
              : stage
                ? stage.chapter.title
                : "LUYỆN TẬP · ĐẤU VỚI AI"}
          </span>
          <h1>
            {stage?.title ??
              (battle.expedition ? battle.opponent : "Bàn ăn thử thách")}
          </h1>
        </div>
        <div className="tcg-battle-actions">
          <button
            className="tcg-button ghost"
            onClick={() => {
              if (busy) skip()
              else if (battle.result) exit()
              else setConfirm(true)
            }}
          >
            {busy ? "Bỏ qua hiệu ứng" : "Rời trận"}
          </button>
        </div>
      </header>
      {(battle.expedition || rule) && (
        <button
          className={`tcg-tactics-ribbon ${
            rule && battle.enemy.health <= battle.enemy.maxHealth / 2
              ? "is-awakened"
              : ""
          }`}
          onClick={() => setShowTactics(true)}
        >
          <strong>
            {rule
              ? `☽ ${rule.name}${
                  battle.enemy.health <= battle.enemy.maxHealth / 2
                    ? " · THỨC TỈNH"
                    : ""
                }`
              : `◈ Thám hiểm · ${battle.expedition!.relics.length} di vật`}
          </strong>
          <span>
            {rule?.text ?? "Máu giữ giữa các trận · Chạm để xem di vật"}
          </span>
          <b>i</b>
        </button>
      )}
      <div className={`tcg-arena ${busy ? "is-resolving" : ""}`} ref={arena}>
        <div className="tcg-arena-top">
          <span>
            AI · {battle.enemy.hand.length} lá trên tay ·{" "}
            {battle.enemy.deck.length} trong bộ
          </span>
          <div>
            <button
              className="tcg-button ghost"
              disabled={busy}
              onClick={() => setShowRules(!showRules)}
            >
              Luật đấu
            </button>
            <button
              className="tcg-button ghost"
              onClick={() => setShowLog(!showLog)}
            >
              Nhật ký
            </button>
          </div>
        </div>
        <button
          className={`tcg-hero enemy ${heroPreview?.legal ? "is-target" : ""} ${
            enemyDelta < 0 ? "is-hit" : ""
          }`}
          data-hero="enemy"
          onClick={() => target("hero")}
          disabled={!heroPreview?.legal || busy || !!battle.result}
          aria-label={`Chủ tướng địch ${battle.opponent}, ${battle.enemy.health} máu${
            heroPreview ? `, ${heroPreview.text}` : ""
          }`}
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
          {enemyDelta !== 0 && (
            <span
              key={stamp}
              className={`tcg-float-number ${
                enemyDelta > 0 ? "heal" : "damage"
              }`}
            >
              {enemyDelta > 0 ? "+" : ""}
              {enemyDelta} ♥
            </span>
          )}
          {heroPreview?.legal && (
            <span className="tcg-hero-preview">{heroPreview.text}</span>
          )}
        </button>
        {field("enemy")}
        <div className={`tcg-turn-bar ${busy ? "enemy-turn" : ""}`}>
          <span>LƯỢT {battle.round}</span>
          <p role="status">
            {battle.opening
              ? "Chuẩn bị bài mở đầu"
              : busy
                ? (frame?.event.label ?? "Đang thực hiện hành động…")
                : targeting
                  ? "Chọn mục tiêu · Xem sát thương và phản đòn"
                  : selectedCard
                    ? "Đọc kỹ năng, rồi xác nhận dùng bài"
                    : readyCount
                      ? `${readyCount} đồng minh sẵn sàng · Chọn quân, rồi mục tiêu`
                      : "LƯỢT CỦA BẠN · Gọi Vị Linh bằng thẻ trên tay"}
          </p>
          {busy ? (
            <button className="tcg-button ghost" onClick={skip}>
              Bỏ qua ⏩
            </button>
          ) : selection ? (
            <button
              className="tcg-button ghost"
              onClick={() => setSelection(null)}
            >
              Hủy chọn
            </button>
          ) : (
            <button
              className="tcg-button gold"
              onClick={() => execute({ type: "end" })}
              disabled={!!battle.result || !!battle.opening}
            >
              Kết thúc lượt →
            </button>
          )}
        </div>
        {field("player")}
        <div
          className={`tcg-hero ${playerDelta < 0 ? "is-hit" : ""}`}
          data-hero="player"
        >
          <span className="tcg-avatar player">✦</span>
          <span>
            <strong>Người giữ vị</strong>
            <small>
              {battle.player.deck.length} lá trong bộ ·{" "}
              {battle.player.hand.length}/8 trên tay
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
          {playerDelta !== 0 && (
            <span
              key={stamp}
              className={`tcg-float-number ${
                playerDelta > 0 ? "heal" : "damage"
              }`}
            >
              {playerDelta > 0 ? "+" : ""}
              {playerDelta} ♥
            </span>
          )}
        </div>
        <div
          className={`tcg-resonance ${
            school && !battle.player.resonanceUsed ? "is-charged" : ""
          }`}
        >
          <span>✦ CỘNG HƯỞNG</span>
          <p>
            {battle.player.resonanceUsed
              ? "Đã kích hoạt · Hồi lại lượt sau"
              : school
                ? `${school.name} tiếp theo giảm 1 năng lượng`
                : "Hai lá cùng hệ liên tiếp → lá thứ hai giảm 1"}
          </p>
          <small>1 lần/lượt</small>
        </div>

        <div className="tcg-hand">
          {battle.player.hand.map((id, index) => (
            <GameCardView
              key={`${index}-${id}`}
              card={CARD_MAP[id]}
              cost={cardCost(battle.player, CARD_MAP[id])}
              compact
              playable={!playError(battle, index) && !busy}
              muted={!!playError(battle, index)}
              selected={selection?.type === "play" && selection.index === index}
              disabled={busy || !!battle.result || !!battle.opening}
              onClick={() =>
                setSelection(
                  selection?.type === "play" && selection.index === index
                    ? null
                    : { type: "play", index },
                )
              }
            />
          ))}
          {!battle.player.hand.length && (
            <p className="tcg-empty">
              Hết bài trên tay. Kết thúc lượt để rút thêm.
            </p>
          )}
        </div>
        <div className="tcg-command-dock" aria-label="Lựa chọn chiến thuật">
          {selectedCard && !busy && (
            <div className="tcg-selected-card">
              <span className="tcg-selection-symbol">
                {selectedCard.symbol}
              </span>
              <div>
                <span className="tcg-kicker">
                  {SCHOOLS[selectedCard.school].name} ·{" "}
                  {cardCost(battle.player, selectedCard)} NĂNG LƯỢNG
                  {selectedCard.kind === "unit" &&
                    ` · ⚔ ${selectedCard.attack} · ♥ ${selectedCard.health}`}
                </span>
                <h3>{selectedCard.name}</h3>
                <p>{selectedCard.text}</p>
                <small>
                  {selectedCard.kind === "unit"
                    ? selectedCard.keywords.includes("rush")
                      ? "Được tấn công ngay khi vào sân."
                      : "Chờ đến lượt sau để tấn công."
                    : selectedCard.effect === "damage"
                      ? "Chọn đơn vị địch hoặc chủ tướng · Vượt Hộ vệ."
                      : "Hiệu ứng áp dụng ngay sau khi xác nhận."}
                </small>
              </div>
              <button
                className="tcg-card-detail-button"
                onClick={() => setDetail(true)}
                aria-label={`Đọc đầy đủ ${selectedCard.name}`}
              >
                i
              </button>
              {selectedError ? (
                <span className="tcg-play-error">{selectedError}</span>
              ) : selectedCard.effect !== "damage" ? (
                <button
                  className="tcg-button primary"
                  onClick={() =>
                    selection?.type === "play" && execute(selection)
                  }
                >
                  {selectedCard.kind === "unit" ? "Triệu hồi" : "Thi triển"} ·{" "}
                  {cardCost(battle.player, selectedCard)} ◈
                </button>
              ) : (
                <span className="tcg-select-target">
                  ↑ Chọn mục tiêu phát sáng
                </span>
              )}
            </div>
          )}
          {selection?.type === "attack" && selectedAttacker && !busy && (
            <div className="tcg-attack-guide">
              <strong>⚔ {CARD_MAP[selectedAttacker.cardId].name}</strong>
              <span>
                Nhấn mục tiêu phát sáng. Sát thương dự báo đã tính lá chắn; hai
                đơn vị phản đòn đồng thời.
              </span>
            </div>
          )}
          {!selection && (
            <div className="tcg-command-idle tcg-coach" role="status">
              <span>✦</span>
              <div>
                <strong>
                  {busy
                    ? "Vị Linh đang hành động"
                    : (hint?.title ?? "Bàn Ký Ức")}
                </strong>
                <p>
                  {busy
                    ? "Có thể bỏ qua hiệu ứng"
                    : (hint?.reason ??
                      "Chọn bài trên tay hoặc đồng minh để bắt đầu.")}
                </p>
              </div>
              {hint?.action && !busy && (
                <button
                  className="tcg-button ghost"
                  onClick={() => {
                    const action = hint.action!
                    setSelection(
                      action.type === "attack"
                        ? { type: "attack", uid: action.uid }
                        : { type: "play", index: action.index },
                    )
                    requestAnimationFrame(() => {
                      const targetButton =
                        action.target === "hero"
                          ? arena.current?.querySelector<HTMLButtonElement>(
                              '[data-hero="enemy"]',
                            )
                          : action.target
                            ? Array.from(
                                arena.current?.querySelectorAll<HTMLButtonElement>(
                                  "[data-unit]",
                                ) ?? [],
                              ).find(
                                (button) =>
                                  button.dataset.unit === action.target,
                              )
                            : arena.current?.querySelector<HTMLButtonElement>(
                                ".tcg-selected-card>.tcg-button",
                              )
                      targetButton?.focus({ preventScroll: true })
                    })
                  }}
                >
                  Gợi ý →
                </button>
              )}
            </div>
          )}
        </div>
        <p className="tcg-arena-hint">
          Hộ vệ chặn đòn đánh, không chặn phép · Tối đa 3 đồng minh · 7 năng
          lượng · 8 lá trên tay
        </p>
        <CombatEffects arena={arena} frame={frame} stamp={stamp} />
        {frame?.event.cardId && (
          <div className="tcg-action-card" key={stamp} aria-hidden="true">
            <span>{CARD_MAP[frame.event.cardId].symbol}</span>
            <strong>{CARD_MAP[frame.event.cardId].name}</strong>
            <small>
              {frame.event.kind === "attack"
                ? "TẤN CÔNG"
                : frame.event.side === "enemy"
                  ? "ĐỐI THỦ THI TRIỂN"
                  : "THI TRIỂN"}
            </small>
          </div>
        )}
      </div>
      {showLog && (
        <Dialog title="Nhật ký trận" onClose={() => setShowLog(false)}>
          <ol className="tcg-live-log">
            {battle.log.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </Dialog>
      )}
      {showTactics && (
        <Dialog
          title={rule ? rule.name : "Di vật hành trình"}
          onClose={() => setShowTactics(false)}
        >
          {rule && (
            <div className="tcg-tactic">
              <p>{rule.text}</p>
              <strong>
                Trạng thái:{" "}
                {battle.enemy.health <= battle.enemy.maxHealth / 2
                  ? "Thức tỉnh"
                  : "Bình thường"}
              </strong>
            </div>
          )}
          {battle.expedition && (
            <div className="tcg-rules-list">
              <p>Máu giữ sau trận; đầu hàng kết thúc chuyến đi.</p>
              {battle.expedition.relics.map((id) => (
                <p key={id}>
                  <strong>
                    {RELIC_MAP[id].symbol} {RELIC_MAP[id].name}:
                  </strong>{" "}
                  {RELIC_MAP[id].text}
                </p>
              ))}
            </div>
          )}
        </Dialog>
      )}
      {detail && selectedCard && (
        <Dialog title={selectedCard.name} onClose={() => setDetail(false)}>
          <div className="tcg-inspect-card">
            <GameCardView card={selectedCard} />
            <p>{selectedCard.text}</p>
            <blockquote>{selectedCard.lore}</blockquote>
          </div>
        </Dialog>
      )}
      {showRules && (
        <Dialog title="Luật chiến đấu" onClose={() => setShowRules(false)}>
          <div className="tcg-rules-list">
            <p className="tcg-duel-meaning">
              <strong>Vì sao món ăn chiến đấu?</strong> Thẻ giữ Ấn Vị và gọi ra
              Vị Linh trên Bàn Ký Ức. Dấu ♥ của chủ tướng là ý chí giữ bàn;
              thắng giúp ký ức thoát khỏi sương.
            </p>
            <DuelBasics />
            <p>
              <strong>Mục tiêu:</strong> Đưa máu chủ tướng địch về 0. Mỗi lượt
              rút 1 lá, tăng 1 năng lượng tối đa và hồi đầy (trần 7).
            </p>
            <p>
              <strong>Ra bài:</strong> Mỗi bên có 3 ô. Đồng minh chờ lượt sau;
              Xung phong đánh ngay. Đồng hệ với một quân trên sân: quân mới +1
              chắn.
            </p>
            <p>
              <strong>Cộng hưởng:</strong> Hai lá cùng hệ liên tiếp trong lượt
              giảm 1 chi phí lá thứ hai, tối đa 1 lần/lượt. Đánh bằng đơn vị
              không ngắt chuỗi bài.
            </p>
            <p>
              <strong>Đánh và phản đòn:</strong> Mỗi đơn vị đánh 1 lần/lượt. Hai
              đơn vị gây sát thương cùng lúc. Chắn bị trừ trước máu. Hộ vệ bảo
              vệ các mục tiêu khác; phép vượt Hộ vệ.
            </p>
            <p>
              <strong>Hút vị:</strong> Hồi máu chủ tướng bằng sát thương thực tế
              gây vào máu, kể cả phản đòn. Sát thương bị chắn không hồi máu.
            </p>
            <p>
              <strong>Cạn bài:</strong> Không thể rút sẽ chịu kiệt sức 1, 2, 3…
              sát thương. Tay đầy 8 lá sẽ bỏ lá rút thêm.
            </p>
          </div>
        </Dialog>
      )}
      {inspect && (
        <Dialog title={CARD_MAP[inspect].name} onClose={() => setInspect(null)}>
          <div className="tcg-inspect-card">
            <GameCardView card={CARD_MAP[inspect]} />
            <p>{CARD_MAP[inspect].text}</p>
            <blockquote>{CARD_MAP[inspect].lore}</blockquote>
          </div>
        </Dialog>
      )}
      {confirm && (
        <Dialog title="Đầu hàng trận đấu?" onClose={() => setConfirm(false)}>
          <p>
            {battle.expedition
              ? "Đầu hàng sẽ kết thúc chuyến thám hiểm này."
              : "Trận này tính là thua. Bạn có thể thử lại bất kỳ lúc nào."}
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
      {stored.opening && !busy && (
        <Dialog
          title="Bữa ăn bắt đầu từ lựa chọn"
          onClose={() => execute({ type: "mulligan", indices: replace })}
          wide
        >
          <p>
            Chọn tối đa 3 lá để đổi, rồi bắt đầu. Ưu tiên lá giá thấp và hai lá
            cùng hệ để Cộng hưởng. Lá trả lại sẽ vào bộ bài sau khi rút lá thay
            thế.
          </p>
          <DuelBasics />
          <div className="tcg-mulligan-hand">
            {stored.player.hand.map((id, index) => (
              <div
                key={index}
                className={replace.includes(index) ? "is-replacing" : ""}
              >
                <GameCardView
                  card={CARD_MAP[id]}
                  compact
                  selected={replace.includes(index)}
                  onClick={() => {
                    setOpeningInspect(index)
                    setReplace((old) =>
                      old.includes(index)
                        ? old.filter((i) => i !== index)
                        : old.length < 3
                          ? [...old, index]
                          : old,
                    )
                  }}
                />
                <span>
                  {replace.includes(index) ? "↻ ĐỔI LÁ NÀY" : "GIỮ LẠI"}
                </span>
              </div>
            ))}
          </div>
          {openingInspect !== null && (
            <p className="tcg-opening-inspect">
              <strong>
                {CARD_MAP[stored.player.hand[openingInspect]].name}:
              </strong>{" "}
              {CARD_MAP[stored.player.hand[openingInspect]].text}
            </p>
          )}
          <div className="tcg-dialog-actions">
            <span>
              {replace.length}/3 lá được đổi · Bắt đầu với {stored.player.mana}{" "}
              năng lượng
            </span>
            <button
              className="tcg-button primary"
              onClick={() => execute({ type: "mulligan", indices: replace })}
            >
              {replace.length
                ? `Đổi ${replace.length} lá & bắt đầu`
                : "Giữ bài & bắt đầu"}{" "}
              →
            </button>
          </div>
        </Dialog>
      )}
      {stored.result && !busy && (
        <Dialog
          title={
            stored.result === "win"
              ? "Hương vị chiến thắng"
              : "Ngọn lửa vẫn còn"
          }
          onClose={exit}
          wide
        >
          <div className={`tcg-result ${stored.result}`}>
            <span className="tcg-result-symbol">
              {stored.result === "win" ? "✦" : "☽"}
            </span>
            {stored.result === "win" && stage ? (
              <StoryScene
                key={stored.id}
                lines={SCENES[stage.id].after}
                art={stageArtId(stage.id)}
                onComplete={() => setEndRead(true)}
              />
            ) : (
              <p>
                {stored.result === "loss"
                  ? "Mỗi thất bại là một công thức cần nêm lại. Thử thêm thẻ giá thấp, Hộ vệ hoặc phép hồi máu."
                  : stored.expedition
                    ? stored.opponent === "Kẻ Nuốt Ký Ức"
                      ? "Bạn đã vượt màn sương cuối. Trở về đọc đoạn kết và nhận những người lạc đường vào bàn ăn."
                      : "Bạn giữ máu còn lại, nhận lương thực. Trở về chọn thẻ và tiếp tục chuyến đi."
                    : "Một công thức tốt bắt đầu từ những lần thử. Trận luyện tập đã hoàn thành."}
              </p>
            )}
            {stored.result === "win" &&
              stored.stageId === "last-table-3" &&
              endRead && (
                <div className="tcg-ending-choice">
                  <h3>Bạn viết câu cuối như thế nào?</h3>
                  <p>
                    Lựa chọn chỉ đổi đoạn kết. Phần thưởng và bộ sưu tập được
                    giữ nguyên.
                  </p>
                  <div className="tcg-choice-row">
                    {(["remember", "release"] as const).map((id) => (
                      <button
                        key={id}
                        className={ending === id ? "active" : ""}
                        onClick={() => useGameStore.getState().chooseEnding(id)}
                        aria-pressed={ending === id}
                      >
                        <span>{id === "remember" ? "◈" : "✦"}</span>
                        <strong>
                          {id === "remember"
                            ? "Trả ký ức về"
                            : "Viết công thức mới"}
                        </strong>
                        <small>
                          {id === "remember"
                            ? "Tiếng vọng đi, câu chuyện ở lại."
                            : "Bạn được sống; bà sẽ không còn nhận ra bạn."}
                        </small>
                      </button>
                    ))}
                  </div>
                  {ending && (
                    <article className="tcg-epilogue">
                      <h3>{ENDINGS[ending].title}</h3>
                      <StoryScene
                        key={ending}
                        art={ending === "remember" ? "last-table" : "lantern"}
                        lines={[
                          { speaker: "Người kể", text: ENDINGS[ending].text },
                          {
                            speaker: "Nhiều năm sau",
                            text: ENDINGS[ending].epilogue,
                          },
                        ]}
                      />
                    </article>
                  )}
                </div>
              )}
            {stored.result === "win" && endRead && culturalPage && (
              <aside className="tcg-culture-discovery">
                <span className="tcg-kicker">TRANG VIỆT NAM ĐÃ MỞ</span>
                <h3>{culturalPage.title}</h3>
                <p>
                  Trở về hành trình và mở sổ văn hóa để xem ký ức, giới thiệu
                  Việt / Anh và nguồn khám phá ngoài đời.
                </p>
              </aside>
            )}
            <div className="tcg-reward-row">
              <span>◉ +{stored.loot?.coins ?? 0} xu</span>
              <span>✧ +{stored.loot?.xp ?? 0} XP</span>
              {!!stored.loot?.dust && (
                <span>✧ +{stored.loot.dust} tinh chất</span>
              )}
              {!!stored.loot?.tickets && (
                <span>▱ +{stored.loot.tickets} vé</span>
              )}
            </div>
            {stored.loot?.cardId && (
              <div className="tcg-result-card">
                <GameCardView card={CARD_MAP[stored.loot.cardId]} compact />
                <p>
                  Phần thưởng hoàn thành lần đầu.
                  <br />
                  Đủ 2 bản sẽ nhận tinh chất thay thế.
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
