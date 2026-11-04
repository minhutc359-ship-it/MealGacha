# Test ledger

TCG-007 (05/11), base4673123: `pnpm test` 179 files/2,354 tests PASS; production/dev typechecks PASS; focused production11 files/84 PASS; release32/774/3 PASS; build/package/guard376files PASS. Frame callback parity/immutability, five legal distinct recipes, one-time additive grants/full-deck preservation and paid second-copy upgrade with real damage all PASS. Browser operations and five viewport geometry checks recorded in [TCG-007](evidence/TCG-007.md); native devices/touch NOT_RUN.

TCG-006 fresh checks after rebuilding the workspace from `e855a67`: production/dev types PASS; `pnpm verify:production` 10 files/79 tests PASS; `pnpm test` 178 files/2,349 tests PASS; release records 32/774/3 PASS; `pnpm build` and Tactical package/release guard PASS (376 files). No runtime dependencies changed. Browser facts and remaining limits are in [TCG-006 evidence](evidence/TCG-006.md); the table below retains TCG-005's historical verification.

| Gate | Kết quả |
| --- | --- |
| `pnpm typecheck` | PASS |
| `pnpm typecheck:dev` | PASS |
| `pnpm verify:production` | PASS — 9 files, 67 tests |
| `pnpm test` | PASS — 177 files, 2,337 tests |
| `pnpm release:verify` | PASS — 32 runtime dependencies, 774 assets, 3 policies |
| `pnpm build` | PASS — Vite, Tactical package verifier, release guard |
| Package | PASS — 375 files; không có Auto Chess/Adventure asset, source map, archive hoặc credential |
| UI SSR | PASS — collection/decks/packs/home/guide, 16 ô trống + 4 lá tay đầu, 8 node, không nested button |
| Catalog art | PASS — 181/181 đường dẫn ảnh gốc tồn tại |
| Campaign simulation | PASS — 84 lệnh chơi chuỗi mô phỏng, mọi trận kết thúc; đường đi hợp lệ mở đủ 8 node |
| Browser screenshots/touch | BLOCKED/NOT RUN — không kết nối được localhost; không có binary local hợp lệ |
| Thiết bị thật | NOT RUN |
