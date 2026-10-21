# Báo cáo nhanh AW2

Cập nhật 2026-10-21 · **scretary-agent** · `game/adventure-world-2`. [Mục scretary](../../skills/aw2/scretary-agent/README.md) dẫn về đây; không có tiến trình chạy nền. Sau mỗi mốc cập nhật đều báo hai tỷ lệ dưới, kể cả khi giữ nguyên.

**Vừa hoàn tất AW2-004E:** Lam Lam có thêm32 khung chuyển động/tám trạng thái. Đạn chỉ hiện impact theo hit thật; hai nhịp hồi máu không lặp theo từng đồng đội, không mất khi trùng hành động khác và không hiện lại khi bật reduced motion. Ảnh/âm thanh gốc, luật combat và save giữ nguyên.

**Kiểm chứng:**1007 test (214 AW2) và471 kiểm tra Chromium cuối PASS; hai typecheck, build stable/AW2, kiểm tra asset/build lại/save PASS. Nguồn `cf0b394`; [bằng chứng và các lỗi đã sửa](evidence/AW2-004E.md). Review build≈29,8MB, chưa deploy/release. Arena còn chữ/nhân vật chồng nhau; art, telegraph, âm thanh hit/nhịp heal vẫn cần hoàn thiện.

| Phạm vi | Hiện tại | So với mốc trước |
|---|---|---|
| Demo web với art tham chiếu |**Khoảng90%** | Giữ nguyên9/10 nhóm; còn playtest độc lập và đóng lỗi dùng thử |
| Sản phẩm đầy đủ12 nhân vật |**Khoảng40%** | Giữ nguyên, ước lượng35–45%; chưa đóng gate nhân vật/phát hành |

[Chi tiết cách tính](PROGRESS.md). **0/12 đủ DoD:**5 bộ tham chiếu,7 bộ chưa tạo. **3/5 starter có bộ32 khung:** Than, Lửa Nhỏ, Lam Lam; đây là tiến triển motion, chưa phải ba nhân vật hoàn tất. [Than](THAN_CHARACTER_GATES.md) · [Lửa Nhỏ](LUA_CHARACTER_GATES.md) · [Lam Lam](LAM_CHARACTER_GATES.md).

**Xem ngay:** `pnpm dev` → `/dev/aw2/starters.html?spirit=aw2-lam`; `/dev/aw2/world.html` chơi demo. [Cách chơi](DEMO.md).

**Tiếp theo:** [AW2-004F](tasks/AW2-004F.md), chuyển động Mộc Non và hiệu ứng hỗ trợ theo event thật. Kiểm duyệt art độc lập,7 bộ thiếu/map/NPC/boss, playtest, cân bằng, thiết bị/hiệu năng/offline/âm thanh/quyền sử dụng/save production vẫn mở. D11 gacha runtime chưa duyệt; D12 chưa chốt. [Ước lượng có điều kiện](DELIVERY_PLAN.md).

[HANDOFF](HANDOFF.md) · [STATUS](STATUS.md) · [BACKLOG](BACKLOG.md) · [TEST_LEDGER](TEST_LEDGER.md).
