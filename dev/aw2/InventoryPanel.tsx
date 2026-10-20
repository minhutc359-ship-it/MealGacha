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
import { STARTER_ASSETS } from "../../src/aw2/assets/starters"

export function InventoryPanel({
  save,
  world,
  busy,
  onAction,
}: {
  save: Aw2DevSave
  world: WorldProgress
  busy: boolean
  onAction: (action: EconomyAction) => void
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
              src={STARTER_ASSETS[id].assets.portrait.url}
              alt=""
              width={56}
              height={56}
            />
            <figcaption>{STARTER_ASSETS[id].displayName}</figcaption>
          </figure>
        ))}
      </div>
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
        {!kitchen && (
          <p>
            Mở lại bếp rồi đến gần Dì Gác Bếp hoặc ngọn lửa để nấu/chia bữa.
          </p>
        )}
        <div className="actions">
          <button
            disabled={busy || !kitchen || !ingredients}
            onClick={() => onAction("cook")}
          >
            Nấu Chén cơm ấm
          </button>
          <button
            disabled={busy || !kitchen || !economy.inventory["warm-bowl"]}
            onClick={() => onAction("share-meal")}
          >
            Chia bữa · +45 EXP
          </button>
        </div>
      </details>
    </section>
  )
}
