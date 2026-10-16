# SOUL OF MEAL — Kế hoạch nâng cấp đồ họa nhân vật toàn diện

CHARACTER VISUAL OVERHAUL · Đề xuất lộ trình Web 5.9 → 6.0

Mục tiêu của bản cập nhật này là đưa Soul of Meal từ hệ thống nhân vật có hình minh họa và animation cơ bản lên hệ thống nhân vật anime RPG có nhận diện riêng, chuyển động mượt, kỹ năng đặc trưng và tuyệt kỹ điện ảnh.

Tôi đề xuất không nâng cấp hàng loạt một cách dàn trải. Thay vào đó, hoàn thiện lần lượt từng nhân vật, xây dựng một tiêu chuẩn đồ họa thống nhất để các nhân vật mới sau này có thể kế thừa.

## 1. Hiện trạng và định hướng

Tôi đã kiểm tra repository [MealGacha trên GitHub](https://github.com/minhutc359-ship-it/MealGacha?utm_source=chatgpt.com). Code hiện có các tài nguyên riêng cho năm đầu bếp Bách, Hải, Liên, Mộc và Nhiên, hệ thống sprite, portrait, animation, hiệu ứng chiến đấu và các đoạn tuyệt kỹ.

Repository cũng đã có tài liệu phát triển đến nhóm `web-v584`, mới hơn mốc Web 4.8 trước đây. Vì vậy, kế hoạch này sẽ lấy code hiện tại làm nền, tận dụng asset đã có và tránh làm lại những phần vẫn sử dụng tốt.

Những mục tiêu chính

Ưu tiên 5 nhân vật đầu tiên

01 · Đồ họa

Ngoại hình đẹp, dễ nhận diện

02 · Animation

Chuyển động có trọng lượng, không cứng

03 · Combat VFX

Kỹ năng có bản sắc riêng

04 · Đồng bộ

Dùng chung asset giữa các chế độ

### Phong cách mỹ thuật đề xuất

Nhân vật 2.5D anime

Sprite nhiều lớp, cel shading, nhận diện rõ ở kích thước nhỏ.

Chiến đấu cinematic

Hiệu ứng có chiều sâu, chuyển động camera và ánh sáng có kiểm soát.

Hình ảnh tham khảo cho định hướng mỹ thuật, không phải asset hiện có của Soul of Meal.

Đề xuất sử dụng 2D/2.5D với sprite, skeletal animation hoặc mesh deformation, không chuyển toàn bộ game sang 3D. Hướng này phù hợp hơn với game web, dễ tối ưu dung lượng và tái sử dụng hình ảnh giữa các chế độ.

## 2. Kế hoạch chi tiết cho 5 Vị Linh đầu tiên

Hiện tại, năm Vị Linh đã được nâng cấp HD gồm Cơm tấm, Bánh mì, Phở bò, Bánh cuốn và Xôi. Mỗi nhân vật mới có bốn tư thế chính: `idle`, `windup`, `contact`, `cast`.

Trong bản nâng cấp tiếp theo, mỗi nhân vật sẽ có một gói đồ họa độc lập: ngoại hình, chuyển động, kỹ năng, tuyệt kỹ, âm thanh, chân dung, hiệu ứng tương tác và phiên bản hiển thị ở cả ba chế độ.

01\. Cơm tấm — Kim Sư

Ưu tiên mẫu đầu tiên

Hệ Bếp · Đỡ đòn · Sư Tử Gạo Ấm

- Model: sư tử vàng, bộ giáp lấy cảm hứng từ hạt gạo, khiên hình mâm cơm, hoa văn Việt Nam.
- Animation: thở và quan sát đồng đội, chạy nặng có lực, chắn đòn, phản kích, ngã và đứng dậy.
- VFX: lá chắn nhiều lớp, hạt gạo phát sáng, hiệu ứng khi khiên vỡ và khi bảo vệ đồng minh.
- Tuyệt kỹ Thiên Thành: dựng thành lũy vàng quanh đội, phản đòn bằng sóng năng lượng hình sư tử.

02\. Bánh mì — Hỏa Vũ

Hệ Hỏa · Đột kích · Hồ Ly Vỏ Giòn

- Model: hồ ly đỏ cam, đuôi lửa, trang phục năng động, điểm nhấn lấy cảm hứng từ vỏ bánh giòn.
- Animation: chạy lướt nhanh, né tránh, combo hai lần chém và đòn kết thúc có lực.
- VFX: vệt lửa, tia than, bùng nổ tại điểm chạm và hiệu ứng thiêu đốt kéo dài.
- Tuyệt kỹ Cửu Trảm: liên hoàn chém tốc độ cao, bóng lửa xuất hiện theo hướng di chuyển, nhát cuối phá khiên.

03\. Phở bò — Long Lưu

Hệ Thủy · Pháp vị · Long Ngư Hơi Nước

- Model: long ngư trắng ngọc, đường nét mềm, râu và vây chuyển động như dòng nước.
- Animation: lơ lửng nhẹ, xoay mình khi niệm phép, phóng thủy kích và thu hồi năng lượng.
- VFX: hơi nước, xoáy thủy lưu, bọt nước, hiệu ứng đóng băng và vỡ băng.
- Tuyệt kỹ Băng Long: long ảnh nước xoáy qua toàn bộ địch, băng kết tinh rồi vỡ khi gây sát thương.

04\. Bánh cuốn — Vân Cuộn

Hệ Mộc · Hồi phục · Ngọc Thố Hơi Mỏng

- Model: ngọc thố trắng xanh, trang phục và dải lụa lấy cảm hứng từ lớp bánh mỏng.
- Animation: chuyển động tai, lụa, nhảy ngắn, niệm phép, chăm sóc đồng minh bị thương.
- VFX: lá non, hoa, những vòng sáng hồi máu, các dải lụa năng lượng nối với đồng minh.
- Tuyệt kỹ Đoàn Viên: trải vòng tròn hồi phục dưới đội hình, giải trạng thái bất lợi và tạo làn sóng năng lượng tiếp sức.

05\. Xôi — Kim Noãn

Hệ Bếp · Khống chế tuyến trước · Gấu Nếp Mới trong catalog Auto Chess

- Model: ưu tiên giữ nhận diện gấu nếp ấm áp, sử dụng giáp vải và các dải lá gói xôi.
- Animation: đi nặng, dậm đất, lao tới, húc và choáng mục tiêu, ăn mừng sau chiến thắng.
- VFX: bụi vàng, chấn động mặt đất, hạt nếp phát sáng và vòng choáng.
- Tuyệt kỹ Thiết Trận: tạo lớp bảo vệ tuyến trước, thu hút địch rồi quét sóng chấn động.

Concept minh họa là định hướng đề xuất, không phải thiết kế cuối cùng. Tên và cơ chế tuyệt kỹ được đối chiếu theo bộ kỹ năng hiện tại; phần diễn hoạt là đề xuất mới.

### Hai điểm cần đồng bộ trước khi vẽ hàng loạt

Danh sách khởi đầu chưa hoàn toàn giống nhau.

Trong Adventure, `STARTERS` hiện gồm Cơm tấm, Bánh mì, Phở bò, Bánh cuốn và Gỏi cuốn tôm thịt. Trong khi đó bộ HD mới lại chọn Xôi. Kế hoạch cần bổ sung Gỏi cuốn vào nhóm ưu tiên hoặc thống nhất lại danh sách nhân vật, không tự ý thay đổi nhân vật người chơi đang sở hữu.

Nhận diện Xôi đang có sai khác.

Catalog Auto Chess gọi nhân vật là Gấu Nếp Mới, nhưng mô tả art HD 5.8.3 lại dùng hạc trắng vàng. Tôi đề xuất chốt thiết kế canon trước khi dựng animation, tránh trường hợp portrait, model trong trận và cinematic trông như ba nhân vật khác nhau.

## 3. Tiêu chuẩn đồ họa cho mỗi nhân vật

Mỗi nhân vật phải trải qua sáu hạng mục sản xuất, thay vì chỉ thay một ảnh nhân vật.

| Hạng mục         | Sản phẩm cần có                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Character design | Concept trước/sau/bên, bảng màu, biểu cảm, phụ kiện, bản hướng dẫn tỷ lệ cơ thể            |
| Portrait/UI      | Chân dung, ảnh hồ sơ, thẻ Vị Linh, icon nhỏ, hình kết quả gacha                            |
| Model chiến đấu  | Sprite hoặc rig 2.5D có các điểm neo: chân, đầu, tay/vũ khí, tâm kỹ năng                   |
| Animation        | Idle, đi, chạy, tấn công, niệm phép, trúng đòn, ngã, triệu hồi, thắng, trạng thái đặc biệt |
| VFX/SFX          | Hiệu ứng riêng của đòn đánh, kỹ năng chính, kỹ năng hỗ trợ, tuyệt kỹ và tương tác hệ       |
| Cinematic        | Cut-in nhân vật, biểu cảm, camera, tuyệt kỹ, hiệu ứng âm thanh và chuyển về trận đấu       |

Định mức animation đề xuất:

# 10–12

Trạng thái chuyển động

# 4

Hướng di chuyển Adventure

# 2.4–3.5s

Cinematic tuyệt kỹ

Mỗi chuyển động phải có nhịp chuẩn bị (anticipation), hành động chính (action/contact), hồi về tư thế (recovery). Số khung hình vật lý có thể thay đổi tùy nhân vật; dùng rig và chuyển động nội suy để tăng độ mượt mà không phải tạo hàng chục ảnh lớn cho mỗi kỹ năng.

Điều kiện quan trọng: animation phải đồng bộ với thời điểm tác động thực tế trong engine. Không được để kỹ năng gây sát thương xong mới xuất hiện hình ảnh chém, hoặc khiên đã hết mà animation vẫn thể hiện đang được bảo vệ.

## 4. Nâng cấp 5 đầu bếp và nhân vật dẫn truyện

Song song với Vị Linh, năm đầu bếp Bách, Nhiên, Mộc, Hải và Liên cần được xây dựng thành các nhân vật anime RPG hoàn chỉnh. Đây là nhóm quan trọng để làm cho cốt truyện có sức sống.

| Nhân vật | Định hướng đồ họa                                             | Animation đặc trưng                                             |
| -------- | ------------------------------------------------------------- | --------------------------------------------------------------- |
| Bách     | Trang phục đầu bếp kết hợp họa tiết văn hóa Việt, ánh vàng ấm | Cầm sổ công thức, chào người chơi, nấu ăn, chỉ huy đội hình     |
| Nhiên    | Năng động, đỏ cam, hiệu ứng lửa quanh trang phục              | Tung chảo, tạo lửa, chạy nhanh, biểu cảm mạnh khi chiến đấu     |
| Mộc      | Tông xanh ngọc, dây leo, họa tiết thực vật                    | Chăm cây, gọi rễ, điều khiển lá và tạo kết giới hồi phục        |
| Hải      | Tông xanh biển, phụ kiện lấy cảm hứng từ sóng nước            | Điều khiển dòng nước, tạo thủy ấn, chuyển động mềm và chính xác |
| Liên     | Tông tím hồng, ánh sao và hoa văn huyền ảo                    | Xoay người, triệu hồi ánh sáng, phép thuật dạng dải lụa         |

Mỗi đầu bếp sẽ có hai bộ chuyển động chính: bộ khám phá với các hoạt ảnh đi lại, trò chuyện, tương tác NPC, và bộ chiến đấu với đòn đánh, kỹ năng và tuyệt kỹ. Chân dung hội thoại cần thêm khoảng 5–7 biểu cảm riêng, nhưng có thể tận dụng cùng một bộ model nguồn.

## 5. Lộ trình mở rộng cho toàn bộ nhân vật

## P0

Nhóm mẫu chuẩn — 5 Vị Linh HD + Gỏi cuốn

Hoàn thiện nhận diện, animation, ba kiểu VFX và cinematic của từng nhân vật. Giải quyết sự không thống nhất giữa roster Adventure và bộ HD.

## P1

5 đầu bếp và nhóm nhân vật thường xuyên xuất hiện

Bách, Hải, Nhiên, Mộc, Liên; tiếp theo Bún chả, Bún riêu, Bánh xèo, Cơm gà và các nhân vật có tần suất xuất hiện cao. Ưu tiên độ sắc nét và các hành động thực sự được sử dụng trong game.

## P2

Nhân vật hiếm, sử thi, huyền thoại

Thiết kế tỷ lệ chi tiết tăng dần theo độ hiếm: trang phục, lớp aura, hiệu ứng triệu hồi, biểu tượng cấp bậc. Tuy nhiên phải giữ silhouette và danh tính gốc. Không dùng VFX lớn để làm thay đổi sức mạnh hoặc che mất thông tin chiến đấu.

## P3

Quái, tinh anh và boss

Thiết kế rõ silhouette, tấn công có cảnh báo, hiệu ứng chuyển pha, trúng đòn, choáng, gục và chiến thắng. Mỗi boss có tối thiểu một hiệu ứng đặc trưng theo vùng; tập trung vào khả năng quan sát và phản ứng của người chơi.

Với roster lớn, tôi đề xuất sử dụng ba cấp độ hoàn thiện: Hero Quality cho nhân vật chủ chốt, Standard Quality cho quân thường và Boss Quality cho boss/tinh anh. Như vậy game sẽ thống nhất hơn mà không phải đầu tư cùng một lượng asset vào tất cả các nhân vật.

## 6. Cấu trúc kỹ thuật và tái sử dụng

Không nên để từng chế độ tự giữ một phiên bản sprite và hiệu ứng khác nhau.

Character Visual Manifest

Character ID · Portrait · Animation · VFX · SFX · Cut-in

Shared Character Renderer

Quản lý atlas, pose, animation timeline, bộ nhớ và chất lượng hình ảnh

Adventure

Khám phá, kỹ năng, ultimate

Auto Chess

Combat, nâng sao, chiến thắng

TCG

Thẻ bài, triệu hồi, va chạm

Các phần code nên ưu tiên mở rộng thay vì thay mới là `characterSprites.ts`, `CharacterSprite.tsx`, `combatArt.ts`, `actorPresentation.ts`, `RpgBattleView.tsx` và `RpgCinematic.tsx`.

Cần bổ sung một manifest cho mỗi nhân vật, quy định thời điểm hit, mốc âm thanh, điểm phát đạn, sprite atlas, fallback và chế độ reduced-motion. Asset khi tích hợp phải có đường dẫn ổn định, không thay ID nhân vật hoặc cấu trúc dữ liệu lưu hiện tại.

## 7. Ngân sách dung lượng và tối ưu hiệu năng

GIỚI HẠN BUILD HIỆN TẠI THEO TÀI LIỆU WEB 5.8.4

# 259.78 MB

/ 260 MB

Chỉ còn khoảng 0.225 MB trước khi chạm giới hạn build hiện tại. Đây là dung lượng toàn bộ sản phẩm, không phải dung lượng người chơi tải ngay ở màn hình đầu.

Để thêm gói đồ họa chất lượng cao, cần giải phóng dung lượng hoặc thay đổi chiến lược phân phối. Tôi đề xuất ngân sách mục tiêu khoảng 5–8 MB dữ liệu nén cho đợt đầu (năm Vị Linh cùng tài nguyên dùng chung), nhưng không tăng tổng build nếu chưa được phê duyệt.

| Biện pháp                       | Mục đích                                                                 |
| ------------------------------- | ------------------------------------------------------------------------ |
| Chuẩn hóa atlas WebP có alpha   | Giảm ảnh dư, giảm lặp và kiểm soát kích thước                            |
| Tái sử dụng VFX theo hệ         | Dùng một nguồn hiệu ứng, tùy biến màu và hình dạng theo nhân vật         |
| Tải cinematic khi cần           | Không tải toàn bộ video khi người chơi mở game                           |
| Rà soát video cũ                | Loại trùng lặp, thay thế có kiểm soát, không hy sinh chất lượng đã duyệt |
| Giữ bộ nhớ hình ảnh có giới hạn | Tránh giật hoặc hết bộ nhớ sau nhiều trận                                |
| Chất lượng Adaptive             | 60 FPS mục tiêu ở desktop phù hợp; 30 FPS ổn định trên thiết bị yếu      |

Renderer hiện có hệ thống cache và nhịp 30/60 FPS, nên cần đo hiệu năng thực tế trước khi quyết định có thêm giải pháp rendering khác. Các kỹ thuật như cache thành phần tĩnh, tách lớp Canvas và hạn chế vẽ lại không cần thiết cũng phù hợp với hướng dẫn tối ưu từ MDN.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://developer.mozilla.org\&sz=32)

MDN



## 8. Timeline triển khai đề xuất

Đây là thời gian ước tính, tính cho một luồng phát triển liên tục có hỗ trợ tạo asset bằng AI và kiểm thử thủ công.

Tuần 1 · Audit và chốt Art Bible

5.9.0

Rà soát toàn bộ asset, xác định thiết kế chuẩn, giải quyết khác biệt Xôi/Gỏi cuốn, tạo manifest và bộ kiểm tra atlas.

Tuần 2 · Hoàn thiện Cơm tấm

5.9.1

Dùng Cơm tấm làm mẫu đầu tiên: model, chuyển động, combat VFX, cinematic, kiểm thử đồng bộ ba chế độ.

Tuần 3–4 · Hoàn thiện bốn Vị Linh tiếp theo

5.9.2

Bánh mì, Phở bò, Bánh cuốn, Xôi; thêm phần đồ họa còn thiếu cho Gỏi cuốn theo kết quả audit.

Tuần 5 · Nâng cấp nhân vật dẫn truyện

5.9.3

Năm đầu bếp, tương tác NPC, chuyển động trong làng, chân dung và biểu cảm hội thoại.

Tuần 6–7 · Mở rộng roster

5.9.4

Các Vị Linh thường gặp, ưu tiên nhân vật được sử dụng nhiều, tinh anh và boss có tần suất cao.

Tuần 8 · Visual Polish & Release QA

6.0

Kiểm thử máy yếu, Safari, Chrome, desktop/mobile, độ rõ chiến đấu, quyền asset, dung lượng, hồi quy save/PvP và chuẩn bị PR.

## 9. Tiêu chí nghiệm thu

Checklist phát hành

0/10

Portrait, sprite, model chiến đấu và cinematic có cùng nhận diện.

Mỗi nhân vật trong nhóm ưu tiên có đầy đủ các trạng thái animation đã chốt.

Đòn đánh và VFX đồng bộ với thời điểm gây sát thương/hồi máu.

Không có bóng mờ, nhân vật bị cắt, lệch vị trí chân hoặc chồng lớp sai.

Đồ họa hoạt động đúng trong Adventure, Auto Chess và TCG.

Ultimate có thể bật/tắt, bỏ qua và không làm sai thời gian chiến đấu.

Kiểm thử chất lượng 30/60 FPS bằng số liệu thực tế và cơ chế giảm hiệu ứng.

Không tăng build quá giới hạn được duyệt, không mất tiến trình người chơi.

Không đưa asset chưa rõ quyền sử dụng vào bản phát hành thương mại.

Có screenshot/video trước–sau và kết quả QA cho từng nhân vật.

&#x20;Sao chép checklist QA

Đặc biệt, trước khi phát hành thương mại, cần xử lý 13 mục asset đang được đánh dấu cần xác minh quyền sử dụng trong tài liệu Web 5.8.4.

## 10. Thứ tự tôi đề xuất thực hiện

Bắt đầu từ Cơm tấm, vì kỹ năng bảo vệ và phản đòn là một ca kiểm thử tốt cho model, bộ khung chuyển động, VFX phòng thủ, va chạm và tuyệt kỹ. Khi mẫu này đạt tiêu chuẩn, mới nhân rộng pipeline cho bốn nhân vật tiếp theo.

Sau đó hoàn thiện Bánh mì để kiểm thử tốc độ/đòn liên hoàn, Phở bò để kiểm thử phép và hiệu ứng phân lớp, Bánh cuốn cho hồi phục nhiều mục tiêu, cuối cùng là Xôi cho khống chế và tương tác vật lý. Song song phải xử lý sự khác biệt của Gỏi cuốn.

Mỗi đợt nên có một nhánh riêng, screenshot so sánh, báo cáo kích thước asset, benchmark và PR để bạn duyệt. Không tự merge vào `master`, không chỉnh sửa logic chiến đấu hoặc dữ liệu save chỉ vì cập nhật đồ họa.

Kết quả kỳ vọng ở mốc 5.9.3: Có một nhóm Vị Linh và đầu bếp đạt chuẩn mỹ thuật thống nhất, di chuyển có sức sống, chiến đấu có bản sắc và trở thành bộ mẫu để phát triển toàn bộ roster về sau.

Đây là kế hoạch phát triển; tôi chưa thay đổi code hay tạo PR trong lần lập kế hoạch này.