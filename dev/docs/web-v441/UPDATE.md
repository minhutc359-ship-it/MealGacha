# Soul of Meal Web 4.4.1 · Gói hình ảnh & animation

## Thay đổi khi chơi

Năm đấu trường mới có cùng phong cách minh họa và bố cục sân trống, chọn theo cảnh chơi. Nội dung gốc Soul of Meal; không nhập hình, soundtrack hoặc nhân vật Pokémon. Nhân vật/Vị Linh chiến đấu tiếp tục dùng các atlas động chung TCG/Auto đã có, không đổi sang chân dung tĩnh.

| Hệ / đấu trường | TCG | Auto chess | Adventure |
|---|---|---|---|
| Ember / bếp than hoàng hôn | Chương Triều Lửa | Đội thiên về Ember | Cầu Triều Lửa |
| Tide / sân bến sau mưa | Bến mưa, công thức Bến nước | Đội thiên về Tide | Bến Sau Mưa |
| Grove / vườn thảo mộc | Vườn, công thức Vườn | Đội thiên về Grove | Vườn Lá Thơm |
| Hearth / sân làng trống đồng | Sân mặc định / bàn nhà | Đội thiên về Hearth | Phố Đèn Lồng |
| Sugar / sân đèn trăng | Chương trăng / công thức Trăng, Tết | Đội thiên về Sugar | Bàn Trăng |

Mưa/lá/than/bụi sáng theo cảnh. Auto giữ các ô, vòng trống đồng và độ tương phản quanh quân; nền nằm dưới Canvas và các ô tương tác. Không tải cả bộ đấu trường trước; mỗi màn chỉ tham chiếu nền đang sử dụng.

Atlas VFX gồm năm hàng theo hệ và năm frame từ lõi đến tan biến. Canvas pha trộn hai frame liền kề, giữ hiệu ứng thủ tục làm nền và làm fallback khi ảnh chưa giải mã. TCG, Auto và Adventure dùng cùng texture/cache lease. Auto tối đa bốn impact bitmap mỗi frame; đồ họa nhẹ/adaptive light không vẽ texture này, reduced motion không phát các burst động. VFX kết thúc theo clock trình bày, không thêm state React từng frame hay thay thời gian simulation.

Lả, người bán hàng và Bà giữ bếp có atlas chibi bốn hướng × bốn tư thế, dựa trên đúng chân dung trong project. NPC xoay về người chơi khi ở gần và có nhịp idle nhỏ, dừng ở reduced motion/đồ họa nhẹ. NPC không đổi vị trí, collision, nhiệm vụ hoặc vật phẩm; atlas không thêm AI đi đường cho NPC. Hero/đầu bếp/Vị Linh giữ các model và animation chung hiện có.

Giữ Giới thiệu ẩn/hiện chú thích và bố cục Adventure một viewport, nút hướng/Tương tác trên màn hình cùng các bảng nổi. Phần âm thanh và tối ưu renderer của 4.4 vẫn có trong cùng PR.

## Nguồn và dung lượng

Tạo ảnh bằng **image_gen.imagegen (built-in)**, chuyển WebP với ffmpeg. Bộ prompt/reference và đường dẫn sản phẩm cuối nằm trong [artwork.json](artwork.json); kiểm tra alpha/frame trong [asset-qa.json](asset-qa.json). Registry quyền có mục riêng cho cả chín ảnh, không tự gán CC0. Asset là byte ảnh thật trong Git, không phụ thuộc LFS fetch khi triển khai.

Ngân sách tăng thêm **5.590.000 byte**, tính MB thập phân và gồm tất cả tăng trưởng output build. Baseline 4.4.0 **64.407.117 byte**, trần đợt này **69.997.117 byte**; trần toàn web 100 MB giữ nguyên. `release:size` kiểm tra guard này khi version là 4.4.1, cùng guard JS gzip 650 KB và leak.

## Kiểm chứng và phạm vi

403 kiểm thử / 40 file: thêm kiểm tra cắt atlas đúng hệ, pha trộn/opacity hữu hạn, không vẽ ngoài cửa sổ impact hoặc trước decode. Typecheck app/dev, catalog/assets, release records và build sạch được chạy. Máy local dùng hai worker/timeout 20s cho các mô phỏng dài; giữ nguyên assertion/kịch bản, CI dùng lệnh mặc định.

Chromium 1440×900, 390×844, 844×390: cả chín ảnh giải mã; NPC ngoài trời/nội thất; năm nền Adventure theo vùng; nền TCG/Auto thực sự có trong UI; Canvas vẽ cả năm hệ; instrumentation xác nhận cả ba chế độ có gọi vẽ texture mới (TCG 162, Auto 4.251, Adventure 509 lần trong mẫu, không phải số đo FPS); low graphics; bốn demo ẩn chú thích vừa màn hình; không JS error trong mẫu và save trước/sau demo giữ nguyên. Dữ liệu trong [browser-qa.json](browser-qa.json). Không có API/database mới trong luồng này: chọn scene → URL asset → giải mã → Canvas/CSS. Chưa kiểm tra Safari hay điện thoại thật; không cam kết FPS cố định.

Web only; không sửa/sync/build Android/iOS. Không đổi save schema, luật, phần thưởng hay progression. Bổ sung vào PR #34 đang mở, không tự merge.

Build sạch cuối: **69,956,770 byte**, tăng **5,549,653 / 5.590.000 byte**; còn **40,347 byte**. JS gzip **611,029 / 650.000 byte**, CSS gzip **90,709 byte**; 438 file, 0 leak. Bộ ảnh mới **5.546.714 byte**; cả tăng trưởng JS/CSS và output khác vẫn trong phần tăng thêm 5,59 MB. 339 asset trong registry, 143 tham chiếu / 0 thiếu.

Ảnh chụp QA cho Adventure, Auto chess và atlas impact có thể tái tạo từ harness nên không được lưu trong cây mã nguồn.
