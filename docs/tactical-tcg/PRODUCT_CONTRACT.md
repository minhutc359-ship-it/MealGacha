# Product contract

## Bề mặt

Sản phẩm chỉ gồm Tactical TCG, Manga, Chest và legal. PvP ở `/?tab=play&queue=pvp` là phòng thử nghiệm cục bộ, không xếp hạng và không cấp thưởng PvE.

## Dữ liệu

- Migration chạy trước khi tải Tactical UI, giữ raw backup và rollback khi lỗi.
- Catalog canonical nối alias TCG, Chest, Auto Chess và 12 Vị Linh AW2 để bảo toàn dữ liệu cũ.
- `soul-of-meal.tactical-tcg.progress.v1` lưu Tinh Vị, thẻ, nút campaign, Manga và receipt đã nhận.
- Mỗi reward receipt chỉ commit một lần; ghi có journal, readback, rollback và kiểm tra thay đổi từ tab khác.
- Chest mới tạo receipt `chest:<reward-id>`: bản đầu cấp collectible canonical, bản trùng đổi thành Tinh Vị theo độ hiếm. Reward Chest cũ vẫn được giữ nguyên; tiến trình trước thời điểm migration không bị phát lại.
- Không chuyển power bonus/rating cũ sang PvP.

## Battle

Bàn mỗi bên 4×2, tối đa 5 Vị Linh. Engine reducer thuần, action idempotent, target ưu tiên hàng trước cùng cột, rồi hàng trước gần nhất, hàng sau, cuối cùng commander. Các phase: planning, clash, reaction, ultimate, round-end, result.

- Campaign hợp nhất 3 bản sao; PvP thử nghiệm hợp nhất 2 bản sao và không cấp thưởng PvE.
- Mỗi bên chỉ có một bẫy đang kích hoạt. Mành Tre tạo 20 khiên, Hơi Nóng phản 12 sát thương, Nước Dùng hồi tối đa 18 khi mục tiêu còn không quá nửa sinh lực.
- Sau clash, cửa sổ reaction giữ trận mở để dùng Tuyệt kỹ trước khi kết thúc vòng.
- Boss campaign có Pha 1/2/3 theo ngưỡng sinh lực 100%/66%/33%; Pha 2 và 3 tăng khiên, sức đánh, năng lượng và ghi log hiển thị.
