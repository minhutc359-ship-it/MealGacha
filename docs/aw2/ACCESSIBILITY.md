# Onboarding, accessibility và điều khiển AW2

Áp dụng từ AW2-018F cho production shell tại `/` và review shell tại `/dev/aw2/game.html`. Tùy chọn ở đây chỉ đổi cách trình bày/điều khiển; không sửa save, luật, camera, nhiệm vụ hoặc phần thưởng.

## Lần vào đầu tiên

Khi main save trống và không có bản an toàn, game mở hướng dẫn bốn bước: mục tiêu, di chuyển, tương tác/phím nhanh và bảo vệ bản lưu. Chỉ xem, lùi/tiến hoặc đổi bước không ghi dữ liệu. **Bỏ qua hướng dẫn và bắt đầu** hoặc nút bước cuối mới gọi thao tác tạo save hiện hành.

Nếu có backup/journal hợp lệ trong lúc main trống hoặc lỗi, màn **Phục hồi bản an toàn** luôn được ưu tiên. Onboarding không che recovery và không tự thay dữ liệu.

## Bàn phím và focus

| Phím | Hành động |
|---|---|
| WASD / mũi tên | Di chuyển |
| E | Tương tác gần nhất |
| J | Mở/đóng Nhiệm vụ |
| I | Mở/đóng Túi |
| P | Mở/đóng Đội |
| M | Mở/đóng Bản đồ hành trình |
| H | Mở/đóng Hướng dẫn |
| Escape | Đóng panel hoặc dừng đường đi |

J/I/P/M/H không bắt phím khi đang gõ trong input, textarea, select, contenteditable hoặc textbox; không bắt repeat hay tổ hợp Ctrl/Meta/Alt/Shift. Các nút tương ứng công bố cùng `aria-keyshortcuts`.

Skip link đầu trang đưa focus thẳng tới vùng bản đồ và điều khiển. Dialog giữ focus bên trong, Escape đóng theo guard hiện hành và trả focus về nút đã mở. Onboarding đưa focus về tiêu đề sau khi đổi bước; ArrowLeft/ArrowRight đổi bước khi focus không ở trường nhập liệu.

## Tùy chọn hiển thị

Trong **Hướng dẫn → Hiển thị và điều khiển** có bốn lựa chọn:

- Chữ lớn; panel có vùng cuộn để nội dung không bị cắt.
- Tương phản cao; panel, nút chọn, focus và trạng thái vô hiệu vẫn phân biệt được.
- Giảm chuyển động; kết hợp với lựa chọn `prefers-reduced-motion` của hệ điều hành.
- Nút chạm lớn; nâng control chính lên tối thiểu 52px, trong khi mặc định giữ tối thiểu 44–48px.

Preference có schema/key riêng `aw2.ui.preferences.v1`, đồng bộ giữa tab bằng storage event và áp qua `data-aw2-*` trên document. JSON sai, version tương lai hoặc localStorage bị chặn đều fallback an toàn; gameplay vẫn tiếp tục và save tiến trình không bị đọc/ghi.

## Trạng thái và giới hạn nghiệm thu

Thông báo thường dùng live region lịch sự; lỗi dùng alert riêng, không đổi role của cùng một node giữa các render. CSS có safe-area, layout portrait 320px/landscape thấp, `prefers-contrast`, forced-colors và reduced-motion.

Unit/type/build/package gates kiểm tra contract kỹ thuật. Trước release vẫn phải chạy screen reader thật (VoiceOver/TalkBack/NVDA), kiểm tra zoom/chữ lớn trên thiết bị thật, contrast thủ công và UAT độc lập; test tự động không thay thế các gate này.
