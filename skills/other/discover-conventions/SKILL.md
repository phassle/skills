---
name: "discover-conventions"
description: Scan an existing codebase for coding conventions, competing patterns and inconsistent terminology, then grill the developer through each decision so they choose what becomes standard. Writes only approved decisions to the glossary, ADRs and CODING_STANDARDS.md, and turns mechanical rules into automated checks. Use when onboarding agents to a brownfield repo, or when the user asks to find patterns, standardize conventions or write coding standards for an existing codebase.
disable-model-invocation: true
metadata:
  version: 0.2.0
---

# Discover conventions

You find patterns. The developer decides what they mean. A pattern becomes a rule only after an explicit yes from the developer.

This skill builds on Matt Pocock's skills and follows their current conventions. Model-invoked ones you call with the Skill tool:
- `grilling` for the interview (rounds over a decision frontier)
- `domain-modeling` for terms in `GLOSSARY.md` and for ADRs in `docs/adr/`
- `writing-for-agents` for the style of every rule you write, since `CODING_STANDARDS.md` is a document agents consume

User-invoked ones only the developer can start. Hand off by telling them which command to run:
- `/setup-matt-pocock-skills` configures the issue tracker and domain doc layout, and renames a legacy `CONTEXT.md` / `CONTEXT-MAP.md` to `GLOSSARY.md` / `GLOSSARY-MAP.md`
- `/to-questionnaire` when a decision belongs to someone who is not present
- `/to-tickets` for cleanup work after a decision

Rules go where Matt's `code-review` reads them and his `retro` adds to them: a root `CODING_STANDARDS.md`, written the way `retro` writes it (see Phase 4).

## Where things are saved

```
CODING_STANDARDS.md    Approved judgement-call rules, one ## section per area
GLOSSARY.md            Domain terms (or per-context files listed in GLOSSARY-MAP.md), via domain-modeling
docs/adr/NNNN-slug.md  ADRs, via domain-modeling
docs/coding-standards/
  decisions.md         Decision log, newest first
  open-questions.md    Parked and delegated questions
  sessions/
    <YYYY-MM-DD>/
      report.html      The visual report for that session
      findings.json    Raw findings, evidence and outcomes
```

If the repo already keeps its rules somewhere else (a `CONTRIBUTING.md`, a standards folder), ask before moving them; extend the existing rules file rather than creating a second one beside it. `code-review` reads `CODING_STANDARDS.md` and `CONTRIBUTING.md` either way.

Three layers with different readers:

- **Rules** (`CODING_STANDARDS.md`) are read by the **reviewer agent** during review, not by the implementation agent: the reviewer has the least context pressure, so it carries the standards. Only current, approved judgement calls. No history, no rationale beyond one line. Past about 1,000 lines, add **navigation pointers** to docs folders. AGENTS.md / CLAUDE.md stay untouched: `code-review` finds `CODING_STANDARDS.md` on its own.
- **Decision log** (`decisions.md`) is for humans. One entry per decision, newest first: date, who decided, the variants considered, the outcome, a short why, and a link to the session. Record rejected and "neither" outcomes too, so later runs leave them alone. Decisions that meet the ADR bar are written as ADRs and the log entry links to the ADR.
- **Sessions** (`sessions/<date>/`) are evidence, frozen once the session ends. `findings.json` holds one object per finding:

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
  "enforcement": "check | standard | glossary | adr",
  "rule_ref": "CODING_STANDARDS.md#errors"
}
```

The finding `id` must be stable across runs (area plus a short slug) so the next run can match it.

## Principles

1. **Describe the code as it is.** Redesign belongs in a separate discussion or ticket.
2. **Frequency is not value.** A pattern earns a rule only if a future agent could plausibly choose differently. Framework defaults and anything a linter, formatter or analyzer already enforces are not rules.
3. **Mixed evidence stays mixed.** When two variants both have real usage, present both and let the developer pick the winner.
4. **Deliberate absences count.** "There is no repository layer, controllers call the ORM directly" is a decision worth recording.
5. **Evidence before recording.** Every proposed rule shows file paths that support it. Threshold for "consistent": at least three examples and no meaningful rival.
6. **Check before prose.** A mechanical rule becomes a deterministic check; prose is for judgement calls.

## Phase 0: Read what is already decided

Before scanning, read:
- AGENTS.md, CLAUDE.md and any nested ones, including the `## Agent skills` block and the `docs/agents/*.md` files it points to
- The domain docs: `GLOSSARY.md`, or `GLOSSARY-MAP.md` and every `GLOSSARY.md` it lists; ADRs in `docs/adr/` and any `src/*/docs/adr/`
- `CODING_STANDARDS.md` and `CONTRIBUTING.md`, if they exist
- Linter, formatter and analyzer config (eslint, prettier, .editorconfig, ruff, Roslyn analyzers, etc.)
- The repo's own **guardrail**: its check command (`package.json` / build-tool `lint` / `check` scripts), pre-commit hooks and CI workflows
- `docs/coding-standards/decisions.md`, `open-questions.md` and the latest `sessions/*/findings.json` if they exist

