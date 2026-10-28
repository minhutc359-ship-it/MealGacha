export interface Aw2OnboardingStep {
  readonly id: "welcome" | "move" | "interact" | "protect"
  readonly title: string
  readonly body: string
}

export const AW2_ONBOARDING_STEPS: readonly Aw2OnboardingStep[] = Object.freeze(
  [
    {
      id: "welcome",
      title: "Giữ một lời mời bên bếp",
      body: "Bạn bắt đầu ở Làng Giao Ước cùng năm Vị Linh. Mục tiêu luôn hiện phía trên bản đồ; game không tự nhận nhiệm vụ hoặc tự chọn thay bạn.",
    },
    {
      id: "move",
      title: "Đi theo cách hợp với bạn",
      body: "Chạm một lối đi, dùng cụm nút hướng hoặc WASD/mũi tên. Nút Dừng và Escape hủy đường đang đi mà không đổi tiến trình.",
    },
    {
      id: "interact",
      title: "Tương tác và mở nhanh menu",
      body: "Đến gần người hoặc đồ vật rồi dùng E. J mở nhiệm vụ, I mở túi, P mở đội, M mở bản đồ và H mở hướng dẫn.",
    },
    {
      id: "protect",
      title: "Giữ an toàn cho hành trình",
      body: "Di chuyển chưa tự ghi save. Dùng Lưu vị trí trước khi rời trang; nếu dữ liệu lỗi, chỉ nút Phục hồi bản an toàn mới thay bản chính.",
    },
  ],
)

export function onboardingStepFromKey(
  current: number,
  key: string,
  nativeControl = false,
): number {
  if (nativeControl) return current
  if (key === "ArrowLeft") return Math.max(0, current - 1)
  if (key === "ArrowRight")
    return Math.min(AW2_ONBOARDING_STEPS.length - 1, current + 1)
  return current
}
