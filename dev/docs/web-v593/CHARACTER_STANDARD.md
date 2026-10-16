# Bổ sung chuẩn nhân vật — nhóm đầu bếp

Kế thừa `web-v590/CHARACTER_STANDARD.md` và manifest của `web-v591`. Tài nguyên mới không tạo thêm ID gameplay hoặc save.

1. Đối chiếu chân dung truyện, lore, mô hình và thẻ trước khi tạo art. Với một ID bị khác nhận diện giữa các nguồn, ghi rõ nguồn được chọn và các chi tiết phải giữ. Tranh thẻ/cutscene tốt được giữ lại.
2. Atlas nhân vật: 4×8 ô 256 px; chân chung ở (128,240). Bộ pixel chiến đấu: ô 64 px, chân (32,60). Thứ tự tám hàng là idle, walk, attack, cast, ultimate, hit, fall, victory. Cùng một tỷ lệ cho mọi tư thế của nhân vật; không phóng to riêng một frame để lấp đầy ô.
3. Đăng ký crop theo alpha thực tế. Nguồn Imagegen có thể có hàng không đều hoặc mảnh của ô bên cạnh; lưu sidecar và xem lại các hàng attack/ultimate/death/victory trên nền tối trước khi chấp nhận.
4. Khám phá: 12 cột/nhân vật, down/left/right/up, mỗi hướng idle/left step/right step. Sprite pixel thực, nền alpha, không aura; giữ chân ở y=60 và nearest-neighbor. Không tự đặt thêm NPC khi chỉ nâng asset.
5. Biểu cảm: sáu ảnh độc lập 256 px; giữ đồng nhất đầu, tóc, đường cổ áo và góc nhìn. Dùng prop `expression` / dữ liệu story; chỉ tải ảnh đang hiển thị, không preload cả bộ.
6. Manifest là điểm nối chế độ: ID, atlas HD, pixel, chân dung, shape VFX, palette, thời lượng, điểm neo, contact, SFX và timeline. Tên sheet `starter-*` là tương thích renderer lịch sử, không biểu thị nhân vật được cấp miễn phí cho người chơi.
7. Đòn thường/tuyệt kỹ dùng pose contact cùng nhịp hiển thị HP/khiên hiện có. Auto Chess lấy thời điểm `action.hit`. Không sửa engine hoặc sức mạnh để phù hợp animation.
8. Cinematic 2,4 s có preparation/casting/impact/finisher/recovery. Một actor và một hiệu ứng chính, hiệu ứng ở vùng mục tiêu; geometry fallback thay thế atlas chưa tải, không chồng cả hai. Trạng thái hồi máu/khiên của người nhận được thể hiện đúng loại.
9. Tên tệp: `chef-{id}.webp`, `chef-{id}-pixel.webp`, `chef-{id}-{expression}.webp`. Production batch có thư mục phiên bản riêng; asset tái dùng phải được giải qua manifest, không copy một gói cho từng mode.
10. Trước PR: kiểm tra frame không rỗng/hash riêng, bố cục và chân, lifecycle image leases, năm pha, pause/skip/reload, reduced motion, nhiều cast, Auto/TCG/Adventure, bốn kích thước màn hình và production build. Lưu một số ảnh evidence đã xem, không đưa toàn bộ ảnh PNG QA vào build.
11. Tổng build mục tiêu 300 MB/trần 320 MB; JS gzip vẫn 675.000 byte. Gói đầu bếp đã dùng 4,60 MB trong phân bổ sản xuất 10 MB. Không tăng ngân sách RAM/cache theo ngân sách tải xuống. Giữ image cache 64 MiB, tải đúng nhân vật/biểu cảm cần dùng, giải phóng lease khi rời chế độ.
12. Cần chạy lại đo tải ban đầu có tính service worker và offline reload. FPS headless là bằng chứng hồi quy trong môi trường kiểm tra; mục tiêu 60 desktop/30 máy yếu cần đo tiếp trên phần cứng thực.
