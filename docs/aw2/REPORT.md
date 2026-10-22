# Báo cáo nhanh AW2

2026-10-22 · **scretary-agent** · game/adventure-world-2 · Product development.

**Vừa hoàn tất007E:** Muối Đen đã có bốn kỹ năng thật, cấp1–20 và màn luyện5 người riêng. Dấu giảm công20% trong6 nhịp, gia hạn có cap10; ultimate bóc nửa khiên thường rồi gây sát thương. Có chọn mục tiêu, tẩy dấu thử counter và hiệu ứng/âm thanh theo kết quả thật. Thu thập Muối/đội lưu trong hành trình còn chờ contract riêng.

**Đã kiểm chứng:**1068 unit test,174 bước browser và24 mô phỏng PASS; hai typecheck, review+stable build/isolation PASS. Vì sửa shared combat core nên chạy full unit một lần; các PASS asset/save/mode không đổi giữ bằng chứng gốc.2 bước browser cuối chỉ kiểm tra caption, không chạy lại172 bước đã qua. [Chi tiết](evidence/AW2-007E.md), nguồn `e1f023d391a2fcf14ab07b7a436b3bd0ad7d6cbd`.

| Phạm vi | Hiện tại | Cơ sở |
|---|---|---|
| Demo web | **≈90% (9/10)** | Còn nghiệm thu hành trình đầy đủ bởi người chơi |
| Sản phẩm đầy đủ12 nhân vật | **≈40% (35–45%)** | Giữ nguyên; còn nhiều nội dung/art/collection/gate phát hành |
| Bộ tham chiếu nhân vật | **6/12 (50%)** | Còn6 bộ thiếu, **0/12 full DoD** |

**Chạy local:** `pnpm dev` → http://localhost:8443/dev/aw2/battle.html?team=muoi. [Cách thử kỹ năng](MUOI_PRACTICE.md), [chơi hành trình](LOCAL_TEST.md). Số liệu là thử nghiệm; art/nghe âm thanh/thiết bị/rights/release vẫn mở.

**Tiếp theo:** [004K Nhiên](tasks/AW2-004K.md), bộ tham chiếu riêng theo identity đã duyệt. [Product plan](PRODUCT_PLAN.md), [gate Muối](MUOI_CHARACTER_GATES.md), [HANDOFF](HANDOFF.md), [tiến độ/cách tính](PROGRESS.md). D11 PROPOSED/D12 OPEN.
