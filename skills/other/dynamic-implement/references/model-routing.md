# Per-issue model routing

## Contents

- Final integration runs at the planner's tier
- Planner triage
- Choose the start step from evals
- Resolve the issue policy
- Escalate deliberately
- Learn from verified outcomes
- Dynamic implementation telemetry

Treat model selection as an issue policy. Logical tiers are portable; setup maps them to verified harness/model routes:

```text
T1  economical/default starting tier
T2  balanced escalation tier
T3  strongest verified tier
```

These labels are deliberately vendor-neutral ordinals. Do not reuse a vendor's model names for them; a tier label that collides with a real model id (or with the triage vocabulary `small`/`medium`/`large`) makes routing tables ambiguous to read.

These labels do not imply hard-coded model ids or providers. A profile may map two tiers to the same model when only one route is available, but it must disclose that no real escalation exists.

Treat model route and reasoning effort as separate routing dimensions. A route is the concrete harness plus model id; `effort` is the exact harness-native value used for that session. Never record a model without also recording effort. Use `unknown` when the harness cannot report the active value and `unsupported` when it exposes no effort control; never infer a value from model marketing names.

Setup must precompute one flat `escalationLadder` for each usable harness. Each entry contains the exact tier, route, model family/id, and effort. Order every verified effort for one physical route from cheapest/lowest to strongest, then move to the next genuinely distinct model route and restart at that route's lowest verified effort. Deduplicate identical `harness + model + effort` entries, including logical tiers that map to the same physical route. Runtime escalation selects the next entry only; it must not research or improvise a new route during implementation.

## Final integration runs at the planner's tier

The run's two ends are asymmetric with its middle, and for the same reason. A per-unit implementer works
inside one ticket behind an independent review, so a weak attempt is caught cheaply and the ladder exists
to climb on evidence. The **planner** and the **final integration step** are different: each produces one
output whose defects are amplified across every unit, and neither has a cheap downstream catch.

Honour `roleDefaults.finalIntegration` — the planner's tier, at high effort — for both the implementer
remediating a final-review finding and the merger reconciling the feature branch with a target that
advanced during the run. This does not change per-unit implementer or merger routing, and an economy
directive such as `startLowest` does not lower it, exactly as it does not lower the planner or the
reviewer.

The economics are not close. Final integration is one or two sessions against a run of dozens, so the
absolute cost of the strongest verified route there is negligible, while the blast radius is the whole
feature at the last writable moment before the human merge gate. Judge it the way you judge the
reviewer floor: on cost to a *correct* outcome, not price per session.

The work is also qualitatively different from per-unit work, which is the real argument. Reconciling a
whole feature against a moved target means holding two restructurings in mind at once and preserving
both intents — the failure mode is a merge that compiles, passes every gate, and has silently dropped
one side's behaviour. Nothing downstream detects that.

**Read the profile through its documented shape rather than guessing at it.** Both top-level collections
are JSON **arrays**, not objects keyed by harness, and they do not agree on the key that names the
harness: an entry in `harnesses` carries `name`, while an entry in `issueModelLadders` carries `harness`.
Indexing either as a mapping raises `TypeError: list indices must be integers`, and a coordinator that
discovers this by trial burns several attempts at exactly the moment it is choosing a route. The routing
fields — `escalationLadder`, `roleDefaults`, `triageMap`, `defaultStart`, `auxiliaryRoutes`,
`candidateEscalationSteps` — live on the `issueModelLadders` entry, **not** on the `harnesses` entry,
which holds installation facts (`executable`, `version`, `status`, `catalog`, `models`, `explicitEntry`).
Look each up by the key that collection actually uses:

```python
prof   = json.load(open(profile_path))                                    # schemaVersion 5
inst   = next(h for h in prof["harnesses"]         if h["name"]    == harness)  # catalog, models
ladder = next(l for l in prof["issueModelLadders"] if l["harness"] == harness)  # routes, roleDefaults
```

Setup owns this shape; when it changes, update this snippet in the same edit, because it is the only
place a coordinator can check the layout without opening a profile that may not exist yet.

Keep advertised but unverified candidates outside the usable ladder. Setup may persist them as `candidateEscalationSteps`, but Dynamic Implement must not select one automatically. If a desired next step is not live-verified, rerun setup with the user's approval for any paid probes.

