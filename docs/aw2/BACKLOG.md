# Task board
| ID | Owner | Scope | Status |
|---|---|---|---|
| AW2-000 | scretary/BA | Branch, canon/docs and seven agent skills; Git readback verified | VERIFIED |
| AW2-001 | mechanic/BA/tester | Isolated save/reset; non-destructive v1/v2→v3 migrations | Foundation MERGED; current schema v3/save regression VERIFIED at 03b92e2 |
| AW2-002 | story/BA | 6-zone / 8-NPC / 4-quest bible; owner approved D14 | MERGED approved specification + original review history; runtime partial |
| AW2-003 | character/mechanic | Owner approved initial 12 identities/tier/kit/starter, D10/D13/D15 | MERGED approved direction + original review history; full character DoD pending |
| AW2-004 | animation/character | 12 world + HD + VFX sets; five starters source f6a3b66 implemented | IN_PROGRESS: 5 reference sets, 7 NOT_CREATED; full character gates pending |
| AW2-004A | animation/character/tester | Than 4-way world, 8 HD key poses/tracks, portrait, FX/audio/provenance and preview | MERGED verified reference pipeline; not full character/release |
| AW2-004B | animation/character/tester | Four other starters, ranged projectile art, repeated cues and shared selector | MERGED verified reference sets, integration source 0e8fb7a; not full character/release |
| AW2-005 | mechanic | Five-tier gacha/pity/simulation | BACKLOG |
| AW2-006 | mechanic | Pixi free-roam map/collision; AW2-006A prototype source b3c526b | IN_PROGRESS: verified foundation MERGED, authored visuals/followers pending |
| AW2-007 | mechanic | RPG team/battle integration | IN_PROGRESS: A/B/C development rules/renderer/world-save VERIFIED; authored boss kit/art/production progression pending |
| AW2-007A | mechanic/BA/character/tester | Deterministic five-unit core, canonical events, range/projectile/interrupt and bounded starter passives | VERIFIED pure rules at fdf4a60; no UI/save/reward |
| AW2-007B | mechanic/animation/tester | Event-driven HD battle preview and development leveling | VERIFIED at9067376; continuation INTEGRATED / PUSHED to game/adventure-world-2 through AW2-012A at82b85cd |
| AW2-007C | mechanic/BA/story/animation/tester | Trusted boss checkpoint/result/save v3, note/both endings/shortcut and once-only receipts | VERIFIED at03b92e2:98 AW2 /891 full tests;91 Chromium assertions; INTEGRATED / PUSHED through AW2-012A at82b85cd |
| AW2-008 | story/mechanic | Four quest/debug dungeon/boss progress implemented; numerical loot/chest/cooking pending | IN_PROGRESS; no inventory grants until economy contract |
| AW2-009 | BA/mechanic | TCG/Auto Chess in-world portals & quick-entry | BACKLOG |
| AW2-010 | all/tester | Lantern playable vertical slice | BACKLOG |
| AW2-011 | tester | Release regression/rights/mobile/offline | BACKLOG |
| AW2-012 | BA/tester/scretary | Integrate all six AW2 feature histories; preserve approved canon and review evidence | VERIFIED / MERGED locally, source 0e8fb7a;859 tests +212 Chromium checks PASS |
| AW2-012A | BA/tester/scretary | Owner-authorized fast-forward/push of all completed AW2 features to the long-lived branch | VERIFIED / INTEGRATED / PUSHED at82b85cd;891 tests /88 files, both typechecks, build/release/isolation PASS; following edits docs only |

Current integration status supersedes the historical local-only/no-push statements below: the six foundation histories and AW2-007A/B/C are included in remote `game/adventure-world-2`. [AW2-012A task/checks](tasks/AW2-012A.md). Source feature branches remain retained; unrelated legacy features are excluded.
AW2-001 evidence: [task card](tasks/AW2-001.md), [verification](evidence/AW2-001.md). The original standalone save source is retained; AW2-012 now integrates it and schema-v2 world dependencies into `game/adventure-world-2`.

Owner approved both story and roster proposals in-session. D10/D13/D14/D15 and CANON supersede historical PROPOSED labels in the archived review documents. D11 rates/pity remain unapproved; do not ship gacha before their simulation/review.

AW2-006A foundation: six debug zones, collisions/range/returns, first three quests, memory choice/puzzle, one-time starter unlock and v1→v2 save migration; [task](tasks/AW2-006A.md), [evidence](evidence/AW2-006A.md). AW2-012 merged all completed feature heads locally into the long-lived AW2 branch; no master update or remote push. [Integration](evidence/AW2-012.md).

AW2-004A has a verified reference pipeline: [task](tasks/AW2-004A.md), [evidence](evidence/AW2-004A.md), preview `/dev/aw2/than.html`. Eight HD key poses + interpolated tracks are declared honestly; full character DoD and legal/device/battle gates remain open. No changes to save schema, rates or approved identities.

AW2-004B: [task](tasks/AW2-004B.md), [evidence](evidence/AW2-004B.md), preview `/dev/aw2/starters.html`. Lửa Nhỏ/Lam Lam/Mộc Non/Sương Lành have distinct reference sets; all five starters resolve canonical assets. Three ranged basic flights/impacts and two-hit/two-pulse presentation cues are tested; actual development combat is now supplied by AW2-007A/C, rather than inferred from presentation cues.

AW2-007A: [task](tasks/AW2-007A.md), [evidence](evidence/AW2-007A.md). Pure rules own damage/heal/shield/status/interruption/terminal truth and ordered renderer events. Development numbers are not approved balance; AW2-007C now verifies the development boss/checkpoint subset of BATTLE-02, while production/native continuation remains NOT_RUN.

AW2-007B: [task](tasks/AW2-007B.md), [evidence](evidence/AW2-007B.md). Chromium acceptance PASS; pending-level/terminal projectile repairs and pure session transitions. Feature branch7bb0bf1 is now included in the long-lived remote through the explicitly requested AW2-012A integration.

AW2-007C: [task](tasks/AW2-007C.md), [evidence](evidence/AW2-007C.md), [report](evidence/AW2-007C-browser.json). Canonical boss result is bound to its saved checkpoint; real loss/retreat/failed writes/stale tabs, note and both approved endings verified. v1/v2 load in memory as v3; no owner data/reset or numerical loot/XP grant. World uses explicit reference boss visuals.

Next smallest task: mechanic + BA specify numerical reward/XP/inventory contracts for AW2-008 chest/cooking, then tester verifies atomic inventory + receipt behavior. Animation/character owe authored enemies/signature kits, seven sets (`aw2-muoi`, `aw2-nhien`, `aw2-hai`, `aw2-lien`, `aw2-moc`, `aw2-bach`, `aw2-van`), mobile combat readability and all full-character device/rights gates. D11 simulation precedes rate/pity approval. Then AW2-009 modes and AW2-010/011 gates. No finished slice before AW2-010 verification. Completed feature work is pushed per owner instruction; no auto-merge.
