# Handoff — 2026-10-20
**Branch:** `game/adventure-world-2`. **Completed:** AW2-000 agent/documentation foundation, GitHub readback 13/13 bootstrap and skill files.
**Next owner:** BA + mechanic on AW2-001 dev-save architecture; story AW2-002 and character AW2-003 may proceed on scoped branches. Read `AGENTS.md`, `README.md`, `DECISIONS.md`, `CANON.md`, `GACHA.md`, `STATUS.md`, `BACKLOG.md`, `TEST_LEDGER.md`, then owning skill.
**Design locked:** incubated new game; 12 fully built first, then 16–20; rarity N/R/SR/SSR/UR; connected map and five-unit auto combat; pixel world, HD anime battle; TCG/Auto Chess with in-world/quick access; pre-release dev data reset permitted but never clear legacy stable save. Post-release patch requires migration.
**Proposed (not approved):** 12 candidate identities and tiers, gacha probabilities/pity and final standalone title.
**Not done:** AW2 runtime, asset generation, end-to-end feature testing, device FPS/offline checks. Tester ledger cases remain NOT_RUN.
**Implementation next step:** make AW2 dev namespace independent of `foodchest.tcg.v1`, reset with explicit confirmation and tests for legacy preservation; avoid shipping/merging to master.
