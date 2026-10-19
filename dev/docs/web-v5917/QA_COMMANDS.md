# Lệnh QA Web 5.9.17

```bash
pnpm test
pnpm typecheck
pnpm typecheck:dev
pnpm test:web-budget
pnpm validate:catalog
pnpm validate:assets
pnpm build
pnpm release:size
pnpm release:verify
pnpm release:rights
python3 dev/tools/inspect-character-atlas.py spirits5917 5917
node dev/tools/audit-spirit-production.mjs dev/docs/web-v5917/model-audit.json
```

Browser QA cần Playwright và browser binary cục bộ qua `PLAYWRIGHT_MODULE`, `CHROMIUM_BIN` hoặc `WEBKIT_BIN`.

```bash
QA_COHORT=5917 QA_ENGINE=chromium QA_OUT=dev/docs/web-v5917/adventure node dev/tools/verify-spirits5910.mjs
```
