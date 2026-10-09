# Kiểm chứng bản 2.6 · 07/10/2026

## Kiểm tra repository

- `npm run typecheck`: đạt.
- `npm test`: **108 tests / 12 files** đạt; thêm 11 bài về lifecycle nhạc/SFX, ưu tiên cutscene, tải muộn, mute, pause/resume, retry, tín hiệu combat, dữ liệu MP3 và migration tùy chọn âm thanh.
- `npm run validate:catalog`: **112 món / 35 tags / 9 events** hợp lệ.
- `npm run build`: đạt, không thêm dependency runtime. TCG chunk ~36,75 kB gzip; bốn MP3 tổng ~977 KiB, tải theo cảnh.
- `git diff --check`: đạt. MP3 là dữ liệu thật, được miễn LFS.
- Rà soát TSX theo React Best Practices: effect/listener/observer cleanup, dependency nguyên thủy của tùy chọn, audio status qua `useSyncExternalStore`, ưu tiên reader thực sự hiển thị, volume có label, dialog trả focus, lớp FX không nhận pointer.

## Luồng âm thanh · Chromium / Playwright

Production build chạy cục bộ, dùng `--autoplay-policy=user-gesture-required`, thao tác click/keyboard thật; instrument AudioContext theo dõi start/stop/decode. Không bỏ qua yêu cầu gesture.

1. Màn sảnh chưa có thao tác không tạo AudioContext/tải nhạc.
2. Cutscene đầu phát nhạc ấm; đổi câu có tiếng; vào trận đổi sang nhạc đấu. Hộp chỉnh âm thanh lồng trong cutscene đóng bằng Escape chỉ đóng hộp con và trả focus.
3. Tắt nhạc vẫn có SFX; SFX volume 0 không tạo tiếng; master mute dừng nhạc và tôn trọng cài đặt sau reload.
4. Chọn bài có lớp ánh sáng; Spark có vòng phép, tia nối, lửa và SFX; sát thương thực đúng một lần.
5. `visibilitychange` ẩn trang dừng nhạc/SFX và suspend context; hiện lại tiếp tục vị trí vòng nhạc và không replay SFX.
6. Boss phát vòng nhạc nhanh riêng.
7. Giảm chuyển động vẫn có âm; chiến thắng phát sáu nốt đúng một lần rồi vào nhạc hậu truyện. Chuyển câu không cấp thưởng lần nữa.
8. Thất bại phát năm nốt riêng và nhạc bí ẩn.
9. Chuyển sang Rương bằng SPA navigation đóng AudioContext và dừng loop.
10. Nhật ký đóng không phát nhạc; mở reader đang hiển thị mới phát; đóng dừng track.
11. Giả lập download MP3 thất bại không crash game; Phát thử tải lại thành công.
12. Không có pageerror.

| Track | Độ dài giải mã | Số kênh | Peak giải mã | RMS |
| --- | --- | --- | --- | --- |
| Story warm | 26,667 s | 2 | 0,532 | 0,127 |
| Battle | 35,556 s | 2 | 0,556 | 0,123 |
| Boss | 30,476 s | 2 | 0,558 | 0,111 |
| Story mystery | 32 s | 2 | 0,532 | 0,148 |

Đây là kiểm chứng tải/giải mã/phát và mức tín hiệu tự động; chưa có đánh giá nghe thủ công trên loa điện thoại thật hoặc kiểm chứng Safari/iOS. Trình duyệt không hỗ trợ audio vẫn chơi game được; Phát thử cho phép khởi động/retry.

## Hồi quy viewport và truyện

- Trận 3 đồng minh + 3 địch + 8 lá trên tay ở **1440×900, 1366×768, 1280×720, 1024×768, 768×1024, 390×844, 375×667, 360×640, 320×568, 844×390, 667×375**: root/arena không cần cuộn; chọn bài/đồng minh không vượt màn.
- Sprite lửa/nước/khiên, hồi máu và buff tải đúng; inspect/luật/nhật ký đóng bằng Escape và trả focus. Tab trong trận không lọt ra menu phía sau. Thám hiểm với 10 di vật vẫn vừa màn.
- 18 prebattle cutscene tải đúng minh họa; đọc/đọc nhanh/lùi trang không đổi tiến trình hoặc cấp thưởng. Nội dung khóa tiếp tục giấu spoiler; nhật ký đọc lại được; 390px có minh họa và không tràn ngang.
- Coach vẫn chỉ chọn và focus hành động hợp lệ; Enter tiêu thẻ một lần, tôn trọng Hộ vệ/khiên và phản đòn.
- Các tùy chọn mới mặc định cho hồ sơ cũ; giữ soundEnabled=false, chìa, tên, phần thưởng. Giá trị slider mới hỏng được fallback riêng, không reset hồ sơ. Không đổi schema/key tiến trình TCG, reducer, sát thương, giá gói, pool món hoặc ID thẻ.
