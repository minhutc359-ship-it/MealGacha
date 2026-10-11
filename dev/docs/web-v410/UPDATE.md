# Soul of Meal 4.1.0 · Chợ lên đèn

Phạm vi: **chỉ web**, theo xác nhận ngày 11/10/2026. Ngân sách tổng website là **100.000.000 byte**, cảnh báo từ 80 MB; tổng JS gzip vẫn tối đa 650.000 byte. Không thay luật/cân bằng, không sửa native, không Capacitor sync/build APK/AAB và không tự merge.

## Thay đổi người chơi nhìn thấy

- Sửa ảnh banner Thám hiểm; thống nhất tiến độ chiến dịch theo 27 màn thực, bỏ đếm trùng/ID lạ; hướng dẫn nhận gói khởi hành dẫn tới Bộ bài. Nhật ký đọc lại dùng cùng lời thoại trước/sau trận và nhánh quyết định đang lưu. Xem lại không phát thưởng.
- Thư viện và bộ bài hiển thị mô tả/độ hiếm rõ hơn, giữ hàng thẻ đủ cao để đọc. Điều khiển hội thoại và bàn tập có vùng bấm lớn hơn. Thông báo Rương dùng dialog modal, focus vào nút đóng, vòng Tab, Escape và trả focus.
- 9 chủ đề nhạc dài có 32 ô nhịp, từ khoảng 77 đến 113 giây, mỗi chủ đề có arrangement Bếp Việt và 8-bit. Ba vùng Chợ/Bến/Bếp có bộ stem base/rhythm/pressure riêng trong cả hai phong cách. Phòng nghe chọn từng bài và trở lại nhạc cảnh khi đóng.
- Đom đóm/ánh đèn Chợ, mưa/gợn nước Bến, hơi Bếp; nhân vật vào cảnh và đổi dòng hội thoại có chuyển động nhẹ. Thêm profile chuyển động và vệt đánh/niệm phép trên atlas hiện có. Preset nhẹ, reduced motion và ẩn tab giữ giới hạn hiệu ứng. **Không thêm bộ frame nhân vật raster hoặc rig 3D mới**.
- Bàn tập TCG có ba bài tương tác bằng reducer thật: Hộ vệ, chọn Nêm, công thức Bữa cơm nhà. Bàn tập Auto cho xếp ba quân trên 18 ô rồi chạy combat thật với seed cố định. Cả hai dùng state riêng, không ghi save, không dùng tài nguyên và không nhận thưởng.
- Kết quả Auto thêm gợi ý từ damage/healing/blocked/casts và địch còn sống; không tự sửa đội hình, không tuyên bố đội hình tối ưu.
- Cài đặt báo trạng thái offline/cập nhật và có nút yêu cầu trình duyệt giữ dữ liệu. Khi giao diện lỗi, màn phục hồi cho xuất dữ liệu gốc rồi tải lại, không xóa kho tiến trình.

Bản đồ mới của PR #28 được giữ: chuyển nhanh tới chương 7–9; chương 10–12 **Coming soon**, chưa có trận/lời thoại/phần thưởng mới cho các chương này. Không mở PvP, tài khoản cloud hoặc nền kinh tế mới.

## Nhạc, bộ nhớ và offline

36 MP3 mới tổng **18.654.032 byte**: 18 bài dài + 18 stem ngắn. Additive synthesis nguyên gốc, không dùng sample ngoài; mã tạo, metadata và SHA-256 ở `dev/tools/compose-web410.py` / `audio-manifest.json`. Mỗi file được xuất hoàn chỉnh rồi thay thế nguyên tử để tránh đóng gói file đang ghi dở.

