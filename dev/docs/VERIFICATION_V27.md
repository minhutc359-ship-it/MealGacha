# Verification · MealGacha v2.7

User flow: select an owned deck → activate recipe combat / complete a boss objective → read a persisted midbattle cutscene → finish an NPC promise or weekly chain → receive rewards once → share an image or transfer the exact progress to another browser. Data lives in the local save; this change adds no API/backend.

## Automated checks

| Check | Result |
|---|---|
| `npm run typecheck` | Passed |
| `npm run test` | 123 tests / 13 files passed |
| `npm run build` | Passed; TCG JS about 149 kB / 45.6 kB gzip |
| `npm run validate:catalog` | 112 dishes, 35 tags, 9 events valid |
| `git diff --check` | Passed |
| New original artwork | 13 real WebP images, 1,132,646 bytes total; alpha ring is RGBA with 0–255 alpha |

New reducer/storage tests cover distinct recipe bonuses and frames, one activation per turn, invalid action preservation, lethal resolution, Guard/fire and rescue objectives, cutscene queue/reload/acknowledgement, owned 18-card suggestions, 6-deck limits, NPC unlock/one-time assistance/branch replay, deterministic Monday-week shuffles and saved mulligan RNG, three-leg scores/rewards/loss reset, encrypted compressed/raw transfer, corrupt/truncated/oversized codes, legacy migration and incompatible save states.

## Production-build browser checks

Headless Chromium tested the built app served by `scripts/serve-preview.py`. No page errors were recorded in passing runs. External font requests were blocked so checks did not depend on Google Fonts. These are local production-build checks, not a claim that every device/browser has been tested.

| Flow | Evidence |
|---|---|
| Battle viewport | 1440×900, 1366×768, 1280×720, 1024×768, 768×1024, 390×844, 375×667, 360×640, 320×568, 844×390, 667×375; 3 units on each side and 8 hand cards. Idle/selected/target states all inside screen; battle/arena scroll height equals client height. |
| Existing element effects | Fire, water, shield, heal, buff sprites animate from actual damage/board snapshots. |
| Recipe effects | All three recipes show distinct alpha-ring color, caster portrait and changed board; selected finisher predicts the combo. Actual bonuses/counters persist after replay. |
| Boss and scene | Objective and next intrinsic action are readable. Crossing half health opens a scene, pauses playback, survives reload and acknowledges without changing resources. |
| Companion | Turn 3 applies the promised benefit once and opens the NPC portrait dialogue. |
| Portable code | A live battle code restored in a separate browser context/origin; exact battle, bonds and resources match. A truncated code cannot enable restore or overwrite. Local backup returns to the previous save. Separate origins ensured isolated storage in the single-process test browser. |
| Deck workshop | Suggestion saves a legal owned 18-card deck; role filter, isolated four-card trial and detailed cards work. |
| NPC / weekly entry | Five portraits render, branch choice creates the expected five-card opening, and fixed weekly deck controls render. NPC choice text is full-width, with mechanics at 12 px. |
| Sharing | PNG decodes at 1080×1350; deck shows three actual food illustrations. Weekly result and postcard carry the accumulated score. Closing a settled weekly result does not duplicate awards/completions. |
| New pages | Home, decks, companions and settings have no horizontal document overflow at 320×568. |
| Existing illustrated story | All 18 scenes and archived dialogue load matching chapter art; read/back/skip do not grant resources. Locked chapters remain sealed; coach respects Guard/shield and only selects/focuses legal actions. |
| Audio regression | Gesture-gated startup; four tracks decode/loop; scene/battle transitions, nested controls/focus, independent volume/master mute, pause/resume, reduced-motion SFX, single victory/defeat cue, route cleanup and download-error retry all pass. |

Visual review inspected mobile battle, recipe bursts, midbattle memory art, NPC choices, companion hub and both deck/weekly postcards. Background crossfade uses opacity to preserve the fixed battle viewport. Text contrast in the dark weekly panel and mobile NPC branch layout were adjusted after review.

## Compatibility and practical limits

- Save key/version remain `foodchest.tcg.v1` / 1. Older fields migrate with defaults; new objectives apply to newly started battles. JSON backup remains available.
- Weekly scores are local. Save-code possession includes the key and therefore permits reading/recreating the save; no account ownership or anti-cheat guarantee is made.
- Web Crypto requires HTTPS/localhost. Compression Streams have a raw-code compatibility option. Clipboard/native sharing has visible copy/download fallback.
- Shared images contain game results/deck information; the progress code is kept separate.
- Vercel preview access follows the repository's existing deployment protection. Browser evidence above was collected from the local production build.
