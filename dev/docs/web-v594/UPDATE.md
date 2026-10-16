# Soul of Meal Web 5.9.4 — bốn Vị Linh P1

Tiếp nối nhánh Web 5.9.3 theo `../web-v591/PLAN_SOURCE.md`: Bún chả, Bún riêu, Bánh xèo và Cơm gà. Năm starter trong save vẫn là Cơm tấm, Bánh mì, Phở bò, Bánh cuốn và Gỏi cuốn tôm thịt; đợt này không thay party khởi đầu, cơ chế, chỉ số, kỹ năng, sát thương, điều kiện mở khóa hay phần thưởng. Các màn chuyển trạng thái typography và hệ thống cleanup đã có được giữ lại.

## Nhận diện và phần đã tích hợp

Đối chiếu catalog Auto Chess và sprite v4 trước khi vẽ. Cả bốn ảnh Spirit 5.1 cũ không khớp loài của model/catalog; thay đường dẫn runtime sang chân dung riêng, giữ artwork món ăn và tranh thẻ đã phù hợp.

| ID | Nhận diện | Chuyển động / VFX |
| --- | --- | --- |
| bun-cha | Hồ ly nâu đỏ chắc người, giáp than/đồng, khăn cam, khiên tre đan, đoản xoa ba chấu | Bước có trọng lượng, chắn khiên, vung xoa; đan tre và nút ngọc bảo vệ. Khác hồ ly Bánh mì dùng song kiếm |
| bun-rieu | Giáp cua đỏ cà chua, mũ mai khía, càng bất đối xứng, khăn xanh | Bước thấp, nâng/kẹp càng; cặp nguyệt càng và dòng hút thủy lưu |
| banh-xeo | Hỏa điểu vàng, mào lông vuốt, cánh quạt bán nguyệt gân lá, thương lá ngắn | Bước nhẹ, mở quạt cánh, chém ngắn; cung cánh giòn và lá xanh. Không có mào đỏ của gà |
| com-ga | Kim kê chắc người, mào/yếm đỏ, khăn teal, cánh trắng vàng, trường kích lá xanh | Hành quân, nâng và bổ kích; đường kích cùng bốn tia lông nắng |

- Mỗi nhân vật có 32 ô pose / tám trạng thái vật lý: idle, walk, attack, cast, ultimate, hit, death/fall, victory. Summon/guard/stun dùng pose tương thích sẵn có, không tính là animation được vẽ thêm.
- Adventure chiến đấu dùng atlas pixel 256×512, ô 64×64 và nearest sampling; Auto Chess/TCG dùng atlas HD 1024×2048, ô 256×256. Tất cả tra theo cùng Character ID và manifest. Không thêm NPC hoặc đổi party trên bản đồ chỉ để trưng bày asset.
- Sửa ảnh nguồn tràn VFX sang ô bên cạnh; tạo các ô hành động rộng riêng để giữ vũ khí. Công cụ đóng gói chỉ crop, tách component actor, chuẩn hóa độ phân giải, pivot và nén; không vẽ lại bằng code. Model mới không mang sẵn hào quang kỹ năng.
- Chân dung standalone 512×512 đi qua `SpiritArt`; quy tắc giữ tỷ lệ vuông áp dụng theo metadata thay vì kiểm tra tên đầu bếp.
- Bốn motif hình học có cấu trúc khác nhau cho đòn thường, thi triển và hiệu ứng nhận hồi phục/khiên. Tuyệt kỹ có ba frame VFX riêng cho mỗi nhân vật, dùng atlas chung 4×3 để tiết kiệm request.
- Tuyệt kỹ native hiện có: preparation 0, casting 360, impact 960, finisher 1500, recovery 1980, kết thúc 2400 ms. Một actor và một VFX chính; texture hoặc geometry fallback được chọn độc quyền. SFX hiện có được phối lại để impact tại 960 ms. Combat reducer vẫn giữ kết quả đã cam kết; lớp trình bày đồng bộ contact và không thi triển lại khi skip/reload.
- Bỏ bốn MP4 cũ không còn gọi, tổng **5.502.936 byte**; không nhân bản video. Roster còn lại tiếp tục dùng media tải theo yêu cầu. Công cụ kiểm thử media cũ đổi fixture sang các nhân vật còn dùng MP4.
- Gộp nhóm mã engine chung và presentation để giảm phần gzip lặp; Pixi vẫn ở chunk tải theo yêu cầu. Giữ nguyên giới hạn JS 675.000 byte, tổng build cảnh báo 300 MB / trần 320 MB và giới hạn cache ảnh/audio/SW.

## Asset được bổ sung

Thư mục runtime `public/assets/characters/familiar594/`:

| Nhân vật | Model HD | Pixel combat | Chân dung |
| --- | --- | --- | --- |
| Bún chả | bun-cha.webp | bun-cha-pixel.webp | bun-cha-portrait.webp |
| Bún riêu | bun-rieu.webp | bun-rieu-pixel.webp | bun-rieu-portrait.webp |
| Bánh xèo | banh-xeo.webp | banh-xeo-pixel.webp | banh-xeo-portrait.webp |
| Cơm gà | com-ga.webp | com-ga-pixel.webp | com-ga-portrait.webp |

Thêm `ultimate.webp`: 12 ô VFX, ba giai đoạn × bốn bản sắc. Tổng 13 WebP, 272 ô/ảnh đã kiểm tra alpha và hash, gồm 128 ô HD, 128 ô pixel, bốn chân dung và 12 VFX. Bốn MP3 được cập nhật tại đường dẫn cũ, không thêm bản sao. Chi tiết byte/hash ở `asset-qa.json`; prompt, nguồn và SHA-256 ở `artwork.json`, `repairs.json`, `actions.json`, `support-artwork.json`. Ảnh nguồn nháp có VFX đã bị thay và không được phân phối trong build.

## Giới hạn và phần tiếp theo

Đây là một đợt tích hợp P1 cho bốn Vị Linh, chưa phải nghiệm thu toàn bộ Web 6.0. Chưa có rig skeletal/mesh, chạy riêng hoặc lip-sync. Pixel chiến đấu là biến thể nearest của pose HD; chỉ tạo bộ đi bốn hướng riêng khi nhân vật thực sự được dùng để khám phá. Cần chơi thử trên điện thoại/máy yếu để đánh giá độ mượt, trọng lượng chuyển động và độ đọc vũ khí ở kích thước thật.

Tiếp theo: các nhóm roster, tinh anh và boss theo plan; tiếp tục nâng những thẻ hiện dùng artwork thay cho model hoạt họa đầy đủ. Audit hash/model không chứng minh hai artwork không giống nhau về mặt thị giác. Mười ba chứng cứ quyền của tài nguyên cũ còn pending và không được tự xác nhận đã xử lý. Xem kết quả thực đo trong `VERIFICATION.md` và danh sách module trong `CHANGED_FILES.md`.
