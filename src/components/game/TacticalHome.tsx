import {
  DUEL_CARDS as TACTICAL_CARDS,
  DUEL_CARD_MAP as TACTICAL_CARD_MAP,
} from "../../game/tacticalTcg/duelCards"
import { Link } from "react-router-dom"
import { ownedTacticalCards } from "../../game/tacticalTcg/cards"
import { TACTICAL_CAMPAIGN_NODES } from "../../game/tacticalTcg/campaign"
import { TACTICAL_SCENES } from "../../game/tacticalTcg/campaign/story"
import {
  tacticalDailyDate,
  type TacticalProgress,
} from "../../game/tacticalTcg/progression"
import { GameCardView } from "./GameCardView"

export function TacticalHome({
  progress,
  go,
  onDaily,
  onResume,
}: {
  progress: TacticalProgress
  go: (tab: string) => void
  onDaily: () => void
  onResume?: () => void
}) {
  const active =
    progress.decks.find((d) => d.id === progress.activeDeckId) ??
    progress.decks[0]
  const saved = progress.checkpoint
  const savedNode = TACTICAL_CAMPAIGN_NODES.find((n) => n.id === saved?.nodeId)
  const dailyClaimed = progress.dailyClaimedDate === tacticalDailyDate()
  const next =
    TACTICAL_CAMPAIGN_NODES.find(
      (n) => !progress.completedCampaignNodes.includes(n.id),
    ) ?? TACTICAL_CAMPAIGN_NODES[7]
  const scene = TACTICAL_SCENES[next.id]
  const owned = ownedTacticalCards(progress.cardCopies)
  return (
    <section className="tactical-home">
      <header className="tactical-home-hero">
        <img
          src="/assets/tcg/story/lantern.webp"
          alt="Làng Giao Ước dưới ánh đèn"
        />
        <div>
          <small>SOUL OF MEAL · LINH CHIẾN VỊ GIÁC</small>
          <h1>
            Mỗi lá bài,
            <br />
            <em>một lời hẹn.</em>
          </h1>
          <p>
            Sương Nhạt đang xóa tên người trong từng công thức. Xây bộ bài của
            riêng bạn, gọi các Vị Linh và giữ những ký ức bên bàn ăn.
          </p>
          <div>
            <button
              className="tcg-button primary"
              onClick={() => go("campaign")}
            >
              Tiếp tục hành trình →
            </button>
            <button className="tcg-button ghost" onClick={() => go("guide")}>
              Học cách chơi
            </button>
          </div>
          <span>
            TCG 24 lá · Hộ vệ · Bí thuật · Bẫy úp · 24 chặng hành trình
          </span>
        </div>
        <div className="tactical-home-featured" aria-hidden="true">
          {["chef-nhien", "chef-hai"].map((id) => (
            <GameCardView spiritArt key={id} card={TACTICAL_CARD_MAP[id]} />
          ))}
        </div>
      </header>
      {saved && onResume && (
        <section className="tactical-resume-banner" aria-label="Trận đã lưu">
          <span aria-hidden="true">↻</span>
          <div>
            <small>
              {saved.phase === "result"
                ? "KẾT QUẢ ĐANG LƯU"
                : "HẸN GẶP LẠI BÊN BÀN"}
            </small>
            <h2>{savedNode?.title ?? "Trận luyện tập của bạn"}</h2>
            <p>
              Vòng {saved.round} ·{" "}
              {saved.cardGame?.sides.player.hand.length ?? 0} lá trên tay ·{" "}
              {saved.cardGame?.sides.player.mana ?? 0} Lửa Bếp. Bài và đội hình
              được giữ nguyên.
            </p>
          </div>
          <button className="tcg-button primary" onClick={onResume}>
            {saved.phase === "result"
              ? "Xem kết quả đã lưu"
              : "Tiếp tục trận đang chơi"}{" "}
            →
          </button>
        </section>
      )}
      <div className="tactical-home-stats">
        <button onClick={() => go("collection")}>
          <strong>
            {Object.keys(owned).filter((id) => owned[id] > 0).length}
            <small>/{TACTICAL_CARDS.length}</small>
          </strong>
          <span>Thẻ đã sở hữu</span>
        </button>
        <button onClick={() => go("decks")}>
          <strong>{progress.decks.length}</strong>
          <span>Bộ bài đã lưu</span>
        </button>
        <button onClick={() => go("campaign")}>
          <strong>
            {progress.completedCampaignNodes.length}
            <small>/{TACTICAL_CAMPAIGN_NODES.length}</small>
          </strong>
          <span>Nút cốt truyện</span>
        </button>
        <button onClick={() => go("packs")}>
          <strong>{progress.packTickets}</strong>
          <span>Vé mở gói thẻ</span>
        </button>
      </div>
      <div className="tactical-home-columns">
        <section className="tactical-active-deck">
          <header>
            <div>
              <small>ĐANG TRANG BỊ</small>
              <h2>{active?.name ?? "Chưa trang bị bộ bài"}</h2>
            </div>
            <button onClick={() => go("decks")}>Sửa bộ bài ↗</button>
          </header>
          <div>
            {[...new Set(active?.cards ?? [])]
              .filter((id) => TACTICAL_CARD_MAP[id])
              .slice(0, 5)
              .map((id) => (
                <GameCardView
                  spiritArt
                  key={id}
                  card={TACTICAL_CARD_MAP[id]}
                  compact
                />
              ))}
          </div>
          <footer>
            <span>
              {active?.cards.length ?? 0}/24 lá · thẻ bạn sở hữu · tay đầu 4 lá
            </span>
            <button className="tcg-button primary" onClick={() => go("battle")}>
              Luyện tập với bộ này
            </button>
          </footer>
        </section>
        <aside className="tactical-next-scene">
          <img src={`/assets/tcg/story/${scene.art}.webp`} alt="" />
          <div>
            <small>CHẶNG TIẾP THEO · HỒI {next.act}</small>
            <h2>{next.title}</h2>
            <p>{scene.objective}</p>
            <button className="tcg-button ghost" onClick={() => go("campaign")}>
              Mở truyện & thử thách →
            </button>
          </div>
        </aside>
      </div>
      <div className="tactical-daily-strip">
        <span aria-hidden="true">✧</span>
        <div>
          <strong>Một cuộc hẹn mỗi ngày</strong>
          <p>
            Điểm danh nhận 1 vé mở thẻ và 30 Tinh Vị. Chiến thắng campaign để
            nhận thêm thẻ, vé và mở Manga.
          </p>
        </div>
        <button
          className="tcg-button primary"
          onClick={onDaily}
          disabled={dailyClaimed}
        >
          {dailyClaimed ? "Đã nhận hôm nay ✓" : "Nhận quà hôm nay"}
        </button>
        <Link to="/chest">Rương món ăn ↗</Link>
      </div>
      <ol className="tactical-core-loop">
        <li>
          <b>01</b>
          <strong>Thu thập</strong>
          <p>Mở gói, nhận thẻ campaign hoặc craft thẻ còn thiếu.</p>
        </li>
        <li>
          <b>02</b>
          <strong>Xây bộ bài</strong>
          <p>24 lá phối hợp Vị Linh, Bí thuật và Bẫy Hương.</p>
        </li>
        <li>
          <b>03</b>
          <strong>Đánh thức ký ức</strong>
          <p>Dùng Lửa Bếp, chọn mục tiêu, thắng trận và mở câu chuyện.</p>
        </li>
      </ol>
    </section>
  )
}

