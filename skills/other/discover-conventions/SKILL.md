---
name: "discover-conventions"
description: Scan an existing codebase for coding conventions, competing patterns and inconsistent terminology, then interview the developer one decision at a time so they choose what becomes standard. Writes only approved decisions to the glossary, ADRs, coding standards and AGENTS.md. Use when onboarding agents to a brownfield repo, when the user asks to find patterns, standardize conventions, or set up AGENTS.md for an existing codebase.
disable-model-invocation: true
metadata:
  version: 0.1.0
---

# Discover conventions

You find patterns. The developer decides what they mean. Nothing becomes a rule without an explicit yes from the developer.

This skill builds on Matt Pocock's skills. Use them instead of re-implementing their work:
- `grilling` for the interview loop (one question at a time, wait for the answer)
- `domain-modeling` for glossary terms in CONTEXT.md and for ADRs
- `writing-for-agents` for any edit to AGENTS.md or CLAUDE.md
- `to-questionnaire` when a decision belongs to someone who is not present
- `to-tickets` for optional cleanup work after a decision

The rules themselves go where his `code-review` reads them and his `retro` adds to them: a root `CODING_STANDARDS.md`.

If `setup-matt-pocock-skills` has not been run in this repo, say so and offer to run it first, since it defines where the domain docs live.

## Where things are saved

The rules live in `CODING_STANDARDS.md` at the repo root; everything else this skill produces lives in `docs/coding-standards/`. If the repo keeps its rules somewhere else already (a `CONTRIBUTING.md`, a standards folder), ask before moving them; never create a second rules file beside an existing one.

```
CODING_STANDARDS.md    Approved rules, one ## section per area (Server actions, Data access, Testing ...)
docs/coding-standards/
  decisions.md         Decision log, newest first
  open-questions.md    Parked and delegated questions
  sessions/
    <YYYY-MM-DD>/
      report.html      The visual report for that session
      findings.json    Raw findings, evidence and outcomes
```

Three layers with different readers:

- **Rules** (`CODING_STANDARDS.md`) are what agents, `code-review` and `retro` follow and extend. Only current, approved rules. No history, no rationale beyond one line. Mechanical rules become lint or analyzer rules instead; the file holds judgement calls. AGENTS.md gets a single line pointing to `CODING_STANDARDS.md`, never the rules themselves. Past about 1,000 lines, `retro`'s guidance applies: add navigation pointers to docs folders.
- **Decision log** (`decisions.md`) is for humans. One entry per decision, newest first: date, who decided, the variants considered, the outcome, a short why, and a link to the session. Record rejected and "neither" outcomes too, so later runs do not propose them again. Large architectural decisions are written as ADRs via `domain-modeling` and the log entry links to the ADR.
- **Sessions** (`sessions/<date>/`) are evidence. Never edit an old session. `findings.json` holds one object per finding:

```json
{
  "id": "errors-service-return",
  "bucket": "competing",
  "title": "Two ways to return errors from services",
  "variants": [
    { "name": "A", "summary": "Throw domain exceptions", "count": 41, "examples": ["src/..."], "newest_commit": "2026-09-30" },
    { "name": "B", "summary": "Return Result<T>", "count": 25, "examples": ["src/..."], "newest_commit": "2026-10-20" }
  ],
  "recommendation": "B",
  "outcome": "B | A | both | neither | delegated | parked | confirmed | rejected",
  "decided_by": "name",
  "rule_ref": "CODING_STANDARDS.md#errors"
}
```

The finding `id` must be stable across runs (area plus a short slug) so the next run can match it.

## Principles

1. **Describe the code as it is.** Do not redesign the application. Proposed improvements go in a separate discussion or ticket.
2. **Frequency is not value.** A pattern earns a rule only if a future agent could plausibly choose differently. Framework defaults and anything a linter, formatter or analyzer already enforces are not rules.
3. **Mixed evidence stays mixed.** When two variants both have real usage, present both. Never pick a winner silently.
4. **Deliberate absences count.** "There is no repository layer, controllers call the ORM directly" is a decision worth recording.
5. **Evidence before recording.** Every proposed rule shows file paths that support it. Threshold for "consistent": at least three examples and no meaningful rival.
6. **Less is more.** Every line written into AGENTS.md costs context on every task. Prefer scoped files and short rules.

