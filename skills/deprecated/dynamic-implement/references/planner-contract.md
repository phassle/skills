# Planner contract

## Contents

- Structured result
- Deciding what runs in parallel
- Planner rules

Run the planner in a fresh, read-only context. Let it inspect the issue, comments, repository, tests, domain docs, ADRs, Git policy, and tracker configuration. Child tickets already define the decomposition; do not give it a preferred scheduling result.

Give it a private agent-log directory and the event command from `observability.md`. Require `started`, a `decision` summarizing descendant coverage, scheduling, and dependency evidence, and a terminal `completed` or `blocked` event. The planner must not read another agent's log.

Require one structured result with these fields:

```json
{
  "spec": {"id": "42", "title": "...", "source": "..."},
  "base": {"branch": "develop", "sha": "..."},
  "git_policy_sources": ["AGENTS.md"],
  "integration": {
    "branch": "feature/42-example",
    "target": "develop",
    "mode": "pull-request"
  },
  "requires_user_input": [],
  "external_blockers": [],
  "descendant_coverage": [
    {
      "issue": "#43",
      "state": "open|closed",
      "ready_for_agent": true,
      "disposition": "unit:01|verified-integrated"
    }
  ],
  "test_seams": [
    {"name": "CLI", "boundary": "binary process", "evidence": "exit/status/files", "agreed": true}
  ],
  "units": [
    {
      "id": "01",
      "issue": "#43",
      "title": "...",
      "outcome": "observable end-to-end capability",
      "acceptance_criteria": ["..."],
      "model_triage": {
        "size": "small|medium|large",
        "risk_factors": ["localized-known-pattern"],
        "confidence": "low|medium|high",
        "calibration_keys": ["language", "change-kind", "risk-kind"]
      },
      "depends_on": [],
      "conflicts_with": [
        {
          "unit": "12",
          "symbols": ["src/tui.rs::draw_result"],
          "strategy": "stack",
          "rationale": "both rewrite draw_result; 12's responsive degradation extends 11's rendering"
        }
      ],
      "anticipated_paths": ["src/..."],
      "branch": "feature/42-example-unit-01"
    }
  ],
  "waves": [
    {"mode": "parallel", "units": ["01", "02", "03"]},
    {"mode": "stack", "units": ["11", "12"], "reason": "see conflicts_with on 11"},
    {"mode": "serial", "units": ["13"], "reason": "sole writer of the schema migration"}
  ],
  "verification": ["project-specific command"]
}
```

Planner rules:

- Fetch the complete candidate graph; paginate or set an explicit high limit and verify descendants.
- Copy ticket outcomes and acceptance criteria without rewriting them. The ticket contract is immutable.
- Require `ready-for-agent` on every descendant child. Missing labels, ambiguous or contradictory requirements, infeasibility, missing decisions, and necessary scope departures require HITL; never repair the ticket or label.
- When children exist, map every open descendant to exactly one unit and every unit to exactly one open descendant. Never combine, split, synthesize, or omit tickets. Record closed descendants as `verified-integrated` only with tracker and Git evidence.
- Reject incomplete or duplicate `descendant_coverage`. No feature PR is ready while any descendant lacks an evidence-backed disposition.
- Treat native blockers as authoritative.

## Deciding what runs in parallel

**This is the planner's decision, and it must be made here rather than left to the orchestrator to
improvise per wave.** State it explicitly for every unit; an orchestrator re-deriving it mid-run has
less evidence than the planner had and will default to whatever is safest, which is almost always
slower than necessary.

Keep two graphs and never merge them:

- **`depends_on` — semantic dependencies.** This unit needs another unit's *behaviour* to exist. The
  tracker's native blocking edges are authoritative here and are never overridden. A unit with an open
  native blocker is not schedulable at all.
- **`conflicts_with` — predicted write overlap.** Two units that would edit the same code. This is a
  *forecast*, not a fact, and it must never be folded into `depends_on`: doing so converts a guess
  about merge friction into a hard ordering constraint and silently serializes work that could have
  run at once.

**Default to parallel. Serialization is the exception and requires a stated reason.** For every pair
the planner will not run concurrently, name the strategy and why:

- **`parallel`** — no predicted overlap. Run at once from the same pinned base.
- **`stack`** — real overlap, but one unit's change is a natural *base* for the other: the second
  extends, degrades, or re-renders what the first produces. Cut the second from the first's branch
  head rather than the integration head. The second sees the first's code and builds on it, so there
  is nothing to reconcile, and the expensive part — review and merge latency — still overlaps. Prefer
  this to serializing whenever the overlap has a natural direction.
- **`serial`** — mutually entangled: each unit needs to see the other's finished state, or both
  restructure the same interface in incompatible directions. Genuinely rare. Say what makes it mutual.

**Predict conflicts at symbol granularity, not file granularity.** Name the functions, types, or
migrations — `src/tui.rs::draw_result`, not `src/tui.rs`. Two units editing different functions in one
large file merge cleanly; a file-level prediction over-serializes an entire module and is usually
wrong. A symbol-level prediction is also cheap for the orchestrator to check against the real diff,
which makes it falsifiable rather than merely cautious.

**Where several units write one file, give each an insertion anchor — "distinct sections" is not the
same as distinct insertion points.** A planner can be entirely right that twelve units own twelve
semantically separate sections and still have them collide, because two agents appending at
end-of-file write the same line. Name an explicit textual anchor per concurrent unit rather than a
section, and define it against **what is last in that unit's own base**, not against the intended
final document. One run called two anchors well separated because one inserted after a named section
and the other appended at EOF; in their shared base that named section *was* last, so both named the
same point and they conflicted. Where an anchor cannot be made unambiguous, hold the unit until the
one it would collide with merges, and record the hold as a scheduling decision rather than
discovering it as a conflict.

Say plainly that these predictions are the planner's forecast and may be overridden on evidence: if
the orchestrator inspects the actual change and finds the named symbols untouched, it may promote a
`stack` or `serial` pair to `parallel` and record that it did.
- Treat each `ready-for-agent` child as the approved vertical slice sized by `to-tickets`; do not redecompose it.
- Triage every unit as small, medium, or large using the rubric in `model-routing.md`. Classify reasoning/risk, not raw line count, and do not use a stronger model to avoid necessary decomposition.
- Use the compact historical calibration supplied by the orchestrator, but keep the issue/spec and current repository as primary evidence. Never invent a model id; the orchestrator maps size to a verified route.
- Do not invent, reinterpret, narrow, expand, or edit product decisions, acceptance criteria, scope, dependencies, or test seams.
- Mark proposed seams `agreed: false`; implementation must pause for approval.
- Use deterministic branch names so a rerun resumes existing work.
- Return no executable wave when all work is blocked. Never choose a "least blocked" task.
- Give every wave a `mode` of `parallel`, `stack`, or `serial`, and a `reason` for anything but
  `parallel`. A wave without a mode is malformed output, not a wave to be interpreted charitably.
- Keep anticipated paths advisory; implementers must still explore current code.

Reject malformed, contradictory, or incomplete planner output instead of interpreting it optimistically.
