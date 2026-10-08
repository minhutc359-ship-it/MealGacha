import { Dialog } from "../game/Dialog"
import { AutoPortrait, WorldArt } from "./AutoArt"
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
          <span
            className="ac-monster-portrait"
            role="img"
            aria-label={monster.name}
            style={{ backgroundPosition: `0% ${(monster.sprite / 13) * 100}%` }}
          />
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
    <Dialog
      title="Giữ bàn trong ba bước"
      onClose={onClose}
      className="ac-guide-dialog"
    >
      <ol>
        <li>
          <strong>Chuẩn bị:</strong> mua quân bằng vàng trong lượt chơi. Chọn
          quân rồi chọn ô ở ba hàng phía bạn; kéo thả cũng được. Tank đứng
          trước, carry và hồi phục đứng sau.
        </li>
        <li>
          <strong>Ghép và phối:</strong> 3 bản cùng quân lên 2 sao, 9 bản lên 3
          sao. Quân khác ID kích mốc hệ/nghề; hai bản cùng ID không tính hai
          lần. Chọn di vật để bổ trợ cách đánh.
        </li>
        <li>
          <strong>Xuất trận:</strong> đội tự đi, đánh và dùng phép khi đầy mana.
          Xem vòng niệm, đạn, số sát thương và khiên để biết ai đang làm gì. Giữ
          10/20/30 vàng nhận 1/2/3 lợi tức sau vòng.
        </li>
      </ol>
      <p>
        4 vàng mua 4 XP; cấp bàn mở 3 → 7 quân. Thua mất ý chí. Chiến dịch chỉ
        mở màn sau khi thắng; survival tiếp tục đợt mới cho đến khi hết 100 ý
        chí.
      </p>
      <p>
        Survival: mỗi 30 giây giao chiến, địch mạnh hơn. Sau 25 giây mỗi vòng có
        cuồng nộ; 55 giây chưa hạ hết địch tính thua. Chuẩn bị, pause, thoại và
        tab ẩn không tính thời gian. Điểm chỉ nhận ở vòng thắng.
      </p>
      <p className="ac-muted">
        Vàng và pool auto chess độc lập với thẻ/xu TCG. Không cần tài khoản; mã
        tiến trình giữ cả trận đang chơi và kỷ lục.
      </p>
      <button className="ac-button primary" onClick={onClose}>
        Đã hiểu · Giữ bàn!
      </button>
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
