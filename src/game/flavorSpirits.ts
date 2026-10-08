import type { GameCard, School } from "./types"

// Original fantasy manifestations of kitchen memories, not traditional deities.
export const FLAVOR_SPIRITS: Record<School, {
  name: string
  art: string
  memory: string
  call: string
}> = {
  ember: {
    name: "Hồ Ly Than Hồng",
    art: "/assets/tcg/spirits/ember.webp",
    memory: "Ký ức bếp lửa hóa thành Hồ Ly Than Hồng, mang hơi ấm xua sương.",
    call: "Bếp lửa còn ấm — Hỏa vị, bừng lên!",
  },
  tide: {
    name: "Long Ngư Hơi Nước",
    art: "/assets/tcg/spirits/tide.webp",
    memory:
      "Hơi nước giữ tiếng gọi bên nồi canh, hóa thành Long Ngư bảo vệ ký ức.",
    call: "Lắng nghe dòng nhớ — Hải vị, trỗi dậy!",
  },
  grove: {
    name: "Linh Lộc Lá Thơm",
    art: "/assets/tcg/spirits/grove.webp",
    memory:
      "Hương lá giữ lời chăm sóc người thân, hóa thành Linh Lộc chữa lành.",
    call: "Đừng bỏ ai lại — Thanh vị, nở xanh!",
  },
  hearth: {
    name: "Sư Tử Hạt Gạo",
    art: "/assets/tcg/spirits/hearth.webp",
    memory: "Hơi cơm giữ lời mời về nhà, hóa thành Sư Tử Hạt Gạo giữ bàn ăn.",
    call: "Cùng giữ bữa cơm — Gia vị, vững vàng!",
  },
  sugar: {
    name: "Ngọc Thố Đường Sao",
    art: "/assets/tcg/spirits/sugar.webp",
    memory:
      "Vị ngọt giữ niềm vui đoàn viên, hóa thành Ngọc Thố dệt lá chắn ánh sao.",
    call: "Giữ lấy điều ước — Ngọt vị, tỏa sáng!",
  },
}

export function foodSpirit(card: GameCard) {
  return card.kind === "unit" && card.art?.startsWith("/assets/food/")
    ? FLAVOR_SPIRITS[card.school]
    : undefined
}
