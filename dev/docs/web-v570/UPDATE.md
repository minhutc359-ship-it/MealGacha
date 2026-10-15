# Web 5.7 — Advanced campaign / mobile battle improvements

**Branch:** `feat/web-v570-advanced-campaign`. Independent of PR #47 chest/banner refinements. Never merge automatically.

## Shipped

- Four new regions after the original four: Rừng Bếp Sương Lam (`mistwood`), Tháp Đường Phân Kỳ (`sugartower`), Hẻm Than Thiên Tinh (`ashalley`), Mâm Cơm Hồi Quy (`lasttable`), each with 6 stages, Vietnamese before/after dialogues, a finale and a story choice. Existing `RPG_STAGE_IDS` and ordering are unchanged at indexes 0–23.
- Four region-specific bosses and four elite identities. They reuse validated character atlas sprites and existing event banners to keep the static asset size unchanged; no original newly rendered boss sprite/video is claimed.
- Normal/Hard/Extreme configurable in campaign, with enemy base HP/attack/armor ×1/×3/×8 respectively. Extra energy drain / debuff reactions activate for harder elite/boss encounters.
- Separate hard/extreme progression `modeStars` (optional, keyed by mode and stage). Normal progression stays in `stars`; `run.difficulty` is optional and old snapshots still load.
- Position-based automatic targeting for awakened moves and default attacks, with manual focus still offered as tactical override.
- Scrollable 8-map navigation, touch-friendly difficulty controls, centered adaptive story dialog and responsive styles.

## Persistence contract

- Keep `version: 1`; do not clear/rename localStorage or keys in old saves.
- Do not change award history in `stars` when clearing Hard/Extreme; only the matching mode key advances.
- Avoid changing `MONSTERS` because Auto Chess has its own fixed 24-enemy roster. Advanced RPG monsters are resolvable in `MONSTER_MAP` but never join the regular Auto Chess pool.
- Stage N in Hard/Extreme unlocks after Stage N−1 **in the same mode**; the first stage of a region unlocks after completing the preceding normal-region boss. Existing normal locks are unchanged.

## QA

- `pnpm typecheck && pnpm typecheck:dev && pnpm test && pnpm validate:catalog`
- `pnpm validate:assets && pnpm release:verify && pnpm build && pnpm release:size`
- `dev/tests/game/adventureV570.test.ts` covers stage count, strength factors, mode progress, save reload, nearest targeting. `adventureRpg.test.ts` preserves the 24-stage legacy combat baseline.
- 2026-10-15 release-size review: the extra story regions and enemy mechanics add ~21 KB of JS gzip to the 650 KB baseline. Keep a reviewed 675 KB hard cap instead of removing the check (prior CI bundle approx. 671 KB gzip).
- Test on a real mobile viewport before merge, especially 8-map scroll and RPG dialog layout. Browser review was not available in this session.

## Future art / video work (not claimed complete)

New enemies use existing sprite atlas rows, and region banners use existing event assets. High-resolution replacement ultimates and uniquely drawn region / monster atlases are **not** included here and must be scoped as an independent asset production PR; do not overwrite current working videos or invalidate saves.
