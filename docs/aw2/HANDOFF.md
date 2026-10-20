# Handoff — 2026-10-21 / AW2-012B direct development and branch cleanup

**Current standing instruction (D16):** continue AW2 functionality directly on `game/adventure-world-2`; create no new feature branch. At every completed task, run appropriate checks, update docs, commit and automatically push this exact branch, then confirm remote HEAD. This supersedes the earlier feature-only and one-time-integration policy in historical handoffs. [WORKFLOW](WORKFLOW.md), [task](tasks/AW2-012B.md).

**AW2-012B VERIFIED.** Baseline local/remote `ccddfd69404860e48829f79b588c65a7408054ef`; policy commit `3d0311084fd52a9ad618b0f5bebbe08110063e98` was pushed/read back before cleanup. Removed73 remote refs in one atomic deletion guarded by each audited head SHA, then3 local refs via `git branch -d`: feat/aw2-007b-browser-qa, feat/aw2-007c-world-boss and feature/foodchest-ui-v2. Refresh/readback confirmed every selected ref absent; all original commits remain reachable from retained AW2/master. [Exact names/SHAs/results](evidence/AW2-012B-branches.json).

**Retained:**6 remote branches — master, game/adventure-world-2, feat/web-v450-traps, feat/web-v5924-japan-models, research/soul-of-meal-v4-major-update, rpg. The last four each have commits outside AW2/master; do not discard them based on age. PR #79 remains open with original head441ada9/basef9d3925. Rpg retains5f14e42 (new merge of PR #81). Local branches now only AW2 and master9884358; master was not updated. Runtime/assets/tests/build bytes match baseline; game tests/build/browser NOT_RUN this task. Policy consistency/whitespace/ref/ancestry checks PASS; prior891-unit/91-browser evidence remains historical, not a fresh run. Following completion evidence changes are documentation only and are pushed to AW2 under D16.

## Historical AW2-012A integration record

**Current branch:** `game/adventure-world-2`. Owner explicitly requested pushing all completed AW2 features into this branch (the spelling `advanture` resolves to the canonical existing name, as in AW2-012). Task card AW2-012A preceded integration. Refreshed remote baseline `f0d588461f2408a8e0a1ee49a78b36af5a8c7476`; fast-forwarded and pushed completed head `82b85cd054e001d8a8dafbc9ea4467f5442842dc`. Remote readback matched exactly. This includes feature heads7bb0bf1 and82b85cd plus all six historical foundation feature heads; no conflict resolution or new runtime changes. Following handoff changes are documentation only. [Task/checks](tasks/AW2-012A.md).

**Fresh integration checks on82b85cd:** full891 tests /88 files PASS,23.23s with two workers and the documented Node25 option; root/dev typechecks, build/release guard and851-file production exclusion PASS (72 HTML/JS/CSS/JSON artifacts scanned). Runtime/assets/test/build files exactly match82b85cd. Eight feature ancestry checks PASS. Local master9884358, remote masterf9d3925 and both completed source feature refs unchanged. Browser checks NOT_RUN this task; prior91 Chromium assertions remain valid source-bound evidence at03b92e2, not a fresh run. PR #79 excluded. No deployment/release or owner save/reset.

**Next smallest task / owner:** mechanic + BA specify AW2-008 numerical loot/XP/inventory and cooking contracts, then tester verifies item/receipt atomicity. Authored boss/seven spirit sets/mobile/device/rights gates remain open. AW2-012A's one-time-integration policy is now superseded by standing D16 direct AW2 development/push. BA/tester/scretary reviews performed in-session; no independent agent or device/legal sign-off.

**Historical feature push:** `feat/aw2-007c-world-boss` first matched8e379a6 after implementation/evidence, then reached82b85cd with documentation-only updates; `feat/aw2-007b-browser-qa` matched7bb0bf1. Both heads were included by AW2-012A; redundant branch refs were subsequently deleted by AW2-012B while their commit histories remain reachable. Initial feature push waited for GCM's account picker; scoped cached owner selection resolved it. Use WORKFLOW's direct-AW2 command for future pushes; no global account configuration changed.

## AW2-007A/007B/007C delivered

Pure `src/aw2/combat` rules now own deterministic combat truth for one-to-five units per side: serializable state, automatic movement/basic/auto skills, manual ultimate commands, queued casts/effects, target fallback, melee contact, ranged projectile impact, interruption, shields/healing/debuffs and terminal results. Ordered events are output only; renderer cannot decide hits or rewards. Five approved starter IDs and four skill ID slots stay canonical. Development tuning numbers are not final balance/canon.

