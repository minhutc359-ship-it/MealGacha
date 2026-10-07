# Original Living Table assets · v2.7

Mode: **generate**. All 13 images were created individually with the built-in `image_gen.imagegen` tool. They are original fictional game art. No internet photo, real person's likeness, reference asset, SVG placeholder or sprite atlas was used. Full prompts and optimized output paths: [`living-table-asset-prompts.json`](living-table-asset-prompts.json).

| Output paths | Purpose | Optimization |
|---|---|---|
| `public/assets/tcg/characters/hero.webp` | Vietnamese female protagonist with teal scarf and silver ladle | 512 px wide, WebP q81 |
| `public/assets/tcg/characters/{bach,nhien,moc,hai,lien}.webp` | Five named NPCs in dialogue, side quests and combat cut-ins | 512 px wide, WebP q81 |
| `public/assets/tcg/characters/{grandmother,mist}.webp` | Grandmother memory and mist-bound kitchen warden | 512 px wide, WebP q81 |
| `public/assets/tcg/boards/{home,street,tet}.webp` | Quiet central play surfaces; utensils/food remain at edges | 1280 px wide, WebP q81 |
| `public/assets/tcg/story/memory-flare.webp` | Protagonist summons a memory of wrapping bánh chưng with her grandmother | 1280 px wide, WebP q81 |
| `public/assets/tcg/fx/recipe-burst.webp` | Steam, leaf and rice-grain ring with transparent center/background | 512 px wide, WebP q81 with alpha |

Original PNGs were retained in the generation workspace; ffmpeg only resized/converted copies into the repository. Portraits and board assets ship as real WebP blobs, explicitly exempt from the repository's generic Git LFS rules. Paths are source files for the game and are included in the Git commit.

Presentation: home has ember motes, street has restrained rain streaks, Tết has petals. Recipe VFX recolor the original alpha ring for three recipes, animate concentric ripples, and show an actor cut-in. Backgrounds crossfade with opacity so the battle viewport does not gain transformed overflow. Existing original fire/water/shield assets and audio remain in use. All decorative animation respects both system reduced motion and the game's preference.
