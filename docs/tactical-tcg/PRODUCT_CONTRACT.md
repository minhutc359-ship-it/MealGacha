# Product contract · TCG-011/012

Current production contract, 05/11/2026. This supersedes the scaled combat/front–rear rules in TCG-005…010 evidence, which remains historical. Delivery branch: `game/tactical-tcg`; no master merge or deployment.

## Surfaces and ownership

Root is the TCG lobby. Production includes collection, deck editor, packs, campaign, Manga, Chest and legal pages. Every production match uses the equipped owned 24-card deck: at most two copies per ID and at least eight units. The player starts with an empty field, four cards and three Lửa Bếp. Three introductory recipes remain additive exact-once grants; seven advanced recipes require owned/crafted cards. No economic reset or published gacha-rate change.

`/?tab=bots` is free local bot opposition, also reached by old PvP links. It is not networked human PvP: no ranking, entry fee, PvE rewards or server matchmaking. Choose Normal/Hard/Extreme and one of ten opponent deck recipes. Both sides start with three mana and follow the same card costs, legal targets, hand/field limits and draw rules. Normal chooses seeded legal actions; Hard evaluates the current public board; Extreme adds one public basic-attack reply lookahead. Neither reads unseen player hand identities or unrevealed trap identity. A new duel gets a unique match ID; a saved duel resumes its recorded deck, difficulty and action ledger.

## Combat rules

- Production opts into additive `cardGame.rulesVersion = 3`; directed turn protocol remains version2. Old checkpoints convert once without deleting cards, receipts, currency, deck, hand, attacks or a pending trap decision. Damage/HP/shields convert to the new scale, preserving unit HP ratio. Original IDs and eight story unlock IDs remain unchanged. Legacy auto/dev fixtures keep their prior rules.
- Original small catalog ATK/HP values are used: ATK3 causes3 damage before shields/bonuses to either unit or commander. Commander max HP is30. No divide-by-ten rule remains in production.
- Two opposing card rows, maximum five living units per side. Internal4×2 coordinates exist only to read old saves. Placement uses the first free cell; there are no positional attack advantages or front/rear controls.
- Any living **Hộ vệ**, anywhere in saved coordinates, gates attacks: attack a Guardian first. With no Guardian, units may attack the commander directly or choose any enemy unit. Targeted damaging spells may bypass Guardians.
- Each unit attacks normally once per round. A normal unit attack exchanges damage simultaneously, including a killed defender's counter. A stunned defender cannot counter. Tiên thủ prevents a counter only when its initial strike kills; Xuyên phá sends damage exceeding target HP+shield into the commander. Tái sinh heals1HP at round end while alive. Hộ pháp absorbs the first damaging/control spell or trap aimed at that unit, then disappears.
- New summons wait until the next round, except Xung kích. Play a second copy onto the matching1-star unit for a paid2-star upgrade (+40% ATK/maxHP, preserving missing HP). No third owned copy is required.
- At100 Hương lực, select an ultimate and target. Ultimates do not receive a counter. Playing cards, attacks and ultimates may be interleaved in the player's turn. End turn lets the bot act stepwise; after its turn, draw, refill/increase mana up to10 and add20energy. Empty-deck fatigue and Lửa Lớn from round8 prevent indefinite stalls.
- Three living schools grant +1 attack; four living units of one school grant +2 instead. Two consecutive same-school cards in a round grant1team shield once. Each unit holds at most3shield. Shield absorbs damage before HP.
- Twenty-two existing unit abilities use the small scale. Choice spells expose two actual reducer choices with one shared card/mana cost; damage, sweep, healing, draw, buff, ward, revive, reveal, disarm and cleanse match card text. Revive does not replay entry effects or grant an immediate attack; cleanse also removes burn without refunding attacks.

## Eight native traps

One face-down slot per side, beside its commander at the left. Pay a drawn trap's cost; a replacement discards the previous one. Enemy identity stays hidden until reveal/activation. Reveal preserves the trap; disarm removes it. A valid player reaction persists until Activate/Hold, including across reload; it has no timeout. Enemy traps activate automatically.

