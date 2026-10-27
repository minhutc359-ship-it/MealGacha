# Map registry và bản đồ hành trình

016B adds one transient live-position provider for Em Đem Nước through `worldObjects`/`npcPatrolView`. Registry coordinates remain canonical story anchors. Renderer/proximity/labels/native destinations/quest guidance receive one controller snapshot; the existing memory write is available only at its immediate story anchor. No portal/spawn/blocker/save contract changes. [Patrol contract and limits](NPC_PATROL.md).

Triển khai AW2-016A + AW2-008B, nền `2caa108`. Mở `/dev/aw2/game.html` → **Thêm → Bản đồ hành trình**. Chọn một trong sáu vùng, xem **Đường đi** hoặc từng **Cửa nối**. `●` là vị trí hiện tại; `★` là vùng của mục tiêu nhiệm vụ. Không có lịch sử “đã ghé” giả lập.

**Đi tới cửa kế tiếp** chỉ đi bộ tới gần cửa trong vùng hiện tại. Khi tới nơi, người chơi tự **E / Tương tác → Đi qua**. Cửa khóa, tuyến chưa mở, tài nguyên chưa sẵn sàng hoặc lỗi lưu đều khóa thao tác đi. Mở/đóng bản đồ, phân trang và chọn vùng không ghi save. Vùng đang xem được giữ qua lượt TCG/Chess trong cùng phiên.

`src/aw2/world/registry.ts` chiếu dữ liệu từ `ZONES`; không thay thế rules hoặc save schema. Registry v1 gồm một region kỹ thuật `aw2-region-lantern-arc` (nhóm UI của arc hiện hành), sáu map với bounds/walls, entity, portal, safe spawn. Map/entity/portal giữ ID gốc; spawn ID là metadata, không phải save ID mới. Tám NPC bao gồm ba người kể ký ức và hai chủ bàn. Mọi cổng hiện tại vẫn kích hoạt bằng tương tác rõ ràng.

Validator kiểm tra dữ liệu hữu hạn, namespace, ID duy nhất, vùng tồn tại, spawn an toàn, liên kết hai chiều và spawn không mồ côi. Mỗi lần lấy registry có dữ liệu tách rời; sửa snapshot không đổi `ZONES`. Quyền mở cổng luôn đọc `describeObject`; tìm tuyến dùng cùng `journeyRoute` với chỉ đường nhiệm vụ. Sân→Kho theo nhận nhiệm vụ bếp, Kho/Lửa→Bàn theo puzzle, hai lối tắt theo kết thúc thực.

## Hợp đồng chuyển cảnh — trạng thái sau016D

1. Kiểm tra quyền/proximity/spawn bằng rules hiện hành và chụp source/raw trước await; chặn thao tác lặp.
2. Tải đúng ảnh đích, giữ nguồn/camera và lease; NPC/điều khiển tạm dừng, chưa ghi save.
3. Dựng một renderer đích trong slot ẩn/inert, tạo sprite/camera và vẽ khung đầu thật. Lỗi/cancel/timeout/unmount giải phóng candidate, giữ nguồn. Không dùng readiness chỉ từ ảnh hoặc chỉ từ app.init.
4. Chạy lại guard đồng bộ của chính renderer đích bên trong Web Lock, sau rules/expected-raw validation, trước durable setItem. Readiness mất khi chờ khóa hoặc lỗi ghi đều không đổi vị trí đã lưu. Thử lại dựng candidate mới.
5. Commit thành công mới promote cùng canvas/renderer đã chuẩn bị, trả focus/điều khiển và hủy cảnh nguồn. Không tạo renderer đích lần thứ hai sau commit.

016D hoàn tất preflight renderer/first-frame và vòng đời trước commit. Source/candidate tối đa hai slot; candidate không có world input, cập nhật luật hoặc quyền ghi. Ambient preload lease chuyển sang lease của renderer; async về muộn có cleanup. Ticker bắt lỗi vẽ/context loss. Lỗi GPU sau durable commit dùng lỗi bản đồ/Đọc lại, không có compensating rollback save. Chưa thêm phòng/nhà/hội quán mới hoặc sửa registry/save/canon. [Hướng dẫn/giới hạn](CHUYEN_VUNG.md), [task](tasks/AW2-016D.md). Patrol016B tiếp tục dùng cùng snapshot vị trí cho sprite/proximity/labels/điểm đến/chỉ đường.
