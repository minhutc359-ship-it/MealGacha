# Giao diện TCG gọn trong màn hình · 2.8.1

Mục tiêu: từ sảnh vào trận, chọn chương hoặc sửa bộ bài mà không phải lướt qua một trang giới thiệu dài. Các thay đổi dựa trên master đã merge PR #14 và #15; giữ bản đồ minh họa, nhân vật anime và hai phong cách nhạc.

| Màn hình | Thay đổi |
| --- | --- |
| Sảnh | Một khung hành trình hiện tại, ba nút chế độ và ba lối tắt bộ bài/gói thẻ/nhiệm vụ. Điểm danh và vào chơi nằm ngay trong khung. |
| Điều hướng | Header và thanh điều hướng giữ vị trí. Điện thoại có năm nút chính, menu mở các chế độ còn lại, cài đặt, hướng dẫn và Rương vị giác. Rail trên tablet có nút cài đặt/hướng dẫn/Rương. Đổi tab hoặc Back đặt vùng nội dung về đầu. |
| Chiến dịch | Chọn một trong sáu chương và chỉ hiện ba màn của chương đó. Desktop đặt bản đồ cạnh chương; điện thoại mở bản đồ trong dialog, chọn điểm để đổi chương trực tiếp. Nhật ký và văn hóa Việt Nam mở riêng. Mô tả chương có thể mở để đọc trên màn hình thấp. |
| Trước trận | Đọc truyện trước, rồi nhấn “Chọn cách nhập trận”. Bước chuẩn bị giữ lựa chọn Can đảm/Thấu hiểu, phần thưởng và nút vào trận; gợi ý/luật boss mở khi cần. Không tự chuyển bước trước khi người chơi đọc câu cuối. |
| Thư viện & Xưởng | Các trang thẻ tự tính số cột/hàng từ vùng còn lại bằng ResizeObserver; không render cả 152 lá thành danh sách dọc. Search luôn hiện, bộ lọc mở riêng, trang trước/tiếp luôn ở dưới vùng thẻ. Lọc đặt lại trang đầu, thay kích thước giới hạn trang hợp lệ. |
| Bộ bài | Desktop đặt thẻ và danh sách nháp cạnh nhau. Mobile chuyển giữa “Thêm thẻ”/“Trong bộ”; nút lưu và đếm 18 lá luôn ở trên. Gợi ý chiến thuật, phân tích/đường năng lượng/combo mở riêng; giữ thử tay bài, bưu thiếp và mọi thao tác thêm/bỏ/trang bị/xóa. |
| Bạn bên bếp | Chọn một trong năm nhân vật thay vì xếp năm hồ sơ nối tiếp; thử thách tuần ở tab riêng. |
| Gói thẻ, nhiệm vụ, cài đặt | Chọn gói để xem một ưu đãi; thương nhân mở khi cần. Tách nhiệm vụ ngày/dấu mốc. Tách Âm thanh/Tiến trình/Trải nghiệm; JSON là mục mở thêm, mã tiến trình vẫn có đầy đủ thao tác. |

Khung chính dùng `100dvh`, vùng nội dung có `min-height: 0`, navigation riêng và safe-area dưới thanh mobile. Nội dung đọc dài, nhật ký, nhiệm vụ dài và danh sách thẻ trong bộ vẫn cho phép cuộn trong vùng của chúng. Không thu nhỏ toàn bộ ứng dụng bằng transform, không khóa nội dung đọc hoặc xóa tính năng để đạt một ảnh chụp vừa màn hình. Thẻ nhỏ giữ tên/giá/chỉ số; chi tiết đầy đủ nằm trong dialog.

## Kiểm chứng

- TypeScript, production build, 133 kiểm thử trong 14 file và catalog 112 món / 35 tag / 9 sự kiện đạt.
- Chromium/Playwright trên production build: sảnh, chiến dịch, thư viện, xưởng và bộ bài kiểm tra 1440×900, 1366×768, 1280×720, 1024×768, 768×1024, 390×844, 375×667, 360×640, 320×568, 844×390 và 667×375; dùng bộ sưu tập đủ 152 thẻ và chiến dịch đã hoàn thành. Không cuộn trang/vùng thẻ, không tràn ngang, nút chính nằm trong viewport.
- Bàn đấu đầy sáu quân, tay tám lá, chọn bài/chọn mục tiêu, focus, nhật ký, luật đấu và VFX lửa/nước/hồi/buff/khiên đạt trên cùng 11 kích thước. Header/menu phía sau trận inert.
- Đọc truyện và chuẩn bị boss cuối kiểm tra sáu kích thước từ 320×568 đến 1440×900, cả ngang: không cuộn dialog hoặc thân dialog, nút đọc và vào trận hiện đủ. Mở toàn bộ lời thoại hoặc gợi ý dài là thao tác đọc riêng.
- Phân trang/search/filter/empty/inspect, thêm-bỏ-lưu bộ bài 18 lá, gợi ý/phân tích, khóa chương, chọn mở đầu Thấu hiểu vào trận thật, bản đồ đổi chương, nhật ký/văn hóa, menu, browser Back và focus sau Escape được kiểm tra.
- Năm nhân vật, tab thử thách tuần vào trận thật, tất cả gói, hai nhóm nhiệm vụ và ba nhóm cài đặt/mã tiến trình/JSON đều truy cập được. Không lỗi JavaScript chưa xử lý trong các luồng kiểm tra.

Không đổi reducer chiến đấu, luật thưởng, schema lưu hoặc cơ chế mã hóa. Không thêm dependency runtime. Kiểm tra trình duyệt dùng bản production cục bộ; trạng thái build Vercel được xem riêng qua GitHub.
