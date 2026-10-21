# Phần trăm hoàn thiện AW2

2026-10-21 · BA/scretary · Owner yêu cầu ước lượng theo %. Đây là chỉ báo lập kế hoạch với phạm vi/cách tính công khai, không phải phê duyệt phát hành hoặc phần trăm công sức đã đo. Bản web chơi đơn là giả định hiện tại; D12 nền tảng/monetization còn mở. [REPORT](REPORT.md) là bản tóm tắt.

## Demo với art tham chiếu

Trước AW2-010A: **8/10 nhóm tiêu chí đã kiểm chứng, khoảng80%**. Hai nhóm còn lại là kiểm tra liên hoàn/hướng dẫn người mới và playtest độc lập. Sau AW2-010A: **9/10 nhóm tiêu chí PASS, khoảng90%**. Nguồn và bản biên dịch đều hoàn tất lượt chơi mới thực tế; nhóm còn lại là playtest độc lập và đóng lỗi dùng thử. [Bằng chứng](evidence/AW2-010A.md).

| Nhóm tiêu chí demo, mỗi nhóm10 điểm | Bằng chứng/trạng thái |
|---|---|
| Nhập môn, nhận trực tiếp5 starter | PASS development,013A/009C |
| Đi lại6 zone, va chạm/đường về | PASS development,013A/009C |
| Ký ức, puzzle,4 quest | PASS development,013A/009C |
| Rương/túi đồ/EXP/nấu/chia bữa | PASS development,013A/009C |
| Boss thật, ghi chép/hai kết thúc | PASS development,013A/009C |
| TCG luyện tập có luật/kết quả thật | PASS009B, regressed009C |
| Auto Chess luyện tập có luật/kết quả thật | PASS009C |
| Save riêng, vào/ra/reload/stale không phá tiến trình | PASS development,009A/B/C |
| Hành trình mới liên hoàn/hướng dẫn/bàn phím trên source+compiled | PASS010A source43/compiled43 kiểm tra liên hoàn;10 điểm |
| Người chơi độc lập thử trải nghiệm và đóng lỗi chặn demo | NOT_RUN; chưa tính điểm |

Đây là tỷ lệ nhóm tiêu chí có trọng số ngang nhau; các nhóm không có cùng số giờ thực hiện. Demo cho phép5 bộ tham chiếu, map/NPC/boss tạm và mode tài nguyên mượn; phạm vi này không thay thế tiêu chí12 nhân vật của sản phẩm. Tự động hóa và ảnh đã mở không phải một người chơi độc lập đã thử.

## Sản phẩm đầy đủ theo phạm vi12 nhân vật

Ước lượng **khoảng40%**, nên đọc như khoảng **35–45%** với độ tin cậy thấp. Trọng số và điểm dưới là đánh giá BA về khối lượng/gate còn lại, chưa được hiệu chỉnh bằng vận tốc nhiều sprint. Số task/test xanh không được dùng làm mẫu số.

| Nhóm công việc | Trọng số | Điểm tạm ghi nhận | Cơ sở |
|---|---:|---:|---|
| Nền runtime/combat/save/tích hợp |25 |20 | Luật thật, checkpoint/progression và hai practice đã chạy; production durability/hoàn thiện còn mở |
| Arc thế giới/quest/dungeon |15 |10 |6 zone/4 quest/boss/hai kết thúc hoạt động; map/NPC/boss riêng và polish còn thiếu |
|12 nhân vật đủ DoD/art/animation/kit |30 |5 |5 bộ mới là tham chiếu,7 bộ chưa tạo; **0/12 đạt đầy đủ DoD** |
| UX/presentation/audio |10 |3 | Có điều khiển/touch/opt-in và hướng dẫn; UI/game art còn cần hoàn thiện/playtest |
| Kinh tế/mode sản phẩm/gacha/cân bằng |10 |2 | Kinh tế/practice còn là development tuning; D11 chưa duyệt, gacha runtime/thu thập mode chưa làm |
| Gate phát hành: thiết bị/hiệu năng/offline/save production/rights |10 |0 | Các gate đầy đủ còn NOT_RUN/mở; chưa có phát hành |
| **Tổng** |**100** |**40** | **Ước lượng theo khối lượng, không phải chứng nhận chất lượng** |

Hoàn tất một test mới có thể làm tỷ lệ demo tăng mà điểm sản phẩm giữ nguyên: art/nội dung/gate phát hành vẫn còn phần lớn công việc. Chỉ nâng điểm nhóm khi có artifact và bằng chứng đúng phạm vi; không coi portrait hoặc approved proposal là nhân vật hoàn thành. Xem [CANON](CANON.md), [STATUS](STATUS.md), [TEST_LEDGER](TEST_LEDGER.md).

Scretary cập nhật hai chỉ báo sau mỗi mốc có thay đổi thực chất, giữ mốc gốc/cách tính và ghi lý do điều chỉnh. Sau nhân vật đầu tiên đủ DoD và playtest demo, BA/tester điều chỉnh trọng số/ước lượng thời gian trong [DELIVERY_PLAN](DELIVERY_PLAN.md); không suy ra ngày hẹn từ40% hoặc90%.


## AW2-004C measurement update

Than có thêm32 khung chuyển động/tám trạng thái, đã kiểm chứng source+compiled và boss thật; [bằng chứng](evidence/AW2-004C.md), [gate từng phần](THAN_CHARACTER_GATES.md). Bốn lần gọi image_gen tạo hai bản đầu bị loại vì khoảng cách ô và hai bản sửa được chọn. Đây là số đo của một gói motion, chưa phải thời gian hoàn thiện/kiểm duyệt một nhân vật. Art độc lập, cân bằng/cấp độ cuối, nghe âm thanh, thiết bị/quyền sử dụng còn mở. **0/12 full DoD, demo≈90% và sản phẩm≈40% giữ nguyên**; không tự cộng điểm chỉ vì tăng số khung/test. Tiếp theo004D Lửa Nhỏ; chưa có dữ liệu vận tốc để siết lịch12 nhân vật.
