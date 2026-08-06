# Probe and profile contract

## Contents

- Safety and freshness
- Profile schema
- Role defaults
- Merge semantics
- Model-family evidence
- Staleness and failure

## Safety and freshness

A model/effort step is `verified` only after a successful live, minimal response using that exact selectable combination. Binary discovery, `--version`, help text, and a successful response at another effort prove neither authentication nor support for this step.

Before probing, research each installed harness's current model and reasoning-effort surface from its version-specific help/model-list/config command and official documentation when available. Record exact native effort labels, their documented order, selection mechanism, short non-secret source references, and observation timestamps. Advertised availability is catalog evidence, never live-step verification.

Use the harness's current help before composing a probe. The exact flags evolve, but the probe must preserve these semantics:

- start a new session, never resume, continue, fork, or import a parent transcript;
- disable write-capable tools and external mutations;
- disable memory and session persistence where supported;
- request only a fixed response such as `READY`;
- capture structured metadata when available to identify the actual model;
- set a small budget/credit ceiling when supported;
- never print or persist credential-bearing configuration.

Typical current primitives include ephemeral read-only `codex exec`, non-persistent tool-free `claude --print`, a new non-interactive `copilot --prompt` session with memory disabled and a restricted tool set, a new `opencode run` session with read-only permissions, and `pi --print --no-session` with a read-only tool allowlist. Treat these only as hints; inspect installed-version help first.

To verify review support without reviewing code, start another clean session with a minimal request to locate and load the installed `code-review` skill, state its two axes, and exit without subagents or repository writes. Confirm project or personal discovery paths for that harness and record the exact reviewer effort used.

Research the entire candidate escalation matrix before requesting probes. Show the user every proposed `harness + model + effort` combination and the aggregate expected paid ceiling, then request approval once. Probe approved combinations independently. Keep successful combinations in the usable ladder and advertised/unapproved/failed combinations in `candidateEscalationSteps` with a factual status and reason.

Verify root admission without implementation work. Discover the accepted entry from `dynamic-implement/references/platform-adapters.md`, confirm it appears in the host's skill/command surface, and inspect its local expansion or invocation metadata. Set `explicitEntry.verified` only when the host preserves `$skill`, a direct slash command, explicit selector metadata, or `DYNAMIC_IMPLEMENT_SLASH_ENTRY=1`. This discovery check must not call a paid model.

## Profile schema

Write valid JSON shaped as follows. Omit optional evidence that could reveal secrets.

