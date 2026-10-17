# Kiểm chứng Web 5.9.5

Ngày 16-10-2026, nền master `444edc01fe4ac9610d1eb9e5cd73a8b35fdcdc88`, branch `feat/web-v595-rare-spirits`.

Luồng: chọn kỹ năng → reducer lưu kết quả → manifest chọn pose/portrait/VFX/SFX → hiển thị contact → skip/kết thúc → trở lại trận và giải phóng lease. Trận được tính phía client; không có API/database mới trong đợt này.

## Các kiểm tra đã qua

- TypeScript app và dev; **676 Vitest / 63 file**, gồm bốn ultimate qua reducer, parse save/double-skip không thêm cost/damage/reward, nhận diện đa mode, contact và ba ca hồi phục image cache.
- Cache contract: các consumer đang hiển thị dùng chung request lỗi; chỉ bỏ entry lỗi khi consumer cuối giải phóng, lần sau tạo request mới; error đến muộn từ entry cũ không xóa entry retry; ảnh tải thành công vẫn được tái sử dụng. Double release không giảm lease lần thứ hai.
- **4 Node release/budget guard**; catalog 123 món / 35 tag / 9 sự kiện; asset validator 128 tham chiếu tĩnh, không thiếu. Manifest kiểm tra thêm đường dẫn động của 19 nhân vật sản xuất.
- Release register: **660 tài nguyên, 32 phụ thuộc runtime, 3 chính sách**, đối chiếu hash qua. Rights inventory còn nguyên 13 tài nguyên cũ cần chứng cứ; không chạy/chứng nhận commercial release.
- Build sạch, release guard, size guard, SW syntax qua. Không source, map, archive hoặc credential được nhận diện lọt vào dist; toàn bộ URL precache tồn tại. Dist có đúng 120 MP4, không giữ phim của bốn ID đã chuyển native.
- Decode media: **120 H264 + 139 MP3**, không lỗi, **19 timeline native**. Xem `../web-v530/media-qa.json`.
- Asset QA: **13 WebP / 272 ô và ảnh**, tất cả có nội dung/hash riêng trong từng file, kích thước và SHA-256 ghi ở `asset-qa.json`. Đã xem contact sheet HD, bản pixel ở gameplay, pose nằm, VFX, portrait và ảnh ba mode; sửa nguồn/crop trước khi chốt.

## Trình duyệt / gameplay

Chromium 143 headless, SwiftShader; cùng source và artifact production cuối. Core và hồi phục media được kiểm tra theo hai scope: `browser-core-qa.json`, `media-recovery-qa.json`. Tool `verify-web595.mjs` hỗ trợ chạy toàn bộ hoặc `--media-only` để kiểm tra riêng lỗi tải mà không lặp bài tải hiệu năng.

| Ranh giới | Bằng chứng |
| --- | --- |
| Adventure | 320×568, 390×844, 844×390, 1440×900: năm actor pixel (bốn mới + Cơm tấm), không cuộn ngang, deck trong viewport |
| Native ultimate | Bốn nhân vật và Cơm tấm lần lượt đủ preparation/casting/impact/finisher/recovery, tự kết thúc; không chồng video/cut-in/model |
| Cold cast | Vào trận chưa tải media tuyệt kỹ. Chọn Chả cá chỉ tải HD `cha-ca-la-vong.webp` và FX chung `ultimate.webp`; canvas thực sự có pixel actor |
| Pause / skip | Pause giữ tiến độ, skip đóng cinematic. Game giữ trạng thái pause sau skip; test tiếp tục trận trước khi thử cast mới |
| Offline chưa có HD | Bánh chưng vẫn vẽ từ pixel đã có trong trận (12.397 pixel alpha được đếm ở nửa actor); FX dùng geometry, skip được |
| Trở lại có mạng | Sau giải phóng ảnh lỗi và cast mới, source chuyển thành HD; ảnh evidence `recovery.webp`. Không còn entry lỗi ngăn tải lại |
| Reduced motion | Bánh cốm giữ pose impact tĩnh, skip hoạt động |
| Auto Chess | Đội hình bốn mới + Cơm tấm vào trận thực, hiển thị model HD đúng ID |
| TCG | Cả năm model lên bàn; tấn công bằng thao tác chọn actor/mục tiêu trên UI, tranh món ăn giữ nguyên |
| Portrait | Bốn chân dung đúng thiết kế, tải qua `SpiritArt` standalone theo metadata |
| Production | Đọc save đã tạo từ dev, chạy native Bánh chưng, pause/skip hoạt động |
| MP4 còn dùng | Năm actor legacy: trước cast không tải phim/SFX; chỉ Xôi xéo được tải sau chọn. Pause/skip không recast, rời trận lease về 0. Cơm tấm native vẫn cold-load và vẽ được |

