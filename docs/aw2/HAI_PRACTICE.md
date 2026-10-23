# Luyện kỹ năng Hải

AW2-007L current development update, source `PENDING007L`: collection/saved-party implementation now available for this spirit after its explicit quest-gated invitation; practice remains ephemeral and grants nothing. [Collection rules](COLLECTION.md). Earlier pending-collection wording in the source-bound kit/art record below is superseded only for development ownership/parties. Original images/audio/manifest scope are historical delivery metadata, unchanged; full DoD/independent art/listening/device/rights/final balance remain OPEN.

Chạy `pnpm dev`, mở http://localhost:8443/dev/aw2/battle.html?team=hai. Đội luyện năm người thay Than bằng Hải; các cấp1/5/10/20 dùng đường cong thử nghiệm, không ghi EXP/save hay cấp quyền sở hữu Hải.

- **Gạt Sóng:** cận chiến trong tầm8, một điểm chạm, không có đạn bay.
- **Giữ Lối:** khi địch áp sát, Hải chuẩn bị một nhịp rồi dựng vùng phía trước cố định trong4nhịp. Địch đi vào vùng bị giảm tốc50%, tối đa2nhịp và không quá hạn vùng. Địch miễn khống chế/debuff không bị làm chậm. Hải đi tiếp không kéo vùng theo.
- **Biết Đường Về:** đồng minh khác còn sống, không phải triệu hồi, HP≤35% và cách≤12 kích hoạt khiên cho chính Hải bằng20%HP tối đa trong4nhịp. Cần Hải chưa có khiên; hồi nội tại10nhịp. Không cộng dồn/refresh mỗi frame, không hồi sinh.
- **Bờ Đợi:** tiêu100năng lượng, chuẩn bị2nhịp rồi đặt tuyến chắn trước vị trí hiện tại của Hải. Trong6nhịp, đồng minh ở phía sau tuyến và cách≤14 được chặn tối đa50%sát thương mỗi đòn tới từ phía trước. Tổng sức chắn bằng35%HP tối đa của Hải. Đòn đánh vòng qua tuyến, đồng minh vượt lên trước/quá xa không được che; tuyến không di chuyển theo Hải. Nhiều Hải dùng một tuyến đủ điều kiện theo thứ tự tạo/ID, không cộng dồn giảm sát thương.

Thử **Tạm dừng → Bước1nhịp** để quan sát vị trí và thời hạn. Dùng ultimate sau khi Hải đã tiến lên để tuyến che được đồng đội; dùng quá sớm có thể bỏ lại tuyến phía sau. **Đối thủ ngắt Hải** chỉ ngắt kỹ năng đang chuẩn bị qua luật thật: năng lượng đã tiêu không hoàn lại, vùng chưa dựng không xuất hiện. Vùng đã cam kết giữ hiệu lực đến hết hạn/Hải bị hạ/trận kết thúc. Khiên nội tại là khiên thường; tuyến Bờ Đợi có sức chắn riêng, không bị kỹ năng bóc khiên thường của Muối xóa.

Âm thanh mặc định tắt, chỉ phát sự kiện thật sau khi bật và trận đang chạy; bước khi tạm dừng không phát âm thanh. Giảm chuyển động vẫn hiển thị vùng có hiệu lực bằng FX gốc tại đúng vị trí. Reset áp dụng cấp đang chọn và giữ preset Hải. Trang roster tiếp tục cho xem bộ hình tham chiếu riêng.

`aw2-hai-development-v1`: HP240/ATK26/DEF28/range8/move6, basic cooldown5, auto10. Đây là development tuning, chưa phải cân bằng cuối. Thu thập/đội lưu Hải trong hành trình, art/playtest/listening/thiết bị/rights/release còn mở. [Task](tasks/AW2-007G.md), [gates](HAI_CHARACTER_GATES.md), [evidence](evidence/AW2-007G.md).
