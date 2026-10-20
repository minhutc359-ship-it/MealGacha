# AW2-003 · Hồ sơ 12 Vị Linh — PROPOSED

Ngày 2026-10-20. **CHƯA OWNER DUYỆT.** Giữ đúng 12 ID/tên/món/tier/role ứng viên trong CANON; mở rộng lore/kit để review, không đưa vào runtime/save và không tự khóa ID. Các tên Bách/Hải/Liên/Mộc/Nhiên/Vân không mang theo lore hay kit Soul of Meal cũ. Nội dung dưới đây là sáng tác gốc; món ăn là cảm hứng thiết kế, không phải khẳng định văn hóa/lịch sử độc quyền.

## Identity và rarity review

`spiritId` là identity dự kiến immutable **sau khi được duyệt**. `displayName`, `recipeAffiliation`, `rarity`, `combatRole` và `artVariantId` là các trường tách biệt. Đổi tên/món/áo không tạo spirit mới hoặc đổi ID đã duyệt. Không lấy displayName làm key save, không dùng tên món để suy rarity/animation. Rarity không đại diện giá trị của món ăn hay con người.

| spiritId ứng viên | displayName | recipeAffiliation cảm hứng | rarity đề xuất | combatRole |
| --- | --- | --- | --- | --- |
| aw2-than | Than | Cơm tấm | N | Tank |
| aw2-lua | Lửa Nhỏ | Bánh mì | N | Striker |
| aw2-lam | Lam Lam | Phở | N | Healer |
| aw2-moc-non | Mộc Non | Gỏi cuốn | R | Support |
| aw2-suong | Sương Lành | Bánh cuốn | R | Mage |
| aw2-muoi | Muối Đen | Muối rang | R | Debuffer |
| aw2-nhien | Nhiên | Bún bò | SR | Striker |
| aw2-hai | Hải | Canh chua | SR | Tank |
| aw2-lien | Liên | Chè sen | SR | Healer |
| aw2-moc | Mộc | Cốm | SSR | Mage |
| aw2-bach | Bách | Bánh chưng | SSR | Tank |
| aw2-van | Vân | Bữa ăn thất lạc | UR | Hybrid |

Phân phối 3N / 3R / 3SR / 2SSR / 1UR đúng D10 nhưng vẫn PROPOSED. Không chứa rate, pity, spark, giá bán hoặc lời hứa nhận khi quay. Khác biệt tier nằm ở nhận diện/cách xây đội, không thêm chìa khóa main story chỉ có UR.

## Contract chiến đấu và progression chung

Đội 5, đánh thường/kỹ năng thường tự động, người chơi canh ultimate từng thành viên. Mỗi kit dưới đây gồm 4 slot: basic, auto, passive, ultimate. Target rules luôn cần fallback khi mục tiêu chết/rời sân, không lưu tham chiếu renderer vào luật. Mana/cooldown/range/duration/crit/định lượng trạng thái đều chưa chốt; cân bằng phải qua mechanic simulation và BATTLE-01 trước implementation. “Ưu tiên” không phải taunt vĩnh viễn, “ngắt” không tự áp dụng cho boss miễn nhiễm.

Progression đề xuất: cả 12 có level/XP và skill level; tăng cấp củng cố vai trò hiện có, không bắt bản sao/UR để mở kit cơ bản. Cap/đường cong/tài nguyên nâng cấp và slot gear chưa duyệt. Không dùng rarity để ngăn N/R/SR lên mức đủ vượt story. Mỗi nhân vật có ghi chú hướng nâng cấp bên dưới, chưa phải stat table. Không hoàn tất DoD leveling khi chưa có số liệu + QA.

### aw2-than · Than

Danh tính: người giữ than hồng qua đêm để sáng mai ai cũng có bếp. Điềm tĩnh, hay lùi nửa bước nhường chỗ; sợ bảo vệ một người đến mức không nghe người ấy muốn gì. Hành trình cá nhân: từ tự nhận mọi gánh nặng sang biết nhờ đội chia việc. Không mặc định liên hệ huyết thống với NPC mới.

