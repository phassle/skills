---
name: dynamic-run-dashboard
description: Build or refresh a published operations dashboard for a Dynamic Implement orchestration run — what is being built, which model builds and reviews each unit, and how setup and calibration decide the routing. Use when a run is long enough that the user wants to watch it, when the user asks for a dashboard, one-pager, or status page for a run, or after each integration milestone to refresh an existing one.
---

# Dynamic run dashboard

A Dynamic Implement run produces more state than a chat transcript can hold: a dependency graph, a
per-unit review history, a routing policy that changes mid-run, and a ledger nobody wants to read. This
skill turns that into one page the user can keep open.

## Output mechanism — detect the host, then choose

The delivery target depends on the active harness. Discover what the host actually supports before
writing anything; never assume an artifact canvas or terminal widget exists.

| Host | Primary | Fallback |
| --- | --- | --- |
| **GitHub Copilot** | `open_canvas` with a registered canvas type (call `discover_widgets` / `list_canvas_capabilities` first to confirm it exists). If no HTML/artifact canvas is registered, write `dashboard.html` to the run-state directory and tell the user to open it with `open /tmp/di-runs/<run>/dashboard.html`. | Plain HTML file at stable path. |
| **Claude Code** | Write `dashboard.html` to the run-state directory; shell out `open <path>` so it opens in the browser. | Same file, tell the user the path. |
| **Codex** | Use the native Artifact panel if available; otherwise write and shell out. | Plain HTML file. |
| **OpenCode / Pi** | Write the HTML file to a stable path in the run-state directory and print the path. | Same. |

**The stable path is the invariant, not the delivery mechanism.** Always write (or overwrite) the
same file at `<run-state>/dashboard.html` regardless of which delivery path succeeds. A refresh means
re-reading run state and overwriting that same file — the URL or `open` command stays identical.

Before attempting `open_canvas`, call the host's canvas-discovery tool and verify the target canvas
type is registered. An unregistered canvas name is not a recoverable error; skip it and fall back.
Do not call `open_canvas` with a type you invented or copied from another run; the type must appear
in the discovered registry.

Redeploy the **same file path** at each milestone so the path is stable — a dashboard whose path
changes is not a dashboard.

## Read the run state first — never write numbers from memory

Every figure on the page must come from a command you just ran. In a run directory
`<run-state>/` (default `~/.agents/dynamic-implement/runs/<repo>-<issue>/`):

| What | Where |
| --- | --- |
| Units, waves, dependencies, triage sizes | `plan.json` |
| Integration head, merge order, per-merge gate results | `ledger.md`, and `git log --oneline <base>..HEAD` in the integration worktree |
| Live test counts | run the gate yourself in the integration worktree — do not copy a worker's claim |
| Per-agent cost, turns, duration | `out/*.json` → `total_cost_usd`, `num_turns`, `duration_ms` |
| Review outcomes per unit | `reports/*.md` — count passes, note which findings were upheld vs rejected |
| Routing in force | the capability profile's `issueModelLadders[].roleDefaults` |
| Agents in flight | the recorded PIDs, plus the last line of each `activity/*/activity.log` |

If a number is not available, leave the cell blank and say why. A dashboard that estimates is worse than
one with a gap, because the gap is visible and the estimate is not.

## What the page is for

It answers four questions, in this order. Resist adding a fifth band; the value is that it stays scannable.

1. **Where is the run?** Masthead with repo, root issue, integration branch and head, plus a metric strip:
   units integrated / in flight / queued, live test counts, reviews dispatched, spend.
2. **What is being built?** The unit board, grouped by wave, each card carrying its own history — commit,
   diffstat, how many review passes it took, and anything notable that happened to it. A unit that needed
   three passes and one that landed clean should not look identical.
3. **How is work routed and reviewed?** One row per role: route, fixed-or-escalating, and *why*. Plus the
   per-unit pipeline: who implements, who reviews, what each is allowed to see.
4. **What did the run learn?** Routing changes made mid-run and safeguards written back into the skills,
   each paired with the failure that produced it. This is the band people actually reread.

## Honesty rules

- **Say it is a snapshot.** Unless the page has a live data source, it reflects the last redeploy. Put
  that in the footer rather than implying live telemetry.
- **Show cost you can measure and name what you cannot.** If one harness reports per-run cost and another
  bills against a subscription, say so — an unqualified total reads as complete when it is not.
- **Record rejected findings, not just upheld ones.** "Two of three Spec findings rejected as sibling
  scope" is more informative than a green tick, and it is the part a reader learns from.
- **Do not smooth over the run's mistakes.** Wrong diagnoses, a killed agent, an override of the planner
  that did or did not pay off — these are the highest-signal content on the page.

## Design

Load `artifact-design` before writing the page; this section only fixes what is specific to run dashboards.

This is a **UI, not a document**: it is scanned and operated, so information design beats prose. Surface
the summary before the detail, and encode state in form as well as number — a status pill, a coloured
left rule on each card — so what needs attention reads at a glance.

Two conventions worth keeping because they carry meaning rather than decoration:

- **Colour the model families differently** and use those chips consistently — implementer side one hue,
  reviewer side another. A reader should see cross-model review at a glance, and spot a unit reviewed by
  the wrong family without reading.
- **Keep semantic state colour separate from the family hues.** ok / live / waiting / blocked is a
  different axis from who ran the work; collapsing them makes both unreadable.

Mono for every SHA, ticket id, model id, effort and count — these are identifiers and they align in
columns. `font-variant-numeric: tabular-nums` wherever digits stack. Wide tables get their own
`overflow-x: auto` container so the page never scrolls sideways.

Numbered markers only where the content is genuinely ordinal — waves and ladder indices are, so number
them; nothing else is, so do not.

## Refreshing

Overwrite the same `dashboard.html` path with the same favicon and title. Keep the path and the tab
icon stable across the whole run — the user finds this page by its path or icon.

On each refresh: re-read the run state, update the metric strip, move units between board groups, and
extend the lessons band. Do not rewrite history that is still true; a diff-sized edit keeps the page
trustworthy and cheap to produce.

Re-deliver via the same mechanism that worked on first publish (open_canvas / shell `open` / print
path). Never switch delivery mechanism mid-run unless the previous one broke.
