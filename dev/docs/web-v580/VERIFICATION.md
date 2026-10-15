# Xác minh Web 5.8

Ngày kiểm tra: 15/10/2026 (UTC).

| Kiểm tra | Kết quả |
|---|---|
| `pnpm typecheck` | Đạt |
| `pnpm typecheck:dev` | Đạt |
| `pnpm test` | Đạt; 52 file / 553 test |
| `pnpm validate:assets` | Đạt; 140 mục kiểm tra, 0 thiếu |
| `pnpm validate:catalog` | Đạt; 123 món, 35 tag, 9 event |
| `pnpm build` | Đạt |
| `pnpm release:size` | Đạt; 255,436,263 bytes, JS gzip 656,981 bytes, 0 leak |
| `pnpm release:records` + `pnpm release:verify` | Đạt; 32 runtime dependency, 591 asset, 3 policy |
| `node dev/tools/verify-web580.mjs` | Đạt; 6 luồng desktop/mobile, 0 page error, 0 asset thiếu |
| `python3 dev/tools/verify-media530.py` | Đạt; giải mã 139 video 1280 × 720 và 139 audio |
| `ffprobe` theo `music-manifest.json` | Đạt; 13/13 MP3 đọc được, tổng 9,440,084 bytes |

## Phạm vi tự động

- Test game xác nhận bốn map mới có 16 model địch riêng; multiplier `×1/×3/×8`, modeStars tách biệt, kỹ năng tinh anh/boss theo độ khó và luật tự chọn kẻ địch gần nhất.
- Test media xác nhận đủ 139 video 1280 × 720, H.264 High Profile, mỗi tệp trên 500 KB, đủ mô tả tuyệt kỹ và không còn caption đồng hồ cũ.
- QA Chromium kiểm tra tooltip rương, hai tùy chọn không chồng nhau, mặc định ảnh món, kết quả thẻ Vị Linh khi bật, và popup nằm trọn viewport ở 1440 × 900 lẫn 390 × 844.
- QA Adventure kiểm tra sảnh hiển thị trọn bản đồ 3:2 ở desktop/mobile, tám tab map, bốn art mới, opacity nhân vật bằng 1, ba nút độ khó, dialog nằm đúng tâm, loading dùng `contain`, không có nút target, nghi thức READY/WIN nằm trọn arena và video 720p.
- QA chuyển mode xác nhận lớp loading xuất hiện trước khi đổi route, ảnh luôn thuộc bộ năm minh họa và dùng `contain` để không phóng/cắt.

Ảnh QA có thể tái tạo bằng script và được giữ ngoài Git; kết quả máy đọc nằm trong [browser-qa.json](browser-qa.json). Đây không phải đo FPS trên thiết bị thật; Safari chưa được kiểm tra. Build còn cảnh báo thông tin cho chunk `rpg-presentation` lớn hơn 500 KB sau minify, nhưng tổng JavaScript gzip vẫn nằm trong guard.
