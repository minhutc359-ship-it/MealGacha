# Kiểm chứng Web 5.9.3

Ngày 16-10-2026, nền commit `1d87b95`, branch `feat/web-v593-chef-production`.

## Các kiểm tra đã qua

- TypeScript app và dev: qua.
- Vitest: **663 test / 60 file** qua, gồm năm cast đầu bếp thực qua reducer, parse save và double-skip không trừ thêm tài nguyên hoặc gây thêm sát thương; kiểm tra contact và nhận diện xuyên chế độ.
- Node guard: **4 test** qua; catalog 123 món / 35 tag / 9 sự kiện hợp lệ.
- Asset validator: 128 tham chiếu tĩnh, không thiếu. Manifest Vitest kiểm tra đường dẫn động của 11 nhân vật sản xuất. Release register kiểm chứng 642 tài nguyên, 32 phụ thuộc runtime và 3 chính sách.
- Build, release guard, size guard: qua; không source/map/archive lọt vào dist. JavaScript service worker qua kiểm tra syntax.
- Giải mã toàn bộ media: **128 H264 + 139 MP3**, không lỗi. 11 nhân vật dùng timeline native. Các công cụ dựng media đọc danh sách native để không tạo lại MP4 đã bỏ.
- Asset QA: **42 WebP / 425 ô/ảnh không rỗng và riêng hash**, xem `asset-qa.json`. Layout/pivot của 17 sheet cũ giống hoàn toàn nền commit, xem `metadata-parity.json`.

## Trình duyệt và gameplay

Chromium 143 headless / SwiftShader, bản dev và production:

- 320×568, 390×844, 844×390, 1440×900: năm actor pixel hiện đúng, deck trong màn hình, không cuộn ngang; Bách trong làng dùng atlas pixel mới.
- Cả năm đầu bếp: preparation → casting → impact → finisher → recovery, tự trở lại trận; pause giữ nguyên tiến độ và skip đóng cinematic; không gọi MP4 đầu bếp, không chồng video/ảnh cut-in/model.
- Reduced motion: pose impact tĩnh, skip hoạt động.
- Auto Chess: đội hình năm đầu bếp chiến đấu và dùng model riêng. TCG: năm model riêng, tấn công qua thao tác UI thực.
- 30 biểu cảm tải thành công, 20 tổ hợp nhân vật/hướng trong component khám phá. `StoryScene` dùng lời thoại có sẵn, chuyển sang Hải biểu cảm concern đúng ảnh. Production đọc save đã tạo ở bản dev, chạy native Bách và pause/skip.
- Năm cast nối tiếp và đồng thời: tối đa **5 cue**, còn **0 cue** sau kết thúc. Cache ảnh đỉnh **65,076,768 byte**, dưới **67.108.864 byte (64 MiB)**. Sau đổi sang TCG bằng Link trong app: **0 active lease**; cache LRU giữ **65,076,768 byte**, vẫn trong ngân sách.
- Đo rAF trong bài tải: **50.09 fps**, p95 khoảng cách frame **33.30 ms**; nền cùng phiên **29.95 fps**. Kết quả headless bị ảnh hưởng warm-up/điều tiết chất lượng, không dùng để kết luận tốc độ điện thoại hoặc cam kết 60 FPS trên mọi desktop. Mục tiêu thiết bị thật vẫn 60/30.
- Impact dùng chung: test xác nhận texture hoặc geometry được chọn độc quyền, geometry hoạt động khi texture chưa tải và ở light mode; sau 700 ms không vẽ. Auto Chess bỏ lớp impact thứ hai và thu va chạm xuống chân mục tiêu; ảnh evidence cho thấy rõ hàng đầu bếp.
- Console error: 0; asset HTTP lỗi: 0.

Dữ liệu và ảnh: `browser-qa.json`, `evidence/`. Ảnh kiểm tra đã được xem; phát hiện và sửa crop chân dung, mảnh ô atlas lân cận trước lần kiểm tra cuối.

## Dung lượng / tải ban đầu

- Build: **253,045,614 byte = 253.05 MB**, giảm **2.32 MB** so với PR #54.
- JS gzip: **674,707 / 675.000 byte**; CSS gzip **104,139 byte**. Chưa tăng giới hạn JS.
- Mục tiêu tổng 300 MB, trần 320 MB, còn **66.95 MB**. Gói art mới 4,60 MB; bỏ 6,90 MB phim cũ không còn dùng. Không tăng image/audio/SW memory budget.
- Tải mới mỗi route, tính cả SW precache và warm requests; body bytes chưa nén HTTP, không tính header hoặc coi là thời gian tải:

| Route | Body byte đã giao | Kết quả |
| --- | ---: | --- |
| / | 3,172,440 | Qua, offline reload qua |
| /adventure | 4,347,881 | Qua, offline reload qua |
| /autochess | 3,540,433 | Qua, offline reload qua |

Mọi route dưới mục tiêu 8 MB và trần 12 MB, không tải MP4 lúc mở game. Xem `initial-load.json` và `metrics.json`.

## Giới hạn / việc tiếp theo

- Tám bộ pose vật lý × bốn tư thế; chưa có rig skeletal/mesh, chạy riêng, turn-in-place hay animation nói theo âm tiết. Ba trạng thái summon/guard/stun là tái sử dụng pose.
- Chỉ Bách là NPC trong layout làng hiện tại. Bộ đi bốn hướng của bốn đầu bếp còn lại sẵn sàng tái dùng; không tự thêm NPC hoặc đổi party khám phá.
- Pixel chiến đấu là biến thể nearest của HD; pixel khám phá được tạo riêng. Có thể tiếp tục polish từng frame ở kích thước hiển thị thật sau chơi thử trên thiết bị.
- Tiếp theo theo plan: Bún chả, Bún riêu, Bánh xèo, Cơm gà; rồi các nhóm roster/boss. 94 thẻ ngoài nhóm sản xuất vẫn dùng artwork riêng thay cho model hoạt họa đầy đủ.
- 13 trường hợp chứng cứ quyền của asset cũ vẫn đang pending; đợt này không tự xác nhận chúng đã được giải quyết.
- CI và Vercel của PR cần xem theo commit trên GitHub; báo cáo này ghi kiểm tra local đã thực hiện, không tự chứng nhận kết quả remote trước khi có run.