Bounded starter behavior: Than shield-end/next-basic weaken; Lửa Nhỏ two contacts/focus cap; Lam Lam conditional heal/overheal shield cap; Mộc Non distinct-ally cadence/one interrupt guard; Sương Lành snapshot area ticks/per-target slow cooldown. Bosses default control-immune to pull. No React/Pixi, save, reward, world, leveling, gacha or stable app import.

AW2-007B adds pure presentation/leveling projections and `/dev/aw2/battle.html`. Event serials drive actor states, projectiles remain visible from launch until rule-authoritative hit/miss, and canvas reads authoritative HP/shield/energy. The page presents five starter atlases, auto tick, pause/step/reset, reduced motion and ultimates. Level1/5/10/20 values are explicitly development-only and never persisted. Enemy visuals are tinted starter reuse, not authored completion.

Continuation repairs: `dev/aw2/battleSession.ts` owns one pure transition for battle, presentation, applied level and feedback. Selecting a pending level keeps current cards/ATK coherent until reset. Automatic/manual commands read the latest session; rejected ultimates preserve battle/view state. `battle-end` cancels pending visual flights without fabricated hit/miss/damage/rewards. The browser verifier accepts Windows paths, observes actual decoded atlas drawing with in-bounds rectangles, and tests a complete terminal/reset flow. Canonical spirit/skill/asset IDs, manifests, tuning, save schema and legacy gameplay are unchanged.

AW2-007C adds `src/aw2/world/encounter.ts`: a WeakMap-private actual battle with detached renderer snapshots and only tick/ultimate/retreat commands. Start requires active final quest/canonical boss/range/approved party, and a successful safe checkpoint write. Factory reads its validated schema v3 checkpoint directly; result is bound to those exact raw bytes/save identity. `Aw2DevSaveStore.finishBoss` applies real terminal/retreat progress atomically under Web Locks. Ordinary save cannot introduce a win. Failed writes leave the authentic terminal retryable; changed/reset saves reject stale results.

Win returns to safe Phòng Bàn; loss/retreat to Sân with objectives preserved. Reload/reread abandons any uncommitted attempt at its saved checkpoint, never grants victory and does not resume the live battle. Explicit note-read then either approved Bà ending completes the fourth derived receipt once; safe reciprocal shortcut unlocks afterward. Save v3 migrates valid1/2 in memory, writes only on explicit actions and preserves all old progress/identity. No numerical XP/items. Boss canonical ID explicitly borrows the tinted Than atlas; own art/signature kit remains unfinished.

AW2-007C paths: `src/aw2/save/{schema,store}.ts`, `src/aw2/world/{ids,maps,model,rules,encounter}.ts`, `dev/aw2/{world,WorldBattle,BattleCanvas}.tsx`, `dev/tests/aw2/{save,world,world-encounter}.test.ts`, `dev/tools/{verify-aw2-save,verify-aw2-world,aw2-world-boss-flows}.mjs`. Task card preceded code. BA/mechanic/story/animation/tester/scretary reviews performed in-session; no independent agent sign-off.

## Integrated history

| Source branch | Exact integrated head |
|---|---|
| feat/aw2-001-dev-save | 9dec38e2da40d086b9d1ed7be93af1f6ab141a71 |
| feat/aw2-002-story-bible | 238708cba7bb1402ec38828aa8748e35aee01ad9 |
| feat/aw2-003-roster-review | 4b8553c21e191aa5ed964dca338fc243c2d0ebc6 |
| feat/aw2-006-world-foundation | 944e4dff411c57ad903c7a7c332e91172cbf77f6 |
| feat/aw2-004a-than-assets | 7f9c6ab63637ab9d9eb4cf6fa6e7dfb649892bed |
| feat/aw2-004b-starter-assets | b39fc49446723586a12101898abea48250914b16 |

All six heads are ancestors of the long-lived branch. Task-card commit `0c70238` preceded merges; implementation merge `14a044c`, original story merge `1794e0c`, original roster merge `0e8fb7a`. The implementation chain already contained save/world/Than/starter dependencies and cherry-picked proposal sources. Original story/roster branches added their remaining history and review evidence. Eight conflicts per review branch were documentation only; retained the latest approved CANON/status/task/proposal notices, preserved original evidence/static-review history with explicit historical scope. D10/D13/D14/D15 stay approved; D11 stays proposed. No new canon/gameplay or code conflict.

At the AW2-012 integration checkpoint, runtime/assets/tests/build files exactly matched starter head `b39fc49`; that historical statement is superseded for current source by AW2-007A/007B at fdf4a60/31299a4. Integrated source commit histories remain reachable from AW2 even when redundant branch refs are removed by AW2-012B. PR #79 targeting master remains separate and its branch is retained.

