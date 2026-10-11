# Web 4.3.2 · Giới thiệu trên màn chơi thật

Sửa bản 4.3.1: nút Giới thiệu trong header làm hàng chuyển chế độ cao lên, chồng nội dung ở màn web hẹp. Demo cũ còn dựng một sân khấu riêng, khác với màn chơi mà người chơi cần làm quen.

## Nút Giới thiệu

- TCG: **Thêm → Hướng dẫn chơi → Giới thiệu** (hoặc nút Hướng dẫn ở sidebar).
- Auto chess: **? Hướng dẫn → Giới thiệu**.
- Phiêu lưu: **Hướng dẫn chơi** ở trang chọn đồng hành; đã khởi hành thì mở **Hành trình & bản đồ → Hướng dẫn chơi**.
- Rương: mở **Hướng dẫn chơi** dưới phần thông tin catalog.

Gỡ nút khỏi `ModeSwitch` và gỡ CSS thay header thành hàng grid/tăng chiều cao. Thanh chuyển chế độ trở lại layout trước 4.3.1.

## Màn chơi dùng chung

Không duy trì sân khấu TCG/Auto/Adventure/Chest riêng. Trình chiếu fullscreen chỉ thêm thanh chú thích/đồng hồ/tạm dừng/xem lại/đóng; màn chơi dùng component hiện tại:

- `BattleBoardView`: cùng arena, hand, field, UnitTile, GameCardView, CombatEffects, BattleInvocation, chủ tướng, HP/năng lượng và ribbon boss với trận TCG thật. `BattleBoard` là wrapper nối save/actions cho game; demo truyền snapshot và handler từ chối vào view. View không gọi trực tiếp `useGameStore`. Demo không mở dialog thưởng/cốt truyện làm chặn timeline.
- `AutoBoard`, `AutoTraits`, `AutoPreparation`, `AutoVictory`: bàn cờ Canvas, atlas, di chuyển, kỹ năng, star-up, shop/dự bị và ăn mừng gốc. Run và clock truyền riêng, không dùng runtime/save thật.
- `AdventureWorld`/`AdventureBattle`: bản đồ/camera/sprite và menu kỹ năng/túi/đổi đội, HP/PP, log, tương khắc của game thật. Map có chế độ readOnly; battle có chế độ embedded, không mở dialog lồng nhau hay đọc thông báo thật.
- `ChestScene` tách nguyên renderer từ ChestPage để dùng chung; `RevealModal` có embedded/readOnly, giữ artwork/khung rarity và màn reveal gốc. Embedded không cài focus trap hoặc tạo portal ra ngoài dialog demo.

## Kịch bản 25 giây

| Chế độ | Pha |
| --- | --- |
| TCG | 0s trận mẫu giữa ván với Hỏa Linh → 2s triệu hồi Phở bò → 6s cộng hưởng Hải + Bữa cơm nhà → 10s Dậy lửa hạ Hộ vệ → 13–19s kết thúc lượt, boss kích Than còn cháy và tự ra phép phản kích → 21s Cơm tấm đã cường hóa kết thúc trận. |
| Auto chess | Đội mẫu giữa ván 5 quân → mua thêm hai Phở bò → ghép 2 sao → xếp đội → vòng boss 5. Hai Hải vị và ba Người kể tích mana; khiên/hồi/Hơi nhớ phối hợp, boss chuyển pha và phản kích, kết thúc thắng. Giao chiến thật từ engine được nén vào highlight 9–22s. |
| Phiêu lưu | Cơm tấm đi với đội → Người Giữ Ấn đưa Phở bò vào sân → Mâm Đồng bị Hải kháng ×0,67 → đổi Gỏi cuốn → Rễ Giữ Vị ×1,5 và Bám rễ → Giữ mâm trước phản kích → Lá Xoáy kết thúc trận. NPC dùng kỹ năng/PP và được lượt hành động đúng reducer. |
| Rương | Chọn bữa Sáng → chìa bay / tích hương / mở nắp theo renderer gốc → reveal Phở bò chọn sẵn với rarity catalog → nhắc Hồ sơ vị giác. Không biến chế độ sưu tầm thành trận chiến. |

Tương khắc Phiêu lưu lấy từ `schoolMultiplier`: Gia → Hải bị kháng, Thanh → Hải có lợi thế. Hệ TCG và Auto chess của một tên món có thể khác nhau; kịch bản dùng đúng catalog của từng chế độ.

## Giữ dữ liệu và phạm vi

Fixture gọi engine thuần, không dispatch action vào save tài khoản; không tiêu đồ/chìa thật, không cấp thưởng thật. Màn chơi demo inert, handler không thực hiện thao tác game. Auto trận nền ngừng tick; map nền hủy đường đi; phím Rương/Phiêu lưu bị chặn khi intro mở. Chờ model, dừng clock khi rời tab; respect âm thanh và reduced motion. Đóng/đổi replay tháo effect, release asset/music lease và trả focus.

Chỉ web: không sync hoặc sửa Android/iOS, không build APK/AAB. Branch mới từ master đã merge PR #31; không tự merge PR sửa này.

## Kiểm chứng

Kịch bản kiểm tra các pha và thời lượng, combo/chắn/hồi TCG, frame phản kích boss và chiến thắng; Auto boss thật cast/chuyển pha; PP/trạng thái/bị kháng/đổi đội của trận NPC; fixture đầu không bị sửa và replay xác định. Kiểm tra renderer bằng React server render: các màn dùng class/component game thật, có inert và không thay đổi save/user. Kiểm tra source không đưa nút trở lại header, view TCG không gọi store save.

Typecheck app/dev đạt; toàn bộ 393 test / 37 file đạt. Catalog 123 món / 35 tag / 9 event, asset 132 tham chiếu / 0 thiếu, release records 328 asset / 32 dependency hợp lệ. Build sạch **63.777.724 byte / 424 file**, JS gzip **604.411 byte**, CSS gzip **86.810 byte**, 0 leak; đạt ngân sách 100 MB và JS gzip 650 KB.

Browser tương tác vẫn cần xác nhận trên preview có quyền truy cập; không coi server render là browser QA. Không tự merge hoặc đánh dấu kiểm tra trên trình duyệt là đã đạt.
