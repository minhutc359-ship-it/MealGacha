import { useState } from "react"
import { ROSTER_ASSETS } from "../../src/aw2/assets/roster"
import { ULTIMATE_ART } from "../../src/aw2/assets/ultimateArt"
import { SKILL_SLOTS } from "../../src/aw2/assets/types"
import { COMBAT_KITS, type CombatSpiritId } from "../../src/aw2/combat/roster"
import {
  developmentProgression,
  developmentCombatStats,
} from "../../src/aw2/combat/progression"
import { JOURNAL_SKILLS } from "../../src/aw2/collection/journal"
interface Props {
  spiritId: CombatSpiritId
  experience: number
}
export function CharacterJournal({ spiritId, experience }: Props) {
  const [detail, setDetail] = useState("identity"),
    [failed, setFailed] = useState(false)
  const manifest = ROSTER_ASSETS[spiritId],
    kit = COMBAT_KITS[spiritId]
  const level = developmentProgression(experience).level,
    stats = developmentCombatStats(spiritId, level)
  const slot = SKILL_SLOTS.findIndex((s) => s === detail)
  return (
    <section
      className="aw2-character-journal"
      aria-label={`Nhật ký ${manifest.displayName}`}
    >
      <label>
        Chi tiết Vị Linh
        <select value={detail} onChange={(e) => setDetail(e.target.value)}>
          <option value="identity">Minh họa tuyệt kỹ</option>
          <option value="stats">Chỉ số trong trận</option>
          {SKILL_SLOTS.map((s) => (
            <option value={s} key={s}>
              {manifest.skills[s].displayName}
            </option>
          ))}
        </select>
      </label>
      {detail === "identity" &&
        (failed ? (
          <p role="status">
            Chưa tải được tranh; vẫn có thể đọc kỹ năng và chơi.
          </p>
        ) : (
          <img
            className="aw2-journal-art"
            src={ULTIMATE_ART[spiritId].url}
            alt={`Tranh riêng của ${manifest.displayName}`}
            loading="lazy"
            onError={() => setFailed(true)}
          />
        ))}
      {detail === "stats" && (
        <p>
          Cấp đội {level}/20 · Máu {stats.maxHp} · Công {stats.attack} · Thủ{" "}
          {stats.defense} · Tầm {kit.range}. Kinh nghiệm đội dùng chung, tăng
          cấp qua nhiệm vụ và bữa ăn; bậc hiếm không bảo đảm mạnh hơn.
        </p>
      )}
      {slot >= 0 && (
        <p>
          <strong>{manifest.skills[SKILL_SLOTS[slot]].displayName}</strong>:{" "}
          {JOURNAL_SKILLS[spiritId][slot]}{" "}
          {slot === 3
            ? "Người chơi chủ động dùng khi đủ năng lượng."
            : slot === 2
              ? "Nội tại, chỉ kích hoạt khi điều kiện luật hợp lệ."
              : "Tự động theo luật trận."}
        </p>
      )}
    </section>
  )
}
