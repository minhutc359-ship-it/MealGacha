# File thay đổi — Web 5.9.6

Phạm vi: so với commit 5.9.5 `4246121132827fcc993b03de3aea0c32c2a2f97e`. Các file của 5.9.5 được liệt kê riêng tại `../web-v595/CHANGED_FILES.md`; cả hai đợt cùng nhánh/PR #58.

## Module chính

- `src/game/characterVisuals.ts`: bốn identity/timing/anchor, nhóm asset và root lookup dùng chung.
- `src/game/starterVfx.ts`: bốn motif hình học grain/phin/seal/autumn.
- `src/infrastructure/assets/characterSprites.ts`: bỏ mapping cũ cho bốn ID đã có manifest.
- `vite.config.ts`: loại registration Pixi không dùng, gom chunk theo consumer, giữ lazy entry và nguyên ngân sách.
- Packer và browser verifier dùng chung được mở rộng; entrypoint 595 tương thích, bổ sung wrapper 596.
- Hai bộ test identity/manifest; manifest audio/movie/media, release register, build-size và notices được cập nhật.

## Asset và bằng chứng

13 WebP mới tại `public/assets/characters/rare596/`; bốn MP3 sửa ở đường dẫn cũ; bốn MP4 hết consumer được gỡ. Prompt, SHA-256 nguồn/output, sidecar, QA và chuẩn sản xuất ở thư mục này. Ảnh source và toàn bộ capture thô không đưa vào build; chỉ giữ evidence WebP đã xem.

## Danh sách đầy đủ

A = thêm; M = sửa; D = gỡ.

Tổng **78 file** trong đợt này.

```text
M .gitignore
M dev/docs/release/build-size.json
M dev/docs/web-v530/audio-manifest.json
M dev/docs/web-v530/media-qa.json
M dev/docs/web-v530/movie-manifest.json
A dev/docs/web-v596/CHANGED_FILES.md
A dev/docs/web-v596/CHARACTER_STANDARD.md
A dev/docs/web-v596/UPDATE.md
A dev/docs/web-v596/VERIFICATION.md
A dev/docs/web-v596/artwork.json
A dev/docs/web-v596/asset-qa.json
A dev/docs/web-v596/browser-core-qa.json
A dev/docs/web-v596/bundle-budget.json
A dev/docs/web-v596/ca-phe-trung.cells.json
A dev/docs/web-v596/cha-ruoi.cells.json
A dev/docs/web-v596/chest-input-qa.json
A dev/docs/web-v596/civet-repairs.json
A dev/docs/web-v596/com-lang-vong.cells.json
A dev/docs/web-v596/evidence/adventure.webp
A dev/docs/web-v596/evidence/autochess.webp
A dev/docs/web-v596/evidence/identity-comparison.webp
A dev/docs/web-v596/evidence/offline.webp
A dev/docs/web-v596/evidence/portraits.webp
A dev/docs/web-v596/evidence/production-arena.webp
A dev/docs/web-v596/evidence/production-chest.webp
A dev/docs/web-v596/evidence/recovery.webp
A dev/docs/web-v596/evidence/tcg.webp
A dev/docs/web-v596/evidence/ultimate.webp
A dev/docs/web-v596/initial-load.json
A dev/docs/web-v596/lazy-media-qa.json
A dev/docs/web-v596/metrics.json
A dev/docs/web-v596/model-audit.json
A dev/docs/web-v596/packing.json
A dev/docs/web-v596/production-renderer-qa.json
A dev/docs/web-v596/removed-movies.json
A dev/docs/web-v596/repairs.json
A dev/docs/web-v596/resolve-artwork.json
A dev/docs/web-v596/support-artwork.json
A dev/docs/web-v596/thit-kho-trung.cells.json
A dev/docs/web-v596/ultimate.cells.json
M dev/tests/game/rare595.test.ts
M dev/tests/game/visualManifest591.test.ts
M dev/tools/pack-rare595.py
M dev/tools/pack-starters590.py
M dev/tools/release-records.mjs
M dev/tools/verify-media-loading600.mjs
A dev/tools/verify-visual-roster.mjs
M dev/tools/verify-web595.mjs
A dev/tools/verify-web596.mjs
M package.json
A public/assets/characters/rare596/ca-phe-trung-pixel.webp
A public/assets/characters/rare596/ca-phe-trung-portrait.webp
A public/assets/characters/rare596/ca-phe-trung.webp
A public/assets/characters/rare596/cha-ruoi-pixel.webp
A public/assets/characters/rare596/cha-ruoi-portrait.webp
A public/assets/characters/rare596/cha-ruoi.webp
A public/assets/characters/rare596/com-lang-vong-pixel.webp
A public/assets/characters/rare596/com-lang-vong-portrait.webp
A public/assets/characters/rare596/com-lang-vong.webp
A public/assets/characters/rare596/thit-kho-trung-pixel.webp
A public/assets/characters/rare596/thit-kho-trung-portrait.webp
A public/assets/characters/rare596/thit-kho-trung.webp
A public/assets/characters/rare596/ultimate.webp
D public/assets/rpg/awakening530/movies/ca-phe-trung.mp4
D public/assets/rpg/awakening530/movies/cha-ruoi.mp4
D public/assets/rpg/awakening530/movies/com-lang-vong.mp4
D public/assets/rpg/awakening530/movies/thit-kho-trung.mp4
M public/assets/rpg/awakening530/sounds/ca-phe-trung.mp3
M public/assets/rpg/awakening530/sounds/cha-ruoi.mp3
M public/assets/rpg/awakening530/sounds/com-lang-vong.mp3
M public/assets/rpg/awakening530/sounds/thit-kho-trung.mp3
M public/legal/THIRD_PARTY_LICENSES.txt
M rights/ASSET_REGISTER.json
M rights/DEPENDENCIES.json
M src/game/characterVisuals.ts
M src/game/starterVfx.ts
M src/infrastructure/assets/characterSprites.ts
M vite.config.ts
```