Bài dài chạy HTMLAudioElement → Web Audio mixer, thay vì decode toàn bài vào AudioBuffer. Một giọng hiện tại và tối đa một giọng chuyển tiếp; đổi phong cách/cảnh có crossfade, giữ cursor, dừng và nhả mạng khi mute/ẩn tab/dispose. Nếu streaming lỗi, dùng bài ngắn cũ. Stem 20 giây vẫn dùng AudioBuffer đồng bộ theo ô nhịp; ×3 chỉ tăng tốc gameplay. Ngân sách AudioBuffer 48 MiB ổn định / 64 MiB chuyển tiếp giữ nguyên; đây **không phải** giới hạn RAM toàn trình duyệt hoặc bộ decode nội bộ HTMLAudioElement.

Service worker production precache shell + JS/CSS/fonts để mở lại khi mất mạng; ảnh/nhạc cache khi dùng. Cache media tối đa 120 entry / 60 MB / 8 MB mỗi file và hỗ trợ Range cho seek nhạc offline. Nội dung chưa tải, Tìm quán và dịch vụ ngoài vẫn cần mạng. Shell precache chạy nền và có lưu lượng riêng; tổng dung lượng `dist/` không phải lượng tải mỗi lần mở trang.

Worker mới chờ nút **Cập nhật và mở lại web** trong Cài đặt, không tự reload khi đang chơi. Một cache mã của phiên bản trước được giữ và tra cứu để tab đang mở còn tải được chunk cũ; cache của ứng dụng khác không bị xóa. Worker không xử lý localStorage/IndexedDB tiến trình. Trình duyệt vẫn có thể thu hồi dữ liệu theo quota, nên vẫn cần mã MGC1/bản sao lưu. File xuất từ error boundary là raw recovery, không phải mã MGC1.

## Kiểm chứng và phạm vi còn lại

Bản build: **63,586,058 byte = 63.59 MB**, 408 file; JS gzip **567,076 byte**, CSS gzip 78,405 byte, không có file dev/archive rò rỉ. 30 kiểm tra web 4.1 + 10 hồi quy 4.0 + 5 kiểm tra map đều qua, không có pageerror.

Các số đo và bằng chứng hiện tại:

- `../release/build-size.json`: ngân sách, dung lượng build, mọi chunk JS/CSS, file lớn và kiểm tra không lọt tài liệu/dev/archive.
- `loading.json`: lần mở sảnh yêu cầu khoảng 1,63 MB file (nhạc tắt, worker bị chặn để đo riêng); shell precache khoảng 2,42 MB chạy nền. Tổng kích thước file yêu cầu, không phải số đo byte truyền/tốc độ thực; Resource Timing không cung cấp byte nên không khẳng định tiết kiệm mạng khi reload.
- `audio-decoded.json`: 36 MP3 được ffmpeg giải mã về PCM; đúng sample rate/kênh/độ dài, tất cả mẫu hữu hạn, không clipping. Đây là kiểm tra kỹ thuật, chưa duyệt nghe bằng loa/tai nghe trên máy thật.
- `browser-results.json`: sản phẩm production Chromium, bốn viewport 320×568 / 390×844 / 844×390 / 1366×768; luồng bàn tập, focus popup, offline reload, seek, cập nhật thủ công và hai phong cách nhạc; đối chiếu save trước/sau.
- Regression 4.0 kiểm tra hai ending/gói tự nguyện, Nêm trong trận, renderer/context-loss/reduced-motion, fonts tự host và giữ raw save hỏng. Regression map kiểm tra chuyển vùng/chương và Coming soon.
- ZIP nguồn sản phẩm build/typecheck khi không có `dev/`; template/plugin offline nằm ở root để giữ khả năng build độc lập.

365 test tự động qua 34 file; typecheck app/dev, catalog, literal asset references, rights fingerprints, build và size guard được chạy. Android CI chuyển thành manual-only; CI web mới chạy các kiểm tra mã/build. Browser harness cần Playwright/Chromium cài riêng; audio QA cần ffmpeg/ffprobe/numpy. Chưa đo FPS/RAM toàn trình duyệt trên điện thoại thật, Safari/WebKit, loa thật hoặc thời gian tải trên mạng người dùng; không suy diễn các số này từ headless Chromium.

PR này là bản web có thể review và triển khai sau merge; mở PR không tự thay bản production.
