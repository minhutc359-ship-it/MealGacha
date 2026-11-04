# Soul of Meal · Tactical TCG

Nguồn sự thật triển khai cho bề mặt production hiện tại.

- `/`: sảnh TCG, bộ đang trang bị, tiến trình truyện, quà ngày và hướng dẫn vòng chơi.
- `/?tab=battle`: trận 4×2 dùng bộ bài đã trang bị; sân người chơi trống, tay đầu bốn lá và 3 Lửa Bếp.
- `/?tab=decks`: xây, lưu và trang bị bộ 24 lá (tối đa 2 bản, ít nhất 8 Vị Linh).
- `/?tab=collection`: toàn bộ 181 thẻ cũ, tìm/lọc, đọc luật mới và craft chính xác.
- `/?tab=packs`: mở gói 5 lá, lật từng lá, tỷ lệ/bảo đảm và bản dư → Tinh Vị.
- `/?tab=campaign`: chiến dịch 4 hồi, 8 nút tuần tự.
- `/?tab=manga`: Manga ký ức.
- `/chest`: Rương Vị Giác được giữ lại.
- Chest mới đồng bộ thẻ canonical/Tinh Vị bằng receipt exact-once; reward và collection cũ vẫn nguyên vẹn.
- Linh Chiến có bẫy phản ứng, cửa sổ Tuyệt kỹ, boss ba pha và tutorial trận đầu.
- Có rút bài, Lửa Bếp, triệu hồi, Bí thuật, nội tại vào sân/khi dùng phép/khi bị hạ, nâng sao và Công thức Đồng Vị. Không dùng tổ đội người chơi dựng sẵn trong production.
- Campaign có đối thoại trước/sau, mục tiêu, thẻ thưởng riêng và hai đoạn kết theo lời hẹn của người chơi.
- UI battle hiển thị commander HP, role/trait/HP/energy/shield, inspector đội hình, boss phase và trạng thái bẫy; campaign hiển thị tiến trình 8 node.
- Auto Chess, Adventure, AW2 và `/game` đã rời production graph; URL cũ redirect về `/`.

Mã chính: `src/game/tacticalTcg`, `src/components/game/TacticalBattleScreen.tsx`, `src/components/game/TacticalCampaignScreen.tsx`.

Không tự merge hoặc deploy. Nhánh giao hàng: `game/tactical-tcg`.
