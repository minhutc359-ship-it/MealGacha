# Web 5.9.23 · Sáu Vị Linh Hàn Quốc

Sáu ID portrait tĩnh được nâng lên model chiến đấu 32 pose và sáu VFX sơn ba pha, dùng chung renderer hiện có của TCG/Adventure.

| ID | Nhận diện canon giữ nguyên | VFX riêng |
|---|---|---|
| samgyeopsal | Bạch long có gạc vàng, vảy lam ngọc, giáp vàng và giáo | Gạc vàng, giáo và gió trắng-lam |
| hanwoo-bbq | Xích long sừng đen, áo đỏ-đen-vàng, trượng nhật cầu | Nhật cầu, cung sừng rồng và lụa đỏ |
| korean-fried-chicken | Sư tử bờm đỏ, hoa dâm bụt, khiên đỏ-đen-vàng | Hồng thuẫn, cánh hoa và tàn lửa |
| bingsu | Bạch lộc, gạc vàng treo pha lê, hoa tím và áo tím | Tử tinh, hoa tím và đường gạc vàng |
| jjajangmyeon | Huyền long vảy lam, sừng ngà, chuỗi ngọc, đèn lam | Thanh đăng, khói lam và ngọc |
| kimchi-jjigae | Hồ ly đỏ-kem, khăn đỏ, áo đen-vàng, đèn cam | Hỏa đăng, hồ vĩ lửa và tua vàng |

Mỗi model có bốn pose cho idle, walk, attack, cast, ultimate, hit, fall và victory; tổng 192 pose, xuất HD 1024×2048 và pixel 256×512. Atlas VFX 1536×768 có sáu cột, ba hàng tụ lực/tác động/tan biến. Đăng ký VFX theo thành phần alpha nguyên vẹn để giữ nét vẽ vượt qua ranh giới ô nguồn; loại hạt alpha rời rất nhỏ, giữ gutter trong atlas đích. Hai sheet Samgyeopsal và sheet pose Sư tử/Bạch lộc/Huyền long được tạo lại với khoảng trống rộng hơn sau khi rà ảnh phát hiện giáo/glow chạm ô kề. Portrait giữ nguyên các ô canon tại `portraits-2.webp` đến `portraits-5.webp`.

Gộp metadata hình ảnh thành một bảng hàng có vị trí cột được ghi rõ, thay các bảng lặp ID cho definition, portrait và cast anchor. `compatibility.json` xác nhận toàn bộ 71 manifest cũ giữ nguyên đệ quy mọi trường, gồm đường dẫn, portrait, VFX, timing, anchor, ID và âm thanh. Giữ giới hạn JS gzip 675.000 bytes; không thêm dependency.

Không đổi gameplay, kỹ năng, chỉ số, độ hiếm, unlock, ID, save/progress/collection, roster 44 quân Auto Chess hoặc networking. Chỉ web; chủ dự án review và quyết định merge.

Asset runtime lưu tại `public/assets/characters/korea5923/`. Prompt cuối, hash và crop nguồn: `asset-provenance.json`, `vfx-provenance.json`, `identity-sources.json`. Ảnh QA/contact sheet chỉ giữ cục bộ trong `.asset-work/`; Git chỉ chứa báo cáo chữ/JSON và tranh runtime. Xem `VERIFICATION.md` và `ROADMAP_STATUS.md` cho kết quả kiểm tra và số lượng còn lại.
