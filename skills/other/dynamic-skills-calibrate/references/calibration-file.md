# The team calibration file

`<repo>/.agents/dynamic-implement/model-calibration.json` — tracked, team-owned, written only by this skill.

## Contents

- Writing it
- Shape
- Portability

## Writing it

Read the latest file immediately before writing, merge by stable group key, validate the JSON, and replace it atomically. Preserve unrelated groups, and keep the last-known-good file on failure.

Eligible telemetry whose stable group key names a harness the file does not yet contain appends a new group for that harness rather than being skipped — including GitHub Copilot CLI (`copilot`) whenever setup has a verified ladder for it or telemetry names it explicitly.

## Shape

```json
{
  "schemaVersion": 1,
  "updatedAt": "RFC-3339",
  "source": "GitHub issue model-telemetry:v1 sections",
  "groups": [
    {
      "key": "stable repository-owned group key",
      "match": {
        "harness": "copilot",
        "plannerSize": "small|medium|large",
        "languageOrChangeKind": "value",
        "calibrationKeys": []
      },
      "catalogFingerprint": "per-harness ladder fingerprint used for indices or null",
      "recommendedStart": {
        "tier": "T1|T2|T3|explicit",
        "routeId": "harness:model",
        "modelFamily": "reported family or unknown",
        "modelId": "reported id or null",
        "effort": "native value|unknown|unsupported",
        "ladderIndex": null
      },
      "observedBoundary": {
        "highestCapabilityFailure": null,
        "lowestCleanSuccess": null
      },
      "boundaryProbe": {
        "due": false,
        "lastIssue": null,
        "lastAt": null,
        "lastStep": null,
        "lastOutcome": null
      },
      "samples": {
        "eligible": 0,
        "cleanSuccess": 0,
        "capabilityEscalation": 0,
        "materialReReview": 0
      },
      "usage": {
        "inputTokensRange": null,
        "outputTokensRange": null,
        "creditsRange": null,
        "costRange": null,
        "currency": null,
        "durationMsRange": null
      },
      "costToAcceptance": {
        "basis": "measured|external-prior|none",
        "unit": "cost|tokens|attempts",
        "currency": null,
        "byStep": [
          {
            "route": "harness:model-id",
            "effort": "exact native value",
            "ladderIndex": null,
            "units": 0,
            "medianTotal": null,
            "attemptsMedian": null,
            "includesRetriesAndFixPasses": true
          }
        ],
        "cheapestObservedStep": null,
        "confidence": "low|medium|high"
      },
      "externalReview": {
        "lastCheckedAt": "RFC-3339, or null if never checked",
        "examined": ["route ids and sources looked at this run"],
        "changesFound": [
          {
            "kind": "new-route|retired-route|price-change|new-benchmark-round",
            "route": "harness:model-id",
            "summary": "what moved",
            "effectiveAt": "RFC-3339 for a dated or scheduled change, else null",
            "source": "exact citation",
            "retrievedAt": "RFC-3339"
          }
        ],
        "outcome": "changed|unchanged|not-checked",
        "notCheckedReason": null
      },
      "externalPrior": {
        "note": "seeds ordering before local telemetry exists; never counted as an observation",
        "models": [
          {
            "route": "harness:model-id",
            "relativeTokensForComparableWork": null,
            "pricePerMTokenIn": null,
            "pricePerMTokenOut": null,
            "currency": null,
            "source": "exact citation, or null",
            "retrievedAt": "RFC-3339, or null"
          }
        ]
      },
      "costBasis": "measured|external-prior|none",
      "confidence": "low|medium|high",
      "evidenceIssues": [],
      "calibratedAt": "RFC-3339",
      "sourceCursor": "tracker cursor or timestamp"
    }
  ]
}
```

## Portability

Every boundary step stores exact model and effort. A `ladderIndex` is a convenience tied to `catalogFingerprint`, which identifies one harness's ladder: setup or Dynamic Implement remaps the portable route/model/effort against that harness's current ladder and ignores a stale index. An index never travels between harnesses.

Unknown metrics are `null`. Estimates never enter the file.
