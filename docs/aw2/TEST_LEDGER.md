# Test ledger / change impact
Historical roster review preserved by AW2-012: source `4d8f1c516f55a0ffd4bad992624c465fe65a9146`, handoff `4b8553c21e191aa5ed964dca338fc243c2d0ebc6`; static structure checks PASS (twelve IDs, 48 skill slots, eight HD-state requirements, proposed tier distribution). [Original evidence](evidence/AW2-003.md). This is proposal-only historical evidence; current approval/asset status comes from CANON/D10/D13/D15 and subsequent records.

Historical story review preserved by AW2-012: source `461c7cfaac658618d96ca8020ac99076fad9e35d`, handoff `238708cba7bb1402ec38828aa8748e35aee01ad9`; static namespace/reference checks PASS (six zones/eight NPCs/four quests, acyclic prerequisites), `git diff --check` PASS. [Original evidence](evidence/AW2-002.md). This describes the original proposal-only branch; current approval/runtime status comes from CANON/D14 and later integration records below.

Statuses: NOT_RUN, PASS, FAIL, BLOCKED, STALE. PASS requires commit SHA, env, command, observed outcome. Prior PASS becomes STALE for affected changes. PR runs selective affected tests; full suite required before release/major cross-engine merge, and after high-impact save/shared engine changes.
| Case | Trigger | Result |
|---|---|---|
| SAVE-01 separate AW2 dev namespace preserves legacy save | save/reset | PASS — integrated source `0e8fb7a`, full unit regression +29 save Chromium checks; original evidence retained |
| SAVE-02 chest/battle/gacha atomic grants, no double reward | loot/store | NOT_RUN |
| SAVE-03 schema/reset conflicts, storage failures and serialized writers | save/schema/reset | PASS — integrated source `0e8fb7a`, schema v2/v1 migration/reset/conflicts/Chromium |
| GACHA-01 weights N/R/SR/SSR/UR seeded statistics | gacha/roster | NOT_RUN |
| GACHA-02 pity/shards/dupes and reload | gacha/save | NOT_RUN |
| WORLD-01 navigation, collision, zone transfer, spawn | world | PASS — six-zone debug foundation, integration source 0e8fb7a /18 Chromium checks; retest authored maps/assets |
| WORLD-02 NPC, quest, followers and interact range | world/quest | NOT_RUN as full case: first 3 quests/range verified in QUEST-01; followers pending |
| QUEST-01 first 3 quests, starter unlock, puzzle retry and reload | quest/save/world | PASS — integration source 0e8fb7a, rule tests +18 Chromium world checks |
| BATTLE-01 range/contact/projectile/ultimate five team | combat/asset | PASS pure rules — fdf4a60; 31299a4 renderer/level unit+build PASS, Chromium visual gate BLOCKED |
| BATTLE-02 battle return/save/reload, paused run | combat/save | NOT_RUN |
| ART-01 12 pixel 4dir + HD 8states + unique FX manifests | asset | NOT_RUN as full 12-unit case; five starter reference sets verified below |
| ART-THAN-01 frames/manifests/timelines/FX/audio preview | asset | PASS — integration source 0e8fb7a /32 Chromium checks; reference scope only |
| PROVENANCE-THAN source/prompt/hash inventory | asset | PASS inventory only — rights/legal approval still NOT_RUN |
| ART-STARTERS-01 four other starter frames/projectiles/cues/selector | asset | PASS — integration source 0e8fb7a /133 Chromium checks; reference scope only |
| PROVENANCE-STARTERS original image/audio inventory | asset | PASS inventory only — integration source 0e8fb7a; rights/legal approval NOT_RUN |
| DUNGEON-01 three+ rooms, puzzle, chest, boss | dungeon | NOT_RUN |
| MODE-01 TCG/Chess embedded and quick-entry safe | navigation | NOT_RUN |
| PERF-01 30/60 FPS targets, cold-load, memory, offline | asset/runtime | NOT_RUN |
| RIGHTS-01 art/audio provenance and legal check | asset | NOT_RUN |
Six-zone debug navigation and first-three-quest tests run under AW2-006A. Pure combat rules run under AW2-007A; AW2-007B has source/unit/build evidence but its browser visual gate is BLOCKED. World-connected battle, gacha, full authored-art and vertical-slice tests have not run. Historical AW2-001 below covers schema v1; the latest record supersedes its affected current-source coverage.

## AW2-007A pure combat rules — 2026-10-20

