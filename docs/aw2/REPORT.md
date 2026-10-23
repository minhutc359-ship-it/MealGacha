# Báo cáo Adventure World 2 —23/10/2026

**Đã hoàn thành AW2-007N: đo đội hình ở EXP thực tế và cải thiện việc thử đội.** Source `PENDING007N` trên `game/adventure-world-2`.

- **Vai trò/chỉ số đội đang chọn:** xem Máu/Công/Thủ theo cấp chung; gợi ý khi thiếu người đỡ đòn, hồi phục hoặc sát thương chuyên trách. Vân giữ Hybrid; Mộc/Mộc Non tách đúng identity.
- **Chọn đội khởi đầu:** trở lại năm starter trong draft, giữ nhấn Vân; bấm Lưu mới áp dụng, Hủy trả về đội lưu. Không cấp nhân vật/EXP/items hoặc sửa ending.
- **Kết quả lượt đấu này:** hiện số đồng đội còn đứng và máu boss thực còn lại sau thắng/thua/rút lui; phần hiển thị không tự ghi save.

Đã đo **96lượt xác định** =16đội×205/345EXP×3policy. Starter vẫn vượt boss ở EXP thực tế, không cần UR. Canh tuyệt kỹ giúp một số đội, nhưng không có policy tốt nhất cho mọi đội; không sửa chỉ số để ép tất cả thắng. [Kết quả/cách dùng](PARTY_GUIDE.md).

**Kiểm chứng mới:**73ca unit liên quan/3files (17mới),60browser assertions=30source+30compiled,96mô phỏng PASS; hai typecheck/final review build/fresh stable isolation đạt. Browser dùng nguyên văn checkpoint ending đã kiếm được từ007M, rồi thao tác native draft/cancel/lỗi ghi/retry/reload/tab cũ và win/loss/retreat thật; không phải một lượt full-story mới. Full1401unit/deep art/combat/save/mode và stable build giữ bằng chứng ref gốc theo309hash không đổi, không cộng vào số mới. Full current-head suite NOT_RUN theo phạm vi advisory/presentation. [Bằng chứng](evidence/AW2-007N.md).

| Chỉ báo | Hiện tại | Lý do |
|---|---:|---|
| Demo với art tham chiếu | **≈90%** | Giữ nguyên; còn1gói playtest độc lập toàn hành trình và sửa blocker |
| Toàn sản phẩm12nhân vật | **≈40%**, khoảng35–45% | Giữ nguyên; baseline/hướng dẫn mới chưa đóng nghiệm thu cân bằng/full-character/device/rights |
| Kit/bộ hình tham chiếu | **12/12mỗi nhóm** | Giữ nguyên |
| Nhân vật qua đầy đủ DoD | **0/12** | Các gate độc lập còn mở |

**Tiếp theo:**[AW2-006B](tasks/AW2-006B.md) — đặc tả rồi làm hình môi trường Phòng Bàn và UX khám phá, nối boss/rematch với một phòng có art riêng. Gói1 đã có baseline/hướng dẫn nhưng cân bằng cuối vẫn mở; [4gói đề xuất tới≈50%](NEXT_MILESTONES.md) chưa được cấp điểm. D11gachaPROPOSED/D12OPEN.
