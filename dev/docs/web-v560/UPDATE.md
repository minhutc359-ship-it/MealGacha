# Web 5.6 · Làng Giao Ước

Web 5.6 hoàn thiện lớp trình bày cho Adventure mà không thay save schema, kinh tế, đội hình, UID nhân vật hay nội dung chiến đấu đã lưu.

## Màn hình Adventure

- Trang chính trở thành **Làng Giao Ước** toàn màn hình. Người chơi chạm bản đồ hoặc dùng phím mũi tên để dẫn nhân vật cùng hai Vị Linh đi tới bốn địa điểm: Cổng Ký Ức, Kho Sương, Nhà Giao Ước và Đình Đèn.
- Các tab không còn mở trực tiếp từ thanh điều hướng. Chức năng chỉ mở khi nhóm tới địa điểm tương ứng; trong mỗi địa điểm luôn có đường trở về làng.
- Nhân vật chính dùng lại model nhân vật game hiện có; hai Vị Linh lấy từ đội hình hiện tại. Điều khiển có vùng focus, nhãn trợ năng và đường tắt bằng biển địa điểm.

## Chuyển cảnh và vào trận

- Mỗi lần đi tới địa điểm, vào trận, vào dungeon hoặc lên tầng sẽ chọn ngẫu nhiên một trong năm minh họa 960 × 960 WebP.
- Thanh tiến trình là nhóm nhân vật chính + hai Vị Linh đang chạy. Chế độ giảm chuyển động dùng trạng thái tĩnh và thời gian ngắn hơn.
- Trận mới bắt đầu bằng hai đội chạy từ hai phía, sau đó hiện **Sẵn sàng** và **Bắt đầu**. Khi đổi đợt, trận dừng ở đúng biên đợt để hiện **Đợt hoàn tất**, quân địch mới tiến vào rồi mới tiếp tục tick.
- Advance theo ×2 hoặc khi tab vừa hoạt động lại không thể cho đợt mới đánh sau lớp thông báo. Input chiến thuật bị khóa trong nghi thức vào trận.

## Bản đồ TCG 07–12

- Chợ Sống được vẽ lại bằng SVG nguyên bản: sông ngọc, ruộng, cầu, nhà chợ, đèn chỉ đường và lộ trình riêng cho chương 07–12.
- Giữ nguyên thứ tự mở chương và tiến trình đã có. Chương 10–12 vẫn hiển thị `Coming soon`; bản cập nhật này không tự tạo nội dung hoặc phần thưởng mới ngoài phạm vi hình ảnh.

## Tương thích

- Không đổi local-storage key, save schema, battle snapshot hay migration. Trạng thái làng, ảnh chuyển cảnh và timer trình bày chỉ nằm trong React state.
- Save giữa trận cũ vẫn hợp lệ. Khi tải lại, nghi thức vào trận có thể phát lại, nhưng tick, HP, năng lượng, phần thưởng và trạng thái cinematic không bị ghi lại hoặc nhân đôi.
- Chỉ web; không build/sync Android hoặc iOS. Không thêm runtime dependency.

Xem [BUDGET.md](BUDGET.md), [VERIFICATION.md](VERIFICATION.md), [artwork.json](artwork.json) và [browser-qa.json](browser-qa.json).
