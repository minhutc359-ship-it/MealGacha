# Seven-agent workflow
scretary → reads repo/ref and documents; BA → task card (scope, AC, test impact); story/character/mechanic/animation → deliver proposals + changes with reviews; tester → selective verification and milestone full suite; scretary → changelog/status/handoff.
Task states BACKLOG, READY, IN_PROGRESS, REVIEW, VERIFIED, MERGED/BLOCKED.
Every handoff: ID, base/head commit, exact paths, accepted decisions, tested vs not tested, failed/blockers, next owner.
Scretary also maintains the concise Vietnamese [REPORT.md](REPORT.md) after each task: verified progress, current work, test source/results, remaining limits and next owner. It links to the detailed live indexes; the role is not an autonomous background dashboard.
Conflicts: immutable identity → character; lore → story; balance → mechanic; asset manifest → animation; QA claims → tester; requirement trade-off → BA/owner; indexing → scretary.
## Current branch policy — owner instruction 2026-10-21

Develop AW2 directly on `game/adventure-world-2`. Do not create a new feature branch for ordinary continuation work. This standing owner instruction supersedes the earlier per-feature-branch default and AW2-012A's one-time-integration restriction; the historical records remain evidence of the policy at their dates.

At task start, inspect the worktree, current branch, remote AW2 head and relevant open PRs. Stay on the AW2 branch and preserve local/remote work. If the remote advanced, inspect and incorporate its commits without rewriting remote history before continuing; a rejected push is a reason to recheck state, not to force-update it.

After each completed task: execute the checks required by its change impact, update STATUS/BACKLOG/HANDOFF/TEST_LEDGER and other affected documents, commit on `game/adventure-world-2`, then push that exact branch automatically and compare remote SHA with local HEAD. No additional branch/PR/merge is required. A failed check or push must be recorded honestly. Master updates, unrelated feature integration, deployment and releases still require separate explicit authorization; stable legacy data remains untouched by AW2 development resets.

Git Credential Manager has multiple cached GitHub accounts on this workspace. Use command-scoped owner selection without changing global settings or printing credentials:

```sh
git -c credential.username=minhutc359-ship-it -c credential.interactive=false push MealGacha game/adventure-world-2:refs/heads/game/adventure-world-2
git -c credential.helper= ls-remote --heads https://github.com/minhutc359-ship-it/MealGacha refs/heads/game/adventure-world-2
```

## Branch cleanup — AW2-012B

The owner also explicitly requests deleting redundant local/remote branches in this cleanup. Refresh refs and inspect open PRs/worktrees first. A branch is eligible only when its exact head is an ancestor of retained remote AW2 or master and is neither default/current/worktree nor an open-PR head/base. Keep unmerged histories and record the reason. Delete explicit audited refs with expected-SHA guards, retain an inventory of original names/SHAs/reachable retained refs, then verify actual remote/local lists. This cleanup request does not authorize discarding unmerged work or closing PRs. See [task and audit](tasks/AW2-012B.md).
