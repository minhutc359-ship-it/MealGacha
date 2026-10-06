# MealGacha TCG v2 — Luật và bảo trì

## Nội dung đã triển khai

137 thẻ: 112 món từ catalog hiện có (gồm 6 món Tây Bắc), 20 phép thuật mới và 5 đầu bếp huyền thoại. Mỗi lá có ID ổn định, hệ, độ hiếm, giá năng lượng, mô tả kỹ năng và lore. Ảnh món dùng asset trong repository; thẻ bí thuật/đầu bếp dùng biểu trưng và nền bằng CSS.

Sáu chương, mỗi chương ba màn, tổng cộng sáu boss:

| Chương | Người đồng hành | Chủ đề |
|---|---|---|
| Phố Đèn Lồng | Bách | Giữ ký ức bữa cơm gia đình |
| Bến Cảng Than Hồng | Nhiên | Học chia sẻ ngọn lửa |
| Vườn Xanh Tĩnh Lặng | Mộc | Bảo vệ sự sống |
| Biển Ký Ức | Hải | Lắng nghe câu chuyện người khác |
| Thành Phố Đường Sao | Liên | Giữ những điều ước |
| Bữa Tiệc Bình Minh | Cả nhóm | Một bàn ăn đủ chỗ cho tất cả |

Đối thoại trước và sau mỗi màn. Lựa chọn Can đảm/Thấu hiểu thay đổi máu/tay khởi đầu; lựa chọn được ghi trong bản lưu, cùng một kết thúc chung. Hoàn thành lần đầu một màn nhận 100 xu (boss 180), 50 XP và một thẻ cố định; boss thêm một vé gói. Chơi lại không nhận thưởng cốt truyện lần nữa.

## Luật chiến đấu

- Bộ bài đúng 18 lá, tối đa 2 bản mỗi ID, phải sở hữu đủ. Lưu tối đa ba bộ bài; có tự xếp, biểu đồ chi phí, đổi tên và chọn bộ hoạt động.
- Chủ tướng người chơi có 34 máu / 4 lá (Can đảm) hoặc 32 máu / 5 lá (Thấu hiểu). Đối phương 25–38 máu tùy màn; luyện tập 30 máu.
- Mỗi bên có 1 năng lượng ở lượt đầu của chính mình. Mỗi lượt tăng một, tối đa 7, hồi đầy và rút một lá.
- Tối đa 3 đồng minh trên sân. Đồng minh thường đợi tới lượt sau mới đánh; Xung phong được đánh ngay. Mỗi đơn vị đánh một lần/lượt.
- Hai đơn vị chiến đấu gây sát thương đồng thời. Hộ vệ bắt buộc phải bị đánh trước chủ tướng và đồng minh khác; phép sát thương vượt Hộ vệ.
- Lá chắn là lượng sát thương có thể chặn, tiêu hao trước máu. Hút vị hồi chủ tướng theo sát thương thực gây ra, tính cả giới hạn máu còn lại của mục tiêu.
- Triệu hồi đồng minh vào sân có đơn vị cùng hệ: nhận thêm một lá chắn.
- Bí thuật sát thương cần mục tiêu địch; hồi máu tác động chủ tướng; tăng công/máu và thêm lá chắn tác động tất cả đồng minh; các phép tăng công/lá chắn cần có đồng minh trên sân.
- Tay tối đa 8 lá. Rút dư sẽ bỏ thẻ. Không còn thẻ trong bộ: lần rút đầu mất 1 máu, rồi 2, 3… để trận đấu không kéo dài vô tận.
- Hạ chủ tướng địch xuống 0 là thắng. Trận kết thúc chỉ được quyết toán một lần; kết quả và phần thưởng thực nhận lưu cùng trận.

AI ưu tiên triệu hồi, tận dụng sát thương kết liễu, đánh Hộ vệ, chọn đổi có lợi và tránh rút phép khi tay đầy/bộ rỗng. Bộ đối thủ có 18 lá với đường cong năng lượng, tối đa 2 bản mỗi thẻ. Các vùng dùng hệ riêng; chương cuối kết hợp cả năm hệ.

## Kinh tế và sưu tập

