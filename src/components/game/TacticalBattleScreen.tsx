import { useEffect, useMemo, useRef, useState } from "react"
import {
  createTacticalBattle,
  playAutomaticRound,
  reduceTacticalBattle,
  type CreateBattleOptions,
  type TacticalBattleState,
  type TrapId,
} from "../../game/tacticalTcg/engine"
import {
  claimBattleReward,
  readTacticalProgress,
  saveTacticalCheckpoint,
  withTacticalLock,
} from "../../game/tacticalTcg/progression"
import { TACTICAL_CARD_MAP } from "../../game/tacticalTcg/cards"
import { emptyCardCell } from "../../game/tacticalTcg/engine/cardRuntime"
import { GameCardView } from "./GameCardView"
import { Dialog } from "./Dialog"
import "../../game/tacticalBattle.css"

const TUTORIAL_KEY = "soul-of-meal.tactical-tcg.battle-tutorial.v1"
interface TrapChoice {
  id: TrapId
  name: string
  detail: string
  glyph: string
}
const TRAPS: TrapChoice[] = [
  {
    id: "bamboo-guard",
    name: "Mành Tre",
    detail: "Chắn 20 sát thương",
    glyph: "▥",
  },
  {
    id: "steam-counter",
    name: "Hơi Nóng",
    detail: "Phản lại 12 sát thương",
    glyph: "♨",
  },
  {
    id: "warm-broth",
    name: "Nước Dùng",
    detail: "Hồi 18 khi nguy cấp",
    glyph: "◉",
  },
]
const PHASE_LABELS: Record<TacticalBattleState["phase"], string> = {
  planning: "Dàn trận",
  clash: "Giao chiến",
  reaction: "Phản ứng",
  ultimate: "Tuyệt kỹ",
  "round-end": "Kết vòng",
  result: "Kết quả",
}
const ROLE_LABELS = {
  guardian: { name: "Hộ vệ", glyph: "◈" },
  striker: { name: "Đấu sĩ", glyph: "⚔" },
  support: { name: "Hỗ trợ", glyph: "✦" },
  mage: { name: "Pháp sư", glyph: "◇" },
} as const
const percent = (value: number, max: number) =>
  Math.max(0, Math.min(100, (value / max) * 100))

function CommanderPanel({
  side,
  hp,
  maxHp,
}: {
  side: "player" | "enemy"
  hp: number
  maxHp: number
}) {
  const player = side === "player"
  return (
    <article className="tactical-commander" data-side={side}>
      <span className="tactical-commander__sigil" aria-hidden="true">
        {player ? "契" : "厄"}
      </span>
      <div>
        <small>{player ? "GIAO ƯỚC CỦA BẠN" : "Ý CHÍ KẺ ĐỊCH"}</small>
        <strong>
          {hp} <i>/ {maxHp}</i>
        </strong>
        <span
          className="tactical-commander__meter"
          role="progressbar"
          aria-label={`${
            player ? "Sinh lực của bạn" : "Sinh lực địch"
          }: ${hp}/${maxHp}`}
          aria-valuemin={0}
          aria-valuemax={maxHp}
          aria-valuenow={hp}
        >
          <i style={{ width: `${percent(hp, maxHp)}%` }} />
        </span>
      </div>
    </article>
  )
}

