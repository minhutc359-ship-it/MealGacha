# 4.0 — Câu chuyện còn chỗ viết

Nghiên cứu ngày 10/10/2026, dựa trên 3.5.0. Các chương, boss, thẻ và cơ chế dưới đây **chưa được triển khai**. Đây là phần bổ sung cho [PROPOSAL](PROPOSAL.md), không thay luật giữ save trong [TECHNICAL_PLAN](TECHNICAL_PLAN.md).

## Điều cần giữ từ câu chuyện đang có

TCG đã có 6 chương/18 màn. Người chơi là tiếng vọng từ ký ức Mai, không phải Mai được cứu sống; Mai đã cứu Liên trong trận lũ. Bách và bà phải thôi chọn thay người khác. Hai kết thúc `remember` và `release` đều trả ký ức cho thành phố, nhưng có hai số phận khác nhau cho tiếng vọng. Auto chess kể về An, Sổ Công Thức, Ông Lộc, Bà Sen và Tịnh; Tịnh xóa những cách nấu khác để giữ một bản đúng, khiến người từng nấu bị quên.

4.0 tiếp nối chủ đề **ai có quyền kể một công thức**, không hồi sinh Mai, không đảo ngược kết thúc và không biến An thành nhân vật tiếng vọng. Thành phố đã được cứu nhưng còn phải học sống cùng những câu chuyện khác nhau. Đối thủ mới là **Sổ Tự Sửa**: những trang chép cũ tự gạch bỏ biến thể không trùng bản mẫu. Nó là linh ảnh của thói quen sửa người khác, không phải một thế lực bí mật đứng sau toàn bộ truyện cũ. Tịnh tham gia sửa hậu quả của mình thay vì bị đặt lại thành phản diện.

## Một phần truyện mới, hai cửa vào

Đề xuất thêm 3 chương TCG, mỗi chương 3 màn: tổng thành **9 chương/27 màn** nếu toàn bộ pack được duyệt. Auto chess có một chiến dịch mở rộng riêng 6 đợt sau 12 đợt hiện có. Hai chế độ không bắt người chơi hoàn thành chế độ kia để mở nội dung chính; phần hội thoại giao nhau là tùy chọn.

| Chương | Xung đột và nhân vật | Quyết định có tác dụng | Boss và bài học gameplay |
| --- | --- | --- | --- |
| 7. Chợ có hai giọng | An/Bà Sen gặp Nhiên; hai nhà cùng gọi một món bằng hai cách nấu | Chọn nghe người đang phục vụ hay đọc bản chép trước; thay thứ tự 2 cảnh và gợi ý deck | **Cân Vô Thanh** báo trước loại phòng thủ cho lượt sau; thử Nêm vị để chọn phá chắn hoặc giữ sức |
| 8. Bến sau cơn mưa | Hải/Mộc đưa phần cơm qua bến; trang sổ bỏ tên người nấu vì không giống bản mẫu | Chọn đường ngắn khó đánh hay đường dài có sự kiện; quyết định được lưu ở chuyến mới | **Người Giữ Bát Nguội** báo trước một hiệu ứng chờ; dạy Ủ vị, gỡ chờ và giữ tempo |
| 9. Bữa cơm ngày mai | Bách/Liên cùng An mở bếp; Tịnh phải ghi tên mình vào lỗi đã gây | Chọn cách lưu sổ: ghi cả các biến thể hoặc mời người sau viết tiếp; đổi kết cảnh/cosmetic | **Sổ Tự Sửa** luân phiên 3 quy tắc đã báo; trận cuối kiểm tra deck có nhiều cách thắng |

Đối thoại trước trận khoảng 6–9 câu, sau trận 4–6 câu, mỗi cảnh chỉ có một thông tin mới. 9 trận cùng truyện đặt mục tiêu 75–120 phút cho lượt đầu, cần đo lại bằng playtest. Cho đọc lại, bỏ qua và tóm tắt; không giấu luật boss trong thoại bắt buộc. Không lồng quiz kiến thức văn hóa vào cổng tiến trình.

### Cửa vào theo kết thúc cũ

