# Báo cáo nhanh AW2

2026-10-22 · **scretary-agent** · game/adventure-world-2.

**Vừa hoàn tất004K:** Nhiên có bộ tham chiếu riêng: portrait,16 world,32 HD/tám trạng thái,16 FX và4 cue âm thanh. Basic có2 nhịp, ultimate3 cue riêng và recovery. Màn xem có7 nhân vật; Nhiên chưa có kỹ năng thật/leveling/collection. Muối vẫn có kit thật ở trận luyện riêng.

**Kiểm chứng mới:**80 test/6file,104 bước browser, hai typecheck và review build PASS. Source browser giữ44PASS, chỉ chạy4 case còn lại sau sửa assertion alias; compiled48+onboarding8PASS. Giữ bằng chứng combat/save/mode/stable không đổi, không lặp full suite. [Chi tiết](evidence/AW2-004K.md), nguồn `22877ba16e52d70d5447a5870452e3acebe114af`.

| Phạm vi | Hiện tại | Thay đổi |
|---|---|---|
| Demo web | **≈90% (9/10)** | Giữ nguyên; còn playtest hết hành trình |
| Sản phẩm12 nhân vật | **≈40% (35–45%)** | Giữ nguyên; art/kit/collection/gate phát hành còn nhiều |
| Bộ hình tham chiếu | **7/12≈58%** | Tăng từ6; còn5 bộ thiếu, **0/12 full DoD** |

**Dự kiến:** MVP12 nhân vật **6–10 tuần làm việc đều**; web đủ điều kiện phát hành **10–16 tuần**, có art/QA thường xuyên và duyệt kịp thời. Độ tin cậy thấp, chưa phải ngày hẹn; chỉ làm gián đoạn cần ước lượng lại. Demo kỹ thuật đã chơi được. [Giả định/đường găng](DELIVERY_PLAN.md).

**Xem local:** `pnpm dev` → http://localhost:8443/dev/aw2/roster.html?spirit=aw2-nhien. [Hướng dẫn](LOCAL_TEST.md), [gate Nhiên](NHIEN_CHARACTER_GATES.md). **Tiếp theo:**[007F](tasks/AW2-007F.md), actual melee/3contact/energy cap/recovery. [HANDOFF](HANDOFF.md), [product plan](PRODUCT_PLAN.md), [tiến độ](PROGRESS.md). Chưa deploy/release; D11 PROPOSED/D12 OPEN.
