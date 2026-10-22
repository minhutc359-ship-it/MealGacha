# Test ledger / change impact
Historical roster review preserved by AW2-012: source `4d8f1c516f55a0ffd4bad992624c465fe65a9146`, handoff `4b8553c21e191aa5ed964dca338fc243c2d0ebc6`; static structure checks PASS (twelve IDs, 48 skill slots, eight HD-state requirements, proposed tier distribution). [Original evidence](evidence/AW2-003.md). This is proposal-only historical evidence; current approval/asset status comes from CANON/D10/D13/D15 and subsequent records.

Historical story review preserved by AW2-012: source `461c7cfaac658618d96ca8020ac99076fad9e35d`, handoff `238708cba7bb1402ec38828aa8748e35aee01ad9`; static namespace/reference checks PASS (six zones/eight NPCs/four quests, acyclic prerequisites), `git diff --check` PASS. [Original evidence](evidence/AW2-002.md). This describes the original proposal-only branch; current approval/runtime status comes from CANON/D14 and later integration records below.

Statuses: NOT_RUN, PASS, FAIL, BLOCKED, STALE. PASS requires commit SHA, env, command, observed outcome. Prior PASS becomes STALE for affected changes. PR runs selective affected tests; full suite required before release/major cross-engine merge, and after high-impact save/shared engine changes.
Owner refinement after004E: reuse original-SHA PASS when implementation/dependencies are unchanged; run changed/dependent cases only. Historical004G ran69 affected cases only. Current007D changes shared core and therefore ran the full1036-case suite; see fresh record below. Do not relabel historical full1007/471 as fresh or add counts. Full regression before release/major save/shared-engine changes remains required.
| Case | Trigger | Result |
|---|---|---|
| SAVE-01 separate AW2 dev namespace preserves legacy save | save/reset | PASS development —910b55b;1036 full units/47 fresh earned journey/26 boss gates preserve seeded stable bytes; deep unchanged reset cases retain original refs |
| SAVE-02 chest/battle/gacha atomic grants, no double reward | loot/store | PASS development quest/chest/cooking/XP/boss subset —910b55b;1036 units/47 earned journey/failed-win write retry and exact settlement; runtime gacha/spending NOT_RUN |
| SAVE-03 schema/reset conflicts, storage failures and serialized writers | save/schema/reset | PASS full units +boss-write retry subset —910b55b; deeper unchanged browser reset/schema/concurrent-tab cases retain cf0b394/a40217a refs |
| GACHA-01 weights N/R/SR/SSR/UR seeded statistics | gacha/roster | PASS simulation-only proposed D11 —a40217a;2,000,000 seeded draws +boundary/pity tests; owner approval/runtime adoption pending |
| GACHA-02 pity/shards/dupes and reload | gacha/save | NOT_RUN runtime; proposed counters have pure simulation tests only |
| WORLD-01 navigation, collision, zone transfer, spawn | world | PASS development —910b55b;47 fresh compiled earned all-zone journey; authored maps/physical devices pending |
| WORLD-02 NPC, quest, followers and interact range | world/quest | PASS development —910b55b;47 fresh earned journey with5 starters/portals/returns; authored art/device gates open |
| QUEST-01 first 3 quests, starter unlock, puzzle retry and reload | quest/save/world | PASS development —910b55b;47 earned all4-quest/new boss/note/both-ending compiled checks,243 AW2 units |
| BATTLE-01 range/contact/projectile/ultimate five team | combat/asset | PASS affected presentation —2684954;49 units/39+39 boss/final12+12 nav/22 compiled standalone; unchanged core full1036 at910b55b |
| BATTLE-02 battle return/save/reload, paused run | combat/save | PASS development —910b55b;26 targeted boss +47 earned compiled journey, real loss/win/retreat/failed write/note/endings; active-battle resume/native/production NOT_RUN |
| ART-MUOI-01 world4dir/HD8states/projectile/mark FX/preview | asset/roster | PASS reference atAW2_004J_SOURCE_REF;64 cells/32 HD,73 affected units/49+49 preview+8 compiled onboarding; actual Muối combat/collection/full DoD NOT_IMPLEMENTED |
| ART-BOSS-01 original boss art/manifest/confirmed effects | asset/combat | PASS reference —2684954;17 safe cells/8 key poses/9 FX, hashes/repeat build, actual own left-facing/no recolor/cancel; full motion/world/audio/device/rights OPEN |
| ART-01 12 pixel 4dir + HD 8states + unique FX manifests | asset | NOT_RUN as full 12-unit case; six spirit reference sets verified below |
| ART-THAN-01 frames/manifests/timelines/FX/audio preview | asset | PASS reference motion —f85e1e7;72 rectangles/32 new cels,35+35 motion/32 Than previews/actual combat and world; independent full-DoD gates OPEN |
| PROVENANCE-THAN source/prompt/hash inventory | asset | PASS inventory only —f85e1e7; selected/rejected motion prompt/output hashes,14 originals unchanged; legal NOT_RUN/commercial NOT_CLEARED |
| ART-STARTERS-01 four other starter frames/projectiles/cues/selector | asset | PASS affected Sương reference scope —489ce7162df7db11b1b1954d0b0a62b4d073fe17;41+42 motion/combat,5 starter motion packages; unchanged selector/original audio/world retained atcf0b394 |
| ART-LUA-01 32 cels/eight states/reference and confirmed contacts | asset/combat | PASS reference scope —cef55c0;72 rectangles,38+38 motion/confirmed beats,7 new unit cases, actual world use; full DoD OPEN |
| ART-LAM-01 32 cels/eight states/projectile/two healing pulses | asset/combat | PASS original inventory/motion atcf0b394;12 fresh compiled renderer checks at489ce7162df7db11b1b1954d0b0a62b4d073fe17; full DoD OPEN |
| ART-MOC-NON-01 32 cels/eight states/projectile/confirmed support | asset/combat | PASS reference scope —1803347;72 rectangles,38+38 Moc motion/actual support/7 new cases, own-art recipients/finite FX; 14 affected compiled renderer checks at489ce7162df7db11b1b1954d0b0a62b4d073fe17; full DoD OPEN |
| ART-SUONG-01 32 cels/eight states/ranged/confirmed zone | asset/combat | PASS reference subset —489ce7162df7db11b1b1954d0b0a62b4d073fe17;41+42 browser/7 new cases, three actual zone ticks/slow/pull/finite reduced/terminal; full DoD OPEN |
| PROVENANCE-STARTERS original image/audio inventory | asset | PASS Sương changed inventory —489ce7162df7db11b1b1954d0b0a62b4d073fe17;72 rectangles/32 cels/source-prompt-reference hashes,124 unchanged boundaries/102 repeat identities; other inventory source-bound; rights NOT_RUN |
| DUNGEON-01 three+ rooms, puzzle, chest, boss | dungeon | PASS debug development subset —a40217a;3 rooms/puzzle/once-only chest/real boss/return; full authored dungeon/balance/device pending |
| MODE-01 TCG/Chess embedded and quick-entry safe | navigation | PASS embedded borrowed-practice/navigation subset —ff499a5;19 Chess/25 TCG cases,33+33 Chess/29+29 TCG/26+26 navigation browser checks; production mode balance/art/device/prizes/persistence NOT_RUN/out of scope |
| CTRL-01 map shortcuts/native UI/focus/Enter direction | world/UI | PASS —cf0b394; unchanged12 policy cases in1007 full units and47+47 earned journeys |
| DEMO-01 one fresh earned RPG/TCG/Chess journey/both endings | demo integration | PASS automated —b836a82;55 fresh compiled checks/all quests/both ending summaries/exact returns/no extra grants/mobile; owner mode smoke only, full player coverage NOT_RUN |
| PERF-01 30/60 FPS targets, cold-load, memory, offline | asset/runtime | NOT_RUN |
| RIGHTS-01 art/audio provenance and legal check | asset | NOT_RUN |
Retained shared-core baseline AW2-007D source `910b55bf977557f11be03111afa40283df0fbcf1`: PASS1036 unit tests/102 files (243 AW2,10 new), both typechecks/format/syntax/whitespace, review build107 files/34,718,397 bytes and stable build/release guard/isolation851 files/76 text artifacts.95 fresh compiled browser assertions:26 final boss +47 earned full journey/both endings +22 standalone battle. Nine actual-seed simulations PASS. Full units/47-case journey use final core before UI-only opacity/scroll-margin refinement; final dev types/build/26 boss gates cover the delta. Demo≈90% (9/10 groups), full product≈40% (rough35–45%) unchanged. Boss rules improve an already counted development group; full playtest/art/release gates remain open.5/5 starter reference-motion packages/160 cels,0/12 full DoD,7 absent sets. Owner feedback2026-10-22: “Đã chơi, chưa thấy lỗi chặn”. Record as a partial player smoke observation; version/device/covered quests/endings were not supplied. Full independent playtest gate remains NOT_RUN until coverage is recorded; do not infer complete acceptance from this response.

## AW2-004J Muối reference package —2026-10-22

