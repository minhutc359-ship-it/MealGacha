# Soul of Meal · Tactical TCG

Nguồn sự thật triển khai cho bề mặt production hiện tại.

- `/`: sảnh TCG, bộ đang trang bị, tiến trình truyện, quà ngày và hướng dẫn vòng chơi.
- `/?tab=battle`: TCG chủ động, hai hàng bài đối diện tối đa 5 Vị Linh mỗi bên, dùng bộ bài đã trang bị; sân người chơi trống, tay đầu bốn lá và 3 Lửa Bếp. Splash art riêng, chủ tướng ra lệnh, vai trò Hộ vệ/Đấu sĩ/Pháp sư/Trợ thủ, công và sát thương cùng thang.
- `/?tab=decks`: xây, lưu và trang bị bộ 24 lá (tối đa 2 bản, ít nhất 8 Vị Linh).
- `/?tab=collection`: toàn bộ 181 thẻ cũ, tìm/lọc, đọc luật mới và craft chính xác.
- `/?tab=packs`: mở gói 5 lá, lật từng lá, tỷ lệ/bảo đảm và bản dư → Tinh Vị.
- `/?tab=campaign`: chiến dịch 4 hồi, 24 chặng có nhánh phụ, 12 trận boss và 16 mục tiêu nhiệm vụ.
- `/?tab=bots`: đấu tự do với bot Normal/Hard/Extreme và 10 bộ đối thủ; miễn phí, không xếp hạng/thưởng PvE.
- `/?tab=manga`: Manga ký ức.
- `/chest`: Rương Vị Giác được giữ lại.
- Chest mới đồng bộ thẻ canonical/Tinh Vị bằng receipt exact-once; reward và collection cũ vẫn nguyên vẹn.
- Linh Chiến có bẫy phản ứng, cửa sổ Tuyệt kỹ, boss ba pha và tutorial trận đầu.
- Có rút bài, Lửa Bếp, triệu hồi, Bí thuật, nội tại vào sân/khi dùng phép/khi bị hạ, nâng sao và Công thức Đồng Vị. Không dùng tổ đội người chơi dựng sẵn trong production.
- Campaign có đối thoại trước/sau, mục tiêu, thẻ thưởng riêng và hai đoạn kết theo lời hẹn của người chơi.
- UI battle hiển thị commander HP, role/trait/HP/energy/shield, inspector đội hình, boss phase và trạng thái bẫy; campaign hiển thị bản đồ 24 chặng.
- Auto Chess, Adventure, AW2 và `/game` đã rời production graph; URL cũ redirect về `/`.

Mã chính: `src/game/tacticalTcg`, `src/components/game/TacticalBattleScreen.tsx`, `src/components/game/TacticalCampaignScreen.tsx`.

Không tự merge hoặc deploy. Nhánh giao hàng: `game/tactical-tcg`.

Luật hiện hành và giới hạn: [PRODUCT_CONTRACT.md](PRODUCT_CONTRACT.md). TCG-011/012 thay thế chỉ số nhân6/10, luật tiền/hậu và điều kiện thắng boss cũ; chứng cứ trước đó là lịch sử.