Base `179cc214e4fc8cee37fba34fbfe4416a26742bfb`; tested implementation source `fdf4a605a233da266f36158393860a9c9fe7d2ad`, branch `feat/aw2-007a-combat-core`. Linux x86_64, Node v24.19.0, pnpm 11.25.0, TypeScript 5.9.3, Vitest 5.0.1, Vite 8.0.5. No remote push, PR, merge, deployment or save reset.

| Command/check | Result | Observed |
|---|---|---|
| `pnpm test dev/tests/aw2` | PASS | 5 files /76 tests: 10 combat and all66 prior AW2 cases |
| `pnpm test --maxWorkers=2` | PASS | 85 files /869 tests,29.14s, no failures/skips |
| `pnpm typecheck` / `pnpm typecheck:dev` | PASS | Both exit0 |
| Combat formatter + `git diff --check` | PASS | No formatting/whitespace issue |
| `pnpm build` + release guard | PASS | Production build; existing large-chunk warning only |
| Production exclusion scan | PASS | 851 output files contain no AW2 combat/task markers |
| Browser/renderer/save/boss/reward/device | NOT_RUN | Pure rules scope has no UI or adapter |

Covered: immutable deterministic commands and JSON replay; one-to-five teams/unique IDs; target fallback; movement/range; melee two-contact and ranged projectile timing; manual ultimate validation/spend; pre-commit interruption versus post-launch impact; finite shield/heal/debuff/passive behavior for all five starters; one-charge interrupt guard; same-tick projectile draw and exactly one terminal event; no reward/save fields. Initial typechecks exposed the missing passive slot in the combat slot union; corrected before final gates. Review repairs for target attribution, initial-dead seed rejection and boss pull immunity were included before final full regression. BATTLE-01 PASS is rules-only; BATTLE-02 and actual rendered/world-connected combat remain NOT_RUN. [Evidence](evidence/AW2-007A.md).

## AW2-007B event renderer / development leveling — 2026-10-20

Base `179cc214e4fc8cee37fba34fbfe4416a26742bfb`; implementation source `31299a44704962b68fa6769860b1050e16e18fe2`, branch `feat/aw2-007b-battle-renderer`. Remote draft PR #80 head `df72ebf37c35467ec6f3a67c2683fcc6f3f919e9` used the exact local documented tree `294ceb03204f012560b974d842bbf70211b11f16`. Linux x86_64, Node v24.19.0, pnpm 11.25.0, TypeScript 5.9.3, Vitest 5.0.1, Vite 8.0.5. Status REVIEW: browser criterion BLOCKED.

| Command/check | Result | Observed |
|---|---|---|
| `pnpm test dev/tests/aw2` | PASS | 6 files /83 tests: 7 presentation/level,10 combat, all66 prior AW2 |
| `pnpm test --maxWorkers=2` | PASS | 86 files /876 tests,28.47s, no failures/skips |
| Root/dev typechecks + formatter + whitespace | PASS | Both TS configs exit0; selected files formatted; `git diff --check` clean |
| Vite localhost HTTP smoke | PASS | Battle HTML/transformed TSX and real Than WebP served on127.0.0.1 |
| Production build/guard/exclusion | PASS | Existing chunk warning;851 files contain no AW2-007B markers |
| Headless Chromium verifier | BLOCKED | No Playwright package or Chromium executable in runner; supplied script NOT_RUN |
| World/save/boss/reward/persistent XP/device | NOT_RUN | Standalone development preview only |

Covered by unit/source gates: ordered/idempotent presentation replay; gap rejection; projectile launch→authoritative hit settlement; cast/support/interrupt/defeat/terminal mapping; no HP/reward/save authority; non-negative integer XP; monotonic level/stat projection; cap20; immutable seed creation; combat launch impact tick. Browser source intends load/pixels/auto/pause/step/level reset/ultimate/projectile/reduced-motion/mobile/error/save-byte checks, but those are not PASS until executed. [Evidence](evidence/AW2-007B.md).

## AW2-001 verification record — 2026-10-20

- Base SHA: `72ee9b4360299db4bab9b9b43dba552dd80b86cf` (`game/adventure-world-2`).
- Tested source/head SHA: `201c6b7ada91bc9c76ff6b6fe7d642735b040dc1` (`feat/aw2-001-dev-save`). Browser tests ran on identical source bytes before that commit; final unit/type/build runs use the commit directly. Subsequent changes are documentation only.
- Environment: Linux x64, Node `v22.23.2`, pnpm `10.34.3`; frozen lockfile install; Vite `8.0.5`, Vitest `5.0.1`. Chromium `153.0.8010.36`, headless, isolated temporary profile, viewports 1280×800 and 390×844. Desktop browser with mobile viewport is not physical-device QA.

