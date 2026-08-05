---
name: dynamic-implement
description: "Orient repository work when explicitly invoked without an issue, or implement one spec-level issue end to end with planning, TDD, clean-context review, integration, and tracker updates."
---

# Dynamic Implement

Turn one sufficiently specified issue into a completed, evidence-backed change without carrying the whole build in one context window. Orchestrate existing project skills; never replace their TDD, review, issue-tracker, or Git rules.

Generate all orchestration output in English, including user updates, plans, delegated prompts, logs, handoffs, review reports, commit messages, branch/worktree slugs, tracker/PR text, telemetry prose, and generated documentation. Preserve existing user-authored and repository text verbatim.

Capture durable user execution invariants at admission (language, worktree isolation, continuation, publication boundary, and requested retrospective). Copy them verbatim into every delegated prompt and recovery handoff. Validate every returned artifact against them; reject or rerun nonconforming output instead of asking the user to restate the rule.

## Autonomous execution and truthful status

After an admitted implementation run begins, continue through every internal transition without asking the user to manage the workflow: agent recovery, review findings, fixes, re-reviews, verification, conflict resolution, worker integration, push, tracker updates, calibration, and PR creation. A review result, a failing check, an unavailable model route, or an interrupted subagent is work to recover from, not a human-in-the-loop stop condition when a safe in-scope recovery exists. Merging a PR into `develop` or `main` is the deliberate exception: it always requires the hard human gate below.

Only pause when the user must supply a product decision, merge decision, authority, credential, or external-state change that cannot be discovered or safely inferred. Never present a progress update, a clean review, or "not ready" as a terminal response while a safe next action exists; state the next action in English and take it.

