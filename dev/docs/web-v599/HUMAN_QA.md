# Bạn nghiệm thu trên thiết bị thật và review PR

Phân công theo yêu cầu: ChatGPT triển khai, chạy unit/build/browser tự động và chuẩn bị bằng chứng; **bạn test trên thiết bị vật lý, review và quyết định merge**. Kết quả headless không được coi là đã test Safari/iPhone/Android thật.

## Nhận diện và chuyển động

Chơi màn 1 của từng vùng bằng bản lưu đã mở vùng tương ứng:

| Vùng | Cần nhìn rõ |
|---|---|
| Đỉnh Trà Mây | Bướm có bốn cánh lá, hai râu xoắn; Vệ Binh Ngọc giữ đủ thương, giáp và tay chống đỡ |
| Lò Muối Đỏ | Bọ có sáu chân/tinh thể nguyên vẹn; Kỵ Sĩ Lò có kiếm ngắn, khiên lò và ống khói |
| Đầm Sen Nguyệt | Sứa giữ nguyệt miện, xúc tu và hai hạt châu; Bọ Ngựa giữ đôi lưỡi cánh sen và chân côn trùng |
| Điện Vạn Hương | Diều có đuôi và tua cổ; Hộ Vệ Hương giữ thân chuông, ngọc giữa thân và khiên tròn |

Ở cả màn hình dọc/ngang: kiểm tra không cắt cánh, râu, thương hoặc đuôi; chân/đáy không nhảy lệch giữa pose; không có nền hình chữ nhật quanh sprite. Xem idle, vào trận, tấn công, trúng đòn, gục và quái chiến thắng khi đội người chơi gục.

## Combat và thao tác

- So sánh Normal/Hard/Extreme ở các màn đã mở: độ khó, số đợt, kỹ năng và phần thưởng vẫn theo luật trước.
- Theo dõi ba quái phòng thủ: chống đỡ khi dùng chiêu khiên; hiệu ứng khiên hiện đúng lúc tác động. Quái thường không có báo chiêu/pha boss giả.
- Quan sát hiệu ứng bám đúng mục tiêu; số HP/khiên xuất hiện ở contact, không gây tác động thêm khi chỉ xem hoạt ảnh.
- Tạm dừng/tiếp tục; đổi sang ứng dụng khác rồi quay lại; giảm chuyển động; tải lại trận đang lưu; mở lại nội dung đã ghé khi offline.
- Chơi thử Auto Chess và TCG để kiểm tra renderer chung. Dữ liệu đội hình, bộ sưu tập, fragment và tiến trình phải được giữ.

## Thiết bị và PvP

Trên Safari/iPhone và Android cấu hình yếu: ghi nhận máy/OS/browser, FPS hoặc cảm giác giật, nóng máy, sprite mờ, lỗi âm thanh, khoảng trống/overflow và thao tác không bấm được. Kiểm tra lần mở đầu và những lần mở lại.

PvP hai thiết bị: tạo/join phòng, từ chối người thứ ba, thử cùng Wi-Fi và khác mạng; mất mạng/nối lại/reload, úp/kích hoạt bẫy TCG và chu kỳ farm/PvP Auto. Networking không thay trong 5.9.9; các bài test này nghiệm thu môi trường thực và NAT/TURN.

## Review PR

Đọc `UPDATE.md`, `VERIFICATION.md`, `ROADMAP_STATUS.md`, rồi xem manifest/pose/VFX và `evidence/pose-contact.webp`. Kiểm tra diff không sửa engine/save schema hay dependency runtime; dung lượng không vượt ngân sách. PR này nối sau #59 nếu PR nền chưa merge. ChatGPT không tự merge hay đánh dấu các mục test thiết bị thật là hoàn tất.
