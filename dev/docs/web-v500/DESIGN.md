# Giao ước Vị Linh — thiết kế Adventure Web 5.0

Adventure chuyển sang RPG đội hình theo màn, phù hợp màn hình cảm ứng và tận dụng nhân vật, pose chiến đấu, nhạc, đấu trường và VFX có sẵn. Người chơi đi map để tìm lại câu chuyện, farm dungeon để nuôi đội, rồi trở lại vượt boss. Không cần di chuyển bằng WASD hoặc cuộn trang để ra lệnh trong trận.

## Nghiên cứu và lựa chọn

Nguồn được đọc ngày 13/10/2026, ưu tiên nhà phát triển/phát hành:

- [Cygames — Princess Connect! Re:Dive official help](https://dmg.priconne-redive.jp/help/): đội 1–5 người; kỹ năng thường tự phát động; TP tích qua hành động/nhận đòn; Union Burst có thể kích hoạt bằng chạm hoặc AUTO; kỹ năng được mở qua rank và nâng bằng mana, cấp kỹ năng không vượt cấp nhân vật.
- [Yostar — Azur Lane, Rapid Training Campaign 16/07/2026](https://azurlane.yo-star.com/news/2026/07/15/maintenance-notice-7-16-12-a-m-utc-7-2/): dùng Skill Books trong Tactical Class, cùng hệ nguyên liệu tăng trưởng tách khỏi nhân vật. [Trang thông báo](https://azurlane.yo-star.com/news/page/2/) còn liệt kê EXP Data Pack và Offensive/Defensive/Support Skill Books.
- [Yostar — campaign/map system notices](https://azurlane.yo-star.com/news/category/news/page/4/): PvE có các đội hình và mục tiêu theo bản đồ, tiến tới boss. Các cơ chế Fog of War/Air Support trong thông báo là nội dung riêng của Azur Lane, không được giả định là luật cho mọi chương hoặc sao chép vào bản này.

| Điểm tham khảo | Áp dụng vào Soul of Meal | Lý do |
|---|---|---|
| Priconne: đội 5 người, kỹ năng tự chạy, người chơi canh UB | 2 ô tuyến trước + 3 ô tuyến sau, tuyệt kỹ cần 100 năng lượng | Thao tác ít nhưng quyết định đúng thời điểm vẫn có giá trị |
| Priconne: skill level gắn với character level; rank mở kỹ năng | Hai kỹ năng tự động, một tuyệt kỹ, một nội tại; skill cap 10 và không vượt cấp nhân vật | Nuôi nhân vật có mục tiêu rõ, không chỉ tăng một chỉ số |
| Azur Lane: sách luyện kỹ năng, tài liệu EXP và nguyên liệu riêng | Sổ KN, Sách kỹ năng, Quặng ký ức, Tinh hương | Các dungeon có mục đích khác nhau; người chơi biết cần farm ở đâu |
| PvE theo map và boss | 4 chương nối tiếp, 6 màn/chương, mỗi màn 2–3 đợt | Thay overworld bằng đường đi nhìn được trên một màn hình |
| Quyết định trong trận thời gian thực | Canh tuyệt kỹ, AUTO, ×2, che chắn theo cảnh báo boss | Dùng lại pose/VFX hiện có, tạo điều khiển hợp với web |

Các con số, kinh tế, thời gian che chắn, dungeon năm tầng, HP/energy carry, điểm nghỉ và luật boss dưới đây là thiết kế riêng cho Soul of Meal. Đây là sự kết hợp có chọn lọc, không phải mô phỏng toàn bộ hoặc dùng art/nhân vật của hai game tham khảo. Không đưa hệ xếp hạng, stamina đợi theo giờ, xây dựng hạm đội, trả phí hoặc lối bắn đạn liên tục vào bản cập nhật này.

## Vòng chơi

1. Chọn map/màn đã mở, đọc lời dẫn, chuẩn bị đội.
2. Hai người đầu giữ tuyến; ba người sau thường là Pháp vị/Hồi phục/Khống chế.
3. Tự đánh và tự dùng kỹ năng. Đầy năng lượng, chạm nút nhân vật để tung tuyệt kỹ; có thể bật AUTO và ×2.
4. Thắng nhận xu/nguyên liệu và kinh nghiệm cả đội. Mở màn tiếp theo; thắng boss mở chương và độ khó dungeon.
5. Thiếu sức mạnh: farm dungeon chuyên tài nguyên, nâng cấp/skill/trang bị/thăng bậc, rồi quay lại map.

Vai trò gồm Giữ tuyến, Đột kích, Pháp vị, Hồi phục và Khống chế. Bộ kỹ năng được tạo từ vai trò + hệ, dùng tên món/Vị Linh đang sở hữu. Đột kích dồn sát thương, Pháp vị đánh nhiều mục tiêu, người Hồi phục chọn đồng đội bị thương, Giữ tuyến tạo khiên, Khống chế đánh tuyến sau. Hệ đóng góp kỹ năng hỗ trợ khác nhau: khiên, bỏng, năng lượng, hồi phục hoặc làm yếu.

## Chiến dịch và câu chuyện

| Map | 5 màn nhỏ | Boss / cơ chế | Cầu nối câu chuyện |
|---|---|---|---|
| Phố Đèn Lồng | Sạp sáng; Dấu chân dưới đèn; Giếng ký ức; Bếp người lạ; Mâm cơm bỏ quên | Trống Rỗng: tạo khiên sau đòn lớn | Tìm lại tiếng rao, chiếc ghế ở bếp chung; con tàu cần đường về |
| Bến Cảng Than Hồng | Hẻm tắt lửa; Kho mất tên; Cầu tàu; Hải đăng; Boong không tên | Khuyển Than: gây bỏng tuyến trúng đòn | Ánh đèn gọi tàu về; lá thư gửi tới khu vườn |
| Vườn Xanh Tĩnh Lặng | Lá thư; Luống rau; Nhà kính; Lối người chờ; Bầy rễ | Cổ Thụ: khống chế tuyến bị đánh | Lời hẹn cũ có chỗ cho mùa xuân mới; vỏ sò mang tiếng gọi từ biển |
| Biển Ký Ức | Bờ cát; Chợ cá; Bếp dưới biển; Thuyền của cha; Triều khóa ký ức | Người Giữ Nước: rút năng lượng; đổi tuyến khi nửa HP | Đem công thức về bếp, thêm chiếc ghế cho người đang sống |

Mỗi màn có thoại trước/sau. Sau boss có đoạn kết và hai cách viết tiếp câu chuyện; lựa chọn được lưu và hiển thị ở map. Chọn câu chuyện không đổi thưởng, tránh khiến người chơi phải chọn lời thoại chỉ vì tài nguyên. Bốn chương tạo một tuyến truyện hoàn chỉnh và để mở khả năng mở rộng về sau.

Thắng: 1 sao; không ai gục: 2 sao; không ai gục và xong trong 90 giây: 3 sao. Trận tối đa 180 giây, đủ thời gian cho đội thiên hồi phục. Thua không trừ xu hoặc xóa tiến trình.

Boss cảnh báo tuyến trước/sau trong 2 giây. Che chắn giảm 65% sát thương cho tuyến đã chọn trong 3 giây; hồi 12 giây. Boss chuyển pha tại 50% HP, tăng công 18% và nhắm tuyến sau. Khống chế có thể ngăn đòn đang chuẩn bị; boss bị hạ sẽ hủy cảnh báo của chính nó.

## Dungeon và kinh tế

| Dungeon | Tài nguyên chính | Một chuyến 5 tầng ở bậc 1 |
|---|---|---|
| Kho Bếp Ấm | Sổ KN | 14 sổ, 90 xu, 150 KN/người |
| Thư Viện Hương | Sách kỹ năng | 14 sách, 90 xu, 150 KN/người |
| Lò Rèn Ký Ức | Quặng + Tinh hương | 14 quặng, 7 tinh hương, 90 xu, 150 KN/người |

Nhận thưởng từng tầng. Rút lui hoặc thua tầng sau giữ phần đã nhận. Boss ở tầng 5; thắng mở thống kê vượt dungeon. Bậc 2 mở khi thắng một boss chiến dịch, bậc 3 khi thắng hai boss; tăng tài nguyên và sức mạnh địch. Không cần vé vào dungeon.

HP và năng lượng giữ giữa các tầng. Ở tầng 2/4: nghỉ hồi 40% HP hoặc tiếp sức +12% công cho phần còn lại của chuyến. Canh Ấm hồi 35% HP giữa tầng; Lá Tỉnh hồi sinh một người với 50% HP. Không dùng vật phẩm để hồi một đội đã đầy HP; người đã gục không tự sống lại khi đổi tầng.

Nhân vật tối đa cấp 50; một Sổ KN cho 180 KN. Kỹ năng thứ hai mở ở cấp 5, nội tại ở bậc 2. Bốn kỹ năng có cấp riêng, tối đa 10 và không vượt cấp nhân vật. Trang bị gồm Muôi chiến (công), Tạp dề (HP/giáp), Hương phù (năng lượng đầu trận), mỗi ô tối đa +10. Thăng bậc tối đa 5 bằng xu/quặng/tinh hương và điều kiện cấp.

Tài khoản mới có năm Vị Linh cơ bản, ít sổ/sách/quặng để học vòng chơi. Những thẻ đơn vị đã sở hữu được mở trong Adventure mà không trừ bản sao TCG. Không tự trao một thẻ TCG khi mở nhân vật ở Adventure. Không trừ tiền/tinh chất/vé TCG để nâng đội.

## Lưu dữ liệu và hiệu năng

- Giữ key `foodchest.tcg.v1`, `GameSave.version = 1`, luật TCG và các khóa bảo vệ/checkpoint hiện có.
- Thêm `adventureRpg.version = 1`. Seed một lần từ đội/tủ cũ, giữ uid/cấp/KN; huy hiệu cũ giữ chiến thắng vùng tương ứng. Bản Adventure v1/v2, vị trí, nhiệm vụ, kho, đồ và chạm trán cũ vẫn nằm nguyên trong `adventure`.
- Xu/vật phẩm Adventure cũ được chuyển thành số dư/supplies của chế độ mới một lần. Hương Ấn và thông tin huy hiệu/khám phá được giữ trong bản lưu; hệ thu phục bằng bãi cỏ không còn là thao tác mới.
- Dữ liệu trận gồm tick, HP, năng lượng, hiệu ứng, cảnh báo, thứ tự event, pause, tốc độ và dấu nhận thưởng. Reload tiếp tục trận; nhận thưởng có thể gọi lại an toàn.
- Engine cố định 4 Hz, tối đa 8 tick/lệnh; không chạy bù thời gian khi đổi tab. Checkpoint một lần/giây; lệnh người chơi, kết quả, pagehide, visibility và rời trang flush ngay. Đóng tiến trình trình duyệt cưỡng bức có thể mất tối đa phần nhỏ giữa hai checkpoint.
- Pose chạy qua đồng hồ/cache ảnh chung TCG/Auto. Không tạo timer theo từng Vị Linh, không tải toàn bộ atlas chỉ để vào bản đồ. Reduced motion/preset nhẹ giữ tác dụng.
- Renderer đi ô và 7 media cũ được chuyển tới `dev/archive/legacy-adventure-v490`; không có trong `dist`. Các kiểu/map/reducer cũ cần cho kiểm tra save vẫn được giữ. Không thêm thư viện runtime hoặc media mới.
