# Soul of Meal 4.3 · Adventure World

Cập nhật chỉ dành cho web. Không sync Capacitor, không sửa Android/iOS, không tạo APK/AAB. Bản 4.2 là nền tảng; bản này chuyển Phiêu lưu từ lưới nhỏ sang một thế giới top-down có nhà, NPC và chiến đấu nhiều đối thủ. Đây là thiết kế 2D gốc của Soul of Meal, lấy cảm hứng từ vòng lặp khám phá–thu phục–rèn đội của RPG cổ điển; không dùng bản đồ, nhân vật, âm thanh hay sprite Pokémon.

## Thế giới và asset

- 5 vùng ngoài trời 24×18 ô; 15 nhà có nội thất 12×10 ô. Mỗi vùng có Bếp Nghỉ, Tiệm Hương, Nhà Ký Ức.
- 35 NPC đặt trên bản đồ: 5 hướng dẫn, 5 Lả, 5 cư dân, 5 Người Giữ Ấn, 5 người hồi phục, 5 chủ tiệm, 5 người giao nhiệm vụ.
- 10 mô hình nhân vật gốc, 4 hướng × 2 frame; 8 symbol cây/cỏ/nhà/túi/tủ/biển. Các sprite nằm trong SVG có thể tái tạo bằng `node dev/tools/build-adventure-assets.mjs`.
- Mô hình Vị Linh bằng SVG: nhóm bát/bánh/cuốn/cơm, màu và chi tiết theo loài/hệ. Artwork và soundtrack vùng/trận/boss tái sử dụng từ game hiện tại.
- Camera theo người chơi, va chạm, cửa vào/ra nhà, mini-map, click để tìm đường BFS, WASD/mũi tên giữ để đi, Shift để chạy, E để tương tác.
- Vị Linh dẫn đội đi theo ô trước đó; có lời nhắn khi tương tác.

## Lối chơi

- Đội 1–6 Vị Linh, tủ 60 chỗ; chỉ gửi/nhận dự bị tại tủ trong Bếp Nghỉ.
- Bếp Nghỉ hồi HP, PP và trạng thái; Canh Ấm hồi 30 HP/gỡ trạng thái, Lá Tỉnh hồi sinh 50% HP. Không hồi miễn phí từ bất kỳ vị trí nào.
- Tiệm Hương bán Hương Ấn (18 xu), Canh Ấm (12 xu), Lá Tỉnh (35 xu). Vật phẩm trong trận dùng một lượt.
- 16 kỹ năng: Nhịp Muôi thường và 3 kỹ năng mỗi hệ. Học kỹ năng ở cấp 1/8/14; PP 30/18/10/5 tùy kỹ năng. Hết PP có Cố Sức kèm mất HP.
- Chu kỳ Hỏa → Thanh → Hải → Gia → Ngọt → Hỏa: lợi thế ×1,5, chiều ngược ×0,67, còn lại ×1. Bảng 5×5 có trong UI.
- Tốc độ quyết định thứ tự đánh; Bỏng hương, Ướt lạnh, Bám rễ, Mơ màng có thời hạn. NPC dùng kỹ năng và PP theo cùng luật.
- 5 trận Lả và 5 trận giữ ấn, mỗi trận 2 Vị Linh nối tiếp. Đánh bại một Vị Linh cấp kinh nghiệm cho thành viên đã tham gia; thắng toàn trận nhận xu. Không nhận thưởng lặp.
- 5 túi quà và 5 nhiệm vụ Nhà Ký Ức; mở vùng theo ấn, đi nhanh tới vùng đã đến. Kết thúc Giao Ước Năm Vị khi thắng vùng thứ 5.

## Save và kiểm chứng

Save Adventure v2 có bản đồ nội thất, PP, trạng thái, túi đồ, xu, đội NPC và địa điểm đã tới. Save v1 tự chuyển sang điểm xuất phát ở bản đồ mới, giữ đội/cấp/HP/ấn/vật phẩm đã nhận và cuộc đấu đang diễn ra. Save chưa có Adventure vẫn đọc được. Import sai thẻ, PP, tọa độ hoặc bản đồ bị từ chối.

- `pnpm typecheck` và `pnpm typecheck:dev`.
- 378 kiểm thử qua: kết nối toàn bộ ô đi được của 20 bản đồ, cửa nhà/dịch vụ, phần thưởng một lần, PP/trạng thái/vật phẩm, tương khắc, thu phục/dự bị, chuyển v1, schema và chiến dịch 5 vùng với 3 lựa chọn khởi hành. Fixture chiến dịch dùng đội đã lên cấp để kiểm tra tiến trình, không kết luận cân bằng độ khó.
- Kiểm tra giao diện tương tác thực tế chưa hoàn thành: công cụ CUA không kết nối được browser service (`http://gaas-browser:8000/mcp`). Không đánh dấu browser QA là đạt.
- Giữ ngân sách web 100.000.000 byte, tổng JS gzip 650.000 byte. Kết quả build và release-size cập nhật bên dưới sau kiểm tra.

## Giới hạn hiện tại

Nhân vật dùng hoạt ảnh đi bộ hai frame mỗi hướng; mô hình Vị Linh là vector 2D. Chưa có mô hình 3D, chu kỳ ngày/đêm, tiến hóa, multiplayer hoặc toàn bộ quy mô hệ thống của một game thương mại như SoulSilver. Nội dung hiện tại là chiến dịch 5 vùng có thể chơi, tiếp tục mở rộng trên cấu trúc map/skill/NPC dữ liệu.

Kết quả release: **63.745.281 byte / 413 file**, tổng JS gzip **588.922 byte**, CSS gzip **84.313 byte**, không rò rỉ file; 328 asset đã đăng ký nguồn gốc. Build đạt giới hạn 100 MB và JS gzip 650 KB.
