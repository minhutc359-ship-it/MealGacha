# Soul of Meal Adventure World 2 — Next Game
Nhánh: `game/adventure-world-2`. Incubator tiền đề game riêng, không phải bản patch/đè lên master. Giai đoạn đầu hoàn thiện 12 nhân vật rồi mở lên 16–20; kết nối map, đi tự do, team 5 tự đánh/ultimate thủ công, pixel world + HD anime battle, TCG/Auto Chess trong thế giới kèm quick-entry, khám phá dungeon/rương/nấu ăn.
## Quy tắc
Được reset **AW2 pre-release dev data riêng** sau xác nhận rõ; không clear dữ liệu của game Soul of Meal hiện tại. Kể từ release đầu tiên phải migration save và patch an toàn. 5 tier **N R SR SSR UR**, tách luật 4-tier cũ; tài nguyên/canon legacy chỉ tái sử dụng có chọn lọc.
## Khởi động ngữ cảnh
Đọc `AGENTS.md`, `DECISIONS.md`, `CANON.md`, `STATUS.md`, `BACKLOG.md`, `TEST_LEDGER.md`, `HANDOFF.md` và skill tương ứng. Agent skills là vai trò + tài liệu bền vững, không phải background agents tự chạy.

**Xem nhanh cho chủ dự án:** [REPORT.md](REPORT.md), do `scretary-agent` tổng hợp sau mỗi task. [Phần trăm và cách tính](PROGRESS.md) · [Chơi thử demo](DEMO.md). [HANDOFF.md](HANDOFF.md) ghi chi tiết triển khai và việc bàn giao.

## Quy trình phát triển và push

Theo yêu cầu owner ngày 2026-10-21 (D16), tiếp tục chức năng trực tiếp trên `game/adventure-world-2`, **không tạo branch mới**. Mỗi task hoàn thành: chạy kiểm tra phù hợp, cập nhật tài liệu, commit rồi **push ngay vào `game/adventure-world-2`** và xác minh SHA trên remote trùng local. Quy định này thay thế hướng dẫn feature branch trước đây. Chi tiết lệnh và dọn nhánh đã tích hợp tại [WORKFLOW](WORKFLOW.md), [AW2-012B](tasks/AW2-012B.md).

## AW2 development preview — expedition, TCG and Auto Chess practice

Current branch: `game/adventure-world-2`. AW2-010A at `e7aedacadcc5f7664695767196d9edaa77fe724b` verifies a fresh earned RPG/TCG/Chess journey on source+compiled and fixes keyboard/native-control ownership, dialog focus and onboarding guidance.982 tests (189 AW2),171 browser assertions, both types/builds/isolation PASS. [Demo/how to play](DEMO.md), [fresh evidence](evidence/AW2-010A.md), [progress/caveats](PROGRESS.md): demo9/10 groups≈90%, full12-character product≈40% rough weighted estimate. Independent human playtest, full art/device/rights/release gates remain open. Both borrowed practices stay isolated from RPG spending/prizes/save fields; D11 stays PROPOSED, D12 platform/scope OPEN. Next [AW2-004C](tasks/AW2-004C.md) first-character gap closure; [REPORT](REPORT.md), [HANDOFF](HANDOFF.md).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:8443/dev/aw2/index.html`. This standalone development entry does not mount the Soul of Meal app, native bridge or legacy save services. It is excluded from the production entry graph. This entry is the save test screen; the world preview is separate at `/dev/aw2/world.html`. Neither entry mounts legacy gameplay or native save bridges.

Choose **Tạo bản lưu AW2** to initialize `aw2.development.save`, **Lưu thử AW2** to advance its revision, then reload to inspect persistence. **Bắt đầu lại AW2…** opens a modal; each reset requires the exact phrase `RESET AW2` and an explicit final action. Hủy/Escape leaves stored bytes intact. Normal writes preserve invalid/future saves, stale tabs must read again, and failed writes report an error. Confirmed development reset may replace an invalid/future AW2 save as disclosed in the dialog.

Writes require Web Locks and a secure context (localhost or HTTPS); unsupported browsers can inspect/read only. Schema v4 stores world/quest/starter/boss/note/ending progress plus inventory/shared XP/receipts. Valid v1/v2/v3 saves upgrade in memory without writing or granting until an explicit action, preserving identity/timestamps/prior progress and legacy data. Ordinary position-save cannot change quest/objectives; locked world/economy actions own reward changes. Future production migrations/native durability remain future work. No operation on this screen clears Soul of Meal saves.

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

Open `http://localhost:8443/dev/aw2/world.html`. Click/tap a clear destination, WASD/arrows or hold the on-screen direction buttons; E / Tương tác near an object. Five companions follow traversable history after starter unlock; reread clears their old trails. Closing dialogue changes nothing. Explicit actions and Lưu vị trí commit one coherent AW2 save; walking alone remains local until saved. Blur/keyup/pointer release stop movement, and dialogs pause it.

