# MealGacha TCG v2.2 — Luật và bảo trì

## Nội dung đã triển khai

152 thẻ: 112 món từ catalog hiện có (gồm 6 món Tây Bắc), 20 bí thuật, 5 đầu bếp huyền thoại và 15 thẻ thuộc bộ Đoàn lữ hành (10 đồng minh, 5 bí thuật). Mỗi lá có ID ổn định, hệ, độ hiếm, giá năng lượng, mô tả kỹ năng và lore. Ảnh món dùng asset trong repository; thẻ bí thuật/đầu bếp dùng biểu trưng và nền bằng CSS.

Sáu chương, mỗi chương ba màn, tổng cộng sáu boss:

| Chương | Người đồng hành | Chủ đề |
|---|---|---|
| Phố Đèn Lồng | Bách | Giữ ký ức bữa cơm gia đình |
| Bến Cảng Than Hồng | Nhiên | Học chia sẻ ngọn lửa |
| Vườn Xanh Tĩnh Lặng | Mộc | Bảo vệ sự sống |
| Biển Ký Ức | Hải | Lắng nghe câu chuyện người khác |
| Thành Phố Đường Sao | Liên | Giữ những điều ước |
| Bữa Tiệc Bình Minh | Cả nhóm | Một bàn ăn đủ chỗ cho tất cả |

Đối thoại trước và sau mỗi màn. Lựa chọn Can đảm/Thấu hiểu thay đổi máu/tay khởi đầu; lựa chọn được ghi trong bản lưu, hai đoạn kết khác nhau chọn sau chiến thắng màn cuối, không đổi phần thưởng. Hoàn thành lần đầu một màn nhận 100 xu (boss 180), 50 XP và một thẻ cố định; boss thêm một vé gói. Chơi lại không nhận thưởng cốt truyện lần nữa.

## Luật chiến đấu

- Bộ bài đúng 18 lá, tối đa 2 bản mỗi ID, phải sở hữu đủ. Lưu tối đa ba bộ bài; có tự xếp, biểu đồ chi phí, đổi tên và chọn bộ hoạt động.
- Chủ tướng người chơi có 34 máu / 4 lá (Can đảm) hoặc 32 máu / 5 lá (Thấu hiểu). Đối phương 25–38 máu tùy màn; luyện tập 30 máu.
- Trước trận mới được đổi tối đa 3 lá một lần. Rút từ phần bộ bài còn lại trước, rồi trả các lá đã đổi vào bộ và xáo; có thể nhận cùng ID nếu bộ có bản thứ hai. Trận đang chơi từ bản cũ không buộc đổi lại.
- Mỗi bên có 1 năng lượng ở lượt đầu của chính mình. Mỗi lượt tăng một, tối đa 7, hồi đầy và rút một lá.
- Tối đa 3 đồng minh trên sân. Đồng minh thường đợi tới lượt sau mới đánh; Xung phong được đánh ngay. Mỗi đơn vị đánh một lần/lượt.
- Hai đơn vị chiến đấu gây sát thương đồng thời. Hộ vệ bắt buộc phải bị đánh trước chủ tướng và đồng minh khác; phép sát thương vượt Hộ vệ.
- Lá chắn là lượng sát thương có thể chặn, tiêu hao trước máu. Hút vị hồi chủ tướng theo sát thương thực gây ra, tính cả giới hạn máu còn lại của mục tiêu.
- **Cộng hưởng:** hai lá cùng hệ liên tiếp trong lượt giảm 1 chi phí lá thứ hai, tối thiểu 0; mỗi bên chỉ dùng một lần/lượt. Lá hệ khác ngắt chuỗi, tấn công bằng đơn vị không ngắt. Lượt mới đặt lại.
- Triệu hồi đồng minh vào sân có đơn vị cùng hệ: nhận thêm một lá chắn.
- Bí thuật sát thương cần mục tiêu địch; hồi máu tác động chủ tướng; tăng công/máu và thêm lá chắn tác động tất cả đồng minh; các phép tăng công/lá chắn cần có đồng minh trên sân.
- Quét sân gây sát thương lên tất cả đơn vị địch, tiêu lá chắn trước máu; không gây sát thương lên chủ tướng và không cần chọn mục tiêu.
- Tay tối đa 8 lá. Rút dư sẽ bỏ thẻ. Không còn thẻ trong bộ: lần rút đầu mất 1 máu, rồi 2, 3… để trận đấu không kéo dài vô tận.
- Hạ chủ tướng địch xuống 0 là thắng. Trận kết thúc chỉ được quyết toán một lần; kết quả và phần thưởng thực nhận lưu cùng trận.

