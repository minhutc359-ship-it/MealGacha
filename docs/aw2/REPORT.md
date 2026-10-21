# Báo cáo nhanh AW2

Cập nhật2026-10-22 · **scretary-agent** · game/adventure-world-2. Báo cáo theo task.

**Vừa hoàn tất AW2-007D:** boss Người Giữ Bàn Quên có ba cơ chế thật: Mời hụt quét vùng đã báo trước, Tắt bếp đếm ba nhịp, Ghế trống chặn bốn đòn đánh thường. Bảng cảnh báo cho biết mục tiêu/nhịp còn lại; hiển thị rõ ở320/390px và không che nút tuyệt kỹ. Biết chờ lớp bảo vệ vỡ trước khi dùng tuyệt kỹ gây sát thương giúp thắng nhanh hơn. Hình boss vẫn là tham chiếu, art riêng còn thiếu.

**Kiểm chứng mới:**1036 test/102 file PASS (243 AW2,10 mới);95 bước browser compiled PASS (26 boss,47 hành trình mới qua quest/hai mode/boss/hai kết thúc,22 trận mẫu). Hai typecheck, format, build AW2107 file≈34,7MB và stable/release guard/isolation PASS.9 mô phỏng dùng đúng seed boss PASS; lượt chơi mới thắng boss ở nhịp45. Full test/hành trình dùng core cuối, trước sửa nhỏ giao diện; type/build/26 gate boss kiểm tra phần sửa đó. Nguồn `910b55bf977557f11be03111afa40283df0fbcf1`; [bằng chứng và giới hạn](evidence/AW2-007D.md).

| Phạm vi | Hiện tại | Thay đổi |
|---|---|---|
| Demo web với art tham chiếu |**Khoảng90%** | Giữ9/10; cần ghi đủ phạm vi playtest |
| Sản phẩm đủ12 nhân vật |**Khoảng40%** | Giữ ước lượng35–45%; gate nhân vật/phát hành còn mở |
| Motion tham chiếu5 starter |**100% (5/5)** | Giữ160 cels; chưa là nhân vật hoàn chỉnh |

**Phản hồi người chơi:** owner đã chơi và “chưa thấy lỗi chặn”. Đã ghi nhận smoke trải nghiệm; chưa có phiên bản/thiết bị/các quest/hai kết thúc đã thử để đóng gate playtest đầy đủ. **0/12 full DoD**,5 bộ tham chiếu/7 bộ chưa tạo. Art riêng/cân bằng cuối/nghe âm thanh/thiết bị/FPS/offline/rights/save production/release còn mở. Boss nằm trong nhóm demo đã tính, nên không tự tăng % theo số test. [Cách tính](PROGRESS.md).

**Chơi phần mới:** `pnpm dev` → http://localhost:8443/dev/aw2/world.html → nhận nhiệm vụ cuối tại Dì → Phòng Bàn. Chọn tuyệt kỹ sau khi Ghế trống vỡ, rồi **Lưu kết quả và trở về**. [Hướng dẫn boss](BOSS_PRACTICE.md), [chạy local](LOCAL_TEST.md), [hành trình](DEMO.md).

**Tiếp theo:** [AW2-004I](tasks/AW2-004I.md) art/presentation riêng cho boss; BA/tester bổ sung phạm vi playtest và sửa lỗi tái hiện được. D11 PROPOSED/D12 OPEN; không deploy task này. [HANDOFF](HANDOFF.md), [STATUS](STATUS.md), [BACKLOG](BACKLOG.md), [TEST_LEDGER](TEST_LEDGER.md).
