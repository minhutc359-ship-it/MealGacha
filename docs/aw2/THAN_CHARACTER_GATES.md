# Than — measured character gates

AW2-004C · 2026-10-21 · `aw2-than` / `base-v1` · N / tank / Cơm tấm. Approved identity/kit remains D10/D13/D15 and AW2-003; no new lore or numerical balance approval. **fullCharacterComplete=false**. This is a reference motion/integration milestone, not a finished-character or release certificate.

## Actual motion inventory

Original `reference.png`, `world.png`, `battle.png`, `portrait.png`, `fx.png` are preserved unchanged. Original eight HD poses remain the explicit reduced-motion poses. Two new unchanged image_gen PNGs and lossless WebPs add32 genuinely different cels. Total72 manifest rectangles:16 world +8 original HD +16 FX +32 motion. Both motion sheets1254×1254; explicit measured rectangles, alpha-edge tolerance8/255, visible-foot anchors, logical renderScale1.6. No pixel repaint, alpha masking, resizing, mirroring or invented interpolation frames.

| State | New sheet / row | Frame starts (ms) | Duration / loop | Remaining art work |
|---|---|---|---|---|
| idle | motion-a-v2 /1 |0,300,600,900 |1200 /yes | Independent breathing/identity/loop seam review |
| move | motion-a-v2 /2 |0,170,340,510 |680 /yes | Foot sliding and passing-pose review; denser inbetweens if required |
| attack | motion-a-v2 /3 |0,120,240,420 |620 /no | Fist contact/readability review; contact stays240ms |
| cast | motion-a-v2 /4 |0,210,420,740 |1080 /no | Shield/hand continuity review; self-shield cue420ms |
| hit | motion-b-v2 /1 |0,80,180,340 |520 /no | Recoil/recovery continuity review |
| guard | motion-b-v2 /2 |0,180,400,700 |1000 /yes | Shield silhouette/loop seam; guard itself grants nothing |
| ultimate | motion-b-v2 /3 |0,280,560,960 |1320 /no | Protective silhouette/settle review; FX cue560ms |
| defeat | motion-b-v2 /4 |0,220,480,760 |1000 /no | Kneeling transition continuity; final frame holds |

Four-cel reference clips are an improvement over single-key-pose transforms, not a claim of polished dense frame-by-frame animation. State changes may interrupt a clip when actual received-hit/other events require it. Presentation time survives unrelated650ms core renders, stops when paused/hidden, and defeat does not restart with other units' actions. Canonical actor event ownership prevents recipients displaying another unit's skills. Authored FX placement/layer/contact timing remains manifest-driven; events/render markers never apply damage or rewards.

## Full DoD ledger

| Gate | Actual implementation | Remaining gate / owner |
|---|---|---|
| Lore/identity | Approved full Than identity and arc in003 | Character/story maintain canon; no invented new story |
| Four skill slots | `aw2-than:skill:basic/auto/passive/ultimate`; actual melee/self shield/bounded passive/protection in development core | Mechanic/character final numerical balance approval; modes remain explicitly borrowed practice rules |
| Leveling | Shared earnedXP projects level1–20 development stats | Final curve/resource/skill-level design and balance; development tuning is not owner final approval |
| Four-way world |16 authored source cels; actual party renderer | Independent movement/readability/physical-device review |
| Eight HD states |32 new cels +8 preserved static/reduced poses, explicit timelines | Independent art/anatomy/loop/contact review and any requested corrections/inbetweens |
| Portrait | Existing separate authored portrait | Independent finished-art review |
| Projectile/impact/ultimate | Melee basic intentionally has no projectile;16 authored distinct FX cels, canonical placements/cues | Independent skill/contact/mobile readability review; no fake projectile completion |
| Audio | Four original synthesized WAVs, source hashes/PCM and browser decode checks | Basic-hit audio binding in actual combat remains absent; human listening/mix/cue quality review, physical-device audio |
| World/battle QA | Source/compiled motion, shared renderer, earned world boss/quest/save regression recorded in004C evidence | Physical devices/performance/offline/native/full production obligations remain |
| Provenance/rights | Exact prompt/reference/output/source/runtime hashes; rejected candidates recorded, all creative edits through built-in image_gen | Rights/legal review NOT_RUN, commercial NOT_CLEARED |

## Work measurement and next owner

Four built-in image_gen calls produced two candidates and two layout repairs. Both initial candidates were rejected for insufficient cell gutters; no unsafe cutouts were shipped. Final32 motion cels pass actual alpha/bounds/hash inventory. This measures one scoped motion package; it does not measure an independently accepted complete character or a production art velocity. Local resource durations/decoded bytes in browser evidence are diagnostic observations, not a30/60FPS/device/cold-load/offline PASS.

Character/animation reviews the32 cels and loop/contact continuity; mechanic owns final kit/level balance; tester owns independent physical-device/listening/performance gates; rights owner clears distribution. While those gates stay explicit, [AW2-004D](tasks/AW2-004D.md) now verifies Lửa Nhỏ motion/confirmed contacts at cef55c0; the next implementable package is [AW2-004E](tasks/AW2-004E.md) Lam Lam motion/projectile/two-pulse presentation. Seven characters still have no assets; no remaining spirit borrows Than as a claimed completed set. The world boss's tinted Than reuse remains explicitly provisional.