Source `AW2_004J_SOURCE_REF`, tree `AW2_004J_SOURCE_TREE`, base `c558faab1df548463abfe80e2cc4de4f7a67f479` on game/adventure-world-2. D16 exact-tree publication and fresh clean remote readback are required before final handoff; source refs are filled in the docs-only completion descendant. 73 affected tests/5 files PASS on first run,7 new Muối cases,557ms; both types PASS (root once, dev after compatibility fix),9-file format/syntax/whitespace PASS.49 source+49 compiled Muối preview assertions and8 compiled changed-consumer onboarding/build assertions PASS,106 fresh browser assertions total. Full current-head suite NOT_RUN. Muối Đen aw2-muoi/R/Muối rang/Debuffer has an original full-body identity portrait,16 four-way world cels,32 HD motion cels/eight states,16 FX cells and four unit-owned synthesized audio cues.64 measured rectangles, new edge alpha≤2/255 (declared tolerance8). All selected PNG pixels preserved; lossless visible RGBA/alpha verified, measured per-column rectangles/foot anchors/logical scale1.5 only, no repaint/mask/mirror/pixel resize. Five unique WebPs4,622,842 bytes/decoded RGBA31,455,136 bytes;17 scoped files repeat-byte-identical. Separate ROSTER_ASSETS reference registry and roster.html preview expose six authored sets while STARTER_ASSETS/team/save contract stay fixed at five. ROSTER reflects Muối reference availability and six missing sets; collection is not inferred from art availability. Shared AssetPreview has an explicit combat-readiness prop: starters keep prior copy; Muối clearly says kit/collection pending. Original AssetCanvas/playback, starter/boss manifests/images/audio, combat engine, save schema/store, economy and mode rules unchanged. Muối basic flight260→700ms uses separate projectile0/1 and finite impact2/3; mark420/refresh180/burst560 are reference cues only. Preview never applies damage/marks/dispels, grants a unit or writes saves.

Ten built-in image_gen calls: five selected outputs and five rejected intermediates. A initial and first edit lose the jar in a release cel; third A attempt crops last-row feet; final single-cel jar repair selected. B initial and first edit have unsafe row boundaries, independent compact replacement selected. World/portrait/FX initial outputs selected. Prompt/source/reference hashes include every selected/rejected attempt, no external art. Independent face/jar/hand/cloth/turn/foot-contact/loop/inbetween approval remains open; generated reference poses do not close full art DoD.

Initial dev typecheck FAIL because Object.hasOwn is unavailable in its target lib; replaced with Object.prototype.hasOwnProperty.call, preserving prototype-query safety, then reran dev typecheck only PASS. Root typecheck/unit cases already passed and were not repeated. First unchanged-boundary audit referenced nonexistent world/engine.ts; corrected to tracked world rule paths and final143-path proof PASS. Five unsafe/continuity image attempts rejected as above; no failed asset enters runtime. No unit/browser assertion failure. Review build rerun after final UI compatibility fix, before final browser runs; no builder/source mutations during browser verification.

Prior full1036-unit/core/save evidence at910b55bf977557f11be03111afa40283df0fbcf1,55 earned demo assertions atb836a82f3cb8babf1087e6ac32603de1f83336de and boss presentation at26849546825131a5c448645274880977caa9d230 retain source-bound PASS within unchanged implementation boundaries.143 paths match base, including core/save/world rules/economy/modes/original starter/boss assets/helpers and stable entry/dependencies; only roster availability metadata changes. Changed roster consumers are covered by world/save units and a narrow fresh onboarding/build browser smoke. No full quest/mode/boss journey or unrelated original asset suite rerun/counted fresh. Full regression remains due before release or shared-engine/save changes (including next007E). Six captures opened, three supplemental peak FX captures add no test counts; desktop320/390/768 viewport checks do not approve physical devices. Review125files/41,629,173bytes/source exclusions, stable851files/49text/release guard/exclusion PASS. [Commands/evidence](evidence/AW2-004J.md), [JSON](evidence/AW2-004J-verification.json), [unchanged hash proof](evidence/AW2-004J-reused-evidence.json). Demo9/10≈90% and full product≈40% (rough35–45%) unchanged. Authored spirit reference sets6/12=50% (was5/12), six absent; starter motion5/5=100%/160 cels unchanged; Muối adds32 cels separately.0/12 full DoD. One reference package does not close actual kit/leveling/collection/independent art/audio/device/rights/release gates or supply accepted-character production velocity. Next007E shared-core kit/full regression.

## AW2-004I original boss reference —2026-10-22

Base `97b9b27fc9f6d0d18873b0d97420f2031efc1092`, source `26849546825131a5c448645274880977caa9d230`; later completion docs only. Eight original HD key poses,9 three-skill effect cells and exact idle-crop portrait.17 actual alpha-safe frames, source/runtime hashes and visible RGBA+alpha verified;8 repeat-build files byte-identical. Three built-in image_gen calls: initial unsafe body rejected, repaired body and style-referenced FX selected; no external art. Runtime3 WebPs2,163,576 bytes/decoded RGBA12,922,920 bytes. Single-key-pose reference tracks, no full motion/world/audio/rights completion claim. 49 affected units/7 files PASS (6 new boss cases;43 unchanged in-session PASS retained, only6 rerun after a sampler bound). Both typechecks/8-file format/syntax/whitespace PASS.39 source+39 compiled full boss gates PASS before a final CSS-only arena-scroll-margin fix;12 source+12 compiled navigation-only delta checks PASS after that fix, plus22 compiled standalone battle checks. Do not add overlapping navigation/full-run checks into a unique total. Final review112 files/36,902,504 bytes/source exclusions PASS; stable851 files/72 text artifacts/release guard/AW2 isolation PASS.

Windows10.0.26200/Node25.2.0/pnpm10.34.3/TS5.9.3/Vitest5.0.1/Vite8.0.5/Chrome155.0.8059.85/Playwright1.64.1/sharp0.35.5 isolated QA. Actual loss51/win43/failed-write retry/retreat/terminal art cancellation/source bounds/no tint/flip all PASS; no outcome injection. Initial types FAIL missing portrait transparency metadata, measured builder fix and root/dev rerun PASS. No unit/browser FAIL. Final CSS-only arena margin fixed observed overlay; scoped navigation gate rerun only, no redundant full boss repeat. Prior39+39 reports predate CSS delta;12+12 final scoped reports validate it. Five captures opened,2 final mobile. Sources8470/8471/8472 closed.

Core/store/schema/economy/world rules/maps/modes/original starter assets/playback/audio/config/dependencies unchanged. Historical full1036 at910b55b/earned55 atb836a82 retain original refs, not counted fresh. Owner tried TCG/Auto Chess but has not finished the journey; full end-to-end player acceptance remains NOT_RUN. Own boss motion/world object/audio, final balance, physical devices/FPS/offline/listening/rights/native/production-save/release gates remain open. fullEnemyComplete=false, no collectible identity/rarity change, no Vân identification. D11 PROPOSED/D12 OPEN. Demo9/10≈90%, product≈40% (rough35–45%) unchanged: this is one reference-presentation deliverable, not a closed independent-playtest/full-character/release gate.5/5 starter motion/160 cels,0/12 full DoD/7 absent spirit sets remain. Next004J. [Commands/evidence](evidence/AW2-004I.md), [JSON](evidence/AW2-004I-verification.json).

## AW2-010B saved demo completion —2026-10-22

Base `a8f8dfa206f5045cebcb4b43e5875c9f6344662f`, source `b836a82f3cb8babf1087e6ac32603de1f83336de`; later documentation only. 55 fresh compiled earned-journey browser assertions PASS, including saved wait/share summaries, no summary on incomplete save, exact reload/no extra grants,320/390px48px controls and safe post-ending TCG/Chess checkpoint/returns. Both typechecks/scoped format/syntax/whitespace/review build PASS (107 files/34,720,421 bytes); one final mobile capture opened. Unchanged full1036-unit/core/save/economy/stable evidence retains source910b55b; not rerun or counted fresh. Owner2026-10-22 confirms TCG/Auto Chess tried, full journey not finished. Record partial human mode smoke; end-to-end player acceptance remains NOT_RUN, not inferred from the request to move to product. Demo9/10≈90% and product≈40% (rough35–45%) unchanged; no new full-character/release gate closed.5/5 starter reference motion/160 cels,0/12 full DoD/7 absent sets.

Commands: local pnpm typecheck/typecheck:dev; pnpm exec oxfmt then --check on DemoCompletion.tsx/verify-aw2-demo.mjs; node --check verifier; pnpm build:aw2; node dev/tools/verify-aw2-demo.mjs --compiled --playwright file:///D:/prj/MealGacha/.asset-work/aw2-tools/node_modules/playwright-core/index.mjs --chromium "C:/Program Files/Google/Chrome/Application/chrome.exe". Windows/Node25.2/Chrome155 isolated contexts. Errors0; no owner profile/reset/deployment. Source910b55b full1036/stable/provenance evidence reused within unchanged core/save/economy/modes/assets/config/dependencies, not fresh. Full current suite/physical devices/rights/playtest ending NOT_RUN. [Evidence](evidence/AW2-010B.md), [JSON](evidence/AW2-010B-verification.json). Next004I original boss presentation.

## AW2-007D actual boss kit / telegraphs —2026-10-22

Base `c56367a5836bc70efa7dbc92680ae567b7fb7bee`, source `910b55bf977557f11be03111afa40283df0fbcf1`; later docs only. Windows10.0.26200 x64/Node25.2.0/pnpm10.34.3/TS5.9.3/Vitest5.0.1/Vite8.0.5/Chrome155.0.8059.85/Playwright1.64.1. Fresh isolated contexts; no owner saves. Required BA/mechanic/story/character/animation/tester/scretary reviews in-session.

