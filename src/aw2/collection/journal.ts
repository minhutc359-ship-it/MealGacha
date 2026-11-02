import type { CombatSpiritId } from "../combat/roster"
/** Describes implemented behavior; names and immutable slot IDs come from manifests. */
export const JOURNAL_SKILLS: Record<CombatSpiritId, readonly string[]> = {
  "aw2-than": [
    "Một đòn cận chiến vào mục tiêu trong tầm.",
    "Tạo khiên hữu hạn cho bản thân.",
    "Sau khi khiên hết, một đòn làm yếu mục tiêu; có hồi nội tại.",
    "Bảo vệ đồng minh trong vùng quanh Than.",
  ],
  "aw2-lua": [
    "Hai nhịp cận chiến, từng nhịp cần mục tiêu còn hợp lệ.",
    "Tiến bước ngắn rồi đánh trong tầm.",
    "Giữ cùng mục tiêu để tích nhấn; đổi mục tiêu mất chuỗi.",
    "Lướt và đánh theo đường đã chọn; có thể bị ngắt.",
  ],
  "aw2-lam": [
    "Giọt nước bay tới một mục tiêu, chỉ gây sát thương khi chạm.",
    "Chữa đồng minh bị thương trong tầm.",
    "Phần chữa vượt máu tối đa tạo khiên có giới hạn.",
    "Chữa đồng đội quanh Lam Lam theo hai nhịp; không hồi sinh.",
  ],
  "aw2-moc-non": [
    "Lá bay gây sát thương đơn mục tiêu.",
    "Đặt một lớp khiên lên đồng minh.",
    "Hỗ trợ hai đồng minh khác nhau tạo nhịp hỗ trợ hữu hạn.",
    "Mỗi đồng minh sống nhận một lần chống ngắt hữu hạn.",
  ],
  "aw2-suong": [
    "Dải hơi bay tới mục tiêu đơn.",
    "Tạo vùng hơi sương gây sát thương theo nhịp.",
    "Địch trong vùng nhận làm chậm ngắn; có hồi theo mục tiêu.",
    "Đánh vùng đường thẳng và kéo mục tiêu được phép.",
  ],
  "aw2-muoi": [
    "Hạt muối bay tới một mục tiêu.",
    "Đánh dấu địch hợp lệ và giảm lực đánh của nó.",
    "Đòn trúng gia hạn dấu tới giới hạn thời gian.",
    "Gây sát thương và gỡ một phần khiên thường; không xóa barrier boss.",
  ],
  "aw2-nhien": [
    "Hai điểm chạm cận chiến với hồi động tác riêng.",
    "Quét phía trước theo hướng đã chốt.",
    "Đánh các mục tiêu khác nhau hồi năng lượng trong giới hạn.",
    "Ba điểm chạm riêng; mục tiêu chết hoặc ngắt có thể chặn nhịp sau.",
  ],
  "aw2-hai": [
    "Gạt sóng cận chiến theo mục tiêu.",
    "Tạo vùng bảo vệ hữu hạn quanh Hải.",
    "Đồng minh gần thấp máu mở lớp bảo vệ có hồi nội tại.",
    "Tạo tuyến chắn trước đội theo vị trí hiện tại.",
  ],
  "aw2-lien": [
    "Hạt sen gây sát thương đơn, không tự chữa cùng đòn.",
    "Chữa đồng minh theo các nhịp hữu hạn.",
    "Chữa đồng minh có debuff tạo một lần chống ngắt có hồi.",
    "Tẩy một debuff được phép và chữa hai nhịp; không hồi sinh.",
  ],
  "aw2-moc": [
    "Lá bay gây sát thương đơn mục tiêu.",
    "Đặt dấu vùng hữu hạn, gây sát thương theo nhịp.",
    "Đổi vị trí dấu tạo lợi thế ngắn, không cộng vùng vô hạn.",
    "Kết tụ các dấu hợp lệ thành đợt sát thương vùng.",
  ],
  "aw2-bach": [
    "Đòn cận chiến chậm có điểm chạm rõ.",
    "Tạo vỏ khiên hữu hạn cho bản thân.",
    "Hấp thụ đủ ngưỡng chia khiên cho đồng minh gần; có hồi.",
    "Đổi phần khiên cá nhân còn lại thành bảo vệ đội và sát thương.",
  ],
  "aw2-van": [
    "Đòn tầm xa vào một mục tiêu hợp lệ.",
    "Bảo vệ đồng minh bị đe dọa và nối dấu với địch hợp lệ.",
    "Kết thúc liên kết tạo hiệu ứng hữu hạn theo kết quả hỗ trợ.",
    "Dùng một nhấn bảo hộ hoặc tấn công đã lưu trước trận; chung năng lượng.",
  ],
}
