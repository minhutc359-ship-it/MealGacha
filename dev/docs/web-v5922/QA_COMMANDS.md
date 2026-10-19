# Tái tạo kiểm tra

```bash
pnpm typecheck
pnpm typecheck:dev
pnpm test
pnpm test:web-budget
pnpm validate:catalog
pnpm validate:assets
pnpm release:verify
pnpm build
pnpm release:size
pnpm release:rights
node --check dist/sw.js
python3 dev/tools/inspect-character-atlas.py northwest5922 5922
node dev/tools/audit-spirit-production.mjs dev/docs/web-v5922/model-audit.json
```

Browser cần `PLAYWRIGHT_MODULE`, `CHROMIUM_BIN`, `CHROMIUM_LIB_DIR` trỏ tới môi trường QA cục bộ; không thêm dependency vào runtime. Ảnh mặc định ở `.asset-work/qa/`, có thể đổi bằng `QA_CAPTURE_DIR`. Chỉ JSON báo cáo được copy/ghi vào Git.

```bash
QA_COHORT=5922a QA_PORT=4196 QA_OUT=dev/docs/web-v5922/adventure-a node dev/tools/verify-spirits5910.mjs
QA_COHORT=5922b QA_PORT=4197 QA_OUT=dev/docs/web-v5922/adventure-b node dev/tools/verify-spirits5910.mjs
QA_IDS='["banner-tay-bac-goi-rau-don","banner-tay-bac-com-lam","banner-tay-bac-thang-co","banner-tay-bac-thit-trau-gac-bep","com-tam"]' QA_AUTO_IDS='["com-tam","banh-mi","pho-bo","banh-cuon","xoi"]' QA_ASSET_ROOT=northwest5922 QA_OUT=dev/docs/web-v5922/modes node dev/tools/verify-showcase-modes597.mjs
QA_HERO=banner-tay-bac-xoi-ngu-sac QA_WIDTH=320 QA_HEIGHT=568 QA_OUT=dev/docs/web-v5922/production-narrow node dev/tools/verify-showcase-production597.mjs
QA_HERO=banner-tay-bac-ga-nuong-mac-khen QA_OUT=dev/docs/web-v5922/production node dev/tools/verify-showcase-production597.mjs
node dev/tools/measure-web-load.mjs dev/docs/web-v5922/initial-load.json
```

Inspector chỉ cần atlas/provenance cuối, không cần PNG nguồn. Để pack lại nguồn, truyền JSON ID/kind/source/prompt cho `pack-campaign598.py ... northwest5922`, hoặc JSON hai sheet source/prompt/rowFractions/columnFractions cho `pack-northwest-vfx5922.py ...`.
