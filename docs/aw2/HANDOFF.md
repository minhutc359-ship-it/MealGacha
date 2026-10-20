# Handoff — 2026-10-20 / AW2-004B starter reference assets

**Current branch:** `feat/aw2-004b-starter-assets`. **Verified source:** `f6a3b6655988d262a974f6f5034845740fd94766`; following changes documentation only. **Base:** AW2-004A handoff `7f9c6ab63637ab9d9eb4cf6fa6e7dfb649892bed`, verified Than implementation `5d1df97`. World source `b3c526b` retained. Long-lived `game/adventure-world-2` remains `72ee9b4360299db4bab9b9b43dba552dd80b86cf`. Open-PR connector query returned zero results this session. No push, merge into long-lived/master, release or owner save reset.

## Completed

AW2-004B adds four distinct `base-v1` reference sets: `aw2-lua` Lửa Nhỏ / Bánh mì / N / Striker; `aw2-lam` Lam Lam / Phở / N / Healer; `aw2-moc-non` Mộc Non / Gỏi cuốn / R / Support; `aw2-suong` Sương Lành / Bánh cuốn / R / Mage. Existing owner approval D10/D13/D15 covers their identity/kit/visual direction; this task changes no canon, stats, gacha rates or save schema.

Each new unit has an original portrait also serving as identity reference, 16 four-direction chibi cels, eight HD battle key poses/interpolated tracks, 16 skill/projectile/impact FX cels and four original synthesized WAV cues. Sixteen PNG sources preserved unchanged, sixteen lossless WebPs totaling 16,509,218 bytes; no separate full-body reference illustration claimed. Exactly nineteen built-in image_gen calls, sixteen selected/three rejected, exact prompts/input hash chains/output hashes recorded. No external artwork reference, CLI/API fallback, source repaint/mask/mirror/resize. License REVIEW_REQUIRED / release NOT_CLEARED; no legal approval claimed.

Measured rectangles account for nonuniform generated spacing. Sương Lành actual world rows down/right/left/up are mapped explicitly; browser captures show correct directions. Mộc Non has one faint world gutter edge alpha9/255, declared tolerance9; other new sets tolerance8. All visible alpha≥96 bounds inset ≥2px. One Mộc Non battle column uses its own row split to preserve full feet. Original Than art/manifest bytes unchanged; shared encoder's default8 behavior retained.

Three ranged basics use their own authored flight cels then impact cels (presentation launch260/impact700ms). Lửa Nhỏ basic has contacts220/380ms; Lam Lam ultimate pulses520/1040ms. These are dev presentation timings/reference coordinates, not gameplay hit confirmation or approved speed/balance. Renderer never awards damage/heals/rewards. Passive previews are explicit manual procs pending unit-specific combat events; guard loop never invents a proc. Eight HD key poses plus interpolation are declared honestly, not frame-by-frame animation. All five starter fullCharacterComplete=false; seven non-starter sets remain NOT_CREATED.

## Paths and preview

- `src/aw2/assets/{lua,lam,moc-non,suong}.base-v1.json`, `starters.ts`, `types.ts`, `animation.ts`; `world/ids.ts` metadata resolves all five.
- `dev/aw2/assets/{lua,lam,moc-non,suong}/base-v1/`: source/runtime images, WAVs, prompts/provenance. Asset IDs `<spiritId>:{world,battle,portrait,reference,fx}:base-v1`; skills `<spiritId>:skill:<slot>`.
- Shared `dev/aw2/AssetCanvas.tsx` and `AssetPreview.tsx`; `starters.html/tsx`; Than wrapper `than.tsx`; world preview link. Selection remounts state/stops old audio; three image atlases load for the chosen unit only. Audio opt-in, pause/replay/reduced motion, missing-image errors, portrait/source links.
- `dev/tests/aw2/starters.test.ts`, updated asset test; `dev/tools/build-aw2-starter-assets.py`, `verify-aw2-starter-files.py`, `verify-aw2-starter-browser.mjs`; shared Than builder/verifier helpers.
- Required indexes/task/evidence: [task](tasks/AW2-004B.md), [evidence](evidence/AW2-004B.md), [ledger](TEST_LEDGER.md).

Existing server `http://localhost:8452/dev/aw2/starters.html` returned200; normal `pnpm dev` default8443. Optional `?spirit=aw2-lam` selects initial unit. `/dev/aw2/than.html` remains compatible. World `/dev/aw2/world.html` and save harness `/dev/aw2/index.html` remain separate. Preview never accesses saves; seeded browser test keys belong to a fresh isolated test profile.

## Verification and limitations

PASS on identical f6a3b66 source bytes: 66 AW2 unit tests/four files (46 save/world +20 assets), root/dev typechecks, root build/release guard and 49-artifact production exclusion; five-unit source/output hashes/visible RGBA/alpha/200 frame bounds and PCM/duration/non-silence/no-clipping/fade checks. Sixteen new cues/portraits distinct; prompt/output hashes verified. Existing >500k chunk warning remains.

Chromium153.0.8010.36 isolated profile: 133 new-starter assertions +32 Than regression assertions PASS, desktop1280×1000/mobile viewport390×844. Eight HD states and four directions per new unit draw real pixels; all four skills and repeated cues emit once per authored timestamp; three projectile flights contain actual atlas pixels; audio opt-in/selection cleanup/pause/reduced-motion/missing-atlas negatives/portrait/no horizontal overflow verified. Sixteen new WAVs fetched/decoded. Primary context zero console/page/network errors. Seeded legacy/AW2 bytes identical. Four HD sheets, world/FX/projectile contact sheets and all four mobile captures opened under ignored `.asset-work/aw2-004b/`; QA PNGs not committed.

NOT_RUN: actual five-unit combat/range/damage/healing/interrupts, leveling, boss/chest/cooking/mode results, authored world/followers, remaining seven sets/full ART-01, current full TCG/RPG suite, physical devices/FPS/offline/native durability, human audio listening and legal clearance. Prior full839-test capped-worker result remains at b3c526b; historical TCG heavy-parallel timeout sensitivity preserved in ledger. Full release/major engine integration regression still due. Save/schema/quest rules unchanged, their46 unit cases reverified.

Observed rejected/repair attempts: initial Lua battle crossed cell boundaries, initial FX had glow bleed; selected repair sheets passed measured bounds. Another battle attempt was rejected for boundary bleed. Early quick-preview RGB looked like a brown background; actual PNG alpha proved it transparent, corrected before selection. Mộc Non builder assertions exposed tight nonuniform gutters; fixed metadata/calibrated tolerance, without repainting source art. Failed attempts are not reported as PASS.

## Next smallest task and owner

BA/character/animation/tester/scretary in-session reviews complete for this reference scope; no independent human finished-art/license/device approval implied. **Next mechanic + BA/tester: scope AW2-007A pure five-unit combat rules and deterministic tests**, using approved kits, automatic basics/skills and manual ultimates, range/projectile/interrupt validation and capped passives. Five starter sets now support the combat path to the Lantern slice. Keep numerical tuning provisional and renderer outcomes untrusted. Then battle rendering/leveling and authenticated boss-result/save integration.

Animation/character still owe seven non-starter reference sets (`aw2-muoi`, `aw2-nhien`, `aw2-hai`, `aw2-lien`, `aw2-moc`, `aw2-bach`, `aw2-van`) and full character gates. D11 rates/pity await simulation + owner approval. AW2-008 loot/cooking, AW2-009 safe modes and AW2-010/011 slice/release gates remain open. Do not assume local feature commits have merged into the long-lived branch.
