# Kiểm chứng Web 5.9.12

Đợt này nâng cấp tám ID có portrait canon lên model 32 pose. Luồng QA đi từ thao tác thật → reducer/engine → state/save → resolver → pose/VFX/banner → pause/skip/reload. Fixture chỉ nằm trong script dev, không build vào sản phẩm.

## Code và asset

- **718/718 Vitest, 67 file; 4/4 Node guard** đạt. TypeScript app/dev, catalog, asset validator, release records và đối chiếu records đạt. Không đổi dependency hoặc lockfile.
- Test manifest/resolver kiểm tra 39 ID production, portrait canon, contact/VFX, reduced motion, reload/double-skip. Model ngoài catalog Auto lấy tên từ visual thay vì nhận nhầm tên Người gieo vườn.
- **256 pose khác nhau, 16 atlas** HD 1024×2048 và pixel 256×512, tổng **6.158.092 byte** mới. Hash, alpha, gutter và pivot chân đạt; `asset-qa.json` kiểm tra file cuối độc lập PNG nguồn. Đã xem contact sheet toàn bộ pose và bảng đối chiếu tám nhận diện.
- Cơm niêu có một pose đi được vẽ sửa râu; prompt/hash và frame thay thế ghi trong `asset-provenance.json`. Đây là một trong 32 pose, không tính tăng số pose. `production-inputs.json` lưu cách tái tạo crop tham chiếu từ portrait gốc bằng `prepare-spirit-references.py`.
- Audit catalog thực: **39/139** bộ pose mới, còn **86 portrait-only + 14 model cũ**. Auto giữ 44 unit; tám ID mới chưa thuộc roster Auto. Asset register 646 file, dependency runtime graph 32 package. 13 chứng cứ quyền asset cũ vẫn pending; chưa chứng nhận phát hành thương mại.

## Chromium và WebKit

Mỗi Chromium **151.0.7922.34** và WebKit **26.5** Linux headless chạy **88/88 ca**:

| Nhóm | Số ca mỗi engine | Phạm vi |
|---|---:|---|
| Adventure | 66 | Hai nhóm bốn ID, mỗi nhóm 33 ca ở 320×568, 390×844, 844×390, 1440×900 |
| Auto/TCG | 6 | Hai lượt: Auto hồi quy cùng năm unit hiện có ở hai viewport; TCG hai nhóm bốn ID mới |
| Preview | 16 | Tám ID × 390×844 và 844×390 qua nút Xem tuyệt kỹ 2D thật |

Adventure kiểm tra attack/primary/support từ reducer, canvas VFX có pixel, pause ổn định pose, tuyệt kỹ/contact/skip, thắng/gục, reload tuyệt kỹ đã commit, hoàn tất tự nhiên và reduced motion. TCG tải đủ tám HD, thao tác đánh thật với ID đầu mỗi nhóm vào ID thứ ba, xác nhận HP 100→98 và ready tiêu thụ; sau đó dùng phép thật qua banner/sigil chung. Không diễn giải hai ca tấn công này thành mọi cặp đấu TCG đã được chơi.

Preview kiểm tra một banner, nền `cover` phủ khung, ảnh atlas đúng ô, chữ và nút không chồng, skip đóng preview. Đã xem ảnh trực tiếp Adventure/TCG/preview; chân dung giữ nguyên, model đúng nhận diện. Mỗi engine tải đủ **16/16** đường dẫn runtime mới, không JS error, HTTP lỗi hay MP4. Báo cáo gốc nằm trong `adventure-a`, `adventure-b`, `modes-*-a`, `modes-*-b`, `preview`; tổng hợp ở `verification-summary.json`.

Một lượt Chromium gặp lỗi harness khi đặt `pauseAt` bằng đồng hồ Node +100 ms: thời điểm đã trôi qua trong lúc chuyển lệnh tới browser dưới tải CPU. Đã sửa hai script dev dùng chính đồng hồ browser +1.000 ms và chạy lại nhóm bị ảnh hưởng: 33/33 đạt. Không thay timer engine, timeout hay ngân sách sản phẩm để qua test. Các lượt WebKit đã đạt vẫn dùng cùng thao tác/state sản phẩm.

**18 ảnh WebP** minh chứng đã được giải mã lại, kiểm tra kích thước, nội dung không rỗng và hash trong `evidence-qa.json`; hai contact sheet cùng 16 ảnh UI chọn lọc. PNG chụp đầy đủ được giữ ngoài Git để tránh tăng dung lượng nguồn không cần thiết.

## Production và offline

Build sạch bằng `vite build --emptyOutDir`: **116.977.848 byte / 704 file**, JS gzip **671.866 / 675.000 byte**, CSS gzip 103.361 byte. Release guard không phát hiện source/map/archive/credential. Không tăng ngân sách hoặc thêm video/âm thanh/dependency mới.

| Route | Body byte tải đầu, gồm service worker | Reload offline |
|---|---:|---|
| / | 3.188.648 | Đạt |
| /adventure | 4.364.089 | Đạt |
| /autochess | 3.556.641 | Đạt |

Mỗi route dùng context Chromium mới, không HTTP compression. Đây là payload body gồm precache/warm, không phải đo thời gian mạng, tổng header hoặc FPS. `metrics.json` và `initial-load.json` lưu số đo.

## Giới hạn

WebKit Linux không phải Safari/iPhone thật; Chromium dùng Headless Shell/SwiftShader vì Chrome đầy đủ không mở được socket singleton trong môi trường QA. Dependencies tái dùng bản đã cài theo cùng lockfile. Các kiểm tra không chứng nhận FPS, Android/GPU yếu hay PvP hai thiết bị khác mạng/NAT/TURN. Chủ dự án nghiệm thu theo `HUMAN_QA.md`, review và quyết định merge. PR mới nối trên #62 khi #62 chưa merge; không tự merge hoặc deploy thủ công.
