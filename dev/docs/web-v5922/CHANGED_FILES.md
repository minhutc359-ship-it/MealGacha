# Phạm vi thay đổi

- `src/game/characterVisuals.ts`: sáu model Tây Bắc, portrait canon, cast anchor và sáu cột VFX; bỏ tên phụ không có consumer, giữ các tên UI trong catalog/awakening.
- `public/assets/characters/northwest5922/`: 12 atlas model HD/pixel và một atlas VFX 6×3.
- `dev/tools/pack-campaign598.py`, `pack-northwest-vfx5922.py`: đóng gói pixel Imagegen theo nhận diện và ghi prompt/hash/crop.
- `dev/tests/game/northwest5922.test.ts`, `visualManifest591.test.ts`: identity/resolver, contact và sáu cột VFX, cập nhật 71 bộ model.
- `dev/tools/inspect-character-atlas.py`, ba harness `verify-spirits5910`, `verify-showcase-modes597`, `verify-showcase-production597`: ảnh QA mặc định ghi cục bộ; báo cáo JSON độc lập. Thêm hai cohort browser bao phủ đủ sáu ID.
- `.gitignore`, `dev/AGENTS.md`: quy tắc không commit ảnh QA; loại 17 ảnh của 5.9.21 khỏi cây file PR đang mở và cập nhật ghi chú báo cáo cũ.
- `src/infrastructure/web/offline.ts`, `webUpdate.test.ts`: làm ấm cả ảnh Canvas/CSS đã tải ở lần cài đầu và kiểm tra hồi quy; harness production xác nhận cache/ảnh offline.
- `package.json`, release size/records, notices và rights: phiên bản 5.9.22 và thông tin 13 asset runtime mới.
- `dev/docs/web-v5922/`: nội dung cập nhật, tiến độ, prompt/hash, inspector/audit và báo cáo bằng chữ/JSON.

Không sửa engine, catalog, dữ liệu kỹ năng/chỉ số, save schema, mở khóa hoặc networking. Không thêm dependency runtime.
