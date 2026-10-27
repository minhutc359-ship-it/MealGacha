# Chuyển vùng an toàn — AW2-016C

Đi tới gần cửa và chọn **E / Tương tác → Đi qua** như trước. Game chuẩn bị ảnh của cảnh đích trước khi ghi vị trí. Trong lúc này bản đồ hiện tại vẫn giữ nguyên, nhân vật/NPC tạm dừng; hộp thoại hiện số ảnh đã tải và nút **Hủy chuyển vùng**. Escape cũng hủy khi đang chuẩn bị. Nếu tải quá30giây, game dừng lượt chuẩn bị để bạn thử lại.

Nếu ảnh chưa tải được hoặc chưa ghi được save, bạn ở lại cảnh cũ. Chọn **Thử lại chuyển vùng** hoặc **Để sau / Đóng**. Hủy/tải lỗi không tự nhận thưởng, qua cửa hoặc thay vị trí đã lưu. Khi đã chuyển sang **Đang ghi điểm đến…**, nút hủy bị khóa để giao dịch lưu hoàn tất một lần.

Nếu một tab khác đã lưu trước, lượt cũ bị từ chối. Đóng hộp thoại, chọn **Thêm → Đọc lại** để lấy tiến trình mới; không ghi đè tab còn lại. `/game.html` và `/world.html` dùng chung luồng và save hiện hành.

## Phạm vi kỹ thuật

`worldAssetUrls` liệt kê texture đúng vùng, gồm một đại diện đầu đội, NPC (atlas tuần tra thay idle của Em Đem Nước), kiến trúc, ambient, cảnh và props tương ứng. Số URL duy nhất theo Làng/Phố/Sân/Kho/Lửa/Bàn là9/14/11/4/5/6. Không tải ảnh portrait/battle/PNG/audio hoặc các vùng tương lai. Pixi dùng cache hiện hành; lease ambient chuẩn bị giữ tới khi renderer đích ready, có cleanup khi lỗi/hủy/unmount và khi lease về muộn. Texture không phải ambient giữ chính sách cache cũ, không tuyên bố giới hạn tổngGPUmemory.

Controller chụp source/raw trước await, dùng rules hiện hành để kiểm tra cửa/spawn và store.act hiện hành để commit bằng Web Locks/expected raw. Không đổi schema5, quyền nhận thưởng, tọa độ map hoặc lớp lưu. Native progress/cancel dùng cùng modal và viewport hiện tại.

**Giới hạn:** bảo vệ source khi tải ảnh hoặc ghi lỗi trước commit đã triển khai. Khởi tạoGPU/renderer lỗi sau khi save đã commit vẫn hiện lỗi bản đồ và cho Đọc lại như trước; chưa có rollback bù dữ liệu về checkpoint cũ. Preflight renderer đầy đủ là bước kế tiếp. Chưa thêm nội thất/lore/quest, chưa nghiệm thu điện thoại thật/người chơi độc lập hay phát hành. [Task](tasks/AW2-016C.md) · [Bằng chứng](evidence/AW2-016C.md).
