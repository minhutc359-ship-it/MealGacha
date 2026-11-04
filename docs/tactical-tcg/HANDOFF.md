# Handoff

Nhánh: `game/tactical-tcg`.

TCG-003 hoàn tất local: Chest cấp collectible/Tinh Vị exact-once, bẫy/reaction/Tuyệt kỹ dùng được, boss ba pha, merge campaign/PvP đúng số bản, tutorial trận đầu và Manga lazy boundary. Không xóa hoặc ghi đè reward Chest cũ.

Kiểm tra trước merge: checkout đúng remote SHA, chạy `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test`, `pnpm release:verify`, `pnpm build`; sau đó review `/`, `/?tab=campaign`, `/?tab=manga`, `/chest` ở desktop và mobile.

Không đưa các tệp staging ẩn trong `dev/aw2/assets` vào commit. Không merge hoặc deploy nếu chưa hoàn thành QA thiết bị thật.
