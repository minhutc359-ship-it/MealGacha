# Nghiệm thu thiết bị thật — Web 5.9.15

Chủ dự án chơi thử, review và quyết định merge. Dùng một save mới và một save đã hoàn thành nhiều chương.

- TCG: trước khi thắng đủ ba stage, chương tương ứng phải khóa, không lộ tên hay tranh. Sau stage thứ ba, trở lại `Manga ký ức`; đúng một trang mới mở mà không cần xóa save.
- Adventure: trước boss stage 6, trang map phải khóa. Sau khi boss có sao, vào `Nhà Truyện Ký Ức` tại làng; trang map vừa hoàn thành phải mở.
- So từng trang với `STORY_MAPPING.md`: nhân vật, địa điểm, biến cố, thứ tự nhịp truyện và hội thoại phải đúng. Chương `last-table` phải hiện đúng kết thúc TCG đã chọn; Adventure phải hiện đúng hậu quả lựa chọn của map.
- Khi chương còn khóa, kiểm tra Network không tải WebP của chương đó. Chọn bìa/trang đã mở mới được tải đúng ảnh tương ứng.
- iPhone Safari và Android yếu: đọc hết một chương ở dọc và ngang; ảnh không méo/crop sai, nút chương cuộn được, chữ không tràn, vùng bấm đủ lớn và cuộn trang không giật.
- Thử reload, đóng/mở app, đổi tab và offline sau khi đã mở một trang. Tiến độ không mất; trang đã cache đọc lại được, trang chưa tải không hiện ảnh hỏng gây chặn giao diện.
- Kiểm tra giảm chuyển động, cỡ chữ lớn và screen reader: thứ tự bìa, danh sách chương, ảnh, tiêu đề và lời thoại phải dễ theo dõi.
- Chơi lại TCG/Adventure sau khi đọc manga để xác nhận nút điều hướng mới không làm đổi trận đấu, reward, save hoặc thao tác trên mobile.

Ghi model máy, OS, browser, ID chương, trạng thái save và ảnh/video nếu tranh, thoại hoặc điều kiện mở khóa không khớp.