Flow: meet Bà Giữ Chỗ → read the cloth → hand in to unlock five approved N/R starters. Go east to Phố, accept at An, listen to three memories in any order, choose a thread. Accept at Dì, read the hint in Kho, solve the three-step puzzle in Phòng Lửa, then return to Dì to report. Wrong order resets only the attempt. All six zones have safe return routes.

For the fourth quest, explicitly accept **Thêm một chén** at Dì, reach Người Giữ Bàn Quên in Phòng Bàn and choose **Bắt đầu thử thách**. A safe checkpoint is written before combat mounts. The five development starters use persisted team XP to derive actual stats and auto-fight; manual ultimates remain available. The earned-XP verification fixture wins at tick36; this is development tuning, not final balance. Pause/step/reduced motion and retreat are available. Choose **Lưu kết quả và trở về** after win/loss/retreat. Failed writes keep the live result for retry; another-tab writes require reread. Reload/reread abandons an uncommitted attempt at its checkpoint and never implies a win.

After a committed win, explicitly read **Ghi chép bên chén**, return to Bà and choose either **Để ghế trống chờ** or **Mời cả làng dùng bữa**. Both finish the same quest once, grant its development XP/ingredients atomically and open the reciprocal Sân↔Phòng Bàn shortcut. Closing dialogue does not choose an ending or grant rewards.

Terrain/NPC/chest remain generated placeholders; companions reuse the five existing authored reference sets. Development XP/inventory/chest/cooking are now implemented below. Boss own art/kit, seven spirit sets, final balance/device/mobile readability and full AW2-006/008/010 gates remain open.

```sh
pnpm test dev/tests/aw2
node dev/tools/verify-aw2-world.mjs --url http://localhost:8443/dev/aw2/world.html
# Full four-quest/boss/checkpoint/failure/ending flow:
node dev/tools/verify-aw2-world.mjs --boss --url http://localhost:8443/dev/aw2/world.html
```

The world browser script accepts `--playwright` and `--chromium`; fresh isolated profiles only, normal captures under `.asset-work/aw2-006a/`, `--boss` captures/report under `.asset-work/aw2-007c/`. [AW2-006A foundation](tasks/AW2-006A.md), [current AW2-007C task](tasks/AW2-007C.md), [current evidence](evidence/AW2-007C.md), [canon](CANON.md), [handoff](HANDOFF.md). Original schema-v1/v2 evidence remains historical; current save/world results supersede affected ledger rows.

## Persistent progression and separate review build — AW2-013A

Open **Đội và túi đồ** for actual shared EXP/levels/items. Quest hand-in saves progress and reward together. Phòng Kho has a one-time ingredient chest. After completing the third quest, stand near Dì or the opened hearth: cook 1 rice +1 herbs +1 broth into a warm bowl, then share it for 45 team XP. Old saves expose an explicit **Nhận quà … nhiệm vụ đã hoàn tất** catch-up action; loading grants nothing. Failed writes preserve items/receipts; stale tabs must reread. These amounts use `aw2-economy-development-v1`, not final balance.

```sh
pnpm build:aw2
pnpm exec vite preview --config dev/vite.aw2.config.ts --host 127.0.0.1 --port 8455
# Open http://127.0.0.1:8455/ → compiled world
node dev/tools/verify-aw2-rpg.mjs --playwright /path/to/playwright-core/index.mjs --chromium /path/to/chromium
node dev/tools/verify-aw2-build.mjs --playwright /path/to/playwright-core/index.mjs --chromium /path/to/chromium
node dev/tools/simulate-aw2-gacha.mjs
```