- Đánh thường — **Gõ Bếp**: đòn cận chiến lên mục tiêu tuyến trước, một điểm tiếp xúc rõ.
- Kỹ năng tự động — **Giữ Lửa**: dựng khiên cá nhân ngắn, ưu tiên đứng chắn đối thủ đang áp sát đồng minh yếu máu; không dịch chuyển đồng minh cưỡng bức.
- Nội tại — **Than Còn Ấm**: khi khiên vừa hết, đòn thường tiếp theo giảm lực đánh của một mục tiêu; có khoảng nghỉ, không cộng vô hạn.
- Tuyệt kỹ thủ công — **Chỗ Sau Lưng**: vùng bảo vệ quanh Than hấp thụ một phần đòn tới đồng đội trong vùng; ngoài vùng vẫn chịu đòn bình thường.

Điểm yếu/counter: tầm ngắn, phải chọn vị trí, dễ bị ép hai cánh; không tự hồi đầy đội. Leveling củng cố độ bền/khiên theo ngân sách, không tăng vùng tới phủ toàn sân. Art: silhouette thấp vững, áo chàm xắn tay, bàn tay có găng vải và tấm chắn gợi nắp bếp; FX than đỏ có viền đọc được trên nền tối.

### aw2-lua · Lửa Nhỏ

Danh tính: người mang bữa sáng đến những ngõ còn ngủ, nhanh chân hơn kiên nhẫn. Muốn ai cũng nhận đồ còn ấm; học cách dừng lại nghe lời cảm ơn thay vì luôn chạy sang việc kế tiếp. Không biến tên món thành vũ khí sao chép thương hiệu.

- Đánh thường — **Nhịp Giòn**: hai nhịp chạm cận chiến với một thời điểm gây damage được engine phát cho từng nhịp.
- Kỹ năng tự động — **Chuyền Hơi Ấm**: bước ngắn trong vùng giao chiến để bám mục tiêu gần nhất, không xuyên blocker hoặc xuyên cả đội địch.
- Nội tại — **Đúng Giờ**: tập trung cùng mục tiêu tạo một đòn nhấn; đổi mục tiêu làm mất chuỗi, giới hạn số nhịp.
- Tuyệt kỹ thủ công — **Dọc Phố Sớm**: đánh thành một đường ngắn theo hướng mục tiêu đã chọn; dấu báo đường hiện trước khi tiếp xúc.

Điểm yếu/counter: bị cắt chuỗi, khống chế hoặc mục tiêu đổi tuyến; không miễn sát thương lúc lao. Leveling tăng hiệu quả nhịp, không bỏ giới hạn đường lao. Art: dáng nhỏ linh hoạt, khăn cam ngắn, túi giao bữa, găng đánh có motif vệt hơi; FX đường tốc độ không che hitbox.

### aw2-lam · Lam Lam

Danh tính: ghi nhớ ai cần bữa ăn nhạt hơn, ai thích thêm hơi nóng; chăm người khác nhưng khó nói mình mệt. Arc: cho phép đồng đội thay ca. Màu lam là motif đọc hình, không ép đồng nhất với hệ nước legacy.

- Đánh thường — **Giọt Trong**: projectile đơn chậm, chỉ trúng khi engine xác nhận impact.
- Kỹ năng tự động — **Chan Ấm**: chữa đồng minh mất tỷ lệ HP nhiều nhất; khi không ai cần chữa, trì hoãn cast thay vì tiêu skill vào mục tiêu đầy máu.
- Nội tại — **Để Nguội Vừa**: lần chữa vượt mức chuyển phần có giới hạn thành bảo vệ mỏng; không tích lũy qua trận vô hạn.
- Tuyệt kỹ thủ công — **Bữa Ăn Yên**: chữa đội trong vùng quanh Lam Lam theo hai nhịp, có thể bị gián đoạn giữa nhịp theo luật combat sau này.

Điểm yếu/counter: sát thương thấp, cần giữ vị trí, không hồi sinh người đã bị hạ. Leveling cân bằng chữa/overheal cap, không thành bất tử bằng spam. Art: áo nhiều lớp sáng, ống giữ nhiệt bên hông, tay mở đỡ làn hơi; projectile và healing tách asset/màu+icon.

### aw2-moc-non · Mộc Non

Danh tính: thích rủ mọi người góp một phần nhỏ để thành bữa ăn chung; đôi khi hứa nhiều hơn sức làm. Arc: chia việc rõ ràng và để người khác được từ chối. Tên gần Mộc không mặc định hai người là một nhân vật hay họ hàng.