| Trap | Production effect |
| --- | --- |
| Nắp Nồi | Block the complete commander attack; attacker still spends its action/energy. |
| Gương | Block attack, reflect attacker ATK to enemy commander, capped3. |
| Than Hồng | Before attack, damage2 and burn1×2 on unspent enemy attackers; killing the source cancels the strike. No stacking. |
| Dây Lá | After enemy summon costing3+, damage2 and control through the following round; Hộ pháp blocks both. |
| Phong Ấn | Cancel enemy spell costing2+; consume card/mana without spell passives/recipe. |
| Mâm Khiên | Before an attack on an ally, all allies gain2shield, capped3, then resolve attack. |
| Hồi Ức | After an attack kills an allied cost≤4 unit, restore that actual casualty at up to2HP without entry effects or fresh attack. |
| Kho Lương | After enemy summon costing4+, heal commander3 and draw2; overflow hand cards go to discard. |

All burn/death/discard/reward/action effects are idempotent. Checkpoint validation checks versioned burn, stats, choices, pending source/target and replay ledger. Migrated pending attacks may finish their original valid target even if Guardian rules changed.

## Journey and rewards

Four regions contain six nodes each: **24 reachable nodes,23 battles including12 boss encounters, one original story-choice node,16 optional quest objectives**. Eight original story IDs, two endings, Manga links and first-win rewards remain. Optional routes branch from the original path and never gate its ending. Existing owned art illustrates eight new named boss identities with distinct telegraphed round powers, not eight newly rendered models.

Bosses are Guardians and change phase at66%/33%HP, gaining shield/attack/energy. They wait their initial summon round. Win a boss encounter by defeating the named boss **or** reducing its commander to0HP. Other battles require commander defeat. New powers are ward, drain, burn, sweep, freeze, extra draw and regeneration; the story, rules dialog, board tooltip and idle hint disclose their intent.

Every optional route has before/after scenes, a reward card and an extra20TinhVị challenge: surviving HP, summons, spells, traps, actual commander healing, living-school variety, speed or defeated enemies. Claim reads the saved winning checkpoint and its actual counters, then writes `quest:v1:<node>` once. A missed objective may be replayed; winning the story never requires all optional objectives. PvP/bot matches cannot claim these rewards.

## Art, presentation and audio

139 immutable unit IDs have unique Vietnamese display names matching owned splash identities; old dish names remain searchable recipe/lore aliases. Collection, deck editor, opening cards and battlefield share these names and small-scale rules. Existing own portrait resolver/assets are retained; unit visuals do not use food photographs. Spell/trap art remains skill art.

The table has a left commander/trap rail, two five-card rows, proportional cards, hand pagination on compact screens, selected-card reading/choices, target forecasts, role/status labels and a large end-turn action. Narrow portrait phones default to a rotated landscape table and can toggle portrait. Modal dialogs rotate and center with it. The outer lobby regains ordinary orientation when leaving battle.

The existing VFX canvas and authoritative hit metadata drive placement, flip, attack/projectile, ultimate, shield, heal, death, burn/control and combo effects. Forecasts use the same pure damage resolver; hidden traps may alter the announced outcome. Actual HP/shield numbers wait for contact. Saves commit before effects; reduced motion removes animated waits. Renderer effects never cause gameplay damage. Rotation adjusts projectile anchors into local board coordinates.

Original inline drum/lotus/rice ornaments and Vietnamese village/wharf/pottery/lantern hospitality stories supply cultural hints. No Chinese UI glyphs or copied external game art/audio are introduced. Runeterra informs readable deck/keyword interactions, not a copied screen or ruleset.

Original music580 tracks are packaged for lobby, regions, boss pressure and the soundtrack room. Existing mixer owns gesture unlock, gain/mute controls, priority, visibility/unmount cleanup and SFX limits. Combat cues schedule around the authoritative contact point; no claimed new voice recordings or composed soundtrack. Commercial rights clearance remains the pre-existing separate release gate.

## Boundaries

Offline/local account and save constraints remain. Deterministic legal-game simulations and browser viewport checks provide implementation evidence, not human win-rate balance, physical-phone/touch/FPS certification or listening-quality review. No online human PvP or free-roam overworld expansion is claimed: this delivery expands the TCG journey map requested in the active TCG scope.
