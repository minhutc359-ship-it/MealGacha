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
node --check dist/sw.js
python3 dev/tools/inspect-character-atlas.py spirits5921 5921
node dev/tools/audit-spirit-production.mjs dev/docs/web-v5921/model-audit.json
```

Browser scripts cần `PLAYWRIGHT_MODULE`, `CHROMIUM_BIN`, `CHROMIUM_LIB_DIR` trỏ đến Playwright/Chromium cục bộ. Không thêm các dependency QA vào game runtime.

```bash
QA_COHORT=5921 QA_OUT=dev/docs/web-v5921/feast node dev/tools/verify-spirits5910.mjs
QA_COHORT=5917 QA_FOCUS=1 QA_OUT=dev/docs/web-v5921/priority node dev/tools/verify-spirits5910.mjs
QA_IDS='["canh-mang-mien","gio-xao","thit-dong","che-khuc-bach","com-tam"]' QA_AUTO_IDS='["com-tam","banh-mi","pho-bo","banh-cuon","xoi"]' QA_ASSET_ROOT=spirits5921 QA_OUT=dev/docs/web-v5921/modes node dev/tools/verify-showcase-modes597.mjs
QA_HERO=canh-mang-mien QA_OUT=dev/docs/web-v5921/production node dev/tools/verify-showcase-production597.mjs
QA_HERO=che-khuc-bach QA_WIDTH=320 QA_HEIGHT=568 QA_OUT=dev/docs/web-v5921/production-narrow node dev/tools/verify-showcase-production597.mjs
node dev/tools/measure-web-load.mjs dev/docs/web-v5921/initial-load.json
```

Nguồn PNG Imagegen không cần cho inspector. Để đóng gói lại từ nguồn, truyền JSON nguồn chứa ID/kind/source/prompt cho `pack-campaign598.py ... spirits5921`, và JSON group/source/prompt cho `pack-spirit-vfx5921.py ...`. Prompt chính xác và hash nguồn được giữ trong provenance. Ảnh QA giữ cục bộ trong `.asset-work/`, không commit; harness có thể xuất PNG để kiểm tra.