## What is present

AW2-001 isolated save/reset now supports v1/v2→v3 migration; approved AW2-002 story and AW2-003 twelve identities/kit/tier/starter direction; AW2-006A debug zones/first three quests/puzzle/starter unlock; AW2-007C final quest/real development boss/checkpoint/note/endings/shortcut. Stable namespace unchanged, explicit writes only, no owner profile/reset touched.

Five starter reference sets: Than, Lửa Nhỏ, Lam Lam, Mộc Non, Sương Lành. Each has four-direction chibi, eight HD key poses with interpolated tracks, portrait, authored FX/audio/provenance; three ranged basics have flight/impact art, Lua basic two contacts and Lam ultimate two pulses. These are reference presentation tracks, not gameplay impact/balance validation. All five fullCharacterComplete=false; seven others NOT_CREATED; rights REVIEW_REQUIRED / NOT_CLEARED. Full details/source prompts retained in [asset task](tasks/AW2-004B.md) and [asset evidence](evidence/AW2-004B.md).

World still uses debug objects/player. Boss result/note/endings/shortcut are connected; the independent battle preview remains unable to grant them. Persistent leveling, authored enemy kit/art/followers, numerical chest/loot/cooking/TCG/Chess/gacha adapters and finished vertical slice remain pending. D11 still needs simulation/owner approval. Application-local controller checks are not server anti-cheat against users editing their own source/storage.

## Verification

Implementation `03b92e2`: **98 AW2 tests /8 files**, **891 full tests /88 files**,32.93s with two workers and no failures/skips; both TS configs,16-file format/whitespace checks, production build/release guard and 851-file exclusion PASS. Build has pre-existing large-chunk and plugin-timing warnings. Chromium155 /Playwright1.64.1: **40 full world/boss checks +29 save/reset checks +22 independent battle checks =91 assertions PASS**, fresh profiles,1280×1000/390×844 viewports. New boss desktop/mobile and ending captures opened. World primary console/page errors zero; seeded stable bytes preserved. [Evidence](evidence/AW2-007C.md), [report](evidence/AW2-007C-browser.json).

Windows10.0.26200 x64 /Node25.2.0 /pnpm10.34.3 /Vite8.0.5 /Vitest5.0.1 /TS5.9.3. Ignored pnpm/Playwright helper `.asset-work/aw2-tools/`; package.json/lockfile unchanged. Full unit command uses `$env:NODE_OPTIONS='--no-experimental-webstorage'` from the prior verified Node25 runner workaround; browsers still exercise real storage. Initial development defeat expectations at lower boss attack failed, then actual simulation selected the documented development fixture (auto-only loses tick49, ultimates from tick5 win tick41). First full browser attempt failed because its second battle checked dataset before first canvas paint; explicit first-frame wait fixed the verifier, final40 pass. Named interfaces repair formatter-corrupted inline types. Earlier implementation mistakes/failures are retained in evidence.

BATTLE-02 development boss/checkpoint and SAVE-02 boss/derived-completion subsets now PASS. Full item/chest/gacha grants, persisted active-battle resume, production/native/device/FPS/offline, full ART-01, human listening and RIGHTS-01 remain NOT_RUN. Mobile canvas text and card columns are small/narrow despite no overflow. Earlier212 checks remain historical for unchanged asset/source milestones; current save/world checks supersede their affected rows. Historical AW2-002/003 proposals remain archived and superseded by approved canon.

## Run and next owner

Run `pnpm dev` (default localhost8443; current local server127.0.0.1:8452). World `/dev/aw2/world.html`: finish first three quests, accept Thêm một chén at Dì, go Phòng Bàn→boss→save result→read note→Bà→explicit ending. Independent battle `/dev/aw2/battle.html`; save/reset `/dev/aw2/index.html`; assets `/dev/aw2/starters.html` and `/dev/aw2/than.html`. No deployment. `verify-aw2-world.mjs --boss` runs the new full flow; QA artifacts ignored under `.asset-work/aw2-007c/`.

**Next smallest task / owner:** mechanic + BA specify AW2-008 numerical loot/XP/inventory and cooking contracts, then tester verifies actual item/receipt atomicity. Keep standalone preview unable to grant world outcomes. Animation/character owe authored boss kit/art, seven non-starter sets and readable mobile combat; AW2-009/010/011 remain open. **Ongoing owner preference (D16):** work directly on AW2, verify/docs/commit then push game/adventure-world-2 after each completed task; create no feature branch. Master/deployment/release restrictions remain. [Task](tasks/AW2-007C.md) · [evidence](evidence/AW2-007C.md).
