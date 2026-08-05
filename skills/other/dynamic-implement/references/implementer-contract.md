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

For the first attempt, stop there. For an escalation or recovery replacement, add a compact artifact handoff containing only inspectable facts: current SHAs and dirty/clean state, failing commands/output paths, raw review reports, acceptance rows, prior attempt commits/diffs, cited coordinator scope decisions, and the exact prior harness/model/effort/ladder-index attempt facts. This is durable learning between attempts. Exclude the prior conversation, hidden reasoning, transcripts, unsupported summaries, and reviewer-targeting hints.

**Warm the build in a new worktree before dispatching into it.** A fresh worktree has its own empty build
directory, so the worker's first full check compiles every dependency from scratch. When that exceeds the
host's per-command timeout the harness moves the command to the background, and a worker that then ends
its turn waiting for a completion notice leaves the unit uncommitted — the work is done, tested, and
thrown away. Run the project's build-and-test-artifacts command in the new worktree first; it costs the
coordinator minutes once instead of costing a worker its whole attempt.

Diagnose this failure by its signature, not by its symptom. It looks like a worker ignoring instructions,
so the tempting fixes are a firmer prompt or removing the worker's async tools. Both are wrong and the
second is actively harmful: the command is backgrounded by the *host*, not chosen by the worker, so
denying it the tool to read a backgrounded result removes its only recovery. Deny the monitor-style
"wait for a notification" tool, keep the poll-the-output tool, tell the worker to pass an explicit long
timeout on slow commands and to poll rather than wait — and remove the slowness itself by pre-warming.

**Then ask whether the gate is slow or actually hung, because the two look identical from outside and only
one is an environment problem.** A change that makes a suite block forever — an interactive path a test
now reaches with no input to feed it, a lock nothing will release, a wait on a process that never starts —
presents exactly as "the tests are taking a long time", and every accommodation for slowness (longer
timeouts, pre-warming, backgrounding) makes it *less* visible rather than more. Treat repeated
timeout-shaped failures on one unit as a suspected hang introduced by that unit until proven otherwise,
and require the worker to run the full suite to completion at least once rather than inferring health from
the fast subset. A hang is a defect in the change; it is found only by finishing the run that exposes it.

**The coordinator's own verification commands need the same care as an agent's, and fail in ways an
agent's do not.** Two that cost this run real time:

- **Never pipe a long check through `tail` or `head`.** The pipeline holds every line until it ends, so a
  job that wedges produces an empty output file and tells you nothing — indistinguishable from one that
  has not started. Redirect to a file and read it; a wedged job then shows you exactly how far it got.
- **A backgrounded helper inherits the redirected stream and holds the pipe open.** Spinning up load
  generators inside a `{ … } 2>&1 | tail` group keeps the write end alive through *stderr* even when
  their stdout goes to `/dev/null`, so the reader never sees EOF. Worse, `kill %1` does not resolve in a
  non-interactive shell, so the cleanup silently does nothing. Record each helper's PID and kill by PID.

- **A filter on a field that does not exist returns nothing, and nothing reads as good news.** A
  dependency check written as `jq 'select(.state=="OPEN")'` against an endpoint whose objects carry no
  `state` matched zero rows, and the coordinator read that empty result as *no open blockers* and nearly
  scheduled five blocked units. An empty result is only evidence once the field is known to exist: print
  one raw object first, or select the identifiers and check each one's state separately. This failure is
  silent and always errs toward "clear to proceed".

One verification wedged for 41 minutes this way, with an empty output file, while the thing being
verified had already finished. The general rule: a verification harness that can hang silently is not a
verification. Prefer a file over a pipe, an explicit PID over job control, and a check that reports
progress over one that reports only its conclusion.

**A dispatch wrapper must prove the launch was valid, not merely that backgrounding succeeded.** The
wrapper that starts a worker typically `cd`s into the target worktree and inlines the prompt file
(`"$(cat $PROMPT)"`). If that path is relative it resolves against the *worktree* after the `cd`, not
against the caller's directory: `cat` fails to stderr, the prompt expands to the empty string, and the
agent is launched with no instructions at all. The wrapper then prints `dispatched … pid=…` and exits
zero, because `nohup` did succeed — so the coordinator sees a healthy dispatch and only learns
otherwise minutes later, from an agent that did something arbitrary or nothing. Resolve every path
argument to absolute **before** any `cd`, and refuse to launch on an empty or missing prompt:

**A variadic flag will eat the prompt, and the launch still looks fine.** Options that accept a list -
`--allowedTools`, `--disallowedTools` and their equivalents - keep consuming argv until the next flag, so a
positional prompt placed after one is absorbed into that option's values. The agent then starts with no
instructions, and the harness may report each swallowed word back as a nonsense setting rather than as an
error. Pass list-valued options as a single delimited token, put the prompt on **stdin** instead of as a
positional argument, and confirm the launch by an effect the agent itself produces - its first log event -
rather than by the wrapper's exit status.

**Whichever way the prompt arrives, close the other channel explicitly.** The advice above is
harness-specific and inverts for CLIs that accept a positional prompt: `codex exec "$prompt"` launched from
a backgrounded parent decides the prompt may still be coming on stdin, prints `Reading additional input from
stdin...`, and blocks forever on a stream the parent holds open. Three review leaves hung **44 minutes**
this way, each producing 39 bytes and no terminal event — indistinguishable from slow work until their live
status was inspected. Redirect `< /dev/null` on every dispatch whose prompt is a positional argument, and
`< "$PROMPT"` where the prompt genuinely arrives on stdin. Never leave the choice to the tool: the failure
is silent, and it costs the entire wall-clock of whatever the coordinator was waiting on.

Both bugs are the same rule for any headless dispatch: **name every stream.** A launcher that leaves stdin,
stdout or stderr to inheritance will eventually inherit one that blocks. And when a dispatch does hang,
the run learned nothing from it — log it as an **invalidated dispatch, not a review result**, so a later
reader cannot mistake 39 bytes of nothing for a clean pass.

```sh
PROMPT=$(cd "$(dirname "$PROMPT")" && pwd)/$(basename "$PROMPT")
[ -s "$PROMPT" ] || { echo "FATAL: prompt file missing or empty: $PROMPT" >&2; exit 1; }
```

The rule generalises past this one bug: any launcher whose success message comes from the spawn rather
than from the spawned command's own preconditions will report success for an invalid run. Make the
preconditions explicit and fail loudly on them. When this does happen, kill the process **by its
recorded PID** — never by command-line pattern — then verify the worktree is unchanged before
re-dispatching, since an empty-prompt agent is unconstrained and may have written something.

Tell every dispatched worker plainly that **it is a one-shot process with no resume**, and that its turn
ends only when the unit is committed or it is genuinely blocked. A worker that believes it will be
re-invoked will end its turn mid-verification — "the suite is still running, I'll continue when it
finishes" — and nothing continues it, so finished work is left uncommitted and discarded. Long checks are
run in the foreground and waited for; wall-clock is cheap next to a lost unit. This failure is invisible
in the handoff, because there is no handoff: the process exits successfully with a progress note instead
of a terminal event. Treat a missing terminal event as this failure until proven otherwise, and check the
worktree for uncommitted work before replacing the agent — it is usually still there and usually good.

**Expect the instruction to be insufficient, and keep the recovery cheap.** Stating the rule reduces how
often this happens; it does not stop it. Workers have ended their turn this way *after* being told
plainly not to, so the recovery path is the part that must keep working, not the warning. When it
happens, the coordinator does not need a fresh recovery implementer if the work is actually finished:
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
