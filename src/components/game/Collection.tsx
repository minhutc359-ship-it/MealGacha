import { useMemo, useState } from "react"
import { CARDS, SCHOOLS, RARITIES, KEYWORDS } from "../../game/catalog"
import { useGameStore } from "../../game/useGameStore"
import type { GameCard, School, CardRarity } from "../../game/types"
import { GameCardView } from "./GameCardView"
import { Dialog } from "./Dialog"
import { CardShelf } from "./CardShelf"

export function Collection({ workshop = false }: { workshop?: boolean }) {
  const save = useGameStore((s) => s.save)
  const craft = useGameStore((s) => s.craft),
    salvage = useGameStore((s) => s.salvage),
    foil = useGameStore((s) => s.foil)
  const [query, setQuery] = useState(""),
    [school, setSchool] = useState("all"),
    [rarity, setRarity] = useState("all"),
    [kind, setKind] = useState("all"),
    [setName, setSetName] = useState("all")
  const [ownedOnly, setOwnedOnly] = useState(false),
    [selected, setSelected] = useState<GameCard | null>(null)
  const normalize = (s: string) =>
    s.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .toLowerCase()
  const cards = useMemo(
    () =>
      CARDS.filter(
        (c) =>
          (school === "all" || c.school === school) &&
          (rarity === "all" || c.rarity === rarity) &&
          (kind === "all" || c.kind === kind) &&
          (setName === "all" || c.set === setName) &&
          (!ownedOnly || save.cards[c.id]) &&
          normalize(`${c.name} ${c.text} ${c.set}`).includes(normalize(query)),
      ).sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name)),
    [query, school, rarity, kind, setName, ownedOnly, save.cards],
  )
  const owned = Object.values(save.cards).filter((n) => n > 0).length
  return (
    <section className="tcg-library-screen">
      <div className="tcg-section-heading">
        <div>
          <span className="tcg-kicker">
            {workshop
              ? "TỪ CÔNG THỨC ĐẾN HUYỀN THOẠI"
              : "MỖI LÁ BÀI, MỘT CÂU CHUYỆN"}
          </span>
          <h1>{workshop ? "Xưởng vị giác" : "Thư viện thẻ"}</h1>
          <p>
            {workshop
              ? "Chế tạo lá còn thiếu, phân rã thẻ dư và mở viền ánh kim."
              : `${owned}/${CARDS.length} hương vị đã được đánh thức. Khám phá kỹ năng và câu chuyện của từng lá.`}
          </p>
        </div>
        <div className="tcg-number-badge">
          {workshop ? save.dust : owned}
          <small>{workshop ? "TINH CHẤT" : "ĐÃ SỞ HỮU"}</small>
        </div>
      </div>
      {workshop && (
        <div className="tcg-info-strip">
          ✧ Thẻ thứ 3 tự chuyển thành tinh chất. Viền ánh kim chỉ thay đổi diện
          mạo, giữ nguyên sức mạnh.
        </div>
      )}
      <div className="tcg-library-controls">
        <label className="tcg-search">
          <span>⌕</span>
          <input
            aria-label="Tìm thẻ"
            placeholder="Tìm tên thẻ, kỹ năng…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <details className="tcg-advanced-filters">
          <summary>Bộ lọc</summary>
          <div className="tcg-filters">
            <select
              aria-label="Lọc theo hệ"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
            >
              <option value="all">Tất cả hệ</option>
              {Object.entries(SCHOOLS).map(([id, s]) => (
                <option value={id} key={id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Lọc độ hiếm"
              value={rarity}
              onChange={(e) => setRarity(e.target.value)}
            >
              <option value="all">Mọi độ hiếm</option>
              {Object.entries(RARITIES).map(([id, r]) => (
                <option value={id} key={id}>
                  {r.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Loại thẻ"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <option value="all">Mọi loại</option>
              <option value="unit">Đồng minh</option>
              <option value="spell">Bí thuật</option>
            </select>
            <select
              aria-label="Bộ thẻ"
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
            >
              <option value="all">Tất cả bộ thẻ</option>
              {[...new Set(CARDS.map((c) => c.set))].map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <label className="tcg-checkbox">
              <input
                type="checkbox"
                checked={ownedOnly}
                onChange={(e) => setOwnedOnly(e.target.checked)}
              />{" "}
              Đã có
            </label>
          </div>
        </details>
      </div>
      <p className="tcg-filter-count">
        {cards.length} thẻ · Nhấn vào một lá để xem chi tiết
        {workshop ? " và chế tạo" : ""}.
      </p>
      <CardShelf
        label={workshop ? "Thẻ chế tạo" : "Thư viện thẻ"}
        resetKey={[query, school, rarity, kind, setName, ownedOnly].join("|")}
        items={cards.map((c) => (
          <GameCardView
            key={c.id}
            card={c}
            foil={save.foils.includes(c.id)}
            count={save.cards[c.id] ?? 0}
            muted={!save.cards[c.id]}
            onClick={() => setSelected(c)}
          />
        ))}
      />
      {selected && (
        <Dialog title={selected.name} onClose={() => setSelected(null)} wide>
          <div className="tcg-card-detail">
            <GameCardView
              card={selected}
              foil={save.foils.includes(selected.id)}
            />
            <div>
              <span className="tcg-kicker">
                {selected.set} · {RARITIES[selected.rarity].name}
              </span>
              <h3>{SCHOOLS[selected.school].name}</h3>
              <p>{selected.text}</p>
              {selected.keywords.map((k) => (
                <p className="tcg-keyword" key={k}>
                  {KEYWORDS[k]}
                </p>
              ))}
              <blockquote>“{selected.lore}”</blockquote>
              <p>
                Sở hữu {save.cards[selected.id] ?? 0}/2 bản · Chế tạo{" "}
                {RARITIES[selected.rarity].dust} tinh chất
              </p>
              <div className="tcg-detail-actions">
                <button
                  className="tcg-button primary"
                  onClick={() => craft(selected.id)}
                  disabled={
                    (save.cards[selected.id] ?? 0) >= 2 ||
                    save.dust < RARITIES[selected.rarity].dust
                  }
                >
                  Chế tạo · {RARITIES[selected.rarity].dust} ✧
                </button>
                <button
                  className="tcg-button ghost"
                  onClick={() => salvage(selected.id)}
                  disabled={!save.cards[selected.id]}
                >
                  Phân rã · +{RARITIES[selected.rarity].salvage} ✧
                </button>
                <button
                  className="tcg-button ghost"
                  onClick={() => foil(selected.id)}
                  disabled={
                    !save.cards[selected.id] ||
                    save.foils.includes(selected.id) ||
                    save.dust < 60
                  }
                >
                  {save.foils.includes(selected.id)
                    ? "Đã có ánh kim ✓"
                    : "Mở ánh kim · 60 ✧"}
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </section>
  )
}
