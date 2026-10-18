# Lệnh QA Web 5.9.15

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
python3 dev/tools/inspect-manga5915.py
git diff --check
```

`pnpm release:rights --commercial` phải tiếp tục dừng cho tới khi 13 asset cũ có bằng chứng quyền sử dụng. Browser QA cần Playwright và browser binary cục bộ qua `PLAYWRIGHT_MODULE`, `CHROMIUM_BIN` hoặc `WEBKIT_BIN`.
