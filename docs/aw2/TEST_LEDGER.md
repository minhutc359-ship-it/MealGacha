# Test ledger / change impact
Statuses: NOT_RUN, PASS, FAIL, BLOCKED, STALE. PASS requires commit SHA, env, command, observed outcome. Prior PASS becomes STALE for affected changes. PR runs selective affected tests; full suite required before release/major cross-engine merge, and after high-impact save/shared engine changes.
| Case | Trigger | Result |
|---|---|---|
| SAVE-01 separate AW2 dev namespace preserves legacy save | save/reset | PASS — AW2-001, source `201c6b7`, isolated storage tests + Chromium (see run record) |
| SAVE-02 chest/battle/gacha atomic grants, no double reward | loot/store | NOT_RUN |
| SAVE-03 schema/reset conflicts, storage failures and serialized writers | save/schema/reset | PASS — AW2-001, source `201c6b7`, unit cases + Chromium (see run record) |
| GACHA-01 weights N/R/SR/SSR/UR seeded statistics | gacha/roster | NOT_RUN |
| GACHA-02 pity/shards/dupes and reload | gacha/save | NOT_RUN |
| WORLD-01 navigation, collision, zone transfer, spawn | world | NOT_RUN |
| WORLD-02 NPC, quest, followers and interact range | world/quest | NOT_RUN |
| BATTLE-01 range/contact/projectile/ultimate five team | combat/asset | NOT_RUN |
| BATTLE-02 battle return/save/reload, paused run | combat/save | NOT_RUN |
| ART-01 12 pixel 4dir + HD 8states + unique FX manifests | asset | NOT_RUN |
| DUNGEON-01 three+ rooms, puzzle, chest, boss | dungeon | NOT_RUN |
| MODE-01 TCG/Chess embedded and quick-entry safe | navigation | NOT_RUN |
| PERF-01 30/60 FPS targets, cold-load, memory, offline | asset/runtime | NOT_RUN |
| RIGHTS-01 art/audio provenance and legal check | asset | NOT_RUN |
No AW2 map/battle/gacha or playable vertical-slice tests have run. SAVE-01/03 verify the development save foundation only.

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
