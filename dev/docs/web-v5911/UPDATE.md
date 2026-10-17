# Web 5.9.11 — Nếp xuân và đoàn lữ hành

Tiếp tục roster P2 sau 5.9.10. Chỉ cập nhật web; chủ dự án test thiết bị thật, review và quyết định merge.

## Bốn nhận diện canon

| ID | Nhận diện giữ từ model trong trận | Portrait cũ được sửa | Motif |
|---|---|---|---|
| xoi-xeo | Tê tê vảy vàng, khăn vàng, đuôi cong, bát đồng đựng xôi | Hươu gạc pha lê | Bát xôi và hạt nếp |
| dua-hanh | Thỏ trắng tai dài, củ hành có lá trên đầu, áo lá xanh, túi hành và đũa thảo mộc | Hạc áo tím | Củ hành, chồi và rễ |
| caravan-herbalist | Người phụ nữ cao tuổi tóc bạc búi, áo tím, khăn kem, gùi thuốc, bầu và gậy gỗ | Hổ mang hành lý | Cành thuốc và lá |
| caravan-gardener | Cậu bé tóc đen đội nón, áo kem, quần teal, đai đỏ, cuốc và túi cây | Cá chép áo lễ | Cuốc, luống đất và mầm |

Nguồn canon là rosterD/E đang dùng, không suy diễn loài/tuổi từ tên hay portrait lệch. `identity-sources.json` lưu vị trí và hash atlas gốc; `evidence/identity-comparison.webp` đối chiếu model, portrait cũ, portrait mới và idle mới. Tên, lore và dữ liệu gameplay hiện có được giữ.

## Sản xuất và tích hợp

- Bốn nhân vật × tám trạng thái × bốn pose = **128 pose vẽ**, gồm idle, walk, attack, cast, ultimate, hit, fall, victory. HD 1024×2048, pixel 256×512; pivot chân thống nhất. Summon/guard/stun tiếp tục dùng gesture tương ứng, không tính thêm tranh.
- **12 WebP, 2.283.448 byte**: tám atlas và bốn portrait 512×512. `asset-provenance.json` lưu prompt đầy đủ, hash ảnh nguồn, vùng đăng ký, tỷ lệ và hash/byte đầu ra. `asset-qa.json` kiểm tra 32 frame khác nhau/nhân vật, alpha/gutter/pivot/kích thước và provenance. `evidence/pose-contact.webp` cho phép xem toàn bộ pose.
- Manifest/resolver hiện có cấp HD cho TCG/Auto, pixel cho Adventure và portrait cho SpiritArt/banner/hồ sơ. Giữ atlas cũ phục vụ ID khác. Xôi xéo/Dưa hành có sẵn trong Auto; hai caravan chỉ tích hợp ở nơi ID vốn đã có, không thêm unit mới vào Auto.
- Bốn motif geometry riêng qua renderer `drawStarterVfx`; giữ mốc contact, cleanup, reduced motion, pause và tuyệt kỹ 2D chung. Không thêm texture VFX không có consumer. Reuse âm thanh riêng ở đường dẫn hiện có.
- Mở rộng packer và script browser hiện có cho cohort mới; script Auto cho phép chỉ định roster riêng, tránh fixture chứa caravan ngoài catalog Auto. Script kiểm tra atlas đọc file runtime và đối chiếu provenance để có thể chạy lại khi không có PNG nguồn.

Không đổi engine, chỉ số, damage, kỹ năng, rarity, giá vàng, unlock, collection, party khởi đầu, save schema/version hay tiến trình. Không video/dependency runtime mới và không tăng ngân sách.

## Banner tuyệt kỹ và minh hoạ Bách

- Banner dùng phong cảnh theo hệ phủ toàn khung bằng `cover`, thay phần nền gradient trống. Năm cảnh được tách từ tranh gốc đã có trong `web-v530/environments.webp`, không thêm video. Lớp tối giữ chữ và nút rõ; phần xem thử dùng cùng phong cảnh.
- Chân dung atlas được đặt trên mặt phẳng vuông trước khi crop vào banner: không kéo méo ô 4×4, không lộ ô hàng xóm. Neo ảnh ở mép trên để không cắt mặt Bách khi màn hình ngang. Khung xem thử vừa chiều rộng dialog.
- Đổi phần tử bao banner từ `aside` sang `div role=status` để không nhận nhầm `flex-direction:column` từ `.rpg-roster-layout aside`. Lỗi này khiến nút Bỏ qua rơi xuống hàng dưới trong màn hồ sơ. Banner dùng chung ở Adventure, Auto Chess và TCG.
- Thay ảnh `anime/bach.webp` bằng minh hoạ đầy đủ từ **image(3).png do chủ dự án cung cấp**, resize nguyên ảnh về 768×768. Chân dung mặc định của hồ sơ/SpiritArt, card art, NPC và banner cùng trỏ ảnh này. Model chiến đấu và năm biểu cảm khác vẫn dùng atlas/ảnh chuyên biệt hiện có.
- `showcase-assets.json` lưu nguồn/hash/crop/kích thước của năm cảnh và minh hoạ Bách; `pack-showcase5911.py` tái tạo đầu ra từ tranh realm trong repo và PNG chủ dự án cung cấp. Đây là ghi nhận nguồn, không chứng nhận quyền phát hành thương mại.

Cộng dồn **31/139 bộ pose mới**, còn **108 nhân vật**. Cả bốn đã có model TCG cũ nên số 94 unit portrait-only của audit trước không bị trừ nhầm. Đối thủ giữ 16/40 bộ mới, còn 24 ID đang dùng. Animation rig/run/turn/lip-sync nâng cao chưa đầy đủ; đợt này không hoàn tất toàn Web 6.0.

Đọc `VERIFICATION.md`, `HUMAN_QA.md`, `ROADMAP_STATUS.md` và `CHANGED_FILES.md` khi review.
