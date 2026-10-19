# File thay đổi Web 5.9.17

| Nhóm | File |
|---|---|
| Runtime model/VFX | `src/game/characterVisuals.ts`, `src/game/starterVfx.ts`, `src/game/characterEffect.ts` |
| Compositor | `src/components/game/RpgBattleVfx.tsx`, `src/components/game/BattleVfxCanvas.tsx`, `src/components/autochess/AutoBoard.tsx`, `src/game/adventureRpg/rpg.css` |
| Atlas | `public/assets/characters/spirits5917/` |
| Sản xuất/QA | `dev/tools/pack-campaign598.py`, `dev/tools/verify-spirits5910.mjs`, `dev/tools/release-records.mjs` |
| Test | `dev/tests/game/spirits5917.test.ts`, `dev/tests/game/visualManifest591.test.ts`, `dev/tests/game/characterEffect5917.test.ts` |
| Hồ sơ | `dev/docs/web-v5917/` |

Compositor ưu tiên model, dùng atlas VFX thật khi có và fallback theo hệ khi chưa có; không còn vẽ silhouette tuyệt kỹ cỡ lớn đè lên sân.
