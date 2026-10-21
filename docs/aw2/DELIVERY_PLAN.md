# Ước lượng hoàn thiện AW2

Cập nhật 2026-10-21 · BA/scretary · **Ước lượng sơ bộ có điều kiện, chưa phải ngày cam kết hoặc quyết định phát hành.** Các mốc dưới tính từ hiện trạng đã kiểm chứng, không cộng dồn từng khoảng. D12 còn mở về nền tảng/tên/monetization; web trước là giả định lập kế hoạch, không phải owner approval mới.

| Mốc | Khoảng thời gian còn lại | Điều kiện hoàn thành |
|---|---|---|
| Web chơi thử trọn luồng |1–2 tuần làm việc liên tục | RPG→TCG→Auto Chess→quay về; hướng dẫn dễ hiểu; quest/boss/hai kết thúc/save hoạt động; không có lỗi chặn luồng. Cho phép art tham chiếu và chưa có gacha runtime |
| MVP theo phạm vi12 nhân vật |6–10 tuần làm việc liên tục | Đủ12 nhân vật qua DoD; map/NPC/boss có art/animation phù hợp; kinh tế/cân bằng/UX được thử; gacha chỉ có nếu D11 được duyệt; hồi quy trên các thiết bị mục tiêu |
| Web đủ điều kiện phát hành ổn định |10–16 tuần làm việc liên tục | Đóng lỗi nghiêm trọng, đo tải/FPS/bộ nhớ/offline, migrations/save production, kiểm tra quyền sử dụng; chốt phạm vi/nền tảng và owner duyệt phát hành |

Đây là khoảng lập kế hoạch với độ tin cậy **thấp–trung bình**; không có dữ liệu vận tốc nhiều sprint hoặc đội art/QA được phân bổ để chốt lịch chắc chắn. Giả định một lập trình viên làm đều, có năng lực art/animation và QA tham gia thường xuyên, phản hồi duyệt nội dung trong1–2 ngày làm việc, giữ phạm vi12 nhân vật/arc hiện tại. Thời gian chờ người duyệt/asset/thiết bị cộng thêm theo thực tế. Nếu một người phải tự làm toàn bộ code, art và QA, hoặc chỉ làm gián đoạn, cần ước lượng lại. Các phiên Codex không tự chạy liên tục khi cuộc trò chuyện đã kết thúc.

Giả định phát hành web chơi đơn, lưu cục bộ; không tính tài khoản/cloud save, PvP/server, thanh toán, vận hành dịch vụ hoặc native Android/iOS/store. Nếu bổ sung các phần này, phải chia task/thiết kế và ước lượng riêng trước khi nhận mốc phát hành. Không thể suy ra đã hoàn thiện sản phẩm từ số test xanh hoặc số task VERIFIED; nhiều gate vẫn chỉ là development subset.

## Cơ sở và đường đi còn lại

Đã có nền6 zone/4 quest, đội5 người, boss thật/hai kết thúc, save v4/túi đồ/EXP/nấu ăn và TCG luyện tập. AW2-009C bổ sung Auto Chess thực tế qua cùng adapter; kết quả kiểm chứng nằm trong [REPORT](REPORT.md)/[ledger](TEST_LEDGER.md). Hai mode mượn tài nguyên riêng và chưa có phần thưởng/tiến trình sưu tập. Thông số hiện tại còn là thử nghiệm.

1. **Chốt demo — AW2-010A:** kiểm tra một lượt mới từ nhập môn qua RPG và cả hai mode, onboarding/quay lại/dừng ván, chỉnh lỗi chặn luồng. Dự trù3–5 ngày cho tích hợp/hướng dẫn và2–5 ngày cho playtest/sửa lỗi; không tự đánh dấu đủ12 nhân vật.
2. **Nhân vật/art — AW2-004 và phần còn lại006/007:**7 bộ chưa tạo;5 bộ hiện có chỉ là tham chiếu và đều `fullCharacterComplete=false`. Hoàn thiện lore/kit/leveling, chibi4 hướng, HD8 trạng thái, portrait, projectile/impact/ultimate, âm thanh và provenance cho từng người. Map/NPC/boss riêng còn thiếu. Đây là đường găng lớn nhất; cần đo thời gian thực tế của1 nhân vật hoàn chỉnh trước khi siết mốc6–10 tuần.
3. **Cơ chế và nội dung hoàn thiện:** kiểm thử/cân bằng các đội12 nhân vật, dungeon, kinh tế/phần thưởng, UX; duyệt D11 trước runtime gacha nếu giữ phần đó trong MVP. Không tự áp tỷ lệ đề xuất. Chốt tiêu chí mode sản phẩm nếu muốn vượt bộ luyện tập mượn hiện tại.
4. **Release gate — AW2-011:** trình duyệt/thiết bị thật, hiệu năng/offline/âm thanh, migration/save production không phá dữ liệu, quyền sử dụng art/audio và full regression. Owner duyệt trước deploy/release; làm xong code không tự đóng các gate này.

**Cách cập nhật ước lượng:** sau demo AW2-010A và sau nhân vật đầu tiên đạt đầy đủ DoD, BA/tester đối chiếu công sức thực, lỗi còn mở và thời gian duyệt; scretary cập nhật REPORT/bản này. Không báo phần trăm hoàn thành giả định hoặc ngày hẹn không có cơ sở. [STATUS](STATUS.md), [BACKLOG](BACKLOG.md), [CANON](CANON.md), [HANDOFF](HANDOFF.md) là nguồn phạm vi/gate.