PASS1036 unit tests/102 files (243 AW2,10 new), both typechecks/format/syntax/whitespace, review build107 files/34,718,397 bytes and stable build/release guard/isolation851 files/76 text artifacts.95 fresh compiled browser assertions:26 final boss +47 earned full journey/both endings +22 standalone battle. Nine actual-seed simulations PASS. Full units use NODE_OPTIONS=--no-experimental-webstorage;10 new focused cases cover opt-in identity/targeting/sweep freeze/three beats/4 real contacts/expiry/passive block/source-death/terminal/JSON replay. Actual-seed simulation: XP0 auto loss51/manual48/hold43; XP160/205 wins50/45/42. Earned journey real win45,345XP/five receipts/either ending/reload/stable keys.26 targeted boss checks cover actual rule warnings/pause/reduced/audio-off320/390 controls/retreat/no live writes/loss/win/failed-win-write retry.22 standalone checks regress the other shared-engine consumer. Four final captures opened; errors0.

Full units/47 earned cases ran on final core/seed/transaction logic before final UI-only opacity/ResizeObserver scroll-margin fix. Final types/build/26 boss gates cover that delta. Core whitespace cleanup preserved all nonblank lines. Initial24 boss gates superseded by26, not added; no sum with historical89/471 counts. First180ATK retained fixture failed5 of19 tests; simulation selected135, failed world file reran11 PASS, then full1036 PASS. Initial sticky panel visual issues repaired and uncovered-control assertions added.

[Exact commands/results/limits](evidence/AW2-007D.md), [JSON](evidence/AW2-007D-verification.json). Save store/schema/economy/world maps/assets/manifests/audio/standalone canvas/config/dependencies match base; historical provenance/mode detail remains source-bound. Physical devices/FPS/offline/rights/listening/full art/final balance/production save/release NOT_RUN. Owner feedback2026-10-22: “Đã chơi, chưa thấy lỗi chặn”. Record as a partial player smoke observation; version/device/covered quests/endings were not supplied. Full independent playtest gate remains NOT_RUN until coverage is recorded; do not infer complete acceptance from this response.

Demo≈90% (9/10 groups), full product≈40% (rough35–45%) unchanged. Boss rules improve an already counted development group; full playtest/art/release gates remain open.5/5 starter reference-motion packages/160 cels,0/12 full DoD,7 absent sets. Next004I boss reference presentation; BA/tester full recorded playtest. D11 PROPOSED/D12 OPEN; D16 direct checks/docs/commit/push/readback. Compiled QA servers8471/8463/8472 closed.

## AW2-004H battle readability —2026-10-21

VERIFIED presentation subset. Base `24dcf77846a71f9df63b6c2321e19c2a431f8c2d`, implementation `aa0a3a645f15035cb72e16650cc2fa77b440237a`; following docs only. Windows10.0.26200/Node25.2.0/pnpm10.34.3/TS5.9.3/Vitest5.0.1/Vite8.0.5/Playwright1.64.1/Chrome155.0.8059.85. 43 affected unit tests /6 files (5 new), both typechecks/6-file format/syntax/whitespace PASS. Review build107 files/34,712,894 bytes/source exclusions PASS.89 fresh compiled browser assertions:29 layout/boss/readability +60 affected five-starter combat (Than7/Lửa9/Lam12/Mộc14/Sương18). Two baseline/seven final captures opened.

Commands: affected six explicit unit paths battle-layout/battle-presentation/battle-session/lam-motion/moc-motion/suong-motion with two workers and Node25 option; root/dev typechecks; six-file formatter; new runner syntax; build:aw2 and source-exclusion audit; verify-aw2-readability.mjs --compiled (29); verify-aw2-motion.mjs --compiled --combat-only for five starters (60). All PASS. Units1.08s,5 new cases. Source baseline/draft captures only; final assertions compiled.29 layout checks include a ready-quest v3 boss QA fixture, not a new earned quest journey. Source server8466 stopped; verifier-owned8469/8465 closed. [Exact commands/results/limits](evidence/AW2-004H.md), [JSON](evidence/AW2-004H-verification.json).

Core/events/save/economy/world/modes/assets/audio inputs/canon/stable entry/config/dependencies unchanged from base. Historical full1007 units/471 browser/stable exclusion evidence atcf0b394 is reused within unchanged boundaries, not rerun or counted fresh. Current-head full suite/stable build/earned full journey/physical-device/playtest/performance/rights NOT_RUN. Projection/labels/target geometry checks were STALE during edits and are superseded by these fresh gates; original animation/asset/audio/world/save/mode results retain their original refs. Actual decoded draw bounds, both Lua contacts, Lam healing pulses/targets, Moc shields/recipients and Suong repeated zones/reduced/terminal/pause PASS. First baseline command Unicode-selector timeout fixed using CSS selectors; no product failure/weakening. BA/animation/mechanic/tester/scretary reviews in-session. Demo≈90% (9/10 groups) and full product≈40% (rough35–45%) unchanged: independent playtest and full-character/release gates remain open.5/5 starter reference motion packages/160 cels,0/12 full DoD,7 absent sets. Next BA/tester: independent demo playtest through LOCAL_TEST/DEMO, collect reproducible blockers and scope fixes. Animation/character still owe own boss/map/NPC/seven sets/full DoD; device/audio/listening/rights/production-save/release gates open. D11 PROPOSED/D12 OPEN; D16 direct AW2 checks/docs/commit/push/readback.

## AW2-004G Sương motion / confirmed zones / local startup —2026-10-21

Source `489ce7162df7db11b1b1954d0b0a62b4d073fe17`, tree `1ebf5fbaec245dbe986731f640e02df337db4d44`, base `d5fc1a8f146a31097d0f81fc2bb4055f91642141` on game/adventure-world-2. D16 exact staged/remote tree and four binary Git SHA matches verified; expected-head/force=false publication, independent fetch/SHA/tree/index/ancestry and guarded local fast-forward PASS. Completion descendant changes docs only; final clean local/fresh remote comparison before handoff. 69 affected tests/8 files PASS (62 unaffected cases retained from first in-session run; corrected7-case fixture file rerun alone), both typechecks/4-file formatting/syntax/whitespace PASS.113 fresh browser checks:41 source+42 compiled Sương,12 compiled Lam+14 compiled Moc affected renderer only,4 documented local-startup checks. Full current-head suite NOT_RUN. Sương Lành aw2-suong/R/Bánh cuốn/mage retains identity/four skill IDs and original12 image/audio files,16 world cels/eight reduced HD poses. Two built-in image_gen calls/two selected initial sheets/no repair or external artwork add32 cels/eight states. A1303×1207/B1278×1230 use measured per-column cuts/foot anchors and logical renderScale1.45; unchanged source RGBA/lossless WebP/no repaint/mask/mirror/pixel resize.72 rectangles; new motion edge≤8/255. New WebPs2,521,164 bytes/decoded RGBA12,578,644 bytes; scoped repeat-build102 files byte-identical. Preparation/flight emit no outcome FX. Basic confirmed hits use actual-target impact cels2/3. Each real same-tick zone pulse groups source gesture/clock and actual recipient IDs across partial batches; three real ticks trigger three finite effects. Passive needs actual eligible slow status; pull statuses add no damage contact. Each target retains its own reaction art. Renderer expands actual recipients without clock restart and suppresses actor/confirmed FX at terminal. Existing finite180/440ms expiry including reduced motion stays unchanged. Engine/numbers/save/quests/economy/gacha/canon/dependencies unchanged.

Initial new fixture run67 PASS/2 FAIL: ultimate omitted required target and empty-zone fixture moved enemies before commit. Corrected fixtures only;7-case rerun PASS, other62 not repeated. Initial source-browser attempt raced the scoped builder manifest write and hot-reloaded (createRoot/startsWith/context destroyed); preserved failure record, final browser runs only after builder completion. No image repair/rejection or production behavior weakened.

Unchanged full1007 units/471 browser/stable851-file78-text exclusion/earned world-quest-save-mode journeys retain original-SHA PASS at cf0b39469d1fb8f7d77e18feb5e16895d70565a1; not rerun or added to fresh totals.124 byte-identical paths prove unchanged core/save/world/economy/modes/helpers/other assets/stable entry/config/dependencies against base; other manifests and original12 Sương files unchanged. Release/major save/shared-engine work still requires full regression. Four captures opened; arena/status/actor crowding persists. [Evidence/commands](evidence/AW2-004G.md), [concise observed results](evidence/AW2-004G-verification.json), [unchanged hashes](evidence/AW2-004G-reused-evidence.json). Demo9/10≈90% and full product≈40% (rough35–45%) unchanged. Starter reference motion5/5=100%, up from4/5=80%,160 new cels total.0/12 full DoD,5 reference sets/7 absent; motion completion uses a separate denominator. Independent playtest/art/anatomy/cloth/loops/contact/readability/audio binding/listening/device/FPS/offline/native/rights/production-save/release gates remain open. Next004H arena/readability. Local guide startup4 gates is not a complete quest/save journey. No deployment/release/owner reset.

## AW2-004F Moc motion / confirmed support / selective verification —2026-10-21

VERIFIED reference subset, full character DoD OPEN. Source `1803347bcff73e1500ef1d6219968f599c155114`, tree `ebe9ae1737eb499fb0356a26d8e034f1b716f5a4`, base local/fresh remote `ff44ab28d5a30a5f63b52b55db25a594118042e3`, game/adventure-world-2. D16 exact staged/remote tree and four binary SHA matches, expected-head/force=false publication, independent fetch/SHA/tree/index/ancestry and guarded local fast-forward verified. Completion descendant docs only; final fresh clean local/remote comparison before handoff. Task/owner skills/impact plan preceded edits. In-session BA/character/animation/mechanic/tester/scretary and imagegen/verification guidance; no independent agent/art/device/listening/rights sign-off. Linux7.0.0-38 x86_64 /Node22.23.2 /pnpm10.34.3 /TS5.9.3 /Vitest5.0.1 /Vite8.0.5 /Chromium153.0.8010.36. [Task](tasks/AW2-004F.md), [commands/raw evidence](evidence/AW2-004F.md), [Moc gates](MOC_NON_CHARACTER_GATES.md).

