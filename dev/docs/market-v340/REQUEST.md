
##  Bảng Thiết Kế Giao Diện & Cơ Chế Gameplay Mới

| Tính năng | Thiết kế chi tiết | Giải pháp tối ưu trải nghiệm (UX) |
|---|---|---|
| Bàn cờ & Hàng chờ | Cấp tối đa là 9 quân (Up 9 anh) trên sân. Hàng chờ tướng dưới sân có đúng 9 slot. | Đảm bảo tính toán chiến thuật đủ rộng cho các mốc tộc hệ cao. |
| Chống bấm nhầm (Swap) | Hủy cơ chế tự động chọn sẵn (pre-select) quân cờ ngay khi vừa mua từ cửa hàng. | Khi bạn bấm mua tướng, tướng sẽ bay thẳng vào hàng chờ. Nếu bạn bấm tiếp vào một tướng đang ở trên sân, game không tự động hoán đổi vị trí (swap) của 2 con nữa. |
| Cơ chế Tự động Nâng sao | Khi hàng chờ đầy (9/9), nếu cửa hàng xuất hiện quân cờ trùng giúp bạn đủ 3 con giống nhau để lên sao, hệ thống sẽ tự động mua và hợp nhất ngay lập tức từ cửa hàng mà không bắt bạn phải bán bớt quân cờ đang có trên hàng chờ. | Khắc phục hoàn toàn lỗi bạn vừa gặp (mua 2 con cơm tấm bị đầy slot phải bán bớt 1). |
| Hiển thị Tộc Hệ (HUD bên trái) | • Tộc hệ chưa kích hoạt: Màu xám/tối. • Mốc 2: Màu Đồng  • Mốc 4: Màu Bạc  • Mốc cao hơn (nếu có): Màu Vàng Vàng 🥇 | Nhìn lướt qua là biết đội hình đang mạnh ở nhánh nào, nhánh nào đang thừa/thiếu tướng. |
| Nền Tướng & Cửa hàng | Tướng trong cửa hàng và trên sân sẽ có ảnh nền (Background) hiển thị màu đặc trưng của Tộc Hệ đang mang: • Hỏa vị: Màu đỏ 🔥 • Hải vị: Màu xanh nước biển 🌊 • Ngọt vị: Màu xanh lá cây 🟢 | Dễ dàng phân biệt hệ sinh thái của tướng bằng trực giác thông qua màu sắc mà không cần đọc chữ. |
| Cải tiến Cửa hàng (Shop HUD) | • Nổi bật tướng: Highlight rõ ràng các tướng từ 1, 2, 3, 4 đến 5 vàng kèm ký hiệu Tộc hệ. • Vàng hiện có: Hiển thị trực tiếp ngay bên trong khung HUD cửa hàng (cạnh nút Roll/Up cấp). | Người chơi dễ dàng đối chiếu số tiền mình đang có với giá tiền của tướng ngay tại một vùng nhìn, không phải liếc mắt lên góc trên màn hình. |



Khi chuyển dịch sang nền tảng Mobile (Điện thoại), do không có chuột phải và bàn phím, chúng ta cần thay đổi linh hoạt các thao tác chạm (Touch) và vuốt (Swipe) để giữ nguyên sự tiện lợi mà không làm mất đi các tính năng bạn yêu cầu.
Dưới đây là phương án tối ưu hóa giao diện và trải nghiệm dành riêng cho bản Mobile:
##  Phương Án Chuyển Đổi Thao Tác Từ PC sang Mobile

| Tính năng trên PC | Giải pháp tối ưu trên Mobile | Chi tiết trải nghiệm (UX Mobile) |
|---|---|---|
| Click chuột phải (Xem thông tin) | Chạm và Giữ (Press & Hold) | Ấn giữ vào tướng khoảng 0.3 giây sẽ hiện lên bảng thông tin chi tiết. Thả tay ra bảng sẽ tự đóng, giúp check nhanh chỉ số mà không sợ bị di chuyển tướng. |
| Phím tắt Mua/Bán/Roll | Hệ thống Nút bấm & Kéo thả | • Mua: Chạm trực tiếp vào thẻ tướng trong Shop. • Bán: Kéo tướng định bán vào biểu tượng Thùng rác xuất hiện ở hai bên cạnh màn hình. • Roll / Lên Cấp: Thành các nút bấm lớn, nằm gọn bên phải HUD cửa hàng để ngón tay cái dễ thao tác. |
| Chống bấm nhầm (Swap) | Khóa mục tiêu thông minh | Thay vì chạm một cái là chọn, trên Mobile bạn phải Kéo và Thả (Drag & Drop) tướng để xếp vị trí. Nếu chỉ vô tình chạm (Tap) vào tướng trên sân, game sẽ không tự động đổi chỗ hay làm gì cả. |
| Ghép trang bị | Kéo thả đè lên nhau | Chạm vào mảnh đồ trong kho đồ, kéo và đè lên người tướng (hoặc đè lên mảnh đồ khác). Trước khi thả tay, game sẽ hiện một khung nhỏ xem trước (Preview) món đồ lớn sẽ tạo thành. |

------------------------------
##  Tối ưu giao diện HUD trên màn hình Điện thoại (Màn hình nhỏ)
Do màn hình điện thoại nhỏ hơn máy tính rất nhiều, giao diện được phân bổ lại để tránh che tầm nhìn:

* HUD Cửa hàng (Nằm ở cạnh dưới):
* Thanh hiển thị Vàng hiện có sẽ nằm siêu to, rõ ràng ngay góc phải của khay cửa hàng (gần ngón cái).
   * Các thẻ tướng 1-5 vàng vẫn được Highlight viền màu tộc hệ rõ nét. Do màn hình nhỏ, khi Shop mở lên, nó sẽ tự động thu nhỏ bàn cờ lại một chút để không che mất hàng chờ 9 slot.
* Hàng chờ 9 slot (Nằm ngay trên Shop): Được thiết kế bo tròn, khoảng cách giữa các slot đủ rộng để ngón tay bạn chạm vào không bị dính sang con bên cạnh.
* HUD Tộc Hệ (Nằm ở cạnh trái):
* Mặc định sẽ hiển thị dạng Thu gọn (Chỉ hiện biểu tượng và mốc màu) để tiết kiệm diện tích.
   * Khi bạn chạm vào thanh này, nó sẽ trượt nhẹ ra (Slide out) để hiện đầy đủ chữ. Vẫn giữ nguyên quy tắc: Chưa kích hoạt = tối, Mốc 2 = Đồng , Mốc 4 = Bạc .
* Cơ chế Tự động Nâng sao (Khi hàng chờ đầy): Hoạt động hoàn hảo như PC. Bạn chỉ cần chạm mua tướng ở Shop, nếu đủ 3 con, hệ thống tự hút vào nhau và nổ hiệu ứng nâng sao ngay tại chỗ, cực kỳ rảnh tay cho Mobile.

Để giao diện Mobile mượt mà nhất, bạn thấy thế nào về phương án:

* Thiết kế một nút "Ẩn/Hiện Cửa hàng" (Toggle Shop) ở góc màn hình để khi cần soi bài đối thủ hoặc xếp vị trí giai đoạn cuối trận, bạn có thể đóng hẳn Shop lại cho rộng màn hình không?
* Bạn có muốn thêm tính năng Rung phản hồi (Haptic Feedback) nhẹ khi tướng nâng lên 2 sao hoặc 3 sao để tạo cảm giác "đã tay" hơn trên điện thoại không?
