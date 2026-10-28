# Thiết kế lại map theo công năng

28/10/2026 · AW2-017A/B/C · Làng, Phố và Sân Bếp có công năng. [Đặc tả v1.1 đã đối chiếu](design/world-v1.1/SOUL_OF_MEAL_AW2_MAP_NPC_WORLD_SPEC_v1.1.md), đặc biệt mục2–5,7 và10–12.

## Sân Bếp — cập nhật017C

Mười facade trang trí đã được thay bằng hai công trình có cổng thật: **Kho nguyên liệu** ở cửa trái và **Phòng Bàn** ở cửa phải. Dì Gác Bếp vẫn ở trung tâm, cổng về Phố và vật cản phía nam giữ nguyên. Kho mở theo nhiệm vụ; Phòng Bàn là shortcut chỉ mở sau kết thúc.

Nhấn mái đưa nhân vật tới điểm đứng trước đúng cửa, không tự qua vùng hoặc ghi save. Cùng điểm đó được dùng cho nhật ký, Địa điểm và điều hướng bàn phím. Đi ngược từ Kho/Bàn trả về trước cửa tương ứng. Không đổi kích thước/collider nên vị trí save8 cũ vẫn hợp lệ. [Bằng chứng017C](evidence/AW2-017C.md).

## Phố Đèn Lồng — cập nhật017B

Phố hiện giữ ba công trình có cửa và phòng riêng; chín facade dư đã bỏ khỏi bản render. An Vá Đèn và Em Đem Nước vẫn ở ngoài phố. Giữ đúng tám NPC toàn tuyến, không tạo bản sao NPC ngoài nhà.

| Công trình | Phòng | Vai trò thật |
| --- | --- | --- |
| Quầy bữa sáng | `aw2-room-street-breakfast` | Người Bán Bữa Sáng, ký ức thứ nhất và sổ công thức |
| Xưởng sửa ghế | `aw2-room-street-workshop` | Thợ Sửa Ghế và ký ức thứ hai |
| Nhà bàn chơi | `aw2-room-street-play` | Chủ Bàn Bài/Chủ Bàn Cờ và TCG/Auto Chess hiện có |

Nhật ký giữ tên NPC làm mục tiêu, chỉ rõ phòng trong tuyến đi. Ở ngoài sẽ dẫn tới cửa đúng nhà; trong đúng phòng dẫn tới NPC; trong phòng khác dẫn ra cửa hiện tại trước. Đi theo chỉ dẫn chỉ đi bộ, không tự vào nhà hoặc nhận ký ức. Cửa của phòng còn ký ức nhiệm vụ có dấu mục tiêu, mất dấu sau khi người chơi ghi nhớ. Ba ký ức được lấy theo thứ tự bất kỳ và vẫn trả nhiệm vụ tại An, tổng80EXP sau khi trả như trước.

Nhân vật trong nhà dùng sprite/idle gốc tại đúng điểm tương tác; preloader chỉ tải NPC thực sự thuộc cảnh đang mở. Các bàn chơi cũ đã chuyển vào Nhà bàn chơi, truy cập nhanh vẫn giữ nguyên. Ra nhà và trở về từ activity giữ cả vị trí trong phòng lẫn checkpoint ngoài cửa. Save8 đọc1–7 không ghi đè; chỉ thao tác lưu rõ ràng mới nâng phiên bản. Save7 vẫn chỉ nhận ba phòng Làng của017A, không chấp nhận gắn nhãn7 cho phòng Phố mới.

Hiện có6vùng ngoài trời và6phòng con. Làng/Phố có6facade chức năng,3mỗi nơi; Sân có2facade portal chức năng và không còn facade trang trí chủ động. Nội thất vẫn dùng lại art gốc, nền lát còn lặp và vườn/biên/collider mỹ thuật cuối còn làm tiếp.017C hoàn thành cấu trúc cổng của Sân, chưa phải hoàn thiện mỹ thuật toàn thế giới. [Bằng chứng017C](evidence/AW2-017C.md).

## Vấn đề cần giải quyết

Ảnh owner gửi cho thấy sân lát gạch chiếm phần lớn khung hình, các công trình làm nền không có cửa thật và các điểm nhiệm vụ nhỏ, tách rời. Tăng thêm nhà chỉ làm số đích giả tăng lên. Bản006O có32kiến trúc trang trí trên ba vùng; tại Làng có10công trình nhưng chỉ một nội thất tiệm trà. Tranh panorama cũng chứa sẵn nhà và cổng không có entity tương ứng.

