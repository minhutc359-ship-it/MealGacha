# Soul of Meal Adventure World 2 — Next Game
Nhánh: `game/adventure-world-2`. Incubator tiền đề game riêng, không phải bản patch/đè lên master. Giai đoạn đầu hoàn thiện 12 nhân vật rồi mở lên 16–20; kết nối map, đi tự do, team 5 tự đánh/ultimate thủ công, pixel world + HD anime battle, TCG/Auto Chess trong thế giới kèm quick-entry, khám phá dungeon/rương/nấu ăn.
## Quy tắc
Được reset **AW2 pre-release dev data riêng** sau xác nhận rõ; không clear dữ liệu của game Soul of Meal hiện tại. Kể từ release đầu tiên phải migration save và patch an toàn. 5 tier **N R SR SSR UR**, tách luật 4-tier cũ; tài nguyên/canon legacy chỉ tái sử dụng có chọn lọc.
## Khởi động ngữ cảnh
Đọc `AGENTS.md`, `DECISIONS.md`, `CANON.md`, `STATUS.md`, `BACKLOG.md`, `TEST_LEDGER.md`, `HANDOFF.md` và skill tương ứng. Agent skills là vai trò + tài liệu bền vững, không phải background agents tự chạy.

## AW2 development preview — AW2-001 + AW2-006A