| Save TCG | Cách kể phần nối | Điều bất biến |
| --- | --- | --- |
| `remember` | An mở câu chuyện từ sổ của Bách; tiếng vọng chỉ xuất hiện trong lời kể, không làm nhân vật sống trở lại | Bà và Bách đã chấp nhận chia tay; tên Mai vẫn được giữ |
| `release` | Người khách có bóng tham gia học nấu và có thể nói vài câu riêng; không bị gọi là Mai, không còn phép giữ bữa tiệc | Bà không tự nhiên nhớ lại tiếng vọng mà kết thúc đã nói bà quên |
| Chưa chọn kết thúc | Hiện phần tiếp nối còn khóa; vẫn chơi nguyên 18 màn cũ | Không tự chọn `release` hoặc ghi thêm ending khi load |
| Chỉ chơi Auto chess | An mở chiến dịch tiếp nối từ chuyện Sổ Công Thức đã hoàn thành | Không lấy ending TCG chưa có làm sự thật; cameo dùng cách kể trung tính |

Kết cảnh mới không phải lựa chọn “đúng/sai” hay điểm đạo đức. Mọi nhánh nhận cùng loại thưởng chơi cơ bản; khác cảnh, trang sổ và trang trí. Đọc lại nhánh không cấp thưởng lần hai. Nếu thay hướng ở phần nối, chỉ thay state của chương mới; không sửa `storyEnding`, `clearedStages`, `bonds` hay lựa chọn 3.5.

### Một cảnh mẫu để kiểm tra giọng kể

> Bà Sen: “Sổ ghi phải có gừng. Chị bà không dùng. Hôm ấy nhà hết gừng.”
>
> An: “Vậy chị nấu sai sao?”
>
> Nhiên: “Nếu bát cháo đưa được người đó qua đêm, tôi muốn biết tên chị ấy.”
>
> Tịnh: “Ta có thể thêm một dòng dưới công thức cũ.”
>
> An: “Một dòng có chỗ cho người khác nói tiếp không?”

Lựa chọn “Hỏi người đang nấu” mở chuyện Bà Sen trước; “Đọc dòng bị gạch” mở chuyện Tịnh trước. Cả hai dẫn đến cùng trận, nhưng preview khuyên một cách xây deck khác. Không tiêu thẻ, tiền hoặc RNG vì chọn thoại.

## Ít hệ thống mới, nhiều quyết định dùng được

| Hệ thống | Người chơi quyết định gì | Đánh đổi và lý do chơi lại | Ràng buộc |
| --- | --- | --- | --- |
| Nêm vị | Chọn 1 trong 2 nhánh của cùng một phép | Tempo ngay hoặc tài nguyên/độ bền; không chỉ đổi màu hiệu ứng | Chọn trước command, chỉ 1 phép/trigger; cancel không tiêu tài nguyên |
| Ủ vị | Đặt giá trị vào lượt chủ nhân kế tiếp | Dễ bị gỡ/nguồn mục tiêu mất; trao đổi sức ép hiện tại lấy lượt lớn | ≤2 hiệu ứng chờ/phe, giải quyết theo ID/thứ tự một lần; ghi vào save |
| Boss báo trước | Đọc quy tắc lượt/vùng kế tiếp và giữ bài/đổi vị trí | Một đội hình mạnh có thể vẫn thất bại nếu bỏ qua thông tin | Dấu báo phải khớp engine; reduced motion vẫn đọc được; không fake timeout |
| Thám hiểm có lời hẹn | Chọn điều kiện phụ cho 1 chuyến mới, như thử một recipe khác | Chuyến mới đổi nhịp nhưng không thêm việc bắt buộc hàng ngày | Tối đa 1 điều kiện/chuyến, seed/offer lưu; không sửa chuyến đang chạy |
| Sự kiện chợ | Bỏ qua, đổi một lá trong deck chuyến hoặc đổi đường | Có thể từ chối khi phần thưởng làm hỏng combo | Không đổi sở hữu trong collection; giữ giới hạn thưởng 3/ngày hiện có |
| Augment có hành vi | Chọn chuyền mana, hồi thực→đòn sau, hoặc giữ tuyến khi mất quân | Mỗi lối có counter và cap; không chỉ cộng chỉ số | 6 brief trong proposal, rules mới; bắt đầu bằng 2 mẫu |
| Sổ Chợ Sống | Xem trang đã nghe và thử cách kể còn lại | Động lực đọc/khám phá, không sức mạnh vĩnh viễn | Cosmetic/tóm tắt; không thêm tiền mới, battle pass, streak bắt buộc |