| Command / check | Status | Observed result |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | PASS | Dependencies restored; package.json and lockfile unchanged |
| `pnpm test dev/tests/aw2/save.test.ts dev/tests/infrastructure/protectedStorage.test.ts` | PASS | Initial affected run: 2 files, 38 tests; covered again by final full run |
| `pnpm test` | PASS | 81 files, 821 tests; includes SAVE-01/03 and existing legacy/native storage unit coverage |
| `pnpm typecheck` | PASS | Exit 0 |
| `pnpm typecheck:dev` | PASS | Exit 0, includes standalone dev screen and tests |
| `pnpm build` | PASS | Vite production build and release guard exit 0; existing large-chunk warning remains |
| Production entry scan after build | PASS | AW2 key/reset markers and standalone HTML absent from production output |
| `node dev/tools/verify-aw2-save.mjs --playwright /tmp/Quetica.FNOT.MigrationTool.stage/frontend/node_modules/playwright-core/index.mjs --chromium /usr/bin/google-chrome` | PASS | 29 flow checks, zero primary-context console/page errors; seeded legacy keys byte-identical |
| Capture inspection | PASS | `.asset-work/aw2-001/{desktop-save,mobile-reset}.png` viewed; modal readable with wrapped controls, no horizontal overflow |
| Physical devices / other engines / native durability / offline / FPS | NOT_RUN | Not replaced by desktop viewport checks or unit tests |

Initial environment failures: missing Capacitor modules blocked build/typecheck; frozen-lockfile install resolved them. Initial browser run hit stale optimizer modules after dependency replacement; restarting Vite with `--force` resolved it. Dialog cancel-focus check initially failed, then explicit focus/restore was implemented and all flow checks passed. A formatter produced an invalid inline union; corrected and final typechecks pass. No failed attempt is represented as PASS.

Coverage: read-only absent load; isolated create/save/reload; strict foreign/unknown/version/timestamp/revision checks; raw preservation for malformed/future saves; confirm/cancel/Escape/wrong phrase and request replay; denied reads and failed writes; stale save/reset, two cooperating writers with one winner; exact legacy bytes preserved; production entry excludes AW2.

Residual obligation: run affected suites after future schema/gameplay changes and full regression before release/major shared-engine merge. SAVE-02, GACHA-02 and BATTLE-02 stay NOT_RUN until those systems exist. Native browser crash/power-loss durability and non-cooperating external storage writers are outside this verified contract. [Detailed evidence](evidence/AW2-001.md).

## AW2-006A / schema v2 — 2026-10-20

Source/head `b3c526bdf37c03184fb68df150381f19e5f0723d`; base long-lived `72ee9b4360299db4bab9b9b43dba552dd80b86cf`, dependency handoff `9dec38e`. Subsequent edits documentation only. Same Linux/Node v22.23.2/pnpm 10.34.3 environment, Vite 8.0.5, Vitest 5.0.1; headless Chromium 153.0.8010.36. Viewports: save 1280×800 / 390×844, world 1280×1000 / 390×844. Isolated temporary browser profiles only; no physical devices.

| Command/check | Result | Observed |
| --- | --- | --- |
| `pnpm test dev/tests/aw2` | PASS | 2 files / 46 tests on identical precommit rule/save source; included in final full run |
| `pnpm test` | FAIL | 838 pass / 1 unchanged legacy TCG simulation timed out after 20s while checks ran in parallel; no AW2 assertion failed |
| `pnpm test --maxWorkers=2` | PASS | Entire suite, 82 files / 839 tests, 29.48s; source/test timeouts unchanged |
| `pnpm typecheck` | PASS | Exit 0 on source commit |
| `pnpm typecheck:dev` | PASS | Exit 0 on source commit, includes both dev entries/tests |
| `pnpm build` | PASS | Build + release guard exit 0; existing large-chunk warning |
| Production boundary scan | PASS | 49 JS/CSS/HTML artifacts contain no AW2 key/world markers; neither dev HTML emitted |
| `node dev/tools/verify-aw2-save.mjs --playwright /tmp/Quetica.FNOT.MigrationTool.stage/frontend/node_modules/playwright-core/index.mjs --chromium /usr/bin/google-chrome` | PASS | 29 schema-v2/reset/conflict/failure/legacy checks on source commit |
| `node dev/tools/verify-aw2-world.mjs --playwright /tmp/Quetica.FNOT.MigrationTool.stage/frontend/node_modules/playwright-core/index.mjs --chromium /usr/bin/google-chrome` | PASS | 18 world/quest/Pixi/pointer/blur/reload/legacy assertions on source commit |
| Local capture inspection | PASS | Street + mobile world and save/reset captures opened; debug-only art, no horizontal overflow |
| Full WORLD-02 / DUNGEON-01 / MODE-01 / battle / art / rights / devices / offline/FPS | NOT_RUN | Followers/full boss/loot/modes/authored art and device/runtime gates remain open |

