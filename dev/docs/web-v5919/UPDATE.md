# Web 5.9.19 — Thông báo cập nhật

Dựa trên các bước 1–4 trong ảnh hướng dẫn người dùng cung cấp: phát hiện bản mới, hiện thông báo, người dùng bấm cập nhật, sau đó tải lại game. Phần thêm icon vào màn hình chính trong ảnh nằm ngoài thay đổi này.

## Hành vi

- Popup chung trên mọi trang game khi service worker của bản mới đã tải xong và đang chờ. Lần truy cập đầu tiên hoặc khi đã ở bản mới nhất không hiện thông báo sai.
- **Cập nhật và tải lại** kích hoạt bản đang chờ; đợi trình duyệt chuyển sang bản mới rồi mới tải lại trang. Không dùng phần trăm tải giả.
- **Để sau** hoặc Escape đóng popup cho lần truy cập hiện tại. Người chơi có thể cập nhật trong Cài đặt; lần mở lại web tiếp theo vẫn nhắc nếu bản mới còn chờ.
- Khi đang xử lý, khóa nút lặp và Escape. Nếu gửi yêu cầu thất bại hoặc quá 15 giây chưa kích hoạt được, mở lại nút và hiển thị hướng dẫn thử lại/đóng tab/mở lại game.
- Kiểm tra lại lúc mở web, trở lại tab và khi có mạng. Không tự tải lại tab khác khi người chơi cập nhật ở một tab.
- Popup dùng dialog native, nhãn truy cập, focus trong popup, phục hồi focus và khóa cuộn nền. Bố cục dọc/ngang nằm trong màn hình.

## Dữ liệu và triển khai

Dùng cơ chế cache phiên bản sẵn có; không xóa localStorage, IndexedDB, tài khoản hay bản lưu. Không có migration, thay đổi luật chơi hoặc ảnh/nhạc mới. Cơ chế giữ cache trước đó cho tab đang mở vẫn giữ nguyên.

Popup được cung cấp bởi mã của bản 5.9.19. Những tab vẫn chạy mã 5.9.18 hoặc cũ hơn cần nhận bản này qua nút cập nhật có sẵn trong Cài đặt trước; từ các phiên bản sau, popup mới có thể tự xuất hiện. Mã đang nằm trong cache cũ không thể được thay giao diện từ xa trước khi được cập nhật.

## Kiểm chứng

Luồng đã thử: mở game → kiểm tra `/sw.js` → trình duyệt tải shell mới vào cache → worker ở trạng thái waiting → hiện popup → click → `APPLY_WEB_UPDATE` → controller mới → reload shell mới. Không có API hoặc cơ sở dữ liệu bên ngoài trong luồng này.

- Toàn bộ unit suite: 776 tests / 75 files, gồm 8 ca mới cho phát hiện, chờ kích hoạt, reconnect, timeout, retry và tab khác.
- TypeScript production và dev: đạt. Bốn kiểm thử release guard: đạt.
- Kiểm tra browser production bằng service worker thật: báo cáo `evidence/verification.json`; ảnh popup ở 320×568, 390×844, 844×390 và 1440×900.
- Build: 164,121,640 bytes / 812 files; JS gzip 674,130 / 675,000 bytes; CSS gzip 105,260 bytes. Không nâng ngân sách. Không thêm media tải xuống.
- Release records và kiểm tra chống đưa source/map/archive/credentials vào dist: đạt.

Script tái chạy: `node dev/tools/verify-web-update5919.mjs` (cần Playwright/Chromium và bản build production). Server thử nghiệm thay số định danh worker và marker trong HTML giữa ba đợt A/B/C; dùng nguyên logic worker, popup và app production, không thêm cổng QA vào sản phẩm.

Chủ dự án review thiết bị thật và merge PR. Không thay đổi native/mobile.
