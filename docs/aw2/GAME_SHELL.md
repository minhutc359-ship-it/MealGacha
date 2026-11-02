# UI khám phá một màn hình — bản đầu v1.1

Chạy `pnpm dev`, mở **`http://localhost:8443/dev/aw2/game.html`**. Cùng bản lưu AW2 với `/dev/aw2/world.html`; không tạo namespace thứ hai hoặc reset save. Bản mới đang opt-in trong lúc chuyển giao diện; entryworld cũ giữ công cụ chơi thử/phản hồi đầy đủ.

- **Nhiệm vụ / J:** xem bốn nhiệm vụ thật, Mục tiêu/Chỉ đường/Phần thưởng, Trước/Sau, ghim mục tiêu hiện tại. Các nhóm chưa có dữ liệu không hiển thị. Phần thưởng vẫn do hành động NPC/quest ghi một lần; mở menu không nhận quà.
- **Chỉ đường:** đi tới gần NPC/đồ vật/cửa trong vùng. Tới nơi dùng E/Tương tác, tự chọn Đi qua hoặc hành động. Ba ký ức có phân trang chọn thứ tự tự do.
- **Đội:** chọn từng slot trong năm slot bằng Trước/Sau, chọn người đã sở hữu rồi Lưu đội hình; chọn người ở slot khác sẽ hoán đổi. Đóng/Hủy không lưu draft. Bộ sưu tập có phân trang và lời mời theo gate thật.
- **Túi / Bếp:** nguyên liệu thật, nấu/chia chỉ khi đã mở bếp và đứng gần bếp/Dì. Không có shop/gacha giả.
- **Thêm:** địa điểm hiện tại, Lưu vị trí, Đọc lại, ghé bàn, hướng dẫn/thông báo. Battle/TCG/Chess vẫn dùng cảnh hiện có; phần đưa các cảnh này vào khung cố định là015B, chưa hoàn tất.

Menu chỉ có một bảng chặn; Escape/đóng trả focus, Tab ở trong bảng. Khi mở bảng, nhân vật/người/vật chuyển động tạm dừng và bản đồ giữ nguyên canvas. Đóng bảng không tiếp tục phím đi đang giữ. Map dùng cùng tỷ lệ/camera/asset; góc bám phủ khung bằng scale đồng nhất, Toàn cảnh vừa toàn hình. Đi bộ chưa ghi vị trí cho tới khi tự lưu/hành động ghi tiến trình.

Khung khám phá/menu đã kiểm tra Chromium desktop giả lập320×568/390×844/844×390/1280×720và chữ20px; không phải kết quả iPhone/người chơi thật. Toàn bộ UIv1.1, hardwareBack/gamepad/100questthật/ba nhiệm vụ đồng thời, battle/modes/performance/rights còn các gate riêng.

[Bản thiết kế gốc](design/world-v1.1/SOUL_OF_MEAL_AW2_MAP_NPC_WORLD_SPEC_v1.1.md) · [Ma trận tích hợp](WORLD_V1_1_INTEGRATION.md) · [Bằng chứng](evidence/AW2-015A.md).
