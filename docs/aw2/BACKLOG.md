# Task board
| ID | Owner | Scope | Status |
|---|---|---|---|
| AW2-000 | scretary/BA | Branch, canon/docs and seven agent skills; Git readback verified | VERIFIED |
| AW2-001 | mechanic/BA/tester | Isolated save/reset; read-only v1/v2/v3→v4 migration | Foundation MERGED; v4/authority/economy regression VERIFIED in AW2-013A at a40217a |
| AW2-002 | story/BA | 6-zone / 8-NPC / 4-quest bible; owner approved D14 | MERGED approved specification + original review history; runtime partial |
| AW2-003 | character/mechanic | Owner approved initial 12 identities/tier/kit/starter, D10/D13/D15 | MERGED approved direction + original review history; full character DoD pending |
| AW2-004 | animation/character | 12 world + HD + VFX sets; five starters source f6a3b66 implemented | IN_PROGRESS: 5 reference sets,3 starter motion packages,7 NOT_CREATED; full character gates pending |
| AW2-004A | animation/character/tester | Than 4-way world, 8 HD key poses/tracks, portrait, FX/audio/provenance and preview | MERGED verified reference pipeline; not full character/release |
| AW2-004B | animation/character/tester | Four other starters, ranged projectile art, repeated cues and shared selector | MERGED verified reference sets, integration source 0e8fb7a; not full character/release |
| AW2-004C | character/animation/mechanic/tester | Than32-cel/eight-state motion, shared playback/FX ownership and measured full-DoD gaps | VERIFIED scoped reference milestone at f85e1e7;989 tests /377 browser checks; full-character gates OPEN |
| AW2-004D | character/animation/mechanic/tester | Lửa Nhỏ32-cel motion, confirmed two-hit presentation and reproducible builders | VERIFIED reference subset at cef55c0;996 units /385 browser checks, full-character gates OPEN |
| AW2-004E | character/animation/mechanic/tester | Lam Lam32-cel motion/confirmed impacts and two-pulse healing | VERIFIED reference subset at cf0b394;1007 units/471 browser checks; full-character gates OPEN |
| AW2-004F | character/animation/mechanic/tester | Mộc Non motion/event-bound support presentation | READY; implementation NOT_RUN |
| AW2-005 | mechanic | Five-tier gacha/pity/simulation | Simulation/proposal VERIFIED in AW2-013A; D11 PROPOSED, runtime draw/spend/save BACKLOG |
| AW2-006 | mechanic | Pixi free-roam map/collision/companions/touch | Development foundation/followers/navigation VERIFIED in AW2-013A; authored maps/NPCs/device gates pending |
| AW2-007 | mechanic | RPG team/battle integration | Development core/world-save/persisted-level/audio/mobile subsets VERIFIED; authored boss kit/art/production balance pending |
| AW2-007A | mechanic/BA/character/tester | Deterministic five-unit core, canonical events, range/projectile/interrupt and bounded starter passives | VERIFIED pure rules at fdf4a60; no UI/save/reward |
| AW2-007B | mechanic/animation/tester | Event-driven HD battle preview and development leveling | VERIFIED at9067376; continuation INTEGRATED / PUSHED to game/adventure-world-2 through AW2-012A at82b85cd |
| AW2-007C | mechanic/BA/story/animation/tester | Trusted boss checkpoint/result/save v3, note/both endings/shortcut and once-only receipts | VERIFIED at03b92e2:98 AW2 /891 full tests;91 Chromium assertions; INTEGRATED / PUSHED through AW2-012A at82b85cd |
| AW2-008 | story/mechanic | Four quests/debug dungeon/boss plus atomic XP/inventory/chest/cooking | Development subset VERIFIED in AW2-013A; final balance/authored dungeon/full gates open |
| AW2-009 | BA/mechanic | TCG/Auto Chess in-world portals & quick-entry | VERIFIED embedded borrowed-practice/navigation subset through AW2-009A/B/C; full production modes/balance/art/persistence/prizes open |
| AW2-009A | BA/mechanic/tester/scretary | Shared checkpoint/return adapter, portals/quick-entry, honest lobbies and quick REPORT | VERIFIED at16f55af;926 full tests /100 Chromium assertions; D16 direct AW2 delivery |
| AW2-009B | BA/mechanic/tester | AW2 TCG practice contract/deck/rules/opponent through the adapter | VERIFIED at a0d24937f1450f8b4f8338780fee6a4cc0aa125c;951 full tests /158 AW2, actual legal wins/losses, no world grants/writes |
| AW2-009C | BA/mechanic/tester | AW2 Auto Chess practice contract/board/rules through the adapter | VERIFIED at ff499a52e471f9b07133bc80e9d32802dda92cb8;970 full tests /177 AW2, actual recruit/merge/formation/combat/results and no world writes |
| AW2-010 | all/tester | Lantern playable vertical slice | IN_PROGRESS foundations; full twelve-character/art/device slice open |
| AW2-010A | BA/mechanic/tester/scretary | Fresh-player demo gate across RPG/TCG/Chess, onboarding/playtest and review blockers | VERIFIED automated subset at e7aedac;982 full tests/171 browser checks; independent human playtest NOT_RUN |
| AW2-011 | tester | Release regression/rights/mobile/offline | BACKLOG |
| AW2-012 | BA/tester/scretary | Integrate all six AW2 feature histories; preserve approved canon and review evidence | VERIFIED / MERGED locally, source 0e8fb7a;859 tests +212 Chromium checks PASS |
| AW2-012A | BA/tester/scretary | Owner-authorized fast-forward/push of all completed AW2 features to the long-lived branch | VERIFIED / INTEGRATED / PUSHED at82b85cd;891 tests /88 files, both typechecks, build/release/isolation PASS; following edits docs only |
| AW2-012B | BA/tester/scretary | Standing direct-AW2 development/push policy D16 and audited redundant branch cleanup | VERIFIED; policy pushed at3d03110;73 remote /3 local branches deleted and read back,6 remote /2 local retained; documentation/ref checks PASS |
| AW2-013 | mechanic/animation/tester/scretary | Historical PR #82 RPG progression/companions/build work | Original source a66188f, pinned c34c6a2; reviewed/adapted by AW2-013A, PR/rpg unchanged |
| AW2-013A | BA/mechanic/tester/scretary | Reviewed schema v4 economy/XP/chest/cooking, companions/touch/audio and isolated review build | VERIFIED at a40217a;909 full tests /124 Chromium assertions; D16 direct-AW2 delivery |

