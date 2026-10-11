# Soul of Meal 4.2.0 · Phiêu lưu Vị Linh

Phạm vi phát hành này chỉ dành cho web. Không sync Capacitor, không tạo APK/AAB và không thay đổi workflow Android.

## Nội dung mới

- Route độc lập `/adventure`, được lazy-load khỏi TCG, Auto chess và Rương vị giác.
- Năm vùng liên thông: Phố Đèn Lồng, Bến Sau Mưa, Vườn Lá Thơm, Cầu Triều Lửa và Bàn Trăng.
- Ba Vị Linh khởi hành, 21 loài xuất hiện trong quần thể vùng và năm Người Giữ Ấn.
- Điều khiển bàn phím WASD/phím mũi tên, tương tác bằng E/Enter/Space, D-pad và chọn ô kề bằng chuột.
- Chạm trán theo bước chân; Nhịp Muôi, Hương thức, Giữ mâm, đổi Vị Linh, rút lui và thu phục bằng Hương Ấn.
- Vòng tương khắc năm hệ, kỹ năng theo bản sắc hệ, kinh nghiệm/cấp độ, sinh lực giữ qua các trận và Bếp Nghỉ hồi đội.
- Đội tối đa bốn Vị Linh, Tủ Vị Linh 20 chỗ, chọn người dẫn đội và Sổ Vị Linh.
- Năm nhiệm vụ vùng, vật phẩm tìm trên bản đồ, cổng khóa theo ấn và kết thúc Giao Ước Năm Vị.

## Save và tương thích

`GameSave.adventure` là trường tùy chọn phiên bản 1 trong khóa save hiện có. Save trước 4.2 vẫn parse bình thường; lần đầu mở Phiêu lưu sẽ tạo dữ liệu mới. Xuất/nhập và gói chuyển tiến trình hiện tại tự mang theo phần Phiêu lưu vì không tạo khóa localStorage riêng.

Luật Phiêu lưu dùng reducer thuần và kết quả xác định từ trạng thái/lượt. Hành động không hợp lệ không được commit. Schema giới hạn vùng, tọa độ, đội hình, tủ dự bị, thẻ đơn vị, sinh lực, nhật ký và ID duy nhất.

## Tài nguyên và dung lượng

Không thêm bitmap hoặc audio mới. Chế độ tái sử dụng artwork món ăn, chân dung nhân vật, năm background truyện, bản đồ thế giới và các soundtrack hiện có. Bundle Phiêu lưu được tách riêng khỏi entry chính.

## Kiểm chứng

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm validate:catalog`
- `pnpm validate:assets`
- `pnpm release:verify`
- `pnpm release:size`
- Browser: chọn Vị Linh, bản đồ desktop/mobile, bàn phím và D-pad, tương tác NPC, chạm trán, chuyển chế độ, tải lại save, không có `pageerror`.

Kết quả local: **370/370 test qua**, typecheck app/dev, catalog 123 món và 131 asset đều hợp lệ. Build có **63.640.645 byte / 412 file**, JS gzip **578.955 byte**, CSS gzip **83.968 byte**, không có file rò rỉ; đạt ngân sách 100 MB và trần JS gzip 650 KB.
