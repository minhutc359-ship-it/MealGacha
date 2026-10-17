# Web 5.9.7 — Tuyệt kỹ 2D, bỏ toàn bộ video

Tiếp nối commit `e2bdc291866545dee274f763714c4fffc97221f0` (5.9.6) trên nhánh `feat/web-v595-rare-spirits`, PR #58. Chỉ web; không tự merge.

## Hoàn tất yêu cầu thay video

- Cả 139 Vị Linh dùng chung banner ảnh chân dung, tên chiêu, tên nhân vật, icon và nền/viền theo năm hệ. Tái dùng đúng portrait, sigil và SFX đang có; không thêm asset runtime/dependency.
- Adventure hiển thị banner ngay trong sân thay cho màn phim toàn màn hình. Model thi triển vẫn chuyển pose; đầu có icon chiêu, chân có pháp ấn, quanh người có aura. Tác động trúng đích dùng VFX riêng của 23 manifest đã sản xuất hoặc một trong 20 họa tiết kỹ năng cho các nhân vật khác. Đồng minh nhận hiệu ứng hồi/khiên, địch nhận hiệu ứng tấn công.
- Nhịp hiển thị 2,4 giây: vào 240 ms, giữ, ra 200 ms. Contact 960 ms, SFX theo cùng đồng hồ. Pause, skip, ẩn tab, reduced motion và liên hương ×2/×3 được giữ. HP/khiên/số tác động hiện khi đến contact; reducer vẫn chốt kết quả một lần trước hiển thị.
- Auto Chess dùng cùng banner cho kỹ năng thực tế; TCG dùng cùng banner và pháp ấn cho bí thuật. Không gán cơ chế tuyệt kỹ Adventure cho các mode khác. Auto chỉ giữ một banner mới nhất, lấy từ live frame thay vì checkpoint một giây.
- Bỏ nút Video ON/OFF, trình phát HTMLVideo, đường tải MP4, hai renderer toàn màn hình không còn consumer và CSS liên quan. Trang hồ sơ có xem tuyệt kỹ 2D với model của nhân vật được chọn.
- Gỡ 116 MP4 / **150.471.085 byte**. Bản phát hành không còn MP4; release guard chặn video tuyệt kỹ cũ quay lại. Worker mới loại MP4 khỏi cache media của game, kể cả phiên media trước được giữ, không mở lại cache đã xóa và không cache thêm MP4.

Worker cũng đọc cache code đã pin phiên bản với `ignoreVary` để module có header Origin vẫn chạy offline trên preview/CDN có `Vary: Origin`. Giới hạn ở core tĩnh; không thay cách đọc dữ liệu người dùng.

## Bảo toàn dữ liệu

Không đổi luật chiến đấu, chỉ số, kỹ năng, chi phí/năng lượng, mở khóa, phần thưởng, roster, bộ sưu tập hay save schema/version. Giữ trường/action `cinematic`/`cinematics` để đọc bản lưu cũ; chúng điều khiển transaction hiển thị 2D. Bản lưu đã tắt phim tiếp tục chạy nhanh với banner ngắn, không bị đổi tùy chọn ngầm. Kết thúc/bỏ qua chỉ xác nhận serial đã giải quyết; không tung lại chiêu. Worker chỉ sửa Cache Storage của game.

## Dung lượng

Build sạch khoảng **95,59 MB**, giảm khoảng **150,47 MB (61,15%)** so với 5.9.6 (246.055.474 byte). Số chính xác, JS gzip và ngân sách giữ nguyên trong `metrics.json`. Đây là toàn bộ file tĩnh, không phải tải ban đầu. Tải ban đầu và offline đo riêng trong `initial-load.json`; ngân sách JS 675.000 byte và build 300/320 MB không tăng.

Xem `VERIFICATION.md` cho kiểm thử/giới hạn, `showcase-manifest.json` cho mapping đủ 139 nhân vật, `removed-videos.json` cho chính xác 116 file đã gỡ.

## Phần roadmap chưa nằm trong cập nhật này

Thay video đã phủ đủ roster, nhưng chưa biến 94 thẻ portrait một pose thành bộ animation nhiều trạng thái. Các bộ nhân vật/boss còn lại, rig nâng cao, Safari/iPhone/máy yếu thật, PvP hai thiết bị và 13 chứng cứ quyền asset cũ vẫn chưa được nghiệm thu. Không gọi đây là hoàn tất toàn bộ Web 6.0. Các bộ HD/pixel và sửa lỗi 5.9.5–5.9.6 trước đó tiếp tục nằm trong cùng PR.
