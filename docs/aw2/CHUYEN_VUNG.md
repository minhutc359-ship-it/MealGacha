# Chuyển vùng an toàn — AW2-016D

Đi tới gần cửa, chọn **E / Tương tác → Đi qua**. Game tải ảnh rồi mở thử bản đồ đích trước khi ghi vị trí. Trong lúc chuẩn bị, cảnh hiện tại và góc nhìn vẫn giữ nguyên, nhân vật/NPC tạm dừng. Hộp thoại hiện tiến độ và **Hủy chuyển vùng**; Escape cũng hủy. Mỗi giai đoạn tải ảnh và khởi tạo renderer có thời hạn30giây riêng.

Nếu ảnh, khởi tạo đồ họa, khung hình đầu hoặc ghi save bị lỗi, bạn ở lại cảnh nguồn. Chọn **Thử lại chuyển vùng** hoặc **Để sau / Đóng**. Thử lại tạo một cảnh đích mới; hủy/lỗi trước khi ghi không tự qua cửa hay thay vị trí đã lưu. Khi hiện **Đang ghi điểm đến…**, hủy bị khóa để giao dịch hoàn tất một lần.

Nếu tab khác đã lưu, lượt cũ bị từ chối. Đóng hộp thoại và chọn **Thêm → Đọc lại** để lấy tiến trình mới. Nếu kết nối đồ họa mất sau khi đã chuyển thành công, bản đồ hiện lỗi và bạn dùng **Đọc lại**; điểm đến đã lưu vẫn được giữ. `/game.html` và `/world.html` dùng cùng luồng và save hiện hành.

## Cách thực hiện

`worldAssetUrls` giữ kế hoạch ảnh đúng vùng từ016C: Làng/Phố/Sân/Kho/Lửa/Bàn lần lượt9/14/11/4/5/6URL duy nhất, gồm một đại diện đầu đội, NPC, kiến trúc, ambient, cảnh và props. Không thêm media/dependency hoặc tải portrait/battle/audio/vùng tương lai. Lease tải trước được trả khi renderer đích đã có lease riêng và vẽ thành công.

`WorldSceneHost` giữ tối đa một cảnh nguồn và một cảnh đích ẩn. Cảnh đích `inert`/`aria-hidden`/không nhận điều khiển, dựng đủ sprite/camera rồi thực sự vẽ khung đầu bằng WebGL. Sau đó `ScenePreflight.assertReady` kiểm tra lại ngay trong Web Lock trước `setItem`. Rules/proximity/expected-raw/schema5/receipts vẫn là nguồn thẩm quyền. Lỗi hoặc unmount trong khi chờ khóa không ghi vị trí mới.

Sau commit, React đổi vai trò của cùng keyed slot: canvas/renderer/khung đầu đã kiểm tra được đưa ra hiển thị, không khởi tạo lại renderer đích. Lúc này mới hủy cảnh nguồn. Cleanup dừng ticker/listener, hủy cropped textures không hủy nguồn dùng chung và trả ambient lease; tài nguyên async về muộn vẫn được giải phóng. Ticker kiểm tra mất context và bắt lỗi vẽ cả trước và sau chuyển cảnh.

**Giới hạn:** kiểm tra được lỗi đã quan sát trước durable write, không bảo đảm GPU sẽ luôn hoạt động sau đó và không tự rollback bù một save đã ghi. Hai context có thể tồn tại trong lúc chuẩn bị; chưa đo tổngGPUmemory/FPS hay nghiệm thu điện thoại thật. Chưa thêm nội thất/lore/quest mới. [Task](tasks/AW2-016D.md) · [Bằng chứng](evidence/AW2-016D.md).
