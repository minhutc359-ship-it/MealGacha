import type { WorldProgress } from "./model"
import {
  canUseKitchen,
  CHEST_RECEIPT,
  WARM_BOWL_RECIPE,
  type Economy,
} from "../economy/model"
import { sceneObjects } from "./scene"
import { describeObject } from "./rules"

export interface PlaceAffordance {
  state: "open" | "locked" | "ready" | "claimed" | "unavailable"
  symbol: "door" | "lock" | "service" | "check" | "kitchen"
  label: string
  detail: string
}

/** Usable on approach, not a promise of range, loading readiness or permission to act. */
export function placeAffordance(
  world: WorldProgress,
  economy: Readonly<Economy>,
  id: string,
): PlaceAffordance | undefined {
  const object = sceneObjects(world).find((candidate) => candidate.id === id)
  if (!object) return
  const description = describeObject(world, object)
  if (["exit", "room", "room-exit"].includes(object.kind)) {
    const open = description.actions.some((action) =>
      ["travel", "enter-room", "leave-room"].includes(action.id),
    )
    return {
      state: open ? "open" : "locked",
      symbol: open ? "door" : "lock",
      label: open ? "Lối mở" : "Khóa",
      detail: open
        ? "Lối đã mở. Đến gần rồi tự tương tác để đi qua."
        : description.text,
    }
  }
  if (object.kind === "mode" || object.kind === "room-service") {
    const ready = description.actions.length > 0
    return {
      state: ready ? "ready" : "unavailable",
      symbol: "service",
      label: ready ? "Sẵn sàng" : "Chưa mở",
      detail: ready
        ? "Dịch vụ sẵn sàng. Đến gần rồi tự chọn thao tác."
        : description.text,
    }
  }
  if (object.kind === "stock")
    return {
      state: "ready",
      symbol: "service",
      label: "Xem túi đồ",
      detail: "Có thể kiểm nguyên liệu và công thức; xem không nhận thêm đồ.",
    }
  if (object.kind === "chest") {
    const claimed = economy.receipts.includes(CHEST_RECEIPT)
    return {
      state: claimed ? "claimed" : "ready",
      symbol: claimed ? "check" : "service",
      label: claimed ? "Đã nhận" : "Chưa nhận",
      detail: claimed
        ? "Rương đã được nhận một lần trong hành trình này."
        : "Rương còn nguyên liệu. Đến gần rồi tự chọn Mở rương nguyên liệu.",
    }
  }
  if (object.id === "aw2-npc-gac-bep" || object.id === "aw2-object-steam-2") {
    // Ask the existing kitchen authority at its real anchor, without moving the player.
    const open = canUseKitchen({ ...world, x: object.x, y: object.y })
    if (!open)
      return {
        state: "locked",
        symbol: "lock",
        label: "Bếp khóa",
        detail: "Tiếp tục nhiệm vụ mở bếp trước khi nấu hoặc chia bữa.",
      }
    if (economy.inventory["warm-bowl"] > 0)
      return {
        state: "ready",
        symbol: "kitchen",
        label: "Có bữa ấm",
        detail: "Có Chén cơm ấm để chia. Đến gần bếp rồi tự chọn Chia bữa.",
      }
    const ingredients = Object.entries(
      WARM_BOWL_RECIPE.ingredients,
    ) as [keyof typeof WARM_BOWL_RECIPE.ingredients, number][]
    const canCook = ingredients.every(
      ([item, amount]) => economy.inventory[item] >= amount,
    )
    return {
      state: canCook ? "ready" : "unavailable",
      symbol: "kitchen",
      label: canCook ? "Có thể nấu" : "Thiếu đồ",
      detail: canCook
        ? "Đủ nguyên liệu cho một bữa. Đến gần bếp rồi tự chọn Nấu."
        : "Bếp đã mở. Cần 1 Gạo thơm, 1 Rau vườn và 1 Nước dùng để nấu.",
    }
  }
}
