# Báo cáo nhanh AW2

Cập nhật2026-10-21 · **scretary-agent** · game/adventure-world-2. Báo cáo theo từng task, không chạy nền.

**Vừa hoàn tất AW2-004G:** Sương Lành thêm32 khung/tám trạng thái. Đạn, ba nhịp vùng, làm chậm và kéo hiển thị theo kết quả thật; nhiều mục tiêu cùng nhịp không khởi động lại hiệu ứng. Có [hướng dẫn chạy local](LOCAL_TEST.md).

**Kiểm chứng mới:**69 test liên quan/8 file và113 bước browser PASS (41 nguồn+42 biên dịch Sương,12 Lam+14 Mộc Non renderer,4 startup local). Hai typecheck, kiểm tra asset/build lại riêng và build AW2 PASS. Hai lỗi fixture sửa rồi chỉ chạy lại7 case,62 case khác đã pass giữ nguyên. Full suite/quest/save/mode/stable không đổi giữ PASS ở SHA gốc004E, không chạy lại/cộng vào số mới. Nguồn `489ce7162df7db11b1b1954d0b0a62b4d073fe17`; [bằng chứng](evidence/AW2-004G.md).

| Phạm vi | Hiện tại | So với mốc trước |
|---|---|---|
| Demo web với art tham chiếu |**Khoảng90%** | Giữ nguyên9/10 nhóm; còn playtest độc lập |
| Sản phẩm đầy đủ12 nhân vật |**Khoảng40%** | Giữ nguyên, ước lượng35–45%; còn gate nhân vật/phát hành |
| Riêng bộ motion tham chiếu5 starter |**100% (5/5)** | Tăng từ80%; đây chưa là nhân vật hoàn chỉnh |

**0/12 nhân vật đủ DoD**,5 bộ tham chiếu/7 bộ chưa tạo;160 cels motion tổng. Bốn ảnh đã mở cho thấy đấu trường/chữ còn chồng nhau. Art độc lập/cân bằng/audio binding-nghe thử/thiết bị/hiệu năng/offline/rights/save production/release còn mở. Review build≈34,7MB, chưa deploy. [Cách tính](PROGRESS.md), [gate Sương](SUONG_CHARACTER_GATES.md).

**Chạy thử:** `pnpm dev` → http://localhost:8443/dev/aw2/world.html. Xem motion tại `/dev/aw2/starters.html?spirit=aw2-suong`, combat tại `/dev/aw2/battle.html`. [Các bước cài/chạy/điều khiển](LOCAL_TEST.md).

**Tiếp theo:** [AW2-004H](tasks/AW2-004H.md), bố trí đấu trường/nhân vật/thanh máu/chữ trạng thái dễ đọc hơn. Tiếp tục chỉ test phần thay đổi/phụ thuộc. D11 PROPOSED, D12 OPEN. [HANDOFF](HANDOFF.md), [STATUS](STATUS.md), [BACKLOG](BACKLOG.md), [TEST_LEDGER](TEST_LEDGER.md).
