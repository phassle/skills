# Merger contract

## Contents

- Unit integration
- Reconciling with a target that moved
- After the batch
- Post-merge cleanup

Run exactly one merger with exclusive access to the integration worktree. Supply the pinned base, integration branch, documented Git policy, accepted worker branches, dependency order, issue/spec context, and verification commands.

Give it a private agent-log directory, its exact independently configured harness/model/effort/ladder step, and the event command from `observability.md`. Require `started`, one event for every merge/check/fix batch, and terminal `completed` or `blocked`; every schema-v2 event records model and effort together, and a merge handoff without those events is incomplete.

For each worker branch:

1. Confirm its expected commit is reachable and its worktree is clean.
2. Merge serially in dependency order using the repository's required merge style.
3. On conflict, inspect both originating requirements and preserve both behaviours. Use the installed conflict-resolution skill when available; never choose a side mechanically.
4. Run proportionate checks after the merge. Fix only integration defects, never add unplanned feature scope.
5. Record the merge commit and verification evidence in the run ledger.
6. **Update that unit's tracker issue immediately, before starting the next unit.** Tick its acceptance
   criteria against the independent reviewer's acceptance matrix — never against the implementer's own
   claim — post one comment carrying the merge commit, diffstat, attempt count, review passes and the
   coordinator-verified gate result, and then **close the issue**. Also record what was *rejected* — a
   finding the coordinator overruled, and why — because a reader who sees only ticked boxes cannot tell
   a verified unit from an unexamined one.

**Then re-read the issue and confirm each specific thing you asked for is actually there.** A merger's
own report that it updated the tracker is a claim, not evidence, and this is the step where an agent most
reliably reports success it did not achieve - the merge is the interesting work and the bookkeeping is not.
Observed twice in one run: both mergers stated they had ticked the acceptance criteria, and every checkbox
on both child issues was still empty, along with the parent's. It surfaced only when the human looked.

The coordinator's mistake there is worth naming separately, because it is subtle and general: it verified
that the issue was **closed** and that the label was **intact**, and concluded from those that the whole
tracker instruction had been carried out. Closure and labels are adjacent facts, not the requested one.
**Check the artifact you actually asked for** - count the ticked boxes and compare against the reviewer's
matrix, confirm the comment exists and carries the merge SHA, and confirm the parent's body and state were
left alone. A proxy that is cheap to check is not evidence for the thing that was expensive to do.

A run that batches all tracker updates to the end is opaque for its entire duration, which is most of
its life. The ledger is the run's memory, but the tracker is where everyone else looks.

**Close the child issue at integration-branch merge, and use the tracker's native closed state to do
it.** A decomposition skill computes the ready frontier as *any ticket whose blockers are all done*, so
"done" has to be readable by a process that has none of this run's context. A comment saying the work
is finished is not readable that way, and a still-open issue is indistinguishable from unstarted work
to a fresh agent listing the tracker — which is how the same unit gets built twice. Waiting for the
`develop` merge is the wrong trigger: that merge is a human decision that may sit for days, while the
dependent units are unblocked the moment the integration merge lands.

**Do not strip the ticket's triage label to signal progress.** A label such as `ready-for-agent` is
usually applied by the decomposition skill at creation, because the ticket is agent-grabbable *by
construction* — it describes how well the ticket was specified, which stays true forever, not how far
the work got. Deleting it destroys a fact and records nothing. Progress belongs on the state axis;
specification quality belongs on the label axis. Never collapse the two.

**Never close or modify the parent issue.** Comment a rollup on it so progress is visible in one place,
and leave its body and state alone.

## Reconciling with a target that moved

A long run's integration target advances underneath it — five times in one run. Reconcile whenever it
does, not once at the end, so the remaining units build on the current tree. Fetch again immediately
before push or PR; any further advancement invalidates the fixed point and requires reconciliation plus
affected review. Detect conflicts with a real merge in this exclusive worktree or a disposable one,
never marker-grep heuristics over `git merge-tree` output.

