---
name: dynamic-implement
description: "Orient repository work when explicitly invoked without an issue, or implement one spec-level issue end to end with planning, TDD, clean-context review, integration, and tracker updates."
metadata:
  version: 0.1.0
---

One sufficiently specified issue goes in and a ready pull request comes out, evidence-backed, without any single context window holding the whole build. This skill orchestrates the project's installed skills; it never replaces their TDD, review, issue-tracker, or Git rules.

The execution model is the **sandcastle loop**: each work unit gets a fresh dedicated worktree and a fresh agent — a new headless session with zero conversation history — and hands back commits and artifacts, never conversation. One unit, one branch, one worktree, one agent; the merger folds the commits back. Isolation is the worktree, branch, and run token rather than a container, which is exactly what lets the run work on a **subscription login**: workers are the machine's own harness CLIs, authenticating however this machine already does, so no API key and no container image is required. Nothing in the run may assume API-key billing — a route that reports no money reports turns and duration instead.

An admitted run is autonomous all the way to **the gate** — the human decision to merge into `develop` or `main`. Everything short of it is work to do: agent recovery, review findings, fixes, re-reviews, conflict resolution, integration, push, tracker updates, calibration.

Everything the run knows about its own state comes from **live inspection**. Concurrent agents make remembered branch, worktree, and agent status untrustworthy, so the run reads before it writes and verifies before it claims.

Produce every orchestration output in English — user updates, plans, delegated prompts, logs, handoffs, review reports, commit messages, branch and worktree slugs, tracker and PR text, telemetry prose, generated documentation — and preserve user-authored and repository text verbatim.

Capture the user's durable execution invariants at admission (language, worktree isolation, continuation, publication boundary, requested retrospective). Copy them verbatim into every delegated prompt and recovery handoff, validate every returned artifact against them, and rerun nonconforming output rather than asking the user to restate the rule.

## Admission

Admit a root run only when the current request carries one of the host's accepted explicit entries in [platform-adapters.md](references/platform-adapters.md). Evidence is a retained native skill/command invocation, host-provided explicit-selection metadata, or the exact adapter marker `DYNAMIC_IMPLEMENT_SLASH_ENTRY=1` from an installed wrapper. Intent matching and ordinary prose are not evidence; absent it, make zero mutations and return the active host's accepted explicit syntax.

An explicit skill-file link or native selector is authoritative discovery evidence: resolve and read that path first, then inspect configured personal and repository skill roots and refresh the host catalog before claiming the skill is unavailable. An explicitly selected run is never replaced by an improvised repository workflow because one catalog snapshot omitted it.

The gate controls entry into the root run only. Once admitted, planner, implementer, reviewer, merger, setup, TDD, and calibration skills are invoked normally.

## Run to the gate

Continue through every internal transition without asking the user to manage the workflow. A review result, a failing check, an unavailable model route, or an interrupted subagent is something to recover from while a safe in-scope recovery exists.

Pause only where the user must supply a product decision, merge decision, authority, credential, or external-state change that cannot be discovered or safely inferred. A progress update, a clean review, or a "not ready" is never a terminal response while a safe next action exists: name the next action in English and take it.

**A mid-run user message is answered inside the run, not instead of it.** When "what's happening?", "are you done?", "status?" arrives, reply with one short paragraph — current phase, what is running, what comes next — and continue in the same response. Reporting a finding, dispatching a sub-agent, or waiting on a background agent is not a stop. Terse confirmations like "ok", "continue", "status", "what next" are instructions to advance the active run unless the user changes scope. Where a model or route is at capacity, retry or take the next verified ladder step and report the recovery, not a false blocker.

**Forecast immediately before each ticket or wave**, in one concise user update:

- the dependency frontier, and why each unit is ready, stacked, serial, or blocked;
- what starts now, including which units and stages run in parallel;
- what remains through the ready-PR gate;
- an ETA range for this wave and for the ready PR, with the critical-path assumption.

Refresh it after a material review finding, a recovery or escalation, target-branch movement, or a user status request. Use observed run timings where available and label anything else rough. Publish the forecast and dispatch immediately — never promise an exact completion time, hide a dependency, or wait for acknowledgement. Where only one unit can run, say whether the constraint is the dependency graph, a predicted write conflict, or agent capacity.

## The gate

**Any merge into `develop` or `main` is HITL, unconditionally.** No initial instruction — "implement", "finish", "run autonomously", "close the feature", "merge via PR" — pre-authorises it. Valid authorisation is a new human instruction delivered *after* the evidence is presented. The human may also merge it themselves.