Missing domain docs are normal: proceed silently with the single-context layout (root `GLOSSARY.md`, `docs/adr/`); `domain-modeling` creates the files lazily. Two cases need the developer to run `/setup-matt-pocock-skills` first, so say so: a legacy `CONTEXT.md` / `CONTEXT-MAP.md` exists (the skills only read the `GLOSSARY` names now), or the developer wants cleanup tickets and no issue tracker is configured.

Anything already decided is out of scope; leave it settled. Findings with outcome `rejected` or `neither`, and alternatives an ADR rejected, come back only when the evidence has changed significantly (say so if it has). Parked items come back only if the developer wants to revisit them. If the code contradicts an existing decision, report it as drift: _"Contradicts ADR-0007 (event-sourced orders)"_ or _"Contradicts CODING_STANDARDS.md#errors"_.

## Phase 1: Scan

Use parallel sub-agents per area, each with a fresh context window, when the repo is large. Cover at least:

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
- **Terminology:** different words for the same domain concept (customer/client/member), or one word used for two concepts. Use the glossary's vocabulary when naming findings.

For each finding record: the variants, number of occurrences per variant, three example paths per variant, and which variant appears in the most recent commits (`git log` on the example files). Recency often reveals which variant the team is moving toward.

Also classify each finding as **mechanical** (a fixed syntactic pattern, a banned API, an import shape, a file-location rule: something a tool can check) or a **judgement call** (cross-file consistency, "matches the surrounding style", anything no guardrail could substitute for). This decides where an approved decision lands in Phase 4.

## Phase 2: Classify and report

Sort every finding into one bucket:

| Bucket | Meaning | What happens |
|---|---|---|
| Consistent | 3+ examples, no rival | Ask developer to confirm |
| Competing | 2+ variants with real usage | Grill |
| Terminology | Synonyms or overloaded domain terms | Grill, then glossary |
| Deliberate absence | Something conspicuously missing | Ask if intentional |
| Drift | Code contradicts an existing documented decision | Report only |
| Discarded | Framework default or tool-enforced | Mention count, no question |

A repo with no guardrail at all (no pre-commit hook and no CI job running its lint / typecheck / test command) is a finding in its own right: report it at the top, since every mechanical rule decided later needs somewhere to run.

### The HTML report

Present the findings as a visual HTML report, in the style of Matt's `improve-codebase-architecture`. The developer should understand each finding at a glance before being asked anything.

Write one self-contained file to `docs/coding-standards/sessions/<YYYY-MM-DD>/report.html`, and the raw findings to `findings.json` next to it. Load Tailwind and Mermaid from CDNs; inline everything else. Use Mermaid for graph-shaped structure and hand-built divs or inline SVG for the editorial visuals (usage bars, recency strips). It must read well in light and dark mode and on a laptop screen during a meeting. If the environment can publish HTML artifacts, publish it. Otherwise open it in the browser (`open` on macOS, `xdg-open` on Linux, `start` on Windows) and give the absolute path.

Structure:

1. **Overview**
   - One sentence on what was scanned (repo, commit hash, date, file count)
   - Count per bucket as a simple bar or tile row
   - Guardrail status: which checks exist and where they run
   - A Mermaid diagram of the architecture as the code actually is today: layers or modules and the dependency direction between them. Color the edges where competing patterns occur.

2. **Competing patterns** (one card each, ordered by blast radius)
   - Title in plain language ("Two ways to return errors from services")
   - Two-column comparison: variant A and variant B, each with a short code excerpt, occurrence count and three file paths
   - Usage bar showing the split (for example 62 % A, 38 % B)
   - Recency strip: which variant appears in recent commits
   - A small Mermaid diagram when the pattern is structural (for example which layers use A and which use B, or the call flow for each variant)
   - "Why it matters for agents": one or two sentences on what goes wrong if an agent picks the wrong variant
   - Enforcement badge: `Check` (mechanical) or `Standard` (judgement call)
   - Agent recommendation, visually separated and labelled as a recommendation
   - Decision field, empty until the interview

3. **Terminology map**
   - A Mermaid graph that clusters synonyms around the concept they refer to (customer, client, member pointing to one concept) and marks overloaded terms that point to two concepts
   - One row per term with example paths, and the existing glossary entry when there is one

4. **Consistent conventions**
   - Compact table: convention, scope, count, one example path, enforcement, confirm status

5. **Deliberate absences and drift**
   - Absences as short statements with the evidence that something is missing
   - Drift as a table: documented decision (ADR, glossary term or rule), where the code contradicts it