Use only an unexpired, live-verified 14-day model-and-effort catalog produced by `dynamic-skills-setup`. The lease is per harness: check `catalog.expiresAt` on the harness you are about to use, and ignore the freshness of harnesses this run does not touch. Catalog freshness answers which route/effort combinations exist on this installation now. The tracked repository file `.agents/dynamic-implement/model-calibration.json` answers which portable model/effort combination comparable team work needed before. Keep those clocks and evidence stores separate. Never persist learned outcomes in an installed skill directory; a skill update must be replaceable without losing team knowledge.

## Planner triage

Before assigning implementers, give the fresh planner a compact, repo-scoped calibration summary derived only from completed historical units. Require one size classification per work unit:

- `small`: localized known pattern, one primary module/seam, low coordination risk, no public contract or persistence/concurrency change;
- `medium`: several modules or criteria, a shared interface, meaningful integration/testing work, or one unfamiliar risk;
- `large`: cross-cutting protocol/schema/migration/concurrency/safety behavior, several interacting seams, or high-cost failure analysis.

Large is a capability/risk classification, not permission to reinterpret an oversized ticket. If a `ready-for-agent` child cannot fit one fresh implementation context, stop it for HITL and ask the human to repair the decomposition through `to-tickets`; never split it inside Dynamic Implement.

The planner itself uses the profile's verified planning step so model selection is not circular. **Default the planner to the strongest verified tier `T3`, at that route's second verified effort rather than its lowest** (user directive, 2026-08-02) — the same asymmetry as final integration above, for the same reason: one output amplified across every unit it schedules, with no cheap downstream catch, from a session that runs for minutes once per wave. Plan defects are reasoning failures rather than knowledge failures — a missed dependency edge, a conflict predicted at file granularity when the real unit is a symbol, a unit sized for the wrong context window — and they surface late, after implementers have been dispatched against them. That is why the planner does not start at the ladder floor the way an implementer does.

A repository or user economy preference such as `startLowest` governs **implementer** routing and must not be applied to the planner; a `triageMap` collapsed onto a single tier likewise never lowers the planner. Only an explicit user instruction naming the planner role may set it below `T3`. A planner failure is a clean retry at the same fixed step, never an escalation; see Escalate deliberately. The planner returns size, concrete risk factors, confidence, and stable calibration keys. It does not select vendor model ids or effort values. Map its triage to the first matching implementer step in the precomputed ladder, defaulting to `small -> T1`, `medium -> T2`, and `large -> T3`, at that route's lowest verified effort. An explicit per-issue user/model/effort policy still wins. Configure the merger independently; reviewer routing follows `review-contract.md` rather than this size map.

## Choose the start step from evals

Do not default every issue to the first/lowest ladder entry. Resolve the planner's size, risk factors, calibration keys, and harness against completed eligible telemetry. Calibration returns a predicted starting step plus confidence for each comparable group. Start at that predicted step when confidence is sufficient; otherwise use the configured size-to-tier default and its lowest verified effort.

The predicted step is the one **cheapest to a clean accepted outcome**, which is not always the lowest ladder index. A weak step that needs extra turns, capability retries, fix passes, and the re-reviews those fixes force can cost several times a stronger step that lands the unit in one pass, so calibration scores whole units — every attempt they consumed — rather than a single winning attempt. When calibration therefore recommends a step above the economy default, honour it and record the economic ground in the ledger; a `startLowest` preference means cheapest, not lowest-indexed.

Learn the boundary without forcing every issue to fail. A calibration group may schedule at most one controlled boundary probe one ladder step below its predicted minimum when all of these are true: the lower step is verified, the unit is reversible and not safety/high-risk work, no unresolved dependency or production mutation is involved, and that group lacks a recent conclusive lower-bound observation. Mark the attempt `purpose: boundary-probe`. If it fails for a model-capability reason, immediately continue at the predicted step and treat the failure as useful boundary evidence, not as a reason to restart at the bottom. If it succeeds cleanly, record evidence that the start floor may be lowered. Never repeat the same lower-step probe on every issue; calibration owns its exploration cadence.

User-fixed model or effort policy disables boundary probing unless the user explicitly requests an eval. Reviewer sessions are never boundary probes.

## Resolve the issue policy

Use this precedence:

1. the user's explicit model/harness instruction for the issue;
2. the user's explicit effort instruction for the issue;
3. a repository-documented issue field or label such as `model:t1`, `model:t2`, `model:t3`, `model:fixed`, `effort:low`, or `effort:fixed`;
4. the capability profile's default issue ladder.

