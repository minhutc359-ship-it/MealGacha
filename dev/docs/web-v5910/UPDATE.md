# Web 5.9.10 — Bốn Vị Linh vùng miền

Tiếp nối commit `1639049` của PR #60, nhánh `feat/web-v5910-regional-spirits`. Chỉ web; test thiết bị thật, review và merge do chủ dự án thực hiện.

## Nhận diện được giữ lại

| ID | Model canon trong trận | Portrait cũ được thay cho đúng model | Motif riêng |
|---|---|---|---|
| banh-tet | Thỏ ngọc tai dài, đòn bánh lá xanh buộc lạt hồng, áo mint/tím, khiên sen tròn | Trước là cóc/rùa lá | Đòn bánh trụ, lạt buộc và nút hoa |
| bun-bo-hue | Ngưu vương đỏ cam, sừng cong, nón ớt/sả, giáp đồng và muôi dài | Trước là sư tử | Muôi đồng và sả ớt |
| bun-ca | Chim bói cá xanh, mỏ đen, ngọc cổ, áo sóng, cung và ống tên | Trước là hồ ly | Mũi tên/lông bạc và sóng |
| che-buoi | Hải ly nâu kem, mũ vỏ bưởi/hoa trắng, nơ hồng, bát chè vàng | Trước là hạc | Bát chè và hoa bưởi |

`identity-sources.json` ghi atlas gốc, hàng/frame tham chiếu và hash; `evidence/identity-comparison.webp` đối chiếu trước/sau. Không dùng tên hoặc portrait sai cũ để đổi nhân vật sang loài khác. Nhận diện và phụ kiện lấy từ rosterD/E/F đang dùng.

## Sản xuất và tích hợp

- Bốn nhân vật × tám trạng thái × bốn pose: idle, walk, attack, cast, ultimate, hit, fall, victory. HD 1024×2048, pixel 256×512, pivot chân thống nhất; summon/guard/stun dùng lại gesture đã có và không được tính thành bộ tranh mới.
- 12 WebP mới tổng **3.028.544 byte**: tám atlas HD/pixel và bốn portrait 512×512. Có 128 frame khác nhau, alpha/gutter được kiểm tra. Một portrait Bánh tét được sửa framing để giữ đủ hai tai; prompt/hash nguồn và phiên bản trước ở `asset-provenance.json`.
- Manifest/resolver/CharacterSprite dùng chung Adventure, Auto Chess và TCG. Chân dung mới đi qua `SpiritArt`, hồ sơ, banner tuyệt kỹ và UI hiện có. Giữ atlas/portrait cũ phục vụ các ID còn lại.
- Bốn motif code-native qua `drawStarterVfx` có đòn thường, kỹ năng, hồi/khiên, charge và ultimate. Giữ contact Adventure 300/380/960 ms, TCG 560 ms và mốc tác động thật của Auto Chess. Giữ âm thanh từng ID ở đường dẫn hiện có.
- Hệ tuyệt kỹ 2D của 5.9.7 được giữ. Không tạo atlas VFX mới không có consumer; descriptor texture của cohort mới là null, các cohort cũ giữ descriptor tương thích. Hiệu ứng chạy bằng geometry cùng renderer hiện có. Không MP4, không dependency runtime mới.

Không thay engine, damage, skill, độ hiếm, giá vàng, điều kiện mở khóa, collection, save schema/version, party khởi đầu hay tiến trình người chơi. Tám trạng thái là pose atlas, chưa có rig skeletal/mesh, run riêng, turn nhiều hướng hay lip-sync.

Cộng dồn có **27/139 nhân vật** đạt bộ pose mới; còn 112 nhân vật. Các đối thủ giữ mức 16/40 đã nâng cấp. Đọc `ROADMAP_STATUS.md`, `VERIFICATION.md`, `HUMAN_QA.md` và `CHANGED_FILES.md` trước khi review.
