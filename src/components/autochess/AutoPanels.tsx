import { Dialog } from "../game/Dialog"
import { AutoPortrait, AutoMonsterPortrait, WorldArt } from "./AutoArt"
import {
  AUTO_SCHOOLS,
  AUTO_UNITS,
  UNIT_MAP,
  MONSTER_MAP,
  PROFESSIONS,
  SKILL_LABELS,
  RELICS,
} from "../../game/autochess/catalog"
import { SCENES, SPEAKERS } from "../../game/autochess/story"
import type { Piece, Actor } from "../../game/autochess/types"
import { useGameMusic } from "../game/GameAudio"
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
          <AutoMonsterPortrait row={monster.sprite} label={monster.name} />
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
              {RELICS.find((r) => r.id === item)?.name} · Tháo
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
        <article><strong>1 · Mua & ghép quân</strong><p>Chạm Mua trong cửa hàng. 3 bản cùng quân tự ghép ★★; 3 quân ★★ ghép ★★★. Quân mới nằm ở ghế dự bị.</p></article>
        <article><strong>2 · Xếp đội hình</strong><p>Kéo thả quân giữa các ô bàn và dự bị bằng chuột hoặc ngón tay; thả lên một quân để đổi chỗ. Bạn cũng có thể chọn quân → chạm ô sáng. Đỡ đòn đứng trước; tầm xa/hồi phục đứng sau.</p></article>
        <article><strong>3 · Xuất trận</strong><p>Đội tự đánh. Đủ 100 mana sẽ tung phép. Thắng → nhảy ăn mừng → kết quả → chọn thưởng nếu có → chuẩn bị vòng mới.</p></article>
      </div>
      <div className="ac-guide-example"><strong>Đội khởi đầu dễ hiểu</strong><p>Cơm tấm giữ tuyến trước · Phở bò gây sát thương từ xa · Bánh cuốn hồi phục ở phía sau.</p></div>
      <details className="ac-guide-more"><summary>Vàng, XP và phối hệ</summary><p>Mỗi vòng nhận 2 XP và 5 vàng, thêm 1 vàng khi thắng. Nút Cấp luôn hiện EXP hiện tại/mốc kế tiếp và thanh tiến độ. 4 vàng mua 4 XP; các mốc 8/20/38/62 XP mở tối đa 4/5/6/7 quân. Giữ 10/20/30 vàng nhận 1/2/3 lợi tức.</p><p>Quân khác tên cùng hệ kích mốc 2/4; cùng nghề kích 2/3. Bản trùng tên chỉ tính một lần. Ba hệ khác nhau kích Mâm chung để hồi máu. Chọn quân → mở túi ✧ để trao tối đa hai di vật khác nhau. Phe địch có sức mạnh tổng hợp tăng 30%: máu, công và kỹ năng tăng khoảng 14% mỗi phần. Ba sao vẫn cần đội hình hỗ trợ.</p></details>
      <details className="ac-guide-more"><summary>Thua, survival và lưu tiến trình</summary><p>Thua mất ý chí; chiến dịch phải chơi lại đúng màn đó. Survival chuyển sang đợt mới đến khi hết 100 ý chí; chỉ vòng thắng cho điểm.</p><p>Survival: cứ 30 giây giao chiến địch mạnh hơn; sau 25 giây trong một vòng có cuồng nộ. Chuẩn bị, tạm dừng, thoại và ăn mừng không tính thời gian.</p><p>Vàng Auto chess độc lập với xu TCG. Mã tiến trình giữ cả trận, tài nguyên và kỷ lục; không cần tài khoản.</p></details>
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
