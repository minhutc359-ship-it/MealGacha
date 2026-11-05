import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import { SCHOOLS, RARITIES } from "../../game/catalog"
import { type TacticalCard } from "../../game/tacticalTcg/cards"
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
import { TacticalSpiritArt } from "./TacticalSpirit"
import { DuelCommander, TacticalDuelField } from "./TacticalDuelField"
import { duelStatuses } from "../../game/tacticalTcg/presentation/duel"
import {
  DUEL_CARD_MAP,
  combatCard,
  duelChoiceCard,
} from "../../game/tacticalTcg/duelCards"
import { useDuelViewport } from "../../game/tacticalTcg/presentation/duelViewport"
import { duelSounds } from "../../game/tacticalTcg/presentation/duelAudio"
import { useGameMusic } from "./GameAudio"
import { gameAudio } from "../../infrastructure/audio/gameAudio"
import { DuelCulture } from "./DuelCulture"
import { TACTICAL_CAMPAIGN_NODES } from "../../game/tacticalTcg/campaign"
import { DUEL_BOSSES } from "../../game/tacticalTcg/engine/duelBosses"
import { TacticalCombatEffects } from "./TacticalCombatEffects"
import {
  directedCardText,
  directedReadiness,
  directedTargets,
} from "../../game/tacticalTcg/engine/directedRules"
import "../../game/directedTable.css"
import "../../game/tacticalTable.css"
import "../../game/duelTable.css"