- Đánh thường — **Lá Gửi**: projectile đơn có vệt lá mảnh.
- Kỹ năng tự động — **Gói Gọn**: đặt bảo vệ ngắn lên đồng minh đang bị nhắm nhiều nhất; fallback sang tuyến trước nếu không có dữ liệu threat.
- Nội tại — **Mỗi Người Một Tay**: hỗ trợ hai đồng minh khác nhau tạo một nhịp tăng tốc hành động nhỏ cho bản thân; có cap, không feedback loop vô hạn.
- Tuyệt kỹ thủ công — **Chung Một Mâm**: nối vùng hỗ trợ quanh đội, giảm gián đoạn trong một khoảng hữu hạn; không miễn toàn bộ khống chế/boss mechanic.

Điểm yếu/counter: thiếu chữa trực tiếp, dễ mất liên kết khi đội tản; phải đi cùng healer/tank phù hợp. Leveling củng cố hỗ trợ với giới hạn uptime. Art: silhouette dài nhẹ, dải vải lá xanh buộc thành gói, quạt gập dùng ra hiệu; đường nối không thay model/skill của đồng đội.

### aw2-suong · Sương Lành

Danh tính: sửa những lời nhắn bị nhòe ở quán sớm; nói ít nhưng rất chú ý lời người khác. Bị nhầm với Sương Nhạt và học cách tự giới thiệu thay vì lẩn tránh. Sương Lành là cá nhân ứng viên, không phải bản thể chắc chắn của hiện tượng Sương Nhạt.

- Đánh thường — **Dải Hơi**: projectile mềm, target đơn.
- Kỹ năng tự động — **Trải Sương**: vùng nhỏ gây damage theo nhịp, rời vùng thì ngừng nhận tick; dùng snapshot luật combat, không dựa particle overlap.
- Nội tại — **Nét Còn Rõ**: kẻ địch đứng trong vùng đủ nhịp chịu làm chậm ngắn, có cooldown mỗi mục tiêu.
- Tuyệt kỹ thủ công — **Lối Qua Màn Trắng**: phủ vùng đường thẳng báo trước rồi cuốn vào điểm tác động; không kéo boss nếu không được phép.

Điểm yếu/counter: cần thời gian setup, mục tiêu cơ động thoát vùng; vùng không che mất telegraph địch. Leveling tăng độ ổn định, giữ giới hạn slow/control. Art: khăn trắng viền tím, cuộn giấy nhắn, tay áo có đường hơi ngắt rõ; hiệu ứng dùng hạt/viền, không phủ trắng màn hình.

### aw2-muoi · Muối Đen

Danh tính: luôn chỉ ra điều còn thiếu trong một bữa ăn và học cách góp ý không làm người nấu tổn thương. Thẳng thắn nhưng không coi sự khó nghe là phẩm chất cao hơn người khác. Không biến màu tên thành mô tả đạo đức hay sắc tộc.

- Đánh thường — **Hạt Chạm**: projectile đơn, impact có âm/hình đọc được.
- Kỹ năng tự động — **Nêm Đúng Chỗ**: đánh dấu mục tiêu đang gây nhiều sát thương để giảm sức đòn trong một khoảng hữu hạn.
- Nội tại — **Vị Còn Lại**: basic trúng mục tiêu có dấu gia hạn dấu tới cap, không tự nhân bản dấu sang cả sân.
- Tuyệt kỹ thủ công — **Một Nhúm Đủ Rồi**: phá một phần bảo vệ có thể tẩy của mục tiêu và gây burst vừa phải; boss immunity phải được khai báo, không tự xóa phase barrier.

Điểm yếu/counter: giảm hiệu quả trước địch tẩy dấu hoặc nhiều mục tiêu; không vừa top DPS vừa khống chế mọi đối thủ. Leveling gia tăng debuff trong cap chung. Art: áo xám ấm, lọ gia vị hình bất đối xứng, tay vẽ dấu ngắn; FX dấu có icon riêng ngoài màu tối.

### aw2-nhien · Nhiên

Danh tính: giữ nhịp bếp lúc đông người, giỏi đỡ việc gấp nhưng dễ coi nhịp của mình là nhịp của mọi người. Arc: không thúc người đang cần nghỉ. Lore này là đề xuất mới, không nối tự động tới Nhiên cũ.

- Đánh thường — **Nhịp Chảo**: chuỗi cận chiến có recovery rõ sau đòn cuối.
- Kỹ năng tự động — **Bắt Nhịp**: đòn quét ngắn vào cụm trước mặt, bỏ cast khi không có mục tiêu trong tầm.
- Nội tại — **Bếp Đông**: đánh trúng các mục tiêu khác nhau tạo một nhịp hồi phục năng lượng có giới hạn; không thưởng vô hạn theo summon.
- Tuyệt kỹ thủ công — **Lửa Qua Ba Nhịp**: ba đòn có điểm chạm riêng, có thể dùng để đón lúc địch lộ điểm yếu; ultimate không tự khóa boss suốt animation.

