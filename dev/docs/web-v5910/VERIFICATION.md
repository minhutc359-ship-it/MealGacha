# Kiểm chứng Web 5.9.10

Commit nền `1639049` (PR #60); chỉ web. Fixture sử dụng save cô lập, thay party/HP/năng lượng/timer để quan sát; các ca kết quả trận tạo snapshot kết thúc hợp lệ. Không dùng hay sửa save người chơi.

## Asset và mã

12 WebP, tổng **3.028.544 byte**. Tám atlas đúng kích thước HD 1024×2048/pixel 256×512; 128 frame khác nhau, alpha/gutter/pivot có kiểm tra trong `asset-qa.json`. Hash 12 output khớp `asset-provenance.json`. Canon atlas/row/frame và hash nguồn ở `identity-sources.json`. Ảnh review ở `evidence/`.

**699/699 Vitest trong 67 file đạt**, gồm contract resolver/reload/double-skip cho bốn ID mới, giới hạn geometry và contact Auto/TCG. TypeScript app/dev, catalog 123 món/35 tag/9 event, asset validator 128 đường dẫn không thiếu file, bốn Node guard test, release records/build/guard/size và cú pháp service worker đạt. Inventory khớp 613 asset và 32 dependency runtime. Quyền 13 asset cũ vẫn pending; chưa có commercial clearance.

## Browser Adventure

Chromium 153 và WebKit 26.5 **mỗi engine đạt 33/33 ca**. Bốn viewport: 320×568, 390×844, 844×390, 1440×900.

- Đòn thường, primary, support có event reducer thật cho cả bốn ID; VFX có pixel vẽ, pause giữ pose.
- Tuyệt kỹ từng ID ở cả bốn viewport: contact pose 18, portrait mới khớp manifest, banner trong biên, pause tiến độ, skip/double-skip không tính lại HP/khiên/roster/resource.
- Hero thắng/gục, reload giao dịch tuyệt kỹ đang pause, hoàn tất tự nhiên và giảm chuyển động giữ pose 16 cho cả bốn.
- Không JS error, request lỗi hay MP4; Adventure chỉ yêu cầu bốn pixel atlas và bốn portrait của cohort, không preload HD cả nhóm.

Dùng `dev/tools/verify-spirits5910.mjs`; thời điểm pose được điều khiển bằng đồng hồ Playwright. Kịch bản chờ React hydrate sau reload trước khi kiểm tra UI; không tăng timeout hay thay gameplay để né lỗi. Báo cáo ở `chromium-qa.json`, `webkit-qa.json`.

## Auto Chess và TCG

Mỗi Chromium/WebKit qua **3/3 ca**: Auto Chess ở 390×844 và 1280×800 xác nhận cả nhóm cast thật; TCG hiển thị đủ bốn model mới, bấm đòn đánh Bánh tét vào Bún cá, kiểm tra HP giảm từ 100 xuống 98 và trạng thái ready tiêu thụ, rồi thi triển phép thật với banner/sigil. Không JS error, request lỗi hay MP4. Báo cáo ở `modes-chromium/modes-qa.json`, `modes-webkit/modes-qa.json`.

`verify-showcase-modes597.mjs` giữ bộ mặc định và nhận `QA_IDS` khi cần kiểm tra cohort. Selector đòn đánh bám unit trên bàn để phân biệt với artwork invocation; banner/sigil được kiểm tra trong cùng trạng thái DOM, tránh bắt hụt hoạt ảnh ngắn giữa hai truy vấn.

## Build và offline

Build sạch **108.069.028 byte / 671 file**; JS gzip **670.325/675.000 byte**, CSS gzip 103.289 byte. Không nâng ngân sách. `metrics.json` sao lại báo cáo build.

Cold launch với SW/precache, body chưa nén: TCG **3.183.272 byte**, Adventure **4.358.713 byte**, Auto Chess **3.551.265 byte**. Ba route reload offline được. Đây là đo payload bảo thủ, không phải benchmark tốc độ mạng/FPS; `initial-load.json`.

## Giới hạn nghiệm thu

Chromium dùng SwiftShader, WebKit chạy Linux headless; không phải Safari/iPhone/Android thật. Theo yêu cầu, thiết bị vật lý, PvP hai máy/khác mạng, review và merge do bạn thực hiện theo `HUMAN_QA.md`. Networking không thay; bằng chứng WebRTC của nền vẫn ở web-v598. Chưa nghiệm thu toàn bộ Web 6.0.
