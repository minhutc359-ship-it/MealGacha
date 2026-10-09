import { Dialog } from "../game/Dialog"
import { AutoPortrait, AutoMonsterPortrait, WorldArt } from "./AutoArt"
import {
  AUTO_SCHOOLS,
  AUTO_UNITS,
  UNIT_MAP,
  MONSTER_MAP,
  PROFESSIONS,
  SKILL_LABELS,
} from "../../game/autochess/catalog"
import { SCENES, SPEAKERS } from "../../game/autochess/story"
import type { Piece, Actor } from "../../game/autochess/types"
import { useGameMusic } from "../game/GameAudio"
import { LegalLinks } from "../../legal/LegalLinks"
import { ITEM_MAP } from "../../game/autochess/items"
export function AutoStory({
  sceneId,
  line,
  onNext,
  oldEnding,
}: {
  sceneId: string
  line: number
  onNext: () => void
  oldEnding?: string | null
}) {
  const scene = SCENES[sceneId],
    text = scene.lines[line] ?? scene.lines[0],
    speaker = SPEAKERS[text.speaker]
  useGameMusic("auto-story", 30)
  return (
    <Dialog
      title={scene.title}
      onClose={() => {}}
      dismissible={false}
      className="ac-story-dialog"
    >
      <div className="ac-story-image">
        <WorldArt scene={scene.art} />
        <AutoPortrait
          index={speaker.portrait}
          npc
          label={speaker.name}
          className="ac-story-speaker"
        />
      </div>
      <div className="ac-story-copy" key={`${sceneId}-${line}`}>
        <small>
          {speaker.name} · {line + 1}/{scene.lines.length}
        </small>
        <p>{text.text}</p>
        {sceneId === "intro-1" && line === 0 && oldEnding && (
          <span className="ac-story-continuity">
            {oldEnding === "remember"
              ? "Một chiếc ghế vẫn giữ chỗ cho lời hẹn cũ."
              : "Câu chuyện cũ khép lại. Người đến sau tự chọn tên cho hành trình của mình."}
          </span>
        )}
      </div>
      <footer>
        <span>Chiến đấu và đồng hồ đang dừng</span>
        <button className="ac-button primary" onClick={onNext}>
          {line + 1 === scene.lines.length
            ? "Tiếp tục hành trình →"
            : "Lời tiếp theo →"}
        </button>
      </footer>
    </Dialog>
  )
}
export function UnitInspector({
  id,
  piece,
  actor,
  onClose,
  onBuy,
  onUnequip,
}: {
  id: string
  piece?: Piece
  actor?: Actor
  onClose: () => void
  onBuy?: () => void
  onUnequip?: (item: string) => void
}) {
  const unit = UNIT_MAP[id],
    monster = MONSTER_MAP[id],
    def = unit ?? monster
  if (!def) return null
  const star = piece?.star ?? actor?.star ?? 1
  return (
    <Dialog title={def.name} onClose={onClose} className="ac-unit-dialog">
      <div className="ac-unit-hero">
        {unit ? (
          <AutoPortrait index={unit.portrait} label={unit.spirit} />
        ) : (
          <AutoMonsterPortrait id={monster.id} label={monster.name} />
        )}
        <div>
          <small>
            {AUTO_SCHOOLS[def.school].name}
            {unit ? ` · ${PROFESSIONS[unit.profession].name}` : " · Vô Danh"}
          </small>
          <h3>{unit?.spirit ?? "Ký ức thất lạc"}</h3>
          <strong>{"★".repeat(star)}</strong>
        </div>
      </div>
      <div className="ac-stat-grid">
        <span>
          Máu{" "}
          <b>
            {actor
              ? `${actor.hp}/${actor.maxHp}`
              : Math.round(def.hp * [1, 1.7, 2.9][star - 1])}
          </b>
        </span>
        <span>
          Công{" "}
          <b>
            {Math.round(actor?.attack ?? def.attack * [1, 1.5, 2.25][star - 1])}
          </b>
        </span>
        <span>
          Giáp <b>{actor?.armor ?? def.armor}</b>
        </span>
        <span>
          Tầm <b>{def.range} ô</b>
        </span>
      </div>
      <h4>{SKILL_LABELS[def.skill]}</h4>
      <p>{def.text}</p>
      <p className="ac-muted">
        Kỹ năng tự tung khi đủ 100 mana. Đánh thường và nhận đòn giúp tích mana;
        phong ấn chỉ khóa phép, không khóa đánh thường.
      </p>
      {unit?.foodId && (
        <div className="ac-food-memory">
          <img src={unit.art} alt={unit.name} loading="lazy" />
          <p>
            {unit.lore}
            <br />
            <small>Món giữ ký ức → ký ức gọi Vị Linh → linh thể giữ bàn.</small>
          </p>
        </div>
      )}
      {!unit?.foodId && unit && <p className="ac-muted">{unit.lore}</p>}
      {piece && (
        <div className="ac-equipped-items">
          {piece.items.map((item) => (
            <button
              className="ac-button"
              key={item}
              onClick={() => onUnequip?.(item)}
              disabled={!onUnequip}
            >
              {ITEM_MAP[item]?.name} · Tháo
            </button>
          ))}
        </div>
      )}
      {onBuy && unit && (
        <button className="ac-button primary" onClick={onBuy}>
          Mua {unit.name} · {unit.cost} vàng
        </button>
      )}
    </Dialog>
  )
}
export function AutoGuide({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="Một vòng chơi trong ba bước" onClose={onClose} className="ac-guide-dialog">
      <p className="ac-guide-intro">Bạn chọn đội hình; Vị Linh tự di chuyển, đánh và tung kỹ năng. Hạ hết phe địch trong 55 giây để thắng.</p>
      <div className="ac-guide-steps">
        <article><strong>1 · Mua & ghép quân</strong><p>Chạm lá trong cửa hàng để mua. 3 bản cùng quân tự ghép ★★; 3 quân ★★ ghép ★★★. Dự bị có 9 ô; dù đầy, vẫn mua được bản thứ ba để tự ghép. Mua quân không tự chọn hoặc đổi chỗ quân khác. Quân mới nằm ở ghế dự bị.</p></article>
        <article><strong>2 · Xếp đội hình</strong><p>Kéo thả quân giữa các ô bàn và dự bị bằng chuột hoặc ngón tay; thả lên một quân để đổi chỗ. Trên PC có thể chọn quân → chọn ô; trên mobile chạm nhẹ không đổi chỗ. Giữ 0,3 giây để xem nhanh, thả tay để đóng. Kéo vào khay Bán ở hai cạnh để nhận vàng. Đỡ đòn đứng trước; tầm xa/hồi phục đứng sau.</p></article>
        <article><strong>3 · Xuất trận</strong><p>Đội tự đánh. Đủ 100 mana sẽ tung phép. Thắng → nhảy ăn mừng → kết quả → chọn thưởng nếu có → chuẩn bị vòng mới.</p></article>
      </div>
      <div className="ac-guide-example"><strong>Đội khởi đầu dễ hiểu</strong><p>Cơm tấm giữ tuyến trước · Phở bò gây sát thương từ xa · Bánh cuốn hồi phục ở phía sau.</p></div>
      <details className="ac-guide-more"><summary>Phím tắt PC & tìm bản ghép</summary><p>Đặt con trỏ lên quân: W chuyển bàn ↔ dự bị; E bán quân. F mua 4 XP, D đổi cửa hàng. Phím chỉ hoạt động lúc chuẩn bị, không chạy khi đang mở thoại/hộp thoại hay nhập chữ. HUD trái: chưa đủ mốc có màu tối, mốc đầu màu đồng, mốc thứ hai màu bạc. Hỏa vị nền đỏ, Hải vị xanh biển, Ngọt vị xanh lá. Viền giá 1–5 vàng và badge hệ giúp đọc shop; dấu ✓ là quân đã có; viền vàng “Ghép sao” là đã có hai bản ★. Quân lớn thêm 7% mỗi bậc sao và phát vòng sáng khi hợp nhất. Mở Hệ ở tiêu đề trận để xem bảng tỉ lệ theo cấp.</p></details>
      <details className="ac-guide-more"><summary>Vàng, XP và phối hệ</summary><p>Mỗi vòng nhận 2 XP và 5 vàng, thêm 1 vàng khi thắng. Nút Cấp luôn hiện EXP hiện tại/mốc kế tiếp và thanh tiến độ. 4 vàng mua 4 XP; các mốc 8/20/38/62/92/128 XP mở 4/5/6/7/8/9 quân. Cấp 9 là tối đa. Giữ 10/20/30 vàng nhận 1/2/3 lợi tức.</p><p>Quân khác tên cùng hệ kích mốc 2/4; cùng nghề kích 2/3. Bản trùng tên chỉ tính một lần. Ba hệ khác nhau kích Mâm chung để hồi máu. Mở Túi → kéo trang bị lên quân. Than Hồng, Giọt Sương và Sợi Tre ghép từng đôi thành sáu di vật; preview hiện trước khi thả, cũng ghép được với mảnh đã đeo trên quân. Mỗi quân giữ hai trang bị; bán hoặc tháo trả đồ về kho. Shop có nút Ẩn/Hiện; rung lên sao bật trong Âm thanh nếu trình duyệt hỗ trợ. Phe địch có sức mạnh tổng hợp tăng 30%: máu, công và kỹ năng tăng khoảng 14% mỗi phần. Ba sao vẫn cần đội hình hỗ trợ.</p></details>
      <details className="ac-guide-more"><summary>Thua, survival và lưu tiến trình</summary><p>Thua mất ý chí; chiến dịch phải chơi lại đúng màn đó. Survival chuyển sang đợt mới đến khi hết 100 ý chí; chỉ vòng thắng cho điểm.</p><p>Survival: cứ 30 giây giao chiến địch mạnh hơn; sau 25 giây trong một vòng có cuồng nộ. Chuẩn bị, tạm dừng, thoại và ăn mừng không tính thời gian.</p><p>Vàng Auto chess độc lập với xu TCG. Mã tiến trình giữ cả trận, tài nguyên và kỷ lục; không cần tài khoản.</p></details>
      <LegalLinks />
      <button className="ac-button primary" onClick={onClose}>Đã hiểu · Giữ bàn!</button>
    </Dialog>
  )
}
export function AutoRoster({ onInspect }: { onInspect: (id: string) => void }) {
  return (
    <div className="ac-roster-grid">
      {AUTO_UNITS.map((u) => (
        <button
          className="ac-roster-card"
          key={u.id}
          onClick={() => onInspect(u.id)}
        >
          <AutoPortrait index={u.portrait} label={u.spirit} />
          <span>
            <strong>{u.name}</strong>
            <small>
              {u.cost} vàng · {AUTO_SCHOOLS[u.school].name} ·{" "}
              {PROFESSIONS[u.profession].name}
            </small>
          </span>
        </button>
      ))}
    </div>
  )
}
