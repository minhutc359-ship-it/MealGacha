# Kiểm chứng Web 5.9.15

## Code và cốt truyện

- **748/748 Vitest, 69 file** đạt; TypeScript app/dev đạt.
- Bốn test mới xác nhận đủ 9 chương TCG và 8 chương Adventure, TCG chỉ mở sau cả ba stage, Adventure chỉ mở sau boss và kết thúc TCG bám save.
- Tiêu đề, hook, thoại, lựa chọn và kết thúc lấy từ `story.ts`, `narrative.ts`, `adventureRpg/content.ts` và `adventureRpg/story.ts`; không duy trì bản sao lời thoại riêng.
- Không đổi storage/schema. Quy tắc mở trang là hàm thuần suy ra từ `clearedStages`, `stars`, `choices` và `storyEnding` hiện có.

## Asset

- **19/19 WebP**, 1086×1448, tổng **10.137.088 byte**, giải mã được và có SHA-256.
- Hai bìa và 17 trang năm khung đã được kiểm tra bằng contact sheet. Mỗi file có provenance Built-in Imagegen, source module và reference nhận diện.
- Asset chỉ được trình duyệt tải khi bìa hoặc một chương đã mở được chọn. Nút chương khóa không render ảnh.
- Asset register và dependency graph đạt; không thêm package sản phẩm, video hay âm thanh. 13 chứng cứ quyền asset cũ vẫn pending, nên báo cáo chưa phải commercial clearance.

## Build và trình duyệt

- Build sạch đạt **143.054.920 byte / 759 file**; JS gzip **674.966 / 675.000 byte**, CSS gzip 104.174 byte. Release guard không thấy source, source map, archive hoặc credential; không tăng budget.
- Runtime hiện tại không có Playwright/browser binary nên chưa lập lại ma trận Chromium/WebKit cho commit này. Responsive, thao tác chạm, tải lười/offline và tiến độ thật cần được nghiệm thu trên bản deploy theo `HUMAN_QA.md`.

## Giới hạn

Chưa chứng nhận Safari/iPhone, Android yếu, FPS/RAM/nhiệt, PvP hai mạng hoặc quyền phát hành thương mại. Chủ dự án nghiệm thu, review và quyết định merge; không tự merge hoặc deploy thủ công.
