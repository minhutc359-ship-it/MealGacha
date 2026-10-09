# Công thức của riêng tôi · 2.8

## Từ nghiên cứu đến cơ chế đã triển khai

Đọc nguồn chính thức, lấy nguyên tắc thiết kế để giải quyết vấn đề của MealGacha. Không dùng nhân vật, hình ảnh hay nhạc của các game tham khảo.

| Nguồn | Nguyên tắc | Áp dụng trong MealGacha |
| --- | --- | --- |
| [Nintendo phỏng vấn Anthony Giovannetti về Slay the Spire](https://www.nintendo.com/jp/topics/article/1f6d2f1e-b7ea-11e9-b641-063b7ac45a6d) | Thông tin về hành động địch giúp người chơi cân nhắc tấn công/phòng thủ; biểu tượng và con số giảm lượng chữ cần đọc. | Thanh chiến thuật trong mọi trận: tổng công của quân địch đang thấy, năng lượng lượt địch tới, tình trạng Hộ vệ. Boss tiếp tục báo trước luật riêng. Công trên sân không phải dự đoán tổng sát thương; UI và hộp giải thích nói rõ bài địch ra thêm có thể đổi nguy cơ. |
| [Blizzard giới thiệu Adapt trong Journey to Un’Goro](https://news.blizzard.com/en-us/article/20584091/prepare-to-embark-on-a-journey-to-ungoro) | Chọn một trong ba hiệu ứng giúp ứng phó với tình huống, thay vì luôn nhận một nâng cấp cố định. | Lượt 4: chọn Đảo lửa / Giữ bếp / Nếm ký ức. Ba lựa chọn cố định, dễ học, có trạng thái không khả dụng và lý do. Chọn xong quay lại trận; không thêm giao diện quản lý lâu dài. |
| [Blizzard: Designer Insights, Enrage Changes](https://news.blizzard.com/en-us/article/21614307/designer-insights-with-peter-whalen-enrage-changes) | Từ khóa giúp học cơ chế và mang ý nghĩa trong thế giới trò chơi. | Tên ứng biến gắn với hành động nấu và chủ đề ký ức; mỗi lựa chọn có lời của người giữ vị cùng màu hiệu ứng riêng. |

Đây là quyết định thiết kế của MealGacha dựa trên nguồn tham khảo, chưa phải kết quả khảo sát mức cuốn hút của người chơi.

## Luật Ứng biến

Chỉ trận mới có trạng thái `tactic`. Khi bắt đầu lượt người chơi thứ 4, nếu trận còn tiếp tục, mở lựa chọn một lần. Cutscene đang chờ và trình diễn lượt địch kết thúc trước khi mở lựa chọn. Không tốn năng lượng, không đổi kinh tế, không cấp thẻ vào bộ sưu tập.

| Chọn | Hiệu ứng thật | Giới hạn |
| --- | --- | --- |
| Đảo lửa | Quân hiện có +1 công, kéo dài đến khi quân rời sân. | Cần ít nhất một quân; tối đa 3 quân. Không thêm lần đánh hoặc đánh thức quân. |
| Giữ bếp | Hồi 3 ý chí, không vượt tối đa; quân hiện có +1 chắn. | Không cấp chắn cho quân gọi sau. Luôn có thể chọn dù hiệu quả bị giảm bởi máu đầy/sân trống. |
| Nếm ký ức | Rút tối đa 2 lá còn trong bộ, vừa chỗ trống tay. | Không rút kiệt sức, không đốt lá khi tay đầy. Cần bài và chỗ trống. |

Hiệu ứng được reducer áp dụng một lần trước khi hiển thị. Animation, nhạc, bỏ qua trình diễn và tải lại không tạo thêm hiệu ứng. Lựa chọn không cắt chuỗi combo món → phép. Trận cũ thiếu trường này giữ luật cũ; không bất ngờ mở lựa chọn khi khôi phục.

## Nhịp truyện và nhân vật

Sân khấu thoại dùng ảnh nền đã có cùng nhân vật cắt nền anime 3D hiện lớn. Từng câu đổi người nói, kể cả `Bạn · Ký ức`, `Bà · Lá thư`, nghệ nhân Hiệu và vai phụ. Người kể giữ nền minh họa. Sương Nhạt dùng gương mặt người giữ vị với màu tiếng vọng; các linh ảnh boss dùng hình người giữ sương, chưa có thiết kế hình thể riêng cho từng boss.

Sáu cảnh thức tỉnh boss có lời thoại riêng và nhắc chiến thuật đúng luật. Chỉ chiến dịch mở các cảnh này; tuần, thám hiểm và truyện phụ dùng cảnh tổng quát để không lộ chương chưa mở. Các khoảnh khắc tiết lộ/quyết tâm/tender được đánh dấu trong dữ liệu truyện để đổi sắc sân khấu. Chuyển ảnh và chuyển động thở không chặn nút đọc; cả tùy chọn Giảm chuyển động và cài đặt hệ điều hành được tôn trọng.

**Spoiler về chỉnh mốc tuổi:** Bách hiện 55, Liên 23. Liên là đứa trẻ sáu tuổi được Mai cứu 17 năm trước, thay cho chi tiết Bách là em bé nhưng đã là người thầy trung niên. Chương Trung Thu giới thiệu Bách là cha Liên và gieo ký ức cô được bế lên bờ. Cảnh cuối trả tên người cứu cho Liên: trách nhiệm của Bách là sống tiếp và nói thật, không giữ Mai để trả nợ. Chiến dịch vẫn 18 màn và hai đoạn kết; Ứng biến không tạo một tuyến kết thúc thứ ba.

## Nhạc và dữ liệu

Nút ♫ trong trận/cutscene hoặc Cài đặt → Phong cách nhạc. Bếp Việt mặc định; 8-bit phiêu lưu có bốn bản phối gốc. Cùng mood/độ ưu tiên, đổi phong cách crossfade; mỗi bản phối giữ vị trí phát riêng khi tạm dừng. Master mute, nhạc riêng và mức âm lượng tiếp tục hoạt động.

Phong cách nhạc lưu trong cài đặt thiết bị của Rương (`foodchest.user.v1`), có trong backup JSON. Mã MGC1 chuyển tiến trình TCG và lựa chọn Ứng biến, không chuyển cài đặt âm thanh của thiết bị. Trạng thái pending/chosen có kiểm tra khi import; mã hỏng không ghi đè tiến trình. Không thêm tài khoản hoặc backend.

## Giới hạn và bước đánh giá tiếp theo

Ảnh anime 3D là ảnh render có animation bằng CSS, chưa có rig/model 3D hoặc giọng đọc. AI hiện giữ chính sách ra bài đã có; thanh nguy cơ không biến thành dự đoán toàn bộ lượt. Ba ứng biến được giới hạn sức mạnh, nhưng chưa có dữ liệu thực tế để khẳng định cân bằng cho mọi bộ bài. Nên lấy phản hồi về tỷ lệ chọn từng ứng biến, thời lượng trận và đoạn truyện bị bỏ qua trước khi thêm nhiều nhánh hoặc cơ chế mới.
