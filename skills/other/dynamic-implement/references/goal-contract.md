# Goal and persistence contract

The goal represents the completed issue outcome. A written plan, worker commit, opened PR, or completed wave is progress—not goal completion.

## Create the goal

After resolving the issue/spec, repository, Git policy, and integration target, bind the portable goal to the root issue and its existing child/dependency graph. Treat the configured issue tracker as the shared cross-harness goal backlog. Create the technical run record in the ledger and mirror both into the host's native persistent Goal/task mechanism when available. The objective must name:

- the issue/spec and repository;
- the policy-defined integration target;
- planning, all planned work units, clean-context review, integration, verification, and tracker updates as required outcomes.

Do not set a goal token budget unless the user explicitly requested one. Record root/child issue ids and any native goal identifier/status in the ledger. Never create a second competing goal for the same run; resume the existing root issue.

Claim the root issue on the tracker as the run's first write, before planning and before any Git or tracker mutation, following `concurrency.md`. Record the claim and its release condition in the ledger.

Use this portable goal shape:

```text
objective: complete issue/spec through the repository's integration policy
status: active | waiting-user | waiting-external | complete
plan: ordered units and integration/verification/tracker steps
completed: evidence-backed plan step identifiers
current: one next ready step
blocker: exact condition or none
nextAction: executable action or required external response
modelPolicy: issue start tier, calibrated start ladder index, current exact harness/model/effort per role, attempts, boundary probes, and escalations
```

Use three synchronized layers:

1. issue tracker: authoritative shared goal, approved work units, dependencies, and externally visible completion state;
2. run ledger: branches, worktrees, SHAs, attempts, models, raw verification/review evidence, blocker, and exact next action;
3. native Goal/task UI: optional harness-local mirror for continuation and visibility.

Do not create child issues or duplicate them in a native task list. Use the existing `ready-for-agent` graph. When decomposition is missing or invalid, request HITL and direct the human to the approved `to-tickets` workflow. Record `goalMechanism: issue-tracker+native+ledger` or `goalMechanism: issue-tracker+ledger`.

## Persist until the plan is executed

At the start of every continuation, fetch the root issue, descendants, dependencies, comments, and state; then reconcile the ledger with that tracker truth plus Git, tests, and PR/CI. Continue the next ready plan step without waiting for a status request while safe in-scope work remains.

After every state transition:

1. persist evidence and mark only actually completed plan steps;
2. recompute the dependency-safe frontier;
3. set exactly one current next action for the coordinator;
4. continue immediately when that action is safe and authorized;
5. mirror status/progress into the native Goal/task UI when present.

An agent or subagent returning early, null, timing out, or losing context is a recoverable failed attempt. Reconcile artifacts, start a suitable fresh replacement, and keep the goal active while retry capacity remains.

Do not yield a completion response or mark the goal complete until all are true:

- the planner contract is valid and every approved unit is accounted for;
- every descendant child carries `ready-for-agent`, appears exactly once in the coverage matrix, and retains its immutable ticket contract;
- every open descendant maps 1:1 to one unit, and every closed descendant has verified integration evidence;
- every unit is integrated into the policy-defined target in dependency order;
- targeted, full, and required acceptance checks pass on the combined result;
- the final independent Matt `code-review` and every acceptance-criteria row pass from a clean reviewer context;
- the PR/merge state required by repository policy is complete, not merely created, unless the user explicitly defined PR creation as the terminal outcome;
- issue comments, labels, links, and closure state reflect verified integration;
- every run-created worktree and branch is removed after verified integration, or the user explicitly chose to retain it; dirty, unmerged, or uncertain run-owned state is preserved safely but keeps the goal incomplete;
- applicable clean, non-diverged local long-lived targets are fast-forwarded to their remotes and all other branch divergence is reported without destructive synchronization;
- no requested acceptance criterion or planned unit remains open.
- no child ticket or HITL contract question remains unresolved.

A merge into `develop` or `main` is always human-gated. A ready PR targeting either branch with green checks/reviews transitions the goal to `waiting-user`; it is neither complete nor blocked. Broad authorization given before the PR and evidence existed does not satisfy the gate. Completion requires either the human to merge it or a new post-evidence human instruction authorizing the agent to merge that specific current PR/branch. Internal worker merges into the feature/integration branch do not trigger this gate. If the user explicitly defined PR creation—not integration—as the terminal outcome, complete that narrower goal without merging.

If a planner returns null, malformed, contradictory, or incomplete output, start a new fresh planner and try again. A failed planner attempt is not a finished planning phase and cannot end the run while retry capacity remains.

## Pauses, blockers, and completion

Honor an explicit user pause immediately after making current state safe and updating the ledger. A pause is neither goal completion nor a fabricated blocker.

When external input or authority is genuinely required, preserve state, ask precisely for it, and keep the goal incomplete. Use the host's blocked status only under its documented threshold; on Codex, do not mark blocked until the same blocker has persisted for the required consecutive goal turns.

At a `develop`/`main` merge gate, ask once with the PR URL/number, target, head SHA, checks, review identities/results, and unresolved risks. Keep status `waiting-user`; do not mark blocked merely because the human has not decided yet.

Mark the goal complete only after the completion audit above passes. Include final integration, test, review, acceptance-criteria, and tracker evidence in the final response.

The only legal reasons for the coordinator to stop before completion are an explicit user pause, required user/external input, unavailable authority/capability, or a safety boundary. In each case preserve state and report the exact resumption action. Ordinary turn boundaries, agent failures, an exhausted wave, or a finished plan document are not stop reasons.
