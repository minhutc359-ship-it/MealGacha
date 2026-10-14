# Ngân sách Web 5.6

Mốc so sánh là bản Web 5.3 đã kiểm thử, **87,262,374 bytes**. Guard 5.6 cho phép tăng tối đa 2,000,000 bytes; trần tổng web 100 MB và tổng JavaScript gzip 650 KB được giữ nguyên.

| Hạng mục | Byte |
|---|---:|
| Build 5.6 | 88,153,474 |
| Tăng từ 5.3 | **891,100 / 2,000,000** |
| Còn trong guard 5.6 | **1,108,900** |
| JavaScript gzip | **648,283 / 650,000** |
| CSS gzip | 97,897 |
| 5 minh họa chuyển cảnh | 871,556 |
| SVG bản đồ 07–12 | 4,902 |
| Tổng art Web 5.6 | 876,458 |

Năm ảnh được chuyển sang WebP 960 × 960, quality 76. Bản đồ 07–12 dùng SVG tĩnh 4,902 bytes thay vì nhúng toàn bộ markup vào JavaScript, nhờ đó giữ thêm khoảng trống cho guard gzip. Ảnh chỉ tải khi màn Adventure tương ứng hiển thị; mỗi chuyển cảnh chỉ chọn một ảnh.

Build vẫn vượt ngưỡng xem xét 80 MB do media của các bản trước, nhưng nằm dưới trần 100 MB. Không có source map, thư mục dev/archive hay tệp QA lọt vào `dist`. Số liệu lấy từ `dev/docs/release/build-size.json`.