Prepare, push, open or update, validate and machine-review the PR automatically. Then set the goal/ledger to `waiting-user`, present the evidence — PR link, head SHA, checks, reviews, unresolved risks, target branch — ask for the merge decision, and stop. A machine review is advisory evidence, never approval.

Where available, offer a GitHub Copilot review for a GitHub PR, or a fresh Codex review through the verified Claude adapter when orchestrating from Claude. Request either only with the human's agreement, present its findings, and still require the human merge decision.

Internal worker-branch merges into a feature or integration branch continue autonomously. The gate applies the moment any branch targets `develop` or `main`.

## Trust live state

Inspect an agent's live status before describing it as active, waiting, failed, or complete, and distinguish completed review evidence from a still-running agent.

Before every edit, test, commit, merge, push, or handoff, capture the working state and compare it with the ledger:

```bash
git rev-parse --show-toplevel
git branch --show-current
git rev-parse HEAD
git status --short --branch
git worktree list --porcelain
```

Always create or reuse a dedicated worktree for the assigned branch, including integration and PR-composition work; never modify a shared checkout or another agent's dirty worktree. A command that begins in the wrong worktree stops safely, preserves the target branch, and resumes in the dedicated one.

After selecting each agent route, mint its immutable `agent_identity` as `Codex (<selected model> / <selected effort>)`, record it in the run ledger and that agent's activity record, and pass it in the delegated prompt. The selected route is the identity source even where the host exposes no runtime model identifier. Capture token and cost telemetry only where the active host exposes it; never infer token totals from agent labels.

## Token economy

Context is the run's scarcest resource; spend it like money. The currency between agents is the **artifact, never the transcript** — SHAs, diffs, failing commands, report files, log events — and every packet an agent receives is the minimum its role contract names:

- A delegated prompt carries the unit's own issue text, seams, base, branch, worktree, and route — never this skill, another role's contract, the ledger, or the run history. The role contracts define each packet exactly; anything they do not name stays out.
- Point at files rather than pasting them: workers read the installed skills and repository instructions from disk in their own context, and the coordinator passes paths.
- The coordinator reads each reference at its phase and carries forward only the ledger, the frontier, and the forecast — completed waves live in the ledger and on the tracker, not in context.
- An escalation or recovery inherits the artifact handoff in [implementer-contract.md](references/implementer-contract.md), never the failed conversation.

## Required references

Read each completely before its phase:

- [planner-contract.md](references/planner-contract.md) before planning.
- [dispatch.md](references/dispatch.md) before launching any agent, of any role.
- [implementer-contract.md](references/implementer-contract.md) before delegating work.
- [merger-contract.md](references/merger-contract.md) before integration.
- [review-contract.md](references/review-contract.md) before accepting any worker or the integration branch.
- [recovery.md](references/recovery.md) when creating run state, resuming, or handling an interrupted agent.
- [concurrency.md](references/concurrency.md) before the run's first tracker or Git write.
- [platform-adapters.md](references/platform-adapters.md) before invoking skills or subagents on Codex, Claude Code, GitHub Copilot, OpenCode, or Pi.
- [goal-contract.md](references/goal-contract.md) when starting, continuing, blocking, or completing a run.
- [model-routing.md](references/model-routing.md) before selecting planner, implementer, reviewer, or merger models, and after a failed attempt.
- [observability.md](references/observability.md) before smoke testing, creating run state, or dispatching any agent.
- [orientation.md](references/orientation.md) when the explicit invocation contains no issue or URL.

## Smoke tests

`--smoke-test` is a local structural test. Verify the explicit-entry gate, required files and skills, adapter command discovery, logger operation, repository instructions, tracker read access, and Git-policy discovery, creating only temporary run logs outside the repository. Create no Goal, branch, worktree, commit, tracker edit, PR, model session, or paid probe. Finish with a pass/fail matrix, the rendered log path, and one improvement record per failure: first failing event, expected versus observed, a reproduction command, and a proposed skill or config change.

`--smoke-test=agents <issue>` is a live read-only orchestration rehearsal. Disclose the exact harness/model routes and expected paid usage first, and take approval where the route can spend credits. Dispatch fresh planner, implementer-preflight, reviewer-preflight, and merger-preflight sessions with no repository or tracker mutation; every role and every child agent satisfies [observability.md](references/observability.md). Give the reviewer an empty standalone log bundle for its coordinator plus Matt's Standards and Spec children, with no path to prior run activity. It passes only when every dispatched agent has `started` plus `completed` or `blocked`, command and context isolation checks pass, and the coordinator renders the combined activity log after all reviewer sessions exit.

