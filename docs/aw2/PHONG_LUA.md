# Chơi thử Phòng Lửa — AW2-006F

Bản phát triển tại source `PENDING006F`, sau D18. Phòng Lửa và Phòng Bàn đã có hình môi trường riêng; bốn vùng còn lại vẫn dùng terrain debug. Đây là bộ hình tham chiếu và luồng kỹ thuật đã kiểm chứng, chưa nghiệm thu world/UX độc lập hoặc điện thoại thật.

Chạy `pnpm dev`, mở `http://localhost:8443/dev/aw2/world.html`. Tiếp tục save AW2 đang có; không cần reset. Để đi đúng luồng nhiệm vụ: hoàn tất nhập môn và ba ký ức ở Phố, nhận **Mở lại bếp** tại Dì ở Sân, đi qua Kho rồi vào Phòng Lửa. Save/địa chỉ/cổng thử nghiệm có hướng dẫn tại [LOCAL_TEST](LOCAL_TEST.md).

- Ba hình riêng lần lượt là lối hơi, nồi và bếp than. Chúng là hình tĩnh trung tính; trạng thái thật nằm trong nhãn và nút mục tiêu.
- Chọn một trong năm điểm đến chỉ đi bộ. Khi tới gần, bấm **E / Tương tác** rồi chọn thao tác; việc chạm hình hoặc tới nơi không giải puzzle, không mở hội thoại và không tự lưu.
- Chưa đọc gợi ý: nút hướng dẫn quay về **Bảng dấu hơi** trong Kho. Cửa sang Phòng Bàn khóa tới khi giải đủ ba bước. Đường về Kho luôn mở.
- Sau khi đọc gợi ý: **Mở lối thoát → Đặt nồi → Nhóm lửa**. Nút ghi rõ bước đã đúng, bước kế hoặc bước chưa tới. Chọn sai thứ tự thử lại từ đầu, không mất vật phẩm. Reload giữ bước đã lưu; bếp đã giải không bị làm lại.
- Giải xong có thể đi sang Phòng Bàn rồi quay về. Báo Dì để hoàn tất nhiệm vụ trước khi nấu/chia bữa tại bếp hoặc nhận thử thách boss tiếp theo.
- Map chỉ hiển thị nhân vật đầu đội đã lưu; đội lưu/chiến đấu vẫn đủ năm người.

Nền gạch và atlas ba vật puzzle được tạo bằng **built-in imagegen**. [PNG nền](../../dev/aw2/assets/environments/kitchen-hearth/v1/floor-source.png), [PNG atlas](../../dev/aw2/assets/environments/kitchen-hearth/v1/puzzles-source.png), [prompts](../../dev/aw2/assets/environments/kitchen-hearth/v1/prompts.json), [provenance](../../dev/aw2/assets/environments/kitchen-hearth/v1/provenance.json). Bàn gỗ/dấu lối ra dùng lại ảnh gốc006B/006C; không tạo thêm collision. Quyền sử dụng vẫn REVIEW_REQUIRED/NOT_CLEARED.

[Kiểm chứng006F](evidence/AW2-006F.md), [Phòng Bàn](PHONG_BAN.md), [checklist nghiệm thu độc lập100%/45%](PLAYTEST_100_CHECKLIST.md). Chỉ cộng điểm D18 sau lượt người chơi độc lập và baseline desktop + điện thoại thật; viewport hẹp không thay cho thiết bị thật.