Current feature branch: `feat/aw2-007b-battle-renderer`, remote implementation snapshot `df72ebf` in draft [PR #80](https://github.com/minhutc359-ship-it/MealGacha/pull/80); long-lived base `game/adventure-world-2` remains at `179cc21`. AW2-012 integrated the earlier save/world/assets histories, AW2-007A added pure combat rules, and AW2-007B now adds the standalone event battle preview in REVIEW. Current source has 876 unit tests PASS; the new Chromium gate is BLOCKED on this runner and is not claimed as PASS. [Status](STATUS.md), [handoff](HANDOFF.md), [AW2-007B evidence](evidence/AW2-007B.md). Owner-approved story/12 identities/tier/kit/starter direction remain; rates/pity are open (D11).

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

## Deterministic combat core — AW2-007A

`src/aw2/combat` is a development-only pure rules module for one-to-five units per side. It owns movement/range, melee contacts, launched projectiles, auto skills, manual ultimates, interruptions, bounded starter passives and the terminal result. Renderer-facing events describe outcomes that already happened; they cannot apply damage or grant rewards. Numeric stats use `aw2-combat-development-v1` and are not final approved balance.

```sh
pnpm test dev/tests/aw2/combat.test.ts
pnpm test dev/tests/aw2
pnpm typecheck
pnpm typecheck:dev
```

These rules are consumed by the development preview below. World boss/save/reward integration and BATTLE-02 remain separate work. [Task](tasks/AW2-007A.md) · [evidence](evidence/AW2-007A.md).

## Event battle preview — AW2-007B

Open `http://localhost:8443/dev/aw2/battle.html`. The five approved starters auto-fight with HD reference atlases and can use manual ultimates. Pause, step one tick, choose development levels 1/5/10/20, reset, and enable reduced motion. Enemy units temporarily reuse tinted starter atlases and are not finished enemy assets.

The canvas consumes `CombatEvent` presentation state; it does not calculate damage or award outcomes. `aw2-leveling-development-v1` is a deterministic non-persistent test curve, not approved balance. This page never writes XP, rewards or save data.

```sh
pnpm test dev/tests/aw2/combat.test.ts dev/tests/aw2/battle-presentation.test.ts
node dev/tools/verify-aw2-battle-browser.mjs --url http://localhost:8443/dev/aw2/battle.html
```

The browser verifier needs Playwright/Chromium and uses a fresh profile. Current implementation/build evidence is recorded even when that external browser gate is unavailable. [Task](tasks/AW2-007B.md) · [evidence](evidence/AW2-007B.md).

## Than asset / animation reference — AW2-004A

Open `http://localhost:8443/dev/aw2/than.html` after `pnpm dev` (current verification server localhost:8452). Eight HD states, four world directions, four skill FX/audio tracks, pause/replay and reduced motion. Audio starts only after opting in. Preview does not access or change saves. World now links to the shared five-starter selector below; no follower/battle integration is implied.

Five original PNG sources and their lossless WebP counterparts live in `dev/aw2/assets/than/base-v1/`, alongside four synthesized WAVs, exact `prompts.json` and `provenance.json`. Runtime metadata at `src/aw2/assets/than.base-v1.json` binds canonical identity/variant/asset/skill IDs to measured frames, foot anchors, timings/contact markers and source hashes. Generated sheet dimensions/spacing were not exact uniform grids; explicit calibrated rectangles preserve complete visible sprites without repainting or mirroring. Alpha edges tolerate at most 8/255 (observed maximum 4/255 on the selected cells).

World has 16 chibi cels: one idle + three authored walking poses per direction, played as a four-step cycle. HD has eight generated key poses plus authored interpolated transform tracks; it is not frame-by-frame battle animation. Skill FX has four stages per skill, 16 frames. Than is melee, no projectile substitute. Passive requires a shield-expired event from future combat; preview proc is explicitly manual. Original audio cues are synthetic sounds, not sampled recordings/music. All image creation/repair used built-in `image_gen`, not a CLI/API fallback.

```sh
python3 dev/tools/build-aw2-than-assets.py
python3 dev/tools/verify-aw2-than-files.py
pnpm test dev/tests/aw2
node dev/tools/verify-aw2-than-browser.mjs --url http://localhost:8443/dev/aw2/than.html
```

Build processing requires Pillow (recorded version in provenance); source PNG artwork remains unchanged. Build only encodes lossless WebP, writes atlas/timing metadata and synthesizes the four cues. Browser verification accepts the existing `--playwright` and `--chromium` options; uses a fresh temporary profile and writes captures under ignored `.asset-work/aw2-004a/`.

[Task](tasks/AW2-004A.md) · [evidence](evidence/AW2-004A.md) · [source prompts](../../dev/aw2/assets/than/base-v1/prompts.json) · [provenance](../../dev/aw2/assets/than/base-v1/provenance.json). License remains REVIEW_REQUIRED / commercial release NOT_CLEARED. Than is a reference asset set, not a completed character: leveling, actual combat, device QA/human listening/legal approval remain open. Other four starters now have reference sets through AW2-004B; seven non-starters remain NOT_CREATED. No AW2-010 completion or release follows from these tasks.

## Five starter references — AW2-004B

Open `http://localhost:8452/dev/aw2/starters.html` on the existing verification server (normal `pnpm dev` default localhost:8443). Choose Than, Lửa Nhỏ, Lam Lam, Mộc Non or Sương Lành. Selection resets playback/audio opt-in; only selected unit image atlases are loaded. Pause/replay, reduced motion, world directions, eight HD states, four skills, portrait and source links are shared. Missing atlas gives an explicit error and blank canvas. Optional `?spirit=aw2-lam` selects the initial unit.

New assets: `dev/aw2/assets/{lua,lam,moc-non,suong}/base-v1/`; each contains four unchanged original PNGs and four lossless WebPs (portrait also serves as identity reference), four WAVs, exact prompts and generation provenance. Canonical manifests: `src/aw2/assets/{lua,lam,moc-non,suong}.base-v1.json`; registry `starters.ts`. Sixteen selected images from nineteen built-in image_gen calls, no external artwork references or CLI/API fallback. Total new WebPs 16,509,218 bytes. Explicit measured cells preserve source art; Sương Lành source rows map down/right/left/up. Mộc Non's faint world gutter permits declared edge alpha 9/255, other sets 8/255; all visible alpha≥96 bounds inset ≥2px.

HD is eight key poses plus interpolation. Lửa Nhỏ basic has contacts at 220/380ms; Lam Lam ultimate pulses at 520/1040ms. Three ranged basics have separate authored projectile cels/flight and impact cels (launch260/impact700ms). These are reference presentation timings/coordinates, not approved damage/speed/balance or engine hit confirmation. Passives are manual preview procs requiring future combat events. Full character completion remains false for all five.

```sh
python3 dev/tools/build-aw2-starter-assets.py
python3 dev/tools/verify-aw2-starter-files.py
pnpm test dev/tests/aw2
node dev/tools/verify-aw2-starter-browser.mjs --url http://localhost:8443/dev/aw2/starters.html
# Than compatibility:
node dev/tools/verify-aw2-than-browser.mjs --url http://localhost:8443/dev/aw2/than.html
```

Build uses the preserved sources, AW2-004A encoder/synth helpers and manifest template; it never generates or repaints art. Browser tools accept `--playwright`/`--chromium`, use fresh isolated profiles and keep QA PNGs under ignored `.asset-work/`. [Task](tasks/AW2-004B.md), [verification](evidence/AW2-004B.md), [handoff](HANDOFF.md). AW2-007B now consumes the pure rules in a development canvas; next is its Chromium gate, then trusted world/save/boss integration while animation/character complete authored enemies, seven non-starter references and character gates.
