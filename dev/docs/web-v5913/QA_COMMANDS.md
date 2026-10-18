# Lệnh QA Web 5.9.13

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
python3 dev/tools/inspect-character-atlas.py autochess5913 5913
node dev/tools/audit-spirit-production.mjs dev/docs/web-v5913/model-audit.json
```

Browser QA cần Playwright và đường dẫn browser cục bộ qua `PLAYWRIGHT_MODULE`, `CHROMIUM_BIN` hoặc `WEBKIT_BIN`.

```bash
QA_COHORT=5913 QA_ENGINE=chromium QA_OUT=dev/docs/web-v5913/adventure-a node dev/tools/verify-spirits5910.mjs
QA_COHORT=5913 QA_ENGINE=chromium QA_IDS='["che-lam","chao-luon","banh-it-la-gai","banh-ram-it","keo-cu-do"]' QA_OUT=dev/docs/web-v5913/adventure-b node dev/tools/verify-spirits5910.mjs
```
