# Task board
| ID | Owner | Scope | Status |
|---|---|---|---|
| AW2-000 | scretary/BA | Branch, canon/docs and seven agent skills; Git readback verified | VERIFIED |
| AW2-001 | mechanic/BA/tester | Isolated save/reset; extended non-destructively to v2 for world | MERGED into AW2; regression verified on 0e8fb7a |
| AW2-002 | story/BA | 6-zone / 8-NPC / 4-quest bible; owner approved D14 | MERGED approved specification + original review history; runtime partial |
| AW2-003 | character/mechanic | Owner approved initial 12 identities/tier/kit/starter, D10/D13/D15 | MERGED approved direction + original review history; full character DoD pending |
| AW2-004 | animation/character | 12 world + HD + VFX sets; five starters source f6a3b66 implemented | IN_PROGRESS: 5 reference sets, 7 NOT_CREATED; full character gates pending |
| AW2-004A | animation/character/tester | Than 4-way world, 8 HD key poses/tracks, portrait, FX/audio/provenance and preview | MERGED verified reference pipeline; not full character/release |
| AW2-004B | animation/character/tester | Four other starters, ranged projectile art, repeated cues and shared selector | MERGED verified reference sets, integration source 0e8fb7a; not full character/release |
| AW2-005 | mechanic | Five-tier gacha/pity/simulation | BACKLOG |
| AW2-006 | mechanic | Pixi free-roam map/collision; AW2-006A prototype source b3c526b | IN_PROGRESS: verified foundation MERGED, authored visuals/followers pending |
| AW2-007 | mechanic | RPG team/battle integration | BACKLOG |
| AW2-008 | story/mechanic | First 3 quests/puzzle prototype implemented; boss/loot/cooking pending | IN_PROGRESS (foundation only) |
| AW2-009 | BA/mechanic | TCG/Auto Chess in-world portals & quick-entry | BACKLOG |
| AW2-010 | all/tester | Lantern playable vertical slice | BACKLOG |
| AW2-011 | tester | Release regression/rights/mobile/offline | BACKLOG |
| AW2-012 | BA/tester/scretary | Integrate all six AW2 feature histories; preserve approved canon and review evidence | VERIFIED / MERGED locally, source 0e8fb7a;859 tests +212 Chromium checks PASS |
AW2-001 evidence: [task card](tasks/AW2-001.md), [verification](evidence/AW2-001.md). The original standalone save source is retained; AW2-012 now integrates it and schema-v2 world dependencies into `game/adventure-world-2`.

Owner approved both story and roster proposals in-session. D10/D13/D14/D15 and CANON supersede historical PROPOSED labels in the archived review documents. D11 rates/pity remain unapproved; do not ship gacha before their simulation/review.

AW2-006A foundation: six debug zones, collisions/range/returns, first three quests, memory choice/puzzle, one-time starter unlock and v1→v2 save migration; [task](tasks/AW2-006A.md), [evidence](evidence/AW2-006A.md). AW2-012 merged all completed feature heads locally into the long-lived AW2 branch; no master update or remote push. [Integration](evidence/AW2-012.md).

AW2-004A has a verified reference pipeline: [task](tasks/AW2-004A.md), [evidence](evidence/AW2-004A.md), preview `/dev/aw2/than.html`. Eight HD key poses + interpolated tracks are declared honestly; full character DoD and legal/device/battle gates remain open. No changes to save schema, rates or approved identities.

AW2-004B: [task](tasks/AW2-004B.md), [evidence](evidence/AW2-004B.md), preview `/dev/aw2/starters.html`. Lửa Nhỏ/Lam Lam/Mộc Non/Sương Lành have distinct reference sets; all five starters resolve canonical assets. Three ranged basic flights/impacts and two-hit/two-pulse presentation cues are tested; combat outcomes remain unimplemented.

Next smallest task: mechanic + BA/tester scope AW2-007A pure five-unit combat rules and deterministic tests, before renderer/boss/save integration. Keep renderer events from confirming gameplay hits or awarding outcomes; carry interruption/range/manual ultimate contracts and capped passives into the engine. Five starter reference sets make this the next vertical-slice dependency. Animation/character still owe seven sets (`aw2-muoi`, `aw2-nhien`, `aw2-hai`, `aw2-lien`, `aw2-moc`, `aw2-bach`, `aw2-van`) and all full-character combat/leveling/device/rights gates. BA/mechanic can simulate D11 without treating rates as approved. Then AW2-008 loot/cooking, AW2-009 modes, AW2-010/011 gates. No finished slice before AW2-010 verification.