Both modes stop after reporting evidence. Preserve failures as evidence; repair nothing inside the smoke run and never transition into implementation.

## No issue: orient and stop

An admitted invocation carrying no issue, URL, or smoke-test flag reads and executes [orientation.md](references/orientation.md), returns its read-only status and proposed plan, and stops. Load no capability profile, run no setup, create no Goal or ledger, claim no Wayfinder ticket, mutate no tracker, prepare no Git state. Implementation requires a new explicit invocation naming the selected issue.

## Preconditions

Reach these only when the explicit invocation names one issue number or URL, and complete them before creating a branch, worktree, issue, PR, or commit.

1. Load `~/.agents/dynamic-skills/capabilities.json`, or the path in `DYNAMIC_SKILLS_PROFILE`, requiring the current effort-aware schema. Evaluate freshness **only for the harnesses this run will use** — the implementer harness and the selected reviewer harness — each requiring `status: verified`, an unexpired `catalog.expiresAt`, its ladder's own `fingerprint`, and a live-verified `escalationLadder` containing the selected start step. A stale or absent entry for an unused harness blocks nothing. Where a needed harness fails a check, or its route fails at launch, stop before mutation: give the active host's exact manual `dynamic-skills-setup` command from [platform-adapters.md](references/platform-adapters.md), name the harness and the exact missing or stale evidence, and ask the user to rerun Dynamic Implement afterward. Setup is never invoked automatically.
2. Honour the profile's route restrictions. Select planner, implementer, reviewer, and merger routes from that harness's `escalationLadder` only. An `auxiliaryRoutes` entry serves its `allowedRoles` and never a `forbiddenRoles` one, however cheap and verified. A `candidateEscalationSteps` entry marked `status: declined` was excluded by user policy, not capability, and stays excluded — a `subscription-only` directive that ruled out API-key-billed routes is the common case.
3. Read repository instructions (`AGENTS.md`, `CLAUDE.md`, contribution docs, nested instructions), issue-tracker configuration, domain context, and relevant ADRs. Load `.agents/dynamic-implement/model-calibration.json` where present — the repository owns learned model/effort outcomes; an installed skill directory never stores findings and a personal cache is never authoritative.
4. Fetch the full issue: comments, hierarchy, native dependencies, every descendant. A default-limited listing is not the graph.
5. Confirm the issue is specified enough to implement — observable outcome, acceptance criteria, resolved product decisions.
6. Discover the documented Git strategy and integration target. Where it is missing or ambiguous, stop and ask; recommend gitflow (`develop` as integration, `feature/<kebab-name>` per coherent change, PR or `--no-ff` back to `develop`, `main` for releases only) rather than establishing policy silently.

Matt Pocock's engineering skills are mandatory: at least `implement`, `tdd`, `code-review`, and `setup-matt-pocock-skills`, plus `to-tickets` where decomposition needs it. Where one is missing, stop before mutation, recommend installing the official `mattpocock/skills` engineering set through the host-supported installer, and ask before installing. Then invoke `setup-matt-pocock-skills` where the repository configuration it expects is absent. Imitating those skills from memory or substituting a simplified local review is not an option. Invoke skills with the host's native syntax from [platform-adapters.md](references/platform-adapters.md).

Once the issue and integration target are known, create the persistent run goal in [goal-contract.md](references/goal-contract.md). The root issue plus its child and dependency graph is the shared cross-harness backlog; the external ledger holds technical execution evidence, and native Goals or tasks only mirror them. The goal covers the whole planned implementation, not just the current wave.

Resolve the issue's model and effort policies through [model-routing.md](references/model-routing.md): pick the predicted starting index in setup's verified ladder from calibration and evals, honour explicit per-issue or per-user fixed choices, and record every route selection, boundary probe, and escalation in the goal ledger. Pin the calibration version this run uses — calibration produced near completion applies to the next run, never retroactively.

## Claim the run before you build

**Claim the root issue on the tracker as the run's first write, before planning** — and read the existing claim before writing it. An unclaimed issue is by definition takeable, so until the claim exists a concurrent run or a human sees the whole feature as available. Where the root or any planned child is already claimed by another run, stop and report who holds it.

