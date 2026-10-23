import { useEffect, useState } from "react"
import { ROSTER_ASSETS } from "../../src/aw2/assets/roster"
import type { Aw2DevSave } from "../../src/aw2/save/schema"
import { ROSTER, type SPIRIT_IDS } from "../../src/aw2/world/ids"
import {
  ownedSpirits,
  RECRUIT_IDS,
  RECRUIT_QUESTS,
  type CollectionAction,
} from "../../src/aw2/collection/model"
import { questLabel } from "../../src/aw2/world/rules"

type SpiritId = (typeof SPIRIT_IDS)[number]
export function CollectionPanel({
  save,
  busy,
  onAction,
}: {
  save: Aw2DevSave
  busy: boolean
  onAction: (action: CollectionAction) => void
}) {
  const [party, setParty] = useState(save.progress.partyIds)
  const [emphasis, setEmphasis] = useState(save.collection.vanEmphasis)
  useEffect(() => {
    setParty(save.progress.partyIds)
    setEmphasis(save.collection.vanEmphasis)
  }, [save.revision, save.progress.partyIds, save.collection.vanEmphasis])
  const owned = ownedSpirits(save.progress, save.collection)
  const changed =
    JSON.stringify(party) !== JSON.stringify(save.progress.partyIds) ||
    emphasis !== save.collection.vanEmphasis
  const cancel = () => {
    setParty(save.progress.partyIds)
    setEmphasis(save.collection.vanEmphasis)
  }
  const choose = (slot: number, id: SpiritId) => {
    if (!owned.includes(id)) return
    setParty((current) => {
      const next = [...current],
        other = next.indexOf(id)
      if (other >= 0) next[other] = next[slot]
      next[slot] = id
      return next
    })
  }
  return (
    <section id="aw2-collection" aria-label="Bộ sưu tập và đội hình">
      <h3>Bộ sưu tập Vị Linh</h3>
      <p>
        Nhân vật có thể được mời sau mốc nhiệm vụ. Mỗi lời mời chỉ nhận một lần,
        không tiêu nguyên liệu hoặc EXP. Đây là quy tắc mở khóa thử nghiệm.
      </p>
      <p data-testid="collection-owned" data-ids={JSON.stringify(owned)}>
        Đã sở hữu {owned.length}/12
      </p>
      <ul className="aw2-collection-grid">
        {ROSTER.map((unit) => {
          const recruit = RECRUIT_IDS.find((id) => id === unit.spiritId),
            gate = recruit ? RECRUIT_QUESTS[recruit] : 1,
            isOwned = owned.includes(unit.spiritId),
            eligible = !!recruit && save.progress.questIndex >= gate
          return (
            <li
              key={unit.spiritId}
              data-testid={`collection-${unit.spiritId}`}
              data-owned={isOwned}
            >
              <img
                loading="lazy"
                src={ROSTER_ASSETS[unit.spiritId].assets.portrait.url}
                alt=""
                width={56}
                height={56}
              />
              <strong>
                {unit.displayName} · {unit.rarity}
              </strong>
              <small>
                {unit.recipeAffiliation} · {unit.role}
              </small>
              <p>
                {isOwned
                  ? save.progress.partyIds.includes(unit.spiritId)
                    ? "Đang trong đội đã lưu"
                    : "Đã sở hữu"
                  : recruit
                    ? eligible
                      ? "Đã đủ điều kiện mời"
                      : `Hoàn tất ${questLabel({ ...save.progress, questIndex: gate - 1 })} để mời`
                    : "Nhận trực tiếp sau nhập môn"}
              </p>
              {recruit && !isOwned && (
                <button
                  type="button"
                  disabled={busy || !eligible}
                  onClick={() =>
                    onAction({ type: "recruit", spiritId: recruit })
                  }
                >
                  Mời {unit.displayName}
                </button>
              )}
            </li>
          )
        })}
      </ul>
      {save.progress.questIndex > 0 && (
        <>
          <h3>Đội hình cho trận tiếp theo</h3>
          <p
            data-testid="saved-team"
            data-ids={JSON.stringify(save.progress.partyIds)}
            data-emphasis={save.collection.vanEmphasis}
          >
            Đã lưu:{" "}
            {save.progress.partyIds
              .map((id) => ROSTER.find((r) => r.spiritId === id)!.displayName)
              .join(", ")}
          </p>
          <p>
            Chọn đủ năm người rồi lưu đội. Chọn một người đang ở vị trí khác sẽ
            đổi chỗ hai người. Trận đang chạy giữ nguyên đội đã bắt đầu.
          </p>
          <div className="aw2-team-slots">
            {party.map((id, slot) => (
              <label key={slot}>
                Vị trí {slot + 1}
                <select
                  aria-label={`Vị trí đội ${slot + 1}`}
                  value={id}
                  disabled={busy}
                  onChange={(e) => choose(slot, e.target.value as SpiritId)}
                >
                  {ROSTER.filter((r) => owned.includes(r.spiritId)).map((r) => (
                    <option key={r.spiritId} value={r.spiritId}>
                      {r.displayName}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          {owned.includes("aw2-van") && (
            <label>
              Nhấn tuyệt kỹ Vân cho trận mới{" "}
              <select
                aria-label="Nhấn Vân cho trận mới"
                value={emphasis}
                disabled={busy}
                onChange={(e) =>
                  setEmphasis(
                    e.target.value === "attack" ? "attack" : "protection",
                  )
                }
              >
                <option value="protection">Bảo hộ</option>
                <option value="attack">Tấn công</option>
              </select>
            </label>
          )}
          <p role="status">
            {changed
              ? "Có thay đổi chưa lưu; đội đang đi cùng vẫn giữ nguyên."
              : "Đội và nhấn tuyệt kỹ đã lưu."}
          </p>
          <div className="actions">
            <button
              type="button"
              disabled={busy || !changed || party.length !== 5}
              onClick={() =>
                onAction({
                  type: "team",
                  partyIds: party,
                  vanEmphasis: emphasis,
                })
              }
            >
              Lưu đội hình
            </button>
            <button type="button" disabled={busy || !changed} onClick={cancel}>
              Hủy chọn đội
            </button>
          </div>
        </>
      )}
    </section>
  )
}