const TACTICAL_CARD_MAP = DUEL_CARD_MAP
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
  choiceIndex?: 0 | 1
  onChoice?: (index: 0 | 1) => void
  quest?: {
    label: string
    complete: boolean
    claimed: boolean
    onClaim: () => void
  }
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
  const viewport = useDuelViewport()
  const prefs = useAppStore((s) => s.user.preferences)
  const updatePreference = useAppStore((s) => s.updatePreference)
  const region = String(
    TACTICAL_CAMPAIGN_NODES.find((n) => n.id === b.nodeId)?.act ?? 1,
  )
  const bossUnit = b.units.find((u) => u.instanceId === b.boss?.unitId)
  const bossTell = DUEL_BOSSES.find((v) => v.id === bossUnit?.id)?.tell
  useGameMusic(
    b.boss || b.commanders.player.hp <= 8
      ? "boss"
      : region === "2"
        ? "map-harbor"
        : region === "3"
          ? "map-garden"
          : region === "4"
            ? "map-lotus"
            : "mode-tcg",
    20,
  )
  const owner = b.cardGame!.sides.player,
    enemy = b.cardGame!.sides.enemy
  const card =
    p.selectedCard === null
      ? null
      : duelChoiceCard(
          combatCard(b, owner.hand[p.selectedCard]),
          p.choiceIndex ?? 0,
        )
  const unit = b.units.find(
    (u) => u.instanceId === p.selectedUnit && !u.defeated,
  )
  const inspectCard = card ?? (unit?.cardId ? combatCard(b, unit.cardId) : null)
  const [dialog, setDialog] =
    useState<"guide" | "card" | "log" | "forfeit" | "ultimate" | "traps" | null>(
      null,
    )
  const [compact, setCompact] = useState(false),
    [page, setPage] = useState(0)
  const [effects, setEffects] = useState<Record<string, string>>({})
  const [transition, setTransition] = useState<TacticalTransition | null>(null)
  const [contacted, setContacted] = useState(true)
  useEffect(() => {
    if (transition)
      duelSounds(transition).forEach((s) => gameAudio.play(s.cue, s.delay))
  }, [transition?.id])
  useEffect(() => {
    if (b.winner) gameAudio.play(b.winner === "player" ? "victory" : "defeat")
  }, [b.winner])
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
      setReveal(combatCard(b, trap.cardId))
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
                  ? "Gọi Vị Linh từ tay bài. Chọn quân trùng lá để thức tỉnh lên 2 sao."
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
                  ? (bossTell ??
                    "Chơi bài → chọn quân → chọn mục tiêu. Kết lượt khi đã sẵn sàng.")
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
      className={`tcg-table is-duel is-final ${
        viewport.short ? "is-short" : ""
      } ${viewport.narrow ? "is-narrow" : ""} ${
        viewport.rotated ? "is-rotated" : ""
      }`}
      style={
        {
          ...viewport.style,
          "--duel-board": `url("/assets/tcg/boards/${
            region === "2"
              ? "ember"
              : region === "3"
                ? "grove"
                : region === "4"
                  ? "sugar"
                  : "hearth"
          }-v441.webp")`,
        } as CSSProperties
      }
      data-rotated={viewport.rotated}
      aria-label="Bàn Linh Chiến TCG · 5 Vị Linh mỗi bên"
      data-phase={b.phase}
      data-turn={directed?.turn}
      data-quiet={quiet}
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
            Vòng {b.round} <i> / </i> {stage}{b.mode === "pvp" ? ` · ${(b.cardGame?.botLevel ?? "hard").toUpperCase()}` : ""}
          </strong>
        </div>
        <nav>
          <button onClick={() => setDialog("guide")}>
            ? <span>Luật chơi</span>
          </button>
          <button onClick={() => setDialog("log")}>
            ☷ <span>Nhật ký</span>
          </button>
          <button
            aria-label={prefs.soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
            onClick={() =>
              updatePreference("soundEnabled", !prefs.soundEnabled)
            }
          >
            {prefs.soundEnabled ? "♫" : "♪"}
          </button>
          {viewport.mobile && (
            <button onClick={viewport.toggle} aria-label="Đổi hướng bàn đấu">
              {viewport.wide ? "Dọc" : "Ngang"}
            </button>
          )}
        </nav>
      </header>
      <div
        ref={arena}
        className="table-arena"
        role="region"
        aria-label="Hai sân đấu"
      >
        <div className="duel-cultural-background">
          <DuelCulture kind="drum" />
          <DuelCulture kind="lotus" />
          <DuelCulture kind="rice" />
        </div>
        <DuelCommander
          battle={b}
          side="enemy"
          hp={commanderHp("enemy")}
          target={
            attackTargets.includes("hero:enemy") ||
            (!!card &&
              card.kind === "spell" &&
              card.tacticalEffect === "damage" &&
              planning &&
              !p.busy &&
              owner.mana >= card.cost)
          }
          onTarget={p.onCommander}
          onTrap={() => setDialog("traps")}
          speech={
            directed?.turn === "enemy"
              ? transition?.cardId
                ? `${TACTICAL_CARD_MAP[transition.cardId]?.name ?? "Vị Linh"}, hành động!`
                : "Đến lượt ta. Hãy giữ thế trận!"
              : "Ta đang chờ nước đi của ngươi."
          }
        />
        {(["enemy", "player"] as const).map((side) => (
          <TacticalDuelField
            key={side}
            battle={b}
            side={side}
            card={card}
            selected={unit}
            targets={attackTargets}
            busy={p.busy}
            ultimate={p.attackMode === "ultimate"}
            planning={planning}
            transition={transition}
            contacted={contacted}
            effects={effects}
            onCell={p.onCell}
          />
        ))}
        <div className="table-divider" title={bossTell}>
          <span>
            {pending
              ? "BẪY CHỜ PHẢN ỨNG"
              : attackReady
                ? "CHỌN MỤC TIÊU SÁNG VIỀN"
                : ownTurn
                  ? "LƯỢT CỦA BẠN"
                  : "LƯỢT ĐỐI THỦ"}
          </span>
          <b>✦</b>
          <span>
            {b.boss
              ? `HẠ ${b.boss.title.toLocaleUpperCase("vi")} HOẶC CHỦ TƯỚNG ĐỂ THẮNG`
              : "HỘ VỆ BẢO VỆ CHỦ TƯỚNG · CÔNG = SÁT THƯƠNG"}
          </span>
        </div>
        <DuelCommander
          battle={b}
          side="player"
          hp={commanderHp("player")}
          onTrap={() => setDialog("traps")}
          speech={
            card
              ? `${card.name} — chọn cách triển khai.`
              : unit?.side === "player"
                ? `${unit.name}, ${
                    attackReady ? "chọn mục tiêu!" : "giữ vị trí."
                  }`
                : ownTurn
                  ? "Cùng nhau giữ lửa. Bạn ra lệnh!"
                  : "Quan sát đối thủ, chờ thời cơ lật bẫy."
          }
        />
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
                  ? "Hộ vệ chắn chủ tướng; chọn quân rồi mục tiêu để đánh. Di chuột hoặc chạm Đọc thẻ để xem kỹ năng."
                  : "Quân địch: chạm để xem, không điều khiển."}
              </p>
            )}
            {unit && !card && (
              <p className="duel-status-description">
                {duelStatuses(b, unit)
                  .map((s) => s.label)
                  .join(" · ") || "Không có trạng thái bất lợi"}
              </p>
            )}
            <button onClick={() => setDialog("card")}>Phóng to lá bài ↗</button>
          </>
        ) : (
          <div className="table-coach">
            <DuelCulture kind="drum" />
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
                    ? "Gọi Vị Linh"
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
        {card?.choices && (
          <div className="duel-spell-choices" aria-label="Chọn cách Nêm vị">
            {card.choices.map((choice, index) => (
              <button
                key={index}
                aria-pressed={(p.choiceIndex ?? 0) === index}
                onClick={() => p.onChoice?.(index as 0 | 1)}
              >
                {choice.label}
              </button>
            ))}
          </div>
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
        <div
          className="table-hand"
          style={
            {
              "--hand-count": Math.max(
                1,
                Math.min(perPage, owner.hand.length - currentPage * perPage),
              ),
            } as CSSProperties
          }
        >
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
              ? b.boss && bossUnit?.defeated
                ? "Boss đã được khuất phục."
                : "Ý chí đối thủ đã cạn."
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
            {p.quest && (
              <div className="duel-quest-result">
                <b>
                  {p.quest.complete ? "✓ Thử thách đạt" : "Thử thách còn mở"}
                </b>
                <p>{p.quest.label}</p>
                {p.quest.complete && (
                  <button disabled={p.quest.claimed} onClick={p.quest.onClaim}>
                    {p.quest.claimed
                      ? "Đã nhận mốc thử thách"
                      : "Nhận +20 Tinh Vị thử thách"}
                  </button>
                )}
              </div>
            )}
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
              {unit && !card && (
                <p>
                  {duelStatuses(b, unit)
                    .map((s) => s.label)
                    .join(" · ") || "Không có trạng thái bất lợi"}
                </p>
              )}
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
                    ? "Gọi Vị Linh"
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
              {b.boss && (
                <li>
                  <b>Thử thách boss:</b> Hạ boss hoặc đưa chủ tướng địch về 0
                  HP. {bossTell ?? "Boss đổi pha và nhận khiên khi mất HP."}
                </li>
              )}
              <li>
                <b>Gọi Vị Linh:</b> chọn lá trên tay, trả Lửa và gọi lên sân.
                Mỗi bên tối đa 5 quân, vai trò quyết định cách bảo vệ và phối
                hợp.
              </li>
              <li>
                <b>Nâng sao:</b> chơi bản sao thứ hai lên đúng quân 1 sao: +40%
                công/HP tối đa, giữ lượng HP đã mất. Không phải thẻ nào cũng
                được đặt lên quân khác.
              </li>
              <li>
                <b>Tấn công:</b> trong lượt bạn, chọn quân rồi chọn mục tiêu
                sáng. Mỗi quân đánh thường một lần/vòng. Còn Hộ vệ phải đánh Hộ
                vệ trước; hết Hộ vệ có thể đánh chủ tướng hoặc quân bất kỳ. Hai
                quân trao đổi sát thương; Tiên thủ hạ mục tiêu sẽ tránh phản
                đòn. Tuyệt kỹ không nhận phản đòn.
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
                <b>Trạng thái:</b> Dây Lá trói chân và khống chế, ngăn đánh và
                Tuyệt kỹ đến hết vòng ghi trên thẻ. Khăn Ấm và Vị Linh giải
                khống chế không hoàn đòn đã dùng. Thiêu đốt từ bẫy Than Hồng gây
                1 sát thương cuối mỗi vòng trong 2 lần, đi qua khiên trước,
                không cộng dồn. Hồi sinh xóa các trạng thái cũ.
              </li>
              <li>
                <b>Thắng:</b> hạ 30 HP địch. Đòn vào chủ tướng bằng công ghi
                trên thẻ: công 3 gây 3 HP lên cả quân lẫn chủ tướng. Hết bộ chịu
                kiệt sức; từ vòng 8 có Lửa Lớn.
              </li>
              <li>
                <b>Cộng hưởng:</b> 3 hệ cho Mâm Chung +1 công; 4 quân cùng hệ
                cho +2 thay +1. Hai lá liên tiếp cùng hệ mỗi vòng tạo +1 khiên
                một lần. Khiên mỗi quân tối đa 3.
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