| Check | Status | Observed |
|---|---|---|
| Affected units | PASS |62 tests/7 files,708ms,7 new Moc cases,0 failed/pending; existing direct combat/presentation/Lam/Lua/playback/manifest consumers only |
| Types/4-file format/syntax/whitespace | PASS |Both TS configs/formatter/motion-runner syntax exit0 |
| Moc-only asset/provenance/rebuild | PASS |72 rectangles/32 new cels/new edge≤4/255/original world9,12 originals/other4 manifests unchanged;97 hashed asset paths repeat-byte identity/90 unchanged original boundaries;2 selected image_gen outputs, no repair |
| Changed review build/isolation | PASS |104 files/32,168,363 bytes, no PNG/code/maps/ZIP; new WebPs2,335,982 bytes/decoded RGBA12,584,856 |
| Moc source/compiled with --reuse-originals | PASS reference scope |38+38 eight-state/new cels/reference flight/confirmed target impact-shield/passive/grouped ultimate/own-art recipients/pause/reduced expiry/widths/missing-new-atlas/save bytes; unchanged audio/world gates skipped |
| Compiled Lam --combat-only | PASS affected renderer |12 confirmed pulses/target impacts/reduced expiry/pause/bounds/save/error checks; unrelated preview/atlas/audio/world skipped |
| Full suite/stable build/earned-world-save-mode/unrelated previews | NOT_RUN fresh |Unchanged PASS retained atcf0b394, full1007/471 not relabeled/added; byte/path proof recorded |
| Three captures opened | PASS reference scope |Source reduced battle/compiled new ultimate/768px preview; overlap/independent art/readability remain open |

88 fresh browser assertions (38+38+12), after changed review build. No QA failures/repairs this task. Real Moc serial5/tick2 ultimate560ms, basic72/auto74 tick7 at enemy-lua/player-aw2-lua coexist; auto127/passive128 tick14 after another ally shield. Independent FX reused, grouped statuses retain every own-art recipient; preparation/interrupt/miss/terminal cannot fabricate grant. Engine/save/world/mode/core helpers unchanged. Last full1007 tests/471 browser and stable851-file/78-text/47+47 earned journeys remain atcf0b39469d1fb8f7d77e18feb5e16895d70565a1, not a full PASS for current head. No fresh full earned-world/Moc encounter visual claim.

Owner asks to avoid redundant passing tests: reuse proven unchanged boundaries, rerun only affected dependencies/fixes/new concerns, retain mandatory types/changed-consumer builds and full regression before release/major save/shared-engine changes. All5 fullCharacterComplete=false;0/12 full DoD, independent art/anatomy/identity/fan/cloth/loop/contact/telegraph/audio-binding/listening/playtest/device/native/offline/FPS/rights/production-save/release obligation remains. Demo90%/product≈40% rough35–45% unchanged; starter motion4/5=80% separate denominator. Next004G Sương Lành.

## AW2-004E Lam motion / confirmed impacts and healing — 2026-10-21

VERIFIED scoped reference subset, full character DoD OPEN. D16 verified exact staged/remote tree and four binary SHA matches, expected-head/force=false publication, independent fetch/SHA/tree/index/ancestry and guarded local fast-forward. Source `cf0b39469d1fb8f7d77e18feb5e16895d70565a1`, tree `a31058eb72be8b420cb6dbde32e8c008a6e2ac04`, base local/fresh remote `4def09f18c201663846f1122cacba81947b9ed84`, game/adventure-world-2. Completion descendant docs only; final fresh local/remote comparison before handoff. Task/owner skills preceded edits. In-session BA/character/animation/mechanic/tester/scretary +imagegen/verification guidance; no independent human/agent/device/listening/rights sign-off. Linux7.0.0-38 x86_64 /Node22.23.2 /pnpm10.34.3 /TS5.9.3 /Vitest5.0.1 /Vite8.0.5 /Chromium153.0.8010.36. [Task](tasks/AW2-004E.md), [full commands/failures/raw reports](evidence/AW2-004E.md), [Lam gates](LAM_CHARACTER_GATES.md).

| Check | Status | Observed |
|---|---|---|
| Full units | PASS |1007 tests/98 files,71.46s;214 AW2/18 files,11 new;0 failed/pending; preceding compiled journey finishing in parallel, no performance inference |
| Types/7-file format/whitespace | PASS |Root/dev TS and final formatting exit0 |
| Source/asset/provenance/rebuild | PASS after harness repairs |All-five296 rectangles/alpha/RGBA/hash/PCM/prompt inventory; Lam72 rectangles/32 cels/max edge3/255,12 originals and other4 manifests/assets preserved;87-file repeat byte identity |
| Stable/review build/isolation | PASS |Stable851 files/78 text artifacts exclude AW2; review101 files/29,817,175 bytes, no PNG/code/maps/ZIP |
| Lam motion/confirmed FX source+compiled | PASS reference scope |42+42 all8 clips/32 cels/reference flight+two cues/real target impact+two pulses/finite reduced FX/no premature FX/pause/audio opt-in+decode/widths/world/missing atlas/save bytes |
| Lua/Than/other starter previews | PASS regression |38+38 Lua,32 Than+133 starters |
| Battle source+compiled | PASS development |22+22 five-unit/ultimate/projectile/terminal/pause/reset/assets/save |
| Earned demo source+compiled / compiled smoke | PASS automated |47+47 combined RPG/TCG/Chess/all entries/quests/items/cook/share/actual boss/note/both endings/new Lam world motion;8 smoke |
| Three final captures opened | PASS reference scope |Source reduced battle/compiled ultimate/768px world preview; arena actor/label overlap remains |

471 fresh final browser assertions; all final reports postdate final review build. Actual Lam pulse serial5/tick2/index0→520ms and25/tick4/index1→1040ms; basic60/tick6 enemy-than impact art. Independent confirmed FX clocks survive simultaneous actions; finite180/440ms visual FX cannot revive under reduced motion. Core engine/numbers/save/canon unchanged. Actual boss tick36/either ending345XP/five receipts/stable bytes, no forged outcome/progress. New WebP1,758,940 bytes/decoded RGBA12,580,128; localhost timings/decode not PERF-01/listening/device approval.

Initial simultaneous-cue browser timeout retained; independent clocks/same-tick gesture priority repaired it. Final reduced-motion expiry review adds finite guard/new pure/browser case. Two unsafe layouts repaired via image_gen; original comparison harness included TS helpers, then missing report directory failed an otherwise passing audit; final complete run passes. One diagnostic capture opened separately. Deeper unchanged standalone save/mode/boss-failure browser permutations not separately repeated; historical evidence source-bound. All5 fullCharacterComplete=false,0/12 full DoD; independent art/playtest/final balance/audio binding/listening/device/native/offline/FPS/rights/production-save/release/full-suite obligation remain. Demo≈90%, product≈40% rough35–45% unchanged; report both after each completed update. Next004F Mộc Non, independent Than/Lua/Lam acceptance still open.

## AW2-004D Lua motion / confirmed contacts / builder reproducibility — 2026-10-21

VERIFIED scoped reference subset; full character DoD OPEN. Base local/fresh remote `90e1f8c6d2b8645543b48b45a7a6e98be7beac0b`; source `cef55c00f8c4cf646a9d8952f6cbe02865b0225c`, tree `ff547302b1e45a3d8bfee602be162f6d7ff5f6ac`, game/adventure-world-2. Task/refined-contact contract preceded edits. D16 exact index/remote tree and four binary SHA matches, expected-head/force=false publication, independent fetch/SHA/tree/index/ancestry/local guarded fast-forward verified; completion docs only/final readback before handoff. No branch/PR/master/rpg/release/owner reset.

Linux7.0.0-38 x86_64 /Node22.23.2 /pnpm10.34.3 /TS5.9.3 /Vitest5.0.1 /Vite8.0.5 /Chromium153.0.8010.36. Six owner-role reviews and reused imagegen/React/verification skills, no independent agent/art/listening/device/legal review. [Task](tasks/AW2-004D.md), [commands/failures](evidence/AW2-004D.md), [per-state/full-DoD gaps](LUA_CHARACTER_GATES.md).

| Check | Status | Observed |
|---|---|---|
| Affected/full units | PASS |203 AW2 /17 files,2.33s;996 full /97 files,37.46s,0 failed/pending,7 new motion/rules/confirmed-contact cases |
| Types/9-file format/whitespace | PASS |Root/dev types and final formatting exit0 |
| Asset/provenance/rebuild | PASS after repairs |72 Lua rectangles/32 new cels, alpha≤2/255,12 originals preserved; all5 source/runtime/PCM/prompt hashes, other4 manifests unchanged;87-file Than/Lua rebuild byte identity |
| Stable/review build and exclusion | PASS |851 files/78 text artifacts exclude AW2; review98 files/28,038,187 bytes, no PNG/code/maps/ZIP |
| Lua motion source/compiled | PASS reference scope |38+38 all8 states/32 cels, exactly2 preview contacts, actual confirmed serial72/76 using own220/380ms FX and first/second poses, pause/reduced/widths/missing atlas/audio decode |
| Than/other starter previews | PASS reference compatibility |32+133 FX/contact/world/audio/selector/save checks |
| Battle source/compiled | PASS development |22+22 five-unit/ultimate/terminal/projectile/pause/reset/assets/save bytes |
| Earned combined demo source/compiled | PASS automated |46+46 all modes/entries/quests/items/cook/share/boss/note/both endings and actual new Lua world atlas |
| Compiled smoke | PASS |8 intro/save/XP/runtime assets/isolation |
| Three accepted captures opened | PASS reference scope |Source/compiled actual battle and768px preview; actor/label overlap remains |

