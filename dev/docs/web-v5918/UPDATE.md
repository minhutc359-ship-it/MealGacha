# Web 5.9.18 — Một lời mời, bốn hành trình

The introductory manga explains Soul of Meal through An's first lesson with Bách. It is a separate, immediately readable book: four chapters and twelve complete, lettered portrait pages. The existing story manga and its saved ending/choice editions remain available with their existing unlock conditions.

| Chapter | Pages | What the reader learns |
| --- | --- | --- |
| Khi ký ức có hình hài | 3 | A meal carries memories; these form an Ấn Vị; a recipe card can call its Vị Linh. The real meal remains in its bowl. |
| Lá bài mở lối | 3 | TCG's 24-card deck, opening exchange, energy, four allies and one trap slot, summoning delay, Guard, targets and turn changes. |
| Trước tiếng gọi xuất trận | 3 | Auto Chess shop and reserve, three-copy star upgrades, XP/capacity, front/back roles, school/profession bonuses, automatic skills, willpower and retrying a lost wave. |
| Con đường có bạn đồng hành | 3 | Touch exploration, villagers and destinations, a five-person Adventure party, manual/AUTO ultimates, boss warnings, card collection thresholds and character growth. |

## Reading in the game

- TCG and Adventure: open Manga, then the highlighted introductory book. It is available even when every campaign chapter is locked.
- TCG, Auto Chess, Adventure and Chest guides: choose **Đọc manga giới thiệu · 4 chương** beside the existing autoplay introduction.
- The shared native dialog supports page selection, chapter selection, previous/next chapters, keyboard navigation, continuous reading, zoom and Escape to close.
- Each new page is one full image, including its panels and Vietnamese balloons. No SVG frame crop, CSS object-fit cover or positioned lettering is used for these pages. A large optional transcript is available through **Lời thoại**, with the same text available to assistive technology by default.
- The original images are retained. Runtime assets are full-image WebP conversions at quality 90, with unchanged dimensions. The book JSON is fetched on opening a chapter; page art is lazy loaded. Neither the shelf nor the guide button preloads the twelve pages.
- Failed chapter requests and failed image loads have retry controls. Focus returns to the opening button when available; closed guides and popovers fall back to the relevant main/guide control.

## Gameplay and story sources

- `src/game/narrative.ts` — Ấn Vị, recipe cards, the memory table and mist manifestations.
- `src/game/battle.ts` and the TCG guide — actual turn, summon, Guard and trap behavior.
- `src/game/autochess/economy.ts`, `combat.ts`, `willpower.ts` and the Auto guide — shop, merging, positioning, skills and retries.
- `src/domain/spiritSummons.ts` and the Adventure guide — 15/25/35/45 cards by rarity, party positions and energy/ultimate controls.

This is an introductory side story, with no Mai/Vân reveals, ending selection or campaign rewards. Opening, paging and closing use transient UI state, with no game actions or save migrations. Existing progress and collections are preserved.

## Artwork and maintenance

- Script and panel directions: `dev/content/intro-manga5918.json`.
- Complete runtime pages and chapter books: `public/assets/intro-manga5918/`.
- Built-in Imagegen prompts, original file hashes, reference paths and output hashes: `asset-provenance.json` beside this document.
- Conversion: `python dev/tools/pack-intro-manga5918.py --metadata-dir <generation-records>`.
- Asset/script check: `node dev/tools/validate-intro-manga5918.mjs`, also included in `pnpm validate:manga`.
- Browser verification: `dev/tools/verify-intro-manga5918.mjs`; screenshots and the verification report are under `evidence/`.

The transcript for origin page 2 follows the drawn reading order. Its remembered grandmother voices the first memory line; An's question is followed by Bách's definition of Ấn Vị. No plot fact changes.

## Verification

Final results and size measurements are recorded in `VALIDATION.md`. Automated browser checks use Chromium; physical-device review and merging the PR remain with the project owner.
