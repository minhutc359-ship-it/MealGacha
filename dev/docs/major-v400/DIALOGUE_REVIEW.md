# Rà soát thoại 4.0

Đọc lại thoại TCG (18 màn cũ và 9 màn mới), lời chuyển pha boss, nhiệm vụ đồng hành, sự kiện thám hiểm và 13 cảnh Auto Chess. Sửa những câu thiếu chủ thể, dùng ẩn dụ thay cho hành động, xưng hô gây nhầm quan hệ hoặc hướng dẫn khác cơ chế thực tế. Giữ những hình ảnh có ngữ cảnh rõ như chiếc bát mẻ, mầm xám, đèn ông sao và ghế trống.

## Thay đổi chính

- Chín màn mới có tình huống và kết quả riêng. Bỏ lời kết dùng chung về “một lời được trả về đúng người”.
- Hải xin lỗi vì để sương xóa tên người mất tích khỏi sổ bến; không gán cho Hải câu chuyện về cha của Nhiên. Người nhận được quyền chưa tha thứ.
- Bách nói với Liên bằng cha/con; Nhiên và Mộc không gọi An là con. Liên nói với người chơi bằng bạn, không gọi người chơi là con.
- Giải thích rõ Ấn Vị, Vị Linh, ý chí chủ tướng, điều kiện để tiếng vọng có đời sống riêng và cái giá của việc phá chiếc muôi. Mai vẫn đã mất; tiếng vọng không phải Mai hồi sinh. Hai ending remember/release và thứ tự tiết lộ được giữ.
- Hướng dẫn Auto Chess nói về bố trí quân, trang bị và chuẩn bị trước trận. Bỏ yêu cầu chọn mục tiêu niệm phép giữa giao chiến tự động. Hơi lạnh làm choáng mục tiêu, không phải đóng băng cả tuyến. Boss Trang Giấy sao chép kỹ năng đội người chơi vừa dùng với 65% sức mạnh theo combat hiện tại.

## Ví dụ

| Trước | Sau |
| --- | --- |
| “Ông không cần trả mạng sống đó. Ông cần sống đủ tử tế với nó.” | “Liên đã sống nhờ Mai cứu. Ông không thể trả ơn bằng cách buộc Mai trở về. Hãy chăm sóc Liên và kể đúng việc Mai đã làm.” |
| “Có lẽ điều em ấy muốn mang đi rước là bàn tay của mình…” | “Em ấy muốn mang đi rước chiếc đèn có phần mình tự tô. Mình thử vá lại mà giữ phần ấy nhé.” |
| “Cháu hãy thắp lại một lời mời.” | “Cháu hãy tìm người từng bán ở đó, giúp họ nhớ tên mình và món mình nấu.” |

## Kiểm chứng

- Typecheck ứng dụng/dev, 334 kiểm thử, production build, release records và budget dung lượng.
- So sánh dữ liệu xuất từ module với commit 4.0 `7ada502`: metadata 27 màn (ID, thứ tự, chương, boss, thẻ thưởng), 13 ID cảnh Auto, 10 lựa chọn đồng hành và 20 lựa chọn sự kiện không đổi.
- Chín màn mới có chín lời dẫn kết quả và chín lời đáp kết quả khác nhau.
- Không đổi schema save, reward logic, điều kiện mở khóa hay combat. Nội dung thoại và cách dựng các cảnh mới là phạm vi thay đổi.
- Đã đọc lại trong mã nguồn; chưa đánh giá cách diễn thoại bằng lồng tiếng hoặc qua playtest người thật.
