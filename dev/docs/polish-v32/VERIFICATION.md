# Soul of Meal 3.2 · Bộ bài, model và nhịp chiến thắng

Luồng được kiểm tra: chọn thẻ/mua quân → Zustand → luật đội hình và engine cố định 20 tick/giây → localStorage → renderer và hội thoại/phần thưởng. Những thay đổi này không có backend hay yêu cầu khóa API.

## TCG

- Xưởng chiến thuật dùng danh sách cuộn dọc giống thư viện thẻ; hiện tất cả lá sở hữu, không phân trang 2 lá. Cuộn danh sách độc lập, điều khiển và thanh tab giữ trong viewport. Bộ lọc/tab đặt lại vị trí cuộn. Tab Trong bộ vẫn sửa nháp, lưu và trang bị bình thường.
- Logo/tên Soul of Meal trên điện thoại có chữ tối trên nền sáng; wordmark ở sidebar và tiêu đề trên nền tối có màu sáng rõ ràng.
- Ảnh nhân vật/phép dùng `contain`, neo phía trên để thấy trọn hình; món ăn tiếp tục lấp khung. Kiểm tra đúng lá **Người gánh bếp** được phản ánh trong ảnh báo lỗi: thấy cả mặt, nón và người.

## Auto chess

- Lỗi gốc: renderer chia atlas thành các hàng bằng nhau, nhưng các hàng nhân vật có chiều cao khác nhau. Nay dùng metadata đo **308 frame**: 8×14 frame cơ bản, 14×7 frame mới, 14×7 frame quái. Mỗi pose có vùng nguồn và điểm neo chân; mỗi nhân vật có chiều cao tham chiếu ổn định. Chân dung quái trong thư viện/chi tiết cũng dùng vùng đo.
- Xếp quân chuyển vị trí trong 220ms, có bước chân, nhịp thở và lunge khi đánh/niệm. Hướng quay giữ theo mục tiêu để tránh lật đi lật lại lúc idle. Hỗ trợ giảm chuyển động và chất lượng thấp.
- Mỗi thắng đã chốt: **nhảy ăn mừng ~3.2 giây → kết quả → phần thưởng nếu có → vòng chuẩn bị**. Ở màn 12, ăn mừng xảy ra trước epilogue. Có nút Xem kết quả để bỏ qua; giảm chuyển động giữ bảng thắng 1 giây.
- Nhịp ăn mừng là presentation riêng: không tiến thêm tick, không tăng áp lực survival, không phát thêm vàng/điểm hoặc sửa phase lưu. Thua không ăn mừng và không mở màn chiến dịch tiếp theo. Thoại giữa trận vẫn dừng đồng hồ như trước.
- Quân vừa mua/ghép tự được chọn, ô đặt hợp lệ sáng lên, chạm lại để bỏ chọn. Xếp nhanh ưu tiên quân có sao/giá cao, xếp cận chiến phía trước và tầm xa/hồi phục phía sau, giữ tài nguyên và pool. Người chơi có thể sửa đội hình sau đó.
- Shop hiện vai trò; nút hệ hiện tiến độ mốc. Hướng dẫn ba bước có đội mẫu và phần luật mở rộng. Nút điều khiển dùng grid riêng trên màn ngang nhỏ để không bị cắt.

## Kiểm chứng

| Kiểm tra | Kết quả |
| --- | --- |
| `pnpm typecheck` | Đạt |
| `pnpm test` | **226/226**, 18 file |
| `pnpm build` | Đạt |
| `pnpm validate:catalog` | 123 món, 35 tag, 9 event hợp lệ |
| `git diff --check` | Đạt |
| Browser mua/xếp/guide và giữ tài nguyên | Đạt |
| Browser thắng/nhảy/kết quả/relic/augment | Đạt; điểm, vàng và thời gian không tăng trong ăn mừng |
| Browser chiến thắng cuối trước cutscene | Đạt; skip chỉ kết thúc presentation |
| Browser thua, retry và giảm chuyển động | Đạt; thua không mở màn |
| Một trận thật chạy từ đầu, tốc độ ×2 | Đạt; qua bước ăn mừng |
| Auto chess prepare/combat: 320×568, 390×692, 430×760, 1366×768, 667×375, 844×390 | Điều khiển nằm trong viewport, không cuộn trang |
| TCG deck: 320×568, 390×692, 667×375, 1366×768 | Danh sách cuộn, không tràn trang |
| Header TCG 320px, ví 1.940 xu | Tên game, nút đổi mode và ví không chồng nhau |
| Console JavaScript | Không lỗi |

Mẫu 90 animation frame ở Chromium headless với đội hình 7 quân: median 16.7ms, p95 16.8ms. Đây là số đo môi trường kiểm tra, không phải cam kết FPS cho mọi thiết bị. Các kiểm tra kích thước dùng Chromium mobile/touch, không thay thế thử nghiệm trên Safari iPhone thật.

Không thay namespace lưu, schema, MGC1, luật chiến đấu hay cân bằng. Các kiểm thử import/export tiến trình cũ vẫn đạt. Asset gốc được giữ; chạy `python scripts/build-autochess-sprites.py` (Pillow) để tái tạo metadata, cập nhật mốc hàng đã kiểm tra nếu thay atlas.

Kết quả máy: [luồng game](browser-results.json) · [ảnh/layout/frame](art-layout-results.json). Ảnh sau sửa: [bộ bài](screenshots/deck-phone.webp) · [mặt nhân vật](screenshots/porter-face.webp) · [model](screenshots/models-phone.webp) · [ăn mừng](screenshots/victory-phone.webp).