New coverage: movement normalization/frame clamp/walls/borders/slide, safe reciprocal exits and gates, range, all six memory permutations, explicit acceptance/hand-in/choice and replay rejection, puzzle wrong-order retry/persistence, no fabricated pending rewards/wins, strict progression validation, byte-preserving read-only v1→v2 migration, failed starter commit keeps prior party/quest and retry cannot duplicate unlock. Rule modules contain no React/Pixi dependency. Quest receipts are derived completion markers, not a verified loot economy.

Default-run timeout is retained as runner sensitivity; do not label that attempt PASS. Capped-worker run supplies the final full-suite PASS, without changing gameplay or timeouts. Future shared-save/map/asset changes stale affected rows; full release regression including device/art/combat/loot/rights gates still required. Owner proposal approval recorded separately in CANON/DECISIONS, not inferred from tests. [Latest evidence](evidence/AW2-006A.md).

## AW2-004A reference assets — 2026-10-20

Base `944e4dff411c57ad903c7a7c332e91172cbf77f6`; source/head `5d1df97da61bbefca1bdbe27f27f6c28ed3ed694`, branch `feat/aw2-004a-than-assets`. Later changes documentation only. Linux x64, Node v22.23.2, pnpm 10.34.3, TypeScript 5.9.3, Vitest 5.0.1, Vite 8.0.5; Python/Pillow exact versions recorded in asset provenance. Existing Vite localhost:8452 returned HTTP 200; no new server needed. Open-PR connector query returned zero results in-session; no push/merge/release.

| Command/check | Result | Observed |
| --- | --- | --- |
| `python3 dev/tools/build-aw2-than-assets.py` | PASS | 40 measured frames, 8 battle states, 4 cue WAVs; 5,943,968 WebP bytes; source visible RGBA/alpha preserved; identical-byte precommit build |
| `python3 dev/tools/verify-aw2-than-files.py` | PASS | All source/output hashes/dimensions/alpha, 40 in-bounds/inset cells and edge alpha ≤8; four WAVs mono PCM22,050Hz, durations/non-silence/no clipping/faded ends |
| `pnpm test dev/tests/aw2` | PASS | 3 files / 54 tests on source commit, includes save/world regression and 8 asset/timeline cases |
| `pnpm typecheck` | PASS | Exit 0 on source commit |
| `pnpm typecheck:dev` | PASS | Exit 0 on source commit |
| `pnpm build` | PASS | Root production build + release guard exit 0; existing large-chunk warning |
| Production boundary scan | PASS | 49 text artifacts exclude Than IDs/assets/preview and AW2 development entries |
| `node dev/tools/verify-aw2-than-browser.mjs --playwright /tmp/Quetica.FNOT.MigrationTool.stage/frontend/node_modules/playwright-core/index.mjs --chromium /usr/bin/google-chrome` | PASS | 32 assertions, Chromium 153.0.8010.36; desktop 1280×1000 / mobile viewport 390×844; primary context no errors/missing assets |
| Capture inspection | PASS | Eight-state/four-direction/skill contact sheets and mobile preview opened; final peak FX captures inspected |
| Full suite / full ART-01 / real combat / devices / human audio listening / legal review | NOT_RUN | Selective task; prior full-suite result remains historical; remaining obligations retained |

