# Web 5.9.6 — nhóm Vị Linh P2 thứ hai và tối ưu bundle

Tiếp nối 5.9.5 trên cùng nhánh `feat/web-v595-rare-spirits`, PR #58. Nền của đợt này là commit `4246121132827fcc993b03de3aea0c32c2a2f97e`. PR chứa cả hai đợt 5.9.5–5.9.6 để merge một lần; không tự merge vào master.

## Hoàn thiện bốn nhân vật

| Character ID | Nhận diện giữ theo catalog/model rosterF/G | Gesture và VFX riêng |
| --- | --- | --- |
| com-lang-vong | Kỳ Lân Lúa Non bốn chân, mặt trắng xanh, cặp sừng bông lúa vàng, áo lá sen và chuông đồng | Bước bốn chân, cú húc ngắn và nhấc chân ban phúc; bông lúa, tán lá và hạt vàng |
| ca-phe-trung | Cầy Hương Mây Kem, kính tròn đồng, áo khoác ngà/gile nâu, đuôi bông và gậy phin | Gõ gậy ngắn, điều nhịp bằng tay; đường phin, giọt kem và xoáy cà phê |
| thit-kho-trung | Huyền Quy Nồi Tết màu nâu hổ phách, mai tròn, giáp đồng, phù hiệu trứng và dây đỏ | Bước nặng, chưởng gần và đẩy hai tay bảo vệ; ấn trứng, hai phiến mai và sóng caramel |
| cha-ruoi | Sóc Lá Thu màu cam nâu, đuôi cuộn lớn, khăn cam/áo lá thu, đao lá ngắn và khiên tròn | Lướt thấp, chém đao gọn và thu thế; lưỡi lá chéo, lá phong và vệt thu tàn |

Chân dung Spirit 5.1 của cả bốn ID không khớp loài/trang phục của model đang dùng. Đã thay bằng portrait cùng nhận diện với sprite; xem `evidence/identity-comparison.webp`. Giữ artwork món ăn/thẻ và atlas cũ còn phục vụ các nhân vật khác. Độ hiếm thật của nhóm này là ba Hiếm và một Huyền thoại; không đổi rarity vì giá vàng Auto Chess.

- Mỗi nhân vật có tám trạng thái × bốn pose vật lý: idle, walk, attack, cast, ultimate, hit, fall/death, victory. Các trạng thái summon/guard/stun tiếp tục dùng gesture tương thích, không tính là bộ tranh mới.
- Adventure combat dùng sprite pixel ô 64 px đóng từ cùng bộ pose; Auto Chess và TCG dùng HD ô 256 px. Một manifest quyết định portrait, sprite, anchor, contact, VFX và sound cho các consumer tương thích.
- Bổ sung nhóm asset vào bảng `ASSET_GROUPS`, tránh kéo dài chuỗi điều kiện theo từng đợt. Bỏ bốn mapping legacy đã được manifest thay thế.
- Đăng ký nguồn bằng hai sheet 4×4. Vẽ sửa bốn pose contact/recovery của Chả rươi khi vũ khí chạm actor bên cạnh; chọn thêm một contact gậy gọn cho Cà phê trứng để không thu nhỏ quá mức toàn bộ nhân vật. Giữ các pose cast/ultimate cũ của Cà phê để gậy không đổi tay đột ngột.
- VFX có ba ô gather/impact/finisher riêng cho từng ID. Đăng ký rect chính xác để không lấy mảnh ô bên cạnh và giữ các hạt sáng rời có chủ đích. Không thêm lớp để che lỗi nguồn.
- Cả bốn tuyệt kỹ dùng renderer native với một actor và một VFX chính; kế thừa năm giai đoạn, pause/skip, reduced motion, pixel fallback → HD và cleanup. SFX ở đường dẫn cũ được căn impact 960 ms.
- Gỡ bốn MP4 đã hết consumer, tổng **5.145.172 byte**. Các phim còn dùng vẫn tải theo yêu cầu. Không thêm video hoặc bản sao SFX.

