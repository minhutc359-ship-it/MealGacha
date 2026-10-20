# Handoff — 2026-10-20 / AW2-007B battle preview review

**Current branch:** `feat/aw2-007b-battle-renderer`. Draft [PR #80](https://github.com/minhutc359-ship-it/MealGacha/pull/80) targets the correct long-lived branch `game/adventure-world-2` at `179cc214e4fc8cee37fba34fbfe4416a26742bfb`. Remote implementation snapshot `df72ebf37c35467ec6f3a67c2683fcc6f3f919e9`, tree `294ceb03204f012560b974d842bbf70211b11f16`, matched the local documented implementation/evidence tree exactly; following remote commits are documentation-only. Implementation source tested at `31299a44704962b68fa6769860b1050e16e18fe2`. PR #79 remains separate on `master`. No merge, release, stable/AW2 save write or reset.

## AW2-007A/007B delivered

Pure `src/aw2/combat` rules now own deterministic combat truth for one-to-five units per side: serializable state, automatic movement/basic/auto skills, manual ultimate commands, queued casts/effects, target fallback, melee contact, ranged projectile impact, interruption, shields/healing/debuffs and terminal results. Ordered events are output only; renderer cannot decide hits or rewards. Five approved starter IDs and four skill ID slots stay canonical. Development tuning numbers are not final balance/canon.

Bounded starter behavior: Than shield-end/next-basic weaken; Lửa Nhỏ two contacts/focus cap; Lam Lam conditional heal/overheal shield cap; Mộc Non distinct-ally cadence/one interrupt guard; Sương Lành snapshot area ticks/per-target slow cooldown. Bosses default control-immune to pull. No React/Pixi, save, reward, world, leveling, gacha or stable app import.

AW2-007B adds pure presentation/leveling projections and `/dev/aw2/battle.html`. Event serials drive actor states, projectiles remain visible from launch until rule-authoritative hit/miss, and canvas reads authoritative HP/shield/energy. The page presents five starter atlases, auto tick, pause/step/reset, reduced motion and ultimates. Level1/5/10/20 values are explicitly development-only and never persisted. Enemy visuals are tinted starter reuse, not authored completion.

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

On exact implementation source 31299a4: **83 AW2 tests /6 files** and **876 full tests /86 files** with two workers PASS. Root/dev typechecks, formatter, `git diff --check`, Vite HTTP compile/asset smoke, production build/release guard and 851-file production exclusion scan PASS. Existing >500 kB chunk warning remains. [Evidence](evidence/AW2-007B.md).

AW2-007B Chromium verification is **BLOCKED** because this runner has no Playwright or browser binary. The verifier exists but was not run or called PASS. Earlier Chromium153 **212 checks** remain historical evidence for unchanged save/world/asset previews, not the new battle canvas. Physical devices/FPS/offline/native durability, world save/reload, actual boss/reward, persistent XP, final balance, full ART-01 and rights remain NOT_RUN.

Historical review evidence `evidence/AW2-002.md` and `AW2-003.md` is integrated; old pending/runtime statements are scoped to original proposal commits and superseded explicitly. The current full-unit obligation is fulfilled, but the browser acceptance criterion prevents AW2-007B from reaching VERIFIED here. Physical devices/FPS/offline/native durability, world-connected combat, full ART-01, human audio listening and legal approval remain NOT_RUN.

## Run and next owner

Run `pnpm dev`, then open `/dev/aw2/battle.html`; save harness `/dev/aw2/index.html`, world `/dev/aw2/world.html`, five-starter player `/dev/aw2/starters.html`, Than player `/dev/aw2/than.html`. Normal default localhost8443. No deployment. Future battle-browser reports/captures stay ignored under `.asset-work/aw2-007b/`.

BA/mechanic/animation/tester/scretary source review is complete; no independent browser/art/rights/device/final-balance approval implied. **Next tester:** run `verify-aw2-battle-browser.mjs` with Playwright/Chromium and inspect captures. **Then mechanic + BA/tester:** connect trusted boss result to world/save with once-only reward tests. Animation/character owe authored enemies, seven non-starter reference sets and all full-character gates. AW2-008 loot/cooking, AW2-009 safe modes, AW2-010/011 slice/release remain open. [Task](tasks/AW2-007B.md) · [evidence](evidence/AW2-007B.md).