Observed failures/repairs: initial HD sheet had bodies crossing equal-cell boundaries and was rejected; repaired through image_gen, then calibrated explicit rectangles for actual nonuniform source spacing. Initial FX sheet had excessive glow/gutter overlap; replaced through image_gen with isolated smaller effects. No failed sheet is used by runtime or labelled PASS. No SVG/geometry substitutes for missing authored skills. Peak-FX visual review found the auto shield covering the face; fixed by manifest-owned unit/contact attachment offsets and layers (final source 5d1df97), then all 32 browser checks/captures reverified. Pause-induced Audio.play AbortError is treated as intentional interruption; missing image remains an explicit error. Pixel edges were not repainted: selected source PNGs preserved, WebP only losslessly encoded. 16 world cels, 8 HD key poses + interpolated transforms, 16 FX cels accurately describe the motion method.

Current save/world logic/schema unchanged; their 46 unit cases reverified in the 54-case run, prior browser/world evidence remains at b3c526b for unchanged flows. No new full TCG/RPG regression claimed or required for this isolated asset/preview change; full release/major integration regression remains due. RIGHTS-01 is NOT_RUN: provenance inventory is not license clearance. Audio verified numerically/decoded in headless browser, not heard on human/real-device hardware. [Evidence](evidence/AW2-004A.md).

## AW2-004B four starter references / shared player — 2026-10-20

Base `7f9c6ab63637ab9d9eb4cf6fa6e7dfb649892bed`; source/head `f6a3b6655988d262a974f6f5034845740fd94766`, branch `feat/aw2-004b-starter-assets`. Checks on identical precommit implementation bytes; file audit also on this commit. Subsequent changes documentation only. Linux x64 / Node22.23.2 / pnpm10.34.3 / TS5.9.3 / Vitest5.0.1 / Vite8.0.5 / Chromium153.0.8010.36; Python/Pillow versions in each provenance. Existing localhost8452 HTTP200; fresh isolated browser profiles, 1280×1000 /390×844; no physical-device claim. Open-PR query returned zero results; no push/merge/release.

| Command / check | Result | Observed |
|---|---|---|
| `python3 dev/tools/build-aw2-starter-assets.py` | PASS | Four sets /160 new measured cells, sixteen WAVs, sixteen WebPs /16,509,218 bytes; lossless visible RGBA/alpha equality |
| `python3 dev/tools/verify-aw2-starter-files.py` | PASS | All five sets /200 actual cells; hashes/bounds/alpha/PCM/duration/non-silence/no clipping/fades; new source/prompt hash chains, four distinct portraits and sixteen distinct cues |
| `pnpm test dev/tests/aw2` | PASS | Four files /66 cases: all46 save/world +8 Than +12 starter cases; projectile/contact/repeated-cue boundaries and malformed manifests |
| `pnpm typecheck` / `pnpm typecheck:dev` | PASS | Both exit0, includes shared preview/selector/tests |
| `pnpm build` | PASS | Vite root build + release guard; existing >500k chunk warning |
| Production output scan | PASS | 49 text artifacts exclude all five starter IDs, AW2 key and dev preview/task markers; Than/starter HTML absent |
| `node dev/tools/verify-aw2-starter-browser.mjs --playwright /tmp/Quetica.FNOT.MigrationTool.stage/frontend/node_modules/playwright-core/index.mjs --chromium /usr/bin/google-chrome` | PASS | 133 assertions; all four eight-state/four-direction/skill/flight/selector/audio/pause/reduced-motion/portrait/mobile/missing-atlas checks; zero primary errors/failures;16 WAVs decoded; seeded save bytes unchanged |
| `node dev/tools/verify-aw2-than-browser.mjs --playwright /tmp/Quetica.FNOT.MigrationTool.stage/frontend/node_modules/playwright-core/index.mjs --chromium /usr/bin/google-chrome` | PASS | 32 assertions reverify Than after shared renderer/preview extraction |
| Visual review | PASS reference scope | Four HD contact sheets, world/skill/projectile sheets and all four mobile captures opened;71 new browser captures +7 QA sheets remain ignored locally |
| Current full suite / all12 ART-01 / real combat/leveling / physical devices / human audio / legal rights | NOT_RUN | Prior full839-test result remains at b3c526b; release/major engine integration full regression still due |

Three rejected Lua outputs (initial battle, initial FX, extra battle attempt) failed measured boundary checks; selected repair sheets pass. Early quick-preview RGB mistaken for an opaque background was corrected by real alpha inspection. Mộc Non uniform-grid build assertions failed, then explicit measured rectangles/row splits and declared alpha9/255 gutter tolerance preserved all source art; other sets tolerance8. No source painting/masking/mirroring/resizing or failed-attempt PASS. Sương Lành direction rows mapped to actual art and verified through browser captures.

