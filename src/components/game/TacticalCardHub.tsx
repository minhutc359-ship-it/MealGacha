import { useMemo, useRef, useState } from "react"
import { RARITIES, SCHOOLS } from "../../game/catalog"
import type { Deck } from "../../game/types"
import {
  TACTICAL_CARDS,
  TACTICAL_CARD_MAP,
  TACTICAL_STARTER,
  ownedTacticalCards,
  tacticalDeckErrors,
  type TacticalCard,
} from "../../game/tacticalTcg/cards"
import {
  craftTacticalCard,
  openTacticalPack,
  saveTacticalDeck,
  withTacticalLock,
  TACTICAL_PACKS,
  TACTICAL_PACK_COST,
  newTacticalRequestId,
  type TacticalProgress,
} from "../../game/tacticalTcg/progression"
import { GameCardView } from "./GameCardView"
import { directedCardText } from "../../game/tacticalTcg/engine/directedRules"
import { Dialog } from "./Dialog"
import {
  TACTICAL_DECK_LIBRARY,
  deckRecipeMissing,
} from "../../game/tacticalTcg/deckLibrary"

interface HubProps {
  progress: TacticalProgress
  onProgress: (progress: TacticalProgress) => void
}
const normalize = (s: string) =>
  s.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
const kindLabel = (kind: TacticalCard["kind"]) =>
  ({ unit: "Vị Linh", spell: "Bí thuật", trap: "Bẫy Hương" })[kind]

function CardDetail({
  card,
  progress,
  onProgress,
  onClose,
}: HubProps & { card: TacticalCard; onClose: () => void }) {
  const [notice, setNotice] = useState("")
  const count = ownedTacticalCards(progress.cardCopies)[card.id] ?? 0
  const cost = RARITIES[card.rarity].dust
  return (
    <Dialog title={card.name} onClose={onClose} wide>
      <div className="tcg-card-detail tactical-card-detail">
        <GameCardView spiritArt card={card} count={count} />
        <div>
          <span className="tcg-kicker">
            {kindLabel(card.kind)} · {SCHOOLS[card.school].name} ·{" "}
            {RARITIES[card.rarity].name}
          </span>
          <h3>Khả năng trên bàn Linh Chiến</h3>
          <p>{directedCardText(card)}</p>
          <blockquote>“{card.lore}”</blockquote>
          <p>
            Sở hữu <b>{count}/2 bản</b> · dùng trong mọi bộ bài đã lưu.
          </p>
          <button
            className="tcg-button primary"
            disabled={count >= 2 || progress.tinhVi < cost}
            onClick={async () => {
              try {
                onProgress(
                  await withTacticalLock(() =>
                    craftTacticalCard(localStorage, card.id),
                  ),
                )
                setNotice("Đã chế tạo. Bạn có thể thêm thẻ vào bộ bài.")
              } catch (e) {
                setNotice((e as Error).message)
              }
            }}
          >
            {count >= 2 ? "Đã đủ 2 bản" : `Chế tạo chính xác · ${cost} Tinh Vị`}
          </button>
          {progress.tinhVi < cost && count < 2 && (
            <small>
              Chơi campaign, điểm danh hoặc đổi thẻ dư để nhận Tinh Vị.
            </small>
          )}
          {notice && <p role="status">{notice}</p>}
        </div>
      </div>
    </Dialog>
  )
}

