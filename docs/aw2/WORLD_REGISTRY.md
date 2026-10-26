# Map registry và bản đồ hành trình

Triển khai AW2-016A + AW2-008B, nền `2caa108`. Mở `/dev/aw2/game.html` → **Thêm → Bản đồ hành trình**. Chọn một trong sáu vùng, xem **Đường đi** hoặc từng **Cửa nối**. `●` là vị trí hiện tại; `★` là vùng của mục tiêu nhiệm vụ. Không có lịch sử “đã ghé” giả lập.

**Đi tới cửa kế tiếp** chỉ đi bộ tới gần cửa trong vùng hiện tại. Khi tới nơi, người chơi tự **E / Tương tác → Đi qua**. Cửa khóa, tuyến chưa mở, tài nguyên chưa sẵn sàng hoặc lỗi lưu đều khóa thao tác đi. Mở/đóng bản đồ, phân trang và chọn vùng không ghi save. Vùng đang xem được giữ qua lượt TCG/Chess trong cùng phiên.

`src/aw2/world/registry.ts` chiếu dữ liệu từ `ZONES`; không thay thế rules hoặc save schema. Registry v1 gồm một region kỹ thuật `aw2-region-lantern-arc` (nhóm UI của arc hiện hành), sáu map với bounds/walls, entity, portal, safe spawn. Map/entity/portal giữ ID gốc; spawn ID là metadata, không phải save ID mới. Tám NPC bao gồm ba người kể ký ức và hai chủ bàn. Mọi cổng hiện tại vẫn kích hoạt bằng tương tác rõ ràng.

Validator kiểm tra dữ liệu hữu hạn, namespace, ID duy nhất, vùng tồn tại, spawn an toàn, liên kết hai chiều và spawn không mồ côi. Mỗi lần lấy registry có dữ liệu tách rời; sửa snapshot không đổi `ZONES`. Quyền mở cổng luôn đọc `describeObject`; tìm tuyến dùng cùng `journeyRoute` với chỉ đường nhiệm vụ. Sân→Kho theo nhận nhiệm vụ bếp, Kho/Lửa→Bàn theo puzzle, hai lối tắt theo kết thúc thực.

## Hợp đồng chuyển cảnh kế tiếp — chưa triển khai

1. Chuẩn bị: kiểm tra quyền bằng rules và tạo yêu cầu chuyển cảnh gắn với raw save hiện tại; chặn yêu cầu lặp.
2. Tải trước đúng destination, giữ lease/camera/cảnh nguồn; chưa thay tọa độ hoặc ghi save. NPC/điều khiển tạm dừng.
3. Kiểm tra spawn trên dữ liệu destination và trạng thái nhiệm vụ mới nhất. Asset bắt buộc lỗi phải hiện lỗi/thử lại; giữ cảnh nguồn và exact raw save.
4. Chỉ sau readiness mới commit giao dịch bằng Web Locks/expected raw; tab cũ không được ghi đè. Ghi lỗi giữ cảnh nguồn và tài nguyên đã chuẩn bị để thử lại hoặc hủy.
5. Commit thành công mới swap scene/camera, đặt vị trí an toàn, trả focus/điều khiển và giải phóng lease nguồn. Cooldown chỉ ngăn kích hoạt lại; không đổi gate nhiệm vụ.

Đây là hợp đồng cho task chuyển cảnh/nội thất sau này. Runtime hiện hành vẫn ghi điểm đến qua thao tác **Đi qua**, rồi tải cảnh theo cơ chế cũ. Không tuyên bố đã có rollback/preload/nhà/hội quán mới. Patrol016B cần cùng vị trí sống cho hình vẽ, proximity, label và chỉ đường, kèm sprite bốn hướng thật; không dịch sprite khỏi điểm tương tác tĩnh.
