---
name: dynamic-skills-setup
description: "Manually probe and configure the coding harnesses available to dynamic-implement, including exact model and effort steps across Codex, Claude Code, GitHub Copilot, OpenCode, and Pi."
disable-model-invocation: true
---

# Setup Dynamic Skills

Build a verified capability profile for orchestration. Detect what can actually run; do not equate an installed binary with a callable model.

Generate all setup prompts, approvals, progress, evidence, profile notes, and reports in English. Preserve existing user-authored and repository text verbatim.

Run only from the host's explicit manual skill entry. Never start setup implicitly from Dynamic Implement or ordinary intent matching. Setup may research and probe paid routes, so keep it a separate user-visible action. After setup succeeds, instruct the user to invoke Dynamic Implement again; never continue into issue implementation automatically.

Treat the per-harness model catalog as a 14-day lease. Research current model choices, verify selected routes live, and refresh expired catalogs before a new dynamic run. Keep this machine-local catalog lifecycle separate from repository outcome calibration. Setup may read a repository's `.agents/dynamic-implement/model-calibration.json` to map team recommendations onto verified local steps, but it never writes learned outcomes into itself or replaces that team-owned file.

Read [probe-and-profile.md](references/probe-and-profile.md) completely before probing or writing the profile.

## Scope one run, accumulate across runs

The profile is a shared multi-harness store that grows over repeated runs. A single run rarely needs to reverify everything, and a run must never destroy what an earlier run proved.

Load the existing profile before probing. Report which harnesses it already covers, when each was verified and from where, and which leases have expired. Then agree the scope for this run:

- the current coordinator harness, plus any harness whose lease expired or whose executable path/version changed — the default, and the cheapest correct choice;
- one named harness the user wants added or refreshed;
- every detected harness, when the user asks for a full rebuild.

Probe only harnesses in scope. Carry every out-of-scope harness entry forward unchanged, including its verified ladder, lease dates, fingerprint, and evidence. Never drop or downgrade a harness merely because this run did not examine it.

A harness's model routes can be verified from another harness: local CLIs share the machine's authentication, so the coordinator can launch another harness's non-interactive process and live-verify its ladder. Record which coordinator observed each entry in `verifiedFrom`. Only the coordinator identity and a harness's own native Goal/task facility require running inside that harness; mark them unobserved rather than guessing when setup runs elsewhere.

First verify that Matt Pocock's `implement`, `tdd`, `code-review`, and `setup-matt-pocock-skills` are installed for the project or candidate harness. They are mandatory for dynamic implementation. If missing, stop and recommend installing the official `mattpocock/skills` engineering set through the host-supported skill installer; do not install without user approval and do not create substitutes.

## Probe safely

1. Identify the current coordinator harness and model family when observable, and record it as this run's `verifiedFrom` value.
2. Research the current selectable models and all selectable reasoning-effort controls for each in-scope harness among Codex, Claude Code, GitHub Copilot, OpenCode, and Pi, from installed-version help/model lists plus official provider or harness documentation when network research is available. Timestamp the evidence per harness and distinguish advertised model/effort combinations from live-verified steps.
3. Record executable path and version without exposing credentials or provider secrets.
4. Present the complete candidate probe matrix and expected paid usage, then obtain one approval before paid probes. For each approved model/effort candidate, launch a tiny non-interactive smoke session with no write-capable tools, no resume/continue, no inherited conversation, no memory, and no persisted session when the harness supports those controls.
5. Determine the actual model family from structured session output or explicit model configuration. If it remains opaque, mark it `unknown`; never infer it only from the harness name.
6. Verify that a new top-level zero-history process can load Matt Pocock's installed `code-review` skill and can create the two fresh Standards and Spec review contexts that skill requires. A generic native subagent is not a valid review coordinator. Do not run a repository review during setup.
7. Detect the harness's native Goal/task/todo and automatic-continuation facilities. Record how it will mirror the mandatory portable ledger goal; absence of a native Goal is not a blocker.
8. Verify the `dynamic-implement` explicit entry defined by its platform adapter. Confirm that discovery exposes the accepted name and that invocation retains native explicit-selection evidence or `DYNAMIC_IMPLEMENT_SLASH_ENTRY=1`. Mark root entry unverified when neither survives.
9. Build logical `T1`, `T2`, and `T3` routes from live-verified models. For every physical route, order all live-verified effort values from cheapest/lowest to strongest. Then materialize one flat `escalationLadder` of exact `harness + model + effort` steps: exhaust effort on the current model before moving to the next genuinely distinct model and restarting at its lowest verified effort. Deduplicate logical tiers that map to the same physical step and compute a deterministic fingerprint **per harness**, from that harness's name and version plus its own canonical verified ladder. A fingerprint must never span harnesses: refreshing one harness has to leave every other harness's saved ladder indices valid.
10. Persist advertised but unverified combinations separately as `candidateEscalationSteps`; never put them in the usable ladder. Write only verified facts to `escalationLadder`.
11. Record a route the user has excluded by policy as `status: declined` with the reason, even when it probed successfully. A later run must not silently readopt it as a cheaper rung. Keep a role-restricted route in `auxiliaryRoutes` with its allowed and forbidden roles rather than in the code ladder.

Tell the user before a probe that can consume paid model credits. A declined or failed smoke test remains `unverified`, not `available`.

## Select review routes

For each verified implementer route, rank reviewer routes in this order:

1. a fresh standalone session on a different verified model family and preferably a different harness;
2. a fresh standalone session on the same harness with a different verified model family;
3. a fresh standalone session on a different harness whose model family is unknown or the same;
4. a fresh standalone session on the same model family as the implementer.

Every selected route must support a zero-conversation-context launch and Matt Pocock's `code-review` skill. Cross-model diversity is preferred; clean context and the required review workflow are mandatory.

## Persist and report

Write the profile to `~/.agents/dynamic-skills/capabilities.json`, unless `DYNAMIC_SKILLS_PROFILE` names another path. Use the schema and lifecycle rules in the reference.

Merge, never overwrite. Build the new document from the loaded profile, replace only the in-scope harness entries and their ladders, then write the whole document atomically. Refuse to write a document that has fewer verified harnesses than the one loaded unless the user explicitly asked to remove one.

Report:

- which harnesses this run reverified and which were carried forward untouched, with their verification dates and `verifiedFrom`;
- verified harness/model-family routes;
- verified explicit-only root entries;
- which route dynamic implementation will use for independent review;
- unavailable or unverified candidates and why;
- whether the result is cross-model or clean-context same-model fallback.
- whether completed issue telemetry is sufficient to run the optional `dynamic-skills-calibrate` skill.
- per-harness research timestamp, 14-day expiry, evidence sources, and any tier that lacks a distinct route.
- the complete ordered model/effort escalation ladder, its exact native effort values, any deduplicated/no-op tier, and advertised steps excluded because they were not live-verified.

Never store tokens, secrets, raw environment dumps, provider endpoints containing credentials, or full prompt/response transcripts.