Do not invent tracker labels or change an issue's policy silently. Track model and effort policies independently. With model `auto`, start at the selected tier; with model `fixed`, never change the physical route without user approval. With effort `auto`, start at the lowest verified effort for that route; with effort `fixed`, never change effort without user approval.

Record in the goal ledger:

```text
modelPolicy: auto | fixed
effortPolicy: auto | fixed
issueStartTier: T1 | T2 | T3 | explicit route
issueStartEffort: exact native effort | unknown | unsupported
currentStepByRole: planner/implementer/reviewer/merger tier, route, model, effort, ladder index
attempts: role, unit, tier, harness, model family/id, effort, outcome
escalations: dimension=effort|model, from, to, evidence, timestamp
```

Reviewer selection remains independent under `review-contract.md`; never tell a reviewer that an implementation was escalated.

## Escalate deliberately

**The implementer is the only role that climbs the ladder.** Planner, reviewer, and merger run at fixed
routes from the profile's `roleDefaults` and do not escalate. Their failure path is a clean retry at the
same step in a fresh agent, then a reported blocker — never a step up.

Each has its own reason:

- **Reviewer** — an escalating reviewer is shopping for a verdict. Escalation means "the last one was not
  good enough", so raising the route because a reviewer *found* something corrupts the independence the
  review exists to provide. Fix the finding or dispute it on evidence; do not re-run the judgement on a
  stronger model hoping for a different answer. The floor exists so the first verdict is trustworthy.
- **Planner** — already at the strongest verified tier, so there is nowhere to climb, and it runs once per
  wave.
- **Merger** — fixed, but may be **two-state on an observable condition**: run the floor route for a clean
  merge and the profile's `conflictTier` when the merge actually conflicts. This is not ladder climbing —
  the route is chosen before the work from a visible fact, not from a failure. Clean merges are mechanical;
  resolving a semantic conflict means reading both issues and preserving both intents, and a silently
  dropped intent can leave the whole suite green.

A **route that is unavailable** is a third case, distinct from both retry and escalation, and the fixed
roles need it precisely because they may not climb. Provider overload, a revoked credential, an exhausted
quota or a sandbox that cannot reach the network says nothing about whether the model was capable - so
neither a lower step nor a higher one is the answer. Move to the **same logical tier on another verified
harness** and record it as a route change, not an escalation: the role's policy is preserved exactly and
nothing about the tier decision has been reopened. One run took two consecutive `529 Overloaded` failures
on its planner route, confirmed with a trivial probe that the route itself was alive, and completed
planning on the other harness's T3 step at the same effort. Mark every such attempt calibration-ineligible;
learning it as a capability failure would teach the next run to start higher for no reason.

The rest of this section governs the implementer.

Retry once at the same route-and-effort step in a new clean agent only when failure may be transient. When trustworthy evidence indicates reasoning/capability insufficiency, advance to the next precomputed ladder step. Advance effort on the same model before changing models. A valid material non-clean review/fix pass is an early signal: raise effort one step before the next fix/re-review pass when a higher verified effort exists. Change models only after the current route's verified effort steps are exhausted and model-escalation evidence exists, for example:

- two malformed, contradictory, or null planner contracts;
- two implementation attempts that produce no usable commit or repeat the same substantive failure;
- two valid material non-clean review/fix passes occur after available same-model effort increases, even when later passes expose different findings;
- repeated context/capability failure that the next verified tier is documented to improve.

Do not escalate effort or model for ordinary red-first TDD, a newly discovered real defect, missing credentials, unavailable services, merge conflicts, environment failures, unclear requirements, or user decisions. Route those through normal work or blocker handling.

Every effort or model escalation starts a new clean agent at the selected ladder step. Give it authoritative issue/spec context plus an artifact-based handoff: current repository/worktree and commit SHAs, previous route/effort attempts, failing commands and outputs, raw review reports, acceptance rows, attempted fix commits/diffs, and concise factual decisions with source citations. This evidence lets the new attempt learn without inheriting the previous conversation. Exclude transcripts, private reasoning, chain-of-thought, unsupported conclusions, and claimed results that cannot be inspected. Preserve the worktree when safe; never discard useful unintegrated commits.

Once the implementer escalates for an issue, keep its resulting route-and-effort step for later units unless the user explicitly resets it. Fixed roles never carry an escalated step because they never take one. When moving to a genuinely stronger model, start at that model's lowest verified effort. Never reset effort when two logical tiers map to the same physical model. Start the next issue from its own policy again.