`dist-aw2/` is a local review artifact with separate world/save/battle/starter/Than entries and runtime assets, excluding source PNG/code/maps/archives. `pnpm build` still creates the stable game without AW2. No deployment/release. The two new browser verifiers own ports8454/8455; close a manual preview before using8455. Captures stay ignored under `.asset-work/`. [Development contract and fresh evidence](evidence/AW2-013A.md). Gacha simulation is a [proposal for D11](proposals/AW2-005A-RATES.md), with no runtime draw/spend/save.

## Embedded TCG / Auto Chess practice — AW2-009A/B/C

With a ready AW2 save, choose **Ghé nhanh TCG/Auto Chess** from the world, or approach either table in Phố, interact and choose **Ghé bàn**. Both paths checkpoint current exploration before entering. The lobby now opens **Chơi TCG thử** or **Chơi Auto Chess thử**. Both actual borrowed-resource practices are integrated; mode prizes/collected progression are not. Return reads the same checkpoint without another write; changed data requires **Đọc lại hành trình**. Reload abandons the match at its checkpoint. Active world battle/visits block nested entry; no legacy store or schema change.

This supersedes the old AW2-009A subsection that said actual games were not integrated; that statement described its historical transition-only milestone. [Navigation foundation](tasks/AW2-009A.md), [TCG](TCG_PRACTICE.md), [Auto Chess](AUTO_CHESS_PRACTICE.md).

```sh
node dev/tools/verify-aw2-modes.mjs --playwright /path/to/playwright-core/index.mjs --chromium /path/to/chromium
node dev/tools/verify-aw2-chess.mjs --playwright /path/to/playwright-core/index.mjs --chromium /path/to/chromium
pnpm build:aw2
node dev/tools/verify-aw2-chess.mjs --compiled --playwright /path/to/playwright-core/index.mjs --chromium /path/to/chromium
```

Navigation owns/closes source8456/compiled8457, TCG8458/8459, Chess8460/8461. Fresh isolated browser profiles only. [Current task](tasks/AW2-009C.md), [evidence](evidence/AW2-009C.md). Embedded-practice/navigation subset verified; production mode balance/art/persistence/prizes and complete release gates remain open. [AW2-010A](tasks/AW2-010A.md) automated integration gate now passes; independent playtest remains open.

## Deterministic combat core — AW2-007A

`src/aw2/combat` is a development-only pure rules module for one-to-five units per side. It owns movement/range, melee contacts, launched projectiles, auto skills, manual ultimates, interruptions, bounded starter passives and the terminal result. Renderer-facing events describe outcomes that already happened; they cannot apply damage or grant rewards. Numeric stats use `aw2-combat-development-v1` and are not final approved balance.

```sh
pnpm test dev/tests/aw2/combat.test.ts
pnpm test dev/tests/aw2
pnpm typecheck
pnpm typecheck:dev
```

These rules are consumed by the independent preview below and AW2-007C's private world encounter controller. The renderer never applies world results; the save boundary accepts an authentic terminal/retreat bound to its exact checkpoint raw bytes. BATTLE-02's development boss subset is now verified; production/native continuation remains open. AW2-013A adds development numerical rewards through locked save transactions. [Rules task](tasks/AW2-007A.md) · [world integration](tasks/AW2-007C.md).

## Event battle preview — AW2-007B

Open `http://localhost:8443/dev/aw2/battle.html` (current local verification server `http://127.0.0.1:8452/dev/aw2/battle.html`). The five approved starters auto-fight with HD reference atlases and can use manual ultimates. Pause, step one tick, choose development levels 1/5/10/20, reset, and enable reduced motion. Choosing a level applies only when creating the next battle; current cards retain their active level/stats. Terminal events clear unfinished visual projectiles. Enemy units temporarily reuse tinted starter atlases and are not finished enemy assets.

