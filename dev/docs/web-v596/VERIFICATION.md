# Kiểm chứng Web 5.9.6

Ngày 16-10-2026. Nền 5.9.5 `4246121132827fcc993b03de3aea0c32c2a2f97e`, cùng nhánh `feat/web-v595-rare-spirits` / PR #58.

Luồng được kiểm tra: chọn kỹ năng trên UI → reducer lưu kết quả → manifest chọn ảnh/pose/VFX/SFX → hiển thị contact → pause/skip/kết thúc → trở lại trận và giải phóng lease. Game xử lý tại client, không thêm API, database, biến môi trường hoặc dịch vụ mới.

## Kiểm tra tự động

- **681 Vitest / 63 file**, gồm identity đa mode, 23 manifest có path/pose/VFX/SFX hợp lệ, cả tám ID P2 qua reducer/save reload/double skip không recast hoặc đổi cost/damage/reward.
- TypeScript app và dev; **4 Node guard**; catalog 123 món / 35 tag / 9 sự kiện.
- Asset validator: 128 tham chiếu tĩnh, missing 0; đường dẫn động của 23 manifest được kiểm tra thêm.
- Release records: **669 asset, 32 phụ thuộc runtime, 3 chính sách**, đối chiếu hash qua. Rights giữ 13 mục cũ pending; không chứng nhận commercial release.
- Decode **116 H264 + 139 MP3**, không lỗi; **23 timeline native**. Xem `../web-v530/media-qa.json`.
- Art: **13 WebP / 272 ô/ảnh** không rỗng, hash riêng trong mỗi file, đủ kích thước và alpha. `asset-qa.json` lưu byte/hash. Đã xem source/atlas/pose nằm, portrait và ảnh gameplay; sửa pose chạm ô, gậy quá rộng và rect VFX trước khi chốt.
- Build sạch, release guard, size guard, SW syntax qua; không source, map, archive, symlink hay credential được nhận diện lọt vào dist. Có đúng 116 MP4; không còn phim của bốn ID mới chuyển native.

## Trình duyệt và gameplay

Chromium 143 headless / SwiftShader. Cùng application source và artifact production cuối; `browser-core-qa.json` giữ 19 ca core đã đạt. `production-renderer-qa.json` kiểm tra riêng renderer production, `chest-input-qa.json` ghi thao tác chuột thật sau đóng thông báo.

| Ranh giới | Kết quả/bằng chứng |
| --- | --- |
| Adventure | 320×568, 390×844, 844×390, 1440×900: năm actor pixel (bốn mới + Cơm tấm), không tràn ngang, deck trong viewport |
| Native ultimate | Cả bốn mới + Cơm tấm đủ preparation/casting/impact/finisher/recovery; một actor, không video/cut-in chồng |
| Cold cast Cà phê trứng | Chỉ tải HD của nhân vật được chọn và FX chung; actor thực sự được vẽ, không preload media cả party |
| Pause/skip | Dừng giữ progress, skip đóng cinematic; reload/double skip không tính lại kỹ năng |
| Offline chưa có HD | Cốm vẫn vẽ bằng pixel đã có: 13.041 pixel actor alpha được đếm; skip được |
| Online trở lại | Cast mới phục hồi HD, rời trận lease về 0 |
| Reduced motion | Pose impact tĩnh, skip hoạt động |
| Auto Chess | Bốn mới + Cơm tấm trong trận thực, HD đúng ID |
| TCG | Năm model trên bàn và tấn công bằng chọn actor/mục tiêu trên UI |
| Portrait | Bốn portrait tải qua SpiritArt, đúng model/canon, layout standalone |
| Production Adventure | Hydrate save từ fixture, chạy native Cốm, pause/skip được |
| Production rương | WebGL thực vẽ 25.129 pixel alpha; ảnh/UI sau đóng popup và hover chuột thật được ghi riêng |
| Production ArenaScene | Màn rain-harbor-1, WebGL thực vẽ 1.117 pixel alpha |
| Context loss | Arena chuyển Canvas2D, còn 2.632 pixel được vẽ, không exception |
| Production reduced motion | Arena dùng Canvas, data-quiet=true |
| Media legacy | Chỉ Xôi xéo được tải phim/SFX sau khi chọn; native Cơm tấm vẫn tải đúng HD, pause/skip không recast, rời trận lease về 0 |

