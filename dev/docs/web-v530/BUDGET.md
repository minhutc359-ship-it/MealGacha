# Ngân sách Web 5.3

Mốc so sánh là head Web 5.2 đã kiểm thử, **78,398,477 bytes**. Phần tăng mới được người dùng cho phép **5–10 MB**; guard đặt tối đa **10,000,000 bytes**, bao gồm cả code và các tệp sản phẩm tăng thêm. Trần web 100 MB và JS gzip 650 KB giữ nguyên.

| Hạng mục | Byte |
|---|---:|
| Build 5.3 | 87,262,374 |
| Tăng từ 5.2 | **8,863,897 / 10,000,000** |
| Còn trong ngân sách | **1,136,103** |
| JS gzip | **646,796 / 650,000** |
| CSS gzip | 95,823 |
| Media + dữ liệu mô tả mới trong sản phẩm | 8,830,499 |
| 139 video + 139 âm thanh | 8,374,184 |
| Atlas pháp ấn | 449,332 |
| Mô tả kỹ năng JSON | 6,983 |
| Atlas cảnh giới nguồn, chỉ dev | 523,312 (không vào build) |

Video H264 512×288 / 24 fps / khoảng 2.4s, MP3 mono 24 kHz / 32 kbps. Có 20 họ hiệu ứng, phối riêng cho từng nhân vật bằng minh họa, pose, pháp ấn và motif. Nguồn cảnh giới chỉ dùng khi dựng phim để tránh tải trùng ảnh đã xuất vào video. Không thêm runtime dependency; source/ảnh QA/sample có âm nằm ngoài dist.

Sản phẩm vượt ngưỡng xem xét 80 MB và vẫn dưới trần 100 MB. Đã rà soát cách tải: chỉ làm nóng đội hình tối đa năm người, không nạp cả 139 phim/âm; media cache có giới hạn, một video đang giải mã, dùng chung mixer/cache âm thanh, giải phóng src khi đóng. Đã kiểm phát từ build sản xuất, âm thanh khi ON/OFF video và byte range 206 khi offline.

Gộp luật/helper dùng chung, UI RPG thành nhóm riêng và giữ Pixi tải theo nhu cầu, giảm lặp gzip thay vì nâng trần. Kết quả cuối lấy từ `dev/docs/release/build-size.json`, guard `visual-budget.json`. Không có dev/archive/QA/source map lọt vào dist. Media có kiểm giải mã và SHA tại [media-qa.json](media-qa.json), registry quyền sử dụng ghi đủ 635 asset.
