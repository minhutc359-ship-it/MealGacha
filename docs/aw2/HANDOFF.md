# Handoff — 2026-10-21 / AW2-013A persistent expedition

**Branch:** `game/adventure-world-2`. **Implementation:** `a40217afd4168fac854b8c482a3f0fef48809c26`; baseline local/remote `075e141fabe90943246bae16eb3f3b3d48cba391`. Following completion changes are documentation only. D16 requires direct AW2 development, checks/docs/commit and automatic push/readback after each completed task; no feature branch. Final delivery ref is the documentation descendant of a40217a, verified against remote before the final response. [Task](tasks/AW2-013A.md), [evidence](evidence/AW2-013A.md), [workflow](WORKFLOW.md).

**AW2-013A VERIFIED.** Reviewed/adapted the scoped implementation from open PR #82 (`rpg`, pinned head `c34c6a20dc9755d622117bb594b80e4787b5bf6c`, original code `a66188f2f340800b86e10e56ad300bc302387f0f`). Its base runtime equals AW2's baseline. No merge or change to PR #82, rpg or master. Historical `AW2-013-*` evidence is preserved with source notices; fresh Linux evidence uses `AW2-013A-*`. Current D16 supersedes the historical RPG-target instructions. BA/mechanic/tester/scretary reviews performed in-session; no independent agent or device/legal sign-off.

Implementation a40217a has been published/read back. CLI push lacked Linux credentials, so the authorized GitHub connection created an identical tree and advanced only AW2 with expected-baseline/force=false. Independent Git fetch and full tree comparison passed. Original local 96f8019 is retained in a verified ignored incremental bundle; local HEAD now matches the published equivalent. Final completion docs use the same guarded delivery/readback.

## What changed

Save v4 adds inventory/XP/receipts/cooked/shared counters under the same isolated AW2 key. Valid v1–v3 upgrade read-only until explicit action; load grants nothing. Versioned development contract `aw2-economy-development-v1`: quest XP 30/50/80/140 and ingredients, pantry chest 4 rice/3 herbs/2 broth once, recipe 1 each→1 warm bowl, share 1 bowl→45 shared XP. Cooking/share require quest 3 complete and range of Dì/hearth. Old completed quests expose an explicit catch-up button. Boss seeds use persisted XP and the existing level 1–20 projection. Counts cap 9999; XP caps at level 20. These are development values, not approved final balance.

World/quest and inventory grants run inside one Web Lock and one expected-raw write. Renderer never supplies item/XP/receipt values. Failed writes preserve bytes and allow retry; stale/replayed/concurrent claims cannot duplicate rewards. Additional review repairs close two demonstrated holes: ordinary position-save cannot forge objective/quest completion to mint rewards, and boss entry cannot supply an unsaved accepted quest. Existing authentic terminal authority, note/both endings, shortcut and independent preview boundaries remain intact.

Five authored chibi atlases now render companions/following trails. Click/tap uses bounded collision-safe paths; keyboard/dpad remain. Reread/save identity/zone changes clear old follower trails. Objective guidance and collapsible inventory/party panel show actual persisted progression; ultimate cards have portraits. Optional audio consumes confirmed events, with bounded voices and cleanup on pause/reset/unmount, including same-level resets. Non-finite path endpoints reject. Missing atlas produces an explicit error without substitute actors. No art generated or edited.

`pnpm build:aw2` creates separate static `dist-aw2/` with root→world and save/battle/starter/Than entries. Runtime WebP/WAV/JSON copied; source PNG/TS/maps/archives excluded. The compiled favicon404 found by Chromium is fixed using an explicit empty icon. Stable build/config remain separate and exclude AW2. No deployment/release. D11's simulator/proposal remain PROPOSED with no runtime draw/spend/save.

Paths: `src/aw2/{economy,save,world,combat/audio.ts,gacha/simulator.ts}`, `dev/aw2/{world,WorldCanvas,InventoryPanel,WorldBattle,battle,useBattleAudio,styles}`, affected AW2 tests/verifiers, `dev/vite.aw2.config.ts`, package script and ignored build directory. No dependency/lockfile update. Canonical12 spirit/skill/asset IDs, approved story/tier direction and original art/provenance unchanged. Inventory IDs are AW2-contained `rice`, `herbs`, `broth`, `warm-bowl`; chest receipt `aw2-grant-chest-pantry`.

## Verification and limits

Linux x86_64 /Node 22.23.2 /pnpm 10.34.3 /Vite 8.0.5 /Vitest 5.0.1 /TS 5.9.3 /Chromium 153.0.8010.36. **909 full tests /91 files PASS**,29.98s, two workers, no failures/skips; final **116 AW2 /11 files PASS**. Both typechecks, whitespace, stable build/release guard, review build and851-file/72-text production isolation PASS. Chromium **124 assertions PASS**:29 save +40 full quest/boss +22 battle +25 progression/audio +8 compiled build. Fresh isolated contexts only; no owner profile/reset. Four fresh captures opened. [Commands, reports and repaired failures](evidence/AW2-013A.md).

Source boundary failures were reproduced before repair (2failed/9passed economy tests); four older fixtures then failed because they injected quest progress through position saves, and were updated to real actions. Initial compiled verifier failed on the real favicon404; diagnostic probe pinned its URL; final 8 PASS. No passing claim for those failed attempts. Browser boss fixtures now win at tick36 with their earned development XP, rather than the old level 1 tick41; persisted level change is expected, not a balance approval.

Full authored maps/NPCs/boss signature kit, seven spirit sets, physical devices/native/offline/FPS, human listening, legal rights, production balance and full vertical slice remain open. Initial/restored followers overlap until movement; small mobile arena labels remain. All five reference starters retain `fullCharacterComplete=false`. Active battles abandon at their checkpoint on reload, not resume. Application-local protections are not server anti-cheat. GACHA-02/runtime grants and TCG/Chess are NOT_RUN.

## Run / next owner

```sh
pnpm dev
# http://localhost:8443/dev/aw2/world.html
pnpm test dev/tests/aw2 --maxWorkers=2
pnpm build:aw2
pnpm exec vite preview --config dev/vite.aw2.config.ts --host 127.0.0.1 --port 8455
# http://127.0.0.1:8455/
```

Local source QA used the verified existing 127.0.0.1:8452 server; progression verifier owns 8454, compiled verifier 8455 and closes its own server. Browser tools accept `--playwright <module>` and `--chromium <executable>`; exact commands in evidence. Save/reset `/dev/aw2/index.html`; standalone battle `/dev/aw2/battle.html`; references `/dev/aw2/starters.html` and `/dev/aw2/than.html`.

**Next smallest task:** BA/mechanic define AW2-009A TCG/Auto Chess in-world portals and direct quick-entry with explicit isolated-save and return/reload contracts; tester verifies the adapters. Animation/character continue authored boss/map/NPC and seven remaining spirit sets (`aw2-muoi`, `aw2-nhien`, `aw2-hai`, `aw2-lien`, `aw2-moc`, `aw2-bach`, `aw2-van`). D11 needs owner approval before any runtime gacha. Full AW2-006/007/008/010/011 stay open; continue directly on AW2 under D16.

Historical foundation/integration/cleanup: [AW2-012](evidence/AW2-012.md), [AW2-012A](tasks/AW2-012A.md), [AW2-012B](tasks/AW2-012B.md), [CHANGELOG](CHANGELOG.md). Their environment-specific branch counts and old test results are historical, not fresh checks here.