**Coordinator response rule — do not pause to report incremental state.** When a user message arrives mid-run (e.g. "what's happening?", "are you done?", "status?"), answer with one short paragraph (current phase, what's running, what comes next) and immediately continue the run in the same response. Do not end the response waiting for the user to say "continue". Every response ends by taking the next autonomous action unless the stop conditions below apply. Reporting a finding, dispatching a sub-agent, or waiting for a background agent is not a stop — keep the run alive and advance it within the same turn or as soon as a background result arrives.

**Forecast before each ticket or execution wave.** Immediately before dispatching a new ticket/wave, send one concise user update that states:

- the dependency frontier and why each unit is ready, stacked, serial, or still blocked;
- what starts now, including which units/stages run in parallel;
- what remains through the ready-PR gate; and
- an ETA range for the current ticket/wave and for the ready PR, with the critical-path assumption.

Refresh the forecast after a material review finding, recovery/escalation, target-branch movement, or user status request. Use observed run timings when available; otherwise label the estimate as rough. Never promise an exact completion time, hide a dependency, or delay execution to wait for acknowledgement: publish the forecast, then dispatch immediately. When only one unit can run, say whether the constraint is the dependency graph, predicted write conflict, or current agent capacity.

## Hard human merge gate — always required, never bypassed

**Any merge into `develop` or `main` is always HITL. This is unconditional.** No initial instruction — "implement", "finish", "run autonomously", "close the feature", "merge via PR", or anything else — pre-authorises this action. The autonomous run ends at a ready PR; the human decides whether and when to merge.

Prepare, push, open/update, validate, and machine-review a PR targeting `develop` or `main` automatically. Then stop, present the evidence (PR link, head SHA, checks, reviews, unresolved risks, target branch), and wait for an explicit human merge decision. Valid authorisation is a new human instruction delivered after the evidence is presented. The human may also merge themselves — both are acceptable.

This gate does not apply to internal worker-branch merges into a feature/integration branch; continue those autonomously. Apply it the moment any branch targets `develop` or `main`.

At this gate, set the goal/ledger to `waiting-user`, ask for the merge decision, and stop. A machine review is advisory evidence, never human approval. When available, offer to request GitHub Copilot review for a GitHub PR; when orchestrating from Claude, offer a fresh Codex review through the verified Claude adapter. Request either only if the human agrees. After it finishes, present its findings and checks, but still require the human merge decision.

Treat terse confirmations such as “ok”, “continue”, “status”, or “what next” as instructions to advance the active run unless the user explicitly changes scope. A status answer must name the current phase, verified evidence, and the next autonomous action; do not hand internal choices, review sequencing, or routine Gitflow work back to the user. When a model or route is at capacity, retry or move to the next verified route in the ladder and continue; report the recovery, not a false blocker.

Before describing an agent as active, waiting, failed, or complete, inspect its live status. Distinguish completed review evidence from a currently running agent. Before every mutation, verify the exact worktree path and branch. Always create or reuse a dedicated worktree for the assigned branch, including integration and PR-composition work; never modify a shared checkout or another agent's dirty worktree. If a command begins in the wrong worktree, stop that operation safely, preserve the target branch, and resume only in the dedicated worktree.

Before every edit, test, commit, merge, push, or handoff, capture `git rev-parse --show-toplevel`, `git branch --show-current`, `git rev-parse HEAD`, `git status --short --branch`, and the matching `git worktree list --porcelain` entry. Compare them with the ledger; concurrent agents make remembered branch state untrustworthy.

After selecting each agent route, create its immutable `agent_identity` as `Codex (<selected model> / <selected effort>)`. Record it in the run ledger and that agent's activity record, and pass it in the delegated prompt. The selected route is the identity source even when the host does not expose a runtime model identifier. Capture token/cost telemetry only when the active host actually exposes it; never infer token totals from agent labels.

## Explicit invocation gate

Admit a root run only when the current request carries one of the host's accepted explicit entries in [platform-adapters.md](references/platform-adapters.md). Evidence is a retained native skill/command invocation, host-provided explicit-selection metadata, or the exact adapter marker `DYNAMIC_IMPLEMENT_SLASH_ENTRY=1` produced by an installed wrapper.

Treat an explicit skill-file link or native selector as authoritative discovery evidence. Resolve and read that path first, then inspect configured personal and repository skill roots and refresh the host catalog before claiming the skill is unavailable. Never replace an explicitly selected Dynamic Implement run with an improvised repository workflow merely because one catalog snapshot omitted it.

When that evidence is absent, make zero mutations and return the active host's accepted explicit syntax. Intent matching and ordinary prose are not entry evidence.

This gate controls entry into the root orchestration run. Once admitted, downstream planner, implementer, reviewer, merger, setup, TDD, and calibration skills are invoked normally as required by this workflow; they do not need to repeat the root entry evidence.

## Required references

Read these files completely before starting their corresponding phase:

- [planner-contract.md](references/planner-contract.md) before planning.
- [implementer-contract.md](references/implementer-contract.md) before delegating work.
- [merger-contract.md](references/merger-contract.md) before integration.
- [recovery.md](references/recovery.md) when creating run state, resuming, or handling an interrupted agent.
- [platform-adapters.md](references/platform-adapters.md) before invoking skills or subagents on Codex, Claude Code, GitHub Copilot, OpenCode, or Pi.
- [review-contract.md](references/review-contract.md) before accepting any worker or the integration branch.
- [goal-contract.md](references/goal-contract.md) when starting, continuing, blocking, or completing a run.
- [model-routing.md](references/model-routing.md) before selecting planner, implementer, reviewer, or merger models and after a failed attempt.
- [observability.md](references/observability.md) before smoke testing, creating run state, or dispatching any agent.
- [orientation.md](references/orientation.md) when the explicit invocation contains no issue or URL.

## Smoke tests

Treat `--smoke-test` as a local structural test. Verify the explicit-entry gate, required files and skills, adapter command discovery, logger operation, repository instructions, tracker read access, and Git-policy discovery. Create only temporary run logs outside the repository. Do not create a Goal, branch, worktree, commit, issue/tracker edit, PR, model session, or paid probe. Finish with a pass/fail matrix, the rendered log path, and one improvement record per failure containing the first failing event, expected versus observed behavior, a reproduction command, and a proposed skill/config change.

Treat `--smoke-test=agents <issue>` as a live read-only orchestration rehearsal. Before launching it, disclose the exact harness/model routes and any expected paid usage, then obtain approval when the route can consume credits. Dispatch fresh planner, implementer-preflight, reviewer-preflight, and merger-preflight sessions without repository or tracker mutation. Each role and every child agent must satisfy [observability.md](references/observability.md). Give the reviewer an empty standalone log bundle for its coordinator plus Matt's Standards and Spec children, with no path to prior run activity. The rehearsal passes only when every dispatched agent has `started` plus `completed` or `blocked`, command/context isolation checks pass, and the coordinator renders the combined activity log after all reviewer sessions exit.

Both modes stop after reporting evidence. Preserve failures as evidence; do not repair them inside the smoke run or transition into implementation automatically.

## No-issue orientation

When an explicitly admitted invocation contains no issue, URL, or smoke-test flag, read and execute [orientation.md](references/orientation.md), return its read-only status and proposed plan, then stop. Do not load the capability profile, run setup, create a Goal/ledger, claim a Wayfinder ticket, mutate the tracker, or prepare Git state. Implementation requires a new explicit invocation naming the selected issue.

## Preconditions

Reach these preconditions only when the explicit invocation names one issue number or URL.

Before creating a branch, worktree, issue, PR, or commit:

1. Load `~/.agents/dynamic-skills/capabilities.json`, or the path in `DYNAMIC_SKILLS_PROFILE`. Require the current effort-aware schema. Then evaluate freshness **only for the harnesses this run will actually use** — the implementer harness and the selected reviewer harness. Each of those requires `status: verified`, an unexpired `catalog.expiresAt`, its ladder's own `fingerprint`, and a live-verified `escalationLadder` containing the selected start step. A stale, unverified, or absent entry for a harness this run does not use is never a blocker. If a harness this run does need fails any of those checks, or its selected route/effort fails at launch, stop before mutation. Tell the user the active host's exact manual `dynamic-skills-setup` command from [platform-adapters.md](references/platform-adapters.md), name the specific harness and the exact missing or stale evidence, and ask them to rerun Dynamic Implement afterward. Never invoke setup automatically.
2. Honour the profile's route restrictions. Select planner, implementer, reviewer, and merger routes only from that harness's `escalationLadder`. A route under `auxiliaryRoutes` may be used only for its `allowedRoles` and never for one of its `forbiddenRoles`, however cheap and verified it is. A `candidateEscalationSteps` entry with `status: declined` was excluded by user policy, not by capability: never promote it into a run.
3. Locate and read repository instructions (`AGENTS.md`, `CLAUDE.md`, contribution docs, nested instructions), issue-tracker configuration, domain context, and relevant ADRs. Load `.agents/dynamic-implement/model-calibration.json` when present. It is the repository-owned source of learned model/effort outcomes; never write findings into an installed skill directory or treat a personal cache as authoritative.
4. Fetch the full issue, including comments, hierarchy, native dependencies, and all descendants. Do not rely on a default-limited issue listing.
5. Confirm the issue is specified enough to implement: observable outcome, acceptance criteria, and resolved product decisions.
6. Discover the documented Git strategy and integration target.

If the Git strategy is missing or ambiguous, stop and ask the user. Recommend gitflow: `develop` as integration, `feature/<kebab-name>` per coherent change, PR or `--no-ff` back to `develop`, and `main` for releases only. Do not establish that policy silently.

Matt Pocock's engineering skills are mandatory. Require at least `implement`, `tdd`, `code-review`, and `setup-matt-pocock-skills`; also require `to-tickets` when decomposition needs it. If any required skill is missing, stop before mutation, recommend installing the official `mattpocock/skills` engineering set with the host-supported skill installer, and ask for approval before installing. Then invoke `setup-matt-pocock-skills` when the repository configuration it expects is absent. Do not imitate those skills from memory or substitute a simplified local review. Invoke skills with the host's native syntax as defined in [platform-adapters.md](references/platform-adapters.md).

After the issue and integration target are known, create the persistent run goal in [goal-contract.md](references/goal-contract.md). The root issue plus its child/dependency graph is the shared cross-harness goal backlog; the external ledger stores technical execution evidence, and native Goals/tasks only mirror them. The goal covers the entire planned implementation, not only planning or the current wave. Do not end the run while a safe next plan step exists.

**Claim the root issue on the tracker as the run's first write, before planning.** Where the configured tracker defines a claim — commonly an assignee — an unclaimed issue is by definition takeable, so until the claim exists a concurrent run or a human sees the whole feature as available and can start it a second time. Claiming units at dispatch does not cover this: the first unit claim appears only after planning finishes, which can be many minutes in, and it marks one child rather than the feature. For that entire window the run is invisible to everyone except this coordinator, because the ledger is private. Claim the root, then claim each unit at its own dispatch; the two claims answer different questions and neither replaces the other.

Do this before the first mutation of Git or the tracker, so an aborted precondition check leaves nothing claimed. Release or leave the root claim according to that tracker's convention when the run reaches its terminal state, and never close the root issue to signal progress — closure is the human's decision after the merge gate.

**Read the claim before writing it, and treat an existing one as a stop.** A blind claim is a write, not a check: it overwrites the evidence that would have told you someone else is already here. Fetch the current claim first, and if the issue or any planned child is already claimed, stop and report who holds it rather than joining them. This costs one read and is the only cheap moment to catch a collision.

**The tracker cannot arbitrate between two runs under one account, so it is not the lock.** Both runs authenticate as the same user, so the second coordinator reads the first one's assignee as *its own* claim and proceeds. Observed on 2026-08-05: a Codex Desktop run and a Claude Code run were started on the same issue two minutes apart, both claimed correctly, and neither could see the other.

**Write the claim onto the ticket, as content, not just as state.** A binary claim like an assignee cannot distinguish "someone else took this" from "I took this" when both runs authenticate as one account. A comment can, because it carries identity. Post one as the run's first write, before planning and before any Git or tracker mutation:

```text
dynamic-implement: run claimed
harness: <harness>   session: <session id>   run token: <token>
issue: <root>        started: <RFC-3339>     status: in-flight
```

Then make the corresponding **read** a precondition. Fetch the root issue's comments first; if a claim comment exists whose session id and run token are not this run's, and it has not been released, stop before any mutation, name the holder, and let the human decide whether to resume it, take it over, or run anyway. Release it at terminal state — including when stopping at the merge gate — by posting a short released note that names the same run token, so an abandoned run is visibly abandoned rather than silently blocking the next one.

This is the mechanism that actually generalises. The tracker is the one medium both coordinators already read, so it works across harnesses, machines, containers and users, and the human can see the collision too. A filesystem lock cannot do that: two runs on different hosts, or in separate sandboxes, never contend for it.

Add a local same-host lock only as a fast secondary guard, and never as the authority — one lock path per repository-and-issue with **no** run token (`<run-state-root>/locks/<repo>-<issue>.lock`), acquired with an atomic fail-if-exists operation. Note it cannot be the run-state directory itself: `recovery.md` deliberately gives each run its own token-suffixed directory so two runs never interleave their evidence, and a per-run path collides with nothing by construction, so it can detect nothing.

The mechanisms answer different questions and a complete run wants all three: the run token keeps two runs' *evidence* apart, the claim comment stops the second run from starting and says who holds it, and the local lock catches a same-host collision in milliseconds. A token alone still lets both coordinators build the same issue, open competing branches and race the same worktrees — tidily logged in separate directories.

The damage is not hypothetical even when nothing is lost. In the observed collision both runs wrote the same branches and worktrees, each attributed the other's commits to its own agents, and one recorded a handoff-accuracy defect against an agent that had reported honestly — the commit it was accused of misreporting had been made by the other run. Evidence corruption of that kind is the quiet failure here: the code survived, the account of who did what did not.

Resolve the issue's model and effort policies through [model-routing.md](references/model-routing.md). Use calibration/evals to choose the predicted starting index in setup's verified ladder, honor explicit per-issue/user fixed choices, and record every route/effort selection, boundary probe, and escalation in the goal ledger.

Pin the calibration version used by this run. New calibration produced near completion applies only to the next root issue/run; never reroute current work retroactively.

## Phase 1: Plan first

Keep the planner read-only. Give it the issue, repository, and only the compact historical model calibration described in [model-routing.md](references/model-routing.md), not a proposed decomposition or previous agent transcript. Require the structured contract in [planner-contract.md](references/planner-contract.md).

Publish a concise user-visible plan before implementation begins, including the initial dependency frontier, planned parallel/stack/serial waves, remaining critical path, and rough ready-PR ETA. Treat the issue's explicit test seams as already agreed. If the planner proposes new seams, changes acceptance criteria, finds an unresolved decision, or needs to create child tickets, pause for user approval.

Choose work units dynamically:

- Use existing child issues when they are complete tracer-bullet tickets.
- Use one work unit when the supplied issue fits one fresh implementation context.
- For a feature too large for one context and lacking child tickets, invoke the installed `to-tickets` workflow. Respect its approval step before publishing tickets.

Never schedule an issue with an open native blocker. Never use a "least blocked" fallback. Treat predicted overlap in files, schemas, migrations, public APIs, or shared test seams as an execution dependency even when the tracker lacks an edge.

**Where several units write one file, "distinct sections" is not the same as distinct insertion points.** A planner can be entirely right that twelve units own twelve semantically separate sections and still have them collide, because two agents appending at end-of-file write the same line. Give each concurrent unit an explicit textual insertion anchor rather than a section name — and define that anchor against **what is last in that unit's own base**, not against the intended final document. One run claimed two anchors were well separated because one inserted after a named section and the other appended at EOF; in their shared base that named section *was* last, so both named the same point and they conflicted. Where an anchor cannot be made unambiguous, hold the unit until the one it would collide with merges, and record the hold as a scheduling decision rather than discovering it as a conflict.

Verify such a prediction by performing a real merge in a disposable worktree, never by reading merge-tree output for markers.

## Phase 2: Prepare isolated Git state

Preserve unrelated user changes. Stop if they overlap the planned work and cannot be isolated safely.

Mint one run token before the first branch or worktree exists: exactly five lowercase base-36 characters from real system entropy, never invented by the model.

```bash
LC_ALL=C tr -dc 'a-z0-9' < /dev/urandom | head -c 5
```

Record the token in the ledger immediately, before creating any ref, and reuse that exact recorded token for every branch, worktree path, and ledger entry for the rest of the run, including resumes and recovery agents. Never mint a second token for the same run, and never reuse one run's token in another run. A resumed run without a recorded token is a different run: mint a fresh token and treat pre-existing refs from the lost run as another agent's state under the ownership rules below.

Derive deterministic kebab-case branch names from the recorded token and reuse them when resuming. Under gitflow use this model unless repository policy says otherwise:

```text
develop
└── feature/<root-id>-<root-slug>-<run-token>                     integration branch/worktree
    ├── feature/<root-id>-<root-slug>-<run-token>-issue-<child-id> worker branch/worktree
    └── feature/<root-id>-<root-slug>-<run-token>-issue-<child-id> worker branch/worktree
```

Include the run token, the root issue id, and the concrete child issue id in every worker branch and worktree name; carry the token in the worktree directory name too, so two runs on the same issue never target one path. Use a deterministic unit id only when the work unit has no tracker issue.

The token makes concurrent runs over the same issues safe, and it also removes any excuse to adopt a ref this run did not create. A branch or worktree whose token is not this run's belongs to another run: never check it out for writing, merge into it, delete it, or count it as this run's evidence. If a name this run derived already exists, that is a token collision or an aborted predecessor — stop and resolve it explicitly instead of writing into it.

Base every worker in a wave on the integration branch's same pinned commit. Never let two writing agents share a branch or worktree. Keep the main checkout untouched when an integration worktree can be used.

Before every Git write, run a worktree preflight in the command's intended working directory: confirm the absolute path, `git branch --show-current`, `git status --short`, and the relevant `git worktree list` entry. After creating a worktree, start a new command in that new directory before any checkout, merge, cherry-pick, rebase, commit, push, or test; never chain those actions from the creator worktree. Before composing an integration or PR branch, inspect the graph, existing integration branch, current `develop`, and any existing PR so an older merge or another agent's work is never silently replaced.

Create the run ledger described in [recovery.md](references/recovery.md) outside the repository. Record the base SHA, policy sources, plan, branches, worktrees, unit status, tests, reviews, and integration evidence after every transition.

Create the per-agent activity directories described in [observability.md](references/observability.md) before dispatch. Give each agent only its own log destination and exact harness/model/effort step, require the same for every child it spawns, and reject a handoff without the required terminal event or model/effort pair.

## Phase 3: Implement the ready frontier

Work only the unblocked frontier, and **execute it at the width the planner specified**. Each wave carries a `mode` from [planner-contract.md](references/planner-contract.md): `parallel` units are dispatched together from the same pinned base; a `stack` unit is cut from the *preceding unit's branch head* rather than the integration head, so it extends that work instead of racing it and its review and merge latency still overlaps; only `serial` runs alone. Do not silently narrow a wave to one unit at a time — a unit left queued behind work it does not depend on is idle capacity, and the planner already weighed the merge risk that ordering was meant to avoid.

Exploit pipeline parallelism as well as unit parallelism. Independent implementation, review, verification, and merge-preparation work may overlap when they use isolated worktrees/state and their dependency edges are satisfied. Schedule from the live dependency graph and current slot availability, not the worst-case slot demand of every later stage. Do not reserve future review slots so early that ready independent implementers sit idle; instead throttle new dispatches as completed units approach review capacity. Record every deliberate width reduction and its concrete constraint.

Two graphs govern this and must not be conflated. A unit with an **open native tracker blocker** is never scheduled, without exception. A **predicted write conflict** is the planner's forecast: it selects `stack` or `serial` over `parallel`, and the orchestrator may promote it after inspecting the real diff — if the named symbols are untouched, run the units together and record the override. Where the tracker defines a claim, claim each unit before dispatching its implementer; an unclaimed in-flight ticket reads as takeable to any concurrent run, and the run ledger cannot prevent that because it is private to this orchestrator.

Give an initial implementer exactly one work unit, its authoritative issue/spec text, agreed test seams, pinned base SHA, branch, worktree, and the calibrated harness/model/effort ladder step. A stacked unit is additionally told which sibling sits beneath it, that the sibling is not yet merged, and which symbols it should extend rather than rewrite. For an escalation, choose only the next verified ladder step and use the artifact handoff in [implementer-contract.md](references/implementer-contract.md): preserve inspectable evidence from earlier attempts without leaking conversation, private reasoning, or unsupported conclusions.

Require each implementer to read and invoke the installed `implement` skill using the host's native invocation syntax. Follow [implementer-contract.md](references/implementer-contract.md). It must finish TDD/checks, the full suite, the required two-axis `code-review`, fixes, and a commit on its worker branch. It must not merge, push, close issues, or expand scope.

After that commit, dispatch the independent acceptance review in [review-contract.md](references/review-contract.md). Start a standalone zero-conversation-context session; never fork or resume an implementation/planning session. Prefer a verified different model family from the capability profile. The clean reviewer must invoke Matt Pocock's installed `code-review` skill for Standards and Spec. Return findings to the implementer, then use a new clean reviewer session for every re-review.

Wait for both Standards and Spec reports before a normal fix pass. Aggregate all actionable findings, fix them together, run the affected gates, and then launch one fresh pair. Do not serialize the loop around whichever axis reports first unless the other route has definitively failed and recovery is already in progress.

Calculate concurrency continuously for the active pipeline stages. Reserve the coordinator and the agents needed **now**; account for the two `code-review` leaves before admitting another stage that would contend with them. With four total slots, examples of valid schedules include three independent implementers plus the coordinator, or one implementer plus two review leaves plus the coordinator. As units change stage, refill released slots from the ready frontier. Preserve planner wave order when batching is unavoidable, and report the capacity constraint in the ticket forecast.

Accept a worker branch only when all evidence exists:

- clean worktree;
- committed, non-empty diff from its pinned base;
- targeted checks and full suite passed;
- Matt Pocock Standards and Spec reviews completed in an independent clean context;
- every acceptance criterion has an explicit pass/fail result backed by code or independently observed test evidence;
- every actionable finding fixed and re-reviewed.

Reject a terminal handoff that does not match the assigned task or state its exact worktree, branch, HEAD, clean/dirty state, checks, review result, and forbidden external mutations. Treat an answer to stale conversation or an unrelated question as a failed attempt; preserve Git and test artifacts and dispatch a fresh recovery context automatically.

Do not hand no-commit, dirty-only, failed, or unreviewed branches to the merger.

## Phase 4: Merge through one owner

Give one merger exclusive ownership of the integration worktree. Follow [merger-contract.md](references/merger-contract.md).

Merge accepted worker branches serially in dependency order. Resolve conflicts by reading both issues and preserving both intents; use the repository's conflict-resolution skill when available. Verify after each risky merge and run the combined full suite and static checks before accepting the batch.

After the last worker merge, run the same clean-context Matt Pocock `code-review` of the combined integration diff against the pinned base. Fix and re-review all actionable findings on the integration branch, using a new clean session for every pass.

Immediately before that final feature review, fetch the remote integration target and reconcile any advancement in the dedicated integration worktree. Pin the new base/head SHAs, rerun affected gates, and review that exact range. Fetch again immediately before push; if the target advanced after review, reconcile and repeat instead of publishing stale evidence. Use an actual merge in the integration worktree or a disposable worktree for conflict discovery; never infer conflict-freedom by grepping `merge-tree` text for marker strings.

Before opening the feature PR, update the dedicated model-telemetry section in every planned child issue with its feature-reviewed outcome. Then invoke `dynamic-skills-calibrate` in a separate fresh agent scoped to the root feature; require it to fetch every descendant, validate that all planned children are accounted for, and update the tracked `.agents/dynamic-implement/model-calibration.json` on the policy-compliant feature branch for the next dynamic run. If this bookkeeping cannot complete, preserve the ready branch and report the exact blocker before creating the PR unless the user explicitly opts out.

Prepare integration only as repository policy directs. If the PR or equivalent direct merge targets `develop` or `main`, open/update it or prepare the exact local merge evidence, then stop at the hard human gate. Repository permission is necessary but never substitutes for the contemporaneous human decision. Internal worker merges into the feature/integration branch continue autonomously. Never merge directly to a release branch unless policy and scope allow it; if that release branch later targets `main` or `develop`, the hard gate applies there.

Construct PR titles, bodies, comments, and tracker text through an argument-safe mechanism. Do not pass Markdown containing shell-interpretable characters (especially backticks, substitutions, or untrusted text) in an interpolated shell command; use the host/API's structured input or a safely created body file.

Prefix every externally visible agent-authored PR, issue, review-thread, and tracker comment with the author's recorded `agent_identity` followed by ` — `, unless the user specifies another identity. Recover a missing identity from the current run's selected route and write it to the ledger before posting; do not post an “unavailable” identity. The posting account identifies authentication, not authorship; never make an automated action appear to be a human-authored response.

## Phase 5: Prove completion and replan

Update the tracker only from verified facts. For each integrated issue, record branch/merge or PR evidence, test commands/results, and review outcome. Close an issue only when its change has reached the policy-defined integration target; a worker commit alone is insufficient.

Finalize the dedicated model-telemetry section in each integrated issue body as specified by [model-routing.md](references/model-routing.md). Record every model/effort attempt, boundary probe, harness-reported cost, and final integration outcome there and preserve all user-authored body content. The pre-PR calibration already saved the predicted minimum successful ladder step for the next run; reviewers never receive it.

Re-fetch issue state and run the planner again after each integration wave. Continue until all requested scope is integrated or a concrete user/external blocker remains.

Before claiming completion, audit every acceptance criterion against current files, tests, branch/PR state, issue state, and the run-owned Git cleanup ledger. Missing or indirect evidence means incomplete.

If a ready PR targeting `develop` or `main` is awaiting the human merge decision, report `waiting-user`, not complete or blocked. Keep tracker issues open unless repository automation closes them after the human-authorized merge. When the human authorizes agent execution, re-fetch the PR, target, head SHA, approvals/reviews, and checks immediately before merging; material change invalidates the authorization and requires a new evidence presentation and human decision.

After a human-authorized merge into `develop` or `main` is verified, perform mandatory run-owned Git cleanup without another HITL pause. Fetch/prune, prove the merged target contains each recorded branch tip, inspect each exact worktree for a clean status, then remove only clean worktrees and safely delete only merged local branches created by this run. Establish "created by this run" from the ledger's run token, not from name similarity: a ref or worktree carrying another token, or none, is out of scope even when it names the same issue. Delete a run-created remote source branch only when its exact remote tip is also reachable from the merged target, repository policy permits, and the host did not already delete it. Prune stale worktree/remote metadata. Fast-forward a clean, non-diverged local long-lived target to its remote; never reset, rebase, force, or make unrelated branches "match." Leave unrelated items untouched. Recover dirty, unmerged, or uncertain run-owned items autonomously when non-destructive evidence permits; otherwise preserve them and request only the specific safety decision required. Record cleanup evidence in the ledger; the run is incomplete until every run-owned item is removed or the user explicitly chooses to retain it.

When the user asks for a retrospective or a Dynamic Implement improvement, complete it before the final handoff: identify user corrections, classify each as policy, observability, or execution failure, and update the installed skill only with concise reusable safeguards. Validate the revised skill and distinguish pre-existing validator incompatibilities from new regressions.

## Stop conditions

Pause without guessing when:

- Git or integration policy is absent or contradictory;
- new test seams or product decisions need agreement;
- an issue has an open blocker;
- the planner, implementer, reviewer, or merger fails without producing trustworthy evidence;
- required credentials, permissions, or external systems are unavailable;
- combined verification is red.
- the private activity logger is unavailable or a dispatched agent lacks its required terminal event.
- a PR targeting `develop` or `main` is ready and awaiting the mandatory human merge decision.

Report the exact blocker and preserve resumable state. Never mark a partial wave complete.
