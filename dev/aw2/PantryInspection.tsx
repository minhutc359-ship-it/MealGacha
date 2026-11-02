import { useState } from "react"
import type { WorldProgress } from "../../src/aw2/world/model"
import type { Economy } from "../../src/aw2/economy/model"
import type { Waypoint } from "../../src/aw2/world/navigation"
import { pantryInspection } from "../../src/aw2/world/pantry"
import { pageSlice } from "../../src/aw2/world/questJournal"
import { PageControls } from "./GamePanels"

const tabs = ["Nguyên liệu", "Công thức", "Lối đi"] as const

export function PantryInspection({
  world,
  economy,
  disabled,
  onWalk,
}: {
  world: WorldProgress
  economy: Readonly<Economy>
  disabled: boolean
  onWalk: (point: Waypoint) => void
}) {
  const [tab, setTab] = useState(0),
    [page, setPage] = useState(0)
  const view = pantryInspection(world, economy)
  if (!view) return <p>Đến gần chỗ kiểm nguyên liệu trong Phòng Kho.</p>
  const inventory = pageSlice(view.inventory, page, 1),
    ingredients = pageSlice(view.ingredients, page, 1),
    routes = pageSlice(view.routes, page, 1)
  const item = inventory.items[0],
    ingredient = ingredients.items[0],
    route = routes.items[0]
  const pages = tab === 0 ? inventory : tab === 1 ? ingredients : routes
  return (
    <div className="aw2-pantry-inspection" data-testid="pantry-inspection">
      <div className="aw2-panel-tabs" role="group" aria-label="Mục kiểm kho">
        {tabs.map((name, index) => (
          <button
            type="button"
            key={name}
            aria-pressed={tab === index}
            onClick={() => {
              setTab(index)
              setPage(0)
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="aw2-pantry-card" aria-live="polite">
        {tab === 0 ? (
          <>
            <strong>{item.name}</strong>
            <p data-testid="pantry-item-count">Đang có: {item.count}</p>
            <small>
              {item.id === "warm-bowl"
                ? `Đã nấu ${view.cooked} · đã chia ${view.shared}.`
                : "Nguyên liệu trong túi của bạn."}
            </small>
          </>
        ) : tab === 1 ? (
          <>
            <strong>Chén cơm ấm · {ingredient.name}</strong>
            <p data-testid="pantry-recipe-cost">
              Cần {ingredient.needed} · có {ingredient.owned} · thiếu{" "}
              {ingredient.missing}
            </p>
            <small>
              Đủ nguyên liệu cho {view.possibleMeals} chén. Nấu tại bếp đã mở
              hoặc Dì Gác Bếp.
            </small>
          </>
        ) : (
          <>
            <strong>{route.name}</strong>
            <p>{route.status}</p>
            <button
              type="button"
              disabled={disabled || route.locked}
              onClick={() => onWalk(route.point)}
            >
              Đi tới điểm này
            </button>
          </>
        )}
      </div>
      <PageControls
        page={pages.page}
        pages={pages.pages}
        onPage={setPage}
        label="Mục"
      />
    </div>
  )
}
