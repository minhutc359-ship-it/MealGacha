import { PANTRY_STOCK } from "./pantryLayout"
import type { WorldProgress } from "./model"
import { canStand, zoneById } from "./maps"
import { describeObject, INTERACT_RANGE } from "./rules"
import {
  CHEST_RECEIPT,
  ITEM_IDS,
  ITEM_NAMES,
  WARM_BOWL_RECIPE,
  type Economy,
} from "../economy/model"

export function canInspectPantry(world: WorldProgress) {
  return (
    world.zoneId === PANTRY_STOCK.zoneId &&
    canStand(world.zoneId, world.x, world.y) &&
    Math.hypot(world.x - PANTRY_STOCK.x, world.y - PANTRY_STOCK.y) <=
      INTERACT_RANGE
  )
}

/** Detached committed data; never grants goods, cooks, reads hints or travels. */
export function pantryInspection(
  world: WorldProgress,
  economy: Readonly<Economy>,
) {
  if (!canInspectPantry(world)) return undefined
  const ingredients = Object.entries(WARM_BOWL_RECIPE.ingredients).map(
    ([id, needed]) => {
      const itemId = id as keyof typeof WARM_BOWL_RECIPE.ingredients
      const owned = economy.inventory[itemId]
      return {
        id: itemId,
        name: ITEM_NAMES[itemId],
        owned,
        needed,
        missing: Math.max(0, needed - owned),
      }
    },
  )
  const chestClaimed = economy.receipts.includes(CHEST_RECEIPT)
  return {
    inventory: ITEM_IDS.map((id) => ({
      id,
      name: ITEM_NAMES[id],
      count: economy.inventory[id],
    })),
    ingredients,
    possibleMeals: Math.min(
      ...ingredients.map((item) => Math.floor(item.owned / item.needed)),
    ),
    cooked: economy.cooked,
    shared: economy.shared,
    routes: [
      "aw2-chest-pantry",
      "aw2-object-hearth-hint",
      `${world.zoneId}:exit:east`,
      `${world.zoneId}:exit:west`,
    ].map((id) => {
      const object = zoneById(world.zoneId).objects.find(
        (object) => object.id === id,
      )!
      const description = describeObject(world, object)
      const locked =
        object.kind === "exit" &&
        !description.actions.some((action) => action.id === "travel")
      const status =
        object.kind === "chest"
          ? chestClaimed
            ? "Đã nhận rương một lần."
            : "Chưa nhận rương nguyên liệu."
          : object.kind === "hint"
            ? world.hintRead
              ? "Đã ghi Bảng dấu hơi."
              : description.actions.length
                ? "Đến gần và tự ghi lại gợi ý."
                : "Nhận nhiệm vụ ở Dì Gác Bếp trước."
            : locked
              ? "Cửa chưa mở theo nhiệm vụ."
              : "Đến gần rồi tự chọn Đi qua."
      return {
        id,
        name: object.name,
        status,
        locked,
        point: {
          x:
            object.x +
            (object.kind === "exit" ? (object.x > 320 ? -24 : 24) : 0),
          y: object.y + (object.kind === "exit" ? 0 : 32),
          entityId: object.id,
        },
      }
    }),
  }
}
