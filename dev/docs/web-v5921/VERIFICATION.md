# Kiểm chứng Web 5.9.21

Luồng: bấm tấn công/tuyệt kỹ → reducer client → pose/contact và atlas VFX → HP/khiên/hồi → save/reload. Không có API/backend mới.

- 784/784 Vitest trong 77 file; TypeScript ứng dụng và dev; 4 Node release/budget guard đạt. Catalog, 137 đường dẫn tĩnh, 748 asset có hồ sơ và release records đạt; `dist/sw.js` hợp lệ.
- Inspector kiểm tra 128 frame model cuối: 32 frame khác nhau/ID, alpha, gutter, điểm chân, hash và portrait canon; hai atlas VFX có 24 frame khác nhau, nền trong suốt và gutter sạch. `asset-qa.json`, `vfx-provenance.json`; ảnh QA giữ cục bộ theo yêu cầu mới.
- Chromium 153: **33 nhóm** Adventure cho bốn model mới qua 320×568, 390×844, 844×390, 1440×900. Có attack/skill từ reducer thật, pose đúng mốc, vẽ Canvas, pause, từng tuyệt kỹ, portrait đúng, giới hạn banner, skip/double-skip, reload giao dịch đã chốt, kết thúc tự nhiên, ngã/thắng và giảm chuyển động. `feast/chromium-qa.json`.
- **12 nhóm** Adventure tại 390×844 cho bốn VFX ưu tiên 5.9.17, gồm cast thật và tải atlas riêng; không còn assertion lịch sử cấm request VFX mới. `priority/chromium-focus-qa.json`.
- **3 nhóm** Auto Chess/TCG: cast thật Auto ở 390×844 và 1280×800; TCG dùng bốn model mới, tấn công thật làm HP địch 100→98 rồi thi triển phép. Auto dùng quân có thật trong roster, không ép bốn ID TCG vào shop. `modes/modes-qa.json`.
- Hai luồng **production build** khôi phục tuyệt kỹ đã chốt: Canh măng miến 390×844 và Chè khúc bạch 320×568. Pause/resume/skip và reload offline đạt. `production/production-qa.json`, `production-narrow/production-qa.json`.
- Không có JS error, request asset lỗi hoặc request MP4 trong các ca hoàn tất. Các bài browser dùng save cô lập, party/HP/timer điều chỉnh và reducer thật; không dùng tài khoản/tiến trình của người chơi.

## Lỗi bắt được và sửa

Chè khúc bạch ở 320×568 cùng Liên hương ×3 làm banner cao 80,77 px trên sân 140 px, che quá nửa sân. CSS cho màn hẹp giảm vùng portrait và giữ dòng tên gọn. Sau sửa, toàn bộ matrix trên đạt mà không nới assertion kích thước. Ảnh trước/sau đã chuyển về cục bộ theo yêu cầu mới; các báo cáo số liệu vẫn được giữ trong Git.

## Dung lượng và offline

Build cuối **168.005.129 bytes**, tăng 3.846.455 bytes so với master 5.9.20; 825 file. JS gzip **674.820/675.000 bytes**, CSS gzip 106.955 bytes. Không tăng ngân sách, không dependency runtime mới; không đưa prompt/QA/source vào dist.

Cold launch production có cài service worker: TCG **3.223.907**, Adventure **4.399.348**, Auto Chess **3.591.900 bytes**. Cả ba route reload offline đạt; model/VFX mới không tải ở màn hình đầu. `initial-load.json` và `verification-summary.json` ghi số đo.

Đây là Chromium headless cục bộ, không chứng nhận Safari/iPhone, FPS/RAM/nhiệt thiết bị vật lý hoặc PvP hai mạng. Theo phân công hiện có, chủ dự án nghiệm thu thiết bị thật, review và quyết định merge. Bộ này không xác nhận hoàn tất toàn bộ roadmap đồ họa.