385 fresh final browser checks, not added to004C377. Boss tick36, either ending345XP/5 receipts, exact earned checkpoint/returns/reload/stable bytes; no outcome/progress forging or unexpected final primary errors. New runtime WebP2,029,834 bytes /decoded RGBA12,580,128; localhost timings/audio decode are not PERF-01/device/listening acceptance. New gameplay-save rules unchanged, presentation has no damage/reward authority.

Failures retained: file checker counted recovery alias as extra cel; builder refactor left marker variable scope; first helper consumed stale prior elapsed; compiled reduced probe consumed stale same-frame skill FX. Repaired counting/reference-marker/synchronized observation; source38 before last compiled-only helper guard, unchanged runtime and compiled38 after it. One unsafe B image rejected/repaired by image_gen (3 calls/two selected sources);2 diagnostic images inspected separately. All raw notes/reports linked above; no failing run reclassified PASS.

Residual: full DoD/independent art/anatomy/loop/contact/playtest/device/native/offline/FPS/listening/rights/final balance/production-save/release; basic-hit audio binding, ultimate telegraph/arena readability;7 absent sets and own map/NPC/boss art. All5 fullCharacterComplete=false, demo≈90%/product≈40% rough estimates unchanged. Next004E Lam Lam motion/projectile/two pulses. Repeat impact/full checks per tester cadence; historical deeper mode/save/boss-failure permutations not separately renewed.

## AW2-004C Than motion / shared playback — 2026-10-21

VERIFIED scoped reference-motion/integration; full character DoD OPEN. Base local/fresh remote `096fb7b3e6d4e7e83aef55f0d0f3e9fa9c9618b5`; source `f85e1e7cadb933bce0a7355abe8f244cab2c89b8`, tree `ea4f8df7cac8fee7239133d06726abb49f4c47c0`, branch game/adventure-world-2. Task card preceded edits; completion descendant docs only. D16 exact staged/remote tree and binary Git SHA matches, expected-head/force=false publication, independent fetch/SHA/tree/index/ancestry and guarded local fast-forward verified. Final completion readback before handoff; no PR/master/rpg/release/owner reset.

Linux7.0.0-38 x86_64 /Node22.23.2 /pnpm10.34.3 /TS5.9.3 /Vitest5.0.1 /Vite8.0.5 /Chromium153.0.8010.36. In-session BA/character/animation/mechanic/tester/scretary, React/verification reviews; no independent agent/art/listening/device/rights sign-off. [Task](tasks/AW2-004C.md), [evidence/commands](evidence/AW2-004C.md), [per-state/full-DoD inventory](THAN_CHARACTER_GATES.md).

| Check | Status | Observed |
|---|---|---|
| Affected/final full units | PASS |196 AW2 /16 files;989 full /96 files,33.41s,0 failed/pending;5 playback/2 event-ownership new cases |
| Root/dev types,16-file format/whitespace | PASS |After named-interface repair of formatter inline-type issue |
| Actual asset hashes/alpha/PCM/preservation | PASS |72 Than rectangles/32 new distinct cels, edge alpha≤4/255;14 originals byte-identical, all five inventories checked |
| Stable/review build and exclusion | PASS |Stable851 files/78 text artifacts exclude AW2; review95 files/25,990,939 bytes, no PNG/code/maps/ZIP |
| Motion source/compiled | PASS reference scope |35+35 all8 clips/32 cels, pause/reduced, world4dir/audio decode/opt-in,320/390/768 widths, actual battle, two missing-motion errors/no fallback |
| Than/other starter previews | PASS reference scope |32+133 canonical FX/contact/audio/world/selector/save bytes |
| Actual battle source/compiled | PASS development |22+22 five-unit combat/ultimate/terminal/projectile/pause/reset/assets/save isolation |
| Earned combined demo source/compiled | PASS automated |45+45 all modes/entries/quest/chest/cook/share/boss/note/both endings plus new world atlas/paused visual time |
| Compiled smoke | PASS |8 intro/save/XP/assets/isolation |
| Four accepted captures opened | PASS reference scope |Attack recovery, ultimate settle, actual battle,768px preview; arena overlap/small labels remain |

377 fresh final browser assertions, no unexpected final primary errors. Actual boss tick36, either ending345XP/5 receipts, exact earned checkpoint/legacy bytes preserved. New runtime atlases2,139,636 bytes /decoded RGBA12,580,128 bytes; local resource timing observations do not satisfy PERF-01. Two unsafe image candidates rejected/repaired through built-in image_gen, exact prompt/hash/source records retained.32 new cels do not mean full animation polish or full DoD; fullCharacterComplete=false. No numerical rules/schema/store/economy/mode/canon/gacha change. Deeper unchanged mode/save/boss-failure permutations not separately repeated; old evidence stays source-bound.

Residual: independent art/continuity/contact review, human demo playtest/listening, physical devices/native/offline/FPS/rights/final kit-level balance/production-save/release, remaining7 missing sets and map/NPC/boss own assets. Product≈40% rough/demo≈90% unchanged,0 full characters. Next004D Lửa Nhỏ motion/two-contact package; repeat impact/full checks per tester cadence, never inherit independent PASS.

## AW2-010A automated fresh-player demo — 2026-10-21

VERIFIED automated subset; independent human playtest NOT_RUN. Base local/remote `4dde53f9cdae36afa11814ddae62077963c59d3d`; source `e7aedacadcc5f7664695767196d9edaa77fe724b`, tree `e95629e68bb41744721cdb89f786960d657129be`, branch game/adventure-world-2. Existing task card updated before code; completion docs only. D16 matched index/remote tree and expected-head/force=false publication, independent fetch/SHA/index/ancestry and guarded local fast-forward; final docs descendant fetched before final handoff. No branch/PR/master/rpg/deployment/owner reset.

Linux7.0.0-38 x86_64 /Node22.23.2 /pnpm10.34.3 /TS5.9.3 /Vitest5.0.1 /Vite8.0.5 /Chromium153.0.8010.36. In-session BA/mechanic/tester/scretary +React/verification review; no independent agent/device/legal sign-off. [Task](tasks/AW2-010A.md), [full evidence/failures](evidence/AW2-010A.md), [demo](DEMO.md), [progress methodology](PROGRESS.md).

| Check | Status | Observed |
|---|---|---|
| Affected / final full units | PASS |189 AW2 /15 files,2.00s;982 full /95 files,32.90s, zero failed/pending;12 new key-policy cases |
| Root/dev types,7-file format/whitespace | PASS |Exit0 after final runtime focus fix |
| Stable/review build and exclusion | PASS |851 files /77 text artifacts exclude AW2; review92 files /23,831,805 bytes, no PNG/code/maps/ZIP |
| Fresh earned combined source / compiled | PASS |43+43 intro/5 starters/four mode games/both entries/quest/chest/cook/share/real boss/note/both endings, exact returns/reloads/rewards/legacy bytes |
| Mode navigation source / compiled | PASS |26+26 checkpoint/failure/stale/portal/boss guard/mobile |
| Unchanged RPG regression / compiled smoke | PASS |25+8 migration/inventory/economy/touch/follower/stale/audio/missing atlas/compiled assets |
| Three accepted captures opened | PASS reference scope |Source/compiled390px guide and completed journey; two diagnostic failure images excluded |

171 fresh final browser assertions total, zero unexpected final primary errors, five seeded stable keys unchanged. Earned205XP before final quest, real boss tick36, each ending345XP/5 receipts, exact saved NPC-position bytes for alternate branch.12 pure policy cases cover native/mode/modifier/repeat keyboard ownership; browsers prove direction Enter, native scrolling, focus restoration/held-key stop, touch/reduced motion/opt-in. [Unit summary](evidence/AW2-010A-unit-summary.json).

Initial FAILs retained: RPG revealed hidden-close-button focus regression and passed unchanged after genuine map-focus fix; combined helper terminal/canvas lag, async meal assertion and unsaved branch position fixed with truth/commit synchronization and explicit UI save. First omitted-keyup probe direction result inconclusive; paired baseline preserved. Final full units/types/build follow runtime repair, final demo source/compiled follow harness fixes. No core rules/save/schema/asset changes. Standalone TCG/Chess/older40-world runner not repeated separately; deeper unchanged-engine evidence stays source-bound.

Residual obligation: independent human demo playtest, full12 DoD/art/native/device/offline/FPS/listening/rights/production-save/release. [PROGRESS](PROGRESS.md) demo9/10≈90% and rough product≈40% are planning indicators, not QA results or date approval. Next AW2-004C character/animation gap closure/measurement; repeat impact/full checks per cadence before release.

## AW2-009C Auto Chess practice / estimate — 2026-10-21

