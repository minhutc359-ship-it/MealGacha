# Lệnh QA Web 5.9.14

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
python3 dev/tools/inspect-character-atlas.py tcg5914 5914
node dev/tools/audit-spirit-production.mjs dev/docs/web-v5914/model-audit.json
```

Browser QA cần Playwright và browser binary cục bộ qua `PLAYWRIGHT_MODULE`, `CHROMIUM_BIN` hoặc `WEBKIT_BIN`.

```bash
QA_COHORT=5914 QA_ENGINE=chromium QA_OUT=dev/docs/web-v5914/adventure-a node dev/tools/verify-spirits5910.mjs
QA_COHORT=5914 QA_ENGINE=chromium QA_IDS='["pasta","sushi","tokbokki","lau-thai"]' QA_OUT=dev/docs/web-v5914/adventure-b node dev/tools/verify-spirits5910.mjs
```
