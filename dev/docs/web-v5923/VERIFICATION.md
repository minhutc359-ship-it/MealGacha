# Kiểm chứng Web 5.9.23

Luồng được kiểm tra: thao tác tấn công/thi triển → reducer client → pose, contact, atlas VFX và HP → save/reload, gồm ảnh đã xem khi offline. Không có backend mới.

- **793/793 Vitest, 80 file**; TypeScript app/dev; **4 Node guard** đạt. Catalog/assets/records, 774 asset có hồ sơ, build, size guard và SW syntax đạt. Không thêm dependency runtime.
- Inspector: **192 pose**, 32 frame khác nhau/ID; kiểm tra alpha, gutter, pivot chân, hash và portrait canon. Sáu VFX có 18 frame khác nhau, gutter sạch. Sau rà ảnh, hai sheet Samgyeopsal và sheet pose của Sư tử/Bạch lộc/Huyền long được tạo lại để không lẫn giáo, khiên hoặc glow của ô kề. Atlas cuối đã rà contact sheet cục bộ.
- `compatibility.json`: toàn bộ **71 manifest cũ** giữ nguyên đệ quy mọi trường sau khi gộp các bảng metadata, gồm portrait, asset path, VFX, timing, anchor, ID, âm thanh và reduced pose.
- Chromium 153: **66 nhóm Adventure** qua hai cohort bao phủ sáu ID tại 320×568, 390×844, 844×390, 1440×900. Có attack/skill từ reducer thật, pose đúng contact, Canvas vẽ, banner, pause/skip/double-skip/reload giao dịch đã chốt, kết thúc tự nhiên, hit/fall/victory và reduced motion. Hai báo cáo `adventure-a/chromium-qa.json`, `adventure-b/chromium-qa.json` được chạy lại sau các sửa tranh cuối.
- **3 nhóm TCG/Auto Chess**: Auto cast thật tại 390×844 và 1280×800 với ID trong roster; TCG dùng bốn model mới, tấn công thật làm HP 100→98 rồi thi triển phép. Không đưa Vị Linh ngoài roster vào shop Auto. `modes/modes-qa.json`.
- Hai luồng **production**: Huyền long/Jjajangmyeon 390×844 và Hồ ly/Kimchi Jjigae 320×568. Hydrate tuyệt kỹ đã chốt, pause/resume/skip, xác nhận **19 media đã xem có trong cache mỗi fixture**, reload offline đợi ảnh tải xong, `failedRequests: []`. `production/production-qa.json`, `production-narrow/production-qa.json`. Không JS error, thiếu asset hoặc request MP4 trong các ca cuối.

- Test tầm đánh khóa cả hai phe: tầm 1 lao sát rồi về vị trí, tầm 2 chỉ bước ngắn, tầm 3–4 đứng đội hình; save cũ suy ra range; slash/projectile dùng cùng range với model. Cần nghiệm thu thêm timing ở tốc độ ×1/×2 trên Safari/iPhone thật.

Build **177.450.394 bytes**, 851 file; tăng **2.526 bytes** so với base 5.9.23. JS gzip **674.873/675.000 bytes**, CSS gzip 107.187 bytes. Không tăng ngân sách. Model/VFX tải theo nhu cầu.

Cold launch production gồm cài SW: TCG **3.219.032**, Adventure **4.394.473**, Auto Chess **3.587.025 bytes**; cả ba reload offline đạt. Đây là body bytes không nén của trình duyệt mới cho từng mode, không phải thời gian tải hoặc toàn bộ header mạng. `initial-load.json`, `verification-summary.json` ghi số liệu.

Ảnh/contact sheet chỉ giữ trong `.asset-work/`, không commit. Git chứa tranh runtime cùng báo cáo chữ/JSON và provenance; source PNG, prompt, test và ảnh QA không vào dist.

Kiểm tra bằng Chromium headless cục bộ, chưa chứng nhận Safari/iPhone thật, FPS/RAM/nhiệt dài hạn hoặc PvP hai mạng. Rights check phi thương mại đạt; 13 asset cũ còn chờ bằng chứng quyền không thay đổi. Chủ dự án nghiệm thu thiết bị vật lý, review và quyết định merge. Audit hiện 77/139 model, còn 62; đối thủ 16/40, còn 24.