The claim is a comment carrying harness, session id, run token and start time, not merely an assignee, because a binary claim cannot tell "someone else took this" from "I took this" when both runs authenticate as one account. Read [concurrency.md](references/concurrency.md) for the exact comment, the release protocol, the same-host lock, and the collision this design comes from.

Claim each unit again at its own dispatch: the root claim marks the feature, the unit claim marks the work in flight, and neither replaces the other. Release or leave the root claim per that tracker's convention at terminal state. Never close the root issue to signal progress — closure follows the human's merge decision.

## Phase 1: Plan first

Keep the planner read-only. Give it the issue, the repository, and only the compact historical calibration described in [model-routing.md](references/model-routing.md) — no proposed decomposition, no previous agent transcript — and require the structured contract in [planner-contract.md](references/planner-contract.md).

Publish a concise user-visible plan before implementation: initial dependency frontier, planned parallel/stack/serial waves, remaining critical path, rough ready-PR ETA. The issue's explicit test seams are already agreed; pause for user approval where the planner proposes new seams, changes acceptance criteria, finds an unresolved decision, or needs to create child tickets.

Choose work units dynamically: existing child issues where they are complete tracer-bullet tickets; one work unit where the supplied issue fits one fresh implementation context; the installed `to-tickets` workflow, and its approval step, for a feature too large for one context and lacking child tickets.

Never schedule an issue with an open native blocker, and never fall back to "least blocked". Predicted overlap in files, schemas, migrations, public APIs, or shared test seams is an execution dependency even where the tracker has no edge — and where several units write one file, each concurrent unit gets an explicit textual insertion anchor defined against its own base, per [planner-contract.md](references/planner-contract.md).

Verify any such prediction with a real merge in a disposable worktree, never by reading `merge-tree` output for marker strings.

## Phase 2: Prepare isolated Git state

Preserve unrelated user changes; stop where they overlap the planned work and cannot be isolated safely.

Mint one **run token** before the first branch or worktree exists — exactly five lowercase base-36 characters from real system entropy, never invented by the model:

```bash
LC_ALL=C tr -dc 'a-z0-9' < /dev/urandom | head -c 5
```

Record it in the ledger before creating any ref, and reuse that exact token for every branch, worktree path, and ledger entry for the rest of the run, including resumes and recovery agents. Never mint a second token for one run, or reuse one run's token in another. A resumed run without a recorded token is a different run: mint a fresh token and treat the lost run's refs as another agent's state.

Derive deterministic kebab-case branch names from the recorded token and reuse them when resuming. Under gitflow, unless repository policy says otherwise:

```text
develop
└── feature/<root-id>-<root-slug>-<run-token>                     integration branch/worktree
    ├── feature/<root-id>-<root-slug>-<run-token>-issue-<child-id> worker branch/worktree
    └── feature/<root-id>-<root-slug>-<run-token>-issue-<child-id> worker branch/worktree
```

Every worker branch and worktree name carries the run token, the root issue id, and the concrete child issue id — the token in the directory name too, so two runs on one issue never target one path. A deterministic unit id substitutes only where the work unit has no tracker issue.

The token makes concurrent runs safe and removes any excuse to adopt a ref this run did not create: a branch or worktree whose token is not this run's belongs to another run, so never check it out for writing, merge into it, delete it, or count it as evidence. A derived name that already exists is a token collision or an aborted predecessor — resolve it explicitly instead of writing into it.

Base every worker in a wave on the integration branch's same pinned commit. Two writing agents never share a branch or worktree. Keep the main checkout untouched where an integration worktree can serve.

After creating a worktree, start a new command in that directory before any checkout, merge, cherry-pick, rebase, commit, push, or test; never chain those from the creator worktree. Before composing an integration or PR branch, inspect the graph, the existing integration branch, current `develop`, and any existing PR, so an older merge or another agent's work is never silently replaced.

Launch every agent through the rules in [dispatch.md](references/dispatch.md) — redirect every stream, resolve prompt paths to absolute before any `cd`, pre-warm a new worktree's build, and confirm a launch by the agent's own first log event rather than the wrapper's exit status. Each of those failures is silent and costs a whole attempt.

Create the run ledger from [recovery.md](references/recovery.md) outside the repository, recording base SHA, policy sources, plan, branches, worktrees, unit status, tests, reviews, and integration evidence after every transition. Create the per-agent activity directories from [observability.md](references/observability.md) before dispatch: each agent gets only its own log destination and its exact harness/model/effort step, requires the same of every child it spawns, and a handoff without the terminal event or the model/effort pair is rejected.

