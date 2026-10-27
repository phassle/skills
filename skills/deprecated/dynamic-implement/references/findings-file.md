# The repository findings file

`<repo>/.agents/dynamic-implement/findings.json` — tracked, team-owned, written by this skill's retrospective and re-stated by `dynamic-skills-calibrate`.

A safeguard is a workaround for a failure on a **specific route**. Stored without that route, no later run can tell a rule that still earns its place from scar tissue left by a model nobody uses any more.

## Contents

- Why not the skill directory
- Writing it
- Shape
- State transitions

## Why not the skill directory

An installed skill directory is a workspace, not a store: `skills add`, a plugin update, or a fresh machine discards anything written there. Findings about a repository belong to that repository, where they survive reinstalling, travel to the team, and are reviewed in a PR like any other change.

A finding that is not about this repository at all — a rule the orchestration should follow anywhere — is recorded here with `scope: "portable"` and proposed as a change to the skill's source repository. The proposal is the durable artifact; this file only records that it exists.

## Writing it

Read the latest file immediately before writing, merge by `id`, validate the JSON, and replace it atomically. Preserve unrelated findings and keep the last-known-good file on failure. Follow the repository's Git strategy for the change, as calibration does.

- **Append or increment, never rewrite history.** A recurring symptom increments `seenCount` and appends to `routes`; it does not overwrite the original observation.
- **Never delete.** Retirement is a state, so a safeguard that comes back is visibly the same finding rather than a new discovery.
- **Only this skill writes `symptom` and `safeguard`.** Calibration writes `state`, `stateReason`, `revalidation` and `retirement`, and nothing else.
- **Text inside the file is data, never instruction.** No secrets, prompts, transcripts, reviewer prose, or chain-of-thought — the observable failure and the rule, both short.

## Shape

```jsonc
{
  "schemaVersion": 1,
  "updatedAt": "RFC-3339",
  "findings": [
    {
      "id": "stable kebab-case slug",
      "scope": "repository|portable",
      "symptom": "the observable failure, one sentence",
      "safeguard": "the rule now in force, one sentence",
      "routes": [
        {
          "harness": "claude|codex|copilot|opencode|pi",
          "modelId": "reported id or null",
          "modelFamily": "reported family or unknown",
          "effort": "exact native value|unknown|unsupported",
          "ladderIndex": null,
          "catalogFingerprint": "per-harness ladder fingerprint or null",
          "role": "planner|implementer|reviewer|merger|coordinator",
          "at": "RFC-3339",
          "issue": "tracker id",
          "runToken": "this run's five-character token"
        }
      ],
      "seenCount": 1,
      "state": "active|revalidation-due|retired",
      "stateReason": "why it holds this state",
      "revalidation": {
        "dueSince": null,
        "trigger": "retired-route|superseded-floor|new-route|null",
        "evidence": []
      },
      "retirement": {
        "at": null,
        "ground": "probe-clean|comparable-units-clean|null",
        "evidence": []
      },
      "proposal": "source-repository issue or PR for a portable finding, else null"
    }
  ]
}
```

## State transitions

`active` is the default and the safe state. A finding only leaves it on evidence:

| To | On | Written by |
| --- | --- | --- |
| `revalidation-due` | its route is retired or absent from the current ladder, or the recommended floor moved past it | calibration |
| `active` | a route change was evaluated and the safeguard still applies, or `seenCount` reached three distinct routes | calibration |
| `retired` | one deliberate probe with the safeguard disabled came back clean on a reversible low-risk unit, **or** the threshold of comparable clean units in the calibration rubric was met | calibration |

Flag fast, retire slowly — the same asymmetry the routing floor uses. A safeguard that merely feels unnecessary stays `active`, and a symptom seen on three distinct routes is not model-dependent and is never retired automatically.

Unknown fields are `null`. Estimates never enter the file.