Điểm yếu/counter: recovery sau chuỗi, phải chọn lúc cast; thiếu tự bảo vệ. Leveling phân bổ burst/energy cap, không xóa recovery. Art: dáng tiến về trước, tạp dề đỏ đất, đôi dụng cụ gỗ ngắn; ba impact/vệt riêng, không dùng một video generic đè lên kit.

### aw2-hai · Hải

Danh tính: nhớ đường về qua tiếng bữa cơm chờ, thích hỏi cả người mới đến có phần chưa. Bảo vệ lối rút hơn là luôn đi đầu. Không mặc định thân phận/nghề nghiệp từ phiên bản cũ.

- Đánh thường — **Gạt Sóng**: đòn cận chiến nhẹ có hướng.
- Kỹ năng tự động — **Giữ Lối**: dựng vùng cản ngắn làm chậm kẻ áp sát; collision trận do engine quyết định, không dựng geometry giả trên world.
- Nội tại — **Biết Đường Về**: khi đồng minh thấp máu ở gần, Hải nhận một lớp bảo vệ có cooldown, không stack cho mỗi frame.
- Tuyệt kỹ thủ công — **Bờ Đợi**: đưa lớp chắn thành tuyến bảo vệ trước đội theo vị trí hiện tại; đối thủ đi vòng vẫn có counterplay.

Điểm yếu/counter: chắn theo hướng, bị chia cắt đội, không che damage mọi vị trí. Leveling tăng độ bền trong cap, không tự teleport đội. Art: áo xanh ngọc gọn, khiên cong gợi mặt nước và tay dang hướng lối về; telegraph thân thiện phân biệt với bẫy địch.

### aw2-lien · Liên

Danh tính: sưu tầm các lời hẹn nhỏ viết ở mặt sau giấy gói, không giữ lời hứa thay người khác. Arc: học cách hỏi trước khi lưu ký ức riêng tư. Không mang nguyên cốt truyện Liên legacy sang đây.

- Đánh thường — **Hạt Sen**: projectile đơn, không đồng thời chữa tự động ở mỗi hit.
- Kỹ năng tự động — **Hẹn Sau Cơn Mệt**: đặt chữa theo thời gian lên một đồng minh mất máu, không reset duration để stack vô hạn.
- Nội tại — **Lời Hẹn Còn Đây**: chữa đồng minh đang chịu debuff tạo một lớp kháng ngắt nhỏ; danh sách debuff tương thích cần mechanic chốt.
- Tuyệt kỹ thủ công — **Mở Lời**: tẩy một debuff được phép trên từng đồng minh rồi chữa theo nhịp; không xóa mọi boss condition hoặc hồi sinh.

Điểm yếu/counter: chữa cần thời gian, burst lớn có thể vượt qua, cleanse chọn lọc. Leveling cân bằng tick/cleanse cooldown. Art: tay áo hồng trầm, túi giấy lời hẹn, motif hạt mở thành vòng; icon cleanse rõ và không dùng hình hoa sẵn có của nhân vật ngoài dự án.

### aw2-moc · Mộc

Danh tính: ép lá đánh dấu mùa đã đi qua; sợ đánh rơi ký ức đến mức từng không dám mở gói đã cất. Arc: chia sẻ ký ức để nó tiếp tục sống. Không xác nhận tuổi/hệ/lore từ tên cũ.

- Đánh thường — **Nét Lá**: projectile đơn đi có tốc độ, va chạm dựa luật.
- Kỹ năng tự động — **Gieo Dấu**: đặt vùng dấu tồn tại hữu hạn dưới mục tiêu, kích hoạt một lần khi đủ nhịp/điều kiện.
- Nội tại — **Mùa Nối Mùa**: dùng skill ở vị trí mới thay dấu cũ bằng một lợi thế ngắn; không để vô hạn vùng active.
- Tuyệt kỹ thủ công — **Mở Gói Mùa Xanh**: kết tụ các dấu đang hợp lệ thành một đợt damage vùng có báo trước; không summon thêm đồng minh vượt đội 5.

