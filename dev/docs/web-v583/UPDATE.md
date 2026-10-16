# Village RPG, shared combat art and tactical TCG identities

## Village

- The village fills a 3:2 frame. The whole illustration is visible, without blurred letterboxing. The village content scrolls on short screens.
- Lả, Chú Tâm, Bà Sen and Bách stand beside the four buildings. Selecting either the NPC or directory card routes the party along a small authored road graph; a conversation appears on arrival before entering the service.
- The leader has four facing directions and a four-frame walking cycle. Two companions follow the leader and respond to tapping or calling. Idle moments alternate feeding, playing and cheering; reduced motion stops the loops.
- Retargeting reads the displayed position before cancelling the previous animation. Using wall time could snap the party forward when a busy browser started WAAPI late. Paths are shortest routes along the road graph, not straight lines through buildings.

## Combat presentation

- Five starter identities (Cơm tấm, Bánh mì, Phở bò, Bánh cuốn, Xôi) share a new HD atlas between Adventure, Auto chess and TCG. Four illustrated poses per character: idle, windup, contact, cast. The source atlas is 1122 × 1402; source cells are about 280 × 280 rather than the old 100–128 px models.
- The other roster models retain their existing art. Active attack, cast, hit and walking poses no longer cross-fade into ghost silhouettes.
- A new 4 × 5 transparent effect atlas supplies slash, projectile, impact and cast art for all five schools. Both battle renderers use it. Actor-specific angles and existing motion profiles distinguish attacks. Existing role-based spell geometry, ultimate silhouettes and clear numeric feedback remain.
- All textures use the shared decoded-image lease cache; one shared presentation clock, no per-frame React updates. Light/reduced motion retains the existing simple fallback. Combat balance/timing is unchanged in Adventure and Auto chess.
- No video is re-encoded in this change; retain the high-resolution clips from PR #50.

## TCG design review

The old catalog assigned eleven unit engines by a hash. Many dishes therefore had the same trigger and payload. These ten cards now have explicit tactical roles, while keeping their established mana tiers and IDs. Stats pay for the additional utility; none gains Rush or Guard for free.

| Card | Mana | ATK/HP | Role and decision |
|---|---:|---:|---|
| Bún bò Huế | 4 | 3/5 | Removes the single largest enemy shield; no free damage. Save for a shield investment. |
| Bánh xèo | 2 | 1/3 | +2 combat damage against full-health units, never heroes. Attack order matters. |
| Chả rươi | 6 | 4/7 | +2 combat damage against wounded units, never heroes. Needs prior chip damage. |
| Chè bưởi | 6 | 3/7 | Heals another ally missing the most health by 4. Preserve a damaged carry. |
| Bún riêu | 1 | 1/2 | First different-school spell each turn gives another weakest ally +1 ATK and 1 shield. Fragile multischool engine. |
| Bánh chưng | 5 | 3/6 | Death gives the weakest surviving ally +1 ATK and 2 shield. Needs another survivor. |
| Cà phê trứng | 5 | 3/7 | Removes allied freeze, restores a turn only if ice caused the skipped attack. Does not refresh spent attackers. |
| Bánh tét | 3 | 2/4 | Draws two only if playing it empties the hand. Holding it competes with tempo. Fatigue still applies. |
| Xôi xéo | 3 | 2/3 | Refunds one mana after the second spell in the turn, once and capped at max mana. Sequence the body before that spell. |
| Chả cá Lã Vọng | 2 | 1/3 | Transfers up to two shields from a defending unit before simultaneous combat. Weak into an unshielded board. |

Existing eleven unit engines and named spells remain available. A new counterplay deck suggestion and updated card role labels expose the tools. Enemy valuation recognizes live shield/heal/thaw/empty-hand counters. The coach previews actual outcomes and considers a visible lethal threat before non-lethal face damage; it never reads a hidden trap or hand. Room protocol becomes 583 so a client with old card semantics cannot join this version.

## Asset provenance and prompts

- `public/assets/rpg/village583/{hero,la,merchant,grandmother}.webp`: the project's original four-direction atlases restored from `dev/archive/legacy-adventure-v490/assets/`. WebP compression only, preserving dimensions and transparency. Existing evidence: `dev/docs/web-v440/artwork.json` and `dev/docs/web-v441/artwork.json`.
- `public/assets/rpg/combat583/spirits.webp`: built-in image generation, reference `public/assets/rpg/spirit510/portraits-1.webp`. Prompt: original Soul of Meal battle sprite atlas, exactly 4 columns × 5 rows, transparent background. Rows: golden lion Cơm tấm; red fox Bánh mì; white jade dragon Phở bò; white/green rabbit Bánh cuốn; white/gold crane Xôi. Columns: idle, anticipation/windup, extended physical strike, spell cast. Face right, full body, matching scale and feet baseline, crisp painted chibi JRPG forms, no text, no background, no spell FX; maintain identity from supplied project portraits. Requested 2048 × 2560, actual 1122 × 1402, encoded to WebP quality 90 without upscaling.
- `public/assets/rpg/combat583/effects.webp`: built-in image generation, no external reference. Prompt: original transparent 4-column × 5-row combat effect atlas. Columns: diagonal melee slash, projectile head with trail extending left, radial contact impact, large spell burst. Rows: hearth gold/jade, ember red/fire, grove green/leaves, tide turquoise/water, sugar violet/moon. Crisp central painted shapes plus restrained outer glow, isolated cells, transparent margins, no text, no characters, no scenery. Requested 2048 × 2560, actual 1122 × 1402, WebP quality 90.

## Verification

See `browser-qa.json` for viewport/flow results and `dev/tools/verify-web583.mjs` for reproducible browser checks. Pure road routing, retarget interpolation, ten card mechanics, limits, AI ordering, coach threat handling, save round-trip and legal deck construction are covered by the automated suite. The existing 30 starter encounters / 20 complete seeded journey regression remains enabled without lowering its success threshold. Browser checks use Chromium emulation; no physical iPhone run is claimed.

Final results: 55 test files / 574 tests passed; production and dev typechecks passed; catalog and asset validation passed; clean production build and service-worker syntax check passed. Chromium completed 18 checks at 320×568, 390×844, 844×390 and 1440×900, including no-snap retargeting, conversation gating, reduced-motion village behavior, 20 unique nonblank HD poses, both battle renderers, map labels, bubble expiry, ultimate video ON/OFF, pause/skip and story entry. No page errors or missing assets.

The clean build uses 669,336 bytes of JS gzip and 103,263 bytes of CSS gzip. Total deployed size with the unchanged remote HD movies is 259,767,363 bytes / 672 files, within the existing 260 MB budget. The local checkout still contains the older video bytes; the committed size record retains PR #50's larger movie totals, and the asset register preserves all 139 remote movie hashes. The push updates only the changed files on the existing remote tree, so those clips are not replaced by local copies.