**Read the remote-tracking ref, never the local branch of the same name.** A local `develop` in a
long-lived checkout is routinely tens of commits behind; merging by branch name reconciles against a
stale target, merges cleanly, passes every gate and looks entirely successful. `git fetch --all --prune`
first, then name `origin/<target>` explicitly, and re-verify its SHA immediately before the merge — it
may have moved again while the fetch's findings were being worked.

**A clean merge settles textual conflict and nothing else, and the review loop cannot help you here.**
Every reviewer verified against the run's own base, so nothing that landed on the target during the run
appears in any diff anyone reviewed — this class of defect is invisible by construction. Read what
arrived (`git log --oneline <base>..<target>`) and treat a non-empty result as work. The dangerous cases
are the ones **git resolves cleanly and wrongly**, because a clean merge reads as no problem at all.
Work each explicitly and report a finding for each:

- **Independently allocated identifiers** — ADR numbers, migration indices, exit codes, schema
  constants, fixture ids — chosen on both sides without knowledge of each other. The filenames differ,
  so git merges both without a conflict and the repository ends up with two artifacts claiming one
  identifier. Renumber the run's side, since the target's landed on the shared branch first, and grep
  for references before and after.
- **An index that merges cleanly and is then wrong.** Where one side appends to a list the other never
  touched, the three-way merge keeps those additions and silently omits the run's. An index is not owned
  by the units that created the things it indexes, so no unit's acceptance criteria cover it: confirm
  every artifact the run introduced is reachable from it, exactly once — zero restores a discoverability
  gap, two can fail a duplicate-reference invariant.
- **Prose that now contradicts.** Both sides edited one guide in non-overlapping regions, so the merge
  succeeds while the merged text asserts two different things. Report the contradiction as a finding;
  never edit either side to make them agree.
- **A newly in-scope document.** Where a docs invariant discovers files by directory or suffix rather
  than from an allowlist, a Markdown file the target just added now sits inside those invariants.
  Confirm the suite genuinely scans it rather than skipping it.
- **An append-only knowledge file**, where a clean merge does real damage. Runs append to shared stores —
  a model-calibration file is the standard case — and two runs finishing near each other will both have
  rewritten one. Every "resolve by taking a side" outcome silently destroys another run's learning, and
  the result compiles and passes. Resolve it as a **content check, not a diff review**: enumerate every
  entry key on both sides, prove the merged file contains their union key by key, and report that
  enumeration. Where both sides edited one entry, keep both substantive contributions rather than the
  later timestamp. "No conflict markers" and "nothing lost" are unrelated properties, and only one of
  them is checked for you.

**A ticket spun off mid-run inherits the same problem in reverse.** When a finding is real but out of
scope, the follow-up ticket must state the base it applies to — and every symbol it names must exist
*there*. A ticket written from the feature branch's vocabulary and told to branch from the target sends
its implementer looking for functions that will not arrive until this PR merges. This run did exactly
that: the follow-up named three functions, only two of which existed on the target, while instructing
"fix them together or none". Either pin the ticket to the merged target and say it is blocked until this
PR lands, or write it against symbols the target already has. Check with one command before filing.

**Run the repository's documented gate list yourself, and do not let CI stand in for it.** CI covers
whatever someone wired up, which is often a subset — and a green PR check reads as "the gates pass" to
every later reader. In one repository CI ran only an acceptance job, so `cargo fmt --check` and
`cargo clippy -D warnings` were red on the integration target across several merged PRs without a single
red tick anywhere. Read the gate list out of the repository's own instructions, run all of it at the
exact head you intend to publish, and where CI covers less than that list, say so in the PR rather than
quietly inheriting its narrower definition of green.

Report all of this at the human merge gate with the same weight as a failing check. A merge that
compiles, passes every gate, and quietly ships two documents numbered ADR-0011 is precisely what the
gate exists to catch.

## After the batch

Reconcile the target one final time in this exclusive worktree, pin the resulting base and head, and
rerun affected gates. Then:

