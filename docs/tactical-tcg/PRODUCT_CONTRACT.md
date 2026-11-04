# Product contract

## Bề mặt

Sản phẩm chỉ gồm Tactical TCG, Manga, Chest và legal. PvP ở `/?tab=play&queue=pvp` là phòng thử nghiệm cục bộ, không xếp hạng và không cấp thưởng PvE.

## Dữ liệu

- Migration chạy trước khi tải Tactical UI, giữ raw backup và rollback khi lỗi.
- Catalog canonical nối alias TCG, Chest, Auto Chess và 12 Vị Linh AW2 để bảo toàn dữ liệu cũ.
- `soul-of-meal.tactical-tcg.progress.v1` lưu Tinh Vị, thẻ, nút campaign, Manga và receipt đã nhận.
- Mỗi reward receipt chỉ commit một lần; ghi có journal, readback, rollback và kiểm tra thay đổi từ tab khác.
- Không chuyển power bonus/rating cũ sang PvP.

## Battle

Bàn mỗi bên 4×2, tối đa 5 Vị Linh. Engine reducer thuần, action idempotent, target ưu tiên hàng trước cùng cột, rồi hàng trước gần nhất, hàng sau, cuối cùng commander. Các phase: planning, clash, reaction, ultimate, round-end, result.