```json
{
  "schemaVersion": 6,
  "lastRunAt": "RFC-3339 timestamp of the most recent setup run",
  "lastRunScope": ["harness names this run reverified"],
  "ttlDays": 14,
  "coordinator": {
    "harness": "codex|claude|copilot|opencode|pi|other",
    "modelFamily": "openai|anthropic|google|other|unknown",
    "observedAt": "RFC-3339 timestamp"
  },
  "harnesses": [
    {
      "name": "codex",
      "executable": "/absolute/path",
      "version": "version string",
      "status": "verified|unverified|unavailable",
      "verifiedAt": "RFC-3339 timestamp for THIS harness",
      "verifiedFrom": "coordinator harness that observed it",
      "catalog": {
        "researchedAt": "RFC-3339 timestamp",
        "expiresAt": "researchedAt plus 14 days",
        "sources": [
          {
            "kind": "installed-help|installed-model-list|official-docs",
            "reference": "short non-secret command or URL",
            "observedAt": "RFC-3339 timestamp"
          }
        ]
      },
      "cleanSession": true,
      "mattCodeReview": true,
      "explicitEntry": {
        "command": "accepted host syntax",
        "evidence": "dollar-skill|slash-command|explicit-selector|adapter-marker",
        "verified": true
      },
      "goal": {
        "mechanism": "issue-tracker+native+ledger|issue-tracker+ledger",
        "nativeName": "Goal, task, todo, or null",
        "durability": "cross-session|compaction|session|ledger",
        "autoContinue": true
      },
      "models": [
        {
          "id": "observed model id or default",
          "family": "openai|anthropic|google|other|unknown",
          "verified": true,
          "reasoningEffort": {
            "supported": true,
            "selection": "native flag/config key or null",
            "advertised": ["low", "medium", "high"],
            "verified": ["low", "medium", "high"],
            "order": ["low", "medium", "high"],
            "default": "medium or null",
            "note": "short non-secret evidence"
          }
        }
      ],
      "note": "short non-secret evidence or failure reason"
    }
  ],
  "reviewRoutes": [
    {
      "implementerHarness": "claude",
      "implementerFamily": "anthropic",
      "reviewerHarness": "codex",
      "reviewerFamily": "openai",
      "independence": "clean-cross-model|clean-cross-harness|clean-same-model"
    }
  ],
  "telemetryPolicy": {
    "trackerComments": "allow|deny",
    "scope": "repository|all-repositories",
    "repository": "owner/name or stable local id when scope is repository",
    "decidedAt": "RFC-3339 timestamp",
    "purposeShown": "improve future Dynamic Implement model/effort routing"
  },
  "issueModelLadders": [
    {
      "harness": "codex",
      "fingerprint": "sha256 over THIS harness name, version, and its own canonical ladder",
      "triageMap": {
        "small": "T1",
        "medium": "T2",
        "large": "T3"
      },
      "roleDefaults": {
        "planner": {"tier": "T3", "effort": "second verified native value, not the lowest"},
        "merger": {"tier": "T2", "effort": "verified native value"}
      },
      "tiers": {
        "T1": "verified route id",
        "T2": "verified route id",
        "T3": "verified route id"
      },
      "distinctRoutes": {
        "T1ToT2": true,
        "T2ToT3": true
      },
      "defaultStart": {"tier": "T1", "effort": "verified native value"},
      "auxiliaryRoutes": {
        "research": {
          "route": "harness:model-id",
          "effort": "exact native value",
          "allowedRoles": ["research", "read-only-summary"],
          "forbiddenRoles": ["planner", "implementer", "reviewer", "merger"],
          "note": "why this verified route is restricted rather than laddered"
        }
      },
      "escalationLadder": [
        {
          "index": 0,
          "tiers": ["T1"],
          "route": "harness:model-id",
          "modelFamily": "reported family or unknown",
          "modelId": "model-id",
          "effort": "exact native value",
          "verifiedAt": "RFC-3339 timestamp"
        }
      ],
      "candidateEscalationSteps": [
        {
          "route": "harness:model-id",
          "effort": "exact native value",
          "status": "advertised|declined|failed|unavailable",
          "reason": "factual short reason"
        }
      ]
    }
  ],
  "teamCalibration": {
    "pathPattern": "<repo>/.agents/dynamic-implement/model-calibration.json",
    "sourceOfTruth": "tracked repository file built from consented tracker-comment telemetry or an explicit run-ledger bundle",
    "scope": "repository",
    "writeOwner": "dynamic-skills-calibrate"
  }
}
```

## Role defaults

`roleDefaults.planner` defaults to the strongest verified tier `T3`, at that route's **second** verified
effort — not its lowest. Every decomposition, dependency edge, conflict prediction, and downstream
size-to-route mapping is derived from one planner output, so a weak planner is amplified across every
unit it schedules, while a planner is only one short read-only session per wave.

The effort default follows the same logic as the tier. Plan defects are reasoning failures, not
knowledge failures — a missed dependency edge, a conflict predicted at the wrong granularity, a unit
sized for the wrong context — and they surface late, after implementers have already been dispatched
against them. The planner is therefore the one role that does **not** start at the ladder floor.

A user economy directive — "start as low as possible", "cheapest first", "subscription-only" — constrains
**implementer** routing. Record it in `routingPreference` and apply it to `triageMap` and `defaultStart`,
but do **not** lower `roleDefaults.planner`, and do not let a `triageMap` collapsed onto a single tier
drag the planner down with it. Lower the planner only when the user explicitly names the planner role.
When an economy directive and this default coexist, state both in the `routingPreference` note so the
exception is visible rather than looking like an inconsistency.

## Merge semantics

The profile accumulates across runs and across harnesses. Writing it is a read-modify-write, never a fresh document:

1. Load the existing profile. If it parses and its `schemaVersion` is supported, keep it as the base; otherwise migrate it and say so.
2. Replace only the `harnesses[]` and `issueModelLadders[]` entries for harnesses this run reverified. Update `coordinator`, `lastRunAt`, and `lastRunScope`.
3. Copy every out-of-scope entry forward unchanged, including its `verifiedAt`, `verifiedFrom`, `catalog`, `fingerprint`, ladder, and candidates.
4. Recompute `reviewRoutes` across the merged set, because a harness added this run may become a better reviewer for a harness verified earlier.
5. Replace `telemetryPolicy` only from an explicit answer during this setup run. Preserve the existing policy when telemetry consent was not in scope; a missing policy migrates to `deny`.
6. Serialize, validate, then replace the file atomically through a temporary file in the same directory.

