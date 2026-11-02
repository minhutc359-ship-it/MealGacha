# Auto Chess practice — development contract v1

Profile `aw2-chess-practice-v1`, task [AW2-009C](tasks/AW2-009C.md). Borrowed-team practice through the AW2 adapter; separate from legacy Chess, RPG kits/economy and final mode design. Five approved starter identities and reference portraits come from canonical manifests. No new art/audio, full-character or production-balance claim.

`pnpm dev` → `/dev/aw2/world.html` → ready AW2 save → **Ghé nhanh Auto Chess → Chơi Auto Chess thử**. The Phố portal `aw2-npc-ban-co` offers the same practice through **Ghé bàn**. Buy from the shop, select a bench/deployed unit and a destination cell to place/swap; **Đưa về hàng chờ** and **Bán quân đã chọn** act on the selected piece. **Xếp đội gợi ý** arranges owned units only; it does not buy, award or force a win. All actions have ordinary keyboard buttons, no drag dependency.

| Canonical spirit ID | Name | Cost / HP / ATK / range | Every fourth tick while alive |
|---|---|---|---|
| `aw2-than` | Than |2 /36 /5 /1 | Self4 shield |
| `aw2-lua` | Lửa Nhỏ |2 /20 /9 /1 |+4 damage when attacking in range |
| `aw2-lam` | Lam Lam |2 /22 /4 /3 | Heal lowest-HP-ratio ally6 |
| `aw2-moc-non` | Mộc Non |3 /26 /5 /2 | Shield lowest-HP ally4 |
| `aw2-suong` | Sương Lành |3 /22 /7 /3 |2 damage to every enemy |

Each identity has9 copies in a finite borrowed pool. Three shop offers reserve copies; refresh costs1 practice gold, returns offers then draws equally from remaining copies using seeded uint32 LCG. No production gacha odds are adopted. Start10 gold, next round adds6 once. Lock retains exact offers across rounds and blocks refresh until unlocked. Purchases enter a6-slot bench. Three1-star copies merge into one2-star (+80% HP/+60% ATK, rounded), retaining a deployed copy's cell when available; a2-star holds3 copies, no3-star. A purchase can merge at a full bench, otherwise cap failure spends nothing. Selling restores full cost and corresponding copies. UID/position and pool+reserved+owned copies are conserved.

Formation has front cells0–2 and rear3–5. Deployment cap3/4/5/5/5 across rounds; clicking an occupied destination swaps both pieces. At least one unit required to start. Three distinct deployed starter IDs give everyone+1ATK; all five additionally+2HP; bench/duplicate bodies do not add diversity. Opponent formations use2/3/3/4/5 starters with round ATK bonuses0/0/1/1/2; previewed publicly, no shop peeking. Both sides use the same ability truth and diversity rules.

Combat uses a3-column ×4-row field. Player front/rear map to rows1/0, opponent front/rear2/3. At each tick, living units choose the nearest enemy by Manhattan distance/stable UID ties. In range they attack; otherwise move one unoccupied orthogonal cell strictly nearer the target. Movement tie priority alternates each tick. Attack/heal/shield intents use the same pre-tick snapshot. New shield caps12; healing caps maxHP before simultaneous damage, shield absorbs damage first. Units alive at tick start still act even if lethally hit during that tick. Eliminated side loses; simultaneous elimination or unresolved tick80 is a draw. This bounded prototype pathfinding/skill contract is not a full competitive Chess engine.

Five-round match, player12HP: round loss−3, draw−1. At0HP match defeat; surviving round5 completes practice successfully. Round outcomes settle once; **Vòng tiếp · nhận6 vàng** restores purchased units for the next battle, grants6 once and refreshes unless locked. Result/outcome payloads from UI are never accepted. Surrender is a separate loss; terminal-only rematch creates next seed (default20261021, +1 modulo uint32). Real tested recruitment wins all5 rounds at ticks5/5/4/5/9; a single weak legal unit loses4 rounds and reaches0HP. This is a reproducible development fixture, not an approved difficulty target.

Pure `src/aw2/chess/{catalog,types,rules,battle}.ts` owns planning, pool/gold, formation, auto-combat and results; pure session reducer rejects stale commands without changing game state. React displays actual actors/logs and issues commands.650ms playback can pause/step and clears its interval on unmount/terminal; it cannot award a round. Portraits are explicit reference presentation, not authored Chess animation/VFX. Missing portrait displays an error while gameplay remains usable.

Entering checkpoints exploration through `Aw2ModeAdapter`. All practice currency/roster/rounds/results are transient; no world save/schema/item/XP/currency/prize write or legacy services. Return loads the exact checkpoint read-only; changed/reset/corrupt/future data requires explicit reread, preserving the ongoing match on failed return. Reload/reread abandons the match with no inferred reward/resume. No owner data is reset. Collected rosters/equipment, rank/PvP, mode prizes/persistence, production balance and new art are out of scope.

```sh
pnpm test dev/tests/aw2/chess.test.ts
node dev/tools/verify-aw2-chess.mjs --playwright <module> --chromium <executable>
pnpm build:aw2
node dev/tools/verify-aw2-chess.mjs --compiled --playwright <module> --chromium <executable>
```

Verifier owns/closes source8460 or compiled8461, fresh browser contexts only; ignored captures/JSON `.asset-work/aw2-009c/`, tracked summaries in [evidence](evidence/AW2-009C.md). [TCG](TCG_PRACTICE.md), [delivery estimates](DELIVERY_PLAN.md), [REPORT](REPORT.md), [next gates](BACKLOG.md).
