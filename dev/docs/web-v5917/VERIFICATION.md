# Kiểm chứng Web 5.9.17

## Tự động

- **757/757 Vitest trong 71 file** đạt. Test hồi quy khóa ba lỗi: `continue` theo Vị Linh không được bỏ qua VFX chung; Reduced Motion không được loại toàn bộ cue; impact chung phải được vẽ trước lớp nhận diện Vị Linh/Boss.
- Canvas fallback chế độ nhẹ thực sự sinh trail, đầu đạn và impact theo hệ, không yêu cầu atlas texture. Tám test tập trung về projectile/impact/layering đạt.
- TypeScript app/dev, catalog 123 món, 133 asset tham chiếu, 17 manga JSON, bốn web-budget guard và release records đều đạt.
- Benchmark reducer Auto Chess hoàn tất đủ 18 tổ hợp mode/strategy/seed, không treo hoặc sinh run không ghi nhận. Gameplay và hit timing không bị thay đổi.
- Build production đạt **153.975.912 byte / 788 file**; JS gzip **673.118 / 675.000 byte**, CSS gzip 104.402 byte. Release guard không phát hiện source, map, archive hoặc credential.

Không thể chạy Chromium cục bộ trong workspace này vì binary Playwright không có sẵn và CDN browser bị chặn. CI/preview và nghiệm thu thiết bị được giữ thành bước bắt buộc; không tuyên bố đã kiểm tra hình ảnh trình duyệt ở đây.

## Phạm vi cần nghiệm thu thiết bị

- Auto Chess: đòn đánh xa có đầu đạn + trail + impact; đòn cận chiến có slash + impact; skill có channel/cast và va chạm đúng hệ.
- Adventure: attack, primary, support và ultimate của Vị Linh; đòn thường, báo chiêu và chuyển pha của Boss.
- Bật Reduce Motion trên iPhone/Safari: cue chiến đấu vẫn thấy rõ nhưng không dùng texture nặng hoặc chuyển động thừa.
- Xác nhận không xuất hiện hai impact atlas/hình học cùng lúc và VFX riêng không che model, thanh HP hoặc số sát thương.

Kết quả kiểm thử thực tế sẽ được bổ sung sau khi chạy toàn bộ matrix. Nghiệm thu Safari/iPhone vật lý vẫn do chủ dự án thực hiện.