1. Run formatting/type/static checks and the full suite, including feature-gated or acceptance suites required by the issues.
2. Run the final two-axis `code-review` through the host's native skill invocation against the pinned base. Use the empty three-agent review-log bundle from `observability.md`, importing it only after the reviewer exits. Fix and re-review actionable findings.
3. Confirm the integration worktree is clean and every accepted worker commit is reachable.
4. Publish, open or update the feature/release/hotfix PR exactly as repository policy documents. Where its target is `develop` or `main`, stop at the mandatory human merge gate.
5. Update issues with factual commit/PR, test, and review evidence. Close each child after its reviewed commit reaches the run's feature/integration branch; leave the root open until human-authorized final integration or repository automation closes it.
6. After verified human-authorized integration, complete the cleanup below.

Before declaring the feature PR ready, re-fetch the complete descendant graph and reconcile it against the planner coverage matrix. Every child must still carry `ready-for-agent`; every open child must have exactly one accepted commit reachable from the feature branch, and every closed child must have verified integration evidence. A missing, changed, duplicate, or unresolved ticket is HITL, not a reason to rewrite the tracker or waive the slice.

Never merge a PR — or perform an equivalent direct or local merge — into `develop` or `main` from broad or earlier authorization. Present the human with the specific PR/branch, target, current head SHA, checks, separate review results, machine-review identity, and unresolved risks, and record `waiting-user`. Only a new human instruction after that presentation, identifying the current PR/branch, authorizes the merger to act. Where the human authorizes agent execution, re-fetch immediately; any material head, target, check, review, or risk change requires renewed approval. A GitHub, Claude, Codex or Copilot review never counts as human approval. Internal worker-branch merges into the feature or integration branch remain autonomous.

## Post-merge cleanup

Cleanup is mandatory after the human-authorized merge is verified and does not require another HITL decision. Do not clean up while a PR is merely ready or awaiting the merge decision.

1. Fetch the target and prune remote-tracking refs. Verify the PR merged and record its target SHA.
2. Enumerate only branches and worktrees recorded as created by this run. For each, record its exact path, branch, tip SHA, and status.
3. Prove each branch tip is reachable from the merged remote target with an ancestry check. Never infer integration from names, PR state alone, or remembered state.
4. Remove only clean run-created worktrees whose commits are reachable. Never force-remove a dirty worktree. Leave unrelated items untouched. Recover dirty, unmerged, or uncertain run-owned state non-destructively when possible; if cleanup would discard or overwrite unique work, preserve it and request the exact safety decision required.
5. Safely delete eligible local branches with Git's merged-branch protection. **Fast-forward the local
   integration branch first — step 6's fast-forward is a precondition of this step, not a follow-up.**
   Git's `-d` protection evaluates reachability from the *current* `HEAD`, not from the remote target you
   proved ancestry against in step 3, so a local `develop` left behind by the merge makes `-d` refuse
   every branch as unmerged. The refusal is correct from where Git is standing and misleading from where
   you are. Do **not** reach for `-D`: it produces an identical-looking result while discarding the one
   safety property that makes this step safe, and it will happily delete a branch that genuinely is not
   merged. Move the base, then let the protection do its job. Delete a run-created remote source branch only when its exact remote tip is reachable from the merged target, repository policy permits, and the PR host did not already delete it; never delete unrelated or unmerged remote branches.
6. Prune stale worktree and remote metadata. Fast-forward a clean, non-diverged local `develop` or `main` to its remote when applicable; never reset, rebase, force-push, or synchronize unrelated branches to one commit.
7. Re-inventory worktrees and refs, then record removed and preserved items in the ledger. Cleanup is complete only when every run-owned item is removed or the user explicitly chooses to retain it; a safety-preserved dirty, unmerged, or uncertain item keeps the run incomplete.

Do not merge a worker merely because it produced commits. Do not close a child before reviewed integration into the run's feature/integration branch, and never close the root before human-authorized integration into `develop` or `main`. Do not merge or push directly into either branch without the hard gate. Writes to other release/integration branches follow repository policy and scope without expanding this gate.
