# Kiểm chứng Web 5.9.4

Ngày 16-10-2026. Nền `25fdfb0ab724031c2ab79b537c83d6afb95dad7b`, branch `feat/web-v594-familiar-spirits`, nối tiếp PR #55 chưa merge.

Luồng kiểm chứng: người chơi chọn tuyệt kỹ → reducer cam kết kết quả trận → manifest chọn đúng model/portrait/VFX/SFX → hiển thị contact → skip hoặc kết thúc → trở lại trận và giải phóng lease. Đây là game lưu phía client; luồng này không gọi API/database để tính sát thương.

## Kiểm tra tự động

- TypeScript app và dev: qua. Vitest: **668 test / 61 file** qua; thêm kiểm tra bốn ID xuyên chế độ, contact 960 ms, parse save, double-skip không thêm sát thương/cost hoặc thay roster. Các kiểm tra cũ của starter, đầu bếp, engine, TCG và Auto Chess vẫn qua.
- Node release/budget guards: **4 test** qua. Catalog: 123 món, 35 tag, 9 event hợp lệ. Asset validator: 128 tham chiếu tĩnh, không thiếu; kiểm tra manifest bổ sung đường dẫn động của 15 nhân vật sản xuất.
- Release records: **651 tài nguyên, 32 phụ thuộc runtime, 3 chính sách**; đối chiếu hash qua. Rights inventory vẫn liệt kê 13 tài nguyên cũ thiếu chứng cứ; không chạy/chứng nhận phát hành thương mại.
- Build production sạch, release guard, size guard và syntax SW qua. Không source, map, archive hoặc credential được nhận diện lọt vào dist. Tất cả URL precache tồn tại; không giữ tệp phim cũ từ build trước.
- Giải mã media: **124 H264 + 139 MP3**, không lỗi; **15 timeline native**. Công cụ dựng phim bỏ qua các ID native, không tạo lại bốn MP4 đã gỡ.
- Asset QA: **13 WebP / 272 ô/ảnh**, tất cả có nội dung và hash riêng trong từng file. Xem `asset-qa.json`, sidecar và prompt/provenance. Đã xem contact sheet, recovery, portrait, VFX và ảnh gameplay; sửa mảnh vũ khí/VFX lân cận trước vòng cuối.

## Gameplay / trình duyệt

Chromium 143 headless, SwiftShader, cấu hình dev và production:

| Ranh giới | Kết quả / bằng chứng |
| --- | --- |
| Adventure pixel | 320×568, 390×844, 844×390, 1440×900: đủ năm actor pixel (bốn mới + Cơm tấm), deck trong viewport, không cuộn ngang |
| Tuyệt kỹ bốn nhân vật | Ghi nhận đủ preparation → casting → impact → finisher → recovery, tự trở lại trận. Thử thêm Cơm tấm để kiểm tra tương thích |
| Pause / skip | Pause giữ tiến độ; skip đóng cinematic; không có video hay cut-in cũ cùng native actor. Production đọc save đã tạo từ dev và tung chiêu Bún chả |
| Cold cast | Vào trận chưa tải media tuyệt kỹ. Cast Bún riêu chỉ tải HD `bun-rieu.webp` và `ultimate.webp`, actor canvas thực sự có pixel; không tải HD của cả party hoặc MP4 bốn nhân vật |
| Reduced motion | Cơm gà giữ pose impact tĩnh và skip hoạt động |
| Auto Chess | Đội hình bốn nhân vật mới + Cơm tấm vào trận thật, model HD và VFX đúng ID |
| TCG | Năm model lên bàn, thực hiện tấn công qua thao tác chọn nguồn/mục tiêu trên UI; artwork món ăn giữ nguyên |
| Chân dung | Bốn ảnh standalone đúng loài, tải qua component `SpiritArt`, tỷ lệ theo metadata |
| Cleanup | Năm cast nối tiếp và cast đồng thời: tối đa 3 cue quan sát được, cuối bài tải 0 cue. Rời Adventure bằng Link trong app: 0 active lease |
| Hồi quy MP4 | Party năm nhân vật còn dùng phim: trước cast không tải media, chỉ phim/SFX Xôi xéo được gọi sau chọn. Pause/skip không recast; lease về 0. Native Cơm tấm vẫn vẽ được từ cold cache |
| Lỗi runtime | Console exception 0; asset HTTP lỗi 0 |

Cache ảnh đỉnh **60.620.320 / 67.108.864 byte (64 MiB)**. Sau unmount, LRU giữ dữ liệu trong ngân sách và không giữ active lease. Đo rAF khi nhiều chiêu: **52,90 fps**, p95 gap **16,80 ms**, nền cùng phiên **30,29 fps**. Headless có warm-up và điều tiết chất lượng; các số này kiểm tra hồi quy/cleanup, không thay benchmark thiết bị thật hoặc chứng minh game chạy 60 FPS trên mọi máy. Mục tiêu desktop/máy yếu vẫn 60/30 FPS.

Audit toàn inventory: 139 thẻ unit, 44 unit Auto Chess và 139 portrait. Không có nhóm trùng hash portrait hoặc dùng cùng model:row cho các ID khác nhau trong các nhóm đang chạy được kiểm tra. **94 thẻ vẫn dùng artwork một tư thế**, chưa đạt bộ hoạt họa đầy đủ. Các instance của cùng enemy ID qua nhiều wave là tái sử dụng có chủ đích; definition tương thích không dùng tiếp tục được ghi riêng. Audit chính xác này không thay đánh giá độ giống về mỹ thuật. Xem `model-audit.json`.

## Dung lượng và tải offline

- Build **250.611.451 byte = 250,61 MB**, giảm **2.434.163 byte** so với nền 5.9.3.
- Art mới **3.068.850 byte**, gỡ **5.502.936 byte** MP4 không còn dùng.
- JavaScript gzip **674.129 / 675.000 byte**, CSS gzip **103.519 byte**. Giữ trần cũ, không tăng để né kiểm tra.
- Tổng build mục tiêu 300 MB / trần 320 MB, còn **69.388.549 byte**. SW shell gồm 74 URL, **2.875.666 byte**. Không tăng cache image/audio/SW.

Đo fresh context từng route, tính cả SW precache và warm requests; số byte body chưa nén HTTP, không tính header hoặc coi là thời gian tải:

| Route | Body byte đã giao | Offline reload |
| --- | ---: | --- |
| / | 3.172.363 | Qua |
| /adventure | 4.347.804 | Qua |
| /autochess | 3.540.356 | Qua |

Mọi route dưới mục tiêu 8 MB / trần 12 MB, không gọi MP4 lúc mở game. Xem `initial-load.json`, `lazy-media-qa.json`, `metrics.json`, `browser-qa.json` và `evidence/`.

## Chưa nghiệm thu toàn bộ 6.0

Cần chơi thử trên thiết bị thật; tiếp tục roster/boss và 94 thẻ còn dùng artwork, rig/chuyển động nâng cao nếu có lợi cho chất lượng. Không thêm bộ đi bốn hướng chưa có consumer. Các giới hạn và công việc tiếp nối ở `UPDATE.md`. CI/Vercel phải xem theo commit PR; các số trong báo cáo này là kết quả local đã thực hiện.
