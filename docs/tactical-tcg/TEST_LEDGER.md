# Test ledger

| Gate | Kết quả |
| --- | --- |
| `pnpm typecheck` | PASS |
| `pnpm verify:production` | PASS — 8 files, 54 tests |
| `pnpm test` | PASS — 176 files, 2,324 tests |
| `pnpm release:verify` | PASS — 32 runtime dependencies, 774 assets, 3 policies |
| `pnpm build` | PASS — Vite, Tactical package verifier, release guard |
| Package | PASS — 374 files; không có Auto Chess/Adventure asset, source map, archive hoặc credential |
| UI SSR | PASS — 16 ô battle, 8 node campaign, progress semantics, không có nested button |
| Thiết bị thật | NOT RUN |
