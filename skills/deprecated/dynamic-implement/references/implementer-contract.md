# Implementer contract

Give the implementer only one work unit and the authoritative context needed for it:

- full issue body and comments;
- relevant parent spec and acceptance criteria;
- agreed test seams;
- domain/ADR pointers;
- pinned base SHA — **re-pinned per wave**, not the run's original base. Once an earlier wave merges into
  the integration branch, later units are cut from that merged head so they build on real dependency code
  instead of a stale tree. Every artifact keyed to the base moves with it: worktree creation, the
  implementer preflight, and the review packet's fixed point. A review packet still carrying the run's
  first base reviews the wrong range.
- assigned branch and worktree;
- shared interfaces produced by completed dependencies, plus a short note on **what those merged
  dependencies actually added** — the named helpers, types, and guarantees this unit should extend rather
  than rebuild. Without it an implementer writes a second classifier, a second fallback chain, or a third
  vocabulary for a concept its own base already defines.
- anything an earlier unit created that this unit's scope also nominally covers. Vertical slices overlap at
  the edges — an ADR, a schema decision, a shared helper — and the later unit must be told the artifact
  exists so it amends rather than duplicates it. These are invisible in the issue text; carry them in the
  ledger as they are discovered.
- its private agent-log directory, run/agent identifiers, and the event command from `observability.md`.
- its exact verified harness, model, native reasoning-effort value, zero-based ladder index, and attempt purpose (`delivery`, `boundary-probe`, or `recovery`).

The child ticket is an immutable contract. Copy it verbatim into the dispatch packet. Never edit or reinterpret its title, body, acceptance criteria, scope, dependency edges, or `ready-for-agent` label. Tracker lifecycle comments, evidence links, and closure belong to the coordinator after reviewed integration; they do not authorize contract changes.

For the first attempt, stop there. For an escalation or recovery replacement, add a compact artifact handoff containing only inspectable facts: current SHAs and dirty/clean state, failing commands/output paths, raw review reports, acceptance rows, prior attempt commits/diffs, cited coordinator scope decisions, and the exact prior harness/model/effort/ladder-index attempt facts. This is durable learning between attempts. Exclude the prior conversation, hidden reasoning, transcripts, unsupported summaries, and reviewer-targeting hints.

Launching the agent — stream redirection, prompt-file resolution, build pre-warming, and the
one-shot rule every worker must be told — is in `dispatch.md`. Read it before the first dispatch.

**When a worker abandons finished work, rescue the commit instead of respawning.** A worker that ends
its turn mid-verification (see `dispatch.md`) usually leaves a good diff behind. The coordinator does not need a fresh recovery implementer when the work is actually finished:
read the abandoned diff, confirm it addresses each requested item, **run the full gate independently**,
and if it is green, commit it directly with a message stating that the coordinator committed it and why.
A replacement agent re-derives work that is already done and can regress it. Spawn one only when the
diff is genuinely incomplete, the gate fails, or the required review axes never ran — and in that case
hand over the dirty worktree rather than discarding it. Whatever route is taken, the independent
clean-context review still runs afterwards; rescuing a commit never substitutes for it.

**Any value keyed to the base must be re-supplied when the base moves, never templated as a constant.**
That includes the base SHA, the review packet's fixed point, and the baseline test counts. A hardcoded
baseline is read by the implementer as a target: it will hunt for tests that never existed at its base,
or accept a silent drop because the stale number happens to match. Parameterise these and pass the
values measured on the actual pinned base. The same rule governs any tooling that reports the gate — a
gate result belongs to one head, so a script that stores it as a constant will describe an older tree
with total confidence.

Instruct it to:

1. Confirm it is in the assigned clean worktree and branch, matching the assigned name exactly — including the run token — because a sibling run may hold a near-identical name for the same issue. Stop instead of writing anywhere else.
2. Read the installed `implement` skill completely and invoke it for this unit using the host's native skill syntax.
3. Read any skills `implement` requires, including `tdd` and `code-review`.
4. Explore current code and tests; do not assume the planner's anticipated paths are exhaustive.
5. Implement only the assigned unit through agreed public seams.
6. Run focused checks regularly and the full project suite at the end.
7. Complete both Standards and Spec review axes through the installed Matt Pocock `code-review` skill, fix actionable findings, and repeat affected review.
8. Commit the reviewed result on the assigned worker branch with an English, project-conformant message.
9. Return evidence: commit SHA, changed-file summary, commands/results, review findings/fixes, and any remaining blocker.
10. Log `started`, every meaningful command/check batch, each coherent file-change summary, every test/review result, and terminal `completed` or `blocked`. Every schema-v2 event records the assigned model and effort together; use the exact native value, or `unknown`/`unsupported` only as defined by setup. Log concise decisions and evidence, never private reasoning or transcripts. Before invoking Matt's `code-review`, create an empty standalone log bundle for its review coordinator and Standards/Spec child agents, append the logging instruction to their required prompts without changing Matt's reports, and import those logs only after that review process exits.

If the ticket cannot be followed exactly because it is ambiguous, contradictory, infeasible on the pinned base, missing a required decision or seam, or demands an out-of-scope change, stop the slice. Return `blocked` with cited ticket text, repository evidence, the exact conflict, and the smallest human decision needed. Do not choose an interpretation, edit the ticket, or implement a substitute. The coordinator may continue unrelated ready slices but must hold feature-PR readiness for this HITL response.

Forbid it from merging, pushing, opening/closing issues or PRs, changing the plan, or editing outside scope. A discovered dependency or spec ambiguity returns to the planner/orchestrator.

Forbid it specifically from **resolving a contract it finds inconvenient by narrowing the product to match its implementation**. Where a documented affordance is awkward to support, the move is to report the conflict, not to delete the affordance from the help text, footer, or docs so the interface agrees with the code — and above all not to add a test asserting that the documented behaviour does not occur. That converts an open question into settled-looking green evidence, and the next reviewer sees a passing test rather than a gap. Reporting a contract conflict is always in scope; editing the contract never is.

Treat these results as failures, not completion:

- no commit or an empty commit;
- dirty worktree after the claimed commit;
- skipped full suite without a documented external reason;
- self-review substituted for the required review workflow;
- unresolved review findings;
- tests that only prove private implementation details when a public seam was agreed.
- a terminal response about another task, an old user question, or generic workflow advice instead of the assigned unit;
- a handoff missing the exact worktree, branch, HEAD, status, tests, review axes, or external-mutation boundary.

On a failed or stale terminal response, inspect the recorded worktree before retrying. Preserve useful dirty TDD artifacts and give a fresh recovery implementer an explicit artifact handoff; do not discard or overwrite them. Exclusive transfer of the same dirty worktree is allowed for recovery when the previous writer is confirmed stopped and no destructive cleanup occurs.

The implementer's own review is necessary but does not satisfy orchestrator acceptance. After the commit, the orchestrator runs the independent clean-context review described in `review-contract.md`.