VERIFIED development-practice subset. Base local/remote `99fa529ac196b3f0a06e286851d39d6c3971d45e`; implementation `ff499a52e471f9b07133bc80e9d32802dda92cb8`, tree `28e00e7d412b448d11095fc1c03dac16e1fc97a6`, branch game/adventure-world-2. Task card preceded code; completion docs only. D16 matched index/remote tree, expected-head/force=false GitHub connection delivery, independent Git fetch/SHA/index/ancestry and guarded local fast-forward; final docs descendant fetched before handoff. No feature branch/PR/master/rpg/deployment/owner reset.

Linux7.0.0-38 x86_64 /Node22.23.2 /pnpm10.34.3 /TS5.9.3 /Vitest5.0.1 /Vite8.0.5 /Chromium153.0.8010.36. In-session BA/mechanic/tester/scretary and React/verification reviews; no independent agent/human-device/legal sign-off. [Task](tasks/AW2-009C.md), [rules](AUTO_CHESS_PRACTICE.md), [commands/evidence](evidence/AW2-009C.md), [REPORT](REPORT.md).

| Check | Status | Observed |
|---|---|---|
| Affected Chess / all AW2 | PASS |Initial18 Chess; hardened19 cases,177 AW2 /14 files,2.25s |
| Full unit JSON run, maxWorkers2 | PASS |970 tests /94 files,35.44s, zero failed/pending; before build/browser |
| Root/dev types,10-file format, Git whitespace | PASS |Exit0; dev types rechecked after UI public attributes |
| Stable/review build and recursive scan | PASS |Stable851 files /77 text artifacts exclude AW2; review92 files /23,828,460 bytes, no PNG/TS/TSX/map/ZIP |
| Actual Auto Chess source / compiled | PASS |33+33 shop/merge/formation/move/swap/bench/sell/keyboard/lock, genuine five-round win/combat defeat/surrender, pause/step/rematch/return/reload/stale reread/no world writes/mobile/missing portrait |
| TCG source / compiled | PASS |29+29 fresh actual gameplay/return/byte-preservation regression |
| Navigation source / compiled | PASS |26+26 portals/quick-entry/checkpoint/failure/stale/boss guard/mobile |
| World/quest/boss/both endings / compiled smoke | PASS |40+8,8452 inspected for current ChessPractice first |
| Three source/compiled captures opened | PASS reference scope |390px planning,768px battle/terminal; long scrolling pages, no physical-device/finished-animation claim |

224 fresh browser assertions, zero unexpected primary errors; five seeded stable keys unchanged. Default seed legal recruitment wins all5 rounds at ticks5/5/4/5/9; weak legal unit loses4 rounds to0HP. Pure invariant coverage includes finite pool/reserved/owned/merged copy conservation across12 full legal seeds, gold/cap/phase/UID, simultaneous damage/heal/shield, formation/range/blocked movement, diversity, timeout/draw/once-only settlement and invalid-state preservation. No game-check failures observed in executed runs; source keyboard verifier rerun replaces prior run, not added again to counts. [Raw summaries](evidence/AW2-009C-unit-summary.json).

Residual obligations: AW2-010A combined fresh-player demo/onboarding/playtest READY/NOT_RUN,12 full characters/art/mode-product design/balance, D11/D12 decisions, save-production migrations, physical devices/native/offline/FPS/listening/rights/release. [Delivery ranges](DELIVERY_PLAN.md) are conditional planning assumptions, not QA results, committed dates or approval. Repeat affected checks and full suite per impact/cadence; this does not turn untouched gates green.

## AW2-009B playable TCG practice — 2026-10-21

VERIFIED development subset. Base local/remote `0339f92f47f334c2497766ddb056b38164ed8a1f`; implementation `a0d24937f1450f8b4f8338780fee6a4cc0aa125c`, tested tree `d8ae48941c41c69b67e22f6772fa1f570ebb96e9`, branch game/adventure-world-2. Task card preceded implementation; completion descendants docs only. D16 delivery: verified index/remote tree equality, existing GitHub connection expected-head/force=false, independent fetch/index/ancestry and guarded local fast-forward; final docs descendant fetched before final handoff. No feature branch/PR/master/rpg/deployment/owner reset.

Linux7.0.0-38 x86_64 /Node22.23.2 /pnpm10.34.3 /TS5.9.3 /Vitest5.0.1 /Vite8.0.5 /Chromium153.0.8010.36. In-session BA/mechanic/tester/scretary and condensed React checklist; no independent agent/human-device/legal sign-off. [Task](tasks/AW2-009B.md), [rules](TCG_PRACTICE.md), [full commands/evidence](evidence/AW2-009B.md), [quick REPORT](REPORT.md).

| Check | Status | Observed |
|---|---|---|
| Affected AW2 tests | PASS |158 tests /13 files,1.82s;25 new TCG rules/session cases |
| Full `pnpm test --maxWorkers=2` with JSON reporter | PASS |951 tests /93 files,32.94s, zero failed/pending; before build/browser |
| Root/dev typechecks,10-file format, Git whitespace | PASS |Exit0 on repaired final source |
| Stable/review build, recursive exclusion | PASS |Stable851 files /77 text artifacts, no AW2; review92 files /23,807,730 bytes, no PNG/TS/TSX/map/ZIP |
| Actual TCG browser source / compiled | PASS |29+29 manual play/target/attack, genuine win/loss/surrender, rematch, no save writes/grants, return/reload/stale reread, portrait error/mobile/keyboard checks |
| Mode navigation browser source / compiled | PASS |26+26 portals/quick-entry/checkpoints/return/failures/stale/boss guard/mobile |
| World/quest/boss/both endings / compiled smoke | PASS |40+8, existing8452 source inspected before world run |
| Three source/compiled victory/mobile captures opened | PASS reference scope |Main controls fit320/390/768; long scrolling page, no physical-device claim |

158 fresh browser assertions total; seeded stable bytes unchanged, no unexpected primary errors. Seed20261022 wins by real legal damage after29 recommended commands at turn17; seed20261021 loses to real opponent after6 passes. Card conservation/resource/guard/fatigue/turn-limit and both outcomes across40 legal seeds are pure-test coverage; optional browser guard observation false, not claimed. First targeted24PASS/1FAIL was a wrong default-coach-win expectation, preserved actual loss and verified next seed win; first dev typecheck narrowing/fixture-type errors repaired. Final full run/typechecks/build/browser follow repairs. [Tracked summaries](evidence/AW2-009B-unit-summary.json).

Residual obligation: actual Auto Chess shop/formation/combat/results and full MODE-01 in AW2-009C; production balance/collected deck/prizes/persistence/art/device/native/offline/FPS/rights/full slice remain open. Repeat full regression on relevant changes/per tester cadence; this result does not turn untouched gates green. Next BA/mechanic implements009C, tester verifies, scretary updates REPORT.

## AW2-009A mode transitions / quick REPORT — 2026-10-21

VERIFIED transition/lobby subset. Base local/remote `339edaf80e2ee879455a09c484058470318d8493`; implementation `16f55afb7a1928e5eec1c49acdcb500a6c975554`, tested tree `d9b568da3b0f181b2dbff2f2145f9047625e2cfb`, branch game/adventure-world-2. Task card preceded implementation. D16 direct branch delivery uses existing authorized GitHub connection, matched index tree, expected-head/force=false and independent fetch/SHA/ancestry readback. No local duplicate commit/history rewrite or new branch. Completion changes are documentation only.

Linux7.0.0-38 x86_64 /Node22.23.2 /pnpm10.34.3 /TS5.9.3 /Vitest5.0.1 /Vite8.0.5 /Chromium153.0.8010.36, fresh isolated browser contexts. In-session BA/mechanic/tester/scretary and condensed React hooks/lifecycle/accessibility review; no independent agent/device/legal sign-off. [Task](tasks/AW2-009A.md), [full evidence](evidence/AW2-009A.md), [owner quick REPORT](REPORT.md).

| Command/check | Result | Observed |
|---|---|---|
| `pnpm test dev/tests/aw2 --maxWorkers=2` | PASS |12 files /133 cases; final full run includes all133 after named-type repair |
| `pnpm test --maxWorkers=2 --reporter=default --reporter=json --outputFile=/tmp/aw2-009a-unit.json` | PASS |92 files /926 tests,37.66s, no failures/skips;133 AW2 /17 new transition cases; before build/browser |
| `pnpm typecheck` / `pnpm typecheck:dev` | PASS |Both exit0 after formatter/named-interface correction |
| Seven-file formatter / whitespace | PASS |`oxfmt --check`, `git diff --cached --check` |
| `pnpm build` / `pnpm build:aw2` / recursive scan | PASS |Stable release guard +851 files/72 text exclusion; review91 files /23,790,245 bytes, no PNG/code/maps/ZIP |
| `verify-aw2-modes.mjs` source / `--compiled` | PASS |26+26 actual portal/quick-entry/checkpoint/return/reload/failure/stale/corrupt/boss-guard/mobile assertions |
| `verify-aw2-world.mjs --boss` / `verify-aw2-build.mjs` | PASS |40+8 all-quest/boss/endings and compiled intro/XP/save/assets regressions |
| Two compiled desktop/mobile lobby captures opened | PASS reference scope |Readable wrapped controls; full authored art/device gates unaffected |
| Relative links / live-report source+count consistency / docs-only runtime diff | PASS |REPORT/source/task/evidence agree; schema/store/economy/combat/legacy/dependencies/assets/config unchanged |
| Actual playable TCG/Chess, mode cost/reward/resume, device/native/offline/FPS/rights/full slice | NOT_RUN |Parent AW2-009/full MODE-01 remain open; D11 still PROPOSED |

