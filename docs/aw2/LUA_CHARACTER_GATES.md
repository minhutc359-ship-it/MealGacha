# Lửa Nhỏ — motion/contact inventory and full-character gates

AW2-004D · 2026-10-21 · `aw2-lua` / `base-v1` · N / striker / Bánh mì. Approved identity, four slots and direction remain D10/D13/D15; original story/kit in AW2-003. **fullCharacterComplete=false**, license REVIEW_REQUIRED / commercial NOT_CLEARED. This ledger measures a reference-motion package, not finished character acceptance.

Original12 image/audio files remain; portrait also serves as reference. Two unchanged generated PNGs/lossless WebPs add32 actual cels. Total72 rectangles:16 four-way world +8 original/reduced HD poses +16 skillFX +32 motion. Explicit calibrated source rectangles/visible-foot anchors; logical renderScale1.35 for motion-a-v1 and1.9 for motion-b-v2 correct different sheet packing without resizing source pixels. No mirroring/masking/repainting. Runtime source/prompt/hash inventory is in provenance.json/motion-prompts.json.

| State | Source / row | Cel starts (ms) | Duration / loop | Independent art gate |
|---|---|---|---|---|
| idle | motion-a-v1 /1 |0,300,600,900 |1200 /yes | Breath/gesture continuity and loop seam |
| move | motion-a-v1 /2 |0,170,340,510 |680 /yes | Foot sliding/passing poses, satchel/scarf continuity |
| attack | motion-a-v1 /3 |0,220,300,380; idle recovery560 |760 /no | Distinct first contact/retraction/second contact and recovery |
| cast | motion-a-v1 /4 |0,210,420,740 |1080 /no | Short-step/target-facing continuity |
| hit | motion-b-v2 /1 |0,80,180,340 |520 /no | Recoil/recovery/readability |
| guard | motion-b-v2 /2 |0,180,400,700 |1000 /yes | Guard silhouette/loop seam; not itself a passive proc |
| ultimate | motion-b-v2 /3 |0,280,560,960 |1320 /no | Anticipation/short dash/contact/settle, readable route telegraph remains review work |
| defeat | motion-b-v2 /4 |0,220,480,760 |1000 /no | Kneel transition/final hold |

Attack has four distinct new cels and a fifth timeline key returning to idle; an idle alias is not counted as a fifth new attack cel. Four-cel clips remain sparse reference animation requiring independent anatomy/identity/contact/loop review and any additional inbetweens. Original eight poses remain stable reduced-motion frames. No full-character completion from an approved proposal or a portrait.

## Contact authority

Asset preview plays both authored contacts220/380ms and both FX/audio cues. Preview markers grant no damage or rewards. Development rules still own two actual hits at separate consecutive rules ticks;650ms browser tick speed does not make the reference ms authoritative. No numerical rules/skill IDs/save change.

Actual combat selects each contact from a confirmed Lua basic-hit event. The first event cannot display the second punch or replay both FX tracks; the second confirmed event starts only its own contact/recovery. Miss/changed target/later combos reset bounded presentation bookkeeping. If the first hit ends combat, no second event/FX is invented. Received hits/guard/defeat still interrupt or hold according to actual presentation events. Renderer has no damage, hit or reward authority. Two-hit rules and confirmed-presentation tests cover partial/repeated event batches and terminal cancellation.

## Full DoD ledger

| Gate | Current implementation | Remaining owner/gate |
|---|---|---|
| Lore/identity | Approved breakfast courier identity and personal arc | Character/story preserve canon; no new narrative approval |
| Basic/auto/passive/ultimate | Immutable `aw2-lua:skill:basic/auto/passive/ultimate`; actual development two hits/short step/bounded focus/dash line | Mechanic final numerical/kit balance; no approved invulnerability/teleport/projectile |
| Leveling | Shared earnedXP projects development level1–20 | Final curve/resource/skill-level balance and review |
| Four-way exploration |16 original authored cels, actual world party use | Independent movement/readability/device QA |
| Eight HD states |32 new cels, original eight reduced poses, authored timing/contacts | Independent anatomy/identity/loop/contact acceptance; denser inbetweens as needed |
| Portrait | Original distinct portrait/reference | Independent finished-art acceptance |
| FX/projectile/ultimate |16 original authored FX cels; melee intentionally no projectile; event-bound confirmed basic beats | Ultimate telegraph/path clarity/contact/mobile art review; not a completed authored boss/mode-art set |
| Audio | Four original synthesized WAVs; complete reference two-cue playback and opt-in confirmed-event audio integration | Basic-hit audio binding remains absent in actual combat (existing event audio handles cast/passive); human listening/mix/device review, decoded PCM is not listening approval |
| Actual integration | Shared source/compiled previews/battle/earned-world journey, locked-save boundary unchanged; evidence in004D | Physical-device/native/offline/FPS/full production suite remains open |
| Provenance/rights | Three built-in image_gen calls, one rejected unsafe layout/repair, selected original sources/prompts/hashes; no external artwork inputs | Legal/rights approval NOT_RUN, commercial NOT_CLEARED |

Builder now uses explicit immutable reference timelines and unit-owned metadata, rather than inheriting Than's mutable motion manifest. Rebuilding other starter manifests/assets preserves their bytes; scoped rebuilds are reproducible. This is a measured implementation/QA result, not independent art clearance or a complete-character production velocity.

Next implementable owner: character/animation/mechanic/tester scopes Lam Lam's motion and two-pulse presentation in AW2-004E; independent Lửa Nhỏ/Than reviews remain explicit. Seven missing sets, map/NPC/boss own art, final balance, independent playtest/device/listening/rights/production save/release gates remain open. All five fullCharacterComplete=false.


Verified source `cef55c00f8c4cf646a9d8952f6cbe02865b0225c`, base90e1f8c, treeff547302b1e45a3d8bfee602be162f6d7ff5f6ac.996 full tests /203 AW2 and385 fresh source/compiled browser assertions PASS; [commands, failures and limits](evidence/AW2-004D.md). Independent full-character acceptance remains open.
