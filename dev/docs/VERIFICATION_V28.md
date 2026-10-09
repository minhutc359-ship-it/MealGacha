# Kiểm chứng bản 2.8

Kiểm tra ngày 07/10/2026 trên bản production build, nền master sau PR #13. Không thêm backend hoặc tài khoản. Các kết quả trình duyệt bên dưới chạy bằng Chromium/Playwright với asset thật và localStorage; không phải kiểm chứng bản triển khai Vercel có bảo vệ đăng nhập.

## Kiểm tra tự động

| Kiểm tra | Kết quả |
| --- | --- |
| `pnpm test` | 133 kiểm thử, 14 file, đạt |
| `pnpm typecheck` | Đạt |
| `pnpm build` | Đạt |
| `pnpm validate:catalog` | 112 món, 35 tag, 9 sự kiện, đạt |
| `git diff --check` | Đạt với các thay đổi của bản 2.8 |

Kiểm thử mới bao phủ lựa chọn lượt 4, điều kiện khả dụng, giới hạn hồi/rút, không đổi mana/lần đánh/chuỗi combo, áp dụng một lần, khôi phục trạng thái pending/chosen và tương thích trận cũ. Trình mô phỏng 200 seed trận và 20 hành trình thám hiểm tiếp tục chạy qua cơ chế mới. Đây là kiểm tra tính đúng đắn, chưa phải dữ liệu cân bằng từ người chơi thật.

Kiểm thử âm thanh xác nhận đổi bản phối khi cutscene giữ độ ưu tiên, mỗi bản phối giữ vị trí riêng, tải chậm của phong cách cũ không phát nhầm, mute và tháo route dọn tài nguyên. Kiểm thử dữ liệu xác nhận cài đặt cũ mặc định Bếp Việt, giá trị không hợp lệ được đưa về mặc định.

## Luồng trình duyệt

- Bàn đầy sáu quân và tay tám lá vừa khung ở 1440×900, 1366×768, 1280×720, 1024×768, 768×1024, 390×844, 375×667, 360×640, 320×568, 844×390 và 667×375. Không tràn ngang hoặc cuộn dọc trang khi chiến đấu; nút lượt và tay bài vẫn hiện.
- Ba lựa chọn Ứng biến hiện đủ trên desktop, điện thoại, 320×568 và màn hình ngang. Escape không bỏ qua; từng lựa chọn thay đổi đúng state, không trừ mana hoặc nhân thưởng, tải lại giữ lựa chọn. Trạng thái chưa chọn được khôi phục.
- 18 cảnh mở màn tải đúng nền; từng câu đổi ảnh người nói, người kể giữ nền. Sáu cảnh thức tỉnh boss có lời riêng, cả Sương Nhạt dùng gương mặt nhân vật chính. Đọc lại/bỏ qua/xác nhận không cấp thưởng; chương chưa mở không lộ nội dung.
- Cảnh giữa trận dừng trình diễn, khôi phục sau tải lại. Đồng hành trợ giúp một lần ở lượt 3. Giảm chuyển động tắt animation trang trí và vẫn giữ kết quả luật chơi.
- Cả tám bản nhạc được giải mã và phát trong trình duyệt, stereo, RMS lớn hơn 0, peak nhỏ hơn 1. Đổi Bếp Việt ↔ 8-bit giữ mood và crossfade; boss, trận thường, cảnh ấm và cảnh bí ẩn dùng đúng bản phối. Mute, hai thanh âm lượng, pause/resume nền, thử lại lỗi mạng, jingle thắng/thua và đóng route hoạt động.
- Ba combo có burst/chân dung/sắc bàn riêng; lửa, nước, hồi, buff và chắn bám theo frame thật. Chọn bài và tung phép có âm/hiệu ứng; không nhân sát thương khi chạy animation.
- Mã tiến trình mã hóa khôi phục trận đang đánh giữa hai origin thiết bị mô phỏng. Mã hỏng không ghi đè; bản phục hồi trở lại được. Deck gợi ý hợp lệ gồm 18 lá sở hữu, lọc vai trò và tay thử độc lập; postcard giải mã ở 1080×1350.
- Dialog giữ focus, nội dung phía sau inert, Escape đóng đúng lớp cho các dialog được phép đóng. Các bài kiểm tra trình duyệt không ghi nhận lỗi JavaScript chưa xử lý.

## Asset

16 ảnh WebP có alpha thật, kích thước 640×960, tổng 1,349,630 byte. Bốn MP3 mới tổng 939,691 byte. Các file có nội dung RIFF/âm thanh thật và ngoại lệ Git LFS đúng, không phải pointer. Ảnh là render phong cách anime 3D với chuyển động CSS, chưa phải model 3D có rig.

Đường dẫn, prompt, phương pháp tạo và thời lượng nhạc: [ANIME_ASSETS.md](ANIME_ASSETS.md). Nguồn nghiên cứu, luật Ứng biến, chỉnh cốt truyện và giới hạn: [ANIME_TACTICS_V28.md](ANIME_TACTICS_V28.md).
