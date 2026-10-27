# Dispatching a headless agent

Every role in a run — planner, implementer, reviewer, merger — is launched the same way: a prompt file, a background process, and a worktree. The failures below are properties of that launch, not of the role, and each one is **silent**: the wrapper exits zero, the agent produces nothing useful, and the coordinator learns minutes or tens of minutes later. Read this before the first dispatch of any kind.

## Name every stream

A launcher that leaves stdin, stdout or stderr to inheritance will eventually inherit one that blocks.

**Redirect `< /dev/null` on every dispatch whose prompt is a positional argument**, and `< "$PROMPT"` where the prompt genuinely arrives on stdin. `codex exec "$prompt"` launched from a backgrounded parent decides the prompt may still be coming on stdin, prints `Reading additional input from stdin...`, and blocks forever on a stream the parent holds open. Three review leaves hung **44 minutes** this way, each producing 39 bytes and no terminal event — indistinguishable from slow work until their live status was inspected.

**A backgrounded helper inherits the redirected stream and holds the pipe open.** Spinning up load generators inside a `{ … } 2>&1 | tail` group keeps the write end alive through *stderr* even when their stdout goes to `/dev/null`, so the reader never sees EOF. Worse, `kill %1` does not resolve in a non-interactive shell, so the cleanup silently does nothing. Record each helper's PID and kill by PID.

When a dispatch does hang, the run learned nothing from it: log it as an **invalidated dispatch, not a review result**, so a later reader cannot mistake 39 bytes of nothing for a clean pass.

## Prove the launch was valid, not merely that backgrounding succeeded

A wrapper that starts a worker typically `cd`s into the target worktree and inlines the prompt file (`"$(cat $PROMPT)"`). A relative path then resolves against the *worktree* after the `cd`, not the caller's directory: `cat` fails to stderr, the prompt expands to the empty string, and the agent launches with no instructions at all. The wrapper prints `dispatched … pid=…` and exits zero, because `nohup` did succeed.

Resolve every path argument to absolute **before** any `cd`, and refuse to launch on an empty or missing prompt:

```sh
PROMPT=$(cd "$(dirname "$PROMPT")" && pwd)/$(basename "$PROMPT")
[ -s "$PROMPT" ] || { echo "FATAL: prompt file missing or empty: $PROMPT" >&2; exit 1; }
```

**A variadic flag will eat the prompt, and the launch still looks fine.** Options taking a list — `--allowedTools`, `--disallowedTools` and their equivalents — keep consuming argv until the next flag, so a positional prompt placed after one is absorbed into that option's values. The agent starts with no instructions, and the harness may report each swallowed word back as a nonsense setting rather than an error. Pass list-valued options as a single delimited token, put the prompt on **stdin** instead, and confirm the launch by an effect the agent itself produces — its first log event — rather than by the wrapper's exit status.

The rule generalises past these bugs: any launcher whose success message comes from the spawn rather than from the spawned command's own preconditions will report success for an invalid run. Make the preconditions explicit and fail loudly on them. When it happens, kill the process **by its recorded PID** — never by command-line pattern — then verify the worktree is unchanged before re-dispatching, since an empty-prompt agent is unconstrained and may have written something.

## Warm the build before dispatching into a new worktree

A fresh worktree has its own empty build directory, so the worker's first full check compiles every dependency from scratch. Where that exceeds the host's per-command timeout the harness moves the command to the background, and a worker that then ends its turn waiting for a completion notice leaves the unit uncommitted — the work is done, tested, and thrown away.

Run the project's build-and-test-artifacts command in the new worktree first. It costs the coordinator minutes once instead of costing a worker its whole attempt.

Diagnose this by its signature, not its symptom. It looks like a worker ignoring instructions, so the tempting fixes are a firmer prompt or removing the worker's async tools. Both are wrong, and the second is actively harmful: the command is backgrounded by the *host*, not chosen by the worker, so denying it the tool to read a backgrounded result removes its only recovery. Deny the monitor-style "wait for a notification" tool, keep the poll-the-output tool, tell the worker to pass an explicit long timeout on slow commands and to poll rather than wait — and remove the slowness itself by pre-warming.

**Then ask whether the gate is slow or actually hung, because the two look identical from outside and only one is an environment problem.** A change that makes a suite block forever — an interactive path a test now reaches with no input to feed it, a lock nothing will release, a wait on a process that never starts — presents exactly as "the tests are taking a long time", and every accommodation for slowness makes it *less* visible rather than more. Treat repeated timeout-shaped failures on one unit as a suspected hang introduced by that unit until proven otherwise, and require the worker to run the full suite to completion at least once rather than inferring health from the fast subset. A hang is a defect in the change; it is found only by finishing the run that exposes it.

## One shot, no resume

Tell every dispatched worker plainly that **it is a one-shot process with no resume**, and that its turn ends only when the work is committed or it is genuinely blocked. A worker that believes it will be re-invoked ends its turn mid-verification — "the suite is still running, I'll continue when it finishes" — and nothing continues it, so finished work is left uncommitted and discarded. Long checks are run in the foreground and waited for; wall-clock is cheap next to a lost unit.

This failure is invisible in the handoff, because there is no handoff: the process exits successfully with a progress note instead of a terminal event. Treat a missing terminal event as this failure until proven otherwise, and check the worktree for uncommitted work before replacing the agent — it is usually still there and usually good.

Stating the rule reduces how often this happens; it does not stop it. Workers have ended their turn this way *after* being told plainly not to, so the recovery path is the part that must keep working, not the warning. See `implementer-contract.md` for rescuing the abandoned commit.

## The coordinator's own commands need the same care

They fail in ways an agent's do not:

- **Never pipe a long check through `tail` or `head`.** The pipeline holds every line until it ends, so a job that wedges produces an empty output file and tells you nothing — indistinguishable from one that never started. Redirect to a file and read it; a wedged job then shows exactly how far it got. One verification wedged for 41 minutes this way, with an empty output file, while the thing being verified had already finished.
- **A filter on a field that does not exist returns nothing, and nothing reads as good news.** A dependency check written as `jq 'select(.state=="OPEN")'` against an endpoint whose objects carry no `state` matched zero rows; the coordinator read that as *no open blockers* and nearly scheduled five blocked units. An empty result is evidence only once the field is known to exist: print one raw object first, or select the identifiers and check each one's state separately. This failure is silent and always errs toward "clear to proceed".

The general rule: a verification harness that can hang silently is not a verification. Prefer a file over a pipe, an explicit PID over job control, and a check that reports progress over one that reports only its conclusion.
