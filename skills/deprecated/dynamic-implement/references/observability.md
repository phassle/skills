# Agent activity logging

Make every dispatched role inspectable without recording hidden reasoning. Create the activity root beside the run ledger and announce its absolute path before the first dispatch.

## Layout and isolation

Use one private directory per agent:

```text
<run-state>/activity/
├── coordinator/events.jsonl
├── coordinator/activity.log
├── planner-01/events.jsonl
├── planner-01/activity.log
└── reviewer-01/events.jsonl
```

Give an agent only its own directory. Agents append events but never read their own or another agent's log. Every child agent gets another private directory before dispatch.

For each Matt review pass, create a standalone temporary bundle containing empty directories for `review-coordinator`, `review-standards`, and `review-spec`. Expose only that bundle and the three destinations to the top-level reviewer; do not expose the run root, ledger, rendered log, or prior activity. Append the event command and the appropriate child destination to Matt's required Standards and Spec prompts without altering their review briefs or reports. After the top-level reviewer exits, import the three private directories beneath `<run-state>/activity/`; only then may the coordinator render them with the rest of the run.

If slot recovery requires two external leaf reviewers, give each only its axis directory and explicitly identify it as the final leaf so it performs the brief directly instead of spawning another child. Launch both concurrently, record the capacity fallback in coordinator evidence, and apply the same import gate after both processes exit.

## Event command

Use `scripts/agent_log.py` from the installed skill. Each event requires an agent directory, run id, agent id, role, event type, and plain-language summary:

```text
python3 <skill>/scripts/agent_log.py event \
  --agent-dir <private-agent-dir> \
  --run-id <run-id> --agent-id <agent-id> --role <role> \
  --event <event> --summary "observable action or result" \
  --issue <issue> --unit <unit> --phase <phase> \
  --harness <harness> --model <model-id> --effort <native-effort> \
  --command "command or check" --result "pass/fail/result" \
  --files "changed-file or diff summary" \
  --next-step "next observable action" --blocker "blocker or empty"
```

Valid roles are `coordinator`, `planner`, `implementer`, `reviewer`, and `merger`. Valid events are `assigned`, `started`, `decision`, `command`, `files_changed`, `test`, `review`, `handoff`, `progress`, `blocked`, `completed`, and `error`.

Log at these boundaries:

1. `assigned` by the coordinator before dispatch.
2. `started` by the agent before its first task action.
3. `decision` for plan, route, dependency, escalation, or integration choices, with concise source evidence.
4. `command`, `files_changed`, `test`, or `review` after every meaningful batch.
5. `progress` before a potentially long-running check and after any material phase change.
6. Exactly one terminal `completed`, `blocked`, or `error` event before handoff.

Summaries state what happened and why at decision level, not private chain-of-thought. Record issue/unit identifiers, commands, exit/result summaries, changed paths or diff summary, next step, blocker, exact harness/model route, exact native effort, ladder index or boundary-probe purpose when applicable, and reported usage when available. Keep each event self-contained.

For event schema v2, `model` and `effort` are an inseparable pair. When a model is recorded, pass `--effort` on every event for that agent. Use the selected native value such as `low`, `medium`, or `high`; use `unknown` only when the harness cannot report the active value and `unsupported` only when it exposes no effort control. Never omit effort or infer it from the model id. Legacy schema-v1 events remain readable but are not backfilled because historical effort may be unknowable.

Never log prompts, transcripts, hidden reasoning, secrets, tokens, credential-bearing endpoints, raw environment dumps, or full issue/code contents. Redact sensitive command arguments and summarize large outputs.

## Rendering and acceptance

After agents finish—and only after a reviewer exits—render the combined view:

```text
python3 <skill>/scripts/agent_log.py render --run-dir <run-state>
```

The renderer sorts events by timestamp and writes both JSONL and readable Markdown atomically. In user progress updates, give the run directory and a command such as `tail -F <run-state>/activity/*/activity.log` for live inspection.

For smoke tests, write `<run-state>/smoke-test-report.md`. Include the check matrix and one improvement record for every failed, blocked, missing, or malformed event: agent/role/phase and timestamp, expected behavior, observed evidence, minimal reproduction command, likely contract or harness boundary, and proposed skill/config change. Keep hypotheses labelled as hypotheses. Preserve the raw private logs and rendered view; the smoke run reports defects but does not repair or rerun past them.

A dispatch is observable only when its private JSONL is valid, begins with `started` after any coordinator `assigned` record, records model and effort together, and ends in one terminal event. This gate applies recursively to every child, including Matt's Standards and Spec agents. Missing, malformed, or unterminated logs fail smoke testing and block acceptance of the parent handoff.

A reviewer may write its private events and report even under a repository read-only policy. Grant that narrow path explicitly, then verify the repository HEAD, status, and diff stayed unchanged. Treat an accidental redundant leaf spawn, stale `pending_init` wait, or process interrupted after producing a report as an observability failure until its lifecycle is reconciled; never infer a clean terminal event from silence.