Reference contracts only: Lua basic contacts220/380ms, Lam ultimate pulses520/1040ms; three ranged basics launch260/impact700ms with own flight/impact art. Timings/coordinates do not confirm gameplay impact or final balance. Passives require future combat events. All five fullCharacterComplete=false; seven sets NOT_CREATED; license REVIEW_REQUIRED/NOT_CLEARED. Forty-six save/world cases reverified; gameplay/save schema unchanged, prior world/save Chromium evidence remains historical. [Evidence and reports](evidence/AW2-004B.md).

## AW2-012 integration — 2026-10-20

Target base `72ee9b4360299db4bab9b9b43dba552dd80b86cf`; verified merged source `0e8fb7a893fa61ba2348843b06c1ece47dcad514`, current branch `game/adventure-world-2`. Following edits documentation only. All six feature heads are ancestors; runtime/assets/test/build paths exactly match b39fc49. Owner explicitly authorized this merge; source branches/master unchanged, no remote push/release. Linux x64 /Node22.23.2 /pnpm10.34.3 /Python3.12.3 /Chromium153.0.8010.36; same installed Vite/TS/Vitest environment, no dependency changes.

| Command/check | Result | Observed |
|---|---|---|
| Six `git merge-base --is-ancestor <feature> HEAD` checks | PASS | Save/story/roster/world/Than/starter heads all included, exact refs in task/evidence |
| Diff against b39fc49; approved story/roster/canon checks | PASS | Only AW2 docs differ;6 zones/8 NPCs/4 quests,12 IDs/48 skill slots/tier distribution retained; D10/D13/D14/D15 approved, D11 proposed |
| `pnpm test --maxWorkers=2 --reporter=default --reporter=json --outputFile=/tmp/aw2-012-unit.json` | PASS |84 files /859 tests,31.11s; no failed/skipped tests; includes all66 AW2 cases. Full suite ran without simultaneous build/browser |
| `pnpm typecheck` / `pnpm typecheck:dev` | PASS | Both exit0 |
| `pnpm build` | PASS | Vite build + release guard; existing >500k chunk warning |
| Production exclusion scan | PASS |49 text artifacts exclude AW2 IDs/save key/dev paths; all four dev HTML entries absent |
| `python3 dev/tools/verify-aw2-starter-files.py` | PASS |Five starters /200 cells; source/output hashes/alpha/visible-RGBA/PCM/durations/fades/provenance |
| `node dev/tools/verify-aw2-save.mjs --playwright /tmp/Quetica.FNOT.MigrationTool.stage/frontend/node_modules/playwright-core/index.mjs --chromium /usr/bin/google-chrome` | PASS |29 isolated save/migration/reset/conflict/failure/legacy checks |
| `node dev/tools/verify-aw2-world.mjs --playwright /tmp/Quetica.FNOT.MigrationTool.stage/frontend/node_modules/playwright-core/index.mjs --chromium /usr/bin/google-chrome` | PASS |18 six-zone/quest/puzzle/movement/reload/legacy checks |
| `node dev/tools/verify-aw2-than-browser.mjs --playwright /tmp/Quetica.FNOT.MigrationTool.stage/frontend/node_modules/playwright-core/index.mjs --chromium /usr/bin/google-chrome` | PASS |32 reference renderer/FX/audio/error/layout/legacy checks |
| `node dev/tools/verify-aw2-starter-browser.mjs --playwright /tmp/Quetica.FNOT.MigrationTool.stage/frontend/node_modules/playwright-core/index.mjs --chromium /usr/bin/google-chrome` | PASS |133 reference pose/direction/FX/projectile/cue/selection/error/mobile/legacy checks |
| Physical devices / actual combat / all12 ART-01 / rights / release | NOT_RUN |Unimplemented/unverified gates retained; full unit regression is not full-game/device/legal QA |

212 Chromium assertions PASS in fresh isolated profiles; zero unexpected primary errors and preserved seeded stable/AW2 bytes. Original source evidence remains scoped to original refs; current results are in [AW2-012 evidence](evidence/AW2-012.md). Eight document conflicts in each original proposal merge resolved explicitly, retaining approved/current text and old review evidence. Initial documentation whitespace check caught an extra trailing blank line, corrected; initial one-off canon checker assumed `APPROVED` without the recorded date, corrected to validate exact `APPROVED 2026-10-20` statuses. Neither issue required runtime changes. This merge's full-unit obligation is satisfied; repeat appropriate regression after future high-impact changes/before release, while device/art/combat/rights gates remain open.
