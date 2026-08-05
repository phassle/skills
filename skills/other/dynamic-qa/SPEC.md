# dynamic-qa buildable specification

Status: approved planning artifact for implementation. Source decision:
[Assemble the buildable spec](https://github.com/phassle/VibeFileSync/issues/104).

## 1. Destination

Build and pilot a two-skill `dynamic-qa` bundle:

- `qa-setup`: a human-in-the-loop contract-and-CI design workflow operated by
  the customer's responsible QA Owner.
- `qa-generate`: agent-driven generation plus an explicit diagnose-before-repair
  mode.

The skills turn 5–10 QA-approved critical flows into deterministic,
customer-owned regression tests at the cheapest level that proves each declared
outcome. Ordinary PR and scheduled runs use the customer's existing test harness
and CI without an LLM or browser agent. Flow data, generated tests, safety policy,
and provenance live in the customer repository.

`dynamic-qa` complements agentic QA services: it owns the small deterministic
critical-flow core; an agentic service may provide exploration or suggestions
through an explicit trigger, but is never required at run time.

The build must support brownfield and greenfield repositories. The first pilot is
brownfield VibeFileSync. Building a hosted QA product, daemon, runner fleet,
control plane, or mandatory GitHub App is forbidden.

## 2. Product contracts

These are release-blocking invariants:

1. **Flow Definitions are authoritative.** A generated or adopted test is a
   replaceable Binding. Generation and repair cannot silently alter an Expected
   Outcome, tolerance, Boundary Declaration, Flow State, Test Level Override,
   quarantine, or required-check policy.
2. **Deterministic before AI.** AI is allowed during setup, generation, and an
   explicitly invoked repair. Ordinary CI is deterministic and never calls a
   model or browser agent.
3. **Existing infrastructure first.** Reuse the customer's harness, CI provider,
   runners, environments, identities, fixtures, reporting, and stable test-hook
   convention. A new ordinary development dependency requires QA Owner and
   Technical Owner approval and evidence that the current stack cannot express
   the flow safely.
4. **Proposal only.** Both skills emit reviewable patches. Neither pushes to a
   protected branch, merges, changes branch protection, provisions secrets, makes
   a check required, applies a repair, or quarantines a flow.
5. **Safe execution is fail-closed.** No process may combine attacker-controlled
   content or executable code with privileged identity, broad filesystem access,
   or unrestricted network reach.
6. **Failures stay failed.** Retry, diagnosis, repair verification, or quarantine
   never changes the original failed attempt to green.
7. **Provenance is deterministic.** Every active Binding is traceable to its Flow
   Definition revision and digest, origin tickets, data and schema digests,
   selected test level, generator/adoption identity, execution profile, inputs,
   and output files. Drift fails before test execution without AI.
8. **The QA Owner owns policy.** The responsible QA Owner selects flows and owns
   outcomes, tolerances, boundaries, lifecycle, promotion, and quarantine. The
   Technical Owner approves harness, dependency, execution, and CI consequences.

## 3. Domain language

This is a separate bounded context from VibeFileSync; do not add these terms to
the root `CONTEXT.md`.

| Term | Meaning |
| --- | --- |
| Responsible QA Owner | Primary operator and accountable owner of the critical-flow contract. |
| Technical Owner | Approver for harness, dependency, environment, identity, runner, and CI consequences. |
| Setup Inventory | Ephemeral, sourced facts about the repo, harness, CI, environment, and existing coverage; never policy. |
| Candidate Flow | Possible critical flow being ranked before approval. |
| Flow Definition | Strict, tech-neutral, repo-owned source-of-truth contract for one flow. |
| Expected Outcome | Observable result a Binding must prove. |
| Boundary Declaration | Owner-approved decision to keep a dependency real, simulate it, or forbid it. |
| Named Data Set | Strict, non-secret cases referenced by stable ID. |
| Binding | Generated or adopted framework-specific test code realizing a Flow Definition at one test level. |
| Flow State | QA-owned lifecycle: `draft`, `deferred`, `active`, or `retired`. |
| Binding Freshness | Mechanically derived state: `absent`, `current`, or `stale`. |
| Enforcement State | Provider policy: `advisory` or `required`. |
| Activation Proposal | Reviewed change that proves activation conditions and lands the active Flow Definition, Binding, provenance, and CI enrollment together. |
| Qualifying Run | Complete, comparable run eligible as brownfield burn-in evidence. |
| Promotion | Explicit reviewed movement from advisory to required enforcement. |
| Execution Profile | Strict policy for paths, commands, environment, network, identities, side effects, resources, and evidence. |
| Capability Gate | Fail-closed proof that every mandatory Execution Profile control is enforceable. |
| Safety Blocker | Exact unmet or violated control that stops work or defers activation. |
| Failure Evidence Bundle | Scrubbed provider artifact tying failure facts to immutable source, Flow, Binding, environment, provenance, and profile identities. |
| Diagnosis Record | Machine-readable causal decision with evidence, counter-evidence, owner, repeatability, status, and next action. |
| Repair Proposal | One narrow, verified, reviewable patch for one confirmed Binding-owned cause. |
| Quarantine Record | Expiring, owner-approved enforcement exception that remains visible as missing protection. |

Do not use “healing” as a synonym for repair. Do not use “mock” as the umbrella
term for a real/simulated/forbidden boundary. Do not call Drift a product
regression.

## 4. Distribution and installation

Ship two complete, independently loadable skill directories as one versioned
bundle:

```text
qa-setup/
  SKILL.md
  references/
  assets/schemas/
  assets/providers/github-actions/
  scripts/
qa-generate/
  SKILL.md
  references/
  assets/schemas/
  scripts/
```

Each directory is self-contained after installation. Shared generated schema or
reference copies come from one build source and a packaging check proves them
byte-identical; installed skills must not reach into a sibling directory.

Publish a Codex-compatible build and a shared Agent Skills build, matching the
existing Dynamic bundle's split. Install both skill directories into the same
personal or project skill root as `dynamic-implement`, `dynamic-skills-setup`,
and `dynamic-skills-calibrate`. The supported destinations and skills-CLI flow
are those in [Dynamic Implement's bundle guide](https://github.com/phassle/VibeFileSync/blob/develop/docs/dynamic-skills/README.md).
OpenCode releases also include explicit command adapters named qa-setup.md and
qa-generate.md. No third `qa-heal` skill is shipped.

Both skills require explicit user or coordinator invocation. Natural-language
intent alone cannot start setup, generation, repair, verification, or an external
write. Dynamic Implement may invoke them explicitly for a ticket referencing a
Flow ID, but their review and safety gates still apply.

### Installation precondition: a verified Dynamic setup profile

Neither skill establishes its own harness capability. Both depend on
`dynamic-skills-setup` having been run for the current repository and harness, and
they read the profile it writes rather than probing routes themselves. That skill is
also the single place this bundle's dependency on Matt Pocock's engineering skills is
proved: it verifies `implement`, `tdd`, `code-review`, and `setup-matt-pocock-skills`
are installed, and stops with the exact host install command when they are not.

The dependency is therefore expressed once, through setup, and not restated as a
second inventory here. `qa-setup` and `qa-generate` require, before their first
mutation:

- a setup profile that is present, schema-current, unexpired, and `verified` for the
  harness the run will actually use — the same freshness contract Dynamic Implement
  applies;
- Matt Pocock's engineering skills recorded as installed by that profile, because both
  workflows hand their diffs to `code-review` in a fresh zero-history context and
  neither may substitute a simplified local review;
- the review routes that profile selected, since a Binding proposal is reviewed under
  the same route policy as an implementation.

When any of those is absent, stale, or unverified, stop before mutating the repository,
name the specific missing evidence, and return the host's exact manual
`dynamic-skills-setup` command. Never invoke setup automatically, never substitute a
generic native subagent for the review context, and never continue with a partial
profile — a QA bundle that generates Bindings it cannot get independently reviewed is
the failure this precondition exists to prevent.

Bundle releases carry one semantic version and immutable content digest. A newer
bundle alone does not make a Binding stale; only an unsupported or explicitly
incompatible schema, generator, or adapter contract mandates regeneration.

## 5. Customer-repository artifacts

`qa-setup` creates the smallest applicable subset. Unknown keys and schema
versions fail closed.

```text
qa/
  flows/<flow-id>.yaml
  data/<data-set-id>.yaml
  execution-profiles/<profile-id>.yaml
  quarantines/<flow-id>.yaml
  schemas/
    dynamic-qa-flow-v1.schema.json
    dynamic-qa-data-v1.schema.json
    dynamic-qa-execution-profile-v1.schema.json
    dynamic-qa-baseline-plan-v1.schema.json
    dynamic-qa-provenance-v1.schema.json
    dynamic-qa-quarantine-v1.schema.json
    dynamic-qa-failure-evidence-v1.schema.json
    dynamic-qa-diagnosis-v1.schema.json
    dynamic-qa-result-envelope-v1.schema.json
  baseline-plan.yaml
  provenance.json
```

Generated or adopted Bindings remain in the customer's existing test layout.
Provider-native CI remains in its normal location. For GitHub Actions the default
new workflow is `.github/workflows/dynamic-qa.yml`; amending a suitable existing
workflow is preferred when smaller and clear.

The Setup Inventory and Setup Review Packet are review surfaces, not additional
sources of truth. Failure Evidence Bundles, Diagnosis Records, Result Envelopes,
and Repair Review Packets are size-bounded provider/run artifacts or proposal
attachments, not routine Git history. Durable Git/provider audit history retains
only identity, digest, result, approval, and decision metadata.

### 5.1 Flow Definition v1

Use strict YAML, one file per flow. The filename equals the immutable Flow ID.
IDs are semantic, never derived from issue numbers, never reused, and never
renamed. Titles may change. Required fields:

- immutable `schema`, `id`; monotonically increasing integer `revision`;
- `title`, `intent`, `criticality`, and `state`;
- `origin.tickets` as stable URIs;
- `test_level.selection: inferred`, or an approved override with `value` and
  `reason`;
- referenced `data_sets`;
- `boundaries`, each with stable ID, system, `real | simulated | forbidden`
  treatment, tech-neutral behavior, and side-effect policy;
- Given/When/Then-shaped `steps`, each with stable ID and intent;
- one or more stable Expected Outcome IDs on each `then` step, and optionally on
  intermediate checkpoints;
- optional tolerance attached to exactly one Expected Outcome.

The format is inspired by Gherkin readability but has no Cucumber runtime or
human-maintained step definitions. Selectors, routes, commands, fixtures, waits,
framework syntax, and CI details are invalid in a Flow Definition. Product-facing
interface language is allowed when the interface itself is the declared contract.

Expected Outcomes use product language and scalar `${case.<field>}` substitution
only. No expression language exists. No tolerance means exact. v1 tolerance kinds
are `exact`, `normalized-text`, `numeric`, `temporal`, `unordered-set`,
`presentation`, and `custom`. Non-exact kinds require bounded parameters or a
plain-language allowance. `custom` requires explicit QA Owner approval.
Presentation tolerance may ignore layout, style, or position; it cannot relax
content, behavior, accessibility semantics, counts, or values.

YAML aliases, custom tags, executable expressions, duplicate keys, unknown keys,
and unsupported schemas are invalid. Canonical digests are computed from the
validated parsed representation, not formatting.

### 5.2 Named Data Set v1

One strict YAML file contains named cases under an immutable data-set ID. Only
scalar substitution is supported. Values are non-secret and environment-neutral;
URLs, selectors, commands, adapter settings, and secret values are forbidden.
A field may name an approved secret handle, never its value. Every test case uses
a unique per-run namespace and declares cleanup capability in its Binding/Profile.

### 5.3 Execution Profile v1

Each strict profile declares handles and policy, never secret values:

- owners, allowed phases and test levels;
- runner class, disposability evidence, sandbox mechanism, OS/container limits;
- allowed read/write paths and commands;
- process, CPU, memory, file-size, and wall-time limits;
- approved non-production identifiers and positive-deny production/metadata IDs;
- network `none | exact-allowlist`, origins/services, DNS/redirect/private-range
  rules, and external enforcement evidence;
- allowed Boundary IDs, reversible side effects, namespace, cleanup, rate, and
  concurrency;
- credential handle, audience, scopes, lifetime, injection phase, and revocation;
- diagnostic classes, capture conditions, scrubber, size, audience, and retention;
- provider adapter plus evidence for every required capability.

Provider adapters may strengthen a profile, never omit or weaken it. Missing or
unknown evidence is `unmet`.

### 5.4 Baseline Plan v1

The plan records pilot/repository identity, owners, metric definitions, exact
queries and denominators, collection window, current observations, provenance,
and readiness `measurement-required | ready`. It distinguishes `unknown`, zero,
and `not-applicable`. Every observation carries source, collection interval, and
timestamp. `qa-setup` writes `measurement-required` and pauses when required
evidence is absent; a later explicit invocation resumes from the plan and changes
readiness only when every gate is evidenced and approved.

Required metrics are named-flow coverage, escaped regressions, comparable PR-check
p95 duration, false-positive/flaky failure rate, active human maintenance time,
and repair decisions accepted unchanged/edited/rejected.

### 5.5 Provenance Manifest v1

The customer file `<repository>/qa/provenance.json` is strict and deterministically
ordered. Each current or adopted Binding records:

- Flow ID, revision, canonical digest, and origin ticket URIs;
- data and schema IDs/digests;
- selected test level and inference or override rationale;
- source commit assessed;
- bundle/generator version and content digest;
- coding harness/model used for authoring, or explicit adoption identity;
- framework/adapter identity and version;
- relevant harness/config/lockfile paths and digests;
- output paths and content digests;
- conservative product-impact paths;
- base advisory/required lane;
- Execution Profile ID and digest.

Runtime results never enter this file. Direct customer edits are allowed, but
drift blocks until an explicit adoption or repair proposal verifies the edit and
updates provenance.

### 5.6 Failure, diagnosis, result, and quarantine schemas

The Failure Evidence Bundle records immutable run/source/environment identities,
original failed conclusion, Flow/step/outcome/Binding/provenance/profile mappings,
normalized JUnit facts, safe expected-versus-observed facts, attempts, fixture and
boundary enforcement, environment health, and digest-addressed approved
diagnostics. It excludes secrets, production data, unrestricted bodies, whole
workspaces, and unscrubbed evidence.

The Diagnosis Record stores:

- Failure Owner: `product | binding | environment | unresolved`;
- Repeatability: `deterministic | intermittent | unknown`;
- derived Failure Class;
- status: `confirmed | provisional | safety-blocked`;
- causal chain, evidence, counter-evidence, affected IDs, and next action.

The Result Envelope is small, non-executable, schema-validated, size-bounded, and
tied to repository, source SHA, workflow/run, and artifact digest. A privileged
lane may consume only this envelope or recompute the result.

A Quarantine Record includes Flow/Binding/provenance identities, originating
failure and diagnosis, owner/class, tracked issue, accepted risk, start, expiry,
accountable owner, and requested effective advisory lane. Provider review/audit
evidence proves approval; the YAML cannot approve itself. Default expiry is seven
days. Expired or mismatched records fail closed. Quarantine never counts as pass,
coverage, or a Qualifying Run.

## 6. `qa-setup` SKILL.md outline

### Frontmatter and entry

- Name: `qa-setup`.
- Description: create or resume the QA-owned critical-flow contract, safe execution
  profiles, measurement plan, and provider-native CI proposal for the current repo.
- Explicit invocation only.
- Requires the installed `grilling` and `domain-modeling` skills. Uses the repo's
  issue tracker and documented Git workflow. It never creates its own product
  backlog.
- Requires a verified `dynamic-skills-setup` profile, per `## 4. Distribution and
  installation`. The profile is the sole source of harness capability, review routes,
  and the proof that Matt Pocock's engineering skills are installed; setup is never
  invoked automatically from here.

Entry forms:

```text
qa-setup
qa-setup resume
qa-setup review <flow-id>
```

The no-argument form discovers whether setup is new or resumable and presents the
evidence. `resume` requires an existing Baseline Plan or unmerged setup patch.
`review` reopens one exact Flow Definition through the same authority gates. No
entry invokes `qa-generate` implicitly.

### Required workflow

1. **Orient and establish authority.** Identify the responsible QA Owner,
   Technical Owner, safe non-production environment/identities, forbidden data,
   endpoints, effects, and brownfield/greenfield posture. Stop with a readiness
   checklist if no accountable QA Owner is present or safe execution is impossible.
2. **Inventory facts read-only.** Inspect application surfaces; current tests and
   proven outcomes; frameworks; fixtures; mocks; clocks; cleanup; reporting; stable
   hooks/accessibility conventions; CI provider, triggers, jobs, runners, services,
   environments, merge queue, checks, artifacts, secret names; issue sources;
   regression/flake/runtime evidence; and safe startup paths. Mark each fact
   `observed`, `reported`, or `unknown`.
3. **Enter through posture-specific evidence.** Brownfield compares observed behavior
   with QA-approved intent and identifies adoptable tests. Greenfield uses approved
   tickets/examples, leaves unimplemented flows deferred, and invents no bindings.
4. **Rank broadly, then refine.** Recommend the 5–10 highest-risk/value Candidate
   Flows using failure impact, frequency, change exposure, escape history, cheaper
   coverage, and origin tickets. The QA Owner decides; never pad a small product.
5. **Interview one flow at a time.** Resolve identity, intent, Given/When/Then,
   Expected Outcomes, Named Data Sets, every boundary/side effect, per-outcome
   tolerances, inferred-level policy or justified override, readiness, and exact YAML
   Flow Review. Ask one question at a time with an evidence-backed recommendation.
6. **Reconcile the portfolio.** Expose duplicates, contradictions, all boundaries,
   shared real dependencies, data isolation, states/blockers, existing tests to
   adopt, PR-fast/nightly candidates, and at least one genuine end-to-end journey
   when the journey is itself required evidence.
7. **Define safe execution.** Emit Execution Profiles and run the Capability Gate.
   Any unmet mandatory control keeps the flow deferred.
8. **Establish measurement readiness.** Compute available baselines. If evidence is
   missing, propose `qa/baseline-plan.yaml` with readiness `measurement-required`,
   pause, and later resume. Never invent a number or treat missing as zero.
9. **Design CI last.** Propose the smallest provider-native change: PR-fast,
   nightly-full, manual/API trigger, merge-queue trigger when present, JUnit,
   annotations, summary, bounded artifacts, existing runners/environments, and
   measured sharding only.
10. **Review once, then emit.** Present one Setup Review Packet with exact contract,
    data, schemas, profile, harness, CI, dependency, safety, runtime, and handoff
    diffs. Require separate Contract and Technical approvals. Emit one patch and
    stop.

During discovery the skill writes no repo files, provisions nothing, and changes no
provider policy. Observations are evidence, never intended behavior. Disagreement,
unobservable outcomes, absent stable interaction points, missing isolation/cleanup,
production-only reach, real third-party effects, or unapproved dependencies become
exact blockers—not weaker outcomes or wider tolerances.

### Setup outputs

- approved Flow Definitions and Named Data Sets;
- pinned schemas and deterministic validation/drift command;
- Execution Profiles and Capability Gate evidence;
- Baseline Plan when measurement is required;
- minimal existing-harness amendments;
- provider-native CI proposal;
- explicit handoff list for `qa-generate`.

The skill stops after the proposal. It does not generate Bindings, merge, activate
required checks, or run the pilot.

## 7. `qa-generate` SKILL.md outline

### Frontmatter and entry

- Name: `qa-generate`.
- Description: generate/adopt deterministic Bindings for approved Flow Definitions,
  or diagnose a deterministic CI failure and propose a guarded Binding repair.
- Explicit invocation only; default is generation, never repair.
- Follows the repository's Git workflow and issue/ticket links. It operates only in
  an isolated authoring worktree and approved candidate-verification environment.
- Requires the same verified `dynamic-skills-setup` profile as `qa-setup`, per
  `## 4. Distribution and installation`. Generation and repair both hand their diff to
  Matt Pocock's `code-review` in a fresh zero-history context, so an absent or stale
  profile stops the run before it authors a Binding.

Entry forms:

```text
qa-generate <flow-id>
qa-generate --all-ready
qa-generate repair --evidence <bundle-path-or-provider-run>
```

`--all-ready` handles only approved flows whose activation conditions are evidenced;
it stops per flow on blockers and never turns “all” into policy approval. Repair
requires an explicit evidence source and pursues one causal hypothesis.

### Generation workflow

1. Validate schemas, Flow State, approvals, origin tickets, data, Execution Profile,
   Capability Gate, source commit, existing harness, and current provenance. Draft
   flows stop; deferred flows require a complete Activation Proposal.
2. Reuse an existing deterministic test if it already proves every Expected Outcome.
   Otherwise inspect the existing harness and generate the smallest Binding that
   fits its conventions.
3. Infer the cheapest deterministic level that proves all outcomes. Discard any
   level lacking observability, safety, boundary fidelity, or capability. Compare
   reuse, runtime, fixture complexity, and maintenance cost; no universal API-vs-CLI
   ordering is assumed. A reviewed override wins. Preserve a true end-to-end path
   when the journey itself is the evidence.
4. Map every generated drive/observation/assertion to stable Flow step and Expected
   Outcome IDs. Realize Boundary Declarations exactly. Keep selectors, routes,
   commands, fixtures, waits, and framework syntax inside the Binding.
5. Update the Provenance Manifest and deterministic CI enrollment in the same patch.
   Brownfield candidates enter advisory; a first active greenfield Binding defaults
   to required unless repo governance records an explicit exception.
6. Verify the candidate on the pinned source commit in the approved sandbox. Run the
   affected flow, negative controls for proof obligations, neighboring flows, drift
   gate, and the smallest relevant existing suite.
7. Present a review packet with level rationale, Flow-to-Binding mapping, exact diff,
   profile/capability evidence, test results, provenance, dependency/CI consequences,
   residual risk, and approvals. Emit a patch and stop.

Generation never writes placeholders, skipped/fixme tests, knowingly non-executable
tests, or invented greenfield implementation details. It never substitutes a
simulated system for the owned outcome being proved.

### Repair workflow

1. Validate the Failure Evidence Bundle, source/environment identity, profile,
   provenance, schema, diagnostic scrub, and original failed conclusion. A mismatch
   is a Safety Blocker.
2. Reconstruct the exact step, Expected Outcome, tolerance, boundary, data case, and
   selected-level proof obligation. These contracts are read-only.
3. Diagnose on independent axes: Failure Owner and Repeatability. Use existing
   evidence first; if permitted, run one unchanged reproduction and one focused
   hypothesis probe on fresh namespaces. Emit a Diagnosis Record with evidence and
   counter-evidence.
4. Only `confirmed + binding-owned` crosses into repair. Product Regression,
   Environment Failure, unresolved/provisional diagnosis, or any Safety Blocker
   stays failed and is routed to the responsible owner with no Binding patch.
5. Propose one path-scoped repair. Allowed changes are mechanical: approved stable
   locator binding, concrete readiness wait, syntax/parsing/assertion implementation,
   deterministic fixture isolation/clock/randomness, approved fake/owned-service
   routing, adapter compatibility, and provenance.
6. Verify the exact failure, a deterministic negative control, neighboring tests,
   protected-contract digests, safety/profile invariants, and scope. A second causal
   theory or failed candidate stops; no repair loop.
7. Emit a Repair Review Packet and patch. Require QA Owner proof-obligation approval
   and Technical Owner code/harness/safety approval. The historical failure remains
   failed; only reviewed code plus a later ordinary CI run can become green.

Repair cannot edit Flow semantics/data/policy, remove assertions/cases, ignore
failures, add skips/fixme/expected-failure, widen timeouts beyond approved bounds,
use retries as a fix, add brittle selectors, add dependencies/workflows/identities/
network access, or create quarantine. A missing hook or required contract/infra
change becomes separate reviewed work.

## 8. Lifecycle and deterministic CI

Keep Flow State, Binding Freshness, and Enforcement State independent.

Allowed Flow State transitions:

- `draft → deferred`: contract approved; activation conditions unmet.
- `draft → active`: contract and all conditions approved now.
- `deferred → active`: reviewed Activation Proposal proves all conditions.
- `active → deferred`: exceptional reviewed suspension because the flow genuinely
  cannot run; never because it failed, flakes, is slow, or is inconvenient.
- `draft | deferred | active → retired`: QA Owner retires the contract and removes
  live Binding/CI enrollment in the same reviewed change.
- `retired` is terminal. A returning journey gets a new linked Flow ID.

State edits increment revision. Approved files remain in Git. Activation requires
product behavior, deterministic observability, stable interfaces, data isolation and
cleanup, enforceable boundaries, a passing Capability Gate, a generated/adopted
candidate, isolated verification, current provenance, and both approvals.

Brownfield materializes active flows immediately into advisory CI. Promotion is an
explicit decision after Burn-in Qualification: at least 14 days, 20 Qualifying Runs,
five source commits, 100 individual candidate executions, a clean pass per Binding,
at most 1% confirmed false-positive/flaky failures, no unresolved flake in the final
10 runs, all failures classified, no unresolved product failure in the promotion
set, PR-fast p95 within the approved budget, and continuous safety/provenance health.
Material changes reset only the affected Binding's sample.

Greenfield keeps pre-implementation flows deferred. The implementation ticket/PR
performs an explicit readiness assessment. The first commit satisfying all conditions
lands activation, Binding, provenance, and CI together; required enforcement starts
with that first active Binding. Partial implementations keep the flow deferred and
name unmet conditions.

The deterministic drift gate runs before tests and validates schemas, IDs, Flow/data/
profile/config/output digests, supported contracts, provenance completeness, and
retired-flow cleanup. `current` is mandatory for active Bindings. Product-code changes
run impacted tests but do not alone create drift. Raw failures do not invoke AI.

Provider-native CI exposes:

- fast relevant subset on pull requests;
- full suite nightly;
- manual/provider API trigger usable by a coding agent or MCP integration;
- merge-group trigger when the repository uses a merge queue;
- JUnit XML, native annotations, and concise job summary;
- failure-only, scrubbed, allowlisted artifacts;
- sharding only after measured need.

Impact paths are conservative trigger hints, never proof. Skipping the whole workflow
is allowed only when provider path rules prove no covered surface is affected.

## 9. Provider and harness adaptation

The provider-neutral CI adapter contract must:

1. detect and inventory current provider/configuration;
2. prove runner, identity, environment, egress, retention, artifact, merge-queue,
   required-check, fork, and permission capabilities;
3. render advisory, required, and quarantine lanes without changing policy itself;
4. render PR/nightly/manual/merge-group triggers;
5. publish JUnit/annotations/summary and the strict failure bundle;
6. resolve a provider run reference into immutable evidence;
7. validate that generated configuration enforces the Execution Profile.

v1 ships a GitHub Actions adapter. Other providers are separate adapters against the
same contract; absence of an adapter is an exact blocker, not permission to invent
generic YAML. The authoring agent may adapt an existing framework because the output
is reviewed code, but provider security semantics require a named, tested adapter.

The harness adaptation contract records framework/version, test level, discovery and
target paths, deterministic command, JUnit path, Flow-ID mapping, fixtures, isolation,
cleanup, clock/randomness, boundary realization, impact paths, and required dependency
changes. Browser generation may wrap Playwright and `@playwright/mcp` during authoring;
MCP is never a security boundary or ordinary-CI runtime. API generation reuses an
existing client/harness and mechanical OpenAPI contract generation where suitable.
CLI generation reuses the existing binary/fixture harness.

## 10. Anti-flakiness reference contract

Both installed skills carry the same versioned anti-flakiness reference. Generated
or repaired Bindings must obey it:

- Keep the owned service/outcome under test real. Simulate third parties, payments,
  time, randomness, and everything the flow does not verify. Forbidden boundaries
  remain unreachable. No real third-party call, including a third-party sandbox.
- Use the customer's existing deliberate test-hook convention. When none exists,
  propose semantic `data-testid` values for critical or ambiguous points. Use role +
  accessible name when that user-visible contract is stable. Never use generated HTML
  IDs, hashed classes, transient framework attributes, DOM position, XPath, or blanket
  tags. Missing hooks are tracked product changes.
- Never use fixed sleeps. Browser checks use bounded auto-waiting assertions on
  concrete readiness, not `networkidle`; API checks poll the asserted condition within
  a bound; CLI checks poll exit/status/output or another real completion signal.
- Use a unique per-run namespace. Establish clean state before each case, attempt
  cleanup after it, and prove tests pass independently and in varied order.
- Freeze/inject clocks, seed randomness, and make ordering explicit where not part of
  the contract.
- Retries may collect repeatability evidence but never erase an attempt, declare a
  flake, count a failed run as qualifying, or make a required result green.

The bundle reference cites the primary-source research retained on the research
branches:

- [AI-generated regression and agentic E2E](https://github.com/phassle/VibeFileSync/blob/research/ai-regression-testing-sota/docs/research/ai-regression-testing-sota.md)
- [Anti-flakiness practices](https://github.com/phassle/VibeFileSync/blob/research/anti-flakiness-practices/docs/research/anti-flakiness-practices.md)
- [Flow-definition formats](https://github.com/phassle/VibeFileSync/blob/research/flow-definition-formats/docs/research/flow-definition-formats.md)
- [CI regression integration](https://github.com/phassle/VibeFileSync/blob/research/ci-regression-integration/docs/research/ci-regression-integration.md)
- [Safe execution](https://github.com/phassle/VibeFileSync/blob/research/dynamic-qa-safe-execution/docs/research/dynamic-qa-safe-execution.md)

## 11. Safe execution

Use four isolated Trust Zones:

1. **Contract authoring:** fresh worktree, path/command allowlists, no production or
   publish identity, no secret in prompts, model credentials isolated by the harness,
   sensitive tracing off, proposals only.
2. **Candidate verification:** generated code is arbitrary code; use a fresh VM or
   one-job disposable runner, unprivileged user, resource limits, scoped filesystem,
   no host socket/device/home/credential store/metadata/sibling access, network denied
   unless externally enforced exact allowlist, and only per-run non-production
   capability when unavoidable.
3. **Low-trust deterministic CI:** no model/agent, no write identity/OIDC/ambient
   secret, same sandbox/egress rules, provenance gate first, scrubbed outputs only,
   failure stays failed. Unreviewed PR jobs get no protected environment capability.
4. **Privileged publication/policy:** separate reviewed base-branch code and protected
   identity; never execute low-trust code/artifacts/caches/paths/commands/URLs; accept
   only a Result Envelope or recompute. Most CI needs no such zone.

Network defaults to none. Required access is exact approved non-production targets,
enforced outside test/model code with redirect/DNS rechecks and metadata/link-local/
private/public denies except declared local/test services. Normal hosted-runner Internet
access is not exact egress control; if the customer lacks an enforcing facility, the
flow remains deferred.

No production identity, PAT, ambient user credential, shared long-lived account, token
passthrough, or cross-service token. Secret handles may be configured; values never
enter flows, data, prompts, generated files, provenance, or persisted diagnostics.

Rich diagnostics are failure-only, minimized, scrubbed, size-bounded, and narrowly
visible. DOM, screenshots, video, traces, HAR, storage, and bodies default off. Rich
diagnostics default to seven-day retention; scrubbed JUnit/result bundles to 30 days.
Scrub failure suppresses upload and records `diagnostic withheld`.

GitHub's low-trust adapter uses `pull_request`, top-level `permissions: {}` plus only
necessary `contents: read`, checkout with persisted credentials disabled, no secrets/
OIDC/protected environment, fresh hosted VM by default, full-SHA action pins, exact
timeouts and artifact lists, and no cache by default. It never executes PR code under
`pull_request_target`, `workflow_run`, issue-comment, or another privileged event.

Stop and record a Safety Blocker on unknown environment identity; absent sandbox/
disposability/egress; undeclared path, command, host, side effect, or credential;
production/metadata/internal/unrelated access; secret exposure; unreviewed generated,
dependency, or workflow code; provenance/profile mismatch; scrub failure; malformed
privileged input; or provider/profile contradiction. Kill or deny the operation,
preserve minimal scrubbed evidence, keep state/CI failed, and notify both owners. Never
broaden access or weaken the contract as recovery.

## 12. Failure policy

Failure Class is derived from Failure Owner × Repeatability:

| Owner / repeatability | Class | Action |
| --- | --- | --- |
| Product / any | Product Regression | Keep failed; create/link product defect; no Binding edit. |
| Binding / deterministic | Binding Defect | One guarded Repair Proposal. |
| Environment / deterministic | Environment Failure | Keep failed; route exact capability failure. |
| Binding or Environment / intermittent | Test Flake | Track with owner; optional Binding stabilization only when confirmed Binding-owned. |
| Unresolved or unknown | Unclassified Failure | Ask for exact safe evidence; no repair. |

One retry pass, timeout, or correlated failure proves neither flake nor owner.
Intermittent violation of an Expected Outcome is Product Regression. Only a confirmed
Binding-owned diagnosis may receive repair.

Quarantine is a separate, expiring policy overlay. It leaves base Flow State,
Freshness, and Enforcement State visible, routes the Binding to a named advisory lane,
and blocks qualification. A skipped test, retry, `fixme`, deleted CI enrollment, or
expected-failure marker is not quarantine.

## 13. Brownfield-first pilot

Pilot application and accountable QA Owner: VibeFileSync / Per.

Safe environment: GitHub-hosted `macos-14`, isolated temporary trees, read-only
repository identity, no secrets, network, production paths/data, external volumes, or
third-party effects.

Five pilot flows:

1. Update preserves a replaced destination version in SafetyNet before Publish.
2. Mirror archives destination-only content.
3. Verification failure preserves the old destination.
4. An unmounted source aborts before mutation.
5. Interrupted Publish converges on rerun.

The first candidate adopts and extends
`tests/cli.rs::update_mode_also_archives_a_replaced_destination`. The accepted rough
prototype is retained on
[`prototype/dynamic-qa-brownfield-flow`](https://github.com/phassle/VibeFileSync/tree/prototype/dynamic-qa-brownfield-flow/examples/dynamic_qa_brownfield_prototype).

Before activation, collect at least 14 calendar days and 20 completed relevant PR
runs, whichever is later; review the prior 90 days for escapes in these flows; and
start measuring flaky/false-positive failures and active maintenance time. A new
repair capability's baseline is `not-applicable`, never zero. Comparable current
PR-check p95 is 8m37s across 34 completed acceptance runs from 2026-08-01 through
2026-08-05 UTC.

Run advisory-first for at least four weeks and 20 relevant PRs after all five Bindings
are active. Pilot success requires:

1. 5/5 approved flows have passing deterministic Bindings, complete provenance, clean
   drift, and at least one genuine CLI end-to-end path.
2. Zero confirmed escaped regressions in those five flows.
3. Comparable PR-check p95 at most 9m30s.
4. Named-flow false-positive/flaky failure rate at most 1%, preserving retries in the
   denominator and evidence.
5. Median active maintenance at most 30 minutes and no event over 60 minutes after a
   relevant product change.
6. At least three seeded Binding defects: all remain red, are correctly classified,
   and produce reviewable proposal-only patches; at least two are accepted unchanged;
   none weakens policy or is auto-applied.
7. Zero secret exposure, production contact, real third-party effects, or privilege
   escalation.

Missing denominators or unmeasured thresholds mean pilot incomplete. Promotion remains
an explicit QA Owner and Technical Owner decision. A failed threshold yields evidence
for a later spec revision; it is not silently relaxed.

## 14. Build scope and acceptance

Dynamic Implement should decompose this spec into dependency-ordered work; the minimum
integrated release includes:

1. bundle/package scaffold and cross-harness explicit invocation adapters;
2. v1 schemas, canonicalization, deterministic validators, and customer-repo
   scaffolding;
3. `qa-setup` workflow, review packet, measurement pause/resume, lifecycle, and
   capability gate;
4. `qa-generate` generation/adoption, level selection, Flow-to-Binding mapping,
   provenance, and candidate verification;
5. deterministic drift/result tooling plus GitHub Actions adapter;
6. failure evidence, diagnosis, proposal-only repair, negative-control gate, and
   quarantine validation;
7. bundled references, install docs, fixture repositories, and smoke tests;
8. VibeFileSync baseline instrumentation and advisory pilot configuration, followed
   by a separately approved pilot run.

Release acceptance is automated where possible and includes:

- every schema accepts a canonical fixture and rejects unknown fields, duplicate YAML
  keys, aliases/tags, executable content, invalid IDs/revisions, and secret values;
- identical parsed data canonicalizes to an identical digest; semantic edits change it;
- `qa-setup` proves brownfield and greenfield fixtures, one-question HITL behavior,
  owner separation, no-write discovery, exact review diffs, and all stop/defer paths;
- both skills stop before their first mutation against an absent, stale, unverified, or
  schema-outdated `dynamic-skills-setup` profile, and against a profile that does not
  record Matt Pocock's engineering skills as installed; each stop names the specific
  missing evidence and returns the host's exact manual setup command without running it;
- baseline readiness pauses on missing data, distinguishes unknown/zero/not-applicable,
  resumes deterministically, and cannot self-approve;
- generation adopts a conforming existing test, generates new API/CLI/browser fixture
  Bindings without replacing the existing harness, chooses the cheapest complete level,
  honors overrides, and maps every assertion to an Expected Outcome;
- ordinary CI runs with all model/browser-agent credentials and processes absent;
- drift catches every recorded input/output mismatch before test execution and allows
  unrelated product changes;
- browser fixtures enforce stable-hook policy; fixed sleeps, brittle selectors,
  undeclared reach, shared test data, and unbounded waits fail review/validation;
- the four-zone threat model is exercised with hostile repo/app/MCP text, malicious
  branch/test names, dependency scripts, fork PRs, artifact/cache poisoning, secret
  patterns, redirect/DNS attempts, metadata reach, and scrub failure;
- GitHub fixture workflows use safe triggers, minimal permissions, immutable action
  pins, no persisted checkout credential, no fork secret/OIDC, exact artifacts, and a
  merge-group job when configured;
- failure fixtures cover every owner × repeatability class; only confirmed Binding
  defects reach repair; original failures stay failed;
- repair cannot change protected contracts, policies, dependencies, profiles, or CI;
  requires a failing negative control; stops after one hypothesis; and emits a complete
  review packet;
- expired/malformed quarantine fails closed and never counts as pass, coverage, or
  qualification;
- install/smoke tests load both skills in every supported harness build without sibling
  directory assumptions; bundle schemas/references are version-consistent;
- the VibeFileSync pilot meets the measurement gate before activation and reports every
  threshold with numerator, denominator, query, interval, and provenance.

Acceptance fixtures must not contact production, the public Internet, a real third
party, a developer home directory, or an external volume. Testing the bundle's own
security posture is required; using it to perform customer security, load, performance,
or production testing remains out of scope.

## 15. Explicitly out of scope

- A third `qa-heal` skill or AI in ordinary regression execution.
- A standalone application, hosted control plane, daemon, runner fleet, secret store,
  sandbox/proxy service, proprietary runtime, or mandatory provider App.
- Replacing a working customer test framework or CI provider for standardization.
- Unit-test generation; Dynamic Implement's TDD workflow owns it.
- Silent repair, automatic policy/contract changes, automatic quarantine, automatic
  promotion, or changing a historical failed result.
- Production probing/data/identity, real third-party side effects, performance/load
  testing, and customer security testing.
- Application-wide test hooks or forcing the literal `data-testid` name where an
  equivalent stable convention exists.

## 16. Decision references

The normative decisions remain in their named tickets; this document assembles their
build contract without duplicating their rationale:

- [Decide the flow-definition format](https://github.com/phassle/VibeFileSync/issues/101)
- [Design the qa-setup interview](https://github.com/phassle/VibeFileSync/issues/102)
- [Decide the greenfield vs brownfield lifecycle](https://github.com/phassle/VibeFileSync/issues/103)
- [Decide CI failure triage and repair policy](https://github.com/phassle/VibeFileSync/issues/124)
- [Decide the safe-execution threat model](https://github.com/phassle/VibeFileSync/issues/127)
- [Prototype one brownfield vertical flow and pin the pilot](https://github.com/phassle/VibeFileSync/issues/130)

Unresolved questions before implementation: none. Pilot evidence may cause a later
revision; it is not missing design input.
