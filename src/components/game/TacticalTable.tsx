import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import { SCHOOLS, RARITIES } from "../../game/catalog"
import {
  TACTICAL_CARD_MAP,
  type TacticalCard,
} from "../../game/tacticalTcg/cards"
import type {
  BattleUnit,
  BoardCell,
  BattleSide,
  TacticalBattleState,
} from "../../game/tacticalTcg/engine"
import { Dialog } from "./Dialog"
import { useAppStore } from "../../store/useAppStore"
import {
  tacticalTransition,
  type TacticalTransition,
} from "../../game/tacticalTcg/presentation/transitions"
import { TacticalSpiritActor, TacticalSpiritArt } from "./TacticalSpirit"
import { TacticalCombatEffects } from "./TacticalCombatEffects"
import {
  directedCardText,
  directedReadiness,
  directedTargets,
} from "../../game/tacticalTcg/engine/directedRules"
import "../../game/directedTable.css"
import "../../game/tacticalTable.css"

const roles = {
  guardian: "Hộ vệ",
  striker: "Đấu sĩ",
  mage: "Pháp sư",
  support: "Hỗ trợ",
}
const kind = (card: TacticalCard) =>
  card.kind === "unit"
    ? "Vị Linh"
    : card.kind === "trap"
      ? "Bẫy Hương"
      : "Bí thuật"
