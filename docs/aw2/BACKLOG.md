# Task board
| ID | Owner | Scope | Status |
|---|---|---|---|
| AW2-000 | scretary/BA | Branch, canon/docs and seven agent skills; Git readback verified | VERIFIED |
| AW2-001 | mechanic/BA/tester | Separate dev save, explicit reset UX, schema; source `201c6b7`, feature branch only | VERIFIED (local, unmerged) |
| AW2-002 | story | Lantern map story/quest/NPC bible | READY |
| AW2-003 | character/mechanic | Owner review 12 roster/rarity/kit | READY |
| AW2-004 | animation/character | 12 world + HD + VFX assets | BACKLOG |
| AW2-005 | mechanic | Five-tier gacha/pity/simulation | BACKLOG |
| AW2-006 | mechanic | Pixi free-roam map and collision | BACKLOG |
| AW2-007 | mechanic | RPG team/battle integration | BACKLOG |
| AW2-008 | story/mechanic | Dungeon/chest/cooking and quests | BACKLOG |
| AW2-009 | BA/mechanic | TCG/Auto Chess in-world portals & quick-entry | BACKLOG |
| AW2-010 | all/tester | Lantern playable vertical slice | BACKLOG |
| AW2-011 | tester | Release regression/rights/mobile/offline | BACKLOG |
AW2-001 evidence: [task card](tasks/AW2-001.md), [verification](evidence/AW2-001.md). It provides a development save screen, not world gameplay. Code is on `feat/aw2-001-dev-save`; the long-lived branch has not absorbed it.

Next smallest work: story + BA create the AW2-002 task card and author the Lantern quest/map/NPC proposal; mark all new lore PROPOSED until reviewed. Character + mechanic may prepare AW2-003's 12 identity/kit cards for owner review independently. These are owner roles, not running background agents. Create separate feature branches; integration must include AW2-001 deliberately if needed. AW2-004/005 depend on roster decisions; no production gacha implementation before approved rates/pity/save contracts. No phase considered playable before AW2-010 verification.
