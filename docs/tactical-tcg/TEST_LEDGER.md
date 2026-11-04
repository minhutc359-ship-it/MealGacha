# Test ledger

| Gate | Kết quả |
| --- | --- |
| `pnpm typecheck` | PASS |
| `pnpm verify:production` | PASS — 6 files, 43 tests |
| `pnpm test` | PASS — 174 files, 2,313 tests |
| `pnpm release:verify` | PASS — 32 runtime dependencies, 774 assets, 3 policies |
| `pnpm build` | PASS — Vite, Tactical package verifier, release guard |
| Package | PASS — 373 files; không có Auto Chess/Adventure asset, source map, archive hoặc credential |
| Thiết bị thật | NOT RUN |