6. **Discarded**
   - Collapsed section with counts and one line per discarded item, so the developer can see what was filtered and why

7. **Open questions**
   - Filled during and after the interview

Writing rules for the report:
- Plain language first, jargon second. A product owner should follow the overview.
- Every claim links to file paths.
- Diagrams show the code as it is today.
- Keep code excerpts under 15 lines, cut to the part that differs.

After writing it, give a short summary in chat: counts per bucket, guardrail status and the top three competing patterns. Let the developer reorder or skip items before the interview starts.

During the interview, update the report and `findings.json` as decisions are made: fill the decision field on each card, set `outcome`, `decided_by` and `enforcement`, and move parked items to Open questions. The finished session folder is the record of what was found and decided that day.

## Phase 3: Interview

Call the Skill tool with `grilling` and `domain-modeling`, and follow them: `grilling` for the rounds, `domain-modeling` for every terminology finding. Each finding is a decision on the design tree. Architecture decisions are prerequisites for the narrower ones that hang off them, so the first frontier is usually the widest blast radius; naming waits until its layer is settled.

For each competing pattern, the question body shows:
- Variant A and variant B, each with one short code excerpt and its count
- Which variant is newer
- Whether it is mechanical (becomes a check) or a judgement call (becomes a standard)
- The choices:
  1. A is the standard
  2. B is the standard
  3. Both are valid, with a rule for when to use which (ask for the rule)
  4. Neither, we want something else (record the intent, offer a ticket, leave the design for later)
  5. Not my call, ask someone else (delegated: the developer runs `/to-questionnaire`)
  6. Undecided, park it
- Was the losing variant a deliberate exception anywhere? If yes, capture the exception and its scope.

Then your recommended answer on the `➡️` line, worded so "yes" accepts it. Consistent findings and deliberate absences fit several to a round, but each needs its own yes or no; an unanswered item stays open.

Facts are your job: when a question needs one (does this variant appear in tests too, is the newer variant only in one module), dispatch a sub-agent to find it instead of asking the developer.

When the developer is unsure, park the question. An unrecorded decision is better than a wrong rule that every agent will follow.

The interview is done when the frontier is empty and the developer confirms you have reached a shared understanding. Write nothing in Phase 4 before that confirmation.

## Phase 4: Write approved decisions

Call the Skill tool with `writing-for-agents` before writing any rule. Then route each approved decision:

| Decision | Destination |
|---|---|
| Domain term, synonym resolved | `GLOSSARY.md` via `domain-modeling`: the canonical term, rivals under `_Avoid_`. Only domain concepts; naming of general programming constructs is a coding convention. |
| Hard to reverse, surprising without context, and a real trade-off (all three) | ADR in `docs/adr/` via `domain-modeling` |
| Rejected or "neither" with a load-bearing reason | Offer an ADR so future runs and reviews stop re-suggesting it; skip ephemeral or self-evident reasons |
| Mechanical convention | A deterministic check: a custom rule in the repo's own linter or analyzer, a pre-commit hook, or a CI job, whichever the repo's language and existing guardrail make cheapest. Show the check and ask before adding it. |
| Judgement-call convention | The area's `##` section of `CODING_STANDARDS.md` |

Default to building the check over writing the rule. A declined check falls back to a standard only if the developer says so; record which in `decisions.md`.

Rule format in `CODING_STANDARDS.md`:
- Imperative, one sentence ("Return errors as `Result<T>` from application services.")
- Scope (glob or folder)
- One example path that shows it done right
- One line of why, if it is not obvious

Every outcome, including rejected, neither, delegated and parked, gets an entry in `decisions.md`. Parked and delegated questions go into `open-questions.md` and the report's Open questions section, with the path of the `to-questionnaire-<slug>.md` file when one was written; rules files hold approved rules only.

Leave existing code as it is. If the developer wants cleanup, hand off to `/to-tickets` with the decisions as input.

## Phase 5: Hand back to the team

Put all changes (`CODING_STANDARDS.md`, new checks, glossary and ADRs, and the decision log, open questions and session folder under `docs/coding-standards/`) on one branch and summarize:
- Decisions recorded and where
- Checks added, and checks proposed but declined
- Questions parked or sent to others
- Optional cleanup to run through `/to-tickets`

Recommend that the team reviews the changes as a PR. Conventions are team decisions, and the PR is where colleagues can disagree.

## Re-running

Run in report-only mode when the codebase has changed. Compare against the latest `findings.json` by finding `id`:
- Check that cited example paths in the rules still exist
- Flag rules whose scope matches no files
- Show how counts moved for decided patterns (is the losing variant shrinking or growing?)
- Flag judgement-call rules that have since become mechanical enough for a check
- Report new competing patterns

Write a new session folder. The report starts with a "Changed since last run" section. Any rewrite of rules still goes through the developer.
