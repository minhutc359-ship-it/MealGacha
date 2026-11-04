# Soul of Meal · Tactical TCG

Nguồn sự thật triển khai cho bề mặt production hiện tại.

- `/`: Linh Chiến 4×2, mặc định mở thẳng trận.
- `/?tab=campaign`: chiến dịch 4 hồi, 8 nút tuần tự.
- `/?tab=manga`: Manga ký ức.
- `/chest`: Rương Vị Giác được giữ lại.
- Auto Chess, Adventure, AW2 và `/game` đã rời production graph; URL cũ redirect về `/`.

Mã chính: `src/game/tacticalTcg`, `src/components/game/TacticalBattleScreen.tsx`, `src/components/game/TacticalCampaignScreen.tsx`.

Không tự merge hoặc deploy. Nhánh giao hàng: `game/tactical-tcg`.