## Phase 0: Read what is already decided

Before scanning, read:
- AGENTS.md, CLAUDE.md and any nested ones
- The domain docs configured by `setup-matt-pocock-skills` (glossary, ADRs)
- `CODING_STANDARDS.md`, the rules `code-review` checks against, if it exists
- Linter, formatter and analyzer config (eslint, prettier, .editorconfig, ruff, Roslyn analyzers, etc.)
- `docs/coding-standards/decisions.md`, `open-questions.md` and the latest `sessions/*/findings.json` if they exist

Anything already decided is out of scope. Do not ask about it again. Findings with outcome `rejected` or `neither` are not proposed again unless the evidence has changed significantly (say so if it has). Parked items are offered again only if the developer wants to revisit them. If the code contradicts an existing decision, report it as drift, not as a new question.

## Phase 1: Scan

Use parallel sub-agents per area when the repo is large. Cover at least:

- **Architecture:** layering, where business logic lives, module boundaries, dependency direction
- **Data access:** ORM usage, queries, transactions, migrations
- **Errors:** exceptions vs result types, error shapes in APIs, logging of failures
- **Validation:** where and how input is validated
- **API shape:** response envelopes, status codes, pagination, naming in payloads
- **Dependencies:** DI style, service lifetimes, factories
- **Async and concurrency:** patterns, cancellation, background jobs
- **Data representation:** money, dates and time zones, IDs, enums
- **Testing:** test location, naming, fixtures, mocking style, test data builders, E2E setup
- **Config and secrets:** how settings are read and where they live
- **Terminology:** different words for the same concept (customer/client/member), or one word used for two concepts

For each finding record: the variants, number of occurrences per variant, three example paths per variant, and which variant appears in the most recent commits (`git log` on the example files). Recency often reveals which variant the team is moving toward.

## Phase 2: Classify and report

Sort every finding into one bucket:

| Bucket | Meaning | What happens |
|---|---|---|
| Consistent | 3+ examples, no rival | Ask developer to confirm |
| Competing | 2+ variants with real usage | Grill |
| Terminology | Synonyms or overloaded terms | Grill, then glossary |
| Deliberate absence | Something conspicuously missing | Ask if intentional |
| Drift | Code contradicts an existing documented decision | Report only |
| Discarded | Framework default or tool-enforced | Mention count, no question |

### The HTML report

Present the findings as a visual HTML report, in the same spirit as `improve-codebase-architecture`. The developer should understand each finding at a glance before being asked anything.

Write one self-contained file to `docs/coding-standards/sessions/<YYYY-MM-DD>/report.html`, and the raw findings to `findings.json` next to it. Inline all CSS and JS. Load Mermaid from a CDN for diagrams. It must read well in light and dark mode and on a laptop screen during a meeting. If the environment can publish HTML artifacts, publish it. Otherwise open it in the browser.

Structure:

1. **Overview**
   - One sentence on what was scanned (repo, commit hash, date, file count)
   - Count per bucket as a simple bar or tile row
   - A Mermaid diagram of the architecture as the code actually is today: layers or modules and the dependency direction between them. Color the edges where competing patterns occur.

2. **Competing patterns** (one card each, ordered by blast radius)
   - Title in plain language ("Two ways to return errors from services")
   - Two-column comparison: variant A and variant B, each with a short code excerpt, occurrence count and three file paths
   - Usage bar showing the split (for example 62 % A, 38 % B)
   - Recency strip: which variant appears in recent commits
   - A small Mermaid diagram when the pattern is structural (for example which layers use A and which use B, or the call flow for each variant)
   - "Why it matters for agents": one or two sentences on what goes wrong if an agent picks the wrong variant
   - Agent recommendation, visually separated and labelled as a recommendation
   - Decision field, empty until the interview

