# DATA-SHAPE — dynamic-run-dashboard

The JSON object that replaces `/*__DATA__*/ null` in `template.html`. One placeholder, no other edit to the file.

Every field is optional; an absent field renders as an empty band, never as a guess.

**These fields are inserted as raw HTML** (inline `<code>`, `<strong>`, links allowed) — write them yourself, never from tool output, an agent transcript, a commit message or an issue body:

`purpose` · `subtitle` · `boardNote` · `routing.note` · `pipeline.note` · `usage.note` · `lessons.note` · each unit's `note` · `routing.roles[].why` · `pipeline.steps[].sees` · `lessons.items[].failure` · `lessons.items[].change` · every string in `footer`

Everything else is escaped, including all ids, models, efforts, commits, diffstats, counts and labels. When prose has to carry text a worker produced, escape it yourself first.

## Missing figures

Three ways to say "no number", in order of preference:

- `null` → renders `—` in grey, announced to a screen reader as "not available".
- `{"why": "review not dispatched yet"}` → renders a dotted-underlined `—`, the reason on hover and in its `aria-label`. Use when the reason is the interesting part.
- Omit the key → same as `null`.

Keep `why` short and self-contained — it is read aloud as the cell's whole content, so "review not dispatched yet" works and "see note" does not.

Never substitute an estimate. A visible gap is worth more than a number the reader can't trust.

A complete, valid example lives beside this file in [`example-run.json`](example-run.json) — six children across three waves, one queued behind a native edge, gaps with and without reasons, and the usage table. It renders the screenshot in the repository README, so it is kept working.

## Shape

```jsonc
{
  "title": "Dynamic Implement — auth-refactor #412",   // replaces the h1; keep <title> as shipped
  "purpose": "One page for a run in flight: …",          // large lead line
  "subtitle": "Snapshot of run state at the last refresh…",

  // Band 1 — where is the run?
  "masthead": [{ "label": "Repository", "value": "phassle/skills", "mono": true }],
  "tiles": [
    { "label": "Units integrated", "value": "4 / 9", "hint": "wave 1 complete" },
    { "label": "Measured spend", "value": "$4.12", "hint": "API-billed agents only", "kind": "spend" }
  ],
  "progress": { "done": 4, "total": 9, "label": "wave 2 of 3" },

  // Band 2 — what is being built?
  "boardNote": "One card per unit, grouped by wave.",
  "waves": [{
    "wave": 1, "title": "Schema and token store", "note": "no dependencies",
    "units": [{
      "id": "U2", "title": "Token store adapter",
      "state": "ok",                                    // ok | live | waiting | blocked
      "impl":   [{ "model": "sonnet-5", "effort": "medium" }],
      "review": [{ "model": "opus-5", "effort": "high", "role": "spec" }],
      "commit": "b7d9e41", "diffstat": "+301 −44",
      "passes": 3,
      "findings": "2 upheld (TTL off by one, missing revoke path), 1 rejected as sibling scope",
      "note": "Third pass caught a revoke path the planner never specified."
    }]
  }],

  // Band 3 — how is work routed and reviewed?
  "routing": {
    "note": "Route in force now, from the profile's roleDefaults — not what the run started with.",
    "roles": [{
      "role": "Implementer",
      "side": "implement",                              // implement | review — picks the chip hue
      "route": [{ "model": "sonnet-5", "effort": "medium" }],
      "escalation": "→ high on 2nd fail",               // or "fixed"
      "why": "Calibration showed medium clears spec-level units."
    }]
  },
  "pipeline": {                                          // optional; renders as an open <details>
    "title": "Per-unit pipeline",
    "note": "Each stage runs in its own context.",
    "steps": [{ "stage": "Review", "side": "review", "who": [{ "model": "opus-5", "effort": "high" }],
                "sees": "Unit spec and the diff. Never the implementer's transcript." }]
  },

  "usage": {                                             // optional; renders as a closed <details> in band 3
    "title": "Model usage — who ran, how often, at what cost",
    "note": "One row per model+effort actually dispatched, from <code>out/*.json</code>.",
    "rows": [{
      "model": "opus-5", "effort": "high", "side": "review",
      "roles": "spec review, planning",                   // free text: which roles this route served
      "agents": 7, "turns": 96, "duration": "41m",
      "cost": "$3.04"                                     // or null / {"why": "…"} when unmeasurable
    }],
    "total": { "agents": 16, "turns": 214, "duration": "2h 08m", "cost": "$4.12",
               "note": "API-billed agents only; 5 subscription agents unpriced." }
  },

  // Band 4 — what did the run learn?
  "lessons": {
    "note": "Routing changes and safeguards made mid-run, each paired with the failure.",
    "items": [{
      "title": "Security review added as its own role",
      "kind": "routing",                                 // free label: routing | safeguard | …
      "failure": "U2 passed spec review with a missing revoke path.",
      "change": "Second reviewer at xhigh on any unit touching token lifecycle.",
      "landed": "profile: issueModelLadders[].roleDefaults"
    }]
  },

  "footer": ["Snapshot — reflects run state at the last refresh, not a live feed.",
             "Spend covers API-billed agents only; subscription agents are unpriced."]
}
```

## Rules the template enforces, and the ones it doesn't

Enforced by the page: state colour lives on the left rule and the pill; model family lives in the chip hue (`impl` sand, `rev` lavender); numbers use tabular figures; tables scroll inside their own container.

Not enforced — yours to get right:

- **`state` must be one of the four keys.** Anything else renders an uncoloured rule and the raw string in the pill.
- **`side` decides the chip hue.** Put the implementer on `implement` and every reviewer on `review`, or cross-family review stops reading at a glance.
- **`passes: 0` and `passes: null` mean different things.** Zero passes taken vs no review dispatched. Use `{"why": …}` for the second.
- **Empty `impl` / `review` arrays** render `—`. Correct for a queued unit; a bug for an integrated one.
- **`footer`** carries the snapshot date and the cost caveat. An unqualified total reads as complete.
- **`usage.total` is a sum of what was measured, not of what ran.** When some agents bill against a subscription, their turns and duration still count but their cost does not — say so in `total.note` or the row's `cost` gap, or the total reads as the run's bill.