Current integration status supersedes the historical local-only/no-push statements below: the six foundation histories and AW2-007A/B/C are included in remote `game/adventure-world-2`. [AW2-012A task/checks](tasks/AW2-012A.md). AW2-012B now supersedes source-branch-retention and feature-only-push policy: work directly on AW2, push after each completed task and remove audited merged branch refs while retaining their reachable commits/evidence. Unrelated unmerged legacy work remains excluded.
AW2-001 evidence: [task card](tasks/AW2-001.md), [verification](evidence/AW2-001.md). The original standalone save source is retained; AW2-012 now integrates it and schema-v2 world dependencies into `game/adventure-world-2`.

Owner approved both story and roster proposals in-session. D10/D13/D14/D15 and CANON supersede historical PROPOSED labels in the archived review documents. D11 rates/pity remain unapproved; do not ship gacha before their simulation/review.

AW2-006A foundation: six debug zones, collisions/range/returns, first three quests, memory choice/puzzle, one-time starter unlock and v1→v2 save migration; [task](tasks/AW2-006A.md), [evidence](evidence/AW2-006A.md). AW2-012 merged all completed feature heads locally into the long-lived AW2 branch; no master update or remote push. [Integration](evidence/AW2-012.md).

AW2-004A has a verified reference pipeline: [task](tasks/AW2-004A.md), [evidence](evidence/AW2-004A.md), preview `/dev/aw2/than.html`. Eight HD key poses + interpolated tracks are declared honestly; full character DoD and legal/device/battle gates remain open. No changes to save schema, rates or approved identities.