The canvas consumes `CombatEvent` presentation state; it does not calculate damage or award outcomes. `aw2-leveling-development-v1` is a deterministic development curve, not approved balance. The standalone page never writes XP, rewards or save data; world encounters now project persisted team XP through the same curve. Audio is opt-in and consumes confirmed events only.

```sh
pnpm test dev/tests/aw2/combat.test.ts dev/tests/aw2/battle-presentation.test.ts
node dev/tools/verify-aw2-battle-browser.mjs --url http://localhost:8443/dev/aw2/battle.html
```

The browser verifier needs Playwright/Chromium and uses a fresh profile. It accepts a package name, file URL, or local Windows/POSIX module path through `--playwright`, and a browser executable through `--chromium`. Current Chromium gate: 22 checks PASS; desktop/mobile/terminal captures inspected. Device/mobile UX/FPS remain open. The separate world boss/save integration and mode transitions now have their own verified development scopes. [Task](tasks/AW2-007B.md) · [evidence](evidence/AW2-007B.md).

## Than asset / animation reference — AW2-004A

Open `http://localhost:8443/dev/aw2/than.html` after `pnpm dev` (current verification server localhost:8452). Eight HD states, four world directions, four skill FX/audio tracks, pause/replay and reduced motion. Audio starts only after opting in. Preview does not access or change saves. World uses the same reference atlases for followers/battle; this manual asset preview itself grants no gameplay outcome.

Five original PNG sources and their lossless WebP counterparts live in `dev/aw2/assets/than/base-v1/`, alongside four synthesized WAVs, exact `prompts.json` and `provenance.json`. Runtime metadata at `src/aw2/assets/than.base-v1.json` binds canonical identity/variant/asset/skill IDs to measured frames, foot anchors, timings/contact markers and source hashes. Generated sheet dimensions/spacing were not exact uniform grids; explicit calibrated rectangles preserve complete visible sprites without repainting or mirroring. Alpha edges tolerate at most 8/255 (observed maximum 4/255 on the selected cells).

World has 16 chibi cels: one idle + three authored walking poses per direction, played as a four-step cycle. HD has eight generated key poses plus authored interpolated transform tracks; it is not frame-by-frame battle animation. Skill FX has four stages per skill, 16 frames. Than is melee, no projectile substitute. Passive requires a shield-expired event from future combat; preview proc is explicitly manual. Original audio cues are synthetic sounds, not sampled recordings/music. All image creation/repair used built-in `image_gen`, not a CLI/API fallback.

```sh
python3 dev/tools/build-aw2-than-assets.py
python3 dev/tools/verify-aw2-than-files.py
pnpm test dev/tests/aw2
node dev/tools/verify-aw2-than-browser.mjs --url http://localhost:8443/dev/aw2/than.html
```

Build processing requires Pillow (recorded version in provenance); source PNG artwork remains unchanged. Build only encodes lossless WebP, writes atlas/timing metadata and synthesizes the four cues. Browser verification accepts the existing `--playwright` and `--chromium` options; uses a fresh temporary profile and writes captures under ignored `.asset-work/aw2-004a/`.

[Task](tasks/AW2-004A.md) · [evidence](evidence/AW2-004A.md) · [source prompts](../../dev/aw2/assets/than/base-v1/prompts.json) · [provenance](../../dev/aw2/assets/than/base-v1/provenance.json). License remains REVIEW_REQUIRED / commercial release NOT_CLEARED. Than is a reference asset set, not a completed character: five-starter development combat/leveling are verified separately, while full-character/device/human-listening/legal gates remain open. Other four starters now have reference sets through AW2-004B; seven non-starters remain NOT_CREATED. No AW2-010 completion or release follows from these tasks.

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

Build uses the preserved sources, AW2-004A encoder/synth helpers and manifest template; it never generates or repaints art. Browser tools accept `--playwright`/`--chromium`, use fresh isolated profiles and keep QA PNGs under ignored `.asset-work/`. [Task](tasks/AW2-004B.md), [verification](evidence/AW2-004B.md), [handoff](HANDOFF.md). AW2-007C now connects the development canvas to world/save boss progress. AW2-013A now adds numerical loot/cooking and followers; authored enemies/seven remaining spirit sets/full character gates remain open.
