# Soul of Meal Adventure World 2 — Next Game
Nhánh: `game/adventure-world-2`. Incubator tiền đề game riêng, không phải bản patch/đè lên master. Giai đoạn đầu hoàn thiện 12 nhân vật rồi mở lên 16–20; kết nối map, đi tự do, team 5 tự đánh/ultimate thủ công, pixel world + HD anime battle, TCG/Auto Chess trong thế giới kèm quick-entry, khám phá dungeon/rương/nấu ăn.
## Quy tắc
Được reset **AW2 pre-release dev data riêng** sau xác nhận rõ; không clear dữ liệu của game Soul of Meal hiện tại. Kể từ release đầu tiên phải migration save và patch an toàn. 5 tier **N R SR SSR UR**, tách luật 4-tier cũ; tài nguyên/canon legacy chỉ tái sử dụng có chọn lọc.
## Khởi động ngữ cảnh
Đọc `AGENTS.md`, `DECISIONS.md`, `CANON.md`, `STATUS.md`, `BACKLOG.md`, `TEST_LEDGER.md`, `HANDOFF.md` và skill tương ứng. Agent skills là vai trò + tài liệu bền vững, không phải background agents tự chạy.

## AW2 development preview — AW2-001 + AW2-006A

Current branch: `feat/aw2-006-world-foundation`, with AW2-001 dependency and approved AW2-002/003 content incorporated. Source ref: `b3c526bdf37c03184fb68df150381f19e5f0723d`. Local implementation, not merged into the long-lived AW2 branch or published. Owner approved story/12 identities/tier/kit/starter direction; rates/pity remain open (D11).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:8443/dev/aw2/index.html`. This standalone development entry does not mount the Soul of Meal app, native bridge or legacy save services. It is excluded from the production entry graph. This entry is the save test screen; the world preview is separate at `/dev/aw2/world.html`. Neither entry mounts legacy gameplay or native save bridges.

Choose **Tạo bản lưu AW2** to initialize `aw2.development.save`, **Lưu thử AW2** to advance its revision, then reload to inspect persistence. **Bắt đầu lại AW2…** opens a modal; each reset requires the exact phrase `RESET AW2` and an explicit final action. Hủy/Escape leaves stored bytes intact. Normal writes preserve invalid/future saves, stale tabs must read again, and failed writes report an error. Confirmed development reset may replace an invalid/future AW2 save as disclosed in the dialog.

Writes require Web Locks and a secure context (localhost or HTTPS); unsupported browsers can inspect/read only. Schema v2 stores world/quest/starter progress; v1 upgrades in memory without writing until an explicit save, preserving saveId/createdAt and legacy data. Future production migrations/native durability remain future work. No operation on this screen clears Soul of Meal saves.

```sh
pnpm test dev/tests/aw2/save.test.ts dev/tests/infrastructure/protectedStorage.test.ts
pnpm typecheck
pnpm typecheck:dev
pnpm test
pnpm build
# Requires Playwright (or playwright-core) and Chromium available locally:
node dev/tools/verify-aw2-save.mjs --url http://localhost:8443/dev/aw2/index.html
```

The browser tool also accepts `--playwright /absolute/path/to/playwright-core/index.mjs` and `--chromium /path/to/chromium`. It uses a fresh isolated browser profile, seeds test legacy keys, checks reset/conflicts/failures, and writes captures/report under ignored `.asset-work/aw2-001/`. It never uses the owner's browser profile. See [task card](tasks/AW2-001.md), [verification](evidence/AW2-001.md) and [handoff](HANDOFF.md).

## World / quest foundation

Open `http://localhost:8443/dev/aw2/world.html`. WASD/arrows or hold the on-screen direction buttons; E / Tương tác near an object. Closing dialogue changes nothing. Explicit actions and Lưu vị trí commit one coherent AW2 save; walking alone remains local until saved. Blur/keyup/pointer release stop movement, and dialogs pause it.

Flow: meet Bà Giữ Chỗ → read the cloth at the table → hand in to unlock the five approved N/R starters. Go east to Phố, accept at An, listen to all three memories in any order, pick a thread. Go east to Dì, accept, read the hint in Kho, then solve the three-step puzzle in Phòng Lửa. Wrong order resets only the attempt. Return to Dì to report; the next quest awaits combat integration. All six zones are reachable after the appropriate gates; exits save a safe spawn.

Visuals are debug primitives with labels, not authored pixel/chibi/HD models. Chest/boss/TCG/Chess interactions explicitly disclose pending adapters and grant no fabricated rewards/wins/mode transitions. No XP/item budget, gacha, leveling, followers, art/audio or finished vertical slice is claimed. Full AW2-006/008/010 remain open.

```sh
pnpm test dev/tests/aw2
node dev/tools/verify-aw2-world.mjs --url http://localhost:8443/dev/aw2/world.html
```

The world browser script accepts the same `--playwright` and `--chromium` options; fresh isolated profile only, captures/report under `.asset-work/aw2-006a/`. See [AW2-006A task](tasks/AW2-006A.md), [latest evidence](evidence/AW2-006A.md), [current canon](CANON.md) and [handoff](HANDOFF.md). The original AW2-001 evidence remains a historical schema-v1 record; latest schema-v2 results supersede affected current test rows.