Refuse to write a document containing fewer verified harnesses than the one loaded unless the user explicitly asked to remove one. Silently losing another run's verified ladder is a data-loss bug, not a refresh.

Keep a last-known-good copy that is a usable fallback, not an archive: refresh it from the current profile once the new document validates. A fallback that names a route or skill that no longer exists is worse than none.

Migrating an older profile is preferred over discarding it. Live-verified steps cost real quota to obtain; if the ladder content is still valid and its lease unexpired, carry it into the new schema and only re-probe what actually changed.

## Model-family evidence

Prefer, in order:

1. a model id reported by structured output from the successful smoke session;
2. an explicit model selected for that successful invocation;
3. an active, non-secret harness configuration value confirmed by the successful invocation.

Normalize only the broad family needed for independent review routing. Do not maintain a hard-coded catalog of every model id. If provider wrappers or custom endpoints obscure the family, record `unknown`.

Build tier mappings only from models that passed a live smoke test. Build the usable `escalationLadder` only from exact model/effort pairs that passed. When a harness does not support effort control, use one verified step with `effort: unsupported`; when it supports effort but the active value cannot be observed, use `unknown` only for reporting and do not claim an effort bump. Ask the user when relative capability/cost or effort order is not exposed by the provider or is ambiguous. A missing tier may fall back to the nearest verified route, but deduplicate identical concrete steps and record that the nominal tier provides no actual escalation. Never probe paid steps beyond the approved setup budget.

Order the flat ladder deterministically: all verified effort values for one physical route in documented increasing order, followed by the next genuinely stronger distinct model route at its lowest verified effort. Assign stable zero-based indices. Compute each ladder's own `fingerprint` from a canonical representation of that harness's name and version plus that harness's verified ladder only, excluding timestamps and machine paths. Fingerprints are per harness so refreshing one leaves the others' saved indices valid; never hash across harnesses. Dynamic Implement advances only by index and never inserts an unverified step at runtime.

Research and verification serve different questions: the local catalog records what appears selectable now; live probes record which exact model/effort steps this installation can actually call. Outcome calibration remains a third, repository-owned input at `.agents/dynamic-implement/model-calibration.json`; it learns the smallest portable model/effort step that completed comparable work and whether a lower boundary probe is due. A saved ladder index is valid only together with the fingerprint of the harness ladder it came from, and must be remapped on another installation or after that harness is re-probed. An index from one harness never transfers to another. Never extend catalog expiry from telemetry or extend it without new model/effort research. Never store learned outcomes in the installed skill tree.

GitHub Copilot may expose multiple selectable families. Verify only routes that can be launched non-interactively with an explicit model; do not assume every model shown in a picker is authorized.

OpenCode can list provider/model pairs and starts a new session when `run` is used without continue/session flags. Verify the selected pair with a live response and restrict reviewer permissions to read, search, shell checks, subagents, and skills—never edit/write.

Pi supports explicit providers/models, `--no-session`, read-only tool allowlists, and direct `--skill` loading. Its base CLI does not guarantee a subagent tool. Mark `mattCodeReview` false unless the installed Pi configuration or extension is live-verified to create the two isolated Standards and Spec agents required by Matt's skill.

## Staleness and failure

Re-run setup when:

- no profile exists;
- a harness's `catalog.expiresAt` has passed (14 days after its research) — that harness only, not the whole profile;
- an executable path or version changed;
- authentication or model selection changed;
- a selected route fails to start;
- the user requests reconfiguration.

If the preferred reviewer fails during a run, mark that route failed in run state and try the next already verified route. Do not silently promote an unverified route. If only same-model review remains, continue only with a brand-new clean session and disclose the fallback.

An expired harness catalog triggers fresh research of that harness's complete model/effort matrix and approved step probes; harnesses whose leases are still valid are carried forward untouched. Preserve the last-known-good profile until the replacement is atomically valid. Model improvement over time is expected: refreshing a harness rebuilds that harness's ordered ladder and remaps Small/T1, Medium/T2, and Large/T3 from current evidence rather than carrying old vendor ids or effort assumptions forward blindly.
