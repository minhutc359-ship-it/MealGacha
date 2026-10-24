# Báo cáo Adventure World 2 —24/10/2026

**Đã hoàn thành phần kỹ thuật AW2-006F: Phòng Lửa có nền gạch, ba vật giải đố riêng và năm điểm đến.** Source `4d463302f95a33788ac9cb9c8274f12b18d86281` trên `game/adventure-world-2`. [Cách chơi](PHONG_LUA.md).

- Nhãn chỉ rõ bước đã đúng, bước kế và gợi ý còn thiếu; cửa sang Phòng Bàn mở sau ba bước. Chọn điểm đến chỉ đi bộ, thao tác giải đố vẫn cần E/Tương tác.
- Đã xác minh giải sai/thử lại, reload giữa puzzle, đi hai chiều Phòng Lửa↔Phòng Bàn, báo Dì, nấu và chia bữa đúng tài nguyên/EXP. Map giữ một đại diện đầu đội, chiến đấu vẫn năm người; không cần reset save.
- Hai phòng có art tham chiếu; bốn vùng trước đó còn hình debug. Bàn gỗ và dấu lối ra dùng lại ảnh gốc của dự án.

**Kiểm chứng:**83ca unit riêng biệt (68ca giữ từ lượt đầu +15ca file đã sửa),72browser assertions (36source+36compiled), hai typecheck, build review và cách ly stable đạt. Bài test mới ban đầu có bốn lỗi so sánh metadata/tọa độ, đã sửa và chạy lại15/15; không sửa luật để qua test. Browser dùng checkpoint nhập môn earned nguyên văn rồi thực hiện thật phần còn lại; không phải full-story mới. [Bằng chứng](evidence/AW2-006F.md).

**Tiến độ vẫn demo90%, sản phẩm40% (ước lượng35–45%).** Mục tiêu PR kế tiếp theo D18 là **100%/45%**. 006F chưa tự đóng nghiệm thu tuyến world/UX; bước kế tiếp là [010C](tasks/AW2-010C.md) người chơi độc lập hoàn tất toàn hành trình và [011A](tasks/AW2-011A.md) desktop + ít nhất một điện thoại thật. Cần ghi kết quả/đóng blocker, rồi chạy full integration gate trước khi mở PR. [Checklist](PLAYTEST_100_CHECKLIST.md). Không suy ra kiểm tra điện thoại thật từ viewport hẹp; chưa mở PR/deploy/release.

Ảnh mới tạo bằng **built-in imagegen**: [PNG nền](../../dev/aw2/assets/environments/kitchen-hearth/v1/floor-source.png), [PNG puzzle](../../dev/aw2/assets/environments/kitchen-hearth/v1/puzzles-source.png), [prompts](../../dev/aw2/assets/environments/kitchen-hearth/v1/prompts.json), [provenance](../../dev/aw2/assets/environments/kitchen-hearth/v1/provenance.json). Hình tĩnh trung tính, chưa có hoạt ảnh lửa hoặc nghiệm thu art/rights/full environment.
