# No-issue orientation contract

An explicit Dynamic Implement invocation without an issue is a read-only orientation request. It answers: what has completed, what is active or blocked, and what sequence should happen next? It never starts that sequence.

## Load shared planning semantics

Locate and read the installed `wayfinder` skill completely. Search repository-local skill directories first (including `.agents/skills/wayfinder/SKILL.md`, then `.claude/skills/wayfinder/SKILL.md` and `.github/skills/wayfinder/SKILL.md` where applicable), before personal/global skill directories. Apply its map, destination, decision-ticket, native dependency, claim, fog-of-war, and frontier semantics. Do not run Wayfinder's chart-map or work-ticket mutation steps in this mode: never claim, assign, create, edit, comment on, close, or resolve a ticket.

Locate the repository instructions and configured tracker document, including its Wayfinding operations. If `wayfinder` or tracker configuration is missing, make zero mutations and report the exact installation or `setup-matt-pocock-skills` action required.

## Reconcile current truth

Use complete pagination and read-only queries. Prefer current evidence over stale plans. Inspect:

- the integration/release branches, worktrees, unmerged policy-compliant branches, open PRs, and dirty state;
- open feature/spec issues, their descendants, native blockers, claims/assignees, labels, and integration evidence;
- open and recently completed `wayfinder:map` issues at low resolution: destination, Decisions-so-far, Not-yet-specified fog, open children, blockers, claims, and frontier;
- recently integrated or closed units needed to explain what is already done;
- any persistent Dynamic Implement ledger for an interrupted root issue, without resuming or modifying it.

Do not treat a branch name, commit, stale ledger state, or closed worker ticket alone as integration. Reconcile Git, PR, tracker, tests, and policy-defined target evidence. Refer to Wayfinder maps and tickets by linked title, never a bare id.

## Propose the next flow

Build one concise dependency-safe proposal. Prioritize:

1. safely resumable interrupted implementation already tied to an active issue;
2. the first unclaimed, unblocked Wayfinder frontier decision when planning remains incomplete;
3. a specified, unblocked implementation issue whose dependencies are integrated;
4. the concrete unblocking action for blocked work.

Do not recommend two concurrent roots that overlap in files, schemas, APIs, migrations, or tracker ownership. Distinguish decision work from implementation: a Wayfinder ticket is resolved through Wayfinder, while a specified delivery issue may be passed to Dynamic Implement.

Return these sections in English:

```text
Current state
- completed/integrated evidence relevant to the next choice
- active work, maps, PRs, or resumable ledgers
- blockers, claims, and inconsistencies

Suggested plan
1. ordered next action with linked issue/map/ticket and rationale
2. dependency-safe follow-up

Start here
- exact explicit Wayfinder or Dynamic Implement command for the first action
```

Keep the plan small enough to choose from at a glance. State uncertainty and missing evidence instead of guessing. Do not create a Goal, branch, worktree, commit, issue, comment, assignment, label, PR, or setup/model session.

## Empty frontier

Treat the actionable frontier as empty only when there is no resumable root, no open Wayfinder map with a frontier or specifiable fog, no ready unblocked delivery issue, and no open PR/branch requiring policy action. Still report the relevant completed state.

Then end with this offer, adapted to the repository while preserving its meaning:

```text
No actionable work is currently queued. Would you like to shape a new feature together? Describe the problem or desired outcome, and we can use Wayfinder to name the destination and chart the first decision frontier before creating implementation work.
```

Do not chart the map or create the feature until the user supplies the idea and explicitly chooses to continue.