## Phase 3: Implement the ready frontier

Work only the unblocked frontier, and **execute it at the width the planner specified**. Each wave carries a `mode`: `parallel` units dispatch together from the same pinned base; a `stack` unit is cut from the *preceding unit's branch head* so it extends that work instead of racing it, while its review and merge latency still overlaps; only `serial` runs alone. A unit left queued behind work it does not depend on is idle capacity, and the planner already weighed the merge risk the ordering was meant to avoid.

Exploit pipeline parallelism as well as unit parallelism: independent implementation, review, verification, and merge preparation may overlap where they use isolated worktrees and their dependency edges are satisfied. Schedule from the live dependency graph and current slot availability rather than the worst-case slot demand of every later stage — throttle new dispatches as completed units approach review capacity instead of reserving future review slots while ready implementers sit idle. Record every deliberate width reduction and its concrete constraint.

Two graphs govern this and are never conflated. A unit with an **open native tracker blocker** is never scheduled. A **predicted write conflict** is the planner's forecast: it selects `stack` or `serial`, and the orchestrator may promote it after inspecting the real diff — where the named symbols are untouched, run the units together and record the override.

Give an initial implementer exactly one work unit, its authoritative issue or spec text, agreed test seams, pinned base SHA, branch, worktree, and calibrated ladder step. A stacked unit additionally learns which sibling sits beneath it, that the sibling is unmerged, and which symbols to extend rather than rewrite. An escalation takes only the next verified ladder step and the artifact handoff in [implementer-contract.md](references/implementer-contract.md), which preserves inspectable evidence from earlier attempts without leaking conversation, private reasoning, or unsupported conclusions.

Each implementer reads and invokes the installed `implement` skill in the host's native syntax and follows [implementer-contract.md](references/implementer-contract.md): TDD and checks, full suite, the two-axis `code-review`, fixes, and a commit on its worker branch. It does not merge, push, close issues, or expand scope.

After that commit, dispatch the independent acceptance review in [review-contract.md](references/review-contract.md) as a standalone zero-conversation-context session — never a fork or resume of an implementation or planning session — preferring a verified different model family. The clean reviewer invokes Matt Pocock's installed `code-review` skill for Standards and Spec. Findings return to the implementer, and every re-review gets a new clean session.

Wait for both Standards and Spec reports before a normal fix pass: aggregate all actionable findings, fix them together, run the affected gates, then launch one fresh pair. Serialize the loop around whichever axis reports first only where the other route has definitively failed and recovery is already in progress.

Calculate concurrency continuously across active stages. Reserve the coordinator and the agents needed **now**, accounting for the two `code-review` leaves before admitting a stage that would contend with them: with four slots, three independent implementers plus the coordinator is valid, and so is one implementer plus two review leaves plus the coordinator. Refill released slots from the ready frontier as units change stage, preserve planner wave order where batching is unavoidable, and report the capacity constraint in the forecast.

Accept a worker branch only on complete evidence:

- clean worktree;
- committed, non-empty diff from its pinned base;
- targeted checks and full suite passed;
- Matt Pocock Standards and Spec reviews completed in an independent clean context;
- every acceptance criterion carrying an explicit pass/fail result backed by code or independently observed test evidence;
- every actionable finding fixed and re-reviewed.

Reject a terminal handoff that does not match the assigned task or state its exact worktree, branch, HEAD, clean/dirty state, checks, review result, and forbidden external mutations. An answer to stale conversation or an unrelated question is a failed attempt: preserve Git and test artifacts and dispatch a fresh recovery context automatically. No-commit, dirty-only, failed, or unreviewed branches never reach the merger.

## Phase 4: Merge through one owner

Give one merger exclusive ownership of the integration worktree, per [merger-contract.md](references/merger-contract.md).

Merge accepted worker branches serially in dependency order. Resolve conflicts by reading both issues and preserving both intents, using the repository's conflict-resolution skill where available. Verify after each risky merge, and run the combined full suite and static checks before accepting the batch.

After the last worker merge, run the same clean-context `code-review` over the combined integration diff against the pinned base, fixing and re-reviewing every actionable finding on the integration branch with a new clean session per pass.

Immediately before that final review, fetch the remote integration target and reconcile any advancement in the dedicated integration worktree: pin the new base and head SHAs, rerun affected gates, and review that exact range. Fetch again immediately before push, and where the target advanced after review, reconcile and repeat rather than publishing stale evidence. Discover conflicts with a real merge in the integration or a disposable worktree, never by grepping `merge-tree` text for markers.

