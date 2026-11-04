# Backlog

## P0 trước merge/deploy

- Review trực quan desktop/mobile và thử input touch trên thiết bị thật.
- Chơi xuyên 8 node, kiểm tra mở khóa Manga và nhận reward sau reload/tab cạnh tranh.
- Xác nhận Vercel preview dùng đúng SHA của nhánh `game/tactical-tcg`.

## Đã khôi phục trong TCG-005

- Bộ sưu tập 181 lá, inspect/filter/craft, editor và trang bị bộ 24 lá.
- Gói TCG 5 lá, odds/pity, duplicate Tinh Vị, quà ngày và giữ kết quả mở qua reload.
- Tay bài/rút bài/Lửa Bếp/triệu hồi/phép/bẫy/nội tại/recipe/nâng sao với AI chơi bài.
- Checkpoint trận, import bổ sung dữ liệu cũ, cốt truyện trước/sau và hai ending.

## Tiếp theo

- TCG-006 đã thêm: tiếp tục trận từ sảnh, xác nhận thay trận, bảo vệ tab cũ, import/preview/undo, trạng thái quà/thưởng và sửa mở gói/tạo bộ ở môi trường thiếu randomUUID. Kiểm tra browser phần cuối đang tiếp tục; không coi là nghiệm thu thiết bị thật.

- Tạo VFX/âm thanh riêng cho từng bẫy và từng boss; cần duyệt cảm quan độc lập.
- Đo cold-load, FPS, memory và thao tác touch trên thiết bị thật trước merge.
- Thiết kế thêm đội hình/bẫy riêng cho từng node sau khi có dữ liệu playtest cân bằng.
- Hoàn tất nghiệm thu độc lập luồng backup/restore và touch trên thiết bị thật (UI preview/confirm/rollback/undo đã được triển khai).
- Online PvP authoritative và reconnect thật, mastery/side story mở rộng; không mô tả phòng AI cục bộ là multiplayer.