AI ưu tiên triệu hồi, tận dụng sát thương kết liễu, đánh Hộ vệ, chọn đổi có lợi và tránh rút phép khi tay đầy/bộ rỗng. Bộ đối thủ có 18 lá với đường cong năng lượng, tối đa 2 bản mỗi thẻ. Các vùng dùng hệ riêng; chương cuối kết hợp cả năm hệ.

## Boss, lựa chọn và hiệu ứng

| Boss | Nội tại đầu lượt địch | Dưới nửa máu |
|---|---|---|
| Kẻ Canh Bếp Cổ | Đồng minh +1 chắn | +2 chắn |
| Hỏa Linh bị tha hóa | Đốt chủ tướng bạn 1 | Đốt 2 |
| Cổ Thụ Quên Lãng | Hồi boss 2 | Hồi 4 |
| Hải Vương Lãng Quên | Rút thêm 1 lá | Rút 2 |
| Thiên Nga Đêm Trắng | Đồng minh +1 chắn | +2 chắn |
| Sương Nhạt | Luân phiên Đốt 1 → Hồi 2 → Rút 1 | Gấp đôi hiệu ứng |

Nội tại chỉ áp dụng boss chiến dịch, không chồng lên luật di vật của thám hiểm. Mỗi lần dùng bài đều chọn và đọc trước; thẻ sát thương chọn mục tiêu, các thẻ khác xác nhận Triệu hồi/Thi triển. Chi phí hiển thị đã tính Cộng hưởng. Dự báo mục tiêu chạy cùng reducer với thao tác thật, gồm chắn, phản đòn, hạ gục và đồng minh bị hạ.

Reducer trả các `BattleFrame` với trạng thái trước/sau và sự kiện của từng hành động. Store quyết toán và lưu **trạng thái cuối một lần**; Board chỉ trình diễn snapshot trong bộ nhớ, khóa thao tác trong lúc chạy. Tải lại bỏ qua phần trình diễn còn lại; không chạy AI lại. Nút bỏ qua và cài đặt giảm chuyển động hiện ngay trạng thái cuối. Chế độ mở rộng che menu để tập trung, tự bật trên điện thoại; Escape trở về nếu không có hộp thoại mở. Âm thanh dùng sound engine có sẵn và tuân theo bật/tắt âm thanh. Hiệu ứng không được đưa vào localStorage hoặc backup.

`narrative.ts` chứa cảnh trước/sau 18 màn, gợi ý, luật boss và hai kết thúc. Hồ sơ manh mối dựa trên ID màn đã vượt, nên không lộ trang khóa và không cần thêm bộ đếm. Đọc lại không phát thưởng. `storyEnding` lưu lựa chọn; chỉ chọn khi đang có trận thắng `last-table-3`, có thể xem lựa chọn khác trong cùng màn kết quả, không cộng lại xu/thẻ.

## Kinh tế và sưu tập

