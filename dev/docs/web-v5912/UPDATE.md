# Web 5.9.12 — Tám Vị Linh Bếp Việt

Tiếp tục P0/P2 sau PR #62 (Web 5.9.11). Tám ID đều có chân dung riêng nhưng TCG trước đợt này chỉ dùng một pose từ atlas portrait. Đợt này thêm model chuyển động cho Adventure/TCG qua manifest và renderer hiện có; catalog Auto Chess vẫn có 44 unit, tám ID này chưa thuộc roster Auto.

| ID | Nhận diện lấy từ chính portrait đang dùng | Motif VFX |
|---|---|---|
| pho-ga | Hồ ly trắng, mắt vàng, vương miện/ngọc xanh, áo kem xanh nhạt, đuôi trắng | Dải hơi ngọc |
| chao-suon | Cá koi cam trắng, râu/vây, áo đen vàng, ngọc tròn | Cẩm lý và vây |
| mien-ga | Cú xám bạc, mắt vàng, tai lông, áo học giả đen vàng | Lông vũ |
| bun-moc | Sói xám trắng, bờm xám, áo teal, ngọc xanh | Đầu lang và tiếng vọng |
| banh-da-cua | Rùa biển xanh, nón rộng, mai rùa, áo đen vàng | Mai giáp |
| bun-dau | Tiên hồ điệp, tóc trắng, mắt tím, tai lớn và cánh tím hổ phách | Cánh bướm |
| com-rang-dua-bo | Hươu trắng có gạc phân nhánh, áo teal vàng, bờm trắng | Nhánh gạc |
| com-nieu | Rồng trắng vàng, giáp đồng, đai đỏ, trượng dài | Đồng trượng |

Không suy diễn loài từ tên món. `identity-sources.json` lưu ô portrait cố định và hash atlas gốc. Cả tám giữ nguyên đường dẫn/ô portrait đã có; không vẽ lại chân dung hoặc nhân bản ảnh portrait thành file runtime mới. `evidence/identity-comparison.webp` đối chiếu portrait canon với idle, attack, ultimate, fall và bản pixel.

## Sản xuất

- **256 pose vẽ**: tám nhân vật × tám trạng thái × bốn pose (idle, walk, attack, cast, ultimate, hit, fall, victory). 16 atlas runtime: HD 1024×2048, pixel 256×512, cùng pivot chân và gutter an toàn. Summon/guard/stun dùng gesture tương ứng như pipeline hiện có, không tính thêm pose.
- Built-in Imagegen tạo hai sheet 4×4/nhân vật theo chân dung gốc và phong cách sprite dự án. Phát hiện râu Cơm niêu bị chạm mép ở một pose đi; đã vẽ sửa riêng pose 7, chuẩn hoá về cùng chiều cao trước khi đăng ký atlas. Pose sửa thay thế pose nguồn, không tăng số lượng.
- `pack-campaign598.py` nhận cohort `vietnam5912`, tái dùng portrait gốc, hỗ trợ thay một pose được vẽ sửa và ghi prompt/hash. `inspect-character-atlas.py` giải mã file cuối, kiểm tra 32 frame khác nhau, alpha/gutter/pivot và hash; không cần PNG gốc để kiểm tra lại.
- Tám motif geometry riêng trong `drawStarterVfx`, dùng cùng mốc contact, pause, cleanup và reduced motion. Không thêm video, âm thanh hay texture VFX không có consumer; dùng lại cue riêng của từng ID đã có.
- `unitCharacter` dùng tên nhận diện của visual khi ID chưa có trong Auto catalog, tránh lấy nhầm tên Người gieo vườn từ fallback cũ. Giữ ID, kỹ năng, chỉ số, mở khoá, party mặc định, collection và save schema/version.

## Tiến độ

`audit-spirit-production.mjs` đọc catalog, resolver và manifest thực, kiểm tra file model tồn tại và không trùng cặp sheet/row. Cộng dồn **39/139 bộ pose mới**, còn **100 nhân vật**: **86 portrait-only** và **14 model animation cũ**. Tám ID mới giảm đúng số portrait-only từ 94 xuống 86. Auto vẫn 44 unit; đối thủ giữ 16/40 bộ mới, còn 24 ID đang dùng.

Xem VERIFICATION, HUMAN_QA, ROADMAP_STATUS và CHANGED_FILES. Test vật lý, review và quyết định merge do chủ dự án thực hiện. Đây là một đợt sản xuất tiếp theo; rig/mesh, run riêng, turn nhiều hướng và lip-sync nâng cao vẫn còn trong roadmap.
