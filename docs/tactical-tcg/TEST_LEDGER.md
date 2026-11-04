# Test ledger

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
