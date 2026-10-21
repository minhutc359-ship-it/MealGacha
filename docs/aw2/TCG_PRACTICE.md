# TCG practice — development contract v1

Profile `aw2-tcg-practice-v1`, task [AW2-009B](tasks/AW2-009B.md). This is an isolated borrowed-deck practice, not the legacy TCG economy, final balance or a collectible-card release. Approved starter identities and reference portraits are reused through manifests; RPG kits and full-character completion are unchanged.

Run `pnpm dev`, open `/dev/aw2/world.html`, create/read an AW2 development save, then **Ghé nhanh TCG → Chơi TCG thử**. The street table `aw2-npc-ban-bai` offers the same practice through **Ghé bàn**. Select a card to summon/cast; Hơi sương and attacks require an enemy target. New units rest until the next own turn. **Chơi nước gợi ý** executes one legal move; **Kết thúc lượt** lets the actual opponent play. **Nhận thua** ends the current match; **Chơi ván mới** borrows a fresh shuffle after a terminal result.

| Card ID | Name | Cost / ATK / HP | Effect |
|---|---|---|---|
| `aw2-tcg-than` | Than | 2 / 1 / 6 | Guard: normal attacks must target an opposing guard while present |
| `aw2-tcg-lua` | Lửa Nhỏ | 2 / 3 / 2 | No additional effect |
| `aw2-tcg-lam` | Lam Lam | 2 / 1 / 3 | Summon: heal own leader2 |
| `aw2-tcg-moc-non` | Mộc Non | 3 / 2 / 4 | Summon: other allies +1 shield, capped3 |
| `aw2-tcg-suong` | Sương Lành | 3 / 2 / 3 | Summon:1 damage to each opposing unit |
| `aw2-tcg-warm-bowl` | Chén ấm | 1 / — / — | Heal own leader3; cannot cast at full HP |
| `aw2-tcg-gentle-mist` | Hơi sương | 2 / — / — |2 damage to a chosen enemy unit, bypassing guard |

Both sides borrow20 cards:3 of each unit,3 bowls,2 mists. Leader18HP; healing caps18. Board3, hand7; overflow is discarded publicly. Opening3 cards, plus a draw at each own-turn start; player starts. Energy refreshes and increases1→6 each own turn. One attack per ready unit; unit combat exchanges ATK simultaneously, shields absorb damage first, leaders do not retaliate. Empty-deck draws cause escalating fatigue1,2,3…; unresolved turn60 ends in a draw. Leader defeat, fatigue or explicit surrender supplies the real result.

Shuffle is deterministic per side and match seed; default20261021, rematch seed+1 modulo uint32. The seed is disclosed for reproducibility, not fairness or final balancing. The default all-recommendation sequence loses; the next seed wins by legal damage. The opponent and optional player coach inspect only their own hand and public board/health, with a bounded action loop. Hand/deck order of the other side is not used. Opponent draws hide identities; public discards are named. No network opponents, reactions, deck builder or collected cards.

`src/aw2/tcg/{catalog,types,rules}.ts` owns rules and outcomes; `session.ts` is a pure transient reducer. `dev/aw2/TcgPractice.tsx` only dispatches legal commands and displays public state. No timers/effects advance turns; reducer re-evaluation under StrictMode does not commit a duplicate move. Invalid/stale targets fail before spending resources. No result payload is accepted from the renderer or passed to the RPG reward layer.

Entering the lobby explicitly checkpoints exploration through `Aw2ModeAdapter`. Everything inside practice—including cast Chén ấm, rematch, win/loss and surrender—is transient and does not write any save, spend inventory or grant XP/items/currency. Return requires the exact checkpoint bytes and loads them read-only; another-tab/reset/corrupt/future data requires an explicit reread. Reload/reread abandons the match at current exploration data, with no resume or inferred reward. This task neither resets the owner's data nor adds a save-schema field.

Pure rules/session checks: `pnpm test dev/tests/aw2/tcg.test.ts`. Browser gameplay verifier owns source8458 / compiled8459 and closes it:

```sh
node dev/tools/verify-aw2-tcg.mjs --playwright <module> --chromium <executable>
pnpm build:aw2
node dev/tools/verify-aw2-tcg.mjs --compiled --playwright <module> --chromium <executable>
```

Fresh browser contexts only. Capture/JSON artifacts live in ignored `.asset-work/aw2-009b/`; tracked results are linked from [verification](evidence/AW2-009B.md). [AW2-009C](AUTO_CHESS_PRACTICE.md) now supplies borrowed Auto Chess practice through the same adapter; prizes/costs/persistent decks/production balance/device/art/rights gates remain separate.
