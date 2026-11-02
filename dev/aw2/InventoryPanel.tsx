import { CollectionPanel } from "./CollectionPanel"
import type { CollectionAction } from "../../src/aw2/collection/model"
import type { Aw2DevSave } from "../../src/aw2/save/schema"
import type { WorldProgress } from "../../src/aw2/world/model"
import {
  canUseKitchen,
  ITEM_IDS,
  ITEM_NAMES,
  pendingQuestRewards,
  type EconomyAction,
} from "../../src/aw2/economy/model"
import { developmentProgression } from "../../src/aw2/combat/progression"
import { ROSTER_ASSETS } from "../../src/aw2/assets/roster"

export function InventoryPanel({
  save,
  world,
  busy,
  onAction,
  onCollectionAction,
}: {
  save: Aw2DevSave
  world: WorldProgress
  busy: boolean
  onAction: (action: EconomyAction) => void
  onCollectionAction: (action: CollectionAction) => void
}) {
  const { economy } = save
  const xp = developmentProgression(economy.teamExperience)
  const pending = pendingQuestRewards(economy, world)
  const kitchen = canUseKitchen(world)
  const ingredients =
    economy.inventory.rice > 0 &&
    economy.inventory.herbs > 0 &&
    economy.inventory.broth > 0
  return (
    <section className="aw2-inventory" aria-label="Đội và túi đồ">
      <div className="aw2-party-header">
        <h2>Những người bạn đồng hành</h2>
        <strong data-testid="team-level">
          Cấp {xp.level} · {economy.teamExperience} EXP
        </strong>
      </div>
      <progress
        aria-label="Kinh nghiệm đội"
        value={xp.experienceForNextLevel === null ? 1 : xp.experienceInLevel}
        max={xp.experienceForNextLevel ?? 1}
      />
      <p>
        {xp.experienceForNextLevel === null
          ? "Đã đạt cấp tối đa"
          : `${xp.experienceInLevel}/${xp.experienceForNextLevel} EXP đến cấp tiếp theo`}{" "}
        · Cả đội cùng trưởng thành.
      </p>
      <div className="aw2-party-portraits">
        {world.partyIds.map((id) => (
          <figure key={id}>
            <img
              src={ROSTER_ASSETS[id].assets.portrait.url}
              alt=""
              width={56}
              height={56}
            />
            <figcaption>{ROSTER_ASSETS[id].displayName}</figcaption>
          </figure>
        ))}
      </div>
      <CollectionPanel save={save} busy={busy} onAction={onCollectionAction} />
      <h3>Túi nguyên liệu</h3>
      <dl className="aw2-item-grid" data-testid="inventory">
        {ITEM_IDS.map((id) => (
          <div key={id}>
            <dt>{ITEM_NAMES[id]}</dt>
            <dd data-testid={`item-${id}`}>{economy.inventory[id]}</dd>
          </div>
        ))}
      </dl>
      {pending > 0 && (
        <button disabled={busy} onClick={() => onAction("claim-quests")}>
          Nhận quà {pending} nhiệm vụ đã hoàn tất
        </button>
      )}
      <details>
        <summary>Nấu và chia một bữa ấm</summary>
        <p>
          Mỗi chén cần 1 Gạo thơm + 1 Rau vườn + 1 Nước dùng. Chia một chén đã
          nấu để cả đội nhận 45 EXP.
        </p>
        <p id="aw2-kitchen-guide">
          {world.questIndex < 3
            ? "Hoàn tất nhiệm vụ Mở lại bếp rồi đến gần Dì Gác Bếp hoặc ngọn lửa để nấu/chia bữa."
            : !kitchen
              ? "Bếp đã mở. Đến gần Dì Gác Bếp ở Sân hoặc ngọn lửa trong Phòng Lửa để nấu/chia bữa."
              : !ingredients
                ? "Bạn đang ở bếp. Gom đủ nguyên liệu để nấu; chén đã có vẫn có thể chia."
                : "Bạn đang ở bếp, có thể nấu. Chia bữa sau khi có Chén cơm ấm."}
        </p>
        <div className="actions">
          <button
            disabled={busy || !kitchen || !ingredients}
            aria-describedby="aw2-kitchen-guide"
            onClick={() => onAction("cook")}
          >
            Nấu Chén cơm ấm
          </button>
          <button
            disabled={busy || !kitchen || !economy.inventory["warm-bowl"]}
            aria-describedby="aw2-kitchen-guide"
            onClick={() => onAction("share-meal")}
          >
            Chia bữa · +45 EXP
          </button>
        </div>
      </details>
    </section>
  )
}