Cần thiết kế tuyến đi và công năng trước, sau đó mới phủ mỹ thuật. Mỗi công trình mà người chơi có thể đi tới phải dẫn tới hoạt động thật. Cây, nước, mép vườn có vai trò định hướng/ranh giới/che khuất; không cần biến từng chiếc lá thành nút tương tác.

## Khu mẫu đã triển khai trong017A

| Ngoại thất ở Làng | Cửa và phòng thật | Hoạt động hiện có |
| --- | --- | --- |
| Nhà đồng hành, phía trái | `aw2-object-home-door` → `aw2-room-village-home` | Mở đội đã sở hữu, sổ hành trình và công thức |
| Tiệm trà, ở giữa | `aw2-object-village-tea-door` → `aw2-room-village-tea` | Giữ dịch vụ đội/nhật ký/công thức và luyện tập016K |
| Hội quán, phía phải | `aw2-object-guild-door` → `aw2-room-village-guild` | Hai bàn TCG và Auto Chess vào các activity thật |
| Bàn chung và Bà Giữ Chỗ | Các ID nhiệm vụD14 cũ | Nhận/đọc/trả nhập môn và kết thúc hành trình |
| Lối sang Phố | Cửa nối vùng cũ | Điều kiện nhiệm vụ và chuyển cảnh hiện có |
| Giếng | Vật cản cũ, đường vòng vẫn thông | Quan sát no-write; không lấy nước/hồi phục/quest |

Tại mốc017A, ba facade Làng có phòng riêng:3/3 và bảy công trình dư đã bỏ khỏi bản render; bản asset gốc giữ nguyên. Khi đó22công trình ở Phố/Sân còn theo cấu trúc cũ.017B ở trên đã thay12facade Phố bằng ba công trình chức năng. Registry vùng ngoài trời vẫn là6map; registry nội thất quản lý các phòng con riêng.

Sân mới ghép từ crop gạch gốc bằng Sprite, tách lớp nền/lối đi/công trình/nhân vật/tiền cảnh. Ba đường cửa nối vào một tuyến ngang, nhánh bàn chung và vòng qua giếng. Camera bám gần hơn và toàn cảnh gói vào khu chức năng. Không còn dùng nguyên panorama có các nhà nền giả ở Làng. Đây là bố cục chức năng đầu tiên; nền gạch còn lặp, vườn/biên/sân chưa phải bản mỹ thuật cuối.

Nhấn vào mái nhà đưa nhân vật tới đúng điểm đứng trước cửa, không cố đi tới một pixel mái ngoài map. Tới cửa vẫn bấmE/Tương tác rồi chọn Vào. Trong phòng, đi bộ tới bàn, chọn dịch vụ thật; ra cửa giữ đúng tọa độ/hướng trước cửa nguồn. Hội quán không tạoNPC, tiền tệ hay phần thưởng mới; các ván vẫn là luyện tập không thưởng. Hai phòng mới dùng lại thành phần art tiệm trà với vị trí bàn khác; chưa có bộ nội thất nguyên bản riêng cho từng nhà.

## Cấu trúc lấy từ tài liệu Pokémon-style

Áp dụng cấu trúc không gian và luồng chuyển cảnh từv1.1, dùng hoàn toàn nội dung/mỹ thuật dự án:

1. **World → Region → Map → Interior.** Mỗi phòng/cửa có ID ổn định, collider và danh sách tương tác riêng. Thêm khu chức năng bằng dữ liệu, không nhân các nhánh xử lý chỉ dành cho tiệm trà.
2. **Một cửa, một nơi đến, một nơi trở về.** Lưu checkpoint bên ngoài; tải và dựng khung hình đích trước commit. Hỏng tải/renderer/lưu giữ cảnh nguồn. Trở về từ TCG/cờ giữ cả phòng và vị trí bên trong.
3. **Nhìn thấy là hiểu đường đi.** Lối chính nối cổng với quảng trường nhỏ; ngõ phụ kết thúc ở cửa/dịch vụ/đồ vật có vai trò. Công trình không có công năng phải bỏ khỏi vùng tiếp cận hoặc chuyển thành nền ngoài ranh giới rõ ràng.
4. **Địa điểm, sprite và luật dùng cùng dữ liệu.** Khoảng cách tương tác, điểm đứng, nhãn, collision và save không được dùng các tọa độ độc lập. Nhà mới dùng `ROOMS`; cùng ID được dùng ở reducer/scene/preload/waypoint/adapter.
5. **Phân biệt bước qua cửa với hành động có hệ quả.** v1.1 có cả step portal và interact portal.017A chỉ hoàn thành loại bấm tương tác; loại bước qua sẽ làm riêng với chốt chống kích kép, điểm ra nằm ngoài trigger và hủy di chuyển trước chuyển cảnh. Nhận nhiệm vụ, dùng đồ và nhận thưởng luôn là thao tác rõ ràng.

