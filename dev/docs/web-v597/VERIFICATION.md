# Kiểm chứng Web 5.9.7

17-10-2026, nền `e2bdc291866545dee274f763714c4fffc97221f0`. Các kiểm tra chạy trên source 5.9.7 và build production tại máy QA, Chromium 153 headless / SwiftShader.

Luồng: bấm tuyệt kỹ → reducer chốt kỹ năng và lưu serial → banner/model/pháp ấn/VFX/SFX → pause, skip hoặc tự kết thúc → xác nhận serial và tiếp tục trận. Không thêm API/database; game xử lý tại client.

## Tự động

- 683 Vitest / 64 file qua; các transaction, reload, double completion, phần thưởng và bản lưu cũ tiếp tục có kiểm tra. Hai ca showcase mới kiểm đủ 139 mapping ảnh/tên/icon và cleanup cache media, bao gồm không mở lại cache cũ đã xóa.
- TypeScript app/dev, 4 Node guard, catalog 123 món/35 tag/9 sự kiện, asset validator (128 tham chiếu tĩnh, missing 0), release records/size/build/SW syntax qua.
- 553 asset runtime còn hồ sơ/hash; không thêm phụ thuộc hay ảnh runtime. Giải mã 139 MP3 (tất cả giữ nguyên), 0 MP4. Chi tiết `media-qa.json`.
- Release guard từ chối đường video tuyệt kỹ đã nghỉ; `removed-videos.json` chứa 116 đường dẫn và 150.471.085 byte đã gỡ.

## Trình duyệt

| Ranh giới | Kết quả |
| --- | --- |
| Adventure 320×568, 390×844, 844×390, 1440×900 | Deck trong viewport, năm hệ/portrait đúng ID, banner nằm trong sân và dưới nửa chiều cao sân |
| Cast/impact | Có pixel VFX thật trên battlefield; model xuất chiêu không bị màn phim che; snapshot giữ HP/shield đến contact |
| Pause/skip | Progress đứng yên khi pause; skip không lặp banner, không tung lại chiêu, không đổi tài nguyên hoặc trả thưởng thêm |
| Liên hương | Năm cast nối tiếp trên mỗi viewport; ×2/×3 được hiển thị |
| Reload/tự hoàn tất | Transaction đang dở được đọc lại; xong một lần, không tạo burst thứ hai. HP có thể tiếp tục giảm do Bỏng khi trận chạy lại, không bị hiểu nhầm là recast |
| Bản lưu cũ tắt cinematic | Hiện banner ngắn; trận không thêm transaction chặn đồng hồ |
| Reduced motion | Banner tĩnh, icon/pháp ấn tĩnh và skip hoạt động |
| Auto Chess | Kỹ năng thực từ live frame ở 390×844 và 1280×800; banner đặt dưới thông báo Sương, không chồng chữ |
| TCG | Chọn Một chén trà và bấm Thi triển thật; banner hệ Thủy, model caster và pháp ấn có trên sân |
| Production | Hydrate Phở gà (nhân vật trước đây dùng video), pause/resume/skip qua, không HTMLVideo/MP4 |
| Production offline | Reload trận đã lưu qua Vite preview có `Vary: Origin`; core tĩnh dùng ignoreVary, không thay dữ liệu người chơi |
| Cold launch | Ba route fresh context gồm cài SW, đều reload offline được; không preload video |

Bằng chứng: `browser-qa.json` (7 nhóm), `modes-qa.json` (3 nhóm), `production-qa.json`, `initial-load.json`, `evidence/`. Các lượt QA hoàn tất có JavaScript exception 0, asset HTTP lỗi 0 và request MP4 0. Screenshot QA dùng dữ liệu tổng hợp, không phải save của người chơi.

## Dung lượng và giới hạn

- Build sạch **95,585,221 byte / 611 file**, giảm **150,470,253 byte** so với 5.9.6. JS gzip **667,053 / 675.000 byte**, CSS gzip **103,030 byte**. Không tăng ngân sách. Số liệu chi tiết ở `metrics.json`.

| Route | Body byte đã giao, gồm SW | Offline reload |
| --- | ---: | --- |
| / | 3,172,038 | Qua |
| /adventure | 4,347,479 | Qua |
| /autochess | 3,540,031 | Qua |

Body chưa nén HTTP, không phải toàn bộ header mạng hay chứng nhận FPS. Không thêm benchmark FPS mới trong đợt này; giảm media không tự chứng minh tốc độ trên thiết bị thật. Chưa nghiệm thu Safari/iOS, GPU/máy yếu thật hoặc PvP hai thiết bị. Các chuyển động nhiều pose cho 94 thẻ còn dùng portrait, quái/boss còn thiếu và 13 chứng cứ quyền asset cũ vẫn là việc riêng của roadmap 6.0. Không phát hành Android hoặc tự merge.

Tái chạy: `pnpm test`, `pnpm typecheck`, `pnpm typecheck:dev`, `pnpm test:web-budget`, `pnpm validate:catalog`, `pnpm validate:assets`, `pnpm release:verify`, `pnpm build`, `pnpm release:size`; ba script `dev/tools/verify-showcase*597.mjs` và `measure-web-load.mjs`. Browser QA dùng Playwright/Chromium ngoài runtime sản phẩm qua `PLAYWRIGHT_MODULE`, `CHROMIUM_BIN`, `CHROMIUM_LIB_DIR`.