export function TacticalBattleScreen({
  options,
  mangaChapterId,
  onProgress,
  onComplete,
}: {
  options?: Partial<CreateBattleOptions>
  mangaChapterId?: string | null
  onProgress?: () => void
  onComplete?: () => void
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
          deck: options?.deck,
          enemyDeck: options?.enemyDeck,
          rewardCardId: options?.rewardCardId,
          enemyManaPenalty: options?.enemyManaPenalty,
        }),
      [battleId],
    )
  const [battle, setBattle] = useState<TacticalBattleState>(() => {
      const saved = options?.deck
        ? readTacticalProgress(localStorage).checkpoint
        : null
      return saved?.battleId === battleId && saved.mode === initial.mode
        ? saved
        : initial
    }),
    [selected, setSelected] = useState<string | null>(null),
    [trapColumn, setTrapColumn] = useState<0 | 1 | 2 | 3>(1),
    [showTutorial, setShowTutorial] = useState(
      () => localStorage.getItem(TUTORIAL_KEY) !== "done",
    ),
    [claimStatus, setClaimStatus] = useState("")
  const battleRef = useRef(battle)
  const commandPending = useRef(false)
  const hitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [visualHits, setVisualHits] = useState<Record<string, string>>({})
  useEffect(
    () => () => {
      if (hitTimer.current) clearTimeout(hitTimer.current)
    },
    [],
  )
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [showLog, setShowLog] = useState(false)
  const cards = battle.cardGame?.sides.player
  const chosenCard =
    selectedCard !== null && cards
      ? TACTICAL_CARD_MAP[cards.hand[selectedCard]]
      : null
  const updateBattle = async (
    update: (current: TacticalBattleState) => TacticalBattleState,
  ) => {
    if (commandPending.current) return false
    commandPending.current = true
    try {
      return await withTacticalLock(() => {
        const next = update(battleRef.current)
        if (next === battleRef.current) {
          setClaimStatus(
            "Hành động chưa hợp lệ. Kiểm tra Lửa Bếp, ô trống và mục tiêu của thẻ.",
          )
          return false
        }
        try {
          if (next.cardGame) saveTacticalCheckpoint(localStorage, next)
          const hits: Record<string, string> = {}
          for (const unit of next.units) {
            const before = battleRef.current.units.find(
              (u) => u.instanceId === unit.instanceId,
            )
            if (before && before.hp !== unit.hp)
              hits[unit.instanceId] = unit.hp < before.hp ? "damage" : "heal"
          }
          setVisualHits(hits)
          if (hitTimer.current) clearTimeout(hitTimer.current)
          hitTimer.current = setTimeout(() => setVisualHits({}), 450)
          battleRef.current = next
          setBattle(next)
          setClaimStatus("")
          return true
        } catch (e) {
          setClaimStatus(`Chưa lưu được trận: ${(e as Error).message}`)
          return false
        }
      })
    } catch (e) {
      setClaimStatus((e as Error).message)
      return false
    } finally {
      commandPending.current = false
    }
  }
  const playSelected = async (
    cell?: { row: 0 | 1; column: 0 | 1 | 2 | 3 },
    targetId?: string,
  ) => {
    if (selectedCard === null || !chosenCard) return
    const position =
      cell ??
      emptyCardCell(battle, "player", chosenCard.tacticalRole !== "guardian") ??
      undefined
    if (
      await updateBattle((current) =>
        reduceTacticalBattle(current, {
          id: `card:${current.round}:${current.processedActionIds.length}`,
          type: "play-card",
          side: "player",
          handIndex: selectedCard,
          cell: position,
          targetId,
          column: trapColumn,
        }),
      )
    )
      setSelectedCard(null)
  }
  const living = (side: "player" | "enemy") =>
    battle.units.filter((unit) => unit.side === side && !unit.defeated)
  const traitCounts = new Map<string, number>()
  for (const unit of living("player"))
    for (const trait of unit.traits)
      traitCounts.set(trait, (traitCounts.get(trait) ?? 0) + 1)
  const synergies = [...traitCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
  const schoolCount = new Set(
    living("player")
      .filter((u) => u.cardId)
      .map((u) => TACTICAL_CARD_MAP[u.cardId!].school),
  ).size
  const selectedUnit = battle.units.find(
      (unit) => unit.instanceId === selected && !unit.defeated,
    ),
    activeTrap = battle.traps.find(
      (trap) => trap.side === "player" && trap.armed,
    )
  const move = (row: 0 | 1, column: 0 | 1 | 2 | 3) => {
    if (selected)
      updateBattle((current) =>
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
    updateBattle((current) =>
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
  const claim = async () => {
    if (!battle.reward) return
    try {
      const result = await withTacticalLock(() =>
        claimBattleReward(localStorage, battle.reward!, mangaChapterId),
      )
      setClaimStatus(
        result.status === "duplicate"
          ? "Phần thưởng này đã được ghi nhận trước đó."
          : `Đã nhận ${battle.reward.tinhVi} Tinh Vị và lưu an toàn.`,
      )
      onProgress?.()
      onComplete?.()
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
      data-card-game={!!cards}
      data-boss-phase={battle.boss?.phase ?? undefined}
    >
      <header className="tactical-battle__header">
        <div className="tactical-battle__title">
          <span className="tactical-kicker">
            {battle.mode === "pvp" ? "PHÒNG THỬ NGHIỆM" : "GIAO ƯỚC LINH VỊ"}
          </span>
          <h1>Linh Chiến 4×2</h1>
          <p>
            {cards
              ? "Bộ bài 24 lá · rút bài · triệu hồi · Bí thuật & Bẫy Hương"
              : "Tổ đội năm Vị Linh · bẫy theo cột"}
          </p>
        </div>
        <div
          className="tactical-round-seal"
          aria-label={`Vòng ${battle.round}`}
        >
          <small>VÒNG</small>
          <strong>{battle.round}</strong>
          <span>{PHASE_LABELS[battle.phase]}</span>
        </div>
      </header>
      <div className="tactical-commanders">
        <CommanderPanel
          side="player"
          hp={battle.commanders.player.hp}
          maxHp={battle.commanders.player.maxHp}
        />
        <div className="tactical-versus" aria-hidden="true">
          <i />
          <span>VS</span>
          <i />
        </div>
        <CommanderPanel
          side="enemy"
          hp={battle.commanders.enemy.hp}
          maxHp={battle.commanders.enemy.maxHp}
        />
      </div>
      {cards && (
        <div className="tactical-card-resources">
          <div>
            <span aria-hidden="true">♨</span>
            <strong>
              {cards.mana}
              <small>/{cards.maxMana}</small>
            </strong>
            <span>LỬA BẾP</span>
            <i>
              {Array.from({ length: cards.maxMana }, (_, i) => (
                <b key={i} className={i < cards.mana ? "is-full" : ""} />
              ))}
            </i>
          </div>
          <span>
            {cards.deck.length} trong bộ · {cards.hand.length}/8 trên tay ·{" "}
            {cards.discard.length} ký ức
          </span>
          <span>
            Địch: {battle.cardGame!.sides.enemy.hand.length} lá ·{" "}
            {battle.cardGame!.sides.enemy.deck.length} trong bộ
          </span>
          <button onClick={() => setShowLog(true)}>Nhật ký</button>
        </div>
      )}
      {cards && synergies.length > 0 && (
        <div
          className="tactical-synergy-strip"
          aria-label="Cộng hưởng đội hình"
        >
          {synergies.map(([trait, count]) => (
            <span
              key={trait}
              className={count >= 2 ? "is-active" : ""}
              title={`${trait}: ${count} Vị Linh sống, mốc 2/4`}
            >
              <b>{trait}</b>
              {count}/2
            </span>
          ))}
          <span
            className={schoolCount >= 3 ? "is-active" : ""}
            title="Mâm Chung: từ 3 hệ khác nhau, +3 công toàn đội"
          >
            Mâm Chung {schoolCount}/3
          </span>
          {cards.recipeRound === battle.round && (
            <span className="is-active">Đồng Vị ✓</span>
          )}
        </div>
      )}
      {battle.boss && (
        <div className="tactical-boss-phase-track" role="status">
          <div>
            <small>THỦ LĨNH</small>
            <strong>{battle.boss.title}</strong>
          </div>
          <ol aria-label={`Boss đang ở pha ${battle.boss.phase}`}>
            {[1, 2, 3].map((phase) => (
              <li
                key={phase}
                className={battle.boss!.phase >= phase ? "is-reached" : ""}
                aria-current={battle.boss!.phase === phase ? "step" : undefined}
              >
                <span>{phase}</span>
                <small>Pha {phase}</small>
              </li>
            ))}
          </ol>
        </div>
      )}
      {showTutorial && (
        <aside className="tactical-tutorial" aria-label="Hướng dẫn trận đầu">
          <span className="tactical-tutorial__icon" aria-hidden="true">
            ✦
          </span>
          <div>
            <small>NGHI THỨC NHẬP MÔN</small>
            <strong>Trận đầu trong 30 giây</strong>
            <ol>
              <li>
                <b>1</b> Chọn bài trên tay
              </li>
              <li>
                <b>2</b> Chọn ô triệu hồi / dùng phép
              </li>
              <li>
                <b>3</b> Giao chiến
              </li>
              <li>
                <b>4</b> Dùng Tuyệt kỹ
              </li>
            </ol>
          </div>
          <button onClick={closeTutorial} aria-label="Đã hiểu hướng dẫn">
            Bắt đầu
          </button>
        </aside>
      )}
      <div className="tactical-trap-bar" aria-label="Bẫy phản ứng">
        <div className="tactical-trap-heading">
          <div>
            <small>PHẢN ỨNG CHIẾN THUẬT</small>
            <strong>Chọn cột và gài một bẫy</strong>
          </div>
          <span className={activeTrap ? "is-armed" : ""}>
            <i aria-hidden="true">◆</i>
            {activeTrap
              ? `${activeTrap.cardId ? TACTICAL_CARD_MAP[activeTrap.cardId].name : TRAPS.find((trap) => trap.id === activeTrap.trapId)?.name} · Cột ${activeTrap.column + 1}`
              : "Chưa gài bẫy"}
          </span>
        </div>
        <div className="tactical-trap-columns" aria-label="Cột đặt bẫy">
          <small>CỘT</small>
          {([0, 1, 2, 3] as const).map((column) => (
            <button
              key={column}
              className={trapColumn === column ? "is-active" : ""}
              onClick={() => setTrapColumn(column)}
              disabled={battle.phase !== "planning"}
              aria-label={`Chọn cột ${column + 1}`}
              aria-pressed={trapColumn === column}
            >
              {column + 1}
            </button>
          ))}
        </div>
        {!cards &&
          TRAPS.map((trap) => (
            <button
              key={trap.id}
              className={activeTrap?.trapId === trap.id ? "is-active" : ""}
              onClick={() => placeTrap(trap.id)}
              disabled={battle.phase !== "planning"}
              aria-pressed={activeTrap?.trapId === trap.id}
            >
              <span aria-hidden="true">{trap.glyph}</span>
              <span>
                <strong>{trap.name}</strong>
                <small>{trap.detail}</small>
              </span>
              <i aria-hidden="true">
                {activeTrap?.trapId === trap.id ? "✓" : "+"}
              </i>
            </button>
          ))}
        {cards && (
          <p className="tactical-trap-card-hint">
            Bẫy phải được rút từ bộ bài. Chọn cột, chọn lá Bẫy Hương trên tay
            rồi nhấn Dùng thẻ. Mỗi bên gài một bẫy.
          </p>
        )}
      </div>
      {battle.lastReaction && battle.phase !== "planning" && (
        <p className="tactical-reaction-banner" role="status">
          <span aria-hidden="true">⚡</span>
          <strong>PHẢN ỨNG</strong>
          {battle.lastReaction}
        </p>
      )}
      <div className="tactical-arena">
        {(["enemy", "player"] as const).map((side) => (
          <section
            className={`tactical-side tactical-side--${side}`}
            key={side}
          >
            <header>
              <div>
                <span aria-hidden="true">{side === "enemy" ? "☽" : "☀"}</span>
                <strong>
                  {side === "enemy" ? "ĐỘI HÌNH ĐỊCH" : "ĐỘI HÌNH GIAO ƯỚC"}
                </strong>
              </div>
              <small>
                {living(side).length} Vị Linh ·{" "}
                {side === "enemy" ? "đối diện" : "chọn để bố trí"}
              </small>
            </header>
            <div className={`tactical-board tactical-board--${side}`}>
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
                    ),
                    role = unit ? ROLE_LABELS[unit.role] : null,
                    canArrange =
                      side === "player" && battle.phase === "planning"
                  return (
                    <div
                      key={`${row}-${column}`}
                      className={`tactical-cell ${
                        unit ? "is-occupied" : "is-empty"
                      } ${selected === unit?.instanceId ? "is-selected" : ""}`}
                      data-row={row === 0 ? "front" : "back"}
                      data-change={
                        unit ? visualHits[unit.instanceId] : undefined
                      }
                    >
                      <button
                        className="tactical-cell__select"
                        onClick={() => {
                          if (chosenCard && battle.phase === "planning") {
                            playSelected({ row, column }, unit?.instanceId)
                            return
                          }
                          if (side === "player" && unit) {
                            setSelected(unit.instanceId)
                            return
                          }
                          if (!canArrange) return
                          if (unit) setSelected(unit.instanceId)
                          else move(row, column)
                        }}
                        aria-disabled={side === "enemy" && !chosenCard}
                        aria-pressed={selected === unit?.instanceId}
                        aria-label={
                          unit
                            ? `${unit.name}, ${role?.name}, ${unit.hp}/${unit.maxHp} sinh lực`
                            : `Ô ${
                                row === 0 ? "hàng trước" : "hàng sau"
                              }, cột ${column + 1}`
                        }
                      >
                        {unit ? (
                          <article
                            className={`tactical-unit tactical-unit--${unit.role}`}
                            data-low-hp={
                              unit.hp / unit.maxHp <= 0.33 || undefined
                            }
                          >
                            <span className="tactical-unit__art">
                              <img src={unit.art} alt="" draggable={false} />
                              <i aria-hidden="true" />
                            </span>
                            <span className="tactical-role-chip">
                              <i aria-hidden="true">{role?.glyph}</i>
                              {role?.name}
                            </span>
                            {battle.boss?.unitId === unit.instanceId && (
                              <b className="tactical-boss-badge">
                                ♛ {battle.boss.title} · Pha {battle.boss.phase}
                              </b>
                            )}
                            <span className="tactical-unit__content">
                              <strong>
                                {unit.name} <i>{"★".repeat(unit.star)}</i>
                              </strong>
                              <span className="tactical-unit__traits">
                                {unit.traits.slice(0, 2).map((trait) => (
                                  <small key={trait}>{trait}</small>
                                ))}
                              </span>
                              <span className="tactical-stat-line">
                                <small>
                                  HP {unit.hp}/{unit.maxHp}
                                </small>
                                {unit.shield > 0 && <b>◇ {unit.shield}</b>}
                              </span>
                              <span
                                className="tactical-meter tactical-meter--hp"
                                role="progressbar"
                                aria-label={`Sinh lực ${unit.name}`}
                                aria-valuemin={0}
                                aria-valuemax={unit.maxHp}
                                aria-valuenow={unit.hp}
                              >
                                <i
                                  style={{
                                    width: `${percent(unit.hp, unit.maxHp)}%`,
                                  }}
                                />
                              </span>
                              <span
                                className="tactical-meter tactical-meter--energy"
                                role="progressbar"
                                aria-label={`Năng lượng ${unit.name}`}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={unit.energy}
                              >
                                <i style={{ width: `${unit.energy}%` }} />
                              </span>
                            </span>
                          </article>
                        ) : (
                          <span className="tactical-empty-cell">
                            <b>{canArrange ? "+" : "·"}</b>
                            <small>
                              {row === 0 ? "TIỀN TUYẾN" : "HẬU TUYẾN"} · C
                              {column + 1}
                            </small>
                          </span>
                        )}
                      </button>
                      {trap && row === 0 && (
                        <span
                          className="tactical-trap-marker"
                          aria-label="Bẫy đã đặt"
                        >
                          <i aria-hidden="true">◆</i>
                          <small>BẪY</small>
                        </span>
                      )}
                      {side === "player" &&
                        unit &&
                        unit.energy >= 100 &&
                        ["reaction", "ultimate"].includes(battle.phase) && (
                          <button
                            className="tactical-ultimate"
                            onClick={() =>
                              updateBattle((current) =>
                                reduceTacticalBattle(current, {
                                  id: `ult:${current.round}:${unit.instanceId}`,
                                  type: "ultimate",
                                  unitId: unit.instanceId,
                                }),
                              )
                            }
                          >
                            <span aria-hidden="true">✦</span>
                            Tuyệt kỹ
                          </button>
                        )}
                    </div>
                  )
                }),
              )}
            </div>
          </section>
        ))}
      </div>
      {cards && battle.phase !== "result" && (
        <section className="tactical-hand-area" aria-label="Tay bài của bạn">
          <header>
            <strong>{chosenCard ? chosenCard.name : "TAY BÀI CỦA BẠN"}</strong>
            <span>
              {chosenCard
                ? `${chosenCard.cost} Lửa Bếp · ${chosenCard.kind === "unit" ? "chọn ô bên bạn để triệu hồi" : chosenCard.kind === "spell" ? "chọn mục tiêu hoặc dùng tự động" : `gài ở cột ${trapColumn + 1}`}`
                : "Chọn một lá để xem kỹ năng và chơi"}
            </span>
            {battle.round === 1 &&
              !cards.mulliganUsed &&
              !battle.units.some((u) => u.side === "player") && (
                <button
                  disabled={battle.phase !== "planning"}
                  onClick={async () => {
                    if (
                      await updateBattle((c) =>
                        reduceTacticalBattle(c, {
                          id: "mulligan",
                          type: "mulligan",
                        }),
                      )
                    )
                      setSelectedCard(null)
                  }}
                >
                  Đổi tay đầu
                </button>
              )}
          </header>
          <div className="tactical-hand">
            {cards.hand.map((id, index) => (
              <GameCardView
                key={`${index}:${id}`}
                card={TACTICAL_CARD_MAP[id]}
                compact
                selected={selectedCard === index}
                playable={
                  battle.phase === "planning" &&
                  TACTICAL_CARD_MAP[id].cost <= cards.mana
                }
                onClick={() =>
                  setSelectedCard(selectedCard === index ? null : index)
                }
              />
            ))}
            {!cards.hand.length && (
              <p>Hết bài trên tay. Kết thúc vòng để rút lá tiếp theo.</p>
            )}
          </div>
          {chosenCard && (
            <div className="tactical-hand-selection">
              <p>{chosenCard.text}</p>
              <button
                className="tcg-button primary"
                disabled={
                  battle.phase !== "planning" || chosenCard.cost > cards.mana
                }
                onClick={() => playSelected()}
              >
                {chosenCard.kind === "unit"
                  ? "Triệu hồi vào ô trống"
                  : "Dùng thẻ"}{" "}
                · {chosenCard.cost} ♨
              </button>
              <button
                aria-label="Hủy chọn thẻ"
                onClick={() => setSelectedCard(null)}
              >
                ×
              </button>
            </div>
          )}
        </section>
      )}
      <aside className="tactical-unit-inspector" aria-live="polite">
        {selectedUnit ? (
          <>
            <span className="tactical-unit-inspector__portrait">
              <img src={selectedUnit.art} alt="" />
            </span>
            <div>
              <small>VỊ LINH ĐANG CHỌN</small>
              <strong>{selectedUnit.name}</strong>
              <p>
                {ROLE_LABELS[selectedUnit.role].name} ·{" "}
                {selectedUnit.traits.join(" · ")}
              </p>
            </div>
            <dl>
              <div>
                <dt>Công</dt>
                <dd>{selectedUnit.attack}</dd>
              </div>
              <div>
                <dt>Sinh lực</dt>
                <dd>{selectedUnit.hp}</dd>
              </div>
              <div>
                <dt>Năng lượng</dt>
                <dd>{selectedUnit.energy}</dd>
              </div>
              <div>
                <dt>Cột</dt>
                <dd>{selectedUnit.cell.column + 1}</dd>
              </div>
            </dl>
            <span className="tactical-unit-inspector__hint">
              Chọn ô trống bên bạn để đổi vị trí
            </span>
          </>
        ) : (
          <>
            <span className="tactical-unit-inspector__empty" aria-hidden="true">
              ◎
            </span>
            <div>
              <small>DÀN TRẬN</small>
              <strong>Chọn một Vị Linh của bạn</strong>
              <p>Xem chỉ số, sau đó chọn ô trống để thay đổi vị trí.</p>
            </div>
          </>
        )}
      </aside>
      <footer className="tactical-controls">
        {battle.phase !== "result" ? (
          <>
            <div className="tactical-action-copy">
              <span>{PHASE_LABELS[battle.phase]}</span>
              <div>
                <strong>
                  {battle.phase === "planning"
                    ? "Đội hình đã sẵn sàng?"
                    : "Cửa sổ phản ứng đang mở"}
                </strong>
                <p>
                  {battle.phase === "planning"
                    ? "Chọn Vị Linh, bố trí ô trống và gài một bẫy trước khi giao chiến."
                    : "Tung Tuyệt kỹ đã đầy hoặc kết thúc vòng để hồi năng lượng."}
                </p>
              </div>
            </div>
            <button
              className="tcg-button primary tactical-main-action"
              onClick={() => {
                setSelectedCard(null)
                updateBattle((current) => playAutomaticRound(current))
              }}
            >
              <span aria-hidden="true">
                {battle.phase === "planning" ? "⚔" : "↻"}
              </span>
              <span>
                <small>
                  {battle.phase === "planning" ? "BẮT ĐẦU" : "TIẾP TỤC"}
                </small>
                {battle.phase === "planning"
                  ? `Giao chiến vòng ${battle.round}`
                  : `Kết thúc vòng ${battle.round}`}
              </span>
              <i aria-hidden="true">›</i>
            </button>
          </>
        ) : (
          <div className="tactical-result" role="status">
            <span className="tactical-result__sigil" aria-hidden="true">
              {battle.winner === "player" ? "冠" : "断"}
            </span>
            <small>
              {battle.winner === "player"
                ? "GIAO ƯỚC HOÀN THÀNH"
                : "GIAO ƯỚC ĐỨT ĐOẠN"}
            </small>
            <h2>
              {battle.winner === "player"
                ? "Chiến thắng — Giao ước được giữ"
                : "Đội hình tan vỡ"}
            </h2>
            <p>
              {battle.winner === "player"
                ? `Hoàn thành sau ${battle.round} vòng chiến.`
                : "Thay đổi đội hình và bẫy trước khi thử lại."}
            </p>
            {battle.reward && battle.reward.tinhVi > 0 ? (
              <div className="tactical-result__reward">
                <span aria-hidden="true">✧</span>
                <div>
                  <small>PHẦN THƯỞNG</small>
                  <strong>+{battle.reward.tinhVi} Tinh Vị</strong>
                </div>
              </div>
            ) : battle.mode === "pvp" ? (
              <p className="tactical-result__pvp">
                PvP thử nghiệm không cấp thưởng PvE.
              </p>
            ) : null}
            <div className="tactical-result__actions">
              {battle.reward && battle.reward.tinhVi > 0 && (
                <button className="tcg-button primary" onClick={claim}>
                  Nhận phần thưởng
                </button>
              )}
              <button
                className="tcg-button ghost"
                onClick={() => {
                  updateBattle(() => initial)
                  setSelected(null)
                  setClaimStatus("")
                }}
              >
                Đấu lại
              </button>
            </div>
            {claimStatus && <p>{claimStatus}</p>}
          </div>
        )}
      </footer>
      {claimStatus && battle.phase !== "result" && (
        <p role="status" className="tactical-battle-notice">
          {claimStatus}
        </p>
      )}
      {cards && battle.phase !== "result" && (
        <button
          className="tactical-forfeit"
          onClick={() =>
            updateBattle((c) =>
              reduceTacticalBattle(c, {
                id: `forfeit:${c.round}`,
                type: "forfeit",
              }),
            )
          }
        >
          Đầu hàng trận này
        </button>
      )}
      <details className="tactical-log">
        <summary>
          <span aria-hidden="true">☷</span>Nhật ký giao chiến
          <small>{battle.log.length} sự kiện</small>
        </summary>
        <ol>
          {battle.log.slice(-8).map((entry, index) => (
            <li key={entry.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{entry.text}</p>
            </li>
          ))}
        </ol>
      </details>
      {showLog && (
        <Dialog
          title={`Nhật ký trận · Vòng ${battle.round}`}
          onClose={() => setShowLog(false)}
        >
          <ol className="tactical-battle-dialog-log">
            {battle.log.map((entry) => (
              <li key={entry.id}>{entry.text}</li>
            ))}
          </ol>
          <p>
            Trong bộ: {cards?.deck.length} · Ký ức:{" "}
            {cards?.discard
              .map((id) => TACTICAL_CARD_MAP[id].name)
              .join(", ") || "chưa có"}
          </p>
        </Dialog>
      )}
    </section>
  )
}
