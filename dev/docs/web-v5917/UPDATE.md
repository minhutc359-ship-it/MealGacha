# Web 5.9.17 · VFX chiến đấu và bốn model ưu tiên

Bản này khôi phục tín hiệu chiến đấu dùng chung và nâng bốn Vị Linh đang còn portrait tĩnh lên model 32 pose. ID, kỹ năng, chỉ số, phần thưởng, điều kiện mở khóa và save không đổi.

| ID | Nhận diện cố định từ portrait canon | Model | VFX hiện tại |
|---|---|---|---|
| `lau-rieu-cua` | Thần oa, nón rộng, giáp đồng-lục, thương vàng | 32 pose HD + pixel | Fallback theo hệ của event (mặc định Gia vị) |
| `nuong-bbq` | Phượng hoàng đỏ, giáp đen-vàng, thương lửa | 32 pose HD + pixel | Fallback Hỏa vị |
| `vit-quay` | Ngọc thố cánh bướm đỏ-trắng, giáp đỏ-đen | 32 pose HD + pixel | Fallback Hỏa vị |
| `bibimbap` | Hải ly, áo lục-cam, thương vàng | 32 pose HD + pixel | Fallback theo hệ của event (mặc định Gia vị) |

## Model và animation

- Khôi phục tám sheet 4×4 đã tạo bằng built-in Imagegen từ phiên sản xuất trước, đóng gói thành **128 pose vẽ**: idle, walk, attack, cast, ultimate, hit, fall và victory; bốn pose/trạng thái.
- Xuất tám atlas runtime: HD 1024×2048 và pixel 256×512 dưới `assets/characters/spirits5917/`. Portrait canon cũ được dùng lại nguyên ô, không tạo identity mới.
- Frame ngã thứ ba của `lau-rieu-cua` bị tràn qua ranh giới ô nguồn đã được thay bằng pose ngã sạch từ sheet cùng identity. Packer hỗ trợ repair giữ kích thước gốc để không thu nhỏ theo mảnh lỗi.
- TCG, Adventure và Auto Chess cùng resolve model theo gameplay ID hiện có. Audit tăng từ **57/139** lên **61/139** Vị Linh có bộ 32 pose; còn 74 portrait-only và 4 model animation cũ.

## VFX chiến đấu

- Auto Chess luôn giữ projectile/trail/slash/channel/impact dùng chung. VFX nhận diện riêng chỉ là lớp nhấn phía trên, không được bỏ qua lớp theo hệ.
- Adventure vẫn giữ cue attack/skill khi bật Reduced Motion; chế độ nhẹ dùng hình học ít hạt thay vì ẩn hiệu ứng.
- Adventure, Auto Chess và TCG giờ đọc trực tiếp atlas VFX đã khai báo trong manifest. Ví dụ Bách dùng cột riêng trong `chefs593/ultimate.webp`; atlas ba pha được phát một lần quanh vùng tác động và không lặp trên từng mục tiêu.
- Loại lớp `drawUltimateArt` hình học cỡ lớn từng che model khi tung tuyệt kỹ. Model/pose là chuyển động chính; impact theo hệ thể hiện kết quả lên từng mục tiêu và VFX atlas riêng chỉ là lớp nhấn gọn.
- Khiên bong bóng được thu gọn, giảm độ đục và chuyển xuống sau model để đội hình vẫn đọc được rõ khi Bách che chắn cả đội.
- Bốn model mới đặt `signature: none`: chưa vẽ VFX riêng ở đợt này và không sinh motif tạm sai nhận diện. Projectile/impact theo hệ vẫn hiển thị đầy đủ làm fallback.

Chủ dự án tiếp tục review và quyết định merge; nhánh/PR không tự merge.
