# Luyện kỹ năng Muối Đen

Sau `pnpm dev`, mở http://localhost:8443/dev/aw2/battle.html?team=muoi. Đây là đội luyện5 người, thay Sương Lành bằng Muối Đen; không cấp nhân vật, tiêu nguyên liệu, ghi EXP hoặc save. Hành trình vẫn dùng đội khởi đầu đã lưu. Chỉ số là development tuning, chưa phải cân bằng cuối.

Muối Đen đánh thường bằng đạn. **Nêm Đúng Chỗ** chọn đối thủ trong tầm đã gây nhiều sát thương thực tế nhất, hòa thì theo thứ tự vị trí đội/ID; giảm công20% trong6 nhịp. Mỗi nguồn chỉ có một dấu. **Vị Còn Lại** gia hạn dấu còn hiệu lực khi basic của chính nguồn đó trúng đúng mục tiêu, thêm1 nhịp/lần, tối đa10 nhịp tính từ lần áp dấu. Nhiều nguồn không cộng dồn giảm công; khi cùng có suy yếu của Than, lấy hiệu ứng mạnh hơn.

Chọn **Mục tiêu Muối Đen** rồi dùng tuyệt kỹ khi đủ100 năng lượng. **Một Nhúm Đủ Rồi** thi triển2 nhịp, bóc một nửa khiên thường (làm tròn xuống) rồi gây burst1,3ATK. Cần mục tiêu còn sống/trong tầm khi hoàn tất; bị ngắt hoặc mục tiêu chạy khỏi tầm sẽ không cho kết quả giả. Barrier phase của boss và chống ngắt không bị bóc như khiên thường. Với preset cấp5 hiện tại, có thể bắt đầu ultimate ở nhịp4 để hoàn tất đúng lúc Than địch dựng khiên ở nhịp6; kết quả thật hiện trong **Kỹ năng vừa xảy ra**.

Dùng **Tạm dừng → Bước1 nhịp** để theo dõi chuẩn bị/đạn bay/trúng đích. **Dấu đang có** hiển thị mục tiêu và nhịp hết hạn. Chọn mục tiêu có dấu rồi bấm **Đối thủ tẩy dấu** để thử counter: đạn đã phóng không tự áp lại dấu đã tẩy; Muối cần auto mới. Đây là thao tác đối thủ trong trận luyện, chưa phải AI tẩy dấu của toàn bộ game. Âm thanh chỉ phát khi bạn bật và trận đang chạy; bước khi tạm dừng không phát âm thanh cũ. **Giảm chuyển động** giữ pose tham chiếu, FX vẫn hết hạn.

Expiry xảy ra trước contact của cùng nhịp; nguồn/mục tiêu gục hoặc kết thúc trận hủy dấu. Đạn đã phóng vẫn theo luật cũ khi trận còn tiếp, nguồn gục không gia hạn dấu. Debuff immunity được khai báo riêng với movement/control immunity. Giá trị/cap trên dùng `aw2-muoi-development-v1`; cấp1–20 chỉ tăng stats theo curve phát triển, không tăng cap debuff.

Art/continuity, cân bằng trận, nghe âm thanh trên thiết bị, quyền sử dụng và thu thập/đội lưu trong hành trình còn cần hoàn thiện. [Gate nhân vật](MUOI_CHARACTER_GATES.md), [báo cáo](REPORT.md), [local](LOCAL_TEST.md).
