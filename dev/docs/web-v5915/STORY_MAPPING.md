# Đối chiếu cốt truyện manga Web 5.9.15

Manga không có bản sao cốt truyện riêng. Tiêu đề, lời dẫn, thoại và nhánh kết quả được dựng lúc chạy từ các module canon; tranh chỉ chứa hình, không chứa chữ sinh bởi mô hình.

## Tập I · Bàn Ký Ức (TCG)

| Trang | Nguồn mở khóa | Trục truyện được minh họa |
|---|---|---|
| Phố Đèn Lồng | đủ `lantern-1..3` | chiếc muôi, người bán hàng nhớ An, Kẻ Canh Bếp nhận ra tiếng vọng, sáu chiếc ghế |
| Bến Cảng Than Hồng | đủ `harbor-1..3` | Bài Chòi, nồi cháo cứu hộ, ghế 06, tên Mai và Ngọn Lửa thứ hai |
| Vườn Xanh Tĩnh Lặng | đủ `garden-1..3` | câu hát đáp, lá thư của bà, Mộc bảo vệ tiếng vọng và sự thật Bách che giấu |
| Biển Ký Ức | đủ `tide-1..3` | câu đờn, sổ hành khách, bếp chìm, tiếng vọng không phải Mai trở về |
| Thành Phố Đường Sao | đủ `moon-1..3` | đèn ông sao, quyền được buồn, chuyến tàu ký ức, bà nhận ra một người khác |
| Bữa Tiệc Bình Minh | đủ `last-table-1..3` | tên người chết, Mai cứu Liên, lời thú nhận của Bách, chiếc muôi vỡ và hai kết thúc |
| Chợ có hai giọng | đủ `living-market-1..3` | An giữ nguyên lời xin lỗi; người bị tổn thương tự chọn có tha thứ hay không |
| Bến sau cơn mưa | đủ `rain-harbor-1..3` | Hải gửi lời xin lỗi, chờ và lắng nghe thay vì đòi tha thứ |
| Bữa cơm ngày mai | đủ `tomorrow-table-1..3` | tưởng nhớ Mai, Bách thôi hứa phép màu, Tịnh trả lại những tên đã xóa |

Nguồn: `src/game/narrative.ts`, `src/game/livingStory.ts`, `src/game/story.ts` và lựa chọn `storyEnding` trong save.

## Tập II · Tám Hương Ấn (Adventure)

| Trang | Nguồn mở khóa | Trục truyện được minh họa |
|---|---|---|
| Chiếc bát không tên | sao boss `lantern-6` | bát trống, Bếp Gốc, nhịp trống cuối và tên Vân |
| Lá thư không được gửi | sao boss `harbor-6` | con tàu trở lại, thư Vân, Khuyển Than và quyền tự chọn ở lại/lên đường |
| Hạt giống của Vân | sao boss `garden-6` | lời hứa bảo vệ quyền thay đổi công thức, chìa khóa được cây tự trao |
| Cánh cửa dưới triều | sao boss `tide-6` | cha Hải, lệnh đóng cổng của bà, nguồn gốc Sương Nhạt và bốn ấn còn lại |
| Chén trà cho người lạ | sao boss `mistwood-6` | rót chén đầu cho người từng bị xem là địch; Vân không bị xóa con người mới |
| Chữ ký trong tro | sao boss `sugartower-6` | chữ ký Bách, hủy mệnh lệnh cũ và giữ lại những tên Cự Tượng đã cứu |
| Con đường để tự trở về | sao boss `ashalley-6` | cây cầu mở hai hướng, ngọn đèn không đòi Vân phải quay lại |
| Bữa ăn thứ chín | sao boss `lasttable-6` | phá một sự thật duy nhất, Vân mang mười năm lang thang và tự chọn tương lai |

Nguồn: `src/game/adventureRpg/story.ts`, `src/game/adventureRpg/content.ts`, `stars` và `choices` trong `RpgSave`.
