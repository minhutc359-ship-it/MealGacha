# Kiểm chứng Web 5.9.9

Phạm vi: tám quái thường hậu truyện; build từ nhánh `feat/web-v599-campaign-creatures`, nối sau commit `4874528` của 5.9.8. Tất cả fixture chạy trong context trình duyệt cô lập; không dùng hay sửa bản lưu của người chơi.

## Kiểm tra kỹ thuật

- **692/692 Vitest, 66 file đạt**, gồm bốn test mới về canon ID/style, guard/contact, giới hạn VFX và kỹ năng quái thường thật.
- TypeScript app/dev, catalog 123 món/35 tag/9 event và asset validator 128 đường dẫn không thiếu file.
- Release records khớp: 601 asset runtime, 32 dependency runtime không đổi. Rights inventory vẫn còn 13 asset cũ chờ chứng cứ; chưa có commercial clearance.
- Bốn Node test về release guard/ngân sách đạt; production build sạch, release guard/size và kiểm tra cú pháp service worker đạt.
- 24 WebP mới, tổng 4.208.768 byte. Cả tám atlas có 32 frame khác nhau; alpha/gutter/pivot, kích thước HD/pixel và hash được ghi ở `asset-qa.json`, `asset-provenance.json`. Xem `evidence/pose-contact.webp`.

## Trình duyệt và tải trang

Kịch bản `dev/tools/verify-creatures599.mjs` tạo màn region-1 thật qua reducer, giữ nguyên ID/style/độ khó. Chỉ điều chỉnh HP, năng lượng và bộ đếm để quan sát trong fixture. Đồng hồ Playwright điều khiển thời điểm chụp; pause dùng action thật. Không dùng khoảng chờ theo tốc độ CPU để xác định pose. Các lượt QA ban đầu bắt hụt khung hình khi dùng thời gian thực; sửa đồng hồ và bước chờ của kịch bản, không sửa gameplay/timeout để né lỗi.

Bốn viewport: 320×568, 390×844, 844×390, 1440×900. Các ca gồm kỹ năng ở bốn vùng, ba quái chống đỡ, VFX vẽ pixel, pause giữ pose, đòn thường, Hard/Extreme, quái thắng/gục và reduced motion giữ guard 18. Cả Chromium 153 và WebKit 26.5 đều đạt 25/25 ca, không JS error/request lỗi và không MP4. Kết quả từng engine ở `chromium-qa.json` và `webkit-qa.json`.

Auto Chess/TCG regression: mỗi engine qua ba ca, có cast thật; `modes-chromium/modes-qa.json`, `modes-webkit/modes-qa.json`. Không lỗi JavaScript hay request asset thiếu.

Build **105.038.947 byte** (659 file); JS gzip **669.854/675.000 byte**, không nâng ngân sách. Cold launch gồm SW/precache, body chưa nén: TCG 3.181.736 byte, Adventure 4.357.177 byte, Auto Chess 3.549.729 byte. Cả ba route reload offline được; `metrics.json`, `initial-load.json`.

## Phần bạn nghiệm thu

Chromium 153 dùng SwiftShader, WebKit 26.5 chạy Linux headless. Đây không phải bằng chứng Safari/iPhone/Android hay FPS trên GPU thật. Theo yêu cầu, bạn thực hiện test thiết bị vật lý, PvP hai máy/khác mạng và review/merge PR theo `HUMAN_QA.md`.

Networking không thay ở 5.9.9. Bằng chứng WebRTC hai context và reconnect/reload của nền 5.9.8 vẫn ở `dev/docs/web-v598/`; chưa thay thế nghiệm thu NAT/TURN production.
