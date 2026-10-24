# Báo cáo Adventure World 2 —24/10/2026

Đã thêm **chuyển động đứng yên cho đủ 8 NPC**, theo yêu cầu mở rộng từ Bà/Dì. Mỗi NPC có bốn frame riêng: tư thế thường, thở nhẹ, chớp mắt và cử chỉ theo nhân vật. Giữ đúng trang phục, đồ vật, điểm đặt chân và vị trí tương tác. [Danh sách ảnh/prompt và cách chơi](THE_GIOI.md).

Khi mở hội thoại, hoạt ảnh dừng; giảm chuyển động giữ tư thế tĩnh. Chuyển vùng chỉ tải các atlas cần thiết, Phố bỏ tải hình NPC tĩnh thừa. Thiếu bất kỳ atlas bắt buộc nào sẽ báo lỗi, khóa điểm đến; phục hồi ảnh không đổi save. Một đại diện trên map, đội combat vẫn năm người.

**83 unit test, hai typecheck, asset audit, build/cách ly stable PASS.**178kiểm tra trình duyệt=89source+89build: đủ32pose/8NPC, pause/reduced/resume, nhập môn, ký ức, host luyện tập, Dì/cửa, hai ending và thiếu từng8ảnh–khôi phục. Bản build giữ47ca đã đạt và chạy tiếp42ca từ checkpoint thật sau khi sửa harness chờ khung render; không cộng trùng hoặc gọi là lượt full boss liền mạch. Source `PENDING006M`; [chi tiết](evidence/AW2-006M.md).

**Demo90% / sản phẩm≈40%(35–45%) giữ nguyên.**8/8NPC idle và6/6cảnh là tiến độ riêng; chưa phải NPC đi lại/bốn hướng đầy đủ, full characterDoD hay hoàn tất quyền phát hành. Theo D20tiếp tục gác nghiệm thu độc lập. Việc kế tiếp **006N: thêm chuyển động môi trường ở Làng/Phố** với frame riêng và cùng quy tắc pause/giảm chuyển động.