Bài renderer ban đầu dùng fixture luyện tập nên không có ArenaScene (consumer đó chỉ chạy ở màn chiến dịch index ≥18). Đã sửa fixture và kiểm tra riêng ranh giới này; không sửa application vì một expectation sai trong test. Khi chụp rương, đóng thông báo sự kiện để xem UI bên dưới. Script dùng chung hỗ trợ các scope, giữ 19 ca đã qua trên cùng artifact thay vì lặp toàn bộ bài tải hiệu năng.

Năm cast liên tiếp và kỹ năng đồng thời: tối đa **3 cue quan sát được**, cuối còn **0 cue**. Cache ảnh đỉnh **60.620.320 / 67.108.864 byte**; chuyển route bằng Link còn **0 active lease**. Bài tải rAF: **54,74 fps**, p95 gap **16,80 ms**, baseline cùng phiên **36,83 fps**. Headless có warm-up/chất lượng thích ứng; đây là số hồi quy, không xác nhận 60 FPS desktop hoặc 30 FPS trên điện thoại yếu.

JavaScript exception **0**, asset HTTP lỗi **0**. Request HD/VFX/SFX chưa cache ở ca offline được chủ động làm thất bại; không khẳng định âm thanh chưa tải có thể phát khi mất mạng.

Audit: 139 unit TCG, 44 unit Auto, 139 portrait; không có nhóm trùng hash portrait hoặc model:row giữa ID khác nhau trong inventory kiểm tra. **94 thẻ TCG vẫn dùng portrait một pose**, chưa phải model animation đầy đủ. Không dùng hash làm bằng chứng duy nhất cho khác biệt mỹ thuật; bốn identity mới được đối chiếu trực quan. Enemy ID lặp ở nhiều wave là tái sử dụng có chủ đích; definition tương thích không dùng liệt kê riêng.

## Dung lượng và tải ban đầu

- Build: **246.055.474 byte / 727 file**, giảm **1.942.082 byte** so với 5.9.5.
- Art thêm: **3.205.894 byte**; phim gỡ: **5.145.172 byte**. Không tăng cache/budget.
- **43 JS**, gzip **666.497 / 675.000 byte**; còn 8.503 byte. CSS gzip **102.778 byte**.
- Tổng build cảnh báo 300 MB / tối đa 320 MB, còn **73.944.526 byte**. Offline shell **2.874.949 byte / 62 URL**.

| Route | Body byte đã giao, gồm cài SW | Offline reload |
| --- | ---: | --- |
| / | 3.171.206 | Qua |
| /adventure | 4.346.647 | Qua |
| /autochess | 3.539.199 | Qua |

Đo fresh context mỗi route, gồm warm request và SW precache, body chưa nén HTTP; không coi là wall-clock performance hay toàn bộ byte header mạng. Không tải MP4 khi mở game. Tất cả dưới mục tiêu 8 MB/trần 12 MB. Xem `initial-load.json`, `lazy-media-qa.json`, `metrics.json`.

## Giới hạn

Chưa kiểm thử Safari/iOS, máy yếu thật hoặc PvP hai thiết bị trong đợt này. Còn roster P2, quái/tinh anh/boss P3, các thẻ một pose, quyền asset cũ và chuyển động nâng cao theo lợi ích thực tế. Chưa nghiệm thu toàn Web 6.0. CI/Vercel phải đối chiếu head PR được đẩy; các số trên là kết quả local đã thực hiện.
