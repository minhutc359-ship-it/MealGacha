# Báo cáo nhanh AW2

Cập nhật 2026-10-21 · **scretary-agent** · `game/adventure-world-2`. [Mục scretary](../../skills/aw2/scretary-agent/README.md) dẫn về đây; không có tiến trình tự chạy nền.

**Vừa hoàn tất AW2-004D:** Lửa Nhỏ có thêm32 khung cho8 trạng thái HD, giữ nguyên ảnh/âm thanh gốc và các ID đã duyệt. Hai nhịp hit trong trận thật giờ chỉ phát đúng hình/FX của từng hit đã xác nhận; không phát cú thứ hai khi bị hủy hoặc lặp lại cú đầu. Builder cũng đã tách khỏi manifest Than để tránh kế thừa nhầm khung khi build lại.

**Kiểm chứng:**996 test (203 AW2) và385 kiểm tra Chromium PASS; hai typecheck, build stable/build AW2, kiểm tra asset và save đều PASS. Nguồn `cef55c0`; [bằng chứng và các lỗi đã sửa](evidence/AW2-004D.md). Review build khoảng28MB, chưa deploy/release. Arena còn nhân vật/chữ chồng nhau; art, telegraph và âm thanh hit thường còn phần cần hoàn thiện.

| Phạm vi | Hiện tại | Cách hiểu |
|---|---|---|
| Demo web với art tham chiếu |**Khoảng90%** |9/10 nhóm tiêu chí; còn playtest độc lập và sửa lỗi dùng thử |
| Sản phẩm đầy đủ12 nhân vật |**Khoảng40%** | Ước lượng35–45%; art/cân bằng/thiết bị/phát hành còn nhiều gate mở |

[Chi tiết cách tính](PROGRESS.md). **0/12 đầy đủ DoD:**5 bộ tham chiếu,7 bộ chưa tạo. Than và Lửa Nhỏ có32 khung mới mỗi người; cần kiểm duyệt độc lập và đóng đủ các phần còn thiếu trước khi tính là nhân vật hoàn tất. [Than](THAN_CHARACTER_GATES.md) · [Lửa Nhỏ](LUA_CHARACTER_GATES.md).

**Xem ngay:** `pnpm dev` → `/dev/aw2/starters.html?spirit=aw2-lua` xem Lửa Nhỏ; `/dev/aw2/world.html` chơi demo. [Cách chơi](DEMO.md).

**Tiếp theo:** [AW2-004E](tasks/AW2-004E.md), chuyển động Lam Lam, projectile và hai nhịp hồi máu. Kiểm duyệt art Than/Lửa Nhỏ, các starter còn lại/7 bộ thiếu, playtest, thiết bị/hiệu năng/offline/âm thanh/quyền sử dụng/save production vẫn mở. Gacha runtime chờ D11; phạm vi/nền tảng D12 chưa chốt.

Ước lượng có điều kiện vẫn là demo1–2 tuần, MVP12 nhân vật6–10 tuần, web ổn định10–16 tuần làm liên tục/có art và QA; [giả định](DELIVERY_PLAN.md), chưa phải ngày cam kết.

[HANDOFF](HANDOFF.md) · [STATUS](STATUS.md) · [BACKLOG](BACKLOG.md) · [TEST_LEDGER](TEST_LEDGER.md).