8 thẻ hỗ trợ vẫn theo phạm vi đã chốt: 3 Nêm vị, 2 Ủ vị, 2 đối sách và 1 engine unit. Thẻ mới phải có đường nhận xác định qua thưởng lần đầu/crafting đang có, không ép gacha hoặc yêu cầu rare để qua truyện. Giá/công/số máu là tham số playtest, chưa công bố là cân bằng. Starter và 7 deck gợi ý cũ phải tiếp tục hợp lệ.

4 biến thể encounter, 4 di vật và 2 boss mechanism của thám hiểm dùng lại 3 địa điểm mới; không dựng thêm một roguelike độc lập. Chiến dịch Auto nối thêm 6 đợt bằng roster 44 quân trước; không mở 6 đợt đó trong run rules 5 đang tiếp tục. Survival vẫn 3 ý chí, thua 1, retry cùng vòng, không hồi khi thắng; Daily vẫn thua lần đầu kết thúc.

## Lưu truyện và thưởng

Thiết kế namespace mới, chẳng hạn `story400`, chỉ là đề nghị schema, chưa có trong runtime. Cần version, completed IDs, lựa chọn, seen scenes và receipt thưởng. Chapter IDs mới (`living-market-*`, `rain-harbor-*`, `tomorrow-table-*`) không tái sử dụng 18 stage IDs cũ. `contentVersion` độc lập với version bộ luật trận. Không thêm default đánh dấu “đã đọc” khi migrate.

Thưởng xác định theo ID nội dung, ví dụ `story400:living-market-3:first-clear`; chọn lại ending, import, replay và reload giữa result/reward không nhận hai lần. File MGC1/ZIP phải round-trip tất cả trường mới; Zod không được strip chúng. Save thiếu ending vẫn khóa đúng; future content không hiểu phải được giữ để export phục hồi, không chuyển thành game mới.

## Playtest và điều kiện đưa vào bản phát hành

Mẫu đầu chỉ làm cảnh Chợ có hai giọng + một trận boss + một Nêm vị và một Ủ vị. Mời khoảng 10 người chơi mới/cũ; số lượng này nhằm tìm vấn đề UI/nhịp, không chứng minh thống kê về mọi người chơi. Quan sát thao tác và hỏi lại sau trận, không chỉ hỏi “có hay không”.

| Giả thuyết | Cách kiểm tra | Gate đề xuất |
| --- | --- | --- |
| Truyện nối hiểu được | Người chơi kể lại ai là An/Mai/tiếng vọng, vì sao sổ xóa tên | Không nhầm Mai sống lại hoặc hai ending bị xóa; sửa thoại nếu có nhầm phổ biến |
| Quyết định có ích | Người chơi thử 2 nhánh cùng seed/deck | Mô tả được đánh đổi và muốn thử nhánh kia; không có nhánh luôn trội |
| Boss công bằng | Đọc telegraph trước khi hành động | Thua có thể giải thích và biết một điều nên đổi; không buộc gacha để thắng |
| Nhịp truyện vừa | Ghi thời gian đọc/skip/trận và điểm mất chú ý | Không bắt đọc dài khi retry; tóm tắt đủ hiểu sau skip |
| Giữ người chơi cũ | Load/export/import fixture 3.5 rồi vào phần nối | Không mất tài nguyên/choice/record; thưởng cũ không lặp |

Ước tính phần truyện và sổ mới thêm **7–12 ngày công** nếu dùng scene/portrait sẵn có và framework lựa chọn/reward đã ổn. Không nhân số lượng CG/voice acting theo từng nhánh. Tổng 4.0 với phần này khoảng **38–61 ngày công**, 8–13 tuần cho một developer và tiến độ asset phù hợp; Android có lịch riêng.
