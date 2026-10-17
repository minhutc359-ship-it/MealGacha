# Các nhóm thay đổi cần review

| Đường dẫn | Mục đích |
|---|---|
| `public/assets/characters/campaign599/*.webp` | 8 đối thủ × atlas HD, pixel và portrait idle; 32 pose/ID |
| `src/game/enemyVisuals.ts` | Manifest 16 đối thủ hậu truyện; 8 ID mới giữ nguyên mapping, 3 guard và contact |
| `src/game/enemyVfx.ts` | Tám motif code-native có giới hạn thời gian/số hình vẽ |
| `src/components/game/RpgBattleView.tsx` | Chọn guard cho kỹ năng khiên của ba quái phòng thủ |
| `src/components/game/RpgBattleVfx.tsx` | Motif riêng cho đòn thường của cohort 5.9.9 |
| `dev/tests/game/enemy599.test.ts`, `enemy598.test.ts` | Canonical spawn/style, guard/contact, VFX bounds, reducer không thêm warning/phase |
| `dev/tools/verify-creatures599.mjs` | Fixture reducer thật, 4 viewport, 2 engine, clock điều khiển và reduced motion |
| `dev/tools/pack-campaign598.py` | Cho phép đóng gói cohort 598/599 và nối provenance khi sản xuất từng nhóm |
| `dev/tools/release-records.mjs`, `rights/*`, `public/legal/THIRD_PARTY_LICENSES.txt` | Đăng ký provenance 24 WebP mới, không thêm dependency runtime |
| `package.json` | Version 5.9.9 |
| `dev/docs/release/build-size.json`, `dev/docs/web-v599/*` | Dung lượng, bằng chứng kiểm tra, ảnh review và phần bạn nghiệm thu |
| `.gitignore` | Chỉ cho phép ảnh WebP bằng chứng, tránh lặp manifest của QA mode |

Không đổi engine, chỉ số, kỹ năng, spawn pool, save schema/version hoặc tiến trình. Các ảnh chụp dùng fixture HP/năng lượng được điều chỉnh để nhìn rõ, không đại diện cân bằng gameplay.

PR xếp sau #59; review và merge do chủ dự án thực hiện. Các mục Web 6.0 còn lại ở `ROADMAP_STATUS.md`.