AW2-004B: [task](tasks/AW2-004B.md), [evidence](evidence/AW2-004B.md), preview `/dev/aw2/starters.html`. Lửa Nhỏ/Lam Lam/Mộc Non/Sương Lành have distinct reference sets; all five starters resolve canonical assets. Three ranged basic flights/impacts and two-hit/two-pulse presentation cues are tested; actual development combat is now supplied by AW2-007A/C, rather than inferred from presentation cues.

AW2-007A: [task](tasks/AW2-007A.md), [evidence](evidence/AW2-007A.md). Pure rules own damage/heal/shield/status/interruption/terminal truth and ordered renderer events. Development numbers are not approved balance; AW2-007C now verifies the development boss/checkpoint subset of BATTLE-02, while production/native continuation remains NOT_RUN.

AW2-007B: [task](tasks/AW2-007B.md), [evidence](evidence/AW2-007B.md). Chromium acceptance PASS; pending-level/terminal projectile repairs and pure session transitions. Feature branch7bb0bf1 is now included in the long-lived remote through the explicitly requested AW2-012A integration.

Historical AW2-007C source03b92e2: [task](tasks/AW2-007C.md), [evidence](evidence/AW2-007C.md), [report](evidence/AW2-007C-browser.json). Canonical boss result is bound to its saved checkpoint; real loss/retreat/failed writes/stale tabs, note and both approved endings verified. That milestone loaded v1/v2 in memory as v3 without numerical rewards; AW2-013A below supersedes those limits. World uses explicit reference boss visuals.

Current progression: [AW2-013A task](tasks/AW2-013A.md), [fresh evidence](evidence/AW2-013A.md). Schema v4 and locked actions replace the prior schema-v3/no-numerical-reward limits above. Valid old saves load without writes/rewards; explicit actions atomically grant once. Boss uses persisted team XP. Five reference companions, touch paths, inventory UI, optional event audio and a separate review build are verified development subsets; full parent tasks are not complete.

Current modes: [AW2-009A](tasks/AW2-009A.md) navigation, [AW2-009B](tasks/AW2-009B.md) TCG and [AW2-009C](tasks/AW2-009C.md) Auto Chess are verified borrowed practices, with no world prizes/spending/persistent roster. [Fresh evidence](evidence/AW2-009C.md), [TCG rules](TCG_PRACTICE.md), [Chess rules](AUTO_CHESS_PRACTICE.md), [quick REPORT](REPORT.md).

Next smallest task: [AW2-004F](tasks/AW2-004F.md), character/animation/mechanic/tester closes Mộc Non motion/support-presentation gaps. [AW2-004E](tasks/AW2-004E.md) atcf0b394 verifies Lam32-cel motion/confirmed target impacts/two healing pulses/finite reduced FX;1007 full tests/471 fresh final browser assertions, no rule/save/canon change. Independent [Lam](LAM_CHARACTER_GATES.md)/[Lua](LUA_CHARACTER_GATES.md)/[Than](THAN_CHARACTER_GATES.md) art/full DoD and independent demo playtest remain open. Demo≈90%, product≈40% rough35–45% unchanged; report both after every completed update. Two key-pose starters,7 absent sets/map/NPC/boss, final balance/mode product/save production/device/listening/offline/FPS/rights/release gates remain. D11 PROPOSED, D12 OPEN. [PROGRESS](PROGRESS.md), [REPORT](REPORT.md), [conditional estimates](DELIVERY_PLAN.md). D16 direct AW2 checks/docs/commit/push/readback continues.