3. **Terminology map**
   - A Mermaid graph that clusters synonyms around the concept they refer to (customer, client, member pointing to one concept) and marks overloaded terms that point to two concepts
   - One row per term with example paths

4. **Consistent conventions**
   - Compact table: convention, scope, count, one example path, confirm status

5. **Deliberate absences and drift**
   - Absences as short statements with the evidence that something is missing
   - Drift as a table: documented decision, where the code contradicts it

6. **Discarded**
   - Collapsed section with counts and one line per discarded item, so the developer can see what was filtered and why

7. **Open questions**
   - Filled during and after the interview

Writing rules for the report:
- Plain language first, jargon second. A product owner should follow the overview.
- Every claim links to file paths. No finding without evidence.
- Diagrams show the code as it is, never a proposed future design.
- Keep code excerpts under 15 lines and cut to the part that differs.

After writing it, give a short summary in chat: counts per bucket and the top three competing patterns. Let the developer reorder or skip items before the interview starts.

During the interview, update the report and `findings.json` as decisions are made: fill the decision field on each card, set `outcome` and `decided_by`, and move parked items to Open questions. The finished session folder is the record of what was found and decided that day.

## Phase 3: Interview

Use `grilling`. One decision per question. Start with competing patterns that have the widest blast radius (architecture before naming).

For each competing pattern, show:
- Variant A and variant B, each with one short code excerpt and its count
- Which variant is newer
- Your recommendation with a one-line reason, clearly labelled as a recommendation

Then offer these answers:
1. A is the standard
2. B is the standard
3. Both are valid, with a rule for when to use which (ask for the rule)
4. Neither, we want something else (record the intent, do not design it now, offer a ticket)
5. Not my call, ask someone else (use `to-questionnaire`)
6. Undecided, park it

Also ask: was the losing variant a deliberate exception anywhere? If yes, capture the exception and its scope.

For consistent findings, you may present several in one message for speed, but the developer must answer yes or no per item. Silence is not approval.

If the developer is unsure, do not push them toward your recommendation. Park it as an open question. An unrecorded decision is better than a wrong rule that every agent will follow.

## Phase 4: Write approved decisions

Route each approved decision to where it belongs:

| Decision type | Destination |
|---|---|
| Domain term, synonym resolved | Glossary via `domain-modeling` |
| Architectural choice with real trade-offs | ADR via `domain-modeling` |
| Coding convention | The area's section of `CODING_STANDARDS.md`, scoped by path where possible |
| Could be enforced by a tool | Propose a lint or analyzer rule instead of prose, ask before adding |
| Must be known on every task | Nothing new in AGENTS.md. It already points to `CODING_STANDARDS.md`. Add or adjust that single pointer via `writing-for-agents` if it is missing |

Every outcome, including rejected, neither, delegated and parked, gets an entry in `decisions.md`.

Rule format for coding standards:
- Imperative, one sentence ("Return errors as `Result<T>` from application services.")
- Scope (glob or folder)
- One example path that shows it done right
- One line of why, if it is not obvious

Parked and delegated questions go into `open-questions.md` and the report's Open questions section, never into a rules file.

Do not refactor code to match the new standards. If the developer wants cleanup, create tickets with `to-tickets`.

## Phase 5: Hand back to the team

Put all changes (`CODING_STANDARDS.md`, and the decision log, open questions and session folder under `docs/coding-standards/`, plus any AGENTS.md pointer and ADRs) on one branch and summarize:
- Decisions recorded and where
- Questions parked or sent to others
- Proposed tool rules
- Optional cleanup tickets

Recommend that the team reviews the changes as a PR. Conventions are team decisions, and the PR is where colleagues can disagree.

## Re-running

Run in report-only mode when the codebase has changed. Compare against the latest `findings.json` by finding `id`:
- Check that cited example paths in the rules still exist
- Flag rules whose scope matches no files
- Show how counts moved for decided patterns (is the losing variant shrinking or growing?)
- Report new competing patterns

Write a new session folder. The report starts with a "Changed since last run" section. Any rewrite of rules still goes through the developer.