- Khởi đầu 300 xu, 50 tinh chất, 2 vé và 2 bản của 9 thẻ khởi đầu.
- Điểm danh +100 xu / +10 tinh chất một lần/ngày. Nhiệm vụ ngày: thắng 2 trận, mở 1 gói, hoàn tất 3 trận. Chín dấu mốc vĩnh viễn có phần thưởng một lần.
- Luyện tập thắng nhận 25 xu/10 XP nếu tổng trận thắng hôm nay trước trận đó dưới 5; vượt giới hạn vẫn luyện đấu và tăng thống kê. Cốt truyện vẫn nhận thưởng lần đầu, không bị giới hạn này.
- Sáu gói: tất cả hệ và năm gói theo hệ. Mỗi gói ưu tiên tiêu 1 vé, nếu hết vé tiêu 100 xu; luôn nhận 5 lá.
- Tỉ lệ cơ bản: Thường 63%, Hiếm 25%, Sử thi 10%, Huyền thoại 2%. Lá cuối tăng tối thiểu tới Hiếm nếu bốn lá trước đều Thường. Bộ đếm bảo đảm Sử thi chạy chung giữa tất cả gói, reset khi nhận Sử thi/Huyền thoại, nâng lá cuối ở gói thứ 8 nếu chưa có.
- Chế tạo Thường/Hiếm/Sử thi/Huyền thoại tốn 25/70/180/400 tinh chất; phân rã hoặc bản trùng dư nhận 5/15/40/100. Không chế tạo quá 2 bản. Không phân rã bản đang cần trong bất kỳ bộ bài đã lưu.
- Viền ánh kim giá 60 tinh chất, mở một lần cho ID thẻ; chỉ thay đổi hình thức.
- NPC có ba trao đổi xác định theo ngày, đổi một bản dư Thường → Hiếm (+20 xu), Hiếm → Sử thi (+50 xu), Sử thi → Huyền thoại (+150 tinh chất). Mỗi đề nghị dùng một lần/ngày. Giữ lại ít nhất một bản và đủ số bản cho mọi bộ bài.

## Thám hiểm — Con đường qua sương

- Khởi đầu miễn phí với bản sao bộ bài đang trang bị, 34 máu và 40 lương thực. Một chuyến đang diễn ra cần hoàn thành hoặc kết thúc trước khi mở chuyến mới hay trận ở chế độ khác.
- Bảy chặng: giao đấu → gặp gỡ/bếp nghỉ → giao đấu/tinh anh → bếp nghỉ/gặp gỡ → tinh anh/giao đấu → gặp gỡ/bếp nghỉ → Kẻ Nuốt Ký Ức. Chọn một điểm dừng mỗi chặng. Bản đồ và đề nghị thưởng sinh theo seed, lưu cùng chuyến; tải lại không tạo lại các lựa chọn.
- Máu chủ tướng được giữ giữa các trận; sân, năng lượng và tay bài được tạo lại. Thua hay đầu hàng kết thúc chuyến đi. Tinh anh/trùm có +1 công cho mỗi đơn vị khi vào sân.
- Thắng giao đấu nhận 25 lương thực, tinh anh 40; chọn 1 trong 3 thẻ để thay một lá của bộ bài hành trình. Bộ bài vẫn đúng 18 lá, tối đa 2 bản. Có thể giữ nguyên bộ bài. Tinh anh thêm lựa chọn 1 trong 3 di vật chưa sở hữu; xử lý cả hai lựa chọn rồi mới mở chặng tiếp theo.
- Sáu câu chuyện: Chiếc bát còn ấm, Chuyến đò không tên, Chợ lúc nửa đêm, Cây không mùa, Thư viện công thức thất lạc, Đêm bánh sao. Lựa chọn thay đổi máu/lương thực/thẻ/di vật. Không thể chọn phương án thiếu tài nguyên hay khiến máu về 0; luôn có thể giữ hành trang và đi tiếp.
- Bếp nghỉ hồi 12 máu miễn phí hoặc dùng 25 lương thực chọn di vật. Lương thực độc lập với xu của bộ sưu tập.
- Mười di vật: Trâm than hồng (+1 công Hỏa vị), La bàn ký ức (+1 bài mở đầu), Hạt mầm bình minh (hồi 1 máu đầu lượt), Tạp dề bà ngoại (+1 máu đồng minh), Đường pha lê (+1 lá chắn đồng minh), Ấm trà bền bỉ (+4 máu tối đa/hồi 4 ngay), Hài lữ khách (đồng minh đầu trận có Xung phong), Trang sách cháy (+1 sát thương bí thuật), Chén trà đoàn viên (+2 hồi máu của thẻ), Đèn dầu không tắt (2 năng lượng mở đầu). Hiệu lực chỉ trong chuyến đi; không trùng ID.
- Hoàn thành trùm cuối nhận 200 xu, 40 tinh chất, 100 XP và 1 vé, tối đa 3 chuyến hoàn thành được trả thưởng mỗi ngày. Chuyến thứ 4 vẫn tăng thống kê, không trả thưởng. Trận giữa hành trình không nhận tiền luyện tập. Thẻ hành trình không thêm vào bộ sưu tập; 15 thẻ Đoàn lữ hành cũng nằm trong gói thẻ và có thể chế tạo bình thường.
- Nhật ký giữ 20 trận gần nhất ở tất cả chế độ, gồm kết quả, số lượt, thời điểm và phần thưởng thực. Không phải replay. Thống kê chuyến đã mở, chuyến hoàn thành và chặng xa nhất lưu lâu dài.