Điểm yếu/counter: cần setup, đổi vị trí liên tục làm lỡ cơ hội, số vùng active bị giới hạn. Leveling tăng chất lượng dấu, không tăng vô hạn số vùng/tick. Art: áo vàng lá nhạt, bó lá ép và sợi buộc, dáng nghiêng nhẹ; ultimate có silhouette lá gốc riêng, không lấy particle generic thay authored skill.

### aw2-bach · Bách

Danh tính: biết buộc những gói quà chắc tay nhưng thường buộc cảm xúc của mình quá chặt. Arc: để người nhận được chọn mở hay giữ. Không giữ nguyên vai trò cốt truyện/tính cách Bách Soul of Meal theo mặc định.

- Đánh thường — **Mối Buộc**: cận chiến chậm, điểm chạm nặng.
- Kỹ năng tự động — **Gói Chắc**: khiên cá nhân tăng độ vững; thời gian tồn tại/cap mechanic duyệt.
- Nội tại — **Chia Phần**: sau khi đỡ đủ một ngưỡng hợp lệ, chia một lớp bảo vệ cho đồng minh gần; một trigger mỗi khoảng nghỉ, không chuyển damage thành tài nguyên vô hạn.
- Tuyệt kỹ thủ công — **Mở Vòng Dây**: tháo khiên còn lại thành vùng bảo vệ đội và một impact ngắn lên tuyến trước; phải đánh đổi khiên cá nhân, không vừa giữ toàn bộ vừa nhân đôi.

Điểm yếu/counter: chậm, cần lựa chọn lúc đổi khiên sang hỗ trợ, chịu áp lực khi bị đánh xa nhiều hướng. Leveling giữ tradeoff và cap chia phần. Art: vai vuông, vạt áo xanh sẫm, dây buộc vải bản to và tấm chắn chia ô nguyên bản; tránh dùng biểu tượng tôn giáo/triều đại như họa tiết vô căn cứ.

### aw2-van · Vân

Danh tính: giữ những mẩu chuyện về một bữa ăn không ai nhớ trọn, nhưng chưa biết mẩu nào thuộc mình. Không xác nhận là người vắng mặt trong arc AW2-002, không mặc định “đấng cứu thế” hoặc nguyên nhân Sương Nhạt. Recipe affiliation là motif hư cấu, chưa phải một món ăn cần khai báo công thức thật.

- Đánh thường — **Mảnh Âm**: projectile đơn, sức mạnh theo ngân sách hybrid thay vì tự vượt cả striker/healer.
- Kỹ năng tự động — **Nối Hai Đầu**: hỗ trợ đồng minh đang bị đe dọa đồng thời đánh dấu địch gần đó; nếu một bên không hợp lệ, chỉ thực hiện nửa còn hợp lệ.
- Nội tại — **Nhớ Một Phần**: khi dấu kết thúc, tạo một hiệu ứng nhỏ theo kết quả hỗ trợ; cap/cooldown ngăn self-loop.
- Tuyệt kỹ thủ công — **Bữa Ăn Chưa Gọi Tên**: chọn một trong hai nhấn trước trận, bảo vệ hoặc tấn công; chỉ phát một nhấn và dùng chung slot/energy, không cast đôi miễn phí.

Điểm yếu/counter: hybrid chịu đánh đổi, phải chọn cấu hình trước trận và không thay lúc kết quả đã biết; không có traversal/main-quest unlock độc quyền. Leveling giữ ngân sách chia đôi utility/damage. Art: áo xám ngọc có các mảnh vải ghi nhớ không chữ thương hiệu, hai tay giữ vòng mở lệch; ultimate dùng motif mảnh ghép gốc có silhouette nhận diện, không biến thành ảnh/video của nhân vật khác.

## Đội story 5 và nguồn nhận — PROPOSED

Đội mẫu: `aw2-than` + `aw2-lua` + `aw2-lam` + `aw2-moc-non` + `aw2-suong`: tank/striker/healer/support/mage, đúng 5, chỉ N/R. Đề xuất nhận trực tiếp qua nhập môn trước trận bắt buộc đầu tiên; nếu thiếu slot do import/dev state, chặn bắt đầu và đưa hướng dẫn nhận lại theo receipt an toàn, không tự cấp lặp. Chưa ấn định quest/NPC trao vì AW2-002 và identity vẫn cần review. Đây là đề xuất nguồn nhận, chưa phải grant/economy contract đã duyệt.

