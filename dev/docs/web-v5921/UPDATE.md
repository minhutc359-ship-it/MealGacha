# Web 5.9.21 · Model và VFX Vị Linh

Bốn Vị Linh món Việt đang dùng portrait tĩnh được nâng lên model chiến đấu 32 pose. Bốn nhân vật ưu tiên của 5.9.17 cũng có VFX sơn riêng thay cho việc chỉ dùng hiệu ứng theo hệ.

| Vị Linh | Nhận diện giữ từ portrait canon | VFX riêng |
|---|---|---|
| Canh măng miến | Bạch lân có gạc vàng, giáp teal, song kiếm bạc | Song kiếm bạc, dải teal và tia gạc vàng |
| Giò xào | Long nhân đỏ-trắng, áo đen-đỏ viền vàng, quyển thư | Dải long hỏa cuộn thư |
| Thịt đông | Hồ ly nữ trắng-đỏ, tóc đen, trâm đỏ-vàng, quyển thư | Hai dải hồ vĩ và ấn vàng |
| Chè khúc bạch | Bạch lộc, trang sức tinh thể tím, áo trắng-tím, quyển thư | Tinh thể tím và vòng nguyệt bạc |
| Lẩu riêu cua | Giữ nguyên bộ model 5.9.17 | Thương vàng, sen ngọc và gợn đồng |
| Nướng BBQ | Giữ nguyên bộ model 5.9.17 | Phượng vũ lửa và tàn than |
| Vịt quay | Giữ nguyên bộ model 5.9.17 | Hồ điệp đỏ-trắng và cánh hoa |
| Bibimbap | Giữ nguyên bộ model 5.9.17 | Thương vàng, lá xanh và hạt sáng |

## Sản xuất và tích hợp

- Built-in Imagegen tạo tám sheet 4×4 theo bốn portrait gốc: idle, walk, attack, cast, ultimate, hit, fall, victory; bốn pose mỗi trạng thái. Packer chỉ đăng ký pixel đã vẽ, không tạo pose bằng xoay/kéo ảnh. Inspector kiểm tra file WebP cuối, alpha, gutter, điểm đặt chân, frame khác nhau và hash.
- Tám model atlas nằm tại `public/assets/characters/spirits5921/`: mỗi ID có HD 1024×2048 và pixel 256×512. Portrait cũ giữ nguyên ô và file; không thêm portrait trùng lặp.
- Hai atlas VFX 1024×768, mỗi atlas bốn cột × ba pha chuẩn bị/tác động/tan biến. File `spirits5917/ultimate.webp` hoàn thiện nhóm cũ; `spirits5921/ultimate.webp` dành cho nhóm mới. `signature: none` chỉ tắt motif hình học; atlas sơn vẫn được chọn bởi `effectColumn`.
- Dùng compositor hiện có ở ba chế độ, không thêm bộ hiển thị hoặc video. Bốn ID mới hiện có ở TCG/Adventure; roster Auto Chess không thêm quân. Auto Chess tiếp tục dùng manifest/compositor chung cho các ID trong roster.
- Banner Adventure ở màn hình 320 px thu gọn phần portrait và giữ tên/nhãn trên một dòng; tên tuyệt kỹ dài không còn làm banner chiếm quá nửa sân.
- Giữ contact Adventure 300/380/960 ms và TCG 560 ms, logic tác động, pause/skip/reload và reduced motion. Hiệu ứng theo hệ tiếp tục thể hiện kết quả trên từng mục tiêu; VFX riêng là một lớp nhấn gọn.
- Không đổi ID gameplay, catalog, chỉ số, kỹ năng, điều kiện mở khóa, party khởi đầu, schema, collection, tiến trình hoặc networking. Giữ âm thanh từng ID hiện có. Không thêm dependency runtime hoặc tăng ngân sách.

## Tài liệu kiểm tra

Prompt chính xác, hash và crop nguồn: `asset-provenance.json`, `identity-sources.json`, `vfx-provenance.json`. Bộ tạo/đóng gói: `dev/tools/pack-campaign598.py`, `dev/tools/pack-spirit-vfx5921.py`. Các file ảnh nguồn mặc định của Imagegen được dùng để tạo atlas; game chỉ sử dụng WebP đã đóng gói.

Xem `VERIFICATION.md` và `ROADMAP_STATUS.md` để biết phạm vi đã kiểm chứng và phần còn lại. Chỉ web; chủ dự án kiểm tra thiết bị vật lý, review và quyết định merge.
