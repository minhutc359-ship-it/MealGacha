# Handoff

Nhánh: `game/tactical-tcg`.

Kiểm tra trước merge: checkout đúng remote SHA, chạy `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test`, `pnpm release:verify`, `pnpm build`; sau đó review `/`, `/?tab=campaign`, `/?tab=manga`, `/chest` ở desktop và mobile.

Không đưa các tệp staging ẩn trong `dev/aw2/assets` vào commit. Không merge hoặc deploy nếu chưa hoàn thành QA thiết bị thật.