Muối Đen là lựa chọn R để thay utility khi cần debuff. Nhiên/Hải/Liên là lựa chọn SR đổi nhịp chiến thuật; Mộc/Bách/Vân là lối xây khác. Test bắt buộc sau balance: đội mẫu N/R hoàn tất story bình thường với tài nguyên sẵn trong story, không dùng SSR/UR, không bắt mua hoặc quay trúng. Không kết luận “đủ sức” bằng văn bản khi chưa có combat simulation/gameplay.

## Art / animation / manifest contract chung — NOT_IMPLEMENTED

Mỗi spirit có `artVariantId` đề xuất `base-v1`, là trường riêng khỏi spiritId. ID manifest đề xuất được sinh từ identity, ví dụ với `aw2-than`: `aw2-than:world:base-v1`, `aw2-than:battle:base-v1`, `aw2-than:portrait:base-v1`; animation/asset owner sẽ duyệt tên đường dẫn/định dạng thực. Không thêm file asset giả hoặc resolve về ảnh của một spirit khác khi thiếu.

- World: pixel/chibi gốc, idle/walk đủ up/down/left/right; pivot/collision foot anchor nhất quán, bóng và tint không thay identity. Chọn pixel grid/frame budget trong AW2-004, chưa tuyên bố đã có atlas.
- HD battle: đúng 8 trạng thái `idle`, `move`, `attack`, `cast`, `hit`, `guard`, `ultimate`, `defeat`, có contact marker và transition/recovery. “HD” không được hiểu là chỉ một portrait phóng lớn.
- Bốn skill ID đề xuất mỗi spirit: `<spiritId>:skill:basic`, `:auto`, `:passive`, `:ultimate`. Mỗi skill trỏ `cast/contact/impact/ultimate` manifest theo nhu cầu; projectile bắt buộc cho kit bắn xa, không tạo projectile giả cho melee contact. Passive VFX có thể chỉ proc icon nếu phù hợp, phải khai báo chủ đích.
- Mỗi ultimate có action/FX nhận diện riêng mô tả tại thẻ; có bản reduced motion và audio cue tương ứng. Renderer đọc ID/event canonical đã duyệt, không ghi đè authored skill bằng geometry placeholder hoặc đoán từ rarity/tên món.
- Portrait, world, battle, projectile/impact/ultimate/audio ghi provenance riêng: creator/source, prompt/reference (nếu có), license/status, generation/export tool/version, review và QA. Hiện trạng **NOT_CREATED / NOT_REVIEWED**; không có asset nào được khai là generated hoặc licensed từ bộ hồ sơ này.
- Từng nhân vật cần QA footprint/4 hướng, đủ 8 HD states, skill contact/range/target fallback, VFX phân biệt địch/đồng minh, mất/hủy/chết giữa cast, reduced motion, tải chậm và provenance trước ART-01/RIGHTS-01 PASS.

Leveling, model và art của cả 12 hiện **NOT_IMPLEMENTED**; writing identity/kit proposal không làm nhân vật đạt Definition of Done. Chỉ mở roster lên 16–20 sau khi 12 nhân vật qua toàn bộ gate.

## Owner review và dependency

Owner duyệt riêng: (1) giữ/sửa 12 identity và tên/món, (2) tier/role từng người và D10, (3) hướng bốn skill/điểm yếu, (4) đội starter nhận trực tiếp, (5) art direction. Có thể duyệt identity mà yêu cầu đổi tier/kit; scretary phải ghi phạm vi duyệt vào DECISIONS/CANON trước runtime hóa. Duyệt roster không duyệt tỷ lệ/pity D11. Không coi im lặng là đồng ý.

Story/character review trong phiên: không tự gán Vân = người vắng mặt, không biến Sương Lành = Sương Nhạt, Mộc Non và Mộc tách ID; lore legacy không tự kế thừa. Mechanic/BA review trong phiên: có đội 5 N/R, mọi kit có counterplay và bốn slot, ultimate điều khiển tay, không requirement UR; khả năng cân bằng thực tế chưa chứng minh. Animation owner còn phải chốt specification/provenance sau review, không khai đã duyệt asset chưa tồn tại.

AW2-004 phụ thuộc identity + visual direction; AW2-005 phụ thuộc rarity/rate/pity/economy được duyệt và simulator; AW2-007 phụ thuộc skill engine/status/range và balance; AW2-010 phụ thuộc đủ tất cả art/runtime/story/test. ART-01, RIGHTS-01, BATTLE-01, WORLD-02, GACHA-01/02 đều **NOT_RUN**. Chỉ kiểm tra tĩnh document IDs/counts/kit slots/proposal labels ngay trong task này.
