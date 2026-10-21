# Lam Lam — motion/projectile/healing inventory and full-character gates

AW2-004E · 2026-10-21 · `aw2-lam` / `base-v1` · N / healer / Phở. Approved D10/D13/D15 identity and four skill directions remain unchanged. **fullCharacterComplete=false**, license REVIEW_REQUIRED / commercial NOT_CLEARED. This is a reference-motion package; independent finished-character approval remains open.

Original12 image/audio files,16 four-way world cels and eight original reduced HD poses remain. Two unchanged generated PNGs/lossless WebPs add32 cels, four per state. Total72 rectangles:16 world +8 original HD +16 original skillFX +32 motion. Measured nonuniform source rectangles and visible-foot anchors; logical renderScale1.6/1.65 only, no source repaint/masking/mirroring/resizing. Portrait doubles as the original identity reference. Four built-in image_gen calls: two initial layouts rejected, two spacing repairs selected. Prompts, selected/rejected hashes, references and output paths are retained in asset provenance.

| State | Source / row | Cel starts (ms) | Duration / loop | Independent art gate |
|---|---|---|---|---|
| idle | motion-a-v2 /1 |0,300,600,900 |1200 /yes | Gesture/breath/braid continuity and loop seam |
| move | motion-a-v2 /2 |0,170,340,510 |680 /yes | Foot contact/sliding and sleeve/thermos continuity |
| attack | motion-a-v2 /3 |0,260,700,820 |1000 /no | Preparation/release/follow-through/recovery readability |
| cast | motion-a-v2 /4 |0,210,420,740 |1080 /no | Palms gather/offer warmth, contact consistency |
| hit | motion-b-v2 /1 |0,80,180,340 |520 /no | Recoil/recovery, face/limb continuity |
| guard | motion-b-v2 /2 |0,180,400,700 |1000 /yes | Thermos/brace silhouette and loop seam |
| ultimate | motion-b-v2 /3 |0,520,800,1040 |1700 /no | Two healing gestures, kneel/stand continuity and target readability |
| defeat | motion-b-v2 /4 |0,220,480,760 |1000 /no | Descent and exhausted final hold |

Four cels per state are sparse reference motion. Anatomy, identity consistency, changing standing/kneeling heights, contact/loop transitions and any further inbetweens require independent review. No portrait/proposal/test-count completion claim.

## Event ownership

Basic reference launches260/impacts700ms, separate flight `fx.basic.0/1` and impact `fx.basic.2/3`; ultimate reference cues520/1040ms. These remain authored preview timings, not approved engine speed/heal/damage values. Reference preview plays both healing cues and original audio. The rules engine remains unchanged and owns all hits, misses, healing, shields, interruption and terminal outcomes.

Actual Lam cast preparation/commit and projectile launch suppress impact/healing FX. A confirmed basic hit selects only impact art at the actual target. A confirmed heal selects one visual beat. Ultimate heals multiple allies in each of two rules ticks; bounded per-caster cast/tick bookkeeping groups recipient events across partial batches and interleaved overheal shields. Floating recipient outcomes remain separate. Independent per-source/slot confirmed-effect clocks retain simultaneous healing and ranged impacts across pose changes/unrelated ticks. Ultimate gestures take priority over lower source actions in that same tick; received reactions can interrupt the pose. First confirmed pulse cannot advance to the second gesture/FX; second event starts its own beat. No future pulse is scheduled by the renderer. Terminal before the second rules pulse grants no second effect. Received reactions do not inherit the source contact index. No renderer damage/reward/save authority.

## Full DoD ledger

| Gate | Implemented reference / development scope | Remaining owner/gate |
|---|---|---|
| Identity/story | Approved healer, Phở affiliation, care/accepting help direction | Character/story preserve canon |
| Four skills | Immutable `aw2-lam:skill:basic/auto/passive/ultimate`; ranged hit, injured-ally heal, capped overheal shield, two-pulse heal | Mechanic final numbers/level/resource/kit acceptance; no resurrection |
| Exploration |16 original four-direction cels, world party integration | Independent movement/readability/device QA |
| HD / portrait |32 new motion cels/eight clips, original reduced poses and portrait | Independent anatomy/identity/loop/contact/continuity acceptance |
| FX / projectile |16 original cels, separate flight/impact; event-bound basic and healing beats | Telegraph/recipient readability and full art acceptance |
| Audio | Four original synthesized WAVs, reference cue playback, existing opt-in cast/passive integration | Basic-hit/heal-pulse audio binding in actual combat remains incomplete; human listening/mix/device approval NOT_RUN |
| Integration / save | Shared source/compiled previews and actual world/battle; isolated development namespace | Production migrations/durability/native/offline/FPS/physical-device/full-release QA remains open |
| Provenance / rights | Built-in image_gen source/prompt/reference/hash audit, no external artwork inputs | Legal/rights NOT_RUN; commercial NOT_CLEARED |

Automated results and exact source are recorded in [AW2-004E evidence](evidence/AW2-004E.md). Next implementable owner: character/animation/mechanic/tester for [AW2-004F](tasks/AW2-004F.md) Mộc Non. Independent Lam/Than/Lửa Nhỏ approval and remaining seven sets/map/NPC/boss/full-product gates remain open.

Confirmed FX have finite lifetimes even with reduced motion: basic impact180ms, healing440ms, measured from each confirmed event's own presentation clock. Toggling reduced motion cannot revive expired effects. These are visual durations only, with no impact on rule ticks/heal counts or final balance. No frame/FX counter is treated as a device or human art gate.

Verified source `cf0b39469d1fb8f7d77e18feb5e16895d70565a1`, tree `a31058eb72be8b420cb6dbde32e8c008a6e2ac04`, base4def09f;1007 full tests/214 AW2 and471 fresh final browser checks PASS. Independent full-character acceptance remains open.
