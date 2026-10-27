---
name: multi-code-review
description: Review code changes with the multi-code-review MCP server across security, architecture, best-practices, testing, correctness and reliability, triage the findings with the user, and record what the team decided so later reviews follow it. Use before opening or updating a pull request, when asked to review a branch, worktree or PR, to triage review findings, or to get a list of what to fix.
metadata:
  version: 0.1.0
---

# multi-code-review

Requires the multi-code-review server running locally (MCP at
`http://127.0.0.1:7700/mcp`). Get it from
[phassle/multi-code-review](https://github.com/phassle/multi-code-review),
run `./setup.sh` (or `aspire start`), then
`claude mcp add --transport http multi-code-review http://127.0.0.1:7700/mcp`.

The `multi-code-review` MCP server runs one container per category
(`security-semgrep`, `architecture-eslint`, `correctness-tsc`, ...) and returns
their findings on the lines you changed. Each repo keeps what its team decided
about findings in `.mcr/decisions.yml`, and every review applies it. That file
is how the review learns the codebase.

## Review

1. If a category says "no analyzer" for a stack, or a note says a profile is
   not running, call `detect_stack` and tell the user to run `./setup.sh`.
   Call `run_review` with the absolute path of the repository or worktree.
   Leave `base` empty unless the user names one. Run `git fetch origin` first
   if the base may be stale.
2. Read the per-category verdict table, then the findings:
   - ⛔ **blocking**: new, high severity, no accepting decision. Fix it, or triage it.
   - ⚠️ **warn**: new, medium severity.
   - ℹ️ **info**: low severity or pre-existing.
   - ✔️ **accepted / false positive** (D-xxxx): the team decided. Say which norm
     it breaks and the recorded reason; never re-argue it.
   - 📋 **to fix** (D-xxxx): decided, not done yet.
3. Treat analyzer findings as facts. Verify one against the code before calling
   it a false positive, and say what you checked.
4. Then review the diff yourself, only where tools are blind. A category whose
   row says "no analyzer" depends on you entirely.
   - **architecture**: fit with `AGENTS.md`, `docs/adr/` and module boundaries.
   - **testing**: do the tests assert the behaviour that changed, with edge cases?
   - **correctness**: logic, units, time zones, unhandled states.
   - **reliability**: idempotency, retries, timeouts, partial failure, races.
   - **security**: authorisation and tenant isolation.
   Give each finding a stable rule id `llm:<short-slug>` (for example
   `llm:job-not-idempotent`), a file, a line and evidence. Drop any you cannot
   point to. Then call `apply_decisions` with them, and report matched ones as
   the team decided.

## Triage: deciding with the user

Use this when the user wants to go through findings, wants a fix list, or
when blocking findings remain. Run it like a grilling session: one question at
a time, wait for the answer, never decide for the user.

1. `triage_queue` (pass `review_id` from the review to avoid re-running). For
   a first pass over a whole codebase, use `scope: "all"`.
2. For each group, most severe first, show the rule, what it means, two or
   three of its findings, and the suggestion if there is one. Ask:
   - **Fix**: it is a real problem. It goes on the to-fix list.
   - **Accept**: it breaks the norm, but on purpose here. Ask why and for a
     reference (ADR, issue).
   - **False positive**: the tool is wrong here. Ask what makes it wrong.
   - **Disable**: this rule does not apply to this codebase or these paths.
   And for what scope: **this occurrence**, **these paths** (suggest the
   narrowest glob that covers the findings), or **the whole repo**.
3. A reason is required for everything except fix. Use the user's words.
4. Collect the answers, then call `record_decisions` once. It returns the
   complete new `.mcr/decisions.yml`. Write it verbatim, show the diff, and
   tell the user it is committed and reviewed like code. Do not edit the file
   by hand, and do not commit it unless asked.
5. Finish with `fix_report`: the checklist of what to fix, what is still
   undecided, what was accepted and why, and decisions that matched nothing and
   can be removed.

## Reporting

Write the report in English, whatever language the user writes in.
Start your answer with the report link, as a clickable Markdown link: the
review's line `📄 **Full report:** [http://…/reports/R-xxxxxxxx](…)`, copied as
is. It opens every finding with its code in the browser while the gateway runs.
Lead with the verdict table. When Jev ran, each finding carries its
`p(real)` and verdict, and the report ends with **To fix, per Jev**: the
findings Jev judged real, most certain first, each with location, problem, reference, code excerpt and a check (`run_analyzer`). Fix from that list; show both. Jev never unblocks a
security finding alone: one it calls a likely false positive still blocks and
needs a human decision (triage). Group findings by category in this order:
security, correctness, reliability, architecture, testing, best-practices.
Blocking findings come first in each. End with one line: the blocking count,
or "passed".

## When the server is unavailable

If `list_analyzers` fails or the tools are missing, the stack is not running.
Tell the user to start it from the multi-code-review checkout:

```bash
docker compose up -d
```

A path outside `MCR_ROOT` is refused, and the error says so. Ask the user to
widen `MCR_ROOT`; do not work around it.