export function TacticalCardFace({
  card,
  mini = false,
}: {
  card: TacticalCard
  mini?: boolean
}) {
  return (
    <div
      className={`table-card-face ${mini ? "is-mini" : ""}`}
      style={{ "--card-color": SCHOOLS[card.school].color } as CSSProperties}
    >
      {card.kind === "unit" ? (
        <TacticalSpiritArt id={card.id} />
      ) : (
        <img src={card.art} alt="" />
      )}
      <b className="table-card-cost" aria-label={`${card.cost} Lửa Bếp`}>
        {card.cost}
      </b>
      <div>
        <small>
          {kind(card)} · {SCHOOLS[card.school].name}
        </small>
        <strong>{card.name}</strong>
        {!mini && <p>{directedCardText(card)}</p>}
        <footer>
          {card.kind === "unit" ? (
            <>
              <b>⚔ {card.attack}</b>
              <b>♥ {card.health}</b>
            </>
          ) : (
            <b>
              {card.kind === "trap"
                ? "◇ Bẫy"
                : mini
                  ? "✧ Phép"
                  : "✧ Dùng trong dàn trận"}
            </b>
          )}
          <span>{RARITIES[card.rarity].name}</span>
        </footer>
      </div>
    </div>
  )
}
interface Props {
  attackMode?: "basic" | "ultimate"
  onAttackMode?: (mode: "basic" | "ultimate") => void
  onCommander?: () => void
  onReact?: (id: string, activate: boolean) => void
  battle: TacticalBattleState
  selectedCard: number | null
  selectedUnit: string | null
  busy: boolean
  notice: string
  claimed: boolean
  trapColumn: number
  overlay?: ReactNode
  onSelectCard: (index: number | null) => void
  onSelectUnit: (id: string | null) => void
  onCell: (side: BattleSide, cell: BoardCell, unit?: BattleUnit) => void
  onPlay: () => void
  onAdvance: () => void
  onUltimate: (id: string) => void
  onMulligan: () => void
  onColumn: (column: 0 | 1 | 2 | 3) => void
  onClaim: () => void
  onRestart: () => void
  onForfeit: () => void
  onExit?: () => void
}
export function TacticalTable(p: Props) {
  const { battle: b } = p
  const owner = b.cardGame!.sides.player,
    enemy = b.cardGame!.sides.enemy
  const card =
    p.selectedCard === null
      ? null
      : TACTICAL_CARD_MAP[owner.hand[p.selectedCard]]
  const unit = b.units.find(
    (u) => u.instanceId === p.selectedUnit && !u.defeated,
  )
  const inspectCard =
    card ?? (unit?.cardId ? TACTICAL_CARD_MAP[unit.cardId] : null)
  const [dialog, setDialog] =
    useState<"guide" | "card" | "log" | "forfeit" | "ultimate" | "traps" | null>(
      null,
    )
  const [compact, setCompact] = useState(false),
    [page, setPage] = useState(0)
  const [effects, setEffects] = useState<Record<string, string>>({})
  const [transition, setTransition] = useState<TacticalTransition | null>(null)
  const [contacted, setContacted] = useState(true)
  const arena = useRef<HTMLDivElement>(null)
  const preferenceQuiet = useAppStore(
    (s) =>
      s.user.preferences.reducedMotion ||
      s.user.preferences.graphicsQuality === "low",
  )
  const [systemQuiet, setSystemQuiet] = useState(false)
  const quiet = preferenceQuiet || systemQuiet
  const [reveal, setReveal] = useState<TacticalCard | null>(null)
  const previous = useRef(b),
    revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const query = window.matchMedia("(max-width: 780px), (max-height: 540px)")
    const sync = () => setCompact(query.matches)
    sync()
    query.addEventListener("change", sync)
    return () => query.removeEventListener("change", sync)
  }, [])
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setSystemQuiet(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])
  useLayoutEffect(() => {
    const old = previous.current,
      next: Record<string, string> = {}
    const cue = tacticalTransition(old, b)
    setTransition(cue)
    setContacted(quiet || !cue?.contact)
    for (const u of b.units) {
      const prior = old.units.find((v) => v.instanceId === u.instanceId)
      if (!prior || (prior.defeated && !u.defeated))
        next[u.instanceId] = "summon"
      else if (u.star > prior.star) next[u.instanceId] = "upgrade"
      else if (u.hp < prior.hp || u.shield < prior.shield)
        next[u.instanceId] = "hit"
      else if (u.hp > prior.hp) next[u.instanceId] = "heal"
      else if (u.shield > prior.shield) next[u.instanceId] = "ward"
    }
    const trap = old.traps.find(
      (t) =>
        t.armed &&
        b.traps.some(
          (v) =>
            v.instanceId === t.instanceId &&
            !v.armed &&
            v.triggeredRound === b.round,
        ),
    )
    if (trap?.cardId) {
      setReveal(TACTICAL_CARD_MAP[trap.cardId])
      if (revealTimer.current) clearTimeout(revealTimer.current)
      revealTimer.current = setTimeout(() => setReveal(null), 1200)
    }
    setEffects(next)
    previous.current = b
    const impact = setTimeout(
      () => setContacted(true),
      quiet ? 0 : (cue?.contact ?? 0),
    )
    const timer = setTimeout(
      () => {
        setEffects({})
        setTransition(null)
      },
      quiet ? 350 : (cue?.duration ?? 650),
    )
    return () => {
      clearTimeout(timer)
      clearTimeout(impact)
    }
  }, [b, quiet])
  useEffect(
    () => () => {
      if (revealTimer.current) clearTimeout(revealTimer.current)
    },
    [],
  )
  const perPage = compact ? 4 : 8,
    pages = Math.max(1, Math.ceil(owner.hand.length / perPage)),
    currentPage = Math.min(page, pages - 1)
  const directed = b.cardGame!.directed,
    pending = directed?.pending,
    ownTurn = !directed || directed.turn === "player"
  const planning = b.phase === "planning" && ownTurn,
    result = b.phase === "result"
  const alive = (side: BattleSide) =>
    b.units.filter((u) => u.side === side && !u.defeated)
  const ready = alive("player").filter(
    (u) =>
      u.energy >= 100 &&
      (!directed ||
        !["stunned", "summoning"].includes(directedReadiness(b, u))),
  )
  const attackReady =
    !!directed &&
    planning &&
    !p.busy &&
    !card &&
    unit?.side === "player" &&
    (p.attackMode === "ultimate"
      ? unit.energy >= 100 &&
        !["stunned", "summoning"].includes(directedReadiness(b, unit))
      : directedReadiness(b, unit) === "ready")
  const attackTargets = attackReady ? directedTargets(b, unit!) : []
  const actionLabel =
    transition?.kind === "summon"
      ? "Triệu hồi"
      : transition?.kind === "upgrade"
        ? "Nâng sao"
        : transition?.kind === "ultimate"
          ? "Tuyệt kỹ"
          : transition?.kind === "spell"
            ? "Thi triển"
            : transition?.kind === "trap"
              ? "Gài bẫy"
              : transition?.kind === "negate"
                ? "Phản chế"
                : transition?.kind === "reaction"
                  ? "Phản ứng bẫy"
                  : transition?.kind === "turn"
                    ? "Chuyển lượt"
                    : "Tấn công"
  const commanderHp = (side: BattleSide) =>
    !contacted && transition
      ? transition.before.commanders[side].hp
      : b.commanders[side].hp
  const hint = p.busy
    ? `${actionLabel}: chờ hiệu ứng hoàn tất. Đòn đánh và sát thương được giải quyết từng bước.`
    : pending
      ? "Chọn lật bẫy hoặc giữ cho hành động sau. Không có đếm ngược."
      : directed && !ownTurn
        ? "Đối thủ đang hành động; bẫy hợp lệ sẽ mở cửa sổ phản ứng."
        : directed && !card && unit?.side === "player"
          ? attackReady
            ? `Chọn mục tiêu sáng để ${
                p.attackMode === "ultimate" ? "tung Tuyệt kỹ" : "tấn công"
              }.`
            : directedReadiness(b, unit) === "stunned"
              ? "Quân đang đóng băng, chưa thể đánh hoặc dùng Tuyệt kỹ."
              : directedReadiness(b, unit) === "summoning"
                ? "Quân vừa vào sân: chờ lượt sau, trừ Xung kích."
                : "Quân đã đánh. Chọn quân khác hoặc dùng Tuyệt kỹ nếu đủ Hương lực."
          : result
            ? "Nhận thưởng lần đầu hoặc chỉnh bộ bài rồi thử lại."
            : planning
              ? card
                ? card.kind === "unit"
                  ? "Chọn ô sáng bên bạn. Chồng đúng quân trùng lá để lên 2 sao."
                  : card.kind === "trap"
                    ? directed
                      ? "Úp vào ô bẫy riêng. Khi đủ điều kiện, bạn chọn Lật hoặc Giữ; gài mới thay bẫy cũ."
                      : "Chọn cột, sau đó Gài bẫy."
                    : card.tacticalEffect === "damage"
                      ? "Chọn quân địch sáng viền, hoặc dùng tự chọn mục tiêu."
                      : card.tacticalEffect === "buff"
                        ? "Chọn đồng minh sáng viền để tăng chỉ số."
                        : "Hiệu ứng diện rộng: nhấn Dùng thẻ để xác nhận."
                : directed
                  ? "Chơi bài → chọn quân → chọn mục tiêu. Kết lượt khi đã sẵn sàng."
                  : "Chọn lá → chọn ô/mục tiêu → Giao chiến."
              : "Đủ 100 Hương lực: dùng Tuyệt kỹ, rồi Kết vòng để rút bài và hồi Lửa."
  const canPlay =
    !!card &&
    planning &&
    !p.busy &&
    card.cost <= owner.mana &&
    (card.kind !== "unit" ||
      alive("player").length < 5 ||
      alive("player").some((u) => u.cardId === card.id && u.star === 1)) &&
    (card.tacticalEffect !== "buff" ||
      card.kind === "unit" ||
      alive("player").length > 0)
  const stage = p.busy
    ? actionLabel
    : directed
      ? result
        ? "Kết quả"
        : pending
          ? "Phản ứng bẫy"
          : ownTurn
            ? "Lượt của bạn"
            : "Lượt đối thủ"
      : planning
        ? "1 · Dàn trận"
        : result
          ? "Kết quả"
          : "3 · Tuyệt kỹ / Kết vòng"
  return (
    <section
      className="tcg-table"
      aria-label="Bàn Linh Chiến 4 x 2"
      data-phase={b.phase}
      data-turn={directed?.turn}
      data-action-id={directed?.event?.id}
      data-transition-id={transition?.id}
      aria-busy={p.busy}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          p.onSelectCard(null)
          p.onSelectUnit(null)
        }
      }}
    >
      <header className="table-topbar">
        <button onClick={p.onExit} aria-label="Rời bàn chơi">
          ← <span>Rời bàn</span>
        </button>
        <div>
          <small>SOUL OF MEAL · LINH CHIẾN</small>
          <strong>
            Vòng {b.round} <i> / </i> {stage}
          </strong>
        </div>
        <nav>
          <button onClick={() => setDialog("guide")}>
            ? <span>Luật chơi</span>
          </button>
          <button onClick={() => setDialog("log")}>
            ☷ <span>Nhật ký</span>
          </button>
        </nav>
      </header>
      <div
        ref={arena}
        className="table-arena"
        role="region"
        aria-label="Hai sân đấu"
      >
        <div className="table-commander is-enemy" data-hero="enemy">
          <div>
            <b>☽ ĐỐI THỦ</b>
            <small>
              {enemy.hand.length} lá tay · {enemy.deck.length} trong bộ{" "}
              {b.boss ? `· ${b.boss.title} · Pha ${b.boss.phase}` : ""}
            </small>
          </div>
          <strong
            aria-label={`Ý chí địch ${b.commanders.enemy.hp} trên ${b.commanders.enemy.maxHp}`}
          >
            ♥ {commanderHp("enemy")}
            <small>/{b.commanders.enemy.maxHp}</small>
          </strong>
          {directed && (
            <button
              className={`table-commander-target ${
                attackTargets.includes("hero:enemy") ? "is-target" : ""
              }`}
              disabled={!attackTargets.includes("hero:enemy")}
              onClick={p.onCommander}
              aria-label="Tấn công Chỉ huy địch"
            >
              ⚔ Chỉ huy
            </button>
          )}
          <meter
            min={0}
            max={b.commanders.enemy.maxHp}
            value={commanderHp("enemy")}
            aria-label="Ý chí địch"
          />
        </div>
        {(["enemy", "player"] as const).map((side) => (
          <div
            key={side}
            className={`table-field table-field--${side}`}
            aria-label={side === "player" ? "Sân của bạn" : "Sân địch"}
          >
            {([0, 1] as const).flatMap((visualRow) =>
              ([0, 1, 2, 3] as const).map((column) => {
                const row =
                  side === "enemy" ? (1 - visualRow) as 0 | 1 : visualRow
                const u = b.units
                  .filter(
                    (u) =>
                      u.side === side &&
                      (!u.defeated ||
                        transition?.deltas.some(
                          (d) => d.id === u.instanceId && d.fallen,
                        )),
                  )
                  .find((v) => v.cell.row === row && v.cell.column === column)
                const displayed =
                  !contacted &&
                  transition?.before.units.find(
                    (v) => v.instanceId === u?.instanceId,
                  )
                const shownHp = displayed ? displayed.hp : u?.hp
                const shownShield = displayed ? displayed.shield : u?.shield
                const cardTarget =
                  !!card &&
                  planning &&
                  !p.busy &&
                  owner.mana >= card.cost &&
                  (card.kind === "unit"
                    ? side === "player" &&
                      (u && !u.defeated
                        ? u.cardId === card.id && u.star === 1
                        : alive("player").length < 5)
                    : card.kind === "spell" &&
                      !!u &&
                      !u.defeated &&
                      (card.tacticalEffect === "damage"
                        ? side === "enemy"
                        : card.tacticalEffect === "buff" && side === "player"))
                const target =
                  cardTarget || (!!u && attackTargets.includes(u.instanceId))
                const readiness = u && directed ? directedReadiness(b, u) : null
                const trapped = b.traps.find(
                  (t) =>
                    !directed &&
                    t.armed &&
                    t.side === side &&
                    t.column === column,
                )
                return (
                  <button
                    key={`${row}:${column}`}
                    className={`table-slot ${target ? "is-target" : ""} ${
                      p.selectedUnit === u?.instanceId ? "is-selected" : ""
                    } ${u ? "is-occupied" : "is-empty"} ${
                      readiness ? `is-${readiness}` : ""
                    } ${u?.defeated ? "is-fallen" : ""} ${
                      u &&
                      ["summon", "upgrade", "heal", "ward"].includes(
                        effects[u.instanceId],
                      )
                        ? `fx-${effects[u.instanceId]}`
                        : ""
                    }`}
                    data-side={side}
                    data-unit={u?.instanceId}
                    data-cell={`${row}:${column}`}
                    disabled={
                      p.busy ||
                      !!u?.defeated ||
                      (!!card && !target) ||
                      (!u && side === "enemy")
                    }
                    onClick={() => p.onCell(side, { row, column }, u)}
                    aria-label={
                      u
                        ? `${
                            side === "enemy" ? "Địch" : "Bạn"
                          }: ${u.name}, công ${u.attack}, máu ${u.hp}/${u.maxHp}, ${u.star} sao${
                            target ? ", mục tiêu hợp lệ" : ""
                          }`
                        : `${side === "player" ? "Bạn" : "Địch"}: ${
                            row === 0 ? "Tiền tuyến" : "Hậu tuyến"
                          }, cột ${column + 1}${
                            target ? ", triệu hồi được" : ""
                          }`
                    }
                  >
                    {u ? (
                      <>
                        <TacticalSpiritActor
                          unit={u}
                          transition={transition}
                          quiet={quiet}
                          winner={b.winner}
                        />
                        <span className="table-unit-title">
                          <b>{u.name}</b>
                          <small>
                            {"★".repeat(u.star)} · {roles[u.role]}
                          </small>
                        </span>
                        {directed && (
                          <span className="table-readiness">
                            {readiness === "ready"
                              ? "✦ Sẵn sàng"
                              : readiness === "stunned"
                                ? "❄ Đóng băng"
                                : readiness === "summoning"
                                  ? "◷ Vừa gọi"
                                  : "✓ Đã đánh"}
                          </span>
                        )}
                        <span className="table-unit-stats">
                          <b>⚔ {u.attack}</b>
                          <b>♥ {shownHp}</b>
                          {!!shownShield && <b>◇ {shownShield}</b>}
                        </span>
                        <span className="table-unit-energy">
                          <i style={{ width: `${u.energy}%` }} />
                          {u.energy >= 100 && <b>✦ SẴN SÀNG</b>}
                        </span>
                        {effects[u.instanceId] === "upgrade" && (
                          <em className="table-star-burst">★★ NÂNG SAO</em>
                        )}
                      </>
                    ) : (
                      <span className="table-empty-label">
                        <b>{target ? "+" : "◇"}</b>
                        {row === 0 ? "Tiền tuyến" : "Hậu tuyến"}
                        <small>Cột {column + 1}</small>
                      </span>
                    )}
                    {trapped && row === 0 && (
                      <span
                        className="table-trap-seal"
                        title={
                          side === "player"
                            ? (TACTICAL_CARD_MAP[trapped.cardId ?? ""]?.name ??
                              "Bẫy đang gài")
                            : "Bẫy úp của địch"
                        }
                      >
                        ◇ {side === "player" ? "Đã gài" : "Bẫy úp"}
                      </span>
                    )}
                  </button>
                )
              }),
            )}
          </div>
        ))}
        <div className="table-divider">
          <span>
            {directed
              ? "HỘ VỆ CHẮN ĐÒN · PHÁP SƯ NHẮM HẬU TUYẾN KHI HẾT HỘ VỆ"
              : "TIỀN TUYẾN ĐỐI MẶT · ƯU TIÊN ĐÁNH CÙNG CỘT"}
          </span>
          <b>✦</b>
        </div>
        <div className="table-commander is-player" data-hero="player">
          <div>
            <b>☀ GIAO ƯỚC CỦA BẠN</b>
            <small>
              {alive("player").length}/5 quân ·{" "}
              {
                new Set(
                  alive("player")
                    .filter((u) => u.cardId)
                    .map((u) => TACTICAL_CARD_MAP[u.cardId!].school),
                ).size
              }
              /3 hệ Mâm Chung
            </small>
          </div>
          <strong>
            ♥ {commanderHp("player")}
            <small>/{b.commanders.player.maxHp}</small>
          </strong>
          <meter
            min={0}
            max={b.commanders.player.maxHp}
            value={commanderHp("player")}
            aria-label="Ý chí của bạn"
          />
        </div>
        <TacticalCombatEffects
          transition={transition}
          arena={arena}
          quiet={quiet}
        />
        {reveal && (
          <div className="table-trap-reveal" role="status">
            <span>BẪY HƯƠNG KÍCH HOẠT</span>
            <TacticalCardFace card={reveal} mini />
          </div>
        )}
      </div>
      <aside className="table-inspector" aria-label="Thông tin lá đang chọn">
        {inspectCard ? (
          <>
            <TacticalCardFace card={inspectCard} />
            <p className="table-card-lore">“{inspectCard.lore}”</p>
            {unit && !card && (
              <p>
                <b>Trên sân:</b> {unit.attack} công · {unit.hp}/{unit.maxHp} HP
                · {unit.shield} khiên · {unit.energy}/100 Hương lực.{" "}
                {unit.side === "player"
                  ? "Chọn ô trống để đổi vị trí (1 lần/vòng)."
                  : "Quân địch: chạm để xem, không điều khiển."}
              </p>
            )}
            <button onClick={() => setDialog("card")}>Phóng to lá bài ↗</button>
          </>
        ) : (
          <div className="table-coach">
            <span>契</span>
            <h2>{planning ? "Bàn ăn chờ bạn" : "Giữ nhịp Tuyệt kỹ"}</h2>
            <p>{hint}</p>
            <ol>
              <li>Dùng Lửa để triệu hồi / chơi phép.</li>
              <li>
                {directed
                  ? "Chọn quân → chọn mục tiêu sáng để đánh."
                  : "Giao chiến: quân tự đánh, công cao đi trước."}
              </li>
              <li>100 Hương lực → Tuyệt kỹ; kết lượt để nhường đối thủ.</li>
            </ol>
            <p>Thắng khi Ý chí địch về 0. Sân trống chưa thua.</p>
          </div>
        )}
        <div className="table-inspector-action">
          {card ? (
            <>
              <p>{hint}</p>
              {card.kind === "trap" && !directed && (
                <div className="table-trap-columns" aria-label="Cột đặt bẫy">
                  {([0, 1, 2, 3] as const).map((c) => (
                    <button
                      key={c}
                      aria-pressed={p.trapColumn === c}
                      onClick={() => p.onColumn(c)}
                    >
                      C{c + 1}
                    </button>
                  ))}
                </div>
              )}
              <button
                className="table-primary"
                disabled={!canPlay}
                onClick={p.onPlay}
              >
                {card.cost > owner.mana
                  ? `Cần ${card.cost} Lửa · đang có ${owner.mana}`
                  : card.kind === "unit"
                    ? "Triệu hồi ô trống"
                    : card.kind === "trap"
                      ? "Gài bẫy"
                      : "Dùng thẻ"}{" "}
                · {card.cost} ♨
              </button>
              <button onClick={() => p.onSelectCard(null)}>Bỏ chọn</button>
            </>
          ) : unit && unit.side === "player" ? (
            <>
              {directed && (
                <button
                  aria-pressed={p.attackMode !== "ultimate"}
                  disabled={!planning || p.busy}
                  onClick={() => p.onAttackMode?.("basic")}
                >
                  ⚔ Chọn đòn đánh · {unit.attack} công
                </button>
              )}
              <button
                className="table-primary"
                aria-pressed={p.attackMode === "ultimate"}
                disabled={
                  p.busy ||
                  unit.energy < 100 ||
                  (directed
                    ? !planning ||
                      ["stunned", "summoning"].includes(
                        directedReadiness(b, unit),
                      )
                    : planning) ||
                  result
                }
                onClick={() => p.onUltimate(unit.instanceId)}
              >
                ✦ Tuyệt kỹ · {unit.energy}/100
              </button>
            </>
          ) : (
            <button onClick={() => setDialog("guide")}>
              Xem luật và cách chọn mục tiêu
            </button>
          )}
        </div>
      </aside>
      <div className="table-mobile-selection">
        <p>
          <b>{card?.name ?? unit?.name ?? stage}</b>
          <span>{hint}</span>
        </p>
        {inspectCard && (
          <button onClick={() => setDialog("card")}>Đọc thẻ</button>
        )}
        {card && (
          <button
            className="table-primary"
            disabled={!canPlay}
            onClick={p.onPlay}
          >
            {card.kind === "unit" ? "Đặt" : "Dùng"} · {card.cost} ♨
          </button>
        )}
      </div>
      <section className="table-hand-area" aria-label="Tay bài của bạn">
        <header>
          <b>
            TAY BÀI <small>{owner.hand.length}/8</small>
          </b>
          <span>
            {owner.deck.length} trong bộ · {owner.discard.length} ký ức
          </span>
          <button
            className="table-hand-inspect"
            disabled={!inspectCard}
            onClick={() => setDialog("card")}
          >
            Đọc & dùng
          </button>
          {b.round === 1 &&
            !owner.mulliganUsed &&
            !b.units.some((u) => u.side === "player") && (
              <button disabled={p.busy || !planning} onClick={p.onMulligan}>
                Đổi tay đầu
              </button>
            )}
          {pages > 1 && (
            <div>
              <button
                aria-label="Bài tay trước"
                disabled={!currentPage}
                onClick={() => setPage(currentPage - 1)}
              >
                ‹
              </button>
              <span>
                {currentPage + 1}/{pages}
              </span>
              <button
                aria-label="Bài tay sau"
                disabled={currentPage === pages - 1}
                onClick={() => setPage(currentPage + 1)}
              >
                ›
              </button>
            </div>
          )}
        </header>
        <div className="table-hand">
          {owner.hand
            .slice(currentPage * perPage, (currentPage + 1) * perPage)
            .map((id, i) => {
              const index = currentPage * perPage + i,
                c = TACTICAL_CARD_MAP[id]
              return (
                <button
                  key={`${b.round}:${index}:${id}`}
                  className={`table-hand-card ${
                    p.selectedCard === index ? "is-selected" : ""
                  } ${planning && c.cost <= owner.mana ? "is-playable" : ""}`}
                  aria-label={`${c.name}, ${c.cost} Lửa Bếp, ${kind(c)}`}
                  aria-pressed={p.selectedCard === index}
                  disabled={p.busy || result}
                  onClick={() => {
                    p.onSelectUnit(null)
                    p.onSelectCard(p.selectedCard === index ? null : index)
                  }}
                >
                  <TacticalCardFace card={c} mini />
                </button>
              )
            })}
          {!owner.hand.length && (
            <p>
              Hết bài trên tay. Kết vòng để rút thêm; hết bộ sẽ chịu kiệt sức.
            </p>
          )}
        </div>
      </section>
      <footer className="table-command">
        <div className="table-mana">
          <b>
            ♨ {owner.mana}
            <small>/{owner.maxMana}</small>
          </b>
          <span>LỬA BẾP</span>
        </div>
        <div className="table-phase-copy">
          <b>{stage}</b>
          <span>{p.notice || hint}</span>
        </div>
        <div className="table-ultimates">
          {ready.length > 0 && (
            <button
              disabled={(directed ? !planning : planning) || result || p.busy}
              onClick={() => setDialog("ultimate")}
            >
              ✦ Tuyệt kỹ · {ready.length}
            </button>
          )}
          {directed && (
            <button
              onClick={() => setDialog("traps")}
              aria-label="Xem bẫy đang gài"
            >
              ◇ Bẫy{" "}
              {b.traps.some((t) => t.side === "player" && t.armed) ? "●" : "○"}
            </button>
          )}
        </div>
        <button
          className="table-primary table-next"
          disabled={p.busy || result || !ownTurn || !!pending}
          onClick={p.onAdvance}
        >
          {p.busy
            ? `Đang ${actionLabel.toLocaleLowerCase("vi")}…`
            : directed
              ? ownTurn
                ? "Kết lượt →"
                : "Đối thủ đang chơi…"
              : planning
                ? "Giao chiến →"
                : "Kết vòng · Rút bài →"}
        </button>
        <button
          className="table-surrender"
          aria-label="Đầu hàng"
          disabled={p.busy || result}
          onClick={() => setDialog("forfeit")}
        >
          ⚑
        </button>
      </footer>
      {result && (!transition || quiet) && (
        <div className="table-result" role="status">
          <small>
            {b.winner === "player" ? "GIAO ƯỚC ĐƯỢC GIỮ" : "HẸN LẠI BÊN BẾP"}
          </small>
          <h2>{b.winner === "player" ? "Chiến thắng" : "Trận đấu kết thúc"}</h2>
          <p>
            Vòng {b.round} ·{" "}
            {b.winner === "player"
              ? "Ý chí đối thủ đã cạn."
              : "Đổi tay đầu, giữ quân chắn và thử một bộ bài khác."}
          </p>
          {b.reward && b.reward.tinhVi > 0 && (
            <p>
              +{b.reward.tinhVi} Tinh Vị · 1 vé mở thẻ ·{" "}
              {Object.entries(b.reward.cardCopies)
                .map(
                  ([id, count]) =>
                    `${TACTICAL_CARD_MAP[id.replace(/^card:/, "")]?.name ?? id} ×${count}`,
                )
                .join(", ")}
            </p>
          )}
          <div>
            {b.reward && b.reward.tinhVi > 0 && (
              <button
                className="table-primary"
                disabled={p.claimed}
                onClick={p.onClaim}
              >
                {p.claimed ? "Đã nhận thưởng ✓" : "Nhận phần thưởng"}
              </button>
            )}
            <button onClick={p.onRestart}>Đấu lại</button>
            <button onClick={p.onExit}>Rời bàn</button>
          </div>
          {p.notice && <p>{p.notice}</p>}
        </div>
      )}
      {pending && (
        <Dialog
          title="Bẫy Hương · Chọn phản ứng"
          onClose={() => {}}
          dismissible={false}
          wide
        >
          <div className="directed-reaction" data-reaction-id={pending.id}>
            <div>
              <small>ĐỐI THỦ ĐÃ CÔNG BỐ</small>
              <h3>
                {pending.cardId
                  ? TACTICAL_CARD_MAP[pending.cardId]?.name
                  : "Đòn tấn công"}
              </h3>
              <p>
                {pending.stage === "before"
                  ? "Hành động đang chờ giải quyết. Bạn có thể phản chế ngay."
                  : "Hành động đã xảy ra. Bẫy có thể phản ứng với kết quả này."}
              </p>
            </div>
            {(() => {
              const t = b.traps.find(
                  (t) => t.instanceId === pending.trapInstanceId,
                ),
                c = t?.cardId ? TACTICAL_CARD_MAP[t.cardId] : null
              return c ? <TacticalCardFace card={c} /> : null
            })()}
            <div className="directed-reaction-actions">
              <button
                className="table-primary"
                disabled={p.busy}
                onClick={() => p.onReact?.(pending.id, true)}
              >
                ✦ Lật bẫy
              </button>
              <button
                disabled={p.busy}
                onClick={() => p.onReact?.(pending.id, false)}
              >
                Giữ bẫy cho lần sau
              </button>
            </div>
            <small>
              Không có đếm ngược. Tải lại vẫn chờ đúng quyết định này.
            </small>
          </div>
        </Dialog>
      )}
      {dialog && !pending && (
        <Dialog
          title={
            dialog === "guide"
              ? "Một vòng Linh Chiến"
              : dialog === "ultimate"
                ? "Chọn Tuyệt kỹ đã sẵn sàng"
                : dialog === "log"
                  ? "Nhật ký & ký ức"
                  : dialog === "forfeit"
                    ? "Rời cuộc giao ước?"
                    : dialog === "traps"
                      ? "Ô Bẫy Hương"
                      : (inspectCard?.name ?? "Lá bài")
          }
          onClose={() => setDialog(null)}
        >
          {dialog === "card" && inspectCard && (
            <div className="table-enlarged">
              <TacticalCardFace card={inspectCard} />
              {card?.kind === "trap" && !directed && (
                <div className="table-trap-columns">
                  {([0, 1, 2, 3] as const).map((c) => (
                    <button
                      key={c}
                      aria-pressed={p.trapColumn === c}
                      onClick={() => p.onColumn(c)}
                    >
                      Cột {c + 1}
                    </button>
                  ))}
                </div>
              )}
              <p>{hint}</p>
              {card && (
                <button
                  className="table-primary"
                  disabled={!canPlay}
                  onClick={() => {
                    setDialog(null)
                    p.onPlay()
                  }}
                >
                  {card.kind === "unit"
                    ? "Triệu hồi ô trống"
                    : card.kind === "trap"
                      ? "Gài bẫy"
                      : "Dùng thẻ"}{" "}
                  · {card.cost} ♨
                </button>
              )}
              <button onClick={() => setDialog(null)}>Trở lại bàn</button>
            </div>
          )}
          {dialog === "guide" && (
            <ol className="table-rules">
              <li>
                <b>Dàn trận:</b> chọn thẻ trên tay, trả đúng Lửa, chọn ô sáng
                hoặc mục tiêu. Mỗi bên tối đa 5 quân trên 4 cột × 2 hàng.
              </li>
              <li>
                <b>Nâng sao:</b> chơi bản sao thứ hai lên đúng quân 1 sao: +40%
                công/HP tối đa, giữ lượng HP đã mất. Không phải thẻ nào cũng
                được đặt lên quân khác.
              </li>
              <li>
                <b>Tấn công:</b> trong lượt bạn, chọn quân rồi chọn mục tiêu
                sáng. Mỗi quân đánh thường một lần/vòng. Hộ vệ tiền tuyến phải
                bị xử lý trước; Pháp sư có thể nhắm hậu tuyến khi không còn Hộ
                vệ. Không còn quân địch mới đánh được Chỉ huy.
              </li>
              <li>
                <b>Nhịp lượt:</b> xen kẽ chơi bài, tấn công và Tuyệt kỹ đủ 100
                Hương lực. Quân mới đợi lượt sau trừ Xung kích. Kết lượt để AI
                hành động; hết lượt AI mới rút bài, tăng/hồi Lửa và +20 Hương
                lực.
              </li>
              <li>
                <b>Bẫy úp:</b> mỗi bên giữ một bẫy riêng, gài mới thay bẫy cũ.
                Tám lá có tám chức năng; chọn Lật hoặc Giữ khi đủ điều kiện. Lộ
                bẫy chỉ cho biết danh tính; gỡ bẫy loại bỏ nó.
              </li>
              <li>
                <b>Thắng:</b> hạ 30 Ý chí địch. Đòn vào Chỉ huy = công/10 làm
                tròn lên. Hết bộ chịu kiệt sức; từ vòng 8 có Lửa Lớn.
              </li>
              <li>
                <b>Cộng hưởng:</b> 3 hệ cho Mâm Chung +3 công; 4 quân cùng trait
                cho +6 thay +3. Hai lá liên tiếp cùng hệ mỗi vòng tạo +5 khiên
                một lần.
              </li>
            </ol>
          )}
          {dialog === "traps" && (
            <div className="directed-trap-library">
              {(["player", "enemy"] as const).map((side) => {
                const t = b.traps.find((t) => t.side === side && t.armed),
                  c =
                    t?.cardId && (side === "player" || t.revealed)
                      ? TACTICAL_CARD_MAP[t.cardId]
                      : null
                return (
                  <article key={side}>
                    <h3>{side === "player" ? "Bẫy của bạn" : "Bẫy đối thủ"}</h3>
                    {c ? (
                      <TacticalCardFace card={c} />
                    ) : (
                      <p>
                        {t
                          ? "◇ Bẫy đang úp · chưa lộ danh tính"
                          : "Chưa gài bẫy"}
                      </p>
                    )}
                  </article>
                )
              })}
            </div>
          )}
          {dialog === "log" && (
            <>
              <ol className="table-log-list">
                {b.log.slice(-50).map((e) => (
                  <li key={e.id}>{e.text}</li>
                ))}
              </ol>
              <p>
                Ký ức:{" "}
                {owner.discard
                  .map((id) => TACTICAL_CARD_MAP[id].name)
                  .join(", ") || "Chưa có"}
              </p>
            </>
          )}
          {dialog === "forfeit" && (
            <>
              <p>
                Trận này sẽ tính thua. Bộ sưu tập và phần thưởng đã nhận vẫn
                được giữ.
              </p>
              <button onClick={() => setDialog(null)}>Chơi tiếp</button>
              <button
                onClick={() => {
                  setDialog(null)
                  p.onForfeit()
                }}
              >
                Xác nhận đầu hàng
              </button>
            </>
          )}
          {dialog === "ultimate" && (
            <div className="table-ultimate-choices">
              {ready.map((u) => (
                <button
                  key={u.instanceId}
                  onClick={() => {
                    setDialog(null)
                    p.onUltimate(u.instanceId)
                  }}
                >
                  ✦ {u.name} · {u.ultimatePower} sức mạnh · 100 Hương lực
                </button>
              ))}
            </div>
          )}
        </Dialog>
      )}
      {p.overlay}
    </section>
  )
}
