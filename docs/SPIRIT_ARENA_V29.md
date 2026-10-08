# MealGacha 2.9 · Vị Linh xuất trận

## Vì sao món ăn chiến đấu?

Trong thế giới hư cấu của game, tâm huyết người nấu và ký ức người cùng ăn lưu thành **Ấn Vị**. Món ăn giữ ấn, chủ tướng dùng hương thơm đánh thức **Vị Linh** trên Bàn Ký Ức. Đòn đánh đẩy lùi Sương Nhạt và bảo vệ ý chí giữ bàn. Vì vậy trên sân có hình Vị Linh và huy hiệu ảnh món ăn, thay vì chỉ một ảnh đĩa thức ăn. Người lữ hành và đầu bếp là đồng minh con người; bí thuật là cách dẫn hương vị thành phép.

Năm linh thú là thiết kế fantasy gốc của MealGacha, không phải lời khẳng định về tín ngưỡng hay các vị thần truyền thống Việt Nam. Bếp lửa, hơi canh, lá thơm, hạt gạo và niềm vui đoàn viên nối chúng với ký ức bếp Việt trong cốt truyện.

| Hệ | Vị Linh | Ký ức được giữ |
| --- | --- | --- |
| Hỏa vị | Hồ Ly Than Hồng | Hơi ấm bếp lửa |
| Hải vị | Long Ngư Hơi Nước | Tiếng gọi bên nồi canh |
| Thanh vị | Linh Lộc Lá Thơm | Lời chăm sóc người thân |
| Gia vị | Sư Tử Hạt Gạo | Lời mời về bữa cơm |
| Ngọt vị | Ngọc Thố Đường Sao | Niềm vui đoàn viên |

## Trình diễn trận

`battleInvocation` đọc `BattleFrame` thực từ reducer; không gọi hành động chiến đấu. Mỗi hành động có lời chỉ huy, ảnh chủ tướng, ảnh bí thuật hoặc Vị Linh và tên lá gốc. Chiêu đơn mục tiêu có điểm xuất phát/đích từ tọa độ sân; Vị Linh lao theo đường đó và hiệu ứng va chạm xuất hiện sau lúc phát động. Các số máu/chắn, phản đòn, tử trận và phần thưởng vẫn chỉ do reducer/store áp dụng một lần.

Một đòn thường dài khoảng 1 giây. Nút bỏ qua trình diễn, khóa thao tác trong replay, cắt cảnh giữa trận, tactic lượt 4, combo và giảm chuyển động giữ hành vi sẵn có. Không đổi luật AI hoặc chỉ số thẻ. Tướng địch dùng đúng chân dung đối thủ. Tướng người chơi dùng tư thế mới gọi đội hình, không chỉ chân dung tĩnh trong vòng tròn.

Ảnh Vị Linh luôn hiện cả khi giảm chuyển động. Hướng dẫn trong luật và cửa sổ xem lá giải thích Ấn Vị; lore của 112 món cũng nhắc nguyên nhân triệu hồi. Thẻ món vẫn dùng ảnh thực trong thư viện, deck và Rương.

## Asset

**Chế độ: built-in imagegen.** 41 lần tạo riêng cho 41 asset gốc; không dùng ảnh ghép để thay nhiều lá. Prompt, loại asset và đường dẫn cuối nằm trong `spirit-arena-prompts.json`.

| Nhóm | Đường dẫn cuối | Số lượng |
| --- | --- | --- |
| Bí thuật và lữ hành | `public/assets/tcg/cards/{card-id}.webp` | 35 |
| Vị Linh alpha | `public/assets/tcg/spirits/{ember,tide,grove,hearth,sugar}.webp` | 5 |
| Tướng ra lệnh alpha | `public/assets/tcg/characters/anime/hero-command.webp` | 1 |
| Đầu bếp dùng chân dung hiện có | `public/assets/tcg/characters/anime/{nhien,moc,lien,bach,hai}.webp` | 5 đã có |

Tranh thẻ tối đa 512×768; cutout tối đa 480×720. Chỉ đổi kích thước/định dạng sang WebP, giữ alpha trên cả sáu cutout. 41 file mới tổng cộng **4,425,142 byte**; tải ảnh lá khi cần, nạp trước Vị Linh/tướng khi vào trận. Đây là tranh/render 2D phong cách anime RPG, không phải mô hình 3D runtime.

## Bố cục ngoài deck

- Công tắc chế độ nằm trên thanh đầu của cả hai app, có nhãn bàn phím và không xóa bản lưu.
- Thám hiểm hiện chặng hiện tại. Bản đồ đầy đủ, di vật, deck, thống kê và nhật ký xem trong cửa sổ riêng. Chọn từ bản đồ vẫn chỉ cho chọn chặng hợp lệ và đóng bản đồ trước trận.
- Thưởng chọn di vật rồi chọn thẻ, giữ thao tác thay một lá và giới hạn deck 18 lá. Chặng không cho di vật đi thẳng tới thẻ.
- Nhiệm vụ có 1–3 hàng tùy chiều cao và nút trang; mọi nút nhận thưởng còn truy cập được. Điểm danh có nút gọn khi xoay ngang.
- Cửa hàng hiện một gói; thương nhân tách thành cửa sổ. Cài đặt có tab cố định, nội dung chuyển mã/file cuộn trong vùng làm việc khi dài.
- Rương dùng chiều cao còn lại sau thanh đầu/điều hướng. Bộ sưu tập, thành tựu và cài đặt Rương cuộn trong vùng nội dung; thanh chuyển TCG luôn hiện.

## Kiểm chứng

TypeScript, production build, catalog 112 món/35 tag/9 sự kiện và 136 test đạt. Test mới kiểm tra file ảnh của toàn bộ 152 lá, phân biệt món ăn/đồng minh, truy xuất tướng đã bị phản đòn hạ từ snapshot trước và bảo đảm trình diễn không sửa snapshot.

Kiểm tra production trong Chromium trên 11 kích thước: 1440×900, 1366×768, 1280×720, 1024×768, 768×1024, 390×844, 375×667, 360×640, 320×568, 844×390 và 667×375. Sảnh, chiến dịch, thư viện/xưởng/deck, trận có 8 lá trên tay, màn Rương và các màn phụ đã kiểm tra khung nhìn. Cửa hàng ngang được sửa để nút mở gói vẫn hiện; chọn thưởng sau khi chọn thẻ chuyển sang khung xác nhận gọn, có nút đổi lựa chọn.

Các luồng thực đã đạt: chuyển hai chiều giữ nguyên bản lưu TCG; điểm danh/mở rương trừ đúng một chìa và thêm một món; thương nhân; trang nhiệm vụ; bản đồ bảy chặng; nhật ký/deck hành trình; lựa chọn sự kiện; chọn di vật rồi thay thẻ giữ 18 lá; chỉ huy/tấn công/niệm phép/triệu hồi từ reducer thật; giảm chuyển động; focus và Escape không lọt ra sau trận. Không có lỗi JavaScript trong các lượt kiểm tra. Canvas hiệu ứng Rương giới hạn 30 FPS và không khởi tạo khi người chơi bật giảm chuyển động.

Chỉ phần đọc dài, danh sách trong cửa sổ và nhóm cài đặt có cuộn nội bộ khi cần; trang chính và trận giữ trong khung màn hình. Kiểm chứng này dùng bản build local; trạng thái preview Vercel được kiểm tra riêng trên commit GitHub.
