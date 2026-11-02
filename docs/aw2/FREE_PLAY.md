# Free web progression — AW2-019B

Implemented profile `aw2-free-summon-v1` + `aw2-free-tables-v1`. This is the free local web scope authorized by the owner's one-commit completion request. It does not approve paid gacha, a final numerical balance, a store release or legal clearance. Original chest/save/rates stay separate.

## Player loop

Complete a quest or win a new table stage → explicitly save the result → **Đội → Triệu hồi → Nhận vé** → draw1 or10 → inspect the committed latest batch → select an obtained spirit in the actual saved five-member team. Four quest receipts and three first-win stages in each of two tables give10 tickets each,100 total. No render, load, migration, preview, loss or repeat win grants tickets. Story invitations still unlock all12 without random luck, including Vân.

| Tier | Base chance | Canonical pool | Duplicate keepsake |
|---|---:|---|---:|
| N |55%|Than, Lửa Nhỏ, Lam Lam|1|
| R |30%|Mộc Non, Sương Lành, Muối Đen|3|
| SR |11%|Nhiên, Hải, Liên|8|
| SSR |3.5%|Mộc, Bách|20|
| UR |0.5%|Vân|50|

Each identity is equally likely within its tier. SR+/SSR+/UR hard caps are10/80/200, reset by a qualifying result; UR floor takes precedence over SSR then SR. When a floor applies, weights are renormalized over eligible tiers. Runtime and QA simulator share pure rules, while production never imports the seeded population simulator. Browser cryptographic samples are consumed inside the exact-raw write lock, twice per draw. A batch is one save revision/main write, with journal/read-back. Invalid samples and stale reads cannot consume persisted tickets.

There are100 earned tickets in this finite version, so the200-draw guarantee does not imply an obtainable guaranteed random UR from current supply. This limitation is disclosed in UI and policy. Duplicate fragments are collection keepsakes only; they confer no combat stats, exchange entitlement, currency value or future redemption promise. No payment, banner expiry, purchase, player trading, reward outside the game or random story gate.

## Tables

Three stages per mode use deterministic distinct shuffles/shop seeds and the existing real borrowed-deck/borrowed-army engines. “Stage” does not promise escalating final balance. UI receives cloned snapshots and command dispatch, not mutable match objects. A WeakMap binds each result capability to the issued engine/checkpoint/stage. Forged snapshots, unfinished games, stale raw strings, stage skipping, duplicate settlement and rematch on a settled engine are rejected. Only a successful durable write consumes the result; failure before main commit permits an authentic retry.

**Lưu kết quả** persists played/wins/draws/best stage/last outcome. A win opens a claimable milestone; it does not silently credit tickets. Loss/draw can be saved without a first-win grant. Return after save reuses the updated raw checkpoint. Return/reload before save discards the ephemeral match; mid-match resume is not part of this version. After stage3, the table remains playable without farming new first-win rewards. Local JSON/backups are user-controlled; this is not a server anti-cheat or a financial ledger.

## Save and UI

Schema9 adds strict `modes`/`summons` fields. Versions1–8 retain their exact historical validators and raw bytes; read-only normalization initializes empty new state, no tickets/characters/rewards. Explicit writes upgrade in the same namespace. Version10+ remains unsupported/protected. New ownership is an explicit extra input to current team validation; old collection validators do not gain access to future summoned members. Backup/restore keeps the new committed fields through the existing confirmation, size, hash and lock path.

Character journal covers12 IDs with each unit's actual manifest skill names, behavioral descriptions, current level stats and original ultimate illustration loaded only when viewed. Viewing does not write a save. Main production still opens AW2 at`/` and retains only original`/chest`.

`dev/aw2/free-play.html` is an isolated QA entry using an in-page memory store and actual commands, including a first quest and optional reward-free boss render lab. It never reads localStorage or disables production Web Locks; production module-graph checks reject this entry. Managed HTTP preview cannot prove real HTTPS storage, device performance or human acceptance.

## Release boundary

Both free profiles and the versioned balance snapshot are engineering implementations for review. D11's historical proposal label is preserved; final rates/independent balance acceptance remains open. Technical tests/source hashes are separate from legal rights, human art/audio/content review, real-device UAT/performance, correct server branch/settings and explicit release authorization. See[AW2-019B evidence](evidence/AW2-019B.md).
