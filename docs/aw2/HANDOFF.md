# Handoff — 2026-10-20 / approved first wave + AW2-006A

**Current branch:** `feat/aw2-006-world-foundation`. **Verified implementation:** `b3c526bdf37c03184fb68df150381f19e5f0723d`; following commit changes documentation/evidence only. **Long-lived base:** `game/adventure-world-2` at `72ee9b4360299db4bab9b9b43dba552dd80b86cf`. No push, merge into AW2/master, release or owner save reset.

## Completed scope

AW2-001 save/reset source `201c6b7` + evidence `9dec38e` incorporated as dependency. Source proposals AW2-002 `461c7cf` and AW2-003 `4d8f1c5` incorporated via `5f7fecf` / `eee22f9`. Owner then replied “Duyệt cả hai bản đề xuất” to the review request explicitly excluding rates/pity. CANON + D10/D13/D14/D15 now record the approved scope; spirit IDs immutable. Review artifacts keep historical labels with an explicit supersession notice. Independent review branches/worktrees remain for audit, at `238708c` and `4b8553c`; their older pending labels are historical, superseded here.

AW2-006A implements six-zone Pixi development preview with pure world rules, collisions/returns/range, NPC interactions, first three quests, memory choice/puzzle retry, one-time starter unlock and schema-v2 world persistence. Valid schema v1 migrates in memory; explicit save writes v2 preserving UUID/creation time. Reset still requires a fresh typed confirmation; no silent reset. Progress, party and revision are committed in one AW2 key, with browser lock/raw conflict protection. Actual loot is not implemented or claimed atomic by this receipt display.

## Paths and canonical IDs

Runtime: `src/aw2/save/{schema,store}.ts`, `src/aw2/world/{ids,maps,model,rules}.ts`. Development: `dev/aw2/{index.html,main.tsx,styles.css,world.html,world.tsx}`. Tests/tools: `dev/tests/aw2/{save,world}.test.ts`, `dev/tools/verify-aw2-{save,world}.mjs`. Docs: root README; AW2 CANON/DECISIONS/README/STATUS/BACKLOG/HANDOFF/TEST_LEDGER/CHANGELOG; tasks AW2-001/002/003/006A, proposals AW2-002/003, evidence AW2-001/006A.

Save key `aw2.development.save`, game ID `adventure-world-2`, schema 2; 12 approved `aw2-*` spirit IDs; 6 zone IDs, 8 NPC IDs and quest IDs from approved story proposal. No proposed gacha values were promoted into runtime. Null/not-created asset metadata prevents any claim of authored unit completion; canvas markers represent debug exploration objects/player, not spirit battle assets.

## Verified / remaining

`pnpm test dev/tests/aw2`: 46 PASS. Final `pnpm test --maxWorkers=2`: 82 files / 839 tests PASS. Root/dev typechecks, production build/release guard, production entry exclusion PASS. Chromium: 29 save/reset and 18 world checks PASS (keyboard, on-screen hold/release/blur, modal pause/close, intro five starters, out-of-order memories, puzzle retry, six-zone travel and safe return, reload, explicit pending boss, legacy bytes). Desktop/mobile viewport captures inspected. [Ledger](TEST_LEDGER.md), [latest evidence](evidence/AW2-006A.md).

Initial default full run had one unchanged legacy TCG 60-game simulation exceeding its 20s timeout while other checks ran; capped-worker full rerun passed without source/timeout edits. Full release regression still due, including normal target-runner behavior. Physical devices/native durability/offline/FPS, followers, authored art/audio/8-state HD, full combat/boss/reward/cooking/mode/gacha remain NOT_RUN. AW2-006/008 are partial, AW2-010 not complete. Final boss/ending/shortcut stay gated until combat adapter exists.

## Review and next smallest task

In-session BA/mechanic/story/character/tester/scretary role reviews complete for this foundation, including the owner's explicit proposal approval; no independent animation/license/physical-device approval is implied. Next owner animation + character: task AW2-004A, one fully authored reference spirit (Than) with world four directions, HD eight states, portrait/unique skill/VFX/audio/provenance and QA, then apply pipeline to other 11. Mechanic + tester: AW2-007 five-unit combat/leveling and authenticated boss outcome in the same save. BA/mechanic can simulate D11 but require owner approval before treating rates/pity as final. Finish dungeon loot/cooking, mode adapters and complete slice/release gates afterward. Do not assume any feature was merged into the long-lived branch.

## Run

`pnpm dev` then `/dev/aw2/world.html` (default localhost:8443); current verification server runs at localhost:8452. WASD/arrows or hold direction buttons; E / Tương tác. Walk state stays local until Lưu vị trí or explicit interaction. Đọc lại discards unsaved position and reloads exact persisted state; stale tab writes are rejected. Save/reset screen is `/dev/aw2/index.html`. Development entries are absent from production output.
