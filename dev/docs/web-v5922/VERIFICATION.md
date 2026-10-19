# Kiểm chứng Web 5.9.22

Luồng: tấn công/tuyệt kỹ → reducer client → pose/contact và atlas VFX → HP/khiên/hồi → save/reload, bao gồm ảnh đã xem khi offline. Không có backend mới.

- **787/787 Vitest, 78 file**; TypeScript app/dev; **4 Node guard** đạt. Catalog/assets/records, 761 asset có hồ sơ, production build, size guard và SW syntax đạt. `compatibility.json` xác nhận toàn bộ 65 định nghĩa hình ảnh cũ giữ nguyên mọi trường ngoài `title` không có consumer.
- Inspector kiểm tra **192 pose**, 32 frame khác nhau/ID: alpha, gutter, pivot chân, hash và portrait canon. VFX kiểm tra 18 frame khác nhau trong atlas 1536×768, gutter sạch. Hai sheet pose Linh quy/Rái cá được đăng ký lại ranh giới nguồn sau khi rà ảnh phát hiện dải chân/glow lẫn giữa hàng. Chỉ thay đăng ký pixel đã vẽ, không thêm pose giả hoặc đổi identity.
- Chromium 153 qua **66 nhóm Adventure**, hai cohort bao phủ đủ sáu ID tại 320×568, 390×844, 844×390, 1440×900. Có attack/skill từ reducer thật, pose đúng contact, Canvas vẽ, portrait/banner, pause, skip/double-skip, reload giao dịch đã chốt, kết thúc tự nhiên, ngã/thắng và reduced motion. `adventure-a/chromium-qa.json`, `adventure-b/chromium-qa.json`.
- **3 nhóm TCG/Auto Chess**: cast thật Auto tại 390×844 và 1280×800; TCG dùng bốn model Tây Bắc, tấn công thật làm HP 100→98 rồi thi triển phép. Không đưa ID ngoài roster vào shop Auto. `modes/modes-qa.json`.
- Hai luồng **production** cho Rái cá/Gà nướng mắc khén 390×844 và Bạch lộc/Xôi ngũ sắc 320×568: hydrate tuyệt kỹ đã chốt, pause/resume/skip và reload offline. Harness đợi media đã xem có trong cache, sau reload đợi tải xong và xác nhận không request lỗi; không chỉ kiểm tra DOM xuất hiện. `production/production-qa.json`, `production-narrow/production-qa.json`.

## Điểm sửa từ QA

Lần cài đầu có thể tải model Canvas/nền CSS trước khi service worker tiếp quản. Bước warm cũ chỉ lấy ảnh trong DOM và MP3, nên bỏ sót các ảnh này; giao diện offline vẫn mở nhưng ảnh/VFX có thể thiếu. Nay warm cả resource ảnh đã tải; giữ giới hạn 32 URL và các giới hạn/cache policy hiện có. Thêm unit test cho lần đầu nhận controller, cùng hai ca production xác nhận cache và `failedRequests: []`. Không sửa save hoặc cách người chơi chủ động cập nhật.

## Dung lượng

Build cuối **172.753.450 bytes**, 838 file; tăng **4.748.321 bytes** từ 5.9.21 và **8.594.776 bytes** từ master 5.9.20. JS gzip **674.838/675.000 bytes**, CSS gzip 106.955 bytes. Không tăng ngân sách hoặc dependency runtime. Sáu model/VFX mới tải theo nhu cầu.

Cold launch production gồm cài SW: TCG **3.224.224**, Adventure **4.399.665**, Auto Chess **3.592.217 bytes**. Cả ba route reload offline đạt. `initial-load.json`, `verification-summary.json` ghi chi tiết.

## Ảnh QA và phạm vi

Ảnh/contact sheet chỉ giữ cục bộ trong `.asset-work/`; không thêm ảnh QA vào Git. 17 ảnh 5.9.21 đã loại khỏi cây file PR; báo cáo và provenance vẫn giữ. Không đưa source PNG, prompt, test hoặc screenshot vào dist.

Đây là Chromium headless cục bộ, không chứng nhận Safari/iPhone, FPS/RAM/nhiệt thiết bị thật hoặc PvP hai mạng. Chủ dự án nghiệm thu thiết bị vật lý, review và quyết định merge. Roster còn 68 model và 24 đối thủ chờ các đợt tiếp theo.
