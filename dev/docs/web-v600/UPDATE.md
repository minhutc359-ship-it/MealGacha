# Chuẩn bị Web 6.0 · Ngân sách và tải theo nhu cầu

Đã áp dụng trần 320 MB / cảnh báo 300 MB theo đề xuất mới, kế thừa Web 5.9.1. Đây là cập nhật chính sách/phân phối, không gắn nhãn game là đã hoàn tất nội dung 6.0. Không đổi phiên bản save, gameplay hoặc xóa media đang dùng.

## Hoàn thành

- Một policy JSON cho trần build, target/cap cold launch, JS guard độc lập, phân bổ 60 MB và các mục tiêu asset/FPS.
- `release:size` đọc policy, cảnh báo tại 300 MB, chặn trên 320 MB, kiểm precache offline shell trong budget tải ban đầu. Giữ JS gzip 675 KB.
- Bỏ fetch trước video/SFX của toàn đội khi vào Adventure. `RpgCinematic` tự tải đúng media của cast đang hiện, dùng lại các video/âm thanh cũ. Bỏ preload atlas ultimate không có phần tử hiển thị tương ứng trong battle hiện tại; vẫn giữ file gốc.
- Thêm phép đo tải mở cả ba mode trên production, tính luôn precache/warming của service worker. Kiểm reload offline sau lần truy cập đầu.
- Kiểm browser với nhóm năm nhân vật dùng video, và một native starter: trước cast không tải media tuyệt kỹ; đúng chiêu mới tải; pause/skip không recast; rời battle trả image lease.
- CI chạy thêm các ca biên ngân sách. `release:load` và `test:web-budget` là lệnh có thể tái sử dụng.

## File/module thay đổi

| File | Vai trò |
| --- | --- |
| `dev/web-budget.json` | Chính sách đã duyệt và phân bổ dự kiến |
| `dev/tools/web-budget.mjs` | Đọc/kiểm chính sách và kết quả đo |
| `dev/tools/release-size.mjs` | Guard 300/320 MB, JS và precache shell |
| `src/components/game/RpgBattleView.tsx` | Bỏ tải trước toàn đội/atlas chưa dùng |
| `dev/tools/measure-web-load.mjs` | Đo cold launch production cả 3 mode và offline reload |
| `dev/tools/verify-media-loading600.mjs` | Kiểm lazy video/native và cleanup thực |
| `dev/tests/web-budget.test.mjs` | Biên 300/320 MB và 8/12 MB |
| `.github/workflows/web.yml`, `package.json` | Nối kiểm tra và lệnh dùng lại |
| `dev/docs/release/build-size.json`, tài liệu/JSON trong `web-v600` | Số liệu và bằng chứng |

**Asset/model/animation bổ sung: không có.** Không dùng ngân sách mới để thay file đạt chất lượng; mọi asset của PR #53 giữ nguyên.

Kết quả đo và giới hạn: `VERIFICATION.md`. Chi tiết chính sách: `BUDGET.md`.
