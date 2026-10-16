# File và module thay đổi — Web 5.9.4

| Nhóm | Thay đổi |
| --- | --- |
| Character manifest / VFX | Thêm bốn ID, nhịp, anchor, portrait và motif riêng; các mode kế thừa renderer sẵn có |
| Sprite resolver / SpiritArt / CSS | Bỏ mapping model cũ đã chuyển manifest; chân dung standalone giữ tỷ lệ theo metadata |
| Atlas tools | Hỗ trợ batch familiar594, sidecar nguồn hành động rộng, scale/pivot chung và crop VFX đo riêng |
| Media | Thay bốn manifest MP4 bằng native, gỡ phim, retime bốn SFX; cập nhật media QA và fixture hồi quy MP4 |
| Build / release | Version 5.9.4, gộp nhóm mã chung, giữ lazy Pixi, cập nhật inventory/hash/notice/size |
| Tests / evidence / docs | Kiểm tra bốn kỹ năng thật, nhận diện đa mode, browser QA, offline/load, tiêu chuẩn sản xuất và prompt/provenance |

## Danh sách đầy đủ

- `.gitignore`
- `dev/docs/release/build-size.json`
- `dev/docs/web-v530/audio-manifest.json`
- `dev/docs/web-v530/media-qa.json`
- `dev/docs/web-v530/movie-manifest.json`
- `dev/docs/web-v594/CHANGED_FILES.md`
- `dev/docs/web-v594/CHARACTER_STANDARD.md`
- `dev/docs/web-v594/UPDATE.md`
- `dev/docs/web-v594/VERIFICATION.md`
- `dev/docs/web-v594/actions.json`
- `dev/docs/web-v594/artwork.json`
- `dev/docs/web-v594/asset-qa.json`
- `dev/docs/web-v594/banh-xeo.cells.json`
- `dev/docs/web-v594/browser-qa.json`
- `dev/docs/web-v594/bun-cha.cells.json`
- `dev/docs/web-v594/bun-rieu.cells.json`
- `dev/docs/web-v594/com-ga.cells.json`
- `dev/docs/web-v594/evidence/adventure.webp`
- `dev/docs/web-v594/evidence/autochess.webp`
- `dev/docs/web-v594/evidence/portraits.webp`
- `dev/docs/web-v594/evidence/production.webp`
- `dev/docs/web-v594/evidence/tcg.webp`
- `dev/docs/web-v594/evidence/ultimate.webp`
- `dev/docs/web-v594/initial-load.json`
- `dev/docs/web-v594/lazy-media-qa.json`
- `dev/docs/web-v594/metrics.json`
- `dev/docs/web-v594/model-audit.json`
- `dev/docs/web-v594/packing.json`
- `dev/docs/web-v594/repairs.json`
- `dev/docs/web-v594/support-artwork.json`
- `dev/docs/web-v594/ultimate.cells.json`
- `dev/tests/game/awakening530.test.ts`
- `dev/tests/game/familiar594.test.ts`
- `dev/tests/game/visualManifest591.test.ts`
- `dev/tools/pack-familiar594.py`
- `dev/tools/pack-starters590.py`
- `dev/tools/release-records.mjs`
- `dev/tools/verify-media-loading600.mjs`
- `dev/tools/verify-web594.mjs`
- `package.json`
- `public/assets/characters/familiar594/banh-xeo-pixel.webp`
- `public/assets/characters/familiar594/banh-xeo-portrait.webp`
- `public/assets/characters/familiar594/banh-xeo.webp`
- `public/assets/characters/familiar594/bun-cha-pixel.webp`
- `public/assets/characters/familiar594/bun-cha-portrait.webp`
- `public/assets/characters/familiar594/bun-cha.webp`
- `public/assets/characters/familiar594/bun-rieu-pixel.webp`
- `public/assets/characters/familiar594/bun-rieu-portrait.webp`
- `public/assets/characters/familiar594/bun-rieu.webp`
- `public/assets/characters/familiar594/com-ga-pixel.webp`
- `public/assets/characters/familiar594/com-ga-portrait.webp`
- `public/assets/characters/familiar594/com-ga.webp`
- `public/assets/characters/familiar594/ultimate.webp`
- `public/assets/rpg/awakening530/movies/banh-xeo.mp4`
- `public/assets/rpg/awakening530/movies/bun-cha.mp4`
- `public/assets/rpg/awakening530/movies/bun-rieu.mp4`
- `public/assets/rpg/awakening530/movies/com-ga.mp4`
- `public/assets/rpg/awakening530/sounds/banh-xeo.mp3`
- `public/assets/rpg/awakening530/sounds/bun-cha.mp3`
- `public/assets/rpg/awakening530/sounds/bun-rieu.mp3`
- `public/assets/rpg/awakening530/sounds/com-ga.mp3`
- `public/legal/THIRD_PARTY_LICENSES.txt`
- `rights/ASSET_REGISTER.json`
- `rights/DEPENDENCIES.json`
- `src/components/game/SpiritArt.tsx`
- `src/game/adventureRpg/rpg.css`
- `src/game/characterVisuals.ts`
- `src/game/starterVfx.ts`
- `src/infrastructure/assets/characterSprites.ts`
- `vite.config.ts`
