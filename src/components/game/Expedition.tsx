import { useEffect, useState } from "react"
import { CARD_MAP, SCHOOLS } from "../../game/catalog"
import {
  activeRun,
  eventChoices,
  EXPEDITION_EVENTS,
  expeditionRewardAvailable,
  NODE_KIND,
  RELICS,
  RELIC_MAP,
  runNode,
} from "../../game/expedition"
import { useGameStore } from "../../game/useGameStore"
import type { BattleRecord } from "../../game/types"
import { GameCardView } from "./GameCardView"
import { Dialog } from "./Dialog"

export function Expedition() {
  const save = useGameStore((s) => s.save)
  const [promise,setPromise]=useState<"safe"|"bold">(save.story400?.decisions?.["rain-harbor"] === "short" ? "bold" : "safe")
  const run = save.expedition
  const store = useGameStore.getState()
  const [confirm, setConfirm] = useState(false)
  const [guide, setGuide] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [journalOpen, setJournalOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [removeIndex, setRemoveIndex] = useState(0)
  const [record, setRecord] = useState<BattleRecord | null>(null)
  useEffect(() => {
    setSelectedCard(null)
    setRemoveIndex(0)
  }, [run?.id, run?.floor])
  const node = run ? runNode(run) : undefined
  const event = EXPEDITION_EVENTS.find((e) => e.id === node?.eventId)
  const active = activeRun(run)
  const deck = save.decks.find((d) => d.id === save.activeDeckId)
  const available = expeditionRewardAvailable(save)
  const routeMap = (full: boolean) => (
    <div className="tcg-route-map">
      {run?.nodes.map((row, floor) =>
        full || floor === run.floor ? (
          <div
            className={`tcg-route-row ${floor === run.floor ? "current" : ""}`}
            key={floor}
          >
            <div className="tcg-route-number">
              <span>{String(floor + 1).padStart(2, "0")}</span>
            </div>
            <div className="tcg-route-branches">
              {row.map((n) => (
                <button
                  key={n.id}
                  className={`tcg-route-node ${
                    run.route.includes(n.id) ? "visited" : ""
                  } ${n.kind === "elite" || n.kind === "boss" ? "danger" : ""}`}
                  disabled={run.status !== "path" || floor !== run.floor}
                  onClick={() => {
                    setMapOpen(false)
                    store.enterExpedition(n.id)
                  }}
                  aria-label={`Chặng ${floor + 1}: ${NODE_KIND[n.kind].name}, ${n.title}`}
                >
                  <span className="tcg-route-symbol">
                    {run.route.includes(n.id) ? "✓" : NODE_KIND[n.kind].symbol}
                  </span>
                  <span>
                    <small>
                      {NODE_KIND[n.kind].name} · {SCHOOLS[n.school].name}
                    </small>
                    <strong>{n.title}</strong>
                    <p>{NODE_KIND[n.kind].detail}</p>
                  </span>
                  <b>{floor > run.floor ? "◇" : "→"}</b>
                </button>
              ))}
            </div>
          </div>
        ) : null,
      )}
    </div>
  )
  return (
    <section className="tcg-expedition">
      <div className="tcg-section-heading">
        <div>
          <span className="tcg-kicker">CHUYỆN BÊN NGOÀI NĂM NGỌN LỬA</span>
          <h1>Con đường qua sương</h1>
          <p>Một bộ bài. Bảy chặng đường. Mỗi lựa chọn để lại một hương vị.</p>
        </div>
        <div className="tcg-expedition-tools">
          {run && active && (
            <button
              className="tcg-button ghost"
              onClick={() => setMapOpen(true)}
            >
              Bản đồ · {run.floor + 1}/7
            </button>
          )}
          <button
            className="tcg-button ghost"
            onClick={() => setJournalOpen(true)}
          >
            Hành trang & nhật ký
          </button>
          <button className="tcg-button ghost" onClick={() => setGuide(true)}>
            Luật & di vật
          </button>
        </div>
      </div>
      {!active && <fieldset className="tcg-panel"><legend>Lời hẹn cho chuyến mới</legend><label><input type="radio" name="promise" checked={promise==="safe"} onChange={()=>setPromise("safe")}/> Đường an toàn · hồi 2 ý chí khi vào trận, giữ thưởng cơ bản</label><label><input type="radio" name="promise" checked={promise==="bold"} onChange={()=>setPromise("bold")}/> Đường thử thách · địch thêm 12% ý chí, thắng nhận thêm 8 tiếp tế</label><p>Lựa chọn chỉ áp dụng khi bắt đầu chuyến mới; không đổi bộ sưu tập.</p></fieldset>}
      {active && run?.promise && <p>Lời hẹn: {run.promise === "safe" ? "Đường an toàn" : "Đường thử thách"}</p>}
      {!active && !run && (
        <section className="tcg-expedition-intro">
          <img src="/assets/events/cooling-summer/banner-vietnam.webp" alt="" />
          <div>
            <span className="tcg-kicker">
              THÁM HIỂM · CHƠI LẠI VỚI ĐƯỜNG ĐI MỚI
            </span>
            <h2>
              Đi để nhớ.
              <br />
              Trở về để kể.
            </h2>
            <p>
              Sau những ngọn đèn cuối phố, vẫn còn những người chưa tìm được
              đường về bàn ăn. Mang theo chiếc muôi của bà, đổi công thức với lữ
              khách và đối mặt Kẻ Nuốt Ký Ức.
            </p>
            <button
              className="tcg-button gold"
              onClick={() => store.beginExpedition(promise)}
            >
              Bắt đầu thám hiểm →
            </button>
            <small>
              Bộ bài: {deck?.name} · 34 máu · 40 lương thực · Miễn phí
            </small>
          </div>
        </section>
      )}
      {run && !active && (
        <section className="tcg-panel tcg-expedition-ending">
          <span className="tcg-kicker">
            {run.status === "won"
              ? "ÁNH ĐÈN Ở CUỐI ĐƯỜNG"
              : "ĐƯỜNG VỀ PHỐ ĐÈN LỒNG"}
          </span>
          <h2>
            {run.status === "won"
              ? "Không ký ức nào bị bỏ lại"
              : run.status === "lost"
                ? "Ngọn lửa cần được nhen lại"
                : "Hẹn một chuyến đi khác"}
          </h2>
          <p>
            {run.status === "won"
              ? "Kẻ Nuốt Ký Ức đặt xuống chiếc bát trống. Nó không đói hương vị; nó chỉ quên mất lần cuối có người chờ mình. Bạn kéo thêm một chiếc ghế vào bàn ăn. Sương tan từ bên trong."
              : "Những di vật trở về với đường xa. Bộ sưu tập và bộ bài chính vẫn ở đây, chờ bạn thử một công thức khác."}
          </p>
          <button
            className="tcg-button primary"
            onClick={() => store.beginExpedition(promise)}
          >
            Bắt đầu chuyến mới →
          </button>
          <div className="tcg-reward-row">
            <span>{run.route.length}/7 chặng</span>
            <span>{run.wins} trận thắng</span>
            <span>{run.relics.length} di vật</span>
          </div>
        </section>
      )}
      {run && active && (
        <>
          <section className="tcg-run-dashboard tcg-panel">
            <div>
              <span className="tcg-kicker">
                HÀNH TRANG · CHẶNG {run.floor + 1}/7
              </span>
              <h2>Người giữ vị</h2>
            </div>
            <div className="tcg-run-health">
              <strong>
                ♥ {run.health}
                <small>/{run.maxHealth}</small>
              </strong>
              <div className="tcg-progress">
                <i
                  style={{ width: `${(run.health / run.maxHealth) * 100}%` }}
                />
              </div>
            </div>
            <span>◉ {run.supplies} lương thực</span>
            <button
              className="tcg-button ghost"
              onClick={() => setConfirm(true)}
            >
              Kết thúc chuyến đi
            </button>
            <div className="tcg-run-relics">
              {run.relics.length ? (
                run.relics.map((id) => (
                  <span key={id} title={RELIC_MAP[id].text}>
                    {RELIC_MAP[id].symbol} {RELIC_MAP[id].name}
                  </span>
                ))
              ) : (
                <small>
                  Chưa có di vật. Tinh anh và các cuộc gặp gỡ có thể mang lại đồ
                  nghề mới.
                </small>
              )}
            </div>
          </section>
          {run.status === "event" && (
            <section
              className="tcg-run-event tcg-panel"
              aria-label="Sự kiện hành trình"
            >
              <span className="tcg-kicker">
                {node?.kind === "camp" ? "MỘT KHOẢNG NGHỈ" : event?.speaker}
              </span>
              <h2>{node?.title}</h2>
              <p className="tcg-dialogue">
                {node?.kind === "camp"
                  ? "Bếp lửa dưới tán cây còn đủ ấm cho một nồi cơm. Ngoài màn sương, bạn nghe tiếng người gọi nhau về ăn tối. Nghỉ ngơi hay sửa lại đồ nghề trước chặng tiếp theo?"
                  : event?.story}
              </p>
              <div className="tcg-run-choices">
                {eventChoices(run).map((c) => {
                  const disabled =
                    run.supplies < (c.cost ?? 0) ||
                    run.health <= (c.damage ?? 0)
                  return (
                    <button
                      key={c.id}
                      className="tcg-run-choice"
                      disabled={disabled}
                      onClick={() => store.chooseEvent(c.id)}
                    >
                      <strong>{c.label}</strong>
                      <span>{c.detail}</span>
                      {disabled && (
                        <small>Chưa đủ lương thực hoặc máu để chọn.</small>
                      )}
                    </button>
                  )
                })}
              </div>
              {node?.kind === "event" && (
                <button
                  className="tcg-button ghost tcg-event-skip"
                  onClick={() => store.chooseEvent("continue")}
                >
                  Giữ hành trang và đi tiếp →
                </button>
              )}
            </section>
          )}
          {run.status === "reward" && run.reward && (
            <section
              className="tcg-panel tcg-run-reward"
              aria-label="Phần thưởng hành trình"
            >
              <span className="tcg-kicker">CÔNG THỨC MỚI CHO ĐƯỜNG XA</span>
              <h2>Nêm lại hành trang</h2>
              <p>
                {run.reward.relicPicked
                  ? "Bước 2/2 · Thay một lá hoặc giữ bộ bài hiện tại."
                  : "Bước 1/2 · Chọn di vật, sau đó chọn thẻ."}{" "}
                Chỉ dùng cho chuyến đi này.
              </p>
              {!run.reward.relicPicked && (
                <>
                  <h3>Chọn một di vật</h3>
                  <div className="tcg-relic-grid">
                    {run.reward.relics.map((id) => (
                      <button
                        className="tcg-relic-offer"
                        key={id}
                        onClick={() => store.chooseRelic(id)}
                      >
                        <span>{RELIC_MAP[id].symbol}</span>
                        <strong>{RELIC_MAP[id].name}</strong>
                        <p>{RELIC_MAP[id].text}</p>
                      </button>
                    ))}
                  </div>
                  <button
                    className="tcg-button ghost"
                    onClick={() => store.chooseRelic(null)}
                  >
                    Bỏ qua di vật
                  </button>
                </>
              )}
              {run.reward.relicPicked && !run.reward.cardPicked && (
                <>
                  <h3>Chọn một thẻ để thay vào bộ bài 18 lá</h3>
                  {!selectedCard && (
                    <div className="tcg-run-card-offers">
                      {run.reward.cards.map((id) => (
                        <GameCardView
                          key={id}
                          card={CARD_MAP[id]}
                          compact
                          onClick={() => setSelectedCard(id)}
                          selected={selectedCard === id}
                        />
                      ))}
                    </div>
                  )}
                  {selectedCard && (
                    <div className="tcg-run-replace">
                      <button
                        className="tcg-button ghost"
                        onClick={() => setSelectedCard(null)}
                      >
                        ← Chọn thẻ khác
                      </button>
                      <img
                        className="tcg-run-replace-art"
                        src={CARD_MAP[selectedCard].art}
                        alt=""
                      />
                      <p className="tcg-run-card-description">
                        <strong>{CARD_MAP[selectedCard].name}</strong>
                        <span>{CARD_MAP[selectedCard].text}</span>
                        <em>{CARD_MAP[selectedCard].lore}</em>
                      </p>
                      <label htmlFor="run-replace">
                        Thay lá nào trong bộ bài hành trình?
                      </label>
                      <select
                        id="run-replace"
                        value={removeIndex}
                        onChange={(e) => setRemoveIndex(Number(e.target.value))}
                      >
                        {run.deck.map((id, index) => (
                          <option key={index} value={index}>
                            {CARD_MAP[id].name} · {CARD_MAP[id].cost} năng lượng
                          </option>
                        ))}
                      </select>
                      <button
                        className="tcg-button primary"
                        disabled={
                          run.deck.filter(
                            (id, i) => id === selectedCard && i !== removeIndex,
                          ).length >= 2
                        }
                        onClick={() => {
                          store.chooseRunCard(selectedCard, removeIndex)
                          setSelectedCard(null)
                        }}
                      >
                        Thay bằng {CARD_MAP[selectedCard].name}
                      </button>
                      {run.deck.filter(
                        (id, i) => id === selectedCard && i !== removeIndex,
                      ).length >= 2 && (
                        <small>
                          Tối đa 2 bản mỗi thẻ. Hãy thay một bản trùng hoặc chọn
                          thẻ khác.
                        </small>
                      )}
                    </div>
                  )}
                  <button
                    className="tcg-button ghost"
                    onClick={() => store.chooseRunCard(null)}
                  >
                    Giữ bộ bài hiện tại
                  </button>
                </>
              )}
            </section>
          )}
          {run.status === "path" && (
            <div className="tcg-mini-heading">
              <h2>Chọn điểm dừng tiếp theo</h2>
              <span>
                {run.status === "path"
                  ? "Chọn một điểm dừng sáng đèn"
                  : "Hoàn thành điểm dừng hiện tại"}
              </span>
            </div>
          )}
          {run.status === "path" && routeMap(false)}
        </>
      )}
      {mapOpen && run && (
        <Dialog
          title="Bảy chặng qua sương"
          onClose={() => setMapOpen(false)}
          wide
        >
          {routeMap(true)}
        </Dialog>
      )}
      {journalOpen && (
        <Dialog
          title="Hành trang & nhật ký"
          onClose={() => setJournalOpen(false)}
          wide
        >
          <div className="tcg-expedition-stats">
            <span>
              <b>{save.expeditionStats.runs}</b> chuyến đã bắt đầu
            </span>
            <span>
              <b>{save.expeditionStats.wins}</b> chuyến hoàn thành
            </span>
            <span>
              <b>{save.expeditionStats.best}/7</b> chặng xa nhất
            </span>
            <span>
              <b>
                {Math.max(
                  0,
                  3 -
                    save.claimedDailyQuests.filter((id) =>
                      id.startsWith("expedition:reward:"),
                    ).length,
                )}
                /3
              </b>{" "}
              lượt thưởng còn hôm nay
            </span>
          </div>
          <p className="tcg-expedition-reward-note">
            Hoàn thành: 200 xu · 40 tinh chất · 100 XP · 1 vé gói. Nhận thưởng
            tối đa 3 chuyến mỗi ngày.
            {!available && " Bạn vẫn có thể chơi tiếp để thử chiến thuật."}
          </p>
          {run && active && (
            <>
              <details className="tcg-panel tcg-run-deck">
                <summary>Bộ bài hành trình · 18 lá</summary>
                <div>
                  {Object.entries(
                    run.deck.reduce<Record<string, number>>(
                      (counts, id) => ({
                        ...counts,
                        [id]: (counts[id] ?? 0) + 1,
                      }),
                      {},
                    ),
                  )
                    .sort(([a], [b]) => CARD_MAP[a].cost - CARD_MAP[b].cost)
                    .map(([id, count]) => (
                      <span key={id}>
                        <b>{CARD_MAP[id].cost}</b>
                        {CARD_MAP[id].name}
                        <small>×{count}</small>
                      </span>
                    ))}
                </div>
              </details>
              <details className="tcg-panel tcg-run-log">
                <summary>Nhật ký chuyến đi</summary>
                <ol>
                  {run.log.map((line, index) => (
                    <li key={index}>{line}</li>
                  ))}
                </ol>
              </details>
            </>
          )}
          <details className="tcg-panel tcg-history">
            <summary>
              Nhật ký chiến đấu · {save.history.length} trận gần nhất
            </summary>
            {save.history.length ? (
              <div className="tcg-history-list">
                {save.history.map((item) => (
                  <button key={item.id} onClick={() => setRecord(item)}>
                    <span className={item.result}>
                      {item.result === "win" ? "✦" : "☽"}
                    </span>
                    <div>
                      <strong>{item.opponent}</strong>
                      <small>
                        {item.mode === "expedition"
                          ? "Thám hiểm"
                          : item.mode === "story"
                            ? "Cốt truyện"
                            : "Luyện tập"}{" "}
                        · {item.rounds} lượt ·{" "}
                        {new Date(item.date).toLocaleDateString("vi-VN")}
                      </small>
                    </div>
                    <b>{item.result === "win" ? "Thắng" : "Thua"}</b>
                  </button>
                ))}
              </div>
            ) : (
              <p>Trận đấu hoàn thành sẽ được ghi lại tại đây.</p>
            )}
          </details>
        </Dialog>
      )}
      {record && (
        <Dialog
          title={`Nhật ký · ${record.opponent}`}
          onClose={() => setRecord(null)}
        >
          <p>
            {record.result === "win" ? "Chiến thắng" : "Thất bại"} sau{" "}
            {record.rounds} lượt ·{" "}
            {new Date(record.date).toLocaleString("vi-VN")}
          </p>
          <div className="tcg-reward-row">
            <span>+{record.loot.coins} xu</span>
            <span>+{record.loot.xp} XP</span>
            <span>+{record.loot.dust ?? 0} tinh chất</span>
            <span>+{record.loot.tickets} vé</span>
          </div>
          {record.loot.cardId && (
            <GameCardView card={CARD_MAP[record.loot.cardId]} compact />
          )}
        </Dialog>
      )}
      {confirm && (
        <Dialog
          title="Kết thúc chuyến thám hiểm?"
          onClose={() => setConfirm(false)}
        >
          <p>
            Bộ bài hành trình, lương thực và di vật sẽ kết thúc cùng chuyến đi.
            Chỉ chuyến hoàn thành trùm cuối mới có thưởng.
          </p>
          <div className="tcg-dialog-actions">
            <button
              className="tcg-button ghost"
              onClick={() => setConfirm(false)}
            >
              Tiếp tục hành trình
            </button>
            <button
              className="tcg-button primary"
              onClick={() => {
                store.abandonExpedition()
                setConfirm(false)
              }}
            >
              Trở về phố
            </button>
          </div>
        </Dialog>
      )}
      {guide && (
        <Dialog
          title="Hành trang của người giữ vị"
          onClose={() => setGuide(false)}
          wide
        >
          <p>
            Miễn phí bắt đầu với bản sao bộ bài đang trang bị. Máu được giữ giữa
            các trận; năng lượng và tay bài được tạo lại. Thua hoặc đầu hàng kết
            thúc chuyến đi. Thắng trận sẽ cho lương thực và thẻ tạm thời. Chọn
            thẻ mới phải thay một lá, bộ bài luôn có 18 lá và tối đa 2 bản mỗi
            thẻ. Di vật chỉ có hiệu lực trong chuyến đi.
          </p>
          <h3>10 di vật</h3>
          <div className="tcg-relic-grid">
            {RELICS.map((r) => (
              <div className="tcg-relic-offer" key={r.id}>
                <span>{r.symbol}</span>
                <strong>{r.name}</strong>
                <p>{r.text}</p>
              </div>
            ))}
          </div>
          <p>
            Trận tinh anh và trùm cuối: mọi đồng minh địch được +1 công khi vào
            sân. Lương thực dùng trong hành trình, không trừ xu của tài khoản.
            Nhận thưởng hoàn thành tối đa 3 lần mỗi ngày.
          </p>
        </Dialog>
      )}
    </section>
  )
}
