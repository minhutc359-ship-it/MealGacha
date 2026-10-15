# Ngân sách Web 5.8

Mốc so sánh là build Web 5.6 đã kiểm thử, **88,153,474 bytes**. Web 5.8 cho phép tăng tối đa 172,000,000 bytes để giữ chi tiết cho toàn bộ video tuyệt kỹ 720p theo yêu cầu; trần tổng web được nâng có kiểm soát lên 260 MB. Guard JavaScript gzip là 675 KB.

| Hạng mục | Byte |
|---|---:|
| Build 5.8 | **255,436,263** |
| Tăng từ 5.6 | **167,282,789 / 172,000,000** |
| Còn trong guard 5.8 | **4,717,211** |
| JavaScript gzip | **656,981 / 675,000** |
| CSS gzip | 100,433 |
| 139 video H.264 1280 × 720 | 181,753,360 |
| 13 bản nhạc MP3 mới | 9,440,084 |
| Art chiến dịch/làng runtime mới | 8,986,528 |

Để bù một phần dung lượng, 72 file nhạc cũ (khoảng 26 MB trên source tree) đã được loại khỏi sản phẩm. Mỗi lần chuyển cảnh chỉ tải một ảnh; video tuyệt kỹ chỉ được preload cho tối đa năm thành viên đội hiện tại.

Build không có source map, thư mục dev/archive hoặc tệp QA. Cảnh báo xem xét trên 245 MB là dự kiến và vẫn nằm dưới trần 260 MB. Số liệu lấy từ `dev/docs/release/build-size.json`.