- Khởi đầu 300 xu, 50 tinh chất, 2 vé và 2 bản của 9 thẻ khởi đầu.
- Điểm danh +100 xu / +10 tinh chất một lần/ngày. Nhiệm vụ ngày: thắng 2 trận, mở 1 gói, hoàn tất 3 trận. Sáu dấu mốc vĩnh viễn có phần thưởng một lần.
- Luyện tập thắng nhận 25 xu/10 XP nếu tổng trận thắng hôm nay trước trận đó dưới 5; vượt giới hạn vẫn luyện đấu và tăng thống kê. Cốt truyện vẫn nhận thưởng lần đầu, không bị giới hạn này.
- Sáu gói: tất cả hệ và năm gói theo hệ. Mỗi gói ưu tiên tiêu 1 vé, nếu hết vé tiêu 100 xu; luôn nhận 5 lá.
- Tỉ lệ cơ bản: Thường 63%, Hiếm 25%, Sử thi 10%, Huyền thoại 2%. Lá cuối tăng tối thiểu tới Hiếm nếu bốn lá trước đều Thường. Bộ đếm bảo đảm Sử thi chạy chung giữa tất cả gói, reset khi nhận Sử thi/Huyền thoại, nâng lá cuối ở gói thứ 8 nếu chưa có.
- Chế tạo Thường/Hiếm/Sử thi/Huyền thoại tốn 25/70/180/400 tinh chất; phân rã hoặc bản trùng dư nhận 5/15/40/100. Không chế tạo quá 2 bản. Không phân rã bản đang cần trong bất kỳ bộ bài đã lưu.
- Viền ánh kim giá 60 tinh chất, mở một lần cho ID thẻ; chỉ thay đổi hình thức.
- NPC có ba trao đổi xác định theo ngày, đổi một bản dư Thường → Hiếm (+20 xu), Hiếm → Sử thi (+50 xu), Sử thi → Huyền thoại (+150 tinh chất). Mỗi đề nghị dùng một lần/ngày. Giữ lại ít nhất một bản và đủ số bản cho mọi bộ bài.

## Lưu trữ và nâng cấp

- Hồ sơ cũ `foodchest.user.v1` giữ nguyên. TCG lưu riêng ở `foodchest.tcg.v1`, schema `version: 1`.
- Chuyển mỗi dish ID đã từng nhận thành một thẻ TCG, một lần; `legacyImported` bảo vệ khỏi nhập lặp. Khi đã sở hữu 2 bản, chuyển thành tinh chất.
- Bộ bài, bản trùng, foil, lựa chọn, màn đã thắng, bộ đếm bảo đảm, tài nguyên và battle snapshot đều trong save. Mọi hành động ghi trước khi cập nhật UI; nếu ghi lỗi thì hiện thông báo và không áp dụng thay đổi trong bộ nhớ.
- Schema Zod kiểm tra ID, số lượng, giới hạn tay/sân/năng lượng và tài nguyên khi đọc/nhập. JSON TCG có nút xem trước và xác nhận trước khi thay thế. Backup JSON và ZIP của chế độ cũ đều bổ sung TCG; backup cũ không có TCG vẫn nhập được.
- Event `storage` cập nhật tab khác, `focus` và kiểm tra mỗi phút làm mới ngày. Tiến trình là local, chưa có khóa giao dịch nhiều thiết bị hoặc máy chủ chống chỉnh save.
- Giữ ID và storage key ổn định khi patch. Khi đổi schema, thêm migration trước khi nâng version; không xóa storage trong quá trình update.

## Cấu trúc

| File | Vai trò |
|---|---|
| `src/game/types.ts` | Card/deck/save/battle models |
| `src/game/catalog.ts` | Món thành thẻ, thẻ mới, hệ, luật bộ bài |
| `src/game/story.ts` | Chương, màn, đối thoại và thứ tự mở khóa |
| `src/game/battle.ts` | Reducer chiến đấu thuần, AI, khởi tạo và đổi lượt |
| `src/game/progression.ts` | Kinh tế, phần thưởng, gói, bảo đảm, nhiệm vụ, NPC |
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

Các test bao gồm: luật thẻ/bộ bài, năng lượng hai bên, triệu hồi/giới hạn sân, Hộ vệ, Lá chắn/Hút vị/đồng hệ, kiệt sức, mở gói có bảo đảm, không nhận thưởng lặp, NPC giữ đủ thẻ, chuyển bộ sưu tập cũ, kiểm tra backup và 200 trận mô phỏng có seed qua toàn bộ chiến dịch.

Kiểm tra giao diện thủ công hoặc Playwright: desktop 1440px và mobile 390px; điểm danh, gói/lật thẻ, lọc thẻ, chi tiết/Escape, lưu bộ bài, nhiệm vụ, khóa màn, lựa chọn, đấu/tải lại/kết thúc lượt/đầu hàng, hướng dẫn và cài đặt mobile.

## Phạm vi hiện tại

Game đơn người với AI và thương nhân NPC, không có thanh toán. PvP, tài khoản máy chủ và trao đổi giữa người chơi cần backend xác thực, authoritative battle, inventory transaction và chống lặp request. Không trình bày chức năng này như đã có.
