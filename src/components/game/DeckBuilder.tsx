import { useState } from "react"
import {
  CARDS,
  CARD_MAP,
  DECK_SIZE,
  SCHOOLS,
  STARTER_DECK,
  deckErrors,
} from "../../game/catalog"
import { useGameStore } from "../../game/useGameStore"
import { GameCardView } from "./GameCardView"

export function DeckBuilder() {
  const save = useGameStore((s) => s.save),
    saveDeck = useGameStore((s) => s.saveDeck),
    deleteDeck = useGameStore((s) => s.deleteDeck),
    useDeck = useGameStore((s) => s.useDeck)
  const initial =
    save.decks.find((d) => d.id === save.activeDeckId) ?? save.decks[0]
  const [id, setId] = useState(initial.id),
    [name, setName] = useState(initial.name),
    [draft, setDraft] = useState([...initial.cards]),
    [school, setSchool] = useState("all")
  const counts = Object.fromEntries(
    [...new Set(draft)].map((c) => [c, draft.filter((id) => id === c).length]),
  )
  const cards = CARDS.filter(
    (c) => save.cards[c.id] && (school === "all" || c.school === school),
  ).sort((a, b) => a.cost - b.cost)
  const units = draft.filter((id) => CARD_MAP[id].kind === "unit").length
  const curve = Array.from(
    { length: 7 },
    (_, i) => draft.filter((id) => CARD_MAP[id].cost === i + 1).length,
  )
  const add = (id: string) => {
    if (
      draft.length < DECK_SIZE &&
      (counts[id] ?? 0) < Math.min(2, save.cards[id] ?? 0)
    )
      setDraft([...draft, id])
  }
  const remove = (id: string) => {
    const next = [...draft]
    next.splice(next.indexOf(id), 1)
    setDraft(next)
  }
  const autoBuild = () => {
    const available = CARDS.filter((c) => save.cards[c.id])
      .flatMap((c) => Array.from({ length: save.cards[c.id] }, () => c))
      .sort((a, b) => a.cost - b.cost)
    const list = [
      ...available.filter((c) => c.kind === "unit").slice(0, 12),
      ...available.filter((c) => c.kind === "spell").slice(0, 6),
    ]
    for (const c of available)
      if (
        list.length < DECK_SIZE &&
        list.filter((x) => x.id === c.id).length < Math.min(2, save.cards[c.id])
      )
        list.push(c)
    setDraft(list.slice(0, DECK_SIZE).map((c) => c.id))
  }
  return (
    <>
      <div className="tcg-section-heading">
        <div>
          <span className="tcg-kicker">CHIẾN THUẬT BẮT ĐẦU TỪ ĐÂY</span>
          <h1>Bộ bài của bạn</h1>
          <p>
            18 lá, tối đa 2 bản mỗi thẻ. Kết hợp đồng minh cùng hệ để tạo lá
            chắn.
          </p>
        </div>
      </div>
      <div className="tcg-deck-tabs">
        {save.decks.map((d) => (
          <button
            key={d.id}
            className={`tcg-button ${d.id === id ? "primary" : "ghost"}`}
            onClick={() => {
              setId(d.id)
              setName(d.name)
              setDraft([...d.cards])
            }}
          >
            {d.id === save.activeDeckId ? "✦ " : ""}
            {d.name}
          </button>
        ))}
        <button
          className="tcg-button ghost"
          disabled={save.decks.length >= 3}
          onClick={() => {
            setId(crypto.randomUUID())
            setName("Bộ bài mới")
            setDraft([])
          }}
        >
          + Bộ mới
        </button>
      </div>
      <div className="tcg-deck-layout">
        <section>
          <div className="tcg-filters">
            <select
              aria-label="Hệ thẻ trong bộ bài"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
            >
              <option value="all">Tất cả hệ đã sở hữu</option>
              {Object.entries(SCHOOLS).map(([id, s]) => (
                <option key={id} value={id}>
                  {s.name}
                </option>
              ))}
            </select>
            <span className="tcg-filter-count">
              Nhấn thẻ để thêm vào bộ bài
            </span>
          </div>
          <div className="tcg-card-grid deck-cards">
            {cards.map((c) => (
              <GameCardView
                key={c.id}
                card={c}
                compact
                count={save.cards[c.id]}
                selected={!!counts[c.id]}
                disabled={
                  draft.length >= DECK_SIZE ||
                  (counts[c.id] ?? 0) >= save.cards[c.id]
                }
                onClick={() => add(c.id)}
              />
            ))}
          </div>
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
              {units} đồng minh
              <br />
              {draft.length - units} bí thuật
            </span>
          </div>
          <div className="tcg-curve" aria-label="Phân bố năng lượng">
            {curve.map((n, i) => (
              <div key={i}>
                <span>{n}</span>
                <i style={{ height: `${8 + n * 7}px` }} />
                <small>{i + 1}</small>
              </div>
            ))}
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
          {!draft.length && (
            <p className="tcg-empty">Nhấn các lá bên trái để xây bộ bài.</p>
          )}
          {units < 9 && draft.length > 0 && (
            <p className="tcg-builder-tip">
              Gợi ý: nên có ít nhất 9 đồng minh để giữ sân.
            </p>
          )}
          <button
            className="tcg-button primary"
            disabled={!!deckErrors(draft, save.cards).length}
            onClick={() => saveDeck(id, name, draft)}
          >
            Lưu & trang bị
          </button>
          <div className="tcg-deck-tools">
            <button onClick={autoBuild}>Tự xếp bài</button>
            <button onClick={() => setDraft([...STARTER_DECK])}>
              Bộ khởi đầu
            </button>
            <button onClick={() => setDraft([])}>Xóa nháp</button>
          </div>
          {save.decks.some((d) => d.id === id) && id !== save.activeDeckId && (
            <button className="tcg-button ghost" onClick={() => useDeck(id)}>
              Trang bị bản đã lưu
            </button>
          )}
          {save.decks.length > 1 && save.decks.some((d) => d.id === id) && (
            <button
              className="tcg-text-button"
              onClick={() => {
                deleteDeck(id)
                const other = save.decks.find((d) => d.id !== id)!
                setId(other.id)
                setName(other.name)
                setDraft([...other.cards])
              }}
            >
              Xóa bộ bài này
            </button>
          )}
        </aside>
      </div>
    </>
  )
}
