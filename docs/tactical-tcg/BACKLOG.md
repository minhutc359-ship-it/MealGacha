# Backlog

## P0 trước merge/deploy

- TCG-007 đã kiểm tra bố cục bàn ở 320×568, 390×844, 844×390, 1280×720, 1360×900 bằng iframe viewport trên Chrome thật; cả 16 ô/tay bài/thanh thao tác nằm trong khung. Điện thoại/touch thật vẫn cần nghiệm thu.

- Review trực quan desktop/mobile và thử input touch trên thiết bị thật.
- Chơi xuyên 8 node, kiểm tra mở khóa Manga và nhận reward sau reload/tab cạnh tranh.
- Xác nhận Vercel preview dùng đúng SHA của nhánh `game/tactical-tcg`.

## Đã khôi phục trong TCG-005

- Bộ sưu tập 181 lá, inspect/filter/craft, editor và trang bị bộ 24 lá.
- Gói TCG 5 lá, odds/pity, duplicate Tinh Vị, quà ngày và giữ kết quả mở qua reload.
- Tay bài/rút bài/Lửa Bếp/triệu hồi/phép/bẫy/nội tại/recipe/nâng sao với AI chơi bài.
- Checkpoint trận, import bổ sung dữ liệu cũ, cốt truyện trước/sau và hai ending.

## Tiếp theo

- TCG-008 đã nối77 atlas đã render và chân dung riêng cho139 unit, renderer/pose/VFX/combo của TCG cũ vào production Tactical.62 unit chưa có atlas nhiều động tác: cần sản xuất/duyệt riêng, không gọi portrait-only là hoàn thiện animation. Cần đo hiệu năng tải/model trên thiết bị thật.

- TCG-007 đã thay bàn chiến đấu sản phẩm bằng layout toàn màn hình; thẻ đọc lớn, hướng dẫn theo phase, trình diễn đòn đánh và 3 bộ nhập môn + 2 công thức. Cần human balance/playtest cho cả 5 archetype trước nghiệm thu sản phẩm.

- TCG-006 đã thêm: tiếp tục trận từ sảnh, xác nhận thay trận, bảo vệ tab cũ, import/preview/undo, trạng thái quà/thưởng và sửa mở gói/tạo bộ ở môi trường thiếu randomUUID. Kiểm tra browser phần cuối đang tiếp tục; không coi là nghiệm thu thiết bị thật.

- Tạo VFX/âm thanh riêng cho từng bẫy và từng boss; cần duyệt cảm quan độc lập.
- Đo cold-load, FPS, memory và thao tác touch trên thiết bị thật trước merge.
- Thiết kế thêm đội hình/bẫy riêng cho từng node sau khi có dữ liệu playtest cân bằng.
- Hoàn tất nghiệm thu độc lập luồng backup/restore và touch trên thiết bị thật (UI preview/confirm/rollback/undo đã được triển khai).
- Online PvP authoritative và reconnect thật, mastery/side story mở rộng; không mô tả phòng AI cục bộ là multiplayer.
