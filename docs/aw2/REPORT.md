# Báo cáo nhanh AW2

Cập nhật 2026-10-21 · **scretary-agent** · `game/adventure-world-2`. [Mục scretary](../../skills/aw2/scretary-agent/README.md) dẫn về báo cáo này; không có tiến trình tự chạy nền.

**Hoàn thiện được bao nhiêu?**

| Phạm vi | Hiện tại | Cách hiểu |
|---|---|---|
| Demo web với art tham chiếu |**Khoảng90%** |9/10 nhóm tiêu chí đã kiểm chứng; còn playtest độc lập và đóng lỗi dùng thử |
| Sản phẩm đầy đủ12 nhân vật |**Khoảng40%** | Ước lượng có trọng số, khoảng35–45%; art/nội dung/cân bằng/gate phát hành còn nhiều |

[Chi tiết cách tính và trọng số](PROGRESS.md). Demo tăng từ80% lên90% sau gate liên hoàn; điểm sản phẩm giữ khoảng40%. **0/12 nhân vật đạt đầy đủ DoD:**5 bộ hiện có là tham chiếu,7 bộ chưa tạo.

**Vừa hoàn tất AW2-010A, phần kỹ thuật:** đi từ save trống qua nhập môn, bốn lượt TCG/Chess bằng ghé nhanh và cổng, ký ức/puzzle/rương/nấu/chia, boss thật và cả hai kết thúc. Đã sửa bắt phím ngoài bản đồ, Enter cho nút di chuyển và focus sau đóng hội thoại; mục tiêu nằm trước bản đồ, có hướng dẫn tùy mở và lý do nấu ăn bị khóa khi đứng xa.

**Kiểm thử mới:**982 test (189 AW2),171 kiểm tra Chromium PASS; cả hai typecheck/format/build/cách ly PASS. Nguồn `e7aedac`; lỗi phát hiện và các lần kiểm tra thất bại được giữ trong [bằng chứng](evidence/AW2-010A.md). Save/schema/luật chiến đấu/phần thưởng/asset/gacha không đổi; các mode không tiêu hoặc thưởng tài nguyên RPG.

**Chơi thử:** `pnpm dev` → `/dev/aw2/world.html`, đọc **Mục tiêu trước mắt** và mở hướng dẫn. [Cách chơi demo](DEMO.md).

**Tiếp theo:** [AW2-004C](tasks/AW2-004C.md) — character/animation chốt và bổ sung phần thiếu của Than theo đầy đủ DoD, đo công sức trước khi nhân rộng. Playtest độc lập, art12 nhân vật/map/NPC/boss, cân bằng, thiết bị/hiệu năng/offline/quyền sử dụng/save production vẫn mở. Gacha runtime chờ D11; nền tảng/phạm vi phát hành D12 chưa chốt.

Mốc thời gian trước vẫn là ước lượng có điều kiện: demo1–2 tuần, MVP12 nhân vật6–10 tuần, web phát hành10–16 tuần, giả định làm liên tục/có art và QA. [Giả định/đường đi](DELIVERY_PLAN.md); không suy số ngày còn lại từ phần trăm.

[HANDOFF](HANDOFF.md) · [STATUS](STATUS.md) · [BACKLOG](BACKLOG.md) · [TEST_LEDGER](TEST_LEDGER.md).