## Lưu trữ và nâng cấp

- Hồ sơ cũ `foodchest.user.v1` giữ nguyên. TCG lưu riêng ở `foodchest.tcg.v1`, schema `version: 1`.
- Chuyển mỗi dish ID đã từng nhận thành một thẻ TCG, một lần; `legacyImported` bảo vệ khỏi nhập lặp. Khi đã sở hữu 2 bản, chuyển thành tinh chất.
- Bộ bài, bản trùng, foil, lựa chọn, màn đã thắng, bộ đếm bảo đảm, tài nguyên, battle snapshot, hành trình thám hiểm và nhật ký đều trong save. Mọi hành động ghi trước khi cập nhật UI; nếu ghi lỗi thì hiện thông báo và không áp dụng thay đổi trong bộ nhớ.
- Bản lưu v2 chưa có hành trình/nhật ký được bổ sung các trường mặc định, giữ nguyên version và storage key. Schema kiểm tra liên kết giữa hành trình và trận để chặn bản sao lưu thiếu trận đang diễn ra.
- Schema Zod kiểm tra ID, số lượng, giới hạn tay/sân/năng lượng và tài nguyên khi đọc/nhập. JSON TCG có nút xem trước và xác nhận trước khi thay thế. Backup JSON và ZIP của chế độ cũ đều bổ sung TCG; backup cũ không có TCG vẫn nhập được.
- Event `storage` cập nhật tab khác, `focus` và kiểm tra mỗi phút làm mới ngày. Tiến trình là local, chưa có khóa giao dịch nhiều thiết bị hoặc máy chủ chống chỉnh save.
- Giữ ID và storage key ổn định khi patch. Khi đổi schema, thêm migration trước khi nâng version; không xóa storage trong quá trình update.

## Cấu trúc

| File | Vai trò |
|---|---|
| `src/game/types.ts` | Card/deck/save/battle models |
| `src/game/catalog.ts` | Món thành thẻ, thẻ mới, hệ, luật bộ bài |
| `src/game/story.ts`, `src/game/narrative.ts` | Chương, màn, đối thoại và thứ tự mở khóa |
| `src/game/battle.ts` | Reducer chiến đấu thuần, AI, khởi tạo và đổi lượt |
| `src/game/progression.ts` | Kinh tế, phần thưởng, gói, bảo đảm, nhiệm vụ, NPC |
| `src/game/expedition.ts` | Bản đồ có seed, sự kiện, di vật và trạng thái chuyến đi |
| `src/game/storage.ts` | Schema và đọc/ghi bản lưu |
| `src/game/useGameStore.ts` | Các hành động người chơi, kiểm tra và lưu nguyên tử trong tab |
| `src/pages/TCGPage.tsx` | Sảnh, bản đồ, cửa hàng, nhiệm vụ và cài đặt |
| `src/components/game/*` | Thẻ, dialog, đấu trường, thư viện, xưởng, bộ bài và NPC |
| `src/game/tcg.css` | Giao diện desktop/mobile, scope tách chế độ cũ |

