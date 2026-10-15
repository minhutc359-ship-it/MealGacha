# Web 5.8 · Bốn miền vị giác

Web 5.8 hoàn thiện các yêu cầu giao diện và nội dung Adventure, thay toàn bộ nhạc nền cũ, đồng thời nâng chất lượng video tuyệt kỹ. Bản cập nhật giữ nguyên khóa lưu, save schema cấp cao và ID của bốn map mở rộng để không làm mất tiến trình 5.7.

## Rương vị giác

- Hướng dẫn dài được thu vào nút `ⓘ`; nội dung chỉ mở khi rê chuột hoặc focus bàn phím.
- Hai lựa chọn hiển thị nằm thành một hàng riêng dưới nút mở rương, không còn đè lên sân khấu. `Hiện thẻ Vị Linh ở kết quả` mặc định tắt.
- Khi tắt, popup kết quả giữ ảnh món ăn và báo thẻ đã được cộng. Khi bật, cùng vị trí đó hiển thị thẻ Vị Linh cùng tiến trình hội ngộ.
- Popup kết quả đã được cân lại cho desktop, mobile và màn ngang thấp.

## Adventure mở rộng

- Sảnh làng giữ nguyên toàn bộ khung ảnh 3:2 thay vì dùng `cover`; phần dư của viewport dùng nền mờ riêng nên biển địa điểm và tọa độ chạm vẫn bám đúng bản đồ. Nhân vật cùng hai Vị Linh có motion đi bộ, đội hình theo bốn hướng và thời gian di chuyển theo quãng đường.
- Thêm bốn vùng có art chiến trường và hệ địch riêng: **Đỉnh Trà Mây**, **Lò Muối Đỏ**, **Đầm Sen Nguyệt** và **Điện Vạn Hương**. Mỗi vùng có sáu màn, bốn quái thường mới, một tinh anh và một boss riêng; tổng cộng 16 model địch mới được phân bố theo chiến dịch.
- Trước khi vào màn, người chơi chọn `NORMAL`, `HARD` hoặc `EXTREME`. HP, công và giáp địch nhân lần lượt `×1`, `×3`, `×8`; sao và tiến trình mở màn được lưu riêng cho từng chế độ. Tinh anh và boss ở Hard/Extreme có thêm hiệu ứng rút năng lượng, khống chế, phá giáp hoặc phản kích theo đặc trưng vùng.
- Không còn nút chọn mục tiêu trong trận hiện tại. Vị Linh tự tìm kẻ địch sống gần nhất theo tọa độ đội hình; save trận 5.1/5.2 vẫn đọc được mục tiêu cũ để tiếp tục đúng trạng thái.
- Ảnh nhân vật dẫn truyện trong banner hiển thị opacity 100%, bỏ lớp mask làm mờ. Hộp thoại truyện được neo chính giữa viewport ở desktop, mobile và landscape.

## Trình bày và media

- Dùng asset được duyệt cho làng, đội đồng hành, bốn chiến trường và các nhịp `READY`, `START`, `NEXT WAVE`, `WIN`, `FAIL`. Art nghi thức co theo cả chiều rộng và chiều cao arena để không bị phóng lớn hoặc cắt ở màn hình thấp. Khi thua, đồng minh chuyển sang pose gục; kết quả chỉ được quyết toán sau nhịp thắng/thua.
- Mỗi lần chuyển giữa TCG, Rương, Auto chess và Adventure đều hiện một màn chuyển cảnh chọn ngẫu nhiên từ năm minh họa. Loading trong Adventure dùng cùng bộ ảnh; tất cả dùng `object-fit: contain` để không phóng/cắt ảnh.
- Cả 139 video tuyệt kỹ được dựng lại ở **1280 × 720**, H.264 High Profile, CRF 18. Renderer chuyển khung PNG lossless vào encoder, dùng preset chậm và lọc nét nhẹ thay cho chuỗi JPEG + CRF 23 trước đây. Caption thay câu “Đồng hồ trận tạm dừng trong tuyệt kỹ” bằng mô tả ngắn riêng cho từng kỹ năng.

## Nhạc nền

- Bỏ 72 file nhạc cũ của TCG, Auto chess và Web 4.1. Thư viện mới gồm 13 bản nhạc nguyên bản: bốn theme theo mode, tám theme theo map và một theme boss dùng chung.
- Không còn lựa chọn 8-bit trong giao diện. Save cũ có `musicStyle: "8bit"` vẫn nhập được và tự chuẩn hóa về nhạc nguyên bản.
- Nhạc Adventure chuyển theo làng, map và boss; Chest, TCG và Auto chess dùng theme mode tương ứng.

## Tái tạo và tương thích

- `dev/tools/prepare-campaign580-assets.py` tái tạo WebP runtime và thông số sprite từ asset nguồn đã duyệt.
- `dev/tools/compose-music580.py` tái tạo 13 bản nhạc không dùng sample ngoài.
- `dev/tools/render-spirit530.ts` cùng `build-spirit-movies530.mjs` tái tạo video 720p.
- Không thêm runtime dependency. Không build hoặc đồng bộ Android/iOS trong bản web này.

Xem [BUDGET.md](BUDGET.md), [VERIFICATION.md](VERIFICATION.md), [art-assets.json](art-assets.json), [music-manifest.json](music-manifest.json) và [browser-qa.json](browser-qa.json).
