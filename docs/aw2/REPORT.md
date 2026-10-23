# Báo cáo Adventure World 2 —24/10/2026

**Mục tiêu mới cho PR tích hợp kế tiếp:** demo **100%**, sản phẩm **45%**. Tiến độ có bằng chứng hiện tại vẫn demo **90%** và product **40%**; chưa cộng trước. [AW2-014A](tasks/AW2-014A.md) yêu cầu hoàn thiện/nghiệm thu tuyến Phòng Lửa→Phòng Bàn, một người chơi độc lập đi trọn hành trình và baseline desktop + ít nhất một điện thoại thật, rồi mới mở PR AW2→`rpg`. Tiếp theo vẫn là [AW2-006F](tasks/AW2-006F.md); AW2-010C/AW2-011A đang READY.

**Đã hoàn thành AW2-006D: hình chibi đứng bốn hướng riêng cho Người Giữ Bàn Quên trên map.** Source `7124bed958ee5cfa537fa3a021b4f03836e19544` trên `game/adventure-world-2`.

- Boss quay về phía người chơi, giữ nguyên vị trí/điểm đặt chân; nhãn nằm dưới hình. Bốn tư thế đứng tham chiếu, chưa có hoạt ảnh đi/đánh.
- Sau chiến thắng trước ending, boss mờ như trước; sau ending hiện đầy đủ để đấu lại. Hình HD/FX trong trận giữ nguyên.
- Map vẫn chỉ có một nhân vật đại diện đầu đội; vào trận vẫn đủ năm người. Không cần reset save.

**Kiểm chứng:**59ca unit/5files và52browser assertions PASS; hai typecheck/review build/cách ly stable đạt. Đã kiểm tra bốn hướng, thắng boss thật/đọc ghi chép/reload, lối ra/lối tắt/đấu lại-rút lui và thiếu atlas→khôi phục. Dùng checkpoint earned nguyên văn, không phải full-story mới;393hash giữ bằng chứng phần không đổi. [Chi tiết](evidence/AW2-006D.md), [cách xem](PHONG_BAN.md).

**Tiến độ giữ nguyên:** demo **≈90%**, sản phẩm **≈40%(35–45%)**,12kit/12bộ tham chiếu/**0fullDoD**. Bốn idle poses chưa đóng full-enemy/world, playtest độc lập, thiết bị hoặc rights.

**Tiếp theo:**[AW2-006F](tasks/AW2-006F.md), nền/hình tương tác và chỉ đường trong Phòng Lửa liền kề; năm vùng trước Phòng Bàn còn debug. D11gachaPROPOSED/D12OPEN; [bốn gói tới≈50%](NEXT_MILESTONES.md) còn nghiệm thu.

Ảnh tạo bằng **built-in imagegen** với portrait gốc của dự án làm tham chiếu: [atlas PNG](../../dev/aw2/assets/forgotten-host/world-v1/world-source.png), [WebP](../../dev/aw2/assets/forgotten-host/world-v1/world.webp), [prompt nguyên văn](../../dev/aw2/assets/forgotten-host/world-v1/prompts.json), [provenance](../../dev/aw2/assets/forgotten-host/world-v1/provenance.json). Rights REVIEW_REQUIRED/commercial NOT_CLEARED.
