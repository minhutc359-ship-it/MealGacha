# Test ledger / change impact
Statuses: NOT_RUN, PASS, FAIL, BLOCKED, STALE. PASS requires commit SHA, env, command, observed outcome. Prior PASS becomes STALE for affected changes. PR runs selective affected tests; full suite required before release/major cross-engine merge, and after high-impact save/shared engine changes.
| Case | Trigger | Result |
|---|---|---|
| SAVE-01 separate AW2 dev namespace preserves legacy save | save/reset | NOT_RUN |
| SAVE-02 chest/battle/gacha atomic grants, no double reward | loot/store | NOT_RUN |
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
No playable AW2 tests executed in this documentation phase.

## AW2-002 static document review — 2026-10-20

Base `72ee9b4360299db4bab9b9b43dba552dd80b86cf`; proposal source `461c7cfaac658618d96ca8020ac99076fad9e35d`. Linux, Python 3, read-only document checks. Source bytes validated before commit and unchanged afterward; evidence commands also run against the commit. Result PASS: 6 zone IDs, 8 NPC IDs, 4 quest IDs and an acyclic prerequisite order. Reproduce with the Python snippet in [evidence](evidence/AW2-002.md). `git diff --check` PASS. CANON/DECISIONS unchanged versus baseline.

This PASS covers document structure only. Runtime/asset ledger rows above remain NOT_RUN on this branch. No browser/device/gameplay/asset claim; no source edits, so runtime suites were not repeated. AW2-001's test record resides on its own feature branch and must not be attributed to runtime here. Residual obligation: affected tests when implementing proposal; full release regression before release/major shared-engine merge.
