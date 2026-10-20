# Live project status

Date 2026-10-20. Phase: PREPRODUCTION / development save foundation.
Long-lived branch: `game/adventure-world-2`; session baseline `72ee9b4360299db4bab9b9b43dba552dd80b86cf`.
Implementation branch: `feat/aw2-001-dev-save`; verified source commit `201c6b7ada91bc9c76ff6b6fe7d642735b040dc1`. Documentation handoff follows that source commit. No push, PR, merge or release performed.

**AW2-000: VERIFIED (documentation only)**: root manual, ten initial project documents and seven owner skills committed; previous GitHub readback confirmed 13/13 sampled bootstrap/skill documents exist. Session open-PR connector query returned zero results for this repository.

**AW2-001: VERIFIED locally, unmerged**: strict development save v1 at `aw2.development.save`, read-only loading, explicit per-reset confirmation, conflict/failure handling and serialized cooperating writers via Web Locks. Standalone dev screen at `/dev/aw2/index.html`; production entry excludes it. See [task](tasks/AW2-001.md) and [evidence](evidence/AW2-001.md).

**AW2 runtime:** save foundation only. No map gameplay, gacha/economy, approved roster, new art/audio or playable vertical slice. Progression payload is intentionally empty. Canonical draft and D10/D11/D12 are unchanged.

**QA:** 81 Vitest files / 821 tests PASS; root/dev typechecks PASS; production build/release guard PASS. Chromium 153.0.8010.36: 29 flow checks PASS at 1280×800 and 390×844, including two-tab concurrent writes and legacy byte preservation. Captures inspected locally. Physical devices, other browser engines, native storage and AW2 gameplay/performance/offline remain NOT_RUN. Detailed command/ref attribution is in the ledger.

**Next:** story + BA scope AW2-002 quest/map/NPC bible on its own feature branch; character + mechanic prepare AW2-003 owner review. AW2-004/005 depend on roster decisions; no unit/model or drop-rate contract is approved by this implementation.

**Remaining risks:** Web Locks/secure context required to write; no reward ledger or production/native migration yet; external scripts that ignore the lock can still alter browser storage. Owner review remains needed before integration/release and for the proposed roster/rarities, draw rates/pity and final title. Soul of Meal stable data and `master` unchanged.
