# Báo cáo nhanh AW2

Cập nhật 2026-10-21 · Người tổng hợp: **scretary-agent** · Nhánh `game/adventure-world-2`. [Mục scretary](../../skills/aw2/scretary-agent/README.md) dẫn về báo cáo này; không có tiến trình tự chạy nền.

**Vừa hoàn tất AW2-009C:** Auto Chess luyện tập đã chơi được: tuyển quân từ nguồn hữu hạn, ghép 2 sao, xếp/đổi đội hình, giao tranh tự động, tạm dừng/tiến từng nhịp và kết quả 5 vòng thật. Cả TCG và Auto Chess dùng tài nguyên mượn riêng; không tiêu túi đồ/nhận thưởng RPG. Quay về đọc checkpoint, tải lại bỏ ván, save đổi ở tab khác phải đọc lại.

| Phần | Tiến độ |
|---|---|
| Khám phá/truyện |6 zone thử nghiệm, 4 quest, đội 5 người, boss thật và hai kết thúc |
| Tiến trình | Save v4, túi đồ/EXP, rương, nấu/chia bữa; chống nhận quà lặp |
| Nhân vật |5 bộ tham chiếu, 7 bộ còn thiếu; chưa ai đạt đầy đủ tiêu chí hoàn thành |
| TCG / Auto Chess | Cả hai có ván luyện tập thật; thiết kế/cân bằng/art mode sản phẩm còn mở |
| Gacha | Đã mô phỏng; tỷ lệ/pity chưa duyệt, chưa có quay trong game |

**Xem thử:** `pnpm dev` → `/dev/aw2/world.html` → **Ghé nhanh Auto Chess → Chơi Auto Chess thử**. [Luật Chess](AUTO_CHESS_PRACTICE.md) · [TCG](TCG_PRACTICE.md).

**Kiểm thử mới:** 970 test (177 AW2) và 224 kiểm tra Chromium PASS; cả hai typecheck, formatter, build stable/review và cách ly PASS. Nguồn `ff499a5`; đã mở ảnh mobile/đội hình/giao tranh/kết quả. [Bằng chứng](evidence/AW2-009C.md).

**Còn bao lâu?** Ước lượng sơ bộ, tính từ hiện tại và không cộng dồn:

| Mốc | Khoảng còn lại |
|---|---|
| Web chơi thử trọn luồng |1–2 tuần làm việc liên tục |
| MVP đủ 12 nhân vật |6–10 tuần |
| Web đủ điều kiện phát hành ổn định |10–16 tuần |

Các khoảng giả định làm đều, có art/QA hỗ trợ và duyệt nội dung nhanh, giữ nguyên phạm vi web chơi đơn. Chưa phải ngày cam kết; nền tảng/phạm vi phát hành còn cần chốt. Nút thắt chính là art/hoạt ảnh 12 nhân vật, map/NPC/boss, cân bằng, thiết bị/hiệu năng và quyền sử dụng. [Giả định và đường đi chi tiết](DELIVERY_PLAN.md).

**Tiếp theo:** [AW2-010A](tasks/AW2-010A.md) — rà một lượt chơi mới qua RPG/TCG/Chess, hướng dẫn và sửa lỗi chặn demo. Art/nhân vật/gacha theo phê duyệt, production save, QA thiết bị và release gates còn mở.

Chi tiết: [HANDOFF](HANDOFF.md) · [STATUS](STATUS.md) · [BACKLOG](BACKLOG.md) · [TEST_LEDGER](TEST_LEDGER.md).
