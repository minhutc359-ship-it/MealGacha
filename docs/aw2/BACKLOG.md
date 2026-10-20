# Task board
| ID | Owner | Scope | Status |
|---|---|---|---|
| AW2-000 | scretary/BA | Branch, canon/docs and seven agent skills; Git readback verified | VERIFIED |
| AW2-001 | mechanic/BA/tester | Isolated save/reset; extended non-destructively to v2 for world | VERIFIED locally; latest source b3c526b |
| AW2-002 | story/BA | 6-zone / 8-NPC / 4-quest bible; owner approved D14 | VERIFIED specification; runtime partial |
| AW2-003 | character/mechanic | Owner approved initial 12 identities/tier/kit/starter, D10/D13/D15 | VERIFIED direction; full character DoD pending |
| AW2-004 | animation/character | 12 world + HD + VFX assets; identities/direction approved | READY: start one complete reference pipeline, then all 12 |
| AW2-005 | mechanic | Five-tier gacha/pity/simulation | BACKLOG |
| AW2-006 | mechanic | Pixi free-roam map/collision; AW2-006A prototype source b3c526b | IN_PROGRESS: foundation verified, authored visuals/followers pending |
| AW2-007 | mechanic | RPG team/battle integration | BACKLOG |
| AW2-008 | story/mechanic | First 3 quests/puzzle prototype implemented; boss/loot/cooking pending | IN_PROGRESS (foundation only) |
| AW2-009 | BA/mechanic | TCG/Auto Chess in-world portals & quick-entry | BACKLOG |
| AW2-010 | all/tester | Lantern playable vertical slice | BACKLOG |
| AW2-011 | tester | Release regression/rights/mobile/offline | BACKLOG |
AW2-001 evidence: [task card](tasks/AW2-001.md), [verification](evidence/AW2-001.md). It provides a development save screen, not world gameplay. Code is on `feat/aw2-001-dev-save`; the long-lived branch has not absorbed it.

Owner approved both story and roster proposals in-session. D10/D13/D14/D15 and CANON supersede historical PROPOSED labels in the archived review documents. D11 rates/pity remain unapproved; do not ship gacha before their simulation/review.

AW2-006A foundation: six debug zones, collisions/range/returns, first three quests, memory choice/puzzle, one-time starter unlock and v1→v2 save migration; [task](tasks/AW2-006A.md), [evidence](evidence/AW2-006A.md). Current branch includes AW2-001 and both source proposals, but no long-lived/master merge or push.

Next smallest task: animation + character scope AW2-004A for one fully authored reference spirit (Than) with 4-way world, 8-state HD, portrait and unique skill/VFX/provenance; propagate validated pipeline to the other 11. Mechanic scopes AW2-007 combat/verified boss-result adapter and leveling/balance; BA/mechanic can simulate D11 without treating proposed rates as approved. Then complete AW2-008 loot/cooking, AW2-009 modes, AW2-010 vertical slice and AW2-011 release gates. No phase considered playable as a finished slice before AW2-010 verification.
