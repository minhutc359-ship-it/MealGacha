import { useState } from "react"
import {
  ITEM_NAMES,
  WARM_BOWL_RECIPE,
  type Economy,
} from "../../src/aw2/economy/model"
import { pageSlice } from "../../src/aw2/world/questJournal"
import { PageControls } from "./GamePanels"

export function RecipePanel({ economy }: { economy: Readonly<Economy> }) {
  const [page, setPage] = useState(0)
  const ingredients = Object.entries(WARM_BOWL_RECIPE.ingredients).map(
    ([key, needed]) => {
      const id = key as keyof typeof WARM_BOWL_RECIPE.ingredients
      return { id, name: ITEM_NAMES[id], needed, owned: economy.inventory[id] }
    },
  )
  const view = pageSlice(ingredients, page, 1),
    item = view.items[0]
  return (
    <div className="aw2-panel-stack" data-testid="tea-recipe">
      <h3>Chén cơm ấm · {item.name}</h3>
      <p>
        Cần {item.needed} · có {item.owned} · thiếu{" "}
        {Math.max(0, item.needed - item.owned)}
      </p>
      <p>
        Đủ nguyên liệu cho{" "}
        {Math.min(...ingredients.map((i) => Math.floor(i.owned / i.needed)))}{" "}
        chén. Nấu tại bếp đã mở hoặc gần Dì Gác Bếp.
      </p>
      <PageControls
        page={view.page}
        pages={view.pages}
        onPage={setPage}
        label="Công thức"
      />
    </div>
  )
}