Giữ nguyên ID, chỉ số, kỹ năng, kết quả chiến đấu, party starter, bộ sưu tập, tiến trình, mở khóa, phần thưởng và schema save. Không bổ sung đơn vị Auto Chess hoặc NPC khám phá mới.

## Asset bổ sung

Thư mục `public/assets/characters/rare596/`:

| ID | HD | Pixel | Portrait |
| --- | --- | --- | --- |
| com-lang-vong | com-lang-vong.webp | com-lang-vong-pixel.webp | com-lang-vong-portrait.webp |
| ca-phe-trung | ca-phe-trung.webp | ca-phe-trung-pixel.webp | ca-phe-trung-portrait.webp |
| thit-kho-trung | thit-kho-trung.webp | thit-kho-trung-pixel.webp | thit-kho-trung-portrait.webp |
| cha-ruoi | cha-ruoi.webp | cha-ruoi-pixel.webp | cha-ruoi-portrait.webp |

Thêm `ultimate.webp`: bốn cột nhân vật × ba hàng phase. Tổng **13 WebP, 3.205.894 byte, 272 ô/ảnh**: 128 HD, 128 pixel, bốn portrait, 12 VFX. Bốn MP3 được cập nhật ở `public/assets/rpg/awakening530/sounds/<id>.mp3`.

Ảnh được tạo bằng Imagegen tích hợp, không dùng CLI/API ngoài. Prompt đầy đủ, nguồn và SHA-256 ở `artwork.json`, `resolve-artwork.json`, `support-artwork.json`, `repairs.json`, `civet-repairs.json`; sidecar/công cụ đóng gói và `asset-qa.json` cho phép kiểm tra output runtime.

## Tối ưu JavaScript

Hai consumer Pixi hiện chỉ vẽ Graphics trên canvas aria-hidden, với điều khiển HTML. Build bỏ tự đăng ký các extension không có consumer: accessibility, DOM, events, spritesheet parser và filters. Giữ nguyên application, graphics, renderer, texture và fallback. Không sửa vendor hoặc đổi phiên bản thư viện.

Các component TCG, Auto Chess và rương được gom theo consumer để giảm chi phí gzip của nhiều chunk nhỏ; giữ các entry route và Pixi tải động. Offline shell vẫn precache code/font theo cơ chế hiện có, media tiếp tục theo yêu cầu.

Kết quả cuối, đã gồm code cho bốn nhân vật mới:

- **246.055.474 byte = 246,06 MB**, giảm **1.942.082 byte** so với 5.9.5.
- JS gzip **666.497 / 675.000 byte**, giảm 8.144 byte; còn 8.503 byte, giữ nguyên trần.
- Cold launch gồm cài SW: **3,17–4,35 MB**, cả ba route reload offline được.
- So với nền 5.9.4 của toàn PR: build giảm **4.555.977 byte**; tám nhân vật P2 mới dùng 26 WebP, tổng 6.478.338 byte, thay thế tám phim 11.033.158 byte.

## Kiểm thử và phần còn lại

**681 test / 63 file**; app/dev TypeScript, bốn Node guard, catalog, asset, release records, media decode và build/size/SW checks đã qua. Đã kiểm tra ba mode, bốn viewport, đủ năm phase, pause/skip, nhiều cast, offline → HD, cleanup, cold load và hai consumer Pixi trong production kể cả context loss. Xem `VERIFICATION.md`, `CHANGED_FILES.md` và `evidence/`.

Hiện có 23 manifest sản xuất: sáu Vị Linh mẫu (năm starter thật + Xôi), năm đầu bếp, bốn thường gặp và tám P2. Chưa nghiệm thu toàn bộ Web 6.0: còn roster P2 khác, quái/tinh anh/boss P3, 94 thẻ TCG dùng portrait một pose và kiểm thử thiết bị thật/Safari/PvP hai thiết bị. Mười ba chứng cứ quyền asset cũ vẫn pending. Bộ pose hiện chưa có rig skeletal/mesh, chạy riêng, turn-in-place hay lip-sync; chỉ thêm bộ khám phá bốn hướng khi có consumer thực tế.