**100 fresh Chromium assertions PASS** (26+26+40+8), zero primary unexpected console/page/resource errors, stable seeded bytes preserved. Initial affected132PASS/1FAIL was test timing: pending-abandon assertion ran after an await that completed the checkpoint; moved before await. Formatter removed inline-type separators and TS reported two syntax errors; named interfaces fixed it before final full/type/build/browser gates. Failed attempts stay FAIL. Current full-unit obligation satisfied; repeat impacted/shared-save/engine checks after future changes and full regression before release. Original save29/standalone battle22 browser scripts were not rerun separately; their unchanged source evidence remains scoped to AW2-013A.

## AW2-013A persistent progression — 2026-10-21

VERIFIED development scope. Baseline local/remote `075e141fabe90943246bae16eb3f3b3d48cba391`; published implementation `a40217afd4168fac854b8c482a3f0fef48809c26`. Reviewed/adapted pinned PR #82 c34c6a2 (original code a66188f), whose runtime base equals AW2; no PR/rpg/master change. Local tested96f8019 and published a40217a have exactly the same tree `e08b9a6b13f67917b0352a5b6a2a473576278a98`. CLI push lacked Linux credentials; authorized GitHub connection created the identical tree/commit and advanced AW2 from075e141 with expected-SHA guard, force=false. Fetch/readback and full tree diff matched. Original local commit retained in ignored incremental bundle. Following completion edits are documentation only.

Linux7.0.0-38 x86_64 /Node22.23.2 /pnpm10.34.3 /TS5.9.3 /Vitest5.0.1 /Vite8.0.5 /Chromium153.0.8010.36; fresh isolated contexts, no owner profile/reset. Task card preceded implementation; BA/mechanic/tester/scretary reviews in-session, no independent agent/device/legal sign-off. [Task](tasks/AW2-013A.md), [full commands/evidence](evidence/AW2-013A.md).

| Command/check | Result | Observed |
|---|---|---|
| `pnpm test --maxWorkers=2 --reporter=default --reporter=json --outputFile=/tmp/aw2-013a-unit.json` | PASS |91 files /909 cases,29.98s; no failures/skips; run without simultaneous build/browser |
| `pnpm test dev/tests/aw2 --maxWorkers=2` | PASS |Final11 files /116 cases after formatting,1.03s |
| `pnpm typecheck` / `pnpm typecheck:dev`, targeted formatter and whitespace | PASS |Both TS configs exit0; source/tests/verifiers reviewed and changed files whitespace clean |
| `pnpm build` / `pnpm build:aw2` | PASS |Stable build/release guard and isolated91-file/23,785,828-byte review build; stable existing large-chunk warning |
| Recursive stable output scan | PASS |851 files /72 text artifacts exclude AW2 entry/save/economy/combat markers |
| `verify-aw2-save.mjs` / `verify-aw2-world.mjs --boss` / `verify-aw2-battle-browser.mjs` | PASS |29+40+22 fresh Chromium assertions; current save/full quests/real boss/both endings/preview |
| `verify-aw2-rpg.mjs` / `verify-aw2-build.mjs` | PASS |25+8 Chromium assertions; migration/items/cook/share/stale/followers/tap/audio/missing-atlas/mobile and actual compiled intro/reload/assets |
| `simulate-aw2-gacha.mjs` | PASS simulation only |D11 proposal,seed20261021,2,000,000 draws; no runtime draw/spend/save |
| Four new captures opened | PASS reference scope |Desktop/mobile world, compiled mobile and boss mobile; small arena labels/restored follower overlap remain |
| Full ART-01/RIGHTS-01/device/native/offline/FPS/listening/gacha/modes/slice | NOT_RUN |No release/full character/full dungeon/production-balance claim |

Browser total124 PASS, zero primary unexpected errors, seeded stable bytes preserved. Initial authority regression2failed/9passed reproduced ordinary-save quest forgery/unsaved boss acceptance; fixed. Four legacy fixtures then failed because they bypassed world actions through position-save; corrected fixtures, not guards. Initial compiled run failed on actual404 `/favicon.ico`; diagnostic probe confirmed URL, explicit icon fixed it, final8 PASS. Added reread trail reset, finite-path rejection and same-level audio-reset checks. Earned-XP boss fixture now wins tick36; not a final balance approval. Original failed attempts remain FAIL, not silently counted as PASS.

High-impact save/full-unit obligation satisfied at this source. Repeat impacted/full checks after future shared-save/engine changes and before release; full runtime gacha, authored art, device/native/offline/rights and vertical-slice obligations remain. Final completion-doc delivery uses the same authorized expected-SHA/fast-forward connection and independent remote/local readback.

## AW2-012B direct-branch policy / cleanup — 2026-10-21

VERIFIED. Baseline local/remote AW2 `ccddfd69404860e48829f79b588c65a7408054ef`; policy commit `3d0311084fd52a9ad618b0f5bebbe08110063e98`. Retained remote master `f9d39257d17b4dd378a2fbd2a9f936724754fc16`; local master98843584b5f747dbaaf8c52c0db2dab1c0f26996. Windows10.0.26200 /PowerShell /Git /Node25.2.0. Scope: documentation/process policy D16 and branch refs only. Task card preceded edits/deletion; no new feature branch created. [Task](tasks/AW2-012B.md), [full audit/results](evidence/AW2-012B-branches.json).

| Command/check | Result | Observed |
|---|---|---|
| `git fetch --prune MealGacha`, `ls-remote --symref ... HEAD`, open-PR query/metadata | PASS |79 remote refs, default master; only PR #79 open, Japan models→master; single AW2 worktree |
| Per-head `git merge-base --is-ancestor <sha> <retained-ref>` audits | PASS |73 remote/3 local refs reachable from AW2/master; exact names/SHAs/retained ancestors recorded before deletion |
| Direct-AW2 policy consistency + `git diff --cached --check` | PASS |Root AGENTS/WORKFLOW/README/status/handoff agree on D16; prior feature-only instructions explicitly superseded |
| Policy commit/push + independent `ls-remote` | PASS |Remote AW2 matched3d0311084fd52a9ad618b0f5bebbe08110063e98 before any deletion |
| Exact-head remote preflight + `git push --dry-run --porcelain --atomic <per-ref leases> MealGacha <explicit deletion refspecs>` | PASS |All73 heads match audited SHAs; six retained refs unchanged; dry-run accepted |
| Same atomic push without `--dry-run` | PASS |73 refs reported deleted; leases guarded each expected SHA; no retained history rewritten |
| `git branch -d -- <audited-local-name>` | PASS |Deleted3 local merged branches after exact-head/HEAD ancestry checks; no forced local deletion |
| Refresh + `ls-remote --heads` / `git for-each-ref refs/heads` / inventory assertions | PASS |All selected refs absent;6 remote /2 local branches remain; four unmerged histories and master untouched; PR #79 rechecked open with original refs |
| `git diff --exit-code ccddfd6 -- src dev public package.json pnpm-lock.yaml vite.config.ts tsconfig.json` | PASS |No runtime/assets/tests/build/dependency changes |
| Final documentation/link/inventory checks + `git diff --check` | PASS |11 changed documentation files reviewed; relative links valid; all76 deleted local/remote heads still ancestors of AW2 HEAD; completed inventory agrees with actual ref lists |
| Game unit/type/build/browser/device/rights | NOT_RUN this task |Documentation/ref-only change; prior891 unit/91 browser assertions remain source-bound historical evidence |

Initial inventory generation using unavailable Python failed; staging stopped on the missing inventory file, with no commit or deletion. Reimplemented the inventory step with installed Node. A later Node child-process Git check hit sandbox EPERM; reran Git directly in PowerShell and kept Node for file/link checks, all PASS without changing permissions. The remote cleanup used explicit empty-source refspecs and per-ref expected-SHA leases, not a rewrite of retained branch history. Follow-up completion documentation is committed/pushed on the same AW2 branch; SHA readback and clean-tree checks are required at handoff.

## AW2-012A long-lived integration / push — 2026-10-21

Explicit owner authorization; existing canonical target `game/adventure-world-2`. Refreshed baseline `f0d588461f2408a8e0a1ee49a78b36af5a8c7476`; exact fast-forward source `82b85cd054e001d8a8dafbc9ea4467f5442842dc`, which contains implementation03b92e2 and continuation7bb0bf1. Windows10.0.26200 x64 /Node25.2.0 /pnpm10.34.3 /TS5.9.3 /Vitest5.0.1 /Vite8.0.5. Following changes documentation only. `pnpm` below was invoked through `node .asset-work/aw2-tools/node_modules/pnpm/bin/pnpm.cjs`; package/lockfile unchanged.

| Command/check | Result | Observed |
|---|---|---|
| Target fetch, `git merge --ff-only 82b85cd` | PASS | Baseline matched refreshed remote; five completed commits included without conflicts |
| Eight `git merge-base --is-ancestor <feature-head> HEAD` checks | PASS | Both completed feature heads and six historical foundation heads included; exact refs in task/HANDOFF |
| `git diff --exit-code 82b85cd -- src dev public package.json pnpm-lock.yaml vite.config.ts tsconfig.json` | PASS | Implementation/assets/tests/build bytes unchanged |
| `$env:NODE_OPTIONS='--no-experimental-webstorage'; pnpm test --maxWorkers=2 --reporter=default --reporter=json --outputFile=.asset-work/aw2-012a-unit.json` | PASS |88 files /891 tests,23.23s; no failures/skips, including all98 AW2 cases; no simultaneous build/browser |
| `pnpm typecheck` / `pnpm typecheck:dev` | PASS |Both exit0 |
| `pnpm build` | PASS |Vite production build and release guard exit0; existing >500k chunk warning |
| `git diff --check` and changed-path review | PASS |Integration follow-up changes are AW2 documentation only; no whitespace errors |
| Production output recursive scan | PASS |851 files /72 HTML/JS/CSS/JSON artifacts; no AW2 paths, save/reset/world/boss/tuning markers |
| Scoped-owner `git push MealGacha game/adventure-world-2:refs/heads/game/adventure-world-2` + `git ls-remote --heads ... refs/heads/game/adventure-world-2` | PASS |Remote advanced f0d5884→82b85cd; exact full SHA readback matched local |
| Browser/device/native/art/audio/rights | NOT_RUN this task |Unchanged-source fast-forward; prior91 Chromium assertions at03b92e2 are retained evidence, not rerun |

