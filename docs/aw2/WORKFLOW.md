# Seven-agent workflow
scretary → reads repo/ref and documents; BA → task card (scope, AC, test impact); story/character/mechanic/animation → deliver proposals + changes with reviews; tester → selective verification and milestone full suite; scretary → changelog/status/handoff.
Task states BACKLOG, READY, IN_PROGRESS, REVIEW, VERIFIED, MERGED/BLOCKED.
Every handoff: ID, base/head commit, exact paths, accepted decisions, tested vs not tested, failed/blockers, next owner.
Conflicts: immutable identity → character; lore → story; balance → mechanic; asset manifest → animation; QA claims → tester; requirement trade-off → BA/owner; indexing → scretary.
Per-feature branches based on long-lived AW2 branch. No auto merge/master writes. Stable legacy data untouched by pre-release AW2 reset.

Owner instruction 2026-10-20: after each completed task, verify, update the handoff, commit and push the feature branch automatically. This authorizes feature pushes without asking again; it does not authorize merges, master updates, deployment or releases. Verify the remote ref and record any push failure honestly.

Git Credential Manager has multiple cached GitHub accounts on this workspace. For this repository's existing owner login, command-scoped selection avoids an interactive account picker: `git -c credential.username=minhutc359-ship-it -c credential.interactive=false push -u MealGacha <feature-branch>`. This uses the cached login without changing global Git settings or printing credentials.
