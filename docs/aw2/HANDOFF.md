# Handoff — 2026-10-20 / AW2-004A Than reference assets

**Current branch:** `feat/aw2-004a-than-assets`. **Verified source:** `5d1df97da61bbefca1bdbe27f27f6c28ed3ed694`; following changes documentation only. **Base dependency:** AW2-006A handoff `944e4dff411c57ad903c7a7c332e91172cbf77f6`, world implementation `b3c526b`. Long-lived `game/adventure-world-2` remains `72ee9b4360299db4bab9b9b43dba552dd80b86cf`. No push, long-lived/master merge, release or owner save reset. Open-PR connector query returned zero results in this session.

Initial asset implementation `e11aefc` was followed by visual-review fix `5d1df97`: FX placement/layer/attachment now lives in the manifest, shield FX sits below the face and melee impact remains fixed at its contact point. Final tests/captures use 5d1df97.

## Completed this task

Than (`aw2-than`, Cơm tấm, N, Tank), variant base-v1 now has a reference asset pipeline: original character reference, four-direction chibi world sheet (16 cels), eight HD battle key poses with authored interpolated timing/contact/motion tracks, separate portrait, four unique skill FX tracks (16 cels) and four original synthesized WAV cues. Explicit frame rectangles/anchors account for actual nonuniform generated spacing; no repaint/mirror/resize of source art. Five selected PNG sources preserved and losslessly encoded as WebP (5,943,968 bytes total, including reference/portrait). Actual alpha/cell borders/source hashes are verified.

All image creation/repair used built-in image_gen (no API/CLI fallback, no external reference artwork). Seven exact prompt calls, internal input chain/hashes, five selected outputs and two rejected versions are in prompts/provenance. First battle sheet crossed cell boundaries; repaired with image_gen. First FX sheet was too dense/glowy; replaced through image_gen. Selected sheets have visible sprites inset and maximum observed cell-edge alpha 4/255 (tolerance 8/255). No failed sheet used by runtime. License REVIEW_REQUIRED / commercial release NOT_CLEARED; no human legal clearance claimed.

Canon identities/rarities/lore/rates unchanged. Owner already approved AW2-002/003 direction (D10/D13/D14/D15); that is not finished-art or license approval. ROSTER now resolves Than world/battle/portrait IDs from manifest; other 11 remain NOT_CREATED. fullCharacterComplete=false. HD method is eight key poses + interpolated tracks, not frame-by-frame animation. Renderer never awards damage/rewards. Passive preview is explicit/manual; future combat must provide shield-expired event. Than is melee, projectile=null. No procedural geometry replaces authored skill art.

## Paths / IDs

- `src/aw2/assets/types.ts`, `than.ts`, `animation.ts`, `than.base-v1.json`; `src/aw2/world/ids.ts` metadata binding.
- `dev/aw2/assets/than/base-v1/`: 5 source PNGs, 5 WebPs, 4 WAVs, `prompts.json`, `provenance.json`.
- `dev/aw2/AssetCanvas.tsx`, `than.tsx`, `than.html`, scoped styles; world page preview link.
- `dev/tests/aw2/assets.test.ts`; `dev/tools/build-aw2-than-assets.py`, `verify-aw2-than-files.py`, `verify-aw2-than-browser.mjs`.
- Root/AW2 README, STATUS/BACKLOG/HANDOFF/TEST_LEDGER/CHANGELOG, CANON implementation note, AW2-004A task/evidence JSON/Markdown.

Image IDs `aw2-than:{reference,world,battle,portrait,fx}:base-v1`; skill IDs `aw2-than:skill:{basic,auto,passive,ultimate}`; battle state IDs `aw2-than:battle:<state>:base-v1`. Audio/FX bindings and timings live in manifest. Original image paths are workspace-owned; no runtime reference points only to tool storage.

## Verified / remaining

PASS on source 5d1df97: 54 selective AW2 tests (3 files: 46 existing save/world cases + 8 asset/timing cases), source/output bytes/hash/alpha/cell-bound checks, four WAV PCM/non-silent/no-clipping/fade checks, root/dev typechecks, production build/release guard and 49-artifact production entry exclusion. Existing large-chunk warning remains. Development art/IDs/preview are excluded from stable production.

Chromium 153.0.8010.36, fresh isolated profile: 32 assertions PASS at 1280×1000 / 390×844. All eight HD states draw real atlas pixels; world advances all four directions; four distinct FX/audio cues, exact contact timestamps/one cue per play, pause/resume, reduced motion, portrait, missing-atlas error and unchanged legacy/AW2 byte snapshots. Four WAVs fetched and decoded, not human listening. HD/world/skill contact sheets and final peak FX/mobile captures opened; QA images remain local under `.asset-work/aw2-004a/`. [Evidence](evidence/AW2-004A.md), [ledger](TEST_LEDGER.md).

NOT_RUN: current full TCG/RPG suite, all-12 ART-01, actual five-unit combat/leveling, runtime range/damage integration, followers using this art, physical devices/FPS/offline/native durability, human audio listening and legal/rights approval. Prior full 839-test capped-worker result belongs to b3c526b, with its recorded legacy timeout sensitivity; do not claim a fresh full-suite result here. Save/schema/quest rules unchanged; their 46 unit cases reverified. Full release/major shared-engine integration regression remains due.

## Prior milestones retained

AW2-001 isolated save/reset and v1→v2 migration; AW2-002/003 story/12 identities approved; AW2-006A six debug zones, collisions/range/returns and first three quests/puzzle + one-time five starters. Those implementations remain in this branch. No real boss/chest/mode/gacha/economy adapter or post-boss ending/shortcut yet. World still shows debug objects/player; Than preview does not silently reinterpret the player or mark followers complete. All actual reward/win gates stay closed.

## Reviews / next smallest task

BA/character/animation/tester/scretary in-session role reviews complete for the reference pipeline; no independent human/owner final-art/license/device approval implied. Next animation + character: AW2-004B remaining four starter asset sets (aw2-lua, aw2-lam, aw2-moc-non, aw2-suong), with their own identity/art/FX/provenance, then seven others. Mechanic/tester: scope AW2-007 five-unit auto combat/manual ultimates, leveling/range/contact/projectile and authenticated boss-outcome persistence; use manifest cues without letting renderer own rules. Complete Than character DoD through actual combat/leveling/device/rights gates. D11 rates/pity still need simulation and owner approval before final adoption. Then finish dungeon rewards/cooking, safe mode adapters and AW2-010/011 gates. Do not assume feature commits are merged into the long-lived branch.

## Run / regenerate

`pnpm dev` → `/dev/aw2/than.html`; default localhost:8443, existing verification server localhost:8452. World `/dev/aw2/world.html` and save/reset `/dev/aw2/index.html` remain available. Preview has no save access; audio opt-in only, pause/reduced motion supported. `python3 dev/tools/build-aw2-than-assets.py` losslessly encodes existing PNGs, writes metadata and synthesizes audio (Python/Pillow versions in provenance). It does not generate/edit new artwork. For changed art use image_gen and a versioned variant; preserve source/prompts/provenance. File/browser checks and exact commands are in evidence.
