# Em Đem Nước tuần tra — AW2-016B

Mở `/dev/aw2/game.html`, hoàn tất nhập môn ở Bà Giữ Chỗ rồi đi qua cửa đông tới Phố Đèn Lồng. Trước khi nhận nhiệm vụ của An Vá Đèn, Em Đem Nước đi một vòng nhỏ gần vị trí cũ. **Thêm → Địa điểm → Em Đem Nước → Đi tới địa điểm** sẽ đưa nhân vật tới gần vị trí hiện tại; sau đó tự nhấn E / Tương tác. Entry `/world.html` dùng cùng tiến trình và có nút điểm đến tương ứng.

NPC dừng và quay mặt về người chơi khi đến gần hoặc mở hội thoại. Khi cần ghi ký ức trong nhiệm vụ Ba mẩu ký ức, em luôn ở điểm nhiệm vụ cũ ngay lập tức. Không cần chờ đến giờ hay đợi tuần tra quay lại. Menu, ghi dữ liệu, lỗi tải/lưu, tab mất focus và tùy chọn giảm chuyển động đều dừng tuần tra. Giảm chuyển động vẫn cho phép đi tới và tương tác bình thường.

Đây là tuần tra cục bộ cho **một NPC hiện có**. Không ghi đồng hồ, vị trí NPC hoặc phần thưởng vào save. Đọc lại/đổi vùng bắt đầu lại vòng tuần tra; tiến trình nhiệm vụ và quyền nhận thưởng vẫn do store hiện hành xác minh. Một nhân vật đại diện trên map và năm người trong combat giữ theo D17.

## Hợp đồng kỹ thuật

| Thuộc tính | Giá trị |
|---|---|
| Entity / vùng | `aw2-npc-dem-nuoc` / `aw2-zone-lantern-street` |
| Tuyến | `(504,128) → (544,128) → (544,160) → (504,160) → điểm đầu` |
| Tốc độ / nghỉ góc | 26 px/s / 650 ms |
| Nguồn vị trí | `src/aw2/world/npcPatrol.ts`, snapshot do controller sở hữu |
| Các nơi đọc cùng snapshot | Sprite/feet/depth, nhãn, nearestObject, điểm đến native, Địa điểm, chỉ đường |
| Hình | 16 tư thế nguyên bản: bốn hướng × idle và ba bước đi |
| Save / thao tác ghi | Giữ schema5, entity/quest/receipt IDs và xác minh điểm nhiệm vụ cũ |

Ảnh PNG được tạo bằng built-in image_gen ngày 26/10/2026 từ hình Em Đem Nước của dự án. Sau sự cố mất workspace tạm, nguyên bản được khôi phục từ Git blob `dd01e53149a725c29c4867df626b49786b5d6fa2`; SHA256 trùng dữ liệu trước sự cố. WebP được dựng lại với RGBA giống nguyên bản. `prompts.json` ghi **brief khôi phục**, không tự nhận là prompt nguyên văn đã mất. Provenance/rights tiếp tục `REVIEW_REQUIRED / NOT_CLEARED`; `fullNpcComplete=false`.

Các atlas idle cũ được giữ để tham chiếu; chỉ atlas tuần tra mới được tải cho NPC này ở Phố. Chưa mở rộng lịch sinh hoạt cho bảy NPC còn lại, đồng hồ trong game, phòng/nhà mới hoặc follower. Xem [task](tasks/AW2-016B.md) và [bằng chứng](evidence/AW2-016B.md).