D17một trưởng đội đại diện trên map vẫn áp dụng; không bật follower minh họa trongv1.1. Các ID nhà/shop/guild minh họa của tài liệu không tự thay canonD14 hoặc duyệt commerce/gacha.

## Thứ tự tiếp theo

| Pha | Công việc cụ thể | Điều kiện hoàn thành |
| --- | --- | --- |
| 017B · Phố Đèn Lồng | ĐÃ TRIỂN KHAI: ba công trình chức năng, bốn NPC chuyển vào đúng phòng, chỉ dẫn biết phòng và save8 | Đủ3ký ức/80EXP; mode/quick entry và save cũ được bảo toàn; mỹ thuật riêng còn tiếp |
| 017C · Sân và bếp | ĐÃ TRIỂN KHAI: hai facade/cổng Kho và Bàn, bố cục tách lớp, điểm tiếp cận và hồi đáp hai chiều | Tuyến nhận nguyên liệu→gợi ý→giải bếp→boss→ghi chép đi được hai chiều; không sinh ra trong collider |
| 017D · Cửa bước qua và đồ vật | ĐÃ TRIỂN KHAI:8portal tuyến ngang bước qua; latch chống loop; giếng/thùng sửa/bồn rửa có phản hồi quan sát no-write | Touch/keyboard cùng detector; load-inside/spawn/lỗi giữ an toàn; cổng công trình vẫn explicit; không thêm thưởng/vật phẩm/quest |
| 017E · Đời sống NPC | ĐÃ TRIỂN KHAI: đồng hồ phiên bốn ca và32hoạt động cho tám NPC; HUD/Địa điểm/waypoint/dialog/renderer dùng cùng projection | NPC nhiệm vụ/mode luôn truy cập được; Em giữ patrol; pause/reduced/no-save/save1–8 và toàn tuyến đã kiểm chứng |
| 017F · Phối cảnh cuối | Art nội thất riêng, mép vườn, collider/ánh sáng và đường chuyển vùng; đo thời gian đi để điều chỉnh mật độ | Có đường ngắn về trung tâm; art/collider/ánh sáng khớp mặt đất; nghiệm thu art riêng, không suy từ017E |

017E đã kiểm chứng lịchNPC mà không đổi scene, quest, save hoặc economy. 017F là bước nhỏ tiếp theo cho final art/mép vườn/collider/ánh sáng. Mục tiêu thiết kế: trong một khung bám luôn thấy một đích có ý nghĩa hoặc hướng đi tới đích; tuyến chính không có đoạn sân dài không mang thông tin. Chưa tuyên bố có số đo playtest thời gian đi thực tế hay nghiệm thu art cuối.

## Bảo toàn tiến trình

Save8 mở rộng tập roomId cho Phố. Save6 chỉ có tiệm trà, save7 chỉ có ba phòng Làng; không chấp nhận dữ liệu gắn nhãn cũ nhưng chứa phòng mới. Đọc save1–7 nâng mô hình trong bộ nhớ, không ghi lại raw. Thao tác lưu rõ ràng mới tạo bản8, giữ saveId/ngày tạo/đội/quest/túi/EXP/receipt và checkpoint. Không reset dữ liệu.

Khu mẫu giữ hình học ngoài trời640×384 và vị trí nhiệm vụ cũ để save đang đứng ở bất kỳ điểm hợp lệ nào vẫn dùng được. Đây là lý do chưa nén toàn bộ tọa độ sang map nhỏ hơn; pha thay collider/tọa độ cần migration và kiểm thử điểm cũ riêng.

Kiểm tra nhịp sống và giới hạn mới nhất tại [AW2-017E](evidence/AW2-017E.md). Demo90%/product≈40%(35–45%) giữ nguyên; lịch NPC và cấu trúc map tốt hơn chưa tự đóng nghiệm thu art, người chơi độc lập, thiết bị thật hay điều kiện tích hợpD18.
