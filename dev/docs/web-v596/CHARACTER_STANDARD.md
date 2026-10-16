# Bổ sung chuẩn nhân vật và kiểm thử — 5.9.6

Kế thừa `../web-v595/CHARACTER_STANDARD.md` và các chuẩn starter/chef/familiar. ID, gameplay, save, renderer, năm phase và ngân sách không đổi.

1. Khai báo nhận diện, timing và anchor trong `characterVisuals.ts`; thêm ID/root vào bảng `ASSET_GROUPS`. Một nhân vật có nhiều bản hiển thị, cùng một danh tính. Không lấy giá vàng Auto Chess thay độ hiếm TCG/Adventure.
2. Tám trạng thái vật lý × bốn pose, HD 1024×2048 / ô 256, pixel 256×512 / ô 64, pivot chân (0,5; 0,9375). Giữ scale chung cho toàn actor, chuẩn hóa scale giữa các nguồn trước khi đóng atlas.
3. Nếu vũ khí nối vào actor ô kế bên, cô lập component không thể tách đúng hai nhân vật: tạo lại pose nguồn. Nếu một tư thế quá rộng khiến toàn actor quá nhỏ, sửa gesture/vũ khí cho gọn; không bóp méo hoặc fit riêng từng frame. Giữ tay cầm trang bị liên tục giữa các pose.
4. VFX tách khỏi actor, một ô/phase chính. Rect phải loại mảnh từ ô bên cạnh. Hiệu ứng có hạt/chime rời cần giữ thành phần có chủ đích; chỉ cô lập impact bằng component khi phù hợp. `isolateImpact: false` yêu cầu xem kỹ toàn atlas sau transpose.
5. Giữ MP3 ở đường dẫn cũ và căn contact 960 ms. Chỉ gỡ phim khi mọi consumer của ID đã chuyển native; nhân vật legacy vẫn lazy load MP4, không nhân bản phim để đổi VFX nhỏ.
6. Hai canvas Pixi hiện chỉ dùng Graphics. Build chỉ loại registration cụ thể đã xác nhận không dùng, không đặt mọi module thành side-effect-free. Khi bổ sung tương tác Pixi, filter, DOM hoặc spritesheet loader, phải bỏ loại trừ và kiểm tra lại consumer tương ứng.
7. Group bundle theo consumer tương thích, giữ lazy route và lazy media. Đo tổng JS gzip cùng cold delivery có SW, không chỉ chunk lớn nhất. Trần: tổng build 320 MB/cảnh báo 300 MB, JS gzip 675.000 byte, initial mục tiêu 8 MB/trần 12 MB, image cache 64 MiB với lease bảo vệ ảnh đang dùng.
8. Dùng `verify-visual-roster.mjs --cohort=596` hoặc wrapper `verify-web596.mjs`. Có scope `--media-only`, `--renderers-only`; giữ wrapper 595 cho báo cáo cũ. Bài Pixi ArenaScene cần màn chiến dịch index ≥18, ví dụ `rain-harbor-1`; bàn luyện tập dùng ảnh nền tĩnh và không kiểm chứng được renderer đó.
9. Kiểm tra theo luồng thao tác → reducer/save → manifest → asset thực → canvas/DOM → skip/kết thúc → cleanup. Bao gồm mode, viewport, offline, reduced motion, nhiều cast, image leases, thực đo GPU pixel và fallback khi mất context. Dismiss popup sự kiện trước khi đánh giá ảnh/UI bên dưới.
10. Ghi scope và giới hạn của bằng chứng. Hash khác nhau không chứng minh khác biệt mỹ thuật; FPS headless không thay thiết bị thật. Không lặp toàn bộ bài đã đạt khi chỉ sửa fixture cho một consumer; kiểm tra lại đúng ranh giới bị ảnh hưởng và giữ báo cáo scope rõ ràng.

Nguồn/sidecar ở `dev/docs/web-v596/`; runtime ở `public/assets/characters/rare596/`. Hai packer hiện có được mở rộng cho cohort mới, không thêm một pipeline sao chép.
