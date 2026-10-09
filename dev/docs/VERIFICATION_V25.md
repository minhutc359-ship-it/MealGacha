# Kiểm chứng bản 2.5 · 07/10/2026

## Kiểm tra tự động của repository

- `npm run typecheck`: đạt.
- `npm test`: **97 tests / 10 files** đạt. Gồm chiến dịch 18 màn, kinh tế, bản lưu, battle coach, hoạt cảnh, thám hiểm và 4 bài mới về mở sổ văn hóa.
- `npm run validate:catalog`: **112 món / 35 tags / 9 events** hợp lệ; giữ pool Rương theo mùa.
- `npm run build`: đạt.
- `git diff --check`: đạt. Asset mới trong `public/assets/tcg/story/` có dữ liệu WebP thật và không đi qua LFS.

## Chromium / Playwright trên production build cục bộ

### Sổ văn hóa

- Bản lưu mới giấu cả sáu tên/ảnh/nội dung trang chưa mở; sổ thu gọn mặc định.
- Bản lưu hoàn thành lantern-2 chỉ mở trang Tết, đúng ảnh mới; phân biệt ký ức truyện và giới thiệu ngoài đời.
- Đổi Việt/Anh, đọc trang và copy bằng clipboard thật không thay đổi bản lưu. Nội dung copy chứa giới thiệu đang chọn và URL nguồn, không lấy đoạn hư cấu.
- Bản lưu v1 đã qua 18 màn tự mở sáu trang; mọi ảnh tải được, link nguồn dùng HTTPS với tab mới và `noopener`.
- Sổ không tràn ngang ở 1440, 768, 390 và 320 px; đã xem ảnh chụp desktop/điện thoại và tăng cỡ chữ vùng miền/nội dung.
- Thông báo trang mới xuất hiện sau khi đọc đoạn kết trận. Reload kết quả, đọc lại rồi về hành trình không cấp trùng xu, XP, tinh chất, vé, thẻ hay màn.
- Clipboard bị từ chối hiện thông báo copy thủ công, không crash hay viết bản lưu.

### Truyện và gợi ý trận

- Chương khóa giấu tranh, giới thiệu, tên đối thủ và manh mối.
- Cutscene đầu giải thích Vị Linh, đọc đủ mở nút vào trận; không viết bản lưu chỉ vì đọc.
- **18/18 cutscene trước trận** tải đúng tranh, gồm hai cảnh văn hóa riêng. Lùi/đọc nhanh không tạo tài nguyên.
- Kho truyện đọc lại trước/sau trận; cutscene 390 px nằm trong hộp thoại, giảm chuyển động tắt animation tranh.
- Gợi ý chỉ chọn và focus xác nhận/mục tiêu hợp lệ; Enter mới triệu hồi/đánh. Kiểm tra Hộ vệ, Chắn, phản đòn và chi phí bằng trạng thái thật.

### Bàn đấu / hiệu ứng

- **11 kích thước:** 1440×900, 1366×768, 1280×720, 1024×768, 768×1024, 390×844, 375×667, 360×640, 320×568, 844×390, 667×375.
- Với 3 quân mỗi bên và 8 lá trên tay: không tràn màn, không scroll bàn/arena khi nghỉ, chọn bài hoặc chọn mục tiêu.
- Kiểm tra focus không lọt vào menu phía sau bàn; Escape đóng hộp đọc bài/nhật ký/luật và trả focus. Thám hiểm có đủ 10 di vật trong hộp đọc.
- Sprite lửa/nước/khiên tải thật; hồi máu/cường hóa xuất hiện và hoàn tất theo trạng thái trận.

Các lượt này chạy trên bản build cục bộ, không phải khảo sát người chơi hoặc chứng minh khả năng viral. Nội dung truyền thống đã đối chiếu nguồn chính thức trong [tài liệu văn hóa](VIETNAMESE_CULTURE.md); chưa có vòng duyệt độc lập bởi nghệ nhân/cộng đồng thực hành.
