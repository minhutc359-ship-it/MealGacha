# Kiểm chứng Web 5.9.14

## Code và asset

- **744/744 Vitest, 68 file** đạt; TypeScript app/dev đạt.
- **256 pose, 16 atlas**, tổng **6.869.870 byte**. Hash, alpha, gutter, pivot chân và giải mã file runtime đạt; đã xem toàn bộ contact sheet.
- Audit thực: **57/139** bộ 32 pose; còn 78 portrait-only + 4 model cũ. Auto Chess giữ 44/44 cặp model riêng, 38 unit dùng atlas 32 pose và bốn NPC dùng atlas legacy.
- Asset register có 682 file, dependency runtime graph 32 package. Không thêm dependency sản phẩm, video hay âm thanh. 13 chứng cứ quyền asset cũ vẫn pending; báo cáo không phải commercial clearance.
- Test hồi quy xác nhận TCG/Adventure cùng resolve tám ID mới, chân dung là ô canon, model và VFX không dùng chung nhận diện, đủ pose và không có MP4 tuyệt kỹ.

## Browser và thiết bị

Runtime hiện tại không có Playwright/browser binary nên chưa tạo lại ma trận Chromium/WebKit riêng cho commit 5.9.14. Bộ QA Chromium của 5.9.13 đã kiểm tra pipeline Adventure HD, TCG, banner và offline trên cùng base; tám asset mới đi qua cùng resolver và pipeline đó. Chứng cứ hiện tại gồm contact sheet, inspector, unit/integration test và build sản phẩm.

Safari/iPhone, máy Android yếu và browser QA trên bản deploy vẫn thuộc phần nghiệm thu của chủ dự án theo `HUMAN_QA.md`.

## Production và dung lượng

Build sạch đạt **132.910.742 byte / 740 file**; JS gzip **673.853 / 675.000 byte**, CSS gzip 103.361 byte. Release guard không thấy source, source map, archive hoặc credential; không nâng budget.

16 atlas mới tải lười khi nhân vật xuất hiện. Không có số cold-load mới vì phép đo cần Chromium; ba route tải đầu không nhập trực tiếp các atlas cohort này.

## Giới hạn

Chưa chứng nhận FPS, nhiệt/bộ nhớ phiên dài, PvP hai máy khác mạng/NAT/TURN hoặc quyền phát hành thương mại. Lệnh commercial-rights dừng đúng thiết kế với 13 asset cũ thiếu chứng cứ. Chủ dự án nghiệm thu, review và quyết định merge; không tự merge hoặc deploy thủ công.
