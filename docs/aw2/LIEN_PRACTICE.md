# Luyện kỹ năng Liên

Chạy `pnpm dev`, mở http://localhost:8443/dev/aw2/battle.html?team=lien. Đội luyện năm người thay Lam Lam bằng Liên; đối thủ Muối Đen dùng dấu thật. Các cấp1/5/10/20 áp dụng chỉ số thử nghiệm; trang không ghi EXP/save hoặc cấp quyền sở hữu Liên.

- **Hạt Sen:** một projectile đơn, gây sát thương khi thực sự trúng. Đánh thường không tự hồi máu. Đạn đã phóng không đổi mục tiêu khi địch bị hạ.
- **Hẹn Sau Cơn Mệt:** chọn đồng minh còn sống có tỷ lệ HP thấp nhất, chuẩn bị một nhịp, rồi hồi đúng ba lần ở nhịp cam kết/+2/+4. Mỗi lần hồi `0.55ATK+6`, làm tròn và giới hạn ở HP còn thiếu. Một Liên chỉ duy trì một lời hẹn; không cộng dồn hay kéo dài bằng cách cast lại. Người nhận đầy HP không dời lịch; người nhận bị hạ sẽ dừng lời hẹn, không chuyển người hoặc hồi sinh.
- **Lời Hẹn Còn Đây:** khi thực sự hồi HP cho người còn mang dấu Muối/chậm/suy yếu, Liên cấp cho họ kháng một lần ngắt trong4nhịp. Hồi nội tại8nhịp theo từng người nhận. Không cộng dồn/refresh kháng ngắt đang có, kể cả của Mộc Non. Hồi0HP hoặc chỉ giải hiệu ứng không kích hoạt nội tại.
- **Mở Lời:** tiêu100năng lượng, chuẩn bị2nhịp. Lúc cam kết, mỗi đồng minh còn sống được tẩy đúng một hiệu ứng theo thứ tự: một dấu Muối (hạn sớm nhất, rồi ID nguồn) → chậm → suy yếu. Sau đó hồi hai lần: `0.9ATK+8` ở nhịp cam kết và `0.7ATK+6` sau2nhịp. Nhịp sau không tẩy thêm. Không xóa khiên, cảnh báo/bảo vệ/điều kiện boss, không hồi sinh hoặc thêm người nhận sau cam kết.

Thử **Tạm dừng → Bước1nhịp**. Ở trận cấp5 mặc định, dấu Muối xuất hiện sớm trên Lửa Nhỏ; có thể dùng Mở Lời sau khi lời hẹn đầu tiên đã bắt đầu để quan sát giải dấu và hai nhịp hồi thật. Dùng quá muộn có thể không cứu được mục tiêu trước burst. Chọn **Đồng minh thử ngắt**: nếu người đó đang chuẩn bị kỹ năng và có kháng ngắt, lần đầu chỉ tiêu một charge; lần tiếp theo mới ngắt. Kỹ năng bị ngắt trước cam kết không tạo hồi phục, năng lượng đã tiêu không hoàn lại. Hồi phục đã cam kết vẫn giữ lịch khi Liên chuẩn bị kỹ năng khác, nhưng dừng khi Liên bị hạ hoặc trận kết thúc.

Âm thanh mặc định tắt và chỉ phát kết quả thật khi đã bật, trận đang chạy. Bước khi tạm dừng không phát âm thanh. Một nhịp ultimate có nhiều người nhận dùng chung một cue; nếu cả đội đầy HP và không có debuff, không tạo hiệu ứng hồi máu giả. Giảm chuyển động vẫn dùng FX gốc hữu hạn. Reset giữ preset Liên và áp dụng cấp đang chọn.

`aw2-lien-development-v1`: HP145/ATK28/DEF10/range40/move5, basic cooldown5, auto10. Đây là development tuning, chưa phải cân bằng cuối. Thu thập/đội lưu Liên, art/playtest/listening/thiết bị/rights/release còn mở. [Task](tasks/AW2-007H.md), [gates](LIEN_CHARACTER_GATES.md), [evidence](evidence/AW2-007H.md).
