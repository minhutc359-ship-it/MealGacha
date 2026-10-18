# Kiểm chứng Web 5.9.13

## Code và asset

- **733/733 Vitest, 68 file** đạt; TypeScript app/dev đạt. Test mới khóa Adventure vào atlas HD 1024 px với frame nguồn 256 px cho cả đồng minh và đối thủ.
- **320 pose, 20 atlas**, tổng **9.056.720 byte**. Hash, alpha, gutter, pivot chân và giải mã file runtime đạt; đã xem toàn bộ contact sheet.
- Audit thực: **49/139** bộ 32 pose; còn 86 portrait-only + 4 model cũ. Auto Chess có 44/44 cặp model riêng, trong đó 38 unit dùng atlas 32 pose và bốn NPC giữ atlas legacy.
- Asset register có 666 file, dependency runtime graph 32 package. Không thêm dependency sản phẩm, video hay âm thanh. 13 chứng cứ quyền asset cũ vẫn pending; báo cáo không phải commercial clearance.

## Chromium

Chromium Headless Shell **140.0.7339.16**:

- Adventure hai nhóm năm ID: **74 ca** (37/nhóm), gồm 320×568, 390×844, 844×390, 1440×900; attack/primary/support, VFX canvas, pause, từng tuyệt kỹ, skip, thắng/gục, reload, hoàn tất tự nhiên và reduced motion.
- Auto Chess/TCG: **6 ca**, hai nhóm; Auto tung cast thật ở 390 và 1280, TCG thao tác đánh thật rồi dùng phép qua banner/sigil.
- Preview: **20 ca**, mười ID ở 390×844 và 844×390; nền `cover`, portrait đúng ô, chữ/nút không chồng và chỉ một banner.

Mọi fixture Adventure kiểm tra trực tiếp `data-sheet="starter-*"`, descriptor 1024 px, frame 256 px và đường dẫn `/autochess5913/*.webp`; không còn `-pixel`. Không có JS error, HTTP lỗi, asset thiếu hoặc MP4 request. Báo cáo gốc nằm trong `adventure-*`, `modes-*`, `preview`; ảnh WebP chọn lọc và contact sheet nằm trong `evidence/`.

WebKit Linux từng đạt cùng matrix trong phiên làm việc 5.9.13 trước khi scratch remount, nhưng báo cáo tạm không còn trong commit và lần dựng lại không thể chạy do host thiếu thư viện WPE/GTK. Kết quả này không được tính là chứng cứ release hiện tại; Safari/iPhone thật vẫn bắt buộc nghiệm thu.

## Production, dung lượng và offline

Build sạch đạt **126.038.220 byte / 724 file**, tăng 9.060.372 byte so 5.9.12; riêng atlas mới là 9.056.720 byte. JS gzip **673.013 / 675.000 byte**, CSS gzip 103.361 byte. Release guard không thấy source/map/archive/credential; không nâng budget.

| Route | Body byte tải đầu, gồm service worker | Reload offline |
|---|---:|---|
| / | 3.192.300 | Đạt |
| /adventure | 4.367.741 | Đạt |
| /autochess | 3.560.293 | Đạt |

Đây là body byte không nén trong context Chromium mới, không phải thời gian mạng hay FPS. Atlas mới tải lười khi nhân vật xuất hiện, không nằm trong ba tải lạnh trên.

## Giới hạn

Headless Shell/SwiftShader không thay iPhone Safari hoặc Android GPU yếu. Chưa chứng nhận FPS, nhiệt/bộ nhớ phiên dài, PvP hai máy khác mạng/NAT/TURN hoặc quyền phát hành thương mại. Chủ dự án nghiệm thu theo `HUMAN_QA.md`; không tự merge hoặc deploy thủ công.
