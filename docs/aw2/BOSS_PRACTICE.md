# Người Giữ Bàn Quên — bộ chiêu development

AW2-007D · 2026-10-22. Chỉ có trong thử thách Phòng Bàn của hành trình AW2; trang battle.html vẫn là trận mẫu starter. Hướng boss hư cấu được duyệt qua D14; thông số dưới là thử nghiệm, chưa là cân bằng phát hành.

Nhận **Thêm một chén** tại Dì sau nhiệm vụ mở bếp, đến gần boss trong Phòng Bàn rồi chọn **Bắt đầu thử thách**. Điểm lưu an toàn được ghi trước trận. Đội tự di chuyển/đánh; bạn canh ultimate. Không cần UR hoặc quay gacha.

| Chiêu | Dấu hiệu và tác động thật | Cách thử |
|---|---|---|
| **Ghế trống** | Thanh4 đòn thường; chặn sát thương tới boss. Mỗi tiếp xúc basic thật bớt1; hai nhịp basic của Lửa Nhỏ tính riêng. Đòn phá cuối cũng bị chặn. Bảo vệ tự tan sau8 nhịp nếu chưa bị phá. | Để đội đánh thường; giữ ultimate gây sát thương đến khi thanh hết. Ultimate hỗ trợ vẫn bảo vệ/hồi phục đồng đội. |
| **Mời hụt** | Báo3 nhịp, chốt vùng ngang quanh mục tiêu lúc báo; khi đòn tới chỉ đánh đối thủ còn sống đang trong vùng. | Theo tên đang trong vùng; đội di chuyển tự động có thể rời/vào vùng. Canh khiên/hồi phục. |
| **Tắt bếp** | Đếm3→2→1 rồi tác động mọi thành viên còn sống. | Chuẩn bị khiên/hồi phục trước nhịp tới; có thể tạm dừng và bước từng nhịp để học. |

Cảnh báo vẫn hiện khi tắt âm thanh hoặc bật giảm chuyển động. Bảng cảnh báo bám phía trên khi cuộn đến ultimate; khoảng cuộn giữ nút đầu tiên không bị bảng che. Hiện mới có chỉ báo chữ/thanh tiến độ; chưa có âm gõ/telegraph art riêng. Body boss vẫn mượn bộ Than đổi màu. Không coi hình/âm starter là bộ art boss hoàn chỉnh.

Nhịp thử nghiệm dài650ms. Boss bắt đầu bảo vệ ở nhịp3, tiếp theo Mời hụt12→15, Tắt bếp21→24, lặp chu kỳ ba chiêu với khoảng9 nhịp giữa lần bắt đầu. Trong lúc báo đòn, boss dừng basic/di chuyển. Thông số boss1000HP/135ATK/14DEF; Mời hụt dùng1×ATK trong bán kính14 trên trục0–100, Tắt bếp0,7×ATK toàn đội. Phòng thủ/khiên/làm yếu vẫn do core xử lý. Năng lượng basic vẫn được nạp khi chạm bảo vệ; đòn bị chặn không kích hoạt thêm passive sát thương/làm yếu.

Mô phỏng dùng đúng seed factory của world,5 starter và100 năng lượng đầu trận: level1 auto-only thua51; bật ultimate từ nhịp5 thắng48; giữ ultimate tấn công khi còn bảo vệ thắng43. Đội kiếm160/205XP thắng50/45/42 tương ứng. Đây là fixture xác định, không thay thế playtest cân bằng. Chạy lại bằng `node dev/tools/simulate-aw2-boss.mjs`.

Chiêu chờ hủy khi boss chết/trận kết thúc; rút lui dừng controller và giao diện cảnh báo. Reload giữa trận vẫn bỏ lượt ở checkpoint, không tự nhận thắng. Sau thắng/thua/rút lui phải **Lưu kết quả và trở về**; lỗi ghi giữ nguyên kết quả thật để thử lại. Thắng rồi đọc ghi chép, về Bà chọn kết thúc; phần thưởng nhiệm vụ vẫn cấp một lần. [Chơi đầy đủ](DEMO.md), [chạy local](LOCAL_TEST.md), [bằng chứng](evidence/AW2-007D.md).

Canonical IDs: `aw2-enemy-forgotten-host`; skills `:skill:missed-invitation`, `:skill:snuff-hearth`, `:skill:empty-chair`. Profile `aw2-forgotten-host-development-v2`, world tuning `aw2-world-boss-development-v2`. Boss không phải spirit sưu tập và không có rarity mới. Save vẫn schema v4; không lưu/resume trận đang chạy.
