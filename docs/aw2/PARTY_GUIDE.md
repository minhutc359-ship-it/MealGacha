# Chọn đội và học từ kết quả trận — AW2-007N

Source `PENDING007N` · development measurement/guidance. Chưa phải cân bằng sản phẩm đã nghiệm thu. Dùng đội5người đã sở hữu, không cần UR để hoàn thành cốt truyện; năm starter vẫn được nhận trực tiếp từ nhập môn.

Trong `/dev/aw2/world.html`, mở **Đội và túi đồ**, chọn5người. **Vai trò đội đang chọn** đếm người chuyên đỡ đòn/hồi phục/gây sát thương theo kit thật; Vân luôn là Hybrid, Mộc và Mộc Non là hai người khác nhau. Thiếu vai trò sẽ hiện gợi ý dùng người đã nhận ở nhập môn. Đủ vai trò không dự đoán thắng: kỹ năng cụ thể và thời điểm dùng tuyệt kỹ vẫn ảnh hưởng kết quả.

Mở **Chỉ số đội đang chọn** để xem Máu/Công/Thủ ở cấp chung hiện tại, tính từ EXP thực đã lưu. Đây là chỉ số trận mới sau khi lưu đội, không đổi nhân vật đang chiến đấu. Vân hiển thị đúng nhấn Bảo hộ/Tấn công; đổi nhấn vẫn dùng chung một tuyệt kỹ/năng lượng.

**Chọn đội khởi đầu** đưa Than/Lửa Nhỏ/Lam Lam/Mộc Non/Sương Lành vào lựa chọn đang sửa, giữ nhấn Vân. Bấm **Lưu đội hình** mới ghi; **Hủy chọn đội** trả về đội/nhấn đã lưu. Lựa chọn đang sửa không đổi followers, cấp, sở hữu, vật phẩm, EXP hay ending. Lỗi ghi giữ draft để thử lại; tab cũ phải đọc lại. Không reset hành trình để đổi đội.

Khi thắng/thua/rút lui, **Kết quả lượt đấu này** hiển thị số đồng đội còn đứng và máu boss thực còn lại trong lượt đó. Phần này không tự lưu hoặc cấp thưởng. Với rematch sau ending, cốt truyện vẫn hoàn tất kể cả lượt mới thua; kết quả từng lượt và ending là hai sự thật riêng. Sau khi trở về, có thể xem lại đội hoặc chọn starter rồi lưu để thử tiếp. Tải lại giữa trận vẫn bỏ lượt đang chơi ở checkpoint.

## Quan sát ở EXP thực tế

Ma trận16đội đại diện của12kit, mỗi đội thử205EXP/cấp2 trước boss và345EXP/cấp3 sau ending, với3cách dùng tuyệt kỹ. **96lượt fixture xác định**, không phải96người chơi hay tỷ lệ thắng ngẫu nhiên; không đòi mọi đội thắng. Chỉ số/luật/kinh tế giữ nguyên.

| EXP | Không dùng tuyệt kỹ | Dùng khi sẵn sàng từ nhịp5 | Canh các cửa sổ thử nghiệm |
|---:|---:|---:|---:|
|205 |3/16đội thắng |6/16 |7/16 |
|345 |4/16 |11/16 |12/16 |

“Canh cửa sổ” ở đây là policy thử nghiệm: healer chờ đồng đội còn sống dưới70%máu, hỗ trợ khi có cảnh báo hoặc đồng đội bị thương, tuyệt kỹ gây sát thương chờ Ghế trống hết và tuân thủ tầm/hồi thế. Policy này **không tối ưu cho mọi đội**: starter205EXP tự đánh thắng50nhịp, dùng từ nhịp5 thắng45, nhưng policy cửa sổ thua42nhịp/boss còn52máu. Đội Hải/Nhiên/Mộc/Liên/Vân nhấn Tấn công ở345EXP thua với hai policy đầu nhưng thắng48nhịp với policy cửa sổ. Quan sát cảnh báo, lượng máu mất và nhịp kỹ năng để thử cách phù hợp; không coi rarity hoặc role coverage là lời hứa thắng.

Đây là baseline có thể tái lập để đánh giá các thay đổi sau này; chưa duyệt thông số cân bằng cuối. [Tóm tắt đủ96lượt/HP/commands/events hashes](evidence/AW2-007N-balance-summary.json), [kiểm chứng](evidence/AW2-007N.md), [bộ sưu tập](COLLECTION.md). Next[006B Phòng Bàn authored environment](tasks/AW2-006B.md); final balance/người chơi/thiết bị/rights/fullDoD vẫn mở.
