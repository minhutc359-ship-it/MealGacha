# Kiểm chứng ngân sách / lazy media

Ngày 16/10/2026. Nền Web 5.9.1 commit `bcb3a40`; code sửa ở lớp preload và công cụ phát hành. User story: mở mode → nhận shell/code/asset hiện tại → vào trận không tải sẵn tuyệt kỹ chưa dùng → cast tải đúng media → rời cảnh trả lease. Không có backend/API/data migration mới.

## Kết quả

- App/dev typecheck: đạt.
- 655/655 Vitest (58 file): đạt. Các bộ save, gameplay, timeline, collection và PvP hiện có vẫn qua.
- 4/4 Node tests: release source guard + 3 ca policy. Bao phủ dưới/đúng 300 MB, đúng/vượt 320 MB, 8/12 MB, JS cap độc lập và phân bổ 60 MB. Đã nối vào Web quality CI.
- Catalog 123 món / 35 tag / 9 event; 149 tham chiếu asset không thiếu; release records 605 asset / 32 runtime dependency / 3 policy: đạt. Không thay runtime dependency.
- Build guard không source/maps/archive/credential nhận diện được; cú pháp service worker đạt.

## Dung lượng

| Chỉ số | Trước | Sau | Target / cap |
| --- | --- | --- | --- |
| Dist | 255.361.946 | 255.361.476 byte | 300.000.000 / 320.000.000 |
| JS gzip | 674.700 | 674.521 byte | Giữ 675.000 |
| CSS gzip | 104.109 | 104.109 byte | Không thay đổi |
| Offline shell precache | — | 2.889.655 byte / 78 URL | 8.000.000 / 12.000.000 |

Dư địa đến trần mới: **64.638.524 byte**. Gói production không chứa JSON ngân sách hoặc script đo trong `dev/`.

## Cold launch production

Chromium 143 headless, viewport 390×844, profile mới riêng cho mỗi route, HTTP server phục vụ dist. Đếm body của mọi response từ server, gồm cài/warm service worker; không nén HTTP và không tính header. Mỗi mode chờ worker kiểm soát trang và mạng yên trước chốt số liệu. Đây là lượng dữ liệu quan sát trong kịch bản, không phải thời gian tải hay cam kết cho mọi save/thiết bị.

| Mode | Trước | Sau | Kết quả |
| --- | --- | --- | --- |
| TCG `/` | 3.186.951 | **3.186.481 byte** | Dưới 8 MB; reload offline đạt |
| Adventure `/adventure` | 4.106.422 | **4.105.952 byte** | Dưới 8 MB; reload offline đạt |
| Auto Chess `/autochess` | 3.554.944 | **3.554.474 byte** | Dưới 8 MB; reload offline đạt |

Không route nào tải MP4 khi mở mode. Không lỗi JavaScript hoặc asset 4xx trong các lượt đo. `initial-before.json` và `initial-load.json` lưu các URL media, tổng byte và trạng thái budget. Chạy lại: build trước, sau đó `PLAYWRIGHT_MODULE=... CHROMIUM_BIN=... pnpm release:load` (có thể dùng Playwright/Chromium cài tại máy; các biến cấu hình thư viện/args dùng theo môi trường).

## Media khi cast và cache

Kiểm gameplay dev qua schema/store/reducer thật trong profile riêng; không thêm route debug vào sản phẩm.

- Đội Bún riêu, Bún chả, Bánh xèo, Cơm gà, Xôi xéo, cinematic ON: trước cast **0 movie / 0 sound tuyệt kỹ**, không tải atlas ultimate cũ. Các video của năm người có tổng **6.886.638 byte**; đây là số byte video mà cơ chế preload trước kia có thể yêu cầu ngay khi vào trận, không phải phép đo thời gian tiết kiệm trên mạng thật.
- Dùng tuyệt kỹ Bún riêu: chỉ yêu cầu `bun-rieu.mp4` và `bun-rieu.mp3`; video thực phát được trong Chromium, pause giữ tiến độ, skip đóng và không đổi lại HP/shield/resources đã commit.
- Rời battle qua chuyển mode: **0 image lease**, 29.161.648 byte cache decoded còn lại, dưới trần 67.108.864 byte. Cache giữ dữ liệu để tái dùng, không đồng nghĩa còn renderer/nhân vật hoạt động trong cảnh cũ.
- Profile native mới: Cơm tấm chỉ lấy `com-tam.webp` HD và `ultimate591.webp`; không tải HD nhân vật khác hoặc MP4. Canvas đã vẽ actor ở vùng trái (13.542 pixel alpha trong mẫu), impact/pause/skip đạt. Chưa cần preload cả đội để hiển thị được cast.
- Không lỗi JavaScript / media 4xx. Chi tiết: `lazy-media-qa.json`.

## Phạm vi còn lại

- FPS 60 desktop / 30 máy yếu vẫn là mục tiêu; đợt này không benchmark GPU/Safari/iPhone/Android hoặc mạng di động thật. Giữ hệ adaptive quality, giới hạn cache và cleanup đã có.
- `release:size` tự chặn precache shell quá 12 MB ở CI; phép đo tổng cold launch gồm media là lệnh browser riêng, chưa nằm trong CI vì không thêm dependency Playwright vào dự án. Các đợt asset tiếp theo phải chạy lại `release:load`.
- Số byte theo từng asset/nhân vật là mục tiêu trung bình, không phải cap cứng. Phân bổ 60 MB là kế hoạch bổ sung, chưa phải sổ chi tiêu tự động.
- Chưa chuyển các gói media ít dùng sang CDN/phân phối ngoài repo, chưa tạo asset mới và chưa hoàn tất nội dung roadmap 6.0.
