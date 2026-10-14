# Kiểm chứng Web 5.2

- **513 tests / 47 files**: typecheck app/dev, catalog 123 món, 143 asset refs / 0 thiếu, 356 asset records, release verify, production build, SW syntax, size guard, diff check.
- 8 test mới: ba/four-wave formation và đội chuẩn bị vượt bốn boss; snapshot cấp trung bình chỉ từ đội mang vào; AI trận cũ; tài khoản mới thắng màn đầu nhưng thất bại boss khi chưa chuẩn bị; bốn cơ chế boss / guard; snapshot dungeon qua XP/reload; dungeon 5.1 giữ stats/lịch cấp cũ; bậc cao còn mạnh hơn gần trần cấp.
- Kiểm thử tiến trình 24 màn dùng **tài nguyên thực kiếm được** để lên cấp/kỹ năng/trang bị, focus quân hỗ trợ, che đòn báo trước và farm bốn tầng đầu trước khi đủ sức đánh boss dungeon. Không sửa HP/công để ép thắng trong kiểm chứng progression. Kiểm thử dungeon đầy đủ năm tầng / tài nguyên / trại nghỉ vẫn có đội đã chuẩn bị.
- Mẫu balance `opening-qa.json`: đội khởi đầu cấp 1, gear 0, kỹ năng 1 thắng màn đầu trong **39.75s mô phỏng**; cố đi boss chưa chuẩn bị thất bại ở giới hạn 180s. `balance-qa.json`: boss 4 vùng với đội đúng cấp gợi ý, kỹ năng tối đa 6, gear 3/3/2, AUTO + focus + guard: **61.25 / 53.75 / 69.5 / 61.75s mô phỏng**. Tốc độ ×2 giảm thời gian thực; đây không phải thời lượng cố định cho mọi đội.
- `verify-combat520.mjs`: **1440×900, 390×844, 844×390, 320×568, 390×700**. Neo / nhãn nằm trong sân, HUD tách khỏi sân, năm vai trò tung tuyệt kỹ thật bằng nút, focus, cue đánh thường, pause/reload khớp toàn bộ trận, nút trong viewport, reduced motion, 0 JS error / thiếu asset. 390×700 còn vào dungeon bậc 3 bằng UI, chốt đội cấp TB 35 / địch cấp 38, pause/reload giữ scaling và tài nguyên/account. Các fixture render có cấp/HP/energy được chuẩn bị để xem chiêu, không dùng làm bằng chứng cân bằng.
- Giữ cùng DOM Canvas qua chuỗi chiêu; MutationObserver ghi **0 lần ghi lại width/height**. Không dùng số này để suy thành 60 FPS.
- `verify-production520.mjs`: `/adventure`, `/game` (TCG), `/autochess`, `/chest`; mở giới thiệu bằng UI trên build sản xuất, có Canvas, không fallback lỗi giới thiệu, save `foodchest.tcg.v1` không đổi; chunk Pixi tải và Canvas Pixi được tạo ở Rương. Dock RPG immersive không đè hàng tuyệt kỹ. Tắt thông báo sự kiện ở context QA bằng nút thật.

Chạy lại với `PLAYWRIGHT_MODULE`, `CHROMIUM_BIN`, `CHROMIUM_LIB_DIR` trỏ đến bộ QA ngoài dependency sản phẩm. Scripts dùng cổng 4200/4201 và tự đóng server/browser. Ảnh chọn để review nằm cạnh tài liệu; script tái tạo ảnh ở mọi viewport.

Không chạy lại mạng chéo / TURN hoặc Safari, không build native; không khẳng định FPS thiết bị thật / điểm 9/10. Không merge tự động.
