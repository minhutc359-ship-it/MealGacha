# Handoff — 2026-10-20 / AW2-007B verified browser preview

**Current branch:** `feat/aw2-007b-browser-qa`. Verified implementation `9067376b728d12bb55fbce3b94f81e80e7675978`; base `f0d588461f2408a8e0a1ee49a78b36af5a8c7476`, the existing merge of [PR #80](https://github.com/minhutc359-ship-it/MealGacha/pull/80) into `game/adventure-world-2`. Local Git and live GitHub readback confirmed the merge; old draft/current-ref statements are superseded. PR #79 remains open, targeting legacy `master` work. This session only made local feature/document commits; no push, merge, deployment or owner save write/reset. Following documentation commits preserve this implementation.

## AW2-007A/007B delivered

Pure `src/aw2/combat` rules now own deterministic combat truth for one-to-five units per side: serializable state, automatic movement/basic/auto skills, manual ultimate commands, queued casts/effects, target fallback, melee contact, ranged projectile impact, interruption, shields/healing/debuffs and terminal results. Ordered events are output only; renderer cannot decide hits or rewards. Five approved starter IDs and four skill ID slots stay canonical. Development tuning numbers are not final balance/canon.

Bounded starter behavior: Than shield-end/next-basic weaken; Lửa Nhỏ two contacts/focus cap; Lam Lam conditional heal/overheal shield cap; Mộc Non distinct-ally cadence/one interrupt guard; Sương Lành snapshot area ticks/per-target slow cooldown. Bosses default control-immune to pull. No React/Pixi, save, reward, world, leveling, gacha or stable app import.

AW2-007B adds pure presentation/leveling projections and `/dev/aw2/battle.html`. Event serials drive actor states, projectiles remain visible from launch until rule-authoritative hit/miss, and canvas reads authoritative HP/shield/energy. The page presents five starter atlases, auto tick, pause/step/reset, reduced motion and ultimates. Level1/5/10/20 values are explicitly development-only and never persisted. Enemy visuals are tinted starter reuse, not authored completion.

Continuation repairs: `dev/aw2/battleSession.ts` owns one pure transition for battle, presentation, applied level and feedback. Selecting a pending level keeps current cards/ATK coherent until reset. Automatic/manual commands read the latest session; rejected ultimates preserve battle/view state. `battle-end` cancels pending visual flights without fabricated hit/miss/damage/rewards. The browser verifier accepts Windows paths, observes actual decoded atlas drawing with in-bounds rectangles, and tests a complete terminal/reset flow. Canonical spirit/skill/asset IDs, manifests, tuning, save schema and legacy gameplay are unchanged.

Changed implementation paths: `dev/aw2/{battle.tsx,battleSession.ts}`, `src/aw2/combat/presentation.ts`, `dev/tests/aw2/{battle-session.test.ts,battle-presentation.test.ts}`, `dev/tools/verify-aw2-battle-browser.mjs`. Task card preceded these edits. BA/mechanic/animation/tester/scretary role review was performed in-session; no independent agent sign-off is claimed.

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

At the AW2-012 integration checkpoint, runtime/assets/tests/build files exactly matched starter head `b39fc49`; that historical statement is superseded for current source by AW2-007A/007B at fdf4a60/31299a4. The six integrated source branches remain retained. PR #79 on `master` is outside this feature branch.

## What is present

AW2-001 isolated development save/reset and v1→v2 migration; approved AW2-002 story and AW2-003 twelve identities/kit/tier/starter direction; AW2-006A six connected debug zones, collisions/range/returns and first three quests/memory/puzzle plus one-time five-starter unlock. Stable namespace unchanged, writes use explicit actions, no owner profile/reset touched.

Five starter reference sets: Than, Lửa Nhỏ, Lam Lam, Mộc Non, Sương Lành. Each has four-direction chibi, eight HD key poses with interpolated tracks, portrait, authored FX/audio/provenance; three ranged basics have flight/impact art, Lua basic two contacts and Lam ultimate two pulses. These are reference presentation tracks, not gameplay impact/balance validation. All five fullCharacterComplete=false; seven others NOT_CREATED; rights REVIEW_REQUIRED / NOT_CLEARED. Full details/source prompts retained in [asset task](tasks/AW2-004B.md) and [asset evidence](evidence/AW2-004B.md).

World still uses debug objects/player; the battle preview is standalone and has no persistent leveling, authored enemies/followers, boss-result persistence, chest/loot/cooking/TCG/Chess/gacha adapter or completed vertical slice. Final boss/shortcut/ending gates stay closed until verified adapter/reward work. No fabricated rewards/wins. D11 rates/pity still need simulation and owner approval.

## Verification

Implementation `9067376`: **87 AW2 tests /7 files**, **880 full tests /87 files** with two workers, both TypeScript configs, six-file format check, whitespace check, production build/release guard and 851-file production exclusion PASS. Full suite 24.66s, no failures/skips in the corrected run. Existing >500 kB build warning remains. Chromium155 /Playwright1.64.1: **22 checks PASS** in fresh profiles; desktop1280×1000/mobile390×844/terminal captures opened. Seeded stable/AW2 bytes unchanged; no primary page/console/network errors. [Evidence](evidence/AW2-007B.md), [browser report](evidence/AW2-007B-browser.json).

Windows10.0.26200 x64, Node25.2.0, pnpm10.34.3, Vite8.0.5, Vitest5.0.1, TS5.9.3. pnpm/Playwright helper lives under ignored `.asset-work/aw2-tools/`; repo package.json/lockfile unchanged. Frozen-lockfile install restored missing Capacitor/dependency versions. Default Node25 full run FAILED (662 pass/15 failed,10 suites could not load) because Node's unconfigured localStorage getter throws; corrected full PASS uses `$env:NODE_OPTIONS='--no-experimental-webstorage'`. This disables Node's experimental Web Storage; browser checks still use real localStorage. Earlier narrow level-selection regression failed against baseline and now passes. Formatter's invalid inline object union was replaced with named interfaces before final typechecks.

Earlier Chromium153 **212 checks** remain historical for unchanged save/world/asset previews. BATTLE-02/SAVE-02, world/boss/rewards/persistent XP, physical devices/FPS/offline/native durability, full ART-01/human listening/RIGHTS-01 remain NOT_RUN. Visual inspection confirms a development reference preview, with small/crowded arena text on the mobile viewport; no finished mobile presentation claim. Historical AW2-002/003 review evidence remains preserved and superseded by approved canon.

## Run and next owner

Run `pnpm dev`, then open `/dev/aw2/battle.html`; save harness `/dev/aw2/index.html`, world `/dev/aw2/world.html`, five-starter player `/dev/aw2/starters.html`, Than player `/dev/aw2/than.html`. Normal default localhost8443. No deployment. Future battle-browser reports/captures stay ignored under `.asset-work/aw2-007b/`.

**Next smallest task / owner:** mechanic + BA/tester scope AW2-007C: trusted boss result → world quest/save transaction → reload, stale-tab/failed-write handling and once-only receipts. Do not grant numerical loot/XP until its budget is specified. The standalone preview must remain unable to grant world outcomes. Animation/character owe authored enemies, seven non-starter reference sets, readable mobile combat presentation and all full-character gates. AW2-008 loot/cooking, AW2-009 safe modes, AW2-010/011 slice/release remain open. Local fixes are ready for owner review; no merge is inferred. [Task](tasks/AW2-007B.md) · [evidence](evidence/AW2-007B.md).
