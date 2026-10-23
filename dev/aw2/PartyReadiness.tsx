import { describeDevelopmentParty } from "../../src/aw2/collection/readiness"
import type { VanEmphasis } from "../../src/aw2/combat/types"
import { ROSTER_ASSETS } from "../../src/aw2/assets/roster"

const roles = {
  tank: "Đỡ đòn",
  striker: "Cận chiến",
  healer: "Hồi phục",
  support: "Hỗ trợ",
  mage: "Phép",
  debuffer: "Làm yếu",
  hybrid: "Phối hợp",
}
export function PartyReadiness({
  partyIds,
  teamExperience,
  vanEmphasis,
}: {
  partyIds: readonly string[]
  teamExperience: number
  vanEmphasis: VanEmphasis
}) {
  const team = describeDevelopmentParty(partyIds, teamExperience, vanEmphasis)
  return (
    <section
      aria-label="Vai trò và chỉ số đội đang chọn"
      data-testid="party-readiness"
      data-ids={JSON.stringify(partyIds)}
      data-level={team.level}
    >
      <h4>Vai trò đội đang chọn</h4>
      <p data-testid="party-role-coverage">
        Đỡ đòn: {team.tanks} · Hồi phục: {team.healers} · Sát thương chuyên
        trách: {team.damageSpecialists}
      </p>
      {team.tanks === 0 && (
        <p data-testid="party-no-tank">
          Chưa có người đỡ đòn. Có thể thêm Than để bảo vệ đồng đội.
        </p>
      )}
      {team.healers === 0 && (
        <p data-testid="party-no-healer">
          Chưa có người chuyên hồi phục. Có thể thêm Lam Lam để duy trì máu cho
          đội.
        </p>
      )}
      {team.damageSpecialists === 0 && (
        <p data-testid="party-no-damage">
          Chưa có người chuyên gây sát thương. Có thể thử Lửa Nhỏ hoặc Sương
          Lành trong đội khởi đầu.
        </p>
      )}
      <p>
        Vai trò giúp so sánh đội; kết quả còn phụ thuộc kỹ năng và thời điểm
        dùng tuyệt kỹ. Quan sát cảnh báo của boss, lượng máu đã mất và Ghế trống
        trước khi quyết định.
      </p>
      <details>
        <summary>Chỉ số đội đang chọn · cấp {team.level}</summary>
        <p>Chỉ số dưới đây áp dụng cho trận mới sau khi lưu đội hình.</p>
        <dl className="aw2-item-grid">
          {team.members.map((member) => (
            <div
              key={member.spiritId}
              data-testid={`party-stats-${member.spiritId}`}
              data-stats={JSON.stringify(member)}
            >
              <dt>
                {ROSTER_ASSETS[member.spiritId].displayName} ·{" "}
                {roles[member.role]}
              </dt>
              <dd>Máu {member.maxHp}</dd>
              <dd>Công {member.attack}</dd>
              <dd>Thủ {member.defense}</dd>
              {member.vanEmphasis && (
                <dd>
                  Nhấn {member.vanEmphasis === "attack" ? "Tấn công" : "Bảo hộ"}
                </dd>
              )}
            </div>
          ))}
        </dl>
      </details>
    </section>
  )
}
