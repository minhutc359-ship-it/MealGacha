# Test ledger

| Gate | Kết quả |
| --- | --- |
| `pnpm typecheck` | PASS |
| `pnpm verify:production` | PASS — 7 files, 51 tests |
| `pnpm test` | PASS — 175 files, 2,321 tests |
| `pnpm release:verify` | PASS — 32 runtime dependencies, 774 assets, 3 policies |
| `pnpm build` | PASS — Vite, Tactical package verifier, release guard |
| Package | PASS — 374 files; không có Auto Chess/Adventure asset, source map, archive hoặc credential |
| Thiết bị thật | NOT RUN |
