import { CARD_MAP, RARITIES } from "../../game/catalog"
import { dailyTrades, rotateDay, tradeError } from "../../game/progression"
import { useGameStore } from "../../game/useGameStore"

export function Trader() {
  const raw = useGameStore((s) => s.save),
    trade = useGameStore((s) => s.trade),
    save = rotateDay(raw)
  return (
    <section className="tcg-trader">
      <div className="tcg-mini-heading">
        <div>
          <span className="tcg-kicker">THƯƠNG NHÂN KÝ ỨC · {save.day}</span>
          <h2>Đổi thẻ với Lữ khách</h2>
        </div>
        <span>Ba giao dịch mới mỗi ngày</span>
      </div>
      <p>
        Lữ khách đổi một bản thẻ dư lấy công thức hiếm hơn. Luôn giữ lại ít nhất
        một bản và đủ thẻ cho mọi bộ bài đã lưu.
      </p>
      <div className="tcg-trade-grid">
        {dailyTrades(save.day).map((offer) => {
          const error = tradeError(save, offer),
            done = save.claimedDailyQuests.includes(`trade:${offer.id}`)
          return (
            <article className="tcg-panel" key={offer.id}>
              <small>BẠN ĐƯA</small>
              <strong>{CARD_MAP[offer.inputId].name} ×1</strong>
              <span>
                {offer.coins ? `${offer.coins} xu` : `${offer.dust} tinh chất`}
              </span>
              <div className="tcg-trade-arrow">↓</div>
              <small>
                BẠN NHẬN · {RARITIES[CARD_MAP[offer.outputId].rarity].name}
              </small>
              <strong>{CARD_MAP[offer.outputId].name} ×1</strong>
              <button
                className="tcg-button primary"
                disabled={!!error}
                title={error ?? "Đổi một bản thẻ dư"}
                onClick={() => trade(offer.id)}
              >
                {done ? "Đã đổi hôm nay ✓" : "Trao đổi thẻ"}
              </button>
              {error && !done && <p>{error}</p>}
            </article>
          )
        })}
      </div>
    </section>
  )
}
