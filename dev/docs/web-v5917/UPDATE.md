# Web 5.9.17 · Khôi phục tín hiệu chiến đấu

Bản này sửa hồi quy trình bày khiến Auto Chess và Adventure còn model nhân vật nhưng mất đường đạn, trail, va chạm theo hệ hoặc hiệu ứng kỹ năng.

- Auto Chess luôn giữ lớp VFX gameplay dùng chung cho đánh xa, cận chiến, channel và impact. Hiệu ứng nhận diện riêng của Vị Linh chỉ là lớp nhấn, không còn kết thúc sớm rồi bỏ qua projectile/impact.
- Adventure giữ mọi cue attack/skill khi bật Reduced Motion. Chế độ này dùng hình học nhẹ và ít hạt hơn thay vì ẩn toàn bộ tín hiệu chiến đấu.
- Impact theo năm hệ luôn nằm dưới VFX nhận diện của Vị Linh/Boss. Atlas và hình học fallback vẫn loại trừ nhau để không chồng hai impact giống nhau.
- Không đổi reducer, chỉ số, hit timing, AI, phần thưởng, save schema, manga hoặc tài nguyên sở hữu.

Thay đổi chỉ nằm ở compositor Canvas và test hồi quy; không thêm dependency, bitmap, âm thanh hoặc video.
