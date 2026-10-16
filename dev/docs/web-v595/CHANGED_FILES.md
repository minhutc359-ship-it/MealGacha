# File và module thay đổi — Web 5.9.5

| Nhóm | Thay đổi |
| --- | --- |
| characterVisuals / starterVfx | Bốn ID P2, portrait, anchor, timing và motif riêng; dùng renderer/mapping đa mode hiện có |
| characterSprites | Bỏ bốn mapping cũ đã chuyển manifest; giải phóng entry lỗi sau lease cuối và bảo vệ retry trước error muộn |
| StarterUltimate | Chọn độc quyền HD hoặc pixel; pixel dự phòng khi HD chưa sẵn sàng, giữ đúng cell/pivot, gỡ cả ba lease/listener |
| Atlas tools / sidecar | Hỗ trợ 16 pose nguồn đầu và nhiều nguồn bổ sung, kiểm tra thiếu pose; đăng ký VFX 3×4 thành runtime 4×3 |
| Media / release | Native manifest bốn ID, gỡ bốn MP4, căn SFX; version, hash inventory, notice và build metrics |
| QA / tài liệu | Kiểm tra kỹ năng/save, image recovery, ba mode/viewport/offline/cache; tiêu chuẩn, prompt/hash và evidence |

## Danh sách đầy đủ

- `.gitignore`
- `dev/docs/release/build-size.json`
- `dev/docs/web-v530/audio-manifest.json`
- `dev/docs/web-v530/media-qa.json`
- `dev/docs/web-v530/movie-manifest.json`
- `dev/docs/web-v595/CHANGED_FILES.md`
- `dev/docs/web-v595/CHARACTER_STANDARD.md`
- `dev/docs/web-v595/UPDATE.md`
- `dev/docs/web-v595/VERIFICATION.md`
- `dev/docs/web-v595/artwork.json`
- `dev/docs/web-v595/asset-qa.json`
- `dev/docs/web-v595/banh-chung.cells.json`
- `dev/docs/web-v595/banh-com-hang-than.cells.json`
- `dev/docs/web-v595/browser-core-qa.json`
- `dev/docs/web-v595/bun-thang.cells.json`
- `dev/docs/web-v595/cha-ca-la-vong.cells.json`
- `dev/docs/web-v595/death-artwork.json`
- `dev/docs/web-v595/evidence/adventure.webp`
- `dev/docs/web-v595/evidence/autochess.webp`
- `dev/docs/web-v595/evidence/offline.webp`
- `dev/docs/web-v595/evidence/portraits.webp`
- `dev/docs/web-v595/evidence/recovery.webp`
- `dev/docs/web-v595/evidence/tcg.webp`
- `dev/docs/web-v595/evidence/ultimate.webp`
- `dev/docs/web-v595/initial-load.json`
- `dev/docs/web-v595/lazy-media-qa.json`
- `dev/docs/web-v595/media-recovery-qa.json`
- `dev/docs/web-v595/metrics.json`
- `dev/docs/web-v595/model-audit.json`
- `dev/docs/web-v595/packing.json`
- `dev/docs/web-v595/resolve-artwork.json`
- `dev/docs/web-v595/support-artwork.json`
- `dev/docs/web-v595/ultimate.cells.json`
- `dev/tests/game/awakening530.test.ts`
- `dev/tests/game/imageRecovery595.test.ts`
- `dev/tests/game/rare595.test.ts`
- `dev/tests/game/visualManifest591.test.ts`
- `dev/tools/pack-rare595.py`
- `dev/tools/pack-starters590.py`
- `dev/tools/release-records.mjs`
- `dev/tools/verify-web595.mjs`
- `package.json`
- `public/assets/characters/rare595/banh-chung-pixel.webp`
- `public/assets/characters/rare595/banh-chung-portrait.webp`
- `public/assets/characters/rare595/banh-chung.webp`
- `public/assets/characters/rare595/banh-com-hang-than-pixel.webp`
- `public/assets/characters/rare595/banh-com-hang-than-portrait.webp`
- `public/assets/characters/rare595/banh-com-hang-than.webp`
- `public/assets/characters/rare595/bun-thang-pixel.webp`
- `public/assets/characters/rare595/bun-thang-portrait.webp`
- `public/assets/characters/rare595/bun-thang.webp`
- `public/assets/characters/rare595/cha-ca-la-vong-pixel.webp`
- `public/assets/characters/rare595/cha-ca-la-vong-portrait.webp`
- `public/assets/characters/rare595/cha-ca-la-vong.webp`
- `public/assets/characters/rare595/ultimate.webp`
- `public/assets/rpg/awakening530/movies/banh-chung.mp4`
- `public/assets/rpg/awakening530/movies/banh-com-hang-than.mp4`
- `public/assets/rpg/awakening530/movies/bun-thang.mp4`
- `public/assets/rpg/awakening530/movies/cha-ca-la-vong.mp4`
- `public/assets/rpg/awakening530/sounds/banh-chung.mp3`
- `public/assets/rpg/awakening530/sounds/banh-com-hang-than.mp3`
- `public/assets/rpg/awakening530/sounds/bun-thang.mp3`
- `public/assets/rpg/awakening530/sounds/cha-ca-la-vong.mp3`
- `public/legal/THIRD_PARTY_LICENSES.txt`
- `rights/ASSET_REGISTER.json`
- `rights/DEPENDENCIES.json`
- `src/components/game/StarterUltimate.tsx`
- `src/game/characterVisuals.ts`
- `src/game/starterVfx.ts`
- `src/infrastructure/assets/characterSprites.ts`
