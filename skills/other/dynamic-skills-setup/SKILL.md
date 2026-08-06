---
name: dynamic-skills-setup
description: "Probe the coding harnesses available to Dynamic Implement and write a verified capability profile with exact model and effort steps across Codex, Claude Code, GitHub Copilot, OpenCode, and Pi. Use before the first run, after a 14-day lease expires, when a harness or model changes, or when a verified route fails."
disable-model-invocation: true
metadata:
  version: 0.2.0
---

An installed binary is not a callable model. Setup replaces assumption with **proof**: every model-and-effort step in the profile earned its place by answering a live probe on this machine, and anything merely advertised is parked where nobody can route work to it.

Proof decays. Each harness's model catalog is a **lease** — 14 days from the research that produced it — after which that harness, and only that harness, is researched and re-probed before a run trusts it again.

Report in English, and preserve user-authored and repository text verbatim.

Read [probe-and-profile.md](references/probe-and-profile.md) completely before probing or writing the profile.

## Run only when asked

Start only from the host's explicit manual skill entry — never from Dynamic Implement, never from intent matching. Setup researches and probes paid routes, so it stays a separate user-visible action. When it succeeds, tell the user to invoke Dynamic Implement again rather than continuing into an issue.

Machine-local proof and team-learned outcomes are different stores. Setup may read a repository's `.agents/dynamic-implement/model-calibration.json` to map a team recommendation onto a verified local step, but it never writes outcomes into itself and never replaces that team-owned file.

Before probing anything, confirm Matt Pocock's `implement`, `tdd`, `code-review`, and `setup-matt-pocock-skills` are installed for the project or candidate harness. They are mandatory for dynamic implementation. If any is missing, stop and recommend installing the official `mattpocock/skills` engineering set through the host-supported installer — with the user's approval, and without substitutes.

## Scope one run, carry the rest forward

The profile is a shared multi-harness store that grows across runs, so a run reverifies a slice and **carries the rest forward untouched** — every out-of-scope harness keeps its ladder, lease dates, fingerprint, and evidence exactly as an earlier run proved them.

Load the existing profile first. Report which harnesses it covers, when and from where each was verified, and which leases expired. Then agree this run's scope:

- the current coordinator harness, plus any harness whose lease expired or whose executable path or version changed — the default, and the cheapest correct choice;
- one named harness the user wants added or refreshed;
- every detected harness, when the user asks for a full rebuild.

One harness can verify another: local CLIs share the machine's authentication, so the coordinator launches another harness's non-interactive process and live-verifies its ladder, recording itself in `verifiedFrom`. Only the coordinator identity and a harness's own native Goal facility need to run inside that harness — mark those unobserved rather than guessing.

Before paid-probe approval, show any existing telemetry policy and ask whether Dynamic Implement may upsert one machine-readable telemetry comment on each child ticket after verified feature review and integration. Explain that it records model/effort attempts, checks, review counts, and integration evidence only to improve future routing; it never changes title, body, acceptance criteria, dependencies, or labels. Consent is optional, separate from probe approval, scoped to this repository unless the user explicitly chooses broader scope. Preserve an explicit existing choice when the user leaves it unchanged; a missing policy defaults to denied.

## Probe safely

1. Identify the coordinator harness and model family where observable; record it as this run's `verifiedFrom`.
2. Research each in-scope harness's currently selectable models and reasoning-effort controls, from installed-version help and model lists plus official documentation when network research is available. Timestamp evidence per harness, and keep advertised combinations distinct from live-verified steps.
3. Record executable path and version, exposing no credentials or provider secrets.
4. Present the complete candidate probe matrix and its expected paid usage, and take one approval covering it. Then probe each approved model/effort candidate with a tiny non-interactive smoke session: no write-capable tools, no resume or inherited conversation, no memory, no persisted session, wherever the harness supports those controls.
5. Read the model family from structured session output or explicit model configuration. Where it stays opaque, record `unknown` — the harness name is not evidence.
6. Verify that a fresh top-level zero-history process loads Matt's installed `code-review` skill and creates the two Standards and Spec review contexts it requires. A generic native subagent is not a valid review coordinator. Review no repository code during setup.
7. Detect the harness's native Goal/task/todo and automatic-continuation facilities, and record how each mirrors the mandatory portable ledger goal. A missing native Goal is not a blocker.
8. Verify the `dynamic-implement` explicit entry its platform adapter defines: discovery exposes the accepted name, and invocation retains native explicit-selection evidence or `DYNAMIC_IMPLEMENT_SLASH_ENTRY=1`. Failing both, mark the root entry unverified.
9. Build `T1`, `T2`, and `T3` from live-verified models only, then materialize the flat per-harness `escalationLadder` and its fingerprint by the ordering rules in the reference.
10. Park advertised-but-unproven combinations in `candidateEscalationSteps`. Only verified facts reach `escalationLadder`.
11. Record a route the user excluded by policy as `status: declined` with its reason, even when it probed cleanly, so a later run cannot readopt it as a cheap rung. Keep a role-restricted route in `auxiliaryRoutes` with its allowed and forbidden roles.

Warn before any probe that can spend paid credits. A declined or failed smoke test leaves the step `unverified`.

## Choose review routes

For each verified implementer route, rank reviewer routes:

1. a fresh standalone session on a different verified model family, preferably a different harness;
2. a fresh standalone session on the same harness with a different verified model family;
3. a fresh standalone session on a different harness whose family is unknown or the same;
4. a fresh standalone session on the implementer's own model family.

Cross-model diversity is the preference. Clean context and a working `code-review` skill are the requirements — every candidate route must support a zero-conversation-context launch.

## Persist and report

Write the profile to `~/.agents/dynamic-skills/capabilities.json`, unless `DYNAMIC_SKILLS_PROFILE` names another path, following the schema and the read-modify-write merge rules in the reference.

Report:

- which harnesses this run reverified and which were carried forward, with their verification dates and `verifiedFrom`;
- verified harness/model-family routes, and verified explicit-only root entries;
- the route dynamic implementation will use for independent review, and whether it is cross-model or a clean-context same-model fallback;
- unavailable or unverified candidates, with the reason;
- per-harness research timestamp, lease expiry, evidence sources, and any tier lacking a distinct route;
- the complete ordered escalation ladder with exact native effort values, any deduplicated no-op tier, and the advertised steps excluded for want of live verification;
- telemetry-comment consent, scope, and how to change it on a later setup run;
- whether completed issue telemetry is now sufficient to run `dynamic-skills-calibrate`.

Keep tokens, secrets, raw environment dumps, credential-bearing endpoints, and full prompt/response transcripts out of the profile and the report.
