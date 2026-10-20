# Handoff — 2026-10-20 / AW2-001

**Base:** `game/adventure-world-2` at `72ee9b4360299db4bab9b9b43dba552dd80b86cf`.
**Feature:** `feat/aw2-001-dev-save`; source `201c6b7ada91bc9c76ff6b6fe7d642735b040dc1`, followed by documentation-only handoff. VERIFIED locally, unmerged. No remote writes, merge or deployment. Open-PR connector search returned zero results; this is the observed query result, not proof of future remote state.

**Changed paths:** `src/aw2/save/schema.ts`, `src/aw2/save/store.ts`; `dev/aw2/index.html`, `dev/aw2/main.tsx`, `dev/aw2/styles.css`; `dev/tests/aw2/save.test.ts`; `dev/tools/verify-aw2-save.mjs`; root `README.md`; AW2 `README.md`, `STATUS.md`, `BACKLOG.md`, `HANDOFF.md`, `TEST_LEDGER.md`, `CHANGELOG.md`, `tasks/AW2-001.md` and `evidence/AW2-001.{md,json}`.

**Accepted implementation decisions:** independent `aw2.development.save`; game ID `adventure-world-2`, environment `development`, schema v1 with empty progress; UUID save identity and revision; no legacy journal/native bridge import; no automatic initialization or recovery overwrite. Web Locks serialize cooperating writers, with byte comparison inside the lock. Each reset requires a fresh modal/request, exact `RESET AW2` and final click; cancel/Escape do not write. Only explicit development reset can replace invalid/future AW2 data. No LOCKED product decision or proposed canon was changed.

**Tested:** 821 Vitest tests across 81 files, both typechecks, build/release guard, production entry isolation, 29 Chromium flow checks. UI focus issue found and fixed, then verified; desktop/mobile captures inspected. See [ledger](TEST_LEDGER.md) and [evidence](evidence/AW2-001.md). Initial missing Capacitor dependencies were repaired with frozen-lockfile install, without changing package files. Old dev-server optimizer state was cleared by restarting with `--force`. These initial failures are resolved, not counted as passing attempts.

**Unverified:** physical devices, non-Chromium engines, native persistence, quota crash/power-loss durability, offline/FPS, reward atomicity, world/battle/gacha and authored assets. Progress payload is empty, so game systems must explicitly extend/version the schema. Unsupported Web Locks environments cannot write. Full release regression remains due before release/major shared-engine integration.

**Required role reviews completed in-session:** BA scope/AC; mechanic schema/reset and no-legacy dependency review; tester observed automated/browser results; scretary documentation/index consistency. These do not represent independent human approvals or approval of roster/rates. Owner reviews integration before merge/release.

**Next smallest task / owner:** story + BA create AW2-002 card, author connected-zone/NPC/quest proposal with trigger → objective → choice → world-state transitions and test impact. Character + mechanic prepare AW2-003 identity/kit review in a separate feature branch; retain proposed status for 12 names/tiers until owner approval. Read bootstrap documents and owning skills first. Bring AW2-001 into later runtime work deliberately; do not assume it is merged into the long-lived branch.

**Locked design carried forward:** new incubated game; 12 fully built spirits first, then 16–20; five rarity tiers; connected free-roam zones; five-spirit auto combat/manual ultimates; pixel exploration + HD anime battle; TCG/Chess world and quick entries; production migrations after first release. Never clear Soul of Meal stable data.