Năm cast nối tiếp và cast đồng thời: tối đa **3 cue quan sát được**, kết thúc còn **0 cue**. Cache ảnh đỉnh **60.620.320 / 67.108.864 byte (64 MiB)**; chuyển sang TCG bằng Link trong app còn **0 active lease**. Ca offline rồi online cũng giải phóng lease về 0.

Đo rAF trong bài tải: **55,72 fps**, p95 gap **16,80 ms**, nền cùng phiên **35,94 fps**. Headless có warm-up và cơ chế chất lượng thích ứng; số này kiểm tra hồi quy/cleanup, không thay benchmark điện thoại hoặc chứng minh 60 FPS trên mọi desktop. Mục tiêu thiết bị thật vẫn 60/30.

JavaScript exception **0**, asset HTTP lỗi **0** trong các kiểm tra; request ảnh/âm thanh chưa cache ở ca offline được chủ động làm thất bại để kiểm tra fallback. Không khẳng định âm thanh chưa tải có thể phát khi mất mạng.

Audit inventory: **139 unit TCG, 44 unit Auto, 139 portrait**; không có nhóm trùng hash portrait hay cùng model:row giữa các ID khác nhau trong nhóm đang chạy được kiểm tra. **94 thẻ TCG vẫn dùng artwork một tư thế**, chưa có model hoạt họa đầy đủ. Dùng cùng enemy ID ở nhiều wave là tái sử dụng có chủ đích; definition tương thích không dùng được liệt kê riêng. Audit chính xác không thay đánh giá độ giống về mỹ thuật, xem `model-audit.json`.

## Dung lượng / tải ban đầu

- Build: **247.997.556 byte = 248,00 MB**, giảm **2.613.895 byte** so với nền 5.9.4.
- Thêm art **3.272.444 byte**, gỡ MP4 **5.887.986 byte**. Không tăng image/audio/SW cache budget.
- JS gzip **674.641 / 675.000 byte**, CSS gzip **103.519 byte**. Còn 359 byte trong ngân sách JS; batch sau cần tối ưu mã trước khi bổ sung, không tự tăng trần.
- Tổng build mục tiêu 300 MB / tối đa 320 MB, còn **72.002.444 byte**. Offline shell: **2.877.313 byte**, 74 URL.

Fresh context mỗi route, gồm SW precache và warm requests; byte body chưa nén HTTP, không tính header hoặc coi là thời gian tải:

| Route | Body byte đã giao | Offline reload |
| --- | ---: | --- |
| / | 3.174.010 | Qua |
| /adventure | 4.349.451 | Qua |
| /autochess | 3.542.003 | Qua |

Tất cả dưới mục tiêu 8 MB / trần 12 MB, không MP4 lúc mở game. Xem `initial-load.json`, `lazy-media-qa.json`, `metrics.json` và `evidence/`.

## Phạm vi còn lại

Cần kiểm thử thiết bị thật, Safari/iOS và PvP hai thiết bị; tiếp tục roster P2, quái/tinh anh/boss P3, quyền asset cũ và phần rig/chuyển động nâng cao theo lợi ích thực tế. Đây là đợt P2 đầu tiên đã tích hợp, chưa phải nghiệm thu toàn Web 6.0. CI/Vercel phải đối chiếu commit PR; báo cáo này ghi kết quả local đã thực hiện.