Before opening the feature PR, update the dedicated model-telemetry section in every planned child issue with its feature-reviewed outcome. Then invoke `dynamic-skills-calibrate` in a separate fresh agent scoped to the root feature, requiring it to fetch every descendant, validate that all planned children are accounted for, and update the tracked `.agents/dynamic-implement/model-calibration.json` on the policy-compliant feature branch. Where that bookkeeping cannot complete, preserve the ready branch and report the exact blocker before creating the PR, unless the user explicitly opts out.

Prepare integration as repository policy directs. Where the PR or equivalent direct merge targets `develop` or `main`, open or update it, or prepare the exact local merge evidence, and stop at the gate — repository permission is necessary but never a substitute for the contemporaneous human decision. Internal worker merges into the feature or integration branch continue autonomously. Merge directly to a release branch only where policy and scope allow, and the gate applies wherever that branch later targets `main` or `develop`.

Construct PR titles, bodies, comments, and tracker text through an argument-safe mechanism: use the host or API's structured input, or a safely created body file, rather than passing Markdown with shell-interpretable characters through an interpolated command.

Prefix every externally visible agent-authored PR, issue, review-thread, and tracker comment with the author's recorded `agent_identity` followed by ` — `, unless the user specifies another identity. Recover a missing identity from this run's selected route and write it to the ledger before posting; an "unavailable" identity is never posted. The posting account identifies authentication, not authorship — an automated action never appears to be a human-authored response.

## Phase 5: Prove completion and replan

Update the tracker only from verified facts: per integrated issue, the branch/merge or PR evidence, test commands and results, and review outcome. Close an issue only once its change has reached the policy-defined integration target — a worker commit alone is insufficient.

Finalize the dedicated model-telemetry section in each integrated issue body as [model-routing.md](references/model-routing.md) specifies, recording every model/effort attempt, boundary probe, harness-reported cost, and final integration outcome, preserving all user-authored body content. The pre-PR calibration already saved the predicted minimum successful ladder step for the next run; reviewers never receive it.

Re-fetch issue state and run the planner again after each integration wave, continuing until all requested scope is integrated or a concrete user or external blocker remains.

Before claiming completion, audit every acceptance criterion against current files, tests, branch and PR state, issue state, and the run-owned Git cleanup ledger. Missing or indirect evidence means incomplete. Where a ready PR awaits the human merge decision, report `waiting-user` — not complete, not blocked — and keep tracker issues open unless repository automation closes them after the authorized merge. When the human authorizes agent execution, re-fetch the PR, target, head SHA, approvals and checks immediately before merging; material change invalidates the authorization and requires fresh evidence and a fresh decision.

After a human-authorized merge into `develop` or `main` is verified, perform run-owned Git cleanup without another pause. Fetch and prune, prove the merged target contains each recorded branch tip, inspect each exact worktree for clean status, then remove only clean worktrees and delete only merged local branches this run created — established from the ledger's **run token**, never from name similarity, so a ref or worktree carrying another token, or none, stays out of scope even where it names the same issue. Delete a run-created remote source branch only where its exact remote tip is also reachable from the merged target, policy permits, and the host has not already deleted it. Prune stale worktree and remote metadata. Fast-forward a clean, non-diverged local long-lived target to its remote, and never reset, rebase, force, or make unrelated branches "match". Recover dirty, unmerged, or uncertain run-owned items autonomously where non-destructive evidence permits; otherwise preserve them and request only the specific safety decision required. Record cleanup evidence in the ledger — the run is incomplete until every run-owned item is removed or the user chooses to retain it.

Where the user asks for a retrospective or a Dynamic Implement improvement, complete it before the final handoff: identify user corrections, classify each as a policy, observability, or execution failure, and update the installed skill with concise reusable safeguards only. Validate the revised skill, distinguishing pre-existing validator incompatibilities from new regressions.

## Stop conditions

Pause without guessing where:

- Git or integration policy is absent or contradictory;
- new test seams or product decisions need agreement;
- an issue has an open blocker;
- the planner, implementer, reviewer, or merger fails without producing trustworthy evidence;
- required credentials, permissions, or external systems are unavailable;
- combined verification is red;
- the private activity logger is unavailable, or a dispatched agent lacks its terminal event;
- a PR targeting `develop` or `main` is ready and awaiting the gate.

Report the exact blocker and preserve resumable state. A partial wave is never marked complete.
