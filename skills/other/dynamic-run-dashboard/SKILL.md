---
name: dynamic-run-dashboard
description: Publish or refresh the operations dashboard for a Dynamic Implement run — one page carrying what is being built, who builds and reviews each unit, and what the run has learned. Use when the user asks for a dashboard, one-pager, or status page for a run, or to refresh one after an integration milestone.
---

A Dynamic Implement run outruns its transcript: a dependency graph, a per-unit review history, a routing policy that shifts mid-run, and a ledger nobody wants to read. This skill turns that into one page the user keeps open.

The page is a **permalink**: one file at `<run-state>/dashboard.html`, written and overwritten there for the whole run. The delivery mechanism varies by host and may even fail over mid-run; the address never moves. A page the user has to re-find is not a dashboard.

Its content is a **snapshot** — every figure read from run state at the moment of writing, none of it remembered, none of it estimated.

## Deliver to the host you actually have

Discover what the host supports before writing; never assume an artifact canvas or a terminal widget exists.

| Host | Primary | Fallback |
| --- | --- | --- |
| **GitHub Copilot** | `open_canvas` with a registered canvas type | write the permalink, tell the user `open <path>` |
| **Claude Code** | write the permalink, shell out `open <path>` | same file, print the path |
| **Codex** | native Artifact panel when present | write the permalink, print the path |
| **OpenCode / Pi** | write the permalink, print the path | same |

Before `open_canvas`, call the host's canvas-discovery tool (`discover_widgets`, `list_canvas_capabilities`) and use only a type that appears in the returned registry — an invented or borrowed type fails unrecoverably, so treat discovery as the gate and fall through to the file on a miss.

Whichever path wins, keep using it: switch delivery mechanism only when the previous one breaks.

## Read the run state — every number, every refresh

Each figure comes from a command run just now, inside the run directory `<run-state>/` (default `~/.agents/dynamic-implement/runs/<repo>-<issue>/`):

| What | Where |
| --- | --- |
| Units, waves, dependencies, triage sizes | `plan.json` |
| Integration head, merge order, per-merge gate results | `ledger.md`, plus `git log --oneline <base>..HEAD` in the integration worktree |
| Live test counts | run the gate yourself in the integration worktree — a worker's claim is not evidence |
| Per-agent cost, turns, duration | `out/*.json` → `total_cost_usd`, `num_turns`, `duration_ms` |
| Review outcomes per unit | `reports/*.md` — passes taken, findings upheld vs rejected |
| Routing in force | the capability profile's `issueModelLadders[].roleDefaults` |
| Agents in flight | recorded PIDs, plus the last line of each `activity/*/activity.log` |

Where a number is unavailable, leave the cell blank and say why. A visible gap is worth more than an estimate, because the reader can see it.

## Four bands, in this order

1. **Where is the run?** Masthead — repo, root issue, integration branch and head — then a metric strip: units integrated / in flight / queued, live test counts, reviews dispatched, spend.
2. **What is being built?** The unit board, grouped by wave. Each card carries its own history: commit, diffstat, review passes taken, anything notable that happened to it. A unit that needed three passes and one that landed clean must not look alike.
3. **How is work routed and reviewed?** One row per role — route, fixed or escalating, and *why* — plus the per-unit pipeline: who implements, who reviews, what each is allowed to see.
4. **What did the run learn?** Routing changes made mid-run and safeguards written back into the skills, each paired with the failure that produced it. This is the band people reread.

Four bands is the design. The page's value is that it stays scannable.

## Say what the run really did

- **Date the snapshot.** Unless the page has a live data source, the footer says it reflects the last refresh.
- **Show measurable cost and name the rest.** One harness reports per-run cost, another bills against a subscription — say which is which, because an unqualified total reads as complete.
- **Record rejected findings alongside upheld ones.** "Two of three Spec findings rejected as sibling scope" teaches more than a green tick.
- **Keep the run's mistakes on the page.** A wrong diagnosis, a killed agent, an override of the planner that did or did not pay off — highest-signal content there is.

## Design

Load `artifact-design` before writing the page; this section fixes only what is specific to run dashboards.

This is a **UI, not a document** — it gets scanned and operated, so information design beats prose. Summary before detail, and state encoded in form as well as number: a status pill, a coloured left rule on each card, so what needs attention reads at a glance.

Two conventions carry meaning rather than decoration. **Colour the model families** and reuse those chips consistently — implementer side one hue, reviewer side another — so cross-model review reads at a glance and a unit reviewed by the wrong family stands out unread. **Keep semantic state colour on its own axis**: ok / live / waiting / blocked describes something different from who ran the work, and collapsing the two makes both unreadable.

Mono for every SHA, ticket id, model id, effort and count — identifiers align in columns. `font-variant-numeric: tabular-nums` wherever digits stack. Wide tables get their own `overflow-x: auto` container so the page never scrolls sideways. Numbered markers only where content is genuinely ordinal: waves and ladder indices are, and nothing else is.

## Refreshing

Overwrite the permalink, keeping title and favicon identical — the user finds this page by its address and its tab icon.

Re-read the run state, update the metric strip, move units between board groups, extend the lessons band. Leave history that is still true alone: a diff-sized edit keeps the page trustworthy and cheap to produce.