At the final verified ladder step, perform the allowed clean retry. If the same failure persists, preserve state and report the concrete blocker; never loop indefinitely or claim that a nominal tier or effort change improved capability when it mapped to the same concrete step.

## Learn from verified outcomes

After all work units are accepted into the feature branch and its combined review passes, write one telemetry record per child to the run ledger. If `telemetryPolicy.trackerComments` is `allow` and its scope covers this repository, upsert that record in one dedicated child-ticket comment using these markers:

````text
<!-- dynamic-implement:model-telemetry:v1:start -->
## Dynamic implementation telemetry
```json
{ ... }
```
<!-- dynamic-implement:model-telemetry:v1:end -->
````

This is setup consent for lifecycle evidence, not permission to alter the ticket contract. Never put telemetry in the title, body, acceptance criteria, dependency edges, or labels. When consent is absent, denied, or out of scope, write no comment and continue with ledger telemetry only.

The JSON contains:

- repo and issue/unit ids;
- planner size, risk factors, confidence, and calibration keys;
- start and final tiers/routes/efforts by role;
- capability-driven retry/escalation counts and reasons;
- review finding/fix counts and acceptance result;
- model family/id plus token, credit, cost/currency, and duration metrics only when the harness reports them;
- final integrated outcome.

Use this stable shape so later calibration is deterministic:

```json
{
  "schemaVersion": 2,
  "updatedAt": "RFC-3339",
  "evidenceStage": "feature-reviewed|integrated",
  "repo": "owner/name or stable local id",
  "issue": "42",
  "triage": {
    "size": "small|medium|large",
    "riskFactors": [],
    "confidence": "low|medium|high",
    "calibrationKeys": []
  },
  "attempts": [
    {
      "role": "planner|implementer|merger|reviewer",
      "tier": "T1|T2|T3|explicit",
      "harness": "name",
      "routeId": "harness:model",
      "modelId": null,
      "modelFamily": "reported family or unknown",
      "effort": "native value|unknown|unsupported",
      "ladderIndex": null,
      "purpose": "delivery|boundary-probe",
      "outcome": "success|retry|failed|blocked",
      "capabilityFailure": true,
      "usage": {
        "inputTokens": null,
        "outputTokens": null,
        "credits": null,
        "cost": null,
        "currency": null,
        "durationMs": null
      }
    }
  ],
  "escalations": [{"dimension": "effort|model", "from": {}, "to": {}, "evidence": "", "timestamp": "RFC-3339"}],
  "review": {"standardsFindings": 0, "specFindings": 0, "fixPasses": 0},
  "acceptancePassed": true,
  "integration": {"target": "develop", "evidence": "feature commit, PR, or merge id", "outcome": "feature-ready|integrated"},
  "calibrationEligible": true,
  "exclusionReason": null
}
```

Represent unknown metrics as `null`; never estimate or fabricate them. Include `calibrationEligible` and an exclusion reason so infrastructure, credential, ambiguity, user-pause, and other non-model failures are not learned as capability failures.

Fetch comments immediately before writing. Update only the agent-owned comment containing the exact markers and matching repo+issue; otherwise create it. Re-fetch and verify the bounded JSON. Never edit user comments or use ticket-body fallback.

Never store prompts, chain-of-thought, secrets, source code, or reviewer prose in telemetry.

After all planned children are merged into the feature branch and the combined independent review/acceptance matrix passes, mark every child's ledger telemetry `evidenceStage: feature-reviewed` with outcome `feature-ready`, then mirror consented comments. Before the feature PR is opened, invoke the separate `dynamic-skills-calibrate` skill in a fresh agent scoped to the root issue and explicit ledger bundle. It reconciles the full descendant graph, learns the smallest successful route-and-effort combination for comparable work, applies multi-issue thresholds, and atomically updates the repository-owned `.agents/dynamic-implement/model-calibration.json` on the policy-compliant feature branch. This tracked file—not a personal cache or the skill itself—is the source of truth for the next run. Pin the current run to the calibration version it started with.

After policy-defined integration, update the same ledger records to `evidenceStage: integrated`, record final PR/merge evidence, and mirror consented comments. A later calibration may supersede the provisional feature-ready observation, keyed by issue id so it is updated rather than double-counted. User overrides always win, and reviewer routing stays blind to triage and escalation history.