export function TacticalGuide({ onPlay }: { onPlay: () => void }) {
  return (
    <section className="tactical-hub tactical-guide">
      <header className="tactical-hub-heading">
        <div>
          <span className="tcg-kicker">CẨM NANG NGƯỜI GIỮ VỊ</span>
          <h1>Đây là một game thẻ bài</h1>
          <p>
            Bạn tự xây bộ, rút và dùng thẻ. Các Vị Linh tự giao chiến sau khi
            bạn khóa đội hình.
          </p>
        </div>
      </header>
      <div className="tactical-guide-grid">
        {[
          [
            "01",
            "Chuẩn bị 24 lá",
            "Bộ bài có đúng 24 lá, tối đa 2 bản mỗi lá đã sở hữu và ít nhất 8 Vị Linh. Sửa bộ tại tab Bộ bài rồi Lưu & trang bị.",
          ],
          [
            "02",
            "Bốn lá đầu, ba Lửa Bếp",
            "Trận mở với 4 lá, 3 Lửa Bếp và sân trống. Được đổi tay đầu một lần trước khi triệu hồi. Mỗi vòng mới rút 1 lá, hồi đầy Lửa và tăng giới hạn 1 (tối đa 10).",
          ],
          [
            "03",
            "Triệu hồi và dùng Bí thuật",
            "Chọn lá trên tay, đọc kỹ năng, rồi chọn ô hoặc mục tiêu. Vị Linh vào sân; Bí thuật gây sát thương, hồi phục, tăng sức mạnh hoặc rút bài. Dùng thẻ trừ đúng giá Lửa Bếp.",
          ],
          [
            "04",
            "Vai trò và Hộ vệ",
            "Tối đa 5 Vị Linh. Còn Hộ vệ phải đánh Hộ vệ trước; hết Hộ vệ có thể đánh trực tiếp chủ tướng hoặc chọn quân bất kỳ. Hai quân phản đòn; Tiên thủ hạ mục tiêu thì tránh phản đòn, Tuyệt kỹ không nhận phản đòn.",
          ],
          [
            "05",
            "Bẫy và bản sao",
            "Tám bẫy có tám chức năng riêng. Úp một bẫy; khi đủ điều kiện bạn chọn Lật hoặc Giữ, không đếm ngược. Gài mới thay bẫy cũ. Chồng bản sao đúng Vị Linh để lên 2 sao (+40%), giữ HP đã mất.",
          ],
          [
            "06",
            "Chủ động chọn nhịp tấn công",
            "Xen kẽ chơi bài, đánh thường và Tuyệt kỹ đủ 100 Hương lực. Mỗi quân đánh thường 1 lần/vòng. Quân mới chờ lượt sau trừ Xung kích. Kết lượt để AI hành động; hết lượt AI mới rút bài, hồi Lửa và tăng Hương lực.",
          ],
          [
            "07",
            "Giữ 30 Ý chí",
            "Công 3 gây 3 sát thương lên quân hoặc chủ tướng: cùng một thang số. Khiên tối đa 3; hồi máu không vượt HP tối đa. Hạ chủ tướng còn 0 HP để thắng. Từ vòng 8 có Lửa Lớn; hết bộ chịu kiệt sức tăng dần.",
          ],
          [
            "08",
            "Thưởng, thẻ mới và câu chuyện",
            "24 nút hành trình, 12 trận boss và 16 mốc thử thách. Thưởng trận và mốc thử thách chỉ nhận một lần; giữ thẻ, vé và Manga đã mở. Đấu tự do có bot Normal/Hard/Extreme, không phải người chơi online và không cấp thưởng campaign.",
          ],
        ].map(([n, title, text]) => (
          <article key={n}>
            <b>{n}</b>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <div className="tactical-guide-synergy">
        <h2>Cộng hưởng và công thức</h2>
        <p>
          Mỗi hệ/nghề có từ hai Vị Linh sống tạo một cộng hưởng. Có ba cộng
          hưởng hoặc ba hệ khác nhau (Mâm Chung): +3 công; có bốn Vị Linh chung
          một trait: +6 công, thay cho +3. Chơi hai lá liên tiếp cùng hệ trong
          một vòng kích Công thức Đồng Vị: cả đội +5 khiên, một lần mỗi vòng.
          Chỉ số và tiến độ hiện ngay trên bàn.
        </p>
      </div>
      <button className="tcg-button primary" onClick={onPlay}>
        Vào trận luyện tập →
      </button>
    </section>
  )
}
