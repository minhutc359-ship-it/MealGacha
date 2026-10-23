# Adventure World 2 — Agent Operating Manual

> Scope: the long-lived `game/adventure-world-2` development branch. This is the **next-game incubator**, not a patch to released Soul of Meal. Stable `master` is not a merge target for game changes without owner approval.

## Branch and push policy — owner instruction 2026-10-21
- Continue AW2 development directly on `game/adventure-world-2`; do not create a new feature branch for each task.
- After each completed task, run appropriate checks, update the required documents, commit and automatically push `game/adventure-world-2` to `MealGacha`. Verify the remote SHA equals local HEAD before reporting success. No additional branch, PR or merge approval is needed for this authorized AW2 workflow.
- D18 sets a separate milestone integration target: only after demo100%/product45% gates are evidenced may the next `game/adventure-world-2` → `rpg` PR be opened. Ordinary work remains direct-to-AW2; do not create per-task feature branches or treat the target as already achieved.
- Inspect local/remote state before work; preserve concurrent commits and resolve divergence without rewriting remote history. Keep the task-card and evidence requirements below.
- This supersedes earlier feature-branch-only instructions. Master, releases, deployment and stable game saves retain their existing restrictions. Branch cleanup must preserve default/current/worktree branches, open-PR refs and commits not included in retained branches; see `docs/aw2/WORKFLOW.md`.

## Mandatory context bootstrap (every session)
1. Read `docs/aw2/README.md`, `docs/aw2/DECISIONS.md`, `docs/aw2/CANON.md`, `docs/aw2/STATUS.md`, `docs/aw2/BACKLOG.md`, and `docs/aw2/TEST_LEDGER.md` in that order.
2. Review current branch, changed files, relevant open PRs, and baseline Git SHA. Do not assume a previous assistant's "done" means merged or tested.
3. Follow `docs/aw2/WORKFLOW.md`. Select the owner skill(s) below, then read their `SKILL.md`. Each agent is a role with a persisted work contract, not an automatically running background agent.
4. Produce a scoped task card with ID, dependencies, acceptance criteria and test impact **before editing**. Reuse existing task cards when continuing.
5. On completion update `STATUS.md`, `BACKLOG.md`, `HANDOFF.md` and `TEST_LEDGER.md`; record verified commands/results, exact Git ref, remaining risks, and next owner. If docs disagree, block and resolve explicitly; never silently invent canon.

## Agent roster / ownership
| Requested skill | Owns | Must coordinate with |
|---|---|---|
| `ba-agent` | Requirements, acceptance criteria, dependency breakdown, tradeoffs | all |
| `story-agent` | Story canon, world map lore, NPCs, chapter and quest narrative | ba, character, mechanic |
| `character-agent` | Spirit roster, names, forms, combat identity, enemies, elites, bosses | story, animation, mechanic |
| `mechanic-agent` | Gacha, team combat, dungeon, economy, inventory, rewards, balance | ba, character, tester |
| `animation-agent` | Pixel/HD model specifications, motion, VFX, audio cues, asset manifests | character, mechanic, tester |
| `tester-agent` | Change-impact test plan, verified test ledger, periodic full regression | all owners |
| `scretary-agent` | Index, session handoffs, decisions, integration status, change history | all owners |

The user-requested spelling **`scretary-agent`** is intentional and is the skill directory name. Treat "secretary-agent" as a human-language alias only.

## Non-negotiable product rules
- New game: use its own content namespace and **development save namespace**. Reset of *new-game dev save* is allowed after explicit per-reset UX/QA; do not silently delete existing Soul of Meal stable save. After first production release, design versioned migrations and no destructive resets.
- Phase one: 12 fully authored spirits (expand to 16–20 when the first 12 pass gates); maintain one immutable `spiritId` per character, separate display name, recipe affiliation and art variants.
- Exactly five rarity tiers: `N / R / SR / SSR / UR`. Old `common / rare / epic / legendary` is legacy and **not** a drop-rate contract for the new game.
- Five-spirit auto combat + player-controlled ultimates; free-roam connected zones; pixel/chibi exploration + HD anime combat; TCG/Auto Chess embedded with direct quick-entry.
- Do not copy external games' protected art, models, music, UI, dialogue or characters. Store asset provenance and license status. Do not claim to have generated or visually tested assets without evidence.
- Game rules are separate from renderer; source canonical visual IDs and skills through manifests, no temporary geometry overwriting an authored skill. Don't mark a unit "complete" with portrait-only art.
- Never invent passing test results or imply a browser/device check occurred when it did not.
- Do not auto-merge, mass-delete game saves, change `master`, modify published gacha, or push a release without owner's explicit request.

## Minimal deliverables per task
- Requirements: task ID, reason, in/out-of-scope, acceptance criteria, risks and required agent sign-offs.
- Implementation: paths modified, canonical data IDs, key design decisions, checks executed and observed results.
- Test status: `NOT_RUN / PASS / FAIL / BLOCKED / STALE` plus environment, base/head SHA, impacted cases, residual full-suite obligation.
- Handoff: what changed, what is unverified, the next smallest task and owner.

## Task routing examples
- "Continue game": **scretary** rebuilds worklist, **ba** prioritizes, relevant specialist implements, **tester** verifies, **scretary** records.
- "New spirit": **story + character** approve identity, **mechanic** approves kit/rarity, **animation** provides authored asset spec, **tester** runs impact checks, **scretary** closes task.
- "New map": **story + ba** define arc/quest, **mechanic** owns interactions/combat hooks, **animation** map/entity visuals, **tester** validates navigation and persistence.
- "Gacha update": **mechanic + ba** approve rates/disclosure, **tester** verifies weighted draws/pity/spark and save rules, **scretary** records.

## Old source guidance
`dev/AGENTS.md` documents legacy/Figma app conventions. Read it only for touching old app files; this root file owns the AW2 process. Existing mainline code is a **reference**, not an implied requirement to preserve alpha/dev saves.
