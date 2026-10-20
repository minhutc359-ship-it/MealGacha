# Live project status — 2026-10-20

Phase: PREPRODUCTION / connected world and quest development foundation.
Current branch: `feat/aw2-006-world-foundation`; verified implementation `b3c526bdf37c03184fb68df150381f19e5f0723d`, followed by documentation-only handoff. Long-lived baseline `game/adventure-world-2` remains `72ee9b4360299db4bab9b9b43dba552dd80b86cf`. No push, long-lived/master merge or release.

**AW2-000:** verified documentation foundation. **AW2-001:** verified isolated save/reset, now extended non-destructively to schema v2. Original schema-v1 source/evidence remains at `201c6b7` / `9dec38e`.

**AW2-002/003:** owner explicitly approved both story/roster proposals in-session. CANON and D10/D13/D14/D15 record 6-zone/8-NPC/4-quest direction, 12 immutable spirit IDs with names/recipe/tier/role/kit/visual direction, direct N/R starter team. Historical PROPOSED labels are explicitly superseded; rates/pity D11 and title/monetization/final platform stay open. Spec approval is not full character/art/combat completion.

**AW2-006A: VERIFIED foundation locally.** Six connected debug zones rendered with Pixi; continuous keyboard/on-screen movement with collision, safe exits and interaction range; explicit NPC accept/hand-in; three memories in any order; puzzle retry and persistence; first three quests and a single unlock of five approved N/R starters. Rules are separate from React/Pixi. Single-key save v2 holds world/quest/party; valid v1 upgrades in memory without writing until explicit save. Invalid/future/conflicting/failed writes preserve data. Open `/dev/aw2/world.html`; save/reset screen `/dev/aw2/index.html`.

**Limits:** debug primitives, no authored pixel/chibi/HD character art, followers, audio, leveling, combat/boss result, chest/economy/cooking, working TCG/Chess adapters, gacha, offline/native/device performance or finished vertical slice. Pending objects disclose their state and cannot fabricate rewards/wins. Final boss quest remains incomplete until verified combat; post-boss shortcut/ending also await that adapter. Full AW2-006/008/010 remain open.

**QA:** 46 focused AW2 tests; final full run `pnpm test --maxWorkers=2`: 82 files / 839 tests PASS. Default parallel run initially had one existing TCG 20s timeout (838 others PASS); capped-worker rerun passed without source/test timeout changes. Root/dev typechecks PASS; production build/release guard and 49-artifact entry-isolation scan PASS. Chromium 153.0.8010.36: 29 save/reset + 18 world checks PASS, desktop/mobile viewports, zero observed console/page errors; captures inspected. Device/native/offline/art/full combat/loot cases NOT_RUN. See ledger and AW2-006A evidence.

**Next owners:** animation + character scope AW2-004A for one complete reference spirit/asset pipeline, then remaining 11; mechanic + tester scope AW2-007 combat/leveling and boss-result persistence. BA/mechanic simulate D11 before owner rate/pity approval. Continue AW2-008/009 then AW2-010/011 gates. Existing TCG simulation timeout under heavy parallel load remains a test-runner sensitivity; no legacy gameplay was modified.
