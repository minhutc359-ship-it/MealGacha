import { useMemo, useState } from "react"
import {
  CARDS,
  CARD_MAP,
  DECK_SIZE,
  SCHOOLS,
  deckErrors,
} from "../../game/catalog"
import { useGameStore } from "../../game/useGameStore"
import {
  DECK_STYLES,
  analyzeDeck,
  cardRole,
  sampleHand,
  suggestDeck,
  type DeckStyle,
} from "../../game/deckStrategy"
import { GameCardView } from "./GameCardView"
import { Dialog } from "./Dialog"
import { CardShelf } from "./CardShelf"
import { ResultPostcard } from "./ResultPostcard"

export function DeckBuilder() {
  const save = useGameStore((s) => s.save)
  const initial =
    save.decks.find((d) => d.id === save.activeDeckId) ?? save.decks[0]
  const [id, setId] = useState(initial.id),
    [name, setName] = useState(initial.name),
    [draft, setDraft] = useState([...initial.cards])
  const [school, setSchool] = useState("all"),
    [kind, setKind] = useState("all"),
    [role, setRole] = useState("all"),
    [rarity, setRarity] = useState("all"),
    [search, setSearch] = useState("")
  const [style, setStyle] = useState<DeckStyle>("balanced"),
    [hand, setHand] = useState<string[] | null>(null),
    [inspect, setInspect] = useState<string | null>(null)
  const [tool, setTool] = useState<"strategy" | "analysis" | null>(null)
  const [mobileView, setMobileView] = useState<"cards" | "draft">("cards")
  const counts = useMemo(
    () =>
      Object.fromEntries(
        [...new Set(draft)].map((c) => [
          c,
          draft.filter((id) => id === c).length,
        ]),
      ),
    [draft],
  )
  const analysis = useMemo(() => analyzeDeck(draft), [draft])
  const cards = CARDS.filter(
    (c) =>
      save.cards[c.id] &&
      (school === "all" || c.school === school) &&
      (kind === "all" || c.kind === kind) &&
      (role === "all" || cardRole(c) === role) &&
      (rarity === "all" || c.rarity === rarity) &&
      `${c.name} ${c.text}`
        .toLocaleLowerCase("vi")
        .includes(search.toLocaleLowerCase("vi")),
  ).sort((a, b) => a.cost - b.cost)
  const errors = deckErrors(draft, save.cards)
  const load = (deck: typeof initial) => {
    setId(deck.id)
    setName(deck.name)
    setDraft([...deck.cards])
  }
  const add = (cardId: string) => {
    if (
      draft.length < DECK_SIZE &&
      (counts[cardId] ?? 0) < Math.min(2, save.cards[cardId] ?? 0)
    )
      setDraft((old) => [...old, cardId])
  }
  const remove = (cardId: string) =>
    setDraft((old) => {
      const next = [...old]
      const index = next.indexOf(cardId)
      if (index >= 0) next.splice(index, 1)
      return next
    })
  return (
    <section className="tcg-deck-screen">
      <div className="tcg-section-heading">
        <div>
          <span className="tcg-kicker">MỖI BỘ BÀI LÀ MỘT CÁCH GIỮ BÀN</span>
          <h1>Xưởng chiến thuật</h1>
          <p>
            18 lá · tối đa 2 bản mỗi thẻ · 6 bộ bài. Ghép món và phép liên tiếp
            trong cùng lượt để mở công thức.
          </p>
        </div>
      </div>
      <div className="tcg-deck-tabs">
        {save.decks.map((d) => (
          <button
            key={d.id}
            className={`tcg-button ${d.id === id ? "primary" : "ghost"}`}
            onClick={() => load(d)}
          >
            {d.id === save.activeDeckId ? "✦ " : ""}
            {d.name}
          </button>
        ))}
        <button
          className="tcg-button ghost"
          disabled={save.decks.length >= 6}
          onClick={() => {
            setId(crypto.randomUUID())
            setName("Bộ bài mới")
            setDraft([])
          }}
        >
          + Bộ mới ({save.decks.length}/6)
        </button>
      </div>
      <div className="tcg-screen-tools">
        <button
          className="tcg-button ghost"
          onClick={() => setTool("strategy")}
        >
          Gợi ý chiến thuật
        </button>
        <button
          className="tcg-button ghost"
          onClick={() => setTool("analysis")}
        >
          Phân tích & combo
        </button>
        <button
          className="tcg-button primary"
          disabled={!!errors.length}
          onClick={() => useGameStore.getState().saveDeck(id, name, draft)}
        >
          Lưu & trang bị · {draft.length}/18
        </button>
      </div>
      <div
        className="tcg-deck-view-tabs"
        role="group"
        aria-label="Khu vực bộ bài"
      >
        <button
          aria-pressed={mobileView === "cards"}
          onClick={() => setMobileView("cards")}
        >
          Thêm thẻ
        </button>
        <button
          aria-pressed={mobileView === "draft"}
          onClick={() => setMobileView("draft")}
        >
          Trong bộ · {draft.length}/18
        </button>
      </div>
      <div className="tcg-deck-layout" data-view={mobileView}>
        <section className="tcg-deck-catalog">
          <div className="tcg-library-controls">
            <input
              aria-label="Tìm thẻ xây deck"
              placeholder="Tìm tên / kỹ năng…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <details className="tcg-advanced-filters">
              <summary>Bộ lọc</summary>
              <div className="tcg-filters tcg-deck-filters">
                <select
                  aria-label="Hệ thẻ"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                >
                  <option value="all">Tất cả hệ</option>
                  {Object.entries(SCHOOLS).map(([id, s]) => (
                    <option key={id} value={id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Loại thẻ"
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                >
                  <option value="all">Món & phép</option>
                  <option value="unit">Đồng minh</option>
                  <option value="spell">Bí thuật</option>
                </select>
                <select
                  aria-label="Vai trò thẻ"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="all">Mọi vai trò</option>
                  {[
                    "Áp lực",
                    "Giữ bàn",
                    "Hồi phục",
                    "Rút bài",
                    "Dọn sân",
                    "Hỗ trợ",
                    "Đồng minh",
                  ].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <select
                  aria-label="Độ hiếm thẻ"
                  value={rarity}
                  onChange={(e) => setRarity(e.target.value)}
                >
                  <option value="all">Mọi độ hiếm</option>
                  <option value="common">Thường</option>
                  <option value="rare">Hiếm</option>
                  <option value="epic">Sử thi</option>
                  <option value="legendary">Huyền thoại</option>
                </select>
              </div>
            </details>
          </div>
          <p className="tcg-filter-count">
            {cards.length} thẻ ·{" "}
            {draft.length === DECK_SIZE
              ? "Bộ đủ 18 lá. Sang Trong bộ để bỏ lá."
              : "Nhấn để thêm; nút i để đọc kỹ năng."}
          </p>
          <CardShelf
            compact
            label="Thẻ xây bộ bài"
            resetKey={[search, school, kind, role, rarity].join("|")}
            items={cards.map((c) => (
              <div className="tcg-deck-card-wrap" key={c.id}>
                <GameCardView
                  card={c}
                  compact
                  count={save.cards[c.id]}
                  selected={!!counts[c.id]}
                  disabled={
                    draft.length >= DECK_SIZE ||
                    (counts[c.id] ?? 0) >= Math.min(2, save.cards[c.id])
                  }
                  onClick={() => add(c.id)}
                />
                <button
                  className="tcg-unit-info"
                  aria-label={`Đọc thẻ ${c.name}`}
                  onClick={() => setInspect(c.id)}
                >
                  i
                </button>
                <small>
                  {cardRole(c)} · Trong bộ {counts[c.id] ?? 0}/2
                </small>
              </div>
            ))}
          />
        </section>
        <aside className="tcg-panel tcg-deck-draft">
          <label>
            Tên bộ bài
            <input
              aria-label="Tên bộ bài"
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <div className="tcg-deck-summary">
            <strong>
              {draft.length}
              <small>/{DECK_SIZE} lá</small>
            </strong>
            <span>
              {analysis.units} đồng minh
              <br />
              {analysis.spells} bí thuật
            </span>
          </div>
          <div className="tcg-draft-list">
            {Object.entries(counts)
              .sort(([a], [b]) => CARD_MAP[a].cost - CARD_MAP[b].cost)
              .map(([id, count]) => (
                <button
                  key={id}
                  onClick={() => remove(id)}
                  aria-label={`Bỏ một ${CARD_MAP[id].name}`}
                >
                  <b>{CARD_MAP[id].cost}</b>
                  <span>{CARD_MAP[id].name}</span>
                  <strong>×{count}</strong>
                  <i>−</i>
                </button>
              ))}
          </div>
          {errors.length > 0 && <p className="tcg-builder-tip">{errors[0]}</p>}
          <div className="tcg-deck-tools">
            <button
              disabled={draft.length < 4}
              onClick={() => setHand(sampleHand(draft))}
            >
              Thử tay bài
            </button>
            <button onClick={() => setDraft([])}>Xóa nháp</button>
          </div>
          <ResultPostcard deck={{ name, cards: draft }} />
          {save.decks.some((d) => d.id === id) && id !== save.activeDeckId && (
            <button
              className="tcg-button ghost"
              onClick={() => useGameStore.getState().useDeck(id)}
            >
              Trang bị bản đã lưu
            </button>
          )}
          {save.decks.length > 1 && save.decks.some((d) => d.id === id) && (
            <button
              className="tcg-text-button"
              onClick={() => {
                useGameStore.getState().deleteDeck(id)
                load(useGameStore.getState().save.decks[0])
              }}
            >
              Xóa bộ bài này
            </button>
          )}
        </aside>
      </div>
      {tool && (
        <Dialog
          title={tool === "strategy" ? "Gợi ý chiến thuật" : "Phân tích bộ bài"}
          onClose={() => setTool(null)}
          wide
        >
          {tool === "strategy" ? (
            <section className="tcg-strategy-panel tcg-panel">
              <div>
                <h2>Chọn nhịp chơi</h2>
                <p>
                  Gợi ý chỉ dùng thẻ bạn sở hữu. Bạn có thể sửa nháp trước khi
                  lưu.
                </p>
              </div>
              <div className="tcg-strategy-options">
                {DECK_STYLES.map((plan) => (
                  <button
                    key={plan.id}
                    className={style === plan.id ? "active" : ""}
                    aria-pressed={style === plan.id}
                    onClick={() => setStyle(plan.id)}
                  >
                    <strong>{plan.name}</strong>
                    <small>{plan.text}</small>
                  </button>
                ))}
              </div>
              <button
                className="tcg-button primary"
                onClick={() => {
                  setDraft(suggestDeck(save.cards, style))
                  setName(DECK_STYLES.find((p) => p.id === style)!.name)
                  setTool(null)
                }}
              >
                Gợi ý bộ bài theo chiến thuật
              </button>
            </section>
          ) : (
            <div className="tcg-deck-analysis">
              <p>
                ◈ Giá trung bình {analysis.average.toFixed(1)} ·{" "}
                {analysis.cheap} lá giá 1–2 · {analysis.guards} Hộ vệ
              </p>
              <div className="tcg-curve" aria-label="Phân bố năng lượng">
                {Array.from({ length: 7 }, (_, i) => {
                  const n = draft.filter(
                    (id) => CARD_MAP[id].cost === i + 1,
                  ).length
                  return (
                    <div key={i}>
                      <span>{n}</span>
                      <i style={{ height: `${8 + n * 7}px` }} />
                      <small>{i + 1}</small>
                    </div>
                  )
                })}
              </div>
              <div className="tcg-deck-recipes">
                {analysis.combos.map(({ recipe, anchors, finishers }) => (
                  <details key={recipe.id}>
                    <summary>
                      {recipe.symbol} {recipe.name} ·{" "}
                      {anchors.length && finishers.length
                        ? "Có combo"
                        : "Thiếu cặp"}
                    </summary>
                    <p>
                      {anchors.length} món mở · {finishers.length} phép kết
                    </p>
                    <p>
                      {[...new Set(anchors)]
                        .map((id) => CARD_MAP[id].name)
                        .join(", ") || "Chưa có món mở"}{" "}
                      →{" "}
                      {[...new Set(finishers)]
                        .map((id) => CARD_MAP[id].name)
                        .join(", ") || "Chưa có phép kết"}
                    </p>
                    <small>{recipe.reward} Mỗi công thức 1 lần/lượt.</small>
                  </details>
                ))}
              </div>
              {analysis.tips.map((t) => (
                <p className="tcg-builder-tip" key={t}>
                  {t}
                </p>
              ))}
            </div>
          )}
        </Dialog>
      )}
      {hand && (
        <Dialog
          title="Thử tay mở đầu · 4 lá"
          onClose={() => setHand(null)}
          wide
        >
          <p>
            Đây là mô phỏng, không dùng thẻ hoặc đổi tiến trình. Kiểm tra lá giá
            thấp và cặp món → phép.
          </p>
          <div className="tcg-mulligan-hand">
            {hand.map((id, i) => (
              <GameCardView key={i} card={CARD_MAP[id]} compact />
            ))}
          </div>
          <button
            className="tcg-button primary"
            onClick={() => setHand(sampleHand(draft))}
          >
            Rút thử lần nữa
          </button>
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
    </section>
  )
}