## Kiểm tra

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm validate:catalog
pnpm build
```

Các test bao gồm: luật thẻ/bộ bài, năng lượng hai bên, triệu hồi/giới hạn sân, Hộ vệ, Lá chắn/Hút vị/đồng hệ, kiệt sức, mở gói có bảo đảm, không nhận thưởng lặp, NPC giữ đủ thẻ, chuyển bộ sưu tập cũ, kiểm tra backup 200 trận mô phỏng có seed qua toàn bộ chiến dịch, 100 bản đồ thám hiểm, 30 trận mở đầu và 20 chuyến thám hiểm bằng lượt đấu thật, hiệu lực di vật, thay bài, phần thưởng ngày, sự kiện không kẹt và nâng cấp bản lưu v2.

Kiểm tra giao diện thủ công hoặc Playwright: desktop 1440px và mobile 390px; điểm danh, gói/lật thẻ, lọc thẻ, chi tiết/Escape, lưu bộ bài, nhiệm vụ, khóa màn, lựa chọn, đấu/tải lại/kết thúc lượt/đầu hàng, hướng dẫn và cài đặt mobile. Thám hiểm: bản đồ/khóa chặng, vào trận/tải lại, thắng/thay bài, tinh anh/di vật, lựa chọn sự kiện, trùm/kết thúc, nhật ký và không tràn ngang trên mobile.

## Phạm vi hiện tại

Game đơn người với AI và thương nhân NPC, không có thanh toán. PvP, tài khoản máy chủ và trao đổi giữa người chơi cần backend xác thực, authoritative battle, inventory transaction và chống lặp request. Không trình bày chức năng này như đã có.

## Trình diễn chiến đấu v2.3

Bàn đấu cố định theo `100dvh` và safe area, không yêu cầu cuộn trang để chọn bài hoặc đánh mục tiêu. Dọc: hai hàng quân và tối đa hai hàng bài trên tay. Ngang trên màn hình thấp: hai phe cạnh nhau và tay bài một hàng. Phần xác nhận có ô riêng nên chọn bài không đẩy mục tiêu khỏi màn hình. Luật, nhật ký, di vật và toàn văn thẻ đọc trong dialog; Escape hủy chọn hoặc đóng dialog. Điều hướng nền dùng `inert` khi có trận.

`src/game/combatEffects.ts` phân loại hiệu ứng từ cặp snapshot trước/sau: sát thương theo hệ, hồi máu, buff, tạo/vỡ chắn, triệu hồi, rút bài và cộng hưởng. `CombatEffects.tsx` đặt sprite/particle lên đúng chủ tướng, đơn vị hoặc tay bài; Quét sân có hiệu ứng ở từng nạn nhân và phản đòn vẫn hiện trên quân vừa bị hạ. Ba WebP alpha trong `public/assets/tcg/fx/` được tải trước và lưu như Git blob thường để deployment phục vụ đúng ảnh.

Animation chỉ là trình diễn: save cuối cùng vẫn được ghi một lần trước playback. Bỏ qua, giảm chuyển động hoặc tải lại không xử lý sát thương/phần thưởng lần nữa. Không thay đổi mana, cost, luật chắn hay schema lưu trữ ở bản này.

## Nguồn món chung với Rương Vị Giác

`src/infrastructure/catalog/dishCatalog.ts` cung cấp `BUILT_IN_DISHES` cho thẻ món và `mergeDishCatalog` cho Rương. Hiện có 112 món: 58 quanh năm, 48 món theo 8 banner mùa và 6 món Tây Bắc theo banner local. Bí thuật và nhân vật TCG không phải món trong Rương.

Nguồn cache/CSV được ghép trên toàn bộ món cài sẵn; món CSV có ID riêng được giữ, các ghi đè thực đơn thường vẫn được tôn trọng. Món curated/local giữ tên, ảnh và sự kiện theo source để cache cũ không đổi nhầm tính giới hạn. Ba luồng khởi tạo, nạp cache và tải CSV đều dùng cùng hàm ghép. Không đổi lịch sự kiện, storage key hay quyền rương vô hạn đã lưu.

Nút **Xem món & tỉ lệ** trong Rương hiển thị ảnh, tên, bậc hiếm và tìm kiếm không phân biệt dấu/chữ hoa. Danh sách và số món lấy từ `buildPool`: đúng bữa, đúng sự kiện đang hoạt động và đã loại món gần đây khi pool đủ lớn. Thao tác xem/tìm không trừ chìa hay nhận phần thưởng.