Local master98843584b5f747dbaaf8c52c0db2dab1c0f26996, cached remote masterf9d39257d17b4dd378a2fbd2a9f936724754fc16, source feature7bb0bf1/82b85cd retained. Only unrelated legacy PR #79 open and excluded. Initial sandbox remote read could not reach its proxy; scoped elevated fetch/read/push succeeded. No game/test source fixes, dependency updates, force push, release or save reset. [Task](tasks/AW2-012A.md). Future economy/shared-save changes need affected suites and full regression; open device/rights/full-art/full-slice obligations remain.

## AW2-007C world boss / schema v3 — 2026-10-21

Base/dependency `7bb0bf131e5994887429d8da7fd23c857d5d18b1`; source `03b92e20f6dc55d62530da7e88c1ca1579505490`, branch `feat/aw2-007c-world-boss`. Long-lived remains f0d5884. Checks executed on the implementation before its commit; final save Chromium reran on the source commit. Subsequent edits documentation only. Windows10.0.26200 x64 /Node25.2.0 /pnpm10.34.3 /TS5.9.3 /Vitest5.0.1 /Vite8.0.5 /Playwright1.64.1 /Chrome155.0.8059.85. Fresh browser contexts, no owner profile; local source server127.0.0.1:8452.

| Command/check | Result | Observed |
|---|---|---|
| `pnpm test dev/tests/aw2 --maxWorkers=2` | PASS |8 files /98 cases; prior87 +11 trusted encounter/receipt/migration cases |
| `NODE_OPTIONS=--no-experimental-webstorage pnpm test --maxWorkers=2 --reporter=default --reporter=json --outputFile=.asset-work/aw2-007c/unit.json` | PASS |88 files /891 cases,32.93s; no failures/skips, full run separate from browsers/build |
| `pnpm typecheck` / `pnpm typecheck:dev` | PASS |Both exit0 on final implementation |
| 16-file `oxfmt --check` + `git diff --check` | PASS |Named interfaces avoid formatter inline-object type bug; source LF-normalized |
| `pnpm build` + production exclusion | PASS |Release guard;851 files /76 text artifacts exclude AW2 markers/entries; chunk/plugin-timing warnings only |
| `node dev/tools/verify-aw2-world.mjs --boss --playwright file:///D:/prj/MealGacha/.asset-work/aw2-tools/node_modules/playwright-core/index.mjs --chromium "C:/Program Files/Google/Chrome/Application/chrome.exe"` | PASS |40 assertions: new save→all4 quests→real boss→failed-write retry→note/reload→both endings/shortcut, plus separate competing-tab fixture |
| `node dev/tools/verify-aw2-save.mjs --url http://127.0.0.1:8452/dev/aw2/index.html ...` | PASS |29 schema v3/reset/future/conflict/failure/legacy assertions; final run on03b92e2 |
| `node dev/tools/verify-aw2-battle-browser.mjs ...` | PASS |22 standalone event/canvas/controls/error/save-byte assertions after explicit boss visual mapping; standalone cannot settle world results |
| Capture inspection | PASS reference scope |Boss desktop/mobile and ending opened; no horizontal overflow, narrow mobile cards/small canvas text remain |
| Full SAVE-02/DUNGEON-01/ART-01/RIGHTS-01, physical/native/offline/FPS | NOT_RUN |No numerical inventory/chest/gacha grants, authored boss kit/art, persistent battle resume, device or release claim |

Coverage: no encounter on rejected/failed checkpoint; canonical identity/range/accepted quest; private core versus forged result/mutated snapshots/ordinary-save win; real win41 and loss49 ticks/retreat safe return; result-write failure retains retry; concurrent begin/terminal/ending transactions produce one winner; reset/changed checkpoint rejects old identity; v1/v2 migrate without writes and preserve prior progress; invalid/future/contradictory ending flags rejected; explicit note/close/both endings and reciprocal gated shortcut.

Observed failures, not PASS: initial experimental auto-only-defeat expectations failed at boss attack80/140 because combat actually won. Simulation selected development 1000HP/180ATK: auto-only loses tick49, ultimates beginning tick5 win tick41. First integrated browser attempt passed main ending but its secondary fixture read a canvas dataset before the first frame and failed; explicit initial-frame wait fixed the verifier, final40 PASS. Initial hook-placement/formatter inline-object syntax issues were caught and fixed by typechecks before final gates. [Evidence](evidence/AW2-007C.md), [report](evidence/AW2-007C-browser.json).

The high-impact save/world full-unit obligation is satisfied at this source. Repeat affected full/save/world/battle checks after future shared-save/economy changes and before release. Derived completion markers are not item grants; production/native/device/full-art/rights/full-slice obligations remain open. Owner requests completed feature pushes; no auto merge/release.

## AW2-007B browser continuation — 2026-10-20

Base `f0d588461f2408a8e0a1ee49a78b36af5a8c7476` (PR #80 merge); tested implementation `9067376b728d12bb55fbce3b94f81e80e7675978`, branch `feat/aw2-007b-browser-qa`. Source checks ran on the committed implementation bytes before commit; final Chromium reran on the commit. Later documentation only. Windows10.0.26200 x64 /Node25.2.0 /pnpm10.34.3 /TS5.9.3 /Vitest5.0.1 /Vite8.0.5 /Playwright1.64.1 /Chrome155.0.8059.85; fresh browser contexts only.

| Command/check | Result | Observed |
|---|---|---|
| Frozen-lockfile install | PASS | Restored missing Capacitor and locked package versions; package.json/lockfile unchanged |
| `pnpm test dev/tests/aw2 --maxWorkers=2` | PASS | 7 files /87 cases: four added session/terminal cases, all prior83 AW2 |
| Default Node25 full suite | FAIL | 662 pass /15 failed;10 suites failed to load; unconfigured Node localStorage getter throws SecurityError |
| `NODE_OPTIONS=--no-experimental-webstorage pnpm test --maxWorkers=2 --reporter=default --reporter=json --outputFile=.asset-work/aw2-007b/unit-node25.json` | PASS | 87 files /880 cases,24.66s; no failures/skips; no test/source workaround |
| Root/dev typechecks | PASS | Both exit0; named command interfaces repair formatter's invalid inline union |
| Six-file formatter + whitespace checks | PASS | `oxfmt --check` and `git diff --check`; line endings normalized in presentation source |
| `pnpm build` + production exclusion scan | PASS | Build/release guard;851 files /76 text artifacts exclude AW2 markers/entries; existing chunk warning |
| `node dev/tools/verify-aw2-battle-browser.mjs --playwright D:/prj/MealGacha/.asset-work/aw2-tools/node_modules/playwright-core/index.mjs --chromium "C:/Program Files/Google/Chrome/Application/chrome.exe"` | PASS | 22 checks on source commit, zero primary errors/failed requests, seeded save bytes unchanged |
| Desktop/mobile/terminal captures | PASS reference scope | All three final captures opened; mobile has no overflow but small/crowded arena text remains |
| BATTLE-02/SAVE-02/boss/world/persistent XP/device/rights | NOT_RUN | Preview-only gate; full game/device/release claims excluded |

Reproduced baseline failure: choosing pending level10 changed the active level5 card before reset. Fixed by storing applied level/battle/presentation together and reading real actor ATK. Terminal inspection found one unfinished projectile still visible at player-win tick71; authoritative battle-end now cancels presentation flights without invented hit/miss/damage. Browser atlas coverage now observes actual decoded-image draw calls/valid rectangles; the old opaque-pixel count could pass on the arena background alone. Windows module paths work. Roles reviewed in-session; no independent agent sign-off. [Evidence](evidence/AW2-007B.md), [report](evidence/AW2-007B-browser.json).

This closes the standalone AW2-007B gate and satisfies its full-unit obligation. Earlier blocked-browser entries below remain historical. Future save/shared-engine integration must run affected save/world/battle browser flows and full unit regression again; release/device/art/rights obligations remain open.

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

Base `179cc214e4fc8cee37fba34fbfe4416a26742bfb`; implementation source `31299a44704962b68fa6769860b1050e16e18fe2`, branch `feat/aw2-007b-battle-renderer`. Remote draft PR #80 implementation snapshot `df72ebf37c35467ec6f3a67c2683fcc6f3f919e9` used the exact local documented implementation/evidence tree `294ceb03204f012560b974d842bbf70211b11f16`; following remote commits are documentation-only. Linux x86_64, Node v24.19.0, pnpm 11.25.0, TypeScript 5.9.3, Vitest 5.0.1, Vite 8.0.5. Status REVIEW: browser criterion BLOCKED.

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
| Current full suite / all12 ART-01 / real combat/leveling / physical devices / human audio / legal rights | NOT_RUN | Prior full 839-test result remains at b3c526b; release/major engine integration full regression still due |

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