export function TacticalCollection({ progress, onProgress }: HubProps) {
  const [query, setQuery] = useState(""),
    [school, setSchool] = useState("all"),
    [kind, setKind] = useState("all"),
    [rarity, setRarity] = useState("all"),
    [ownedOnly, setOwnedOnly] = useState(false),
    [page, setPage] = useState(0),
    [inspect, setInspect] = useState<TacticalCard | null>(null)
  const owned = ownedTacticalCards(progress.cardCopies)
  const cards = TACTICAL_CARDS.filter(
    (c) =>
      (school === "all" || c.school === school) &&
      (kind === "all" || c.kind === kind) &&
      (rarity === "all" || c.rarity === rarity) &&
      (!ownedOnly || owned[c.id] > 0) &&
      normalize(`${c.name} ${c.text}`).includes(normalize(query)),
  )
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(cards.length / 24) - 1),
  )
  return (
    <section className="tactical-hub">
      <header className="tactical-hub-heading">
        <div>
          <span className="tcg-kicker">THƯ VIỆN LINH VỊ</span>
          <h1>Bộ sưu tập</h1>
          <p>
            Khám phá từng lá, đọc kỹ năng và chế tạo chính xác thẻ còn thiếu.
          </p>
        </div>
        <strong>
          {Object.values(owned).filter((n) => n > 0).length}
          <small>/ {TACTICAL_CARDS.length} thẻ</small>
        </strong>
      </header>
      <div className="tactical-card-filters">
        <input
          aria-label="Tìm thẻ"
          placeholder="Tìm tên hoặc kỹ năng…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(0)
          }}
        />
        <select
          aria-label="Hệ thẻ"
          value={school}
          onChange={(e) => {
            setSchool(e.target.value)
            setPage(0)
          }}
        >
          <option value="all">Mọi hệ</option>
          {Object.entries(SCHOOLS).map(([id, s]) => (
            <option key={id} value={id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Loại thẻ"
          value={kind}
          onChange={(e) => {
            setKind(e.target.value)
            setPage(0)
          }}
        >
          <option value="all">Mọi loại</option>
          <option value="unit">Vị Linh</option>
          <option value="spell">Bí thuật</option>
          <option value="trap">Bẫy Hương</option>
        </select>
        <select
          aria-label="Độ hiếm"
          value={rarity}
          onChange={(e) => {
            setRarity(e.target.value)
            setPage(0)
          }}
        >
          <option value="all">Mọi độ hiếm</option>
          {Object.entries(RARITIES).map(([id, r]) => (
            <option key={id} value={id}>
              {r.name}
            </option>
          ))}
        </select>
        <label>
          <input
            type="checkbox"
            checked={ownedOnly}
            onChange={(e) => {
              setOwnedOnly(e.target.checked)
              setPage(0)
            }}
          />
          Đã sở hữu
        </label>
      </div>
      <p className="tactical-filter-status" role="status">
        {cards.length} kết quả · Chạm lá để đọc luật và chế tạo.
      </p>
      <div className="tactical-collection-grid">
        {cards.slice(currentPage * 24, (currentPage + 1) * 24).map((card) => (
          <GameCardView
            spiritArt
            key={card.id}
            card={card}
            count={owned[card.id] ?? 0}
            muted={!owned[card.id]}
            onClick={() => setInspect(card)}
          />
        ))}
      </div>
      {!cards.length && (
        <p className="tcg-empty">Chưa có thẻ phù hợp. Thử bỏ bớt bộ lọc.</p>
      )}
      <div className="tactical-pagination">
        <button
          disabled={currentPage === 0}
          onClick={() => setPage(currentPage - 1)}
        >
          ← Trước
        </button>
        <span>
          {currentPage + 1} / {Math.max(1, Math.ceil(cards.length / 24))}
        </span>
        <button
          disabled={(currentPage + 1) * 24 >= cards.length}
          onClick={() => setPage(currentPage + 1)}
        >
          Sau →
        </button>
      </div>
      {inspect && (
        <CardDetail
          card={inspect}
          progress={progress}
          onProgress={onProgress}
          onClose={() => setInspect(null)}
        />
      )}
    </section>
  )
}

export function TacticalDeckBuilder({ progress, onProgress }: HubProps) {
  const active =
    progress.decks.find((d) => d.id === progress.activeDeckId) ??
    progress.decks[0]
  const [draft, setDraft] = useState<Deck>(() => ({
      ...active,
      cards: [...active.cards],
    })),
    [query, setQuery] = useState(""),
    [kind, setKind] = useState("all"),
    [notice, setNotice] = useState(""),
    [inspect, setInspect] = useState<TacticalCard | null>(null)
  const owned = ownedTacticalCards(progress.cardCopies)
  const counts = Object.fromEntries(
    [...new Set(draft.cards)].map((id) => [
      id,
      draft.cards.filter((c) => c === id).length,
    ]),
  )
  const errors = tacticalDeckErrors(draft.cards, owned)
  const available = useMemo(
    () =>
      TACTICAL_CARDS.filter(
        (c) =>
          owned[c.id] > 0 &&
          (kind === "all" || c.kind === kind) &&
          normalize(c.name).includes(normalize(query)),
      ).sort((a, b) => a.cost - b.cost),
    [progress.cardCopies, query, kind],
  )
  const fill = () => {
    const cards = [...draft.cards].filter((id) => TACTICAL_CARD_MAP[id])
    const candidates = [
      ...TACTICAL_STARTER,
      ...Object.keys(owned).sort(
        (a, b) => TACTICAL_CARD_MAP[a].cost - TACTICAL_CARD_MAP[b].cost,
      ),
    ]
    for (const id of candidates) {
      while (
        cards.length < 24 &&
        cards.filter((c) => c === id).length < Math.min(2, owned[id] ?? 0)
      )
        cards.push(id)
      if (cards.length === 24) break
    }
    setDraft({ ...draft, cards })
  }
  return (
    <section className="tactical-hub">
      <header className="tactical-hub-heading">
        <div>
          <span className="tcg-kicker">XƯỞNG CHIẾN THUẬT</span>
          <h1>Bộ bài của bạn</h1>
          <p>
            24 lá · tối đa 2 bản mỗi thẻ · ít nhất 8 Vị Linh. Bộ đang trang bị
            sẽ được rút trong trận mới.
          </p>
        </div>
        <button
          className="tcg-button ghost"
          onClick={() => {
            setDraft({
              id: newTacticalRequestId(),
              name: "Bộ bài mới",
              cards: [],
            })
            setNotice("")
          }}
        >
          + Bộ mới
        </button>
      </header>
      <div className="tactical-deck-tabs">
        {progress.decks.map((deck) => (
          <button
            key={deck.id}
            className={draft.id === deck.id ? "is-active" : ""}
            onClick={() => {
              setDraft({ ...deck, cards: [...deck.cards] })
              setNotice("")
            }}
          >
            {deck.id === progress.activeDeckId ? "✦ " : ""}
            {deck.name}
          </button>
        ))}
      </div>
      <details className="tactical-deck-recipes">
        <summary>
          Công thức bộ bài · 3 bộ nhập môn và 5 hướng phát triển
        </summary>
        <div>
          {TACTICAL_DECK_LIBRARY.map((template) => {
            const missing = deckRecipeMissing(
              template.cards,
              progress.cardCopies,
            )
            return (
              <article key={template.id}>
                <small>{template.style}</small>
                <h2>{template.name}</h2>
                <p>{template.plan}</p>
                <p>
                  <b>Tay đầu:</b> {template.opening}
                </p>
                <p><b>Điểm yếu:</b> {template.weakness}</p>
                <span>
                  {missing.length
                    ? `Thiếu ${missing.reduce((n, m) => n + m.count, 0)} lá · chế tạo ${missing.reduce((n, m) => n + m.cost, 0)} Tinh Vị`
                    : "Đã đủ thẻ · có thể chơi ngay"}
                </span>
                <button
                  className="tcg-button ghost"
                  onClick={() => {
                    setDraft({
                      id: newTacticalRequestId(),
                      name: template.name,
                      cards: [...template.cards],
                    })
                    setNotice(
                      "Đã nạp công thức. Xem bộ bài rồi Lưu & trang bị; thẻ chưa sở hữu không thể vào trận.",
                    )
                  }}
                >
                  Nạp vào trình sửa bộ
                </button>
              </article>
            )
          })}
        </div>
      </details>
      <div className="tactical-deck-builder">
        <section>
          <div className="tactical-card-filters">
            <input
              aria-label="Tìm thẻ thêm vào bộ"
              placeholder="Tìm thẻ đã có…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              aria-label="Lọc loại trong bộ"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <option value="all">Mọi loại</option>
              <option value="unit">Vị Linh</option>
              <option value="spell">Bí thuật</option>
              <option value="trap">Bẫy</option>
            </select>
          </div>
          <div className="tactical-deck-pool">
            {available.map((card) => (
              <div key={card.id}>
                <GameCardView
                  spiritArt
                  card={card}
                  count={owned[card.id]}
                  selected={!!counts[card.id]}
                  disabled={
                    draft.cards.length >= 24 ||
                    (counts[card.id] ?? 0) >= owned[card.id]
                  }
                  onClick={() =>
                    setDraft({ ...draft, cards: [...draft.cards, card.id] })
                  }
                />
                <button
                  className="tactical-inspect-card"
                  aria-label={`Đọc ${card.name}`}
                  onClick={() => setInspect(card)}
                >
                  i
                </button>
                <small>Trong bộ {counts[card.id] ?? 0}/2</small>
              </div>
            ))}
          </div>
        </section>
        <aside className="tactical-deck-summary">
          <label>
            Tên bộ bài
            <input
              aria-label="Tên bộ bài"
              maxLength={40}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <strong>
            {draft.cards.length}
            <small>/24 lá</small>
          </strong>
          <p>
            {
              draft.cards.filter((id) => TACTICAL_CARD_MAP[id]?.kind === "unit")
                .length
            }{" "}
            Vị Linh ·{" "}
            {
              draft.cards.filter(
                (id) => TACTICAL_CARD_MAP[id]?.kind === "spell",
              ).length
            }{" "}
            Bí thuật ·{" "}
            {
              draft.cards.filter((id) => TACTICAL_CARD_MAP[id]?.kind === "trap")
                .length
            }{" "}
            Bẫy
          </p>
          <div
            className="tactical-mana-curve"
            aria-label="Đường cong năng lượng"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((cost) => {
              const count = draft.cards.filter(
                (id) => TACTICAL_CARD_MAP[id]?.cost === cost,
              ).length
              return (
                <div key={cost}>
                  <span>{count}</span>
                  <i style={{ height: `${Math.max(3, count * 6)}px` }} />
                  <small>{cost}</small>
                </div>
              )
            })}
          </div>
          <button
            className="tcg-button ghost"
            onClick={fill}
            disabled={draft.cards.length >= 24}
          >
            Tự bổ sung đủ bộ
          </button>
          <div className="tactical-deck-list">
            {Object.entries(counts).map(([id, count]) => (
              <button
                key={id}
                onClick={() => {
                  const cards = [...draft.cards]
                  cards.splice(cards.indexOf(id), 1)
                  setDraft({ ...draft, cards })
                }}
              >
                <b>{TACTICAL_CARD_MAP[id]?.cost ?? "?"}</b>
                <span>{TACTICAL_CARD_MAP[id]?.name ?? id}</span>
                <small>×{count}　−</small>
              </button>
            ))}
          </div>
          {errors.length > 0 && (
            <p className="tactical-form-error">{errors[0]}</p>
          )}
          <button
            className="tcg-button primary"
            disabled={!!errors.length}
            onClick={async () => {
              try {
                onProgress(
                  await withTacticalLock(() =>
                    saveTacticalDeck(localStorage, draft),
                  ),
                )
                setNotice("Đã lưu và trang bị. Trận mới sẽ sử dụng bộ bài này.")
              } catch (e) {
                setNotice((e as Error).message)
              }
            }}
          >
            Lưu & trang bị
          </button>
          {notice && <p role="status">{notice}</p>}
        </aside>
      </div>
      {inspect && (
        <CardDetail
          card={inspect}
          progress={progress}
          onProgress={onProgress}
          onClose={() => setInspect(null)}
        />
      )}
    </section>
  )
}

export function TacticalPacks({ progress, onProgress }: HubProps) {
  const [selected, setSelected] = useState("origin"),
    [revealed, setRevealed] = useState<Set<number>>(new Set()),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false)
  const receipt = progress.lastPack
  const processing = useRef(false)
  const open = async () => {
    if (processing.current) return
    processing.current = true
    setBusy(true)
    try {
      const requestId = newTacticalRequestId()
      const result = await withTacticalLock(() =>
        openTacticalPack(localStorage, selected, requestId),
      )
      onProgress(result.progress)
      setRevealed(new Set())
      setNotice("Đã mở gói. Chạm từng lá để lật; tất cả thẻ đã được lưu.")
    } catch (e) {
      setNotice((e as Error).message)
    } finally {
      processing.current = false
      setBusy(false)
    }
  }
  return (
    <section className="tactical-hub tactical-packs">
      <header className="tactical-hub-heading">
        <div>
          <span className="tcg-kicker">HIỆU SÁCH KÝ ỨC</span>
          <h1>Mở gói thẻ</h1>
          <p>
            Mỗi gói 5 lá. Thẻ mới vào bộ sưu tập; bản dư thứ 3 trở đi đổi thành
            Tinh Vị.
          </p>
        </div>
        <strong>
          {progress.packTickets}
          <small>vé đang có</small>
        </strong>
      </header>
      <div className="tactical-pack-layout">
        <div className="tactical-pack-display">
          <div
            className={`tactical-pack-object school-${selected}`}
            aria-hidden="true"
          >
            <small>SOUL OF MEAL</small>
            <span>{TACTICAL_PACKS.find((p) => p.id === selected)?.symbol}</span>
            <strong>
              {TACTICAL_PACKS.find((p) => p.id === selected)?.name}
            </strong>
            <small>5 KÝ ỨC · MỘT GIAO ƯỚC</small>
          </div>
        </div>
        <div className="tactical-pack-offer">
          <h2>Gọi lại một hương vị</h2>
          <p>Chọn toàn bộ pool hoặc một hệ để định hướng bộ bài.</p>
          <div className="tactical-pack-selector">
            {TACTICAL_PACKS.map((pack) => (
              <button
                key={pack.id}
                className={selected === pack.id ? "is-active" : ""}
                aria-pressed={selected === pack.id}
                onClick={() => setSelected(pack.id)}
              >
                <b>{pack.symbol}</b>
                <span>
                  {pack.name}
                  <small>{pack.description}</small>
                </span>
              </button>
            ))}
          </div>
          <button
            className="tcg-button primary"
            disabled={
              busy ||
              (!progress.packTickets && progress.tinhVi < TACTICAL_PACK_COST)
            }
            onClick={open}
          >
            Mở 5 lá · {progress.packTickets ? "1 vé" : "80 Tinh Vị"}
          </button>
          <p className="tactical-pack-pity">
            Bảo đảm Sử thi: {progress.packPity}/8 gói · Gói thứ 8 có ít nhất một
            Sử thi hoặc Huyền thoại.
          </p>
        </div>
      </div>
      <details className="tactical-pack-odds">
        <summary>Tỷ lệ, bảo đảm và giá trị bản dư</summary>
        <p>
          Mỗi lượt rút cơ bản: Thường 63% · Hiếm 25% · Sử thi 10% · Huyền thoại
          2%. Lá thứ 5 nâng lên Hiếm nếu bốn lá đầu đều Thường; bảo đảm Sử thi
          áp dụng ở gói thứ 8 chưa có Sử thi/Huyền thoại.
        </p>
        <p>
          Bản dư: Thường +5 · Hiếm +15 · Sử thi +40 · Huyền thoại +100 Tinh Vị.
          Gói theo hệ chỉ rút các lá của hệ đó; tỷ lệ bậc hiếm như nhau. Không
          có mua bằng tiền thật.
        </p>
      </details>
      {notice && (
        <p className="tactical-notice" role="status">
          {notice}
        </p>
      )}
      {receipt && (
        <section className="tactical-pack-reveal" aria-label="Kết quả mở gói">
          <header>
            <div>
              <small>KÝ ỨC VỪA MỞ</small>
              <h2>Năm lá, năm khả năng mới</h2>
            </div>
            <button
              className="tcg-button ghost"
              onClick={() => setRevealed(new Set([0, 1, 2, 3, 4]))}
            >
              Lật tất cả
            </button>
          </header>
          <div>
            {receipt.cards.map((id, index) => (
              <article key={`${receipt.id}:${index}`}>
                {revealed.has(index) ? (
                  <>
                    <GameCardView spiritArt card={TACTICAL_CARD_MAP[id]} />
                    {receipt.newCardIds.includes(id) && (
                      <b className="tactical-new-card">MỚI</b>
                    )}
                  </>
                ) : (
                  <button
                    className="tactical-card-back"
                    onClick={() => setRevealed(new Set([...revealed, index]))}
                    aria-label={`Lật thẻ ${index + 1}`}
                  >
                    <small>SOUL OF MEAL</small>
                    <span>契</span>
                    <b>CHẠM ĐỂ ĐÁNH THỨC</b>
                  </button>
                )}
              </article>
            ))}
          </div>
          <p>
            Đã lưu {receipt.cards.length} lá ·{" "}
            {receipt.duplicateTinhVi > 0
              ? `+${receipt.duplicateTinhVi} Tinh Vị từ bản dư`
              : "Không mất thẻ khi tải lại trang"}
          </p>
        </section>
      )}
    </section>
  )
}
