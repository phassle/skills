# Run state and recovery

Persist a small Markdown ledger outside the repository, under the OS temporary directory or the agent's durable task-state area. Name it from the repository, the issue/spec identifier, and this run's five-character run token, so two concurrent runs over the same issue never share one ledger, and record its path in progress updates. Mint the token first, then create the ledger; write the token into the ledger before creating any branch or worktree.

Record:

- repository path and issue/spec identifier;
- the five-character run token minted for this run, recorded before the first branch or worktree exists and never regenerated for the same run;
- goal objective, root/child issue identifiers, mechanism, native identifier/status, and last reconciliation time;
- issue model and effort policies, verified route ids, the catalog/ladder version, role ladder indices, attempts with exact harness/model/effort, attempt purpose, escalation dimension (`effort` or `model`), and escalation evidence;
- pinned base branch/SHA and policy sources;
- integration branch/worktree;
- planner result and agreed seams;
- every unit's branch, worktree, status, commit, tests, reviews, and merge evidence;
- every run-created Git ref/worktree, its cleanup eligibility, ancestry/status evidence, and final removed-or-preserved disposition;
- current frontier, blockers, and next action.
- run activity root, per-agent event-log paths, terminal-event status, and rendered-log timestamp.

Use these states only:

```text
planned -> implementing -> reviewing -> accepted -> integrating -> integrated
                                     \-> blocked
```

Update the ledger after every transition. Derive truth from Git, tests, PRs, and the tracker before trusting a stale ledger.

On interruption or resume:

1. Inspect the main checkout, integration worktree, every recorded worker worktree, branch reachability, and tracker state. Match refs and worktrees by the ledger's run token; a token that is not this run's belongs to a concurrent run, so read it at most as context and never resume, write, or clean it.
2. Keep a clean worker branch with commits ahead of its pinned base; resume at review or integration as evidence permits.
3. Resume the same agent/context when possible. If it terminated or returned stale/unrelated output, confirm it is stopped, inspect and preserve the dirty artifacts, then transfer exclusive ownership to a fresh recovery implementer with an explicit artifact handoff. Ask before discarding, reverting, or overwriting dirty work; non-destructive recovery does not require user intervention.
4. Never delete a worktree containing unintegrated commits.
5. Re-run the planner against current integrated state before starting new work.
6. Read the persistent goal and continue the next ready plan step; do not mistake a previous turn ending for plan completion.
7. Reconcile every dispatched agent with its private event log. Record a missing terminal event as an observability failure before resuming or replacing that agent.
8. Build a replacement's artifact handoff from Git state, failing commands, raw reports, acceptance rows, and attempt SHAs. Keep conversation summaries and private reasoning out of the packet.
9. When native capacity is stale, use the verified external-process adapter from `platform-adapters.md`; preserve parallel Matt axes and record every process lifecycle before acceptance.
10. After verified integration, resume mandatory cleanup from the ledger. Recheck current status and ancestry before each removal; never trust stale eligibility evidence or delete unrelated state.
11. Establish provenance from evidence, never from "nothing else could have done this". Commits, files and
   log entries acquire an author by inference only when you have checked authorship, timestamps and the
   agent's own event log against the window it ran in. A coordinator reasoning from its own dispatch records
   alone will mis-assign anything produced outside them - a concurrent run, a human, a hook - and the usual
   symptom is an accusation: one run recorded a handoff-accuracy defect against an implementer that had
   reported honestly, because the commit it was "misreporting" had been made by another coordinator three
   minutes before that implementer was dispatched. When a worker's account conflicts with your inference,
   suspect the inference first and go and look; the worker was there and you were not.

Planner failure, null/stale agent output, no-commit output, review failure, merge failure, token exhaustion, and red combined tests are recoverable attempts while a safe verified route remains. Record and recover automatically. They become pauses only after the applicable fallback matrix is exhausted and external input, authority, credentials, or a safety decision is genuinely required; none is a clean "nothing left" signal.
