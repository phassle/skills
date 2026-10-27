---
name: dynamic-run-dashboard
description: Publish or refresh the operations dashboard for a Dynamic Implement run — one page carrying what is being built, who builds and reviews each unit, and what the run has learned. Use when the user asks for a dashboard, one-pager, or status page for a run, or to refresh one after an integration milestone.
metadata:
  version: 0.2.1
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
| Context per role, and the coordinator's own | per-agent input tokens in `out/*.json`, plus the ceiling and trend from the repository's `model-calibration.json` → `contextBudget`. Read that group's `basis` first and label the figure by it: `measured` is tokens, `prompt-bytes` is the coordinator's own measurement of the packet where the harness reports no tokens, and `none` means leave the cell blank. Never present bytes as tokens, and never mix the two in one column. A role over its ceiling belongs in the metric strip — a swelling packet is the cheapest failure to catch early |
| Review outcomes per unit | `reports/*.md` — passes taken, findings upheld vs rejected |
| Routing in force | the capability profile's `issueModelLadders[].roleDefaults` |
| Agents in flight | recorded PIDs, plus the last line of each `activity/*/activity.log` |

Where a number is unavailable, leave the cell blank and say why. A visible gap is worth more than an estimate, because the reader can see it.

## Four bands, in this order

1. **Where is the run?** Masthead — repo, root issue, integration branch and head — then a metric strip: units integrated / in flight / queued, live test counts, reviews dispatched, spend.
2. **What is being built?** The unit board, grouped by wave. Each card carries its own history: commit, diffstat, review passes taken, anything notable that happened to it. A unit that needed three passes and one that landed clean must not look alike.
3. **How is work routed and reviewed?** One row per role — route, fixed or escalating, and *why* — plus the per-unit pipeline: who implements, who reviews, what each is allowed to see. Behind that, model usage: one row per model+effort actually dispatched, with agents, turns, duration and measured cost, so the policy above can be read against what the run really spent.
4. **What did the run learn?** Routing changes made mid-run and safeguards the retrospective wrote to the repository's `findings.json`, each paired with the failure that produced it and the route it happened on. This is the band people reread.

Four bands is the design. The page's value is that it stays scannable. `template.html` ships exactly these four, in this order — you fill them, you do not re-order them.

## Build the page from the template

`template.html` (next to this SKILL.md) is the page: **Monterro-branded** — off-white/navy, orange accent rules, Arial, embedded logo, one theme pair for light and dark — and **self-contained**, with every token, style and asset inlined. It resolves nothing at render time and reads no file from another skill, so this skill works when it is the only one installed.

1. Copy `template.html` to the permalink `<run-state>/dashboard.html`.
2. Replace the single placeholder `/*__DATA__*/ null` with the run's JSON — contract in [DATA-SHAPE.md](references/DATA-SHAPE.md). That is the only edit. **Don't restyle**, don't add sections, don't touch the `<title>`.
3. Deliver it by the host path above. Where that host sets a tab icon — an artifact canvas or publishing API — use `📊`; the template sets none, so a plain file gets whatever the browser shows for local HTML and needs no edit.

The template already carries the conventions that make the page readable, so filling it correctly is mostly a matter of using the right keys: state on `state` (`ok` / `live` / `waiting` / `blocked`) drives the coloured left rule and the pill, `side` drives the model-chip hue, and mono plus tabular figures apply to every SHA, model id, effort and count on their own. Two rules the JSON can still break, and they matter more than any styling:

- **Model family is an axis, semantic state is another.** Implementer chips one hue, reviewer chips another, and never a state colour on a model chip — cross-family review must read at a glance, and a unit reviewed by the wrong family must stand out unread.
- **A gap stays a gap.** `null` renders `—`; `{"why": "…"}` renders `—` with the reason on hover. Never fill a cell with an estimate to make the grid look complete.

## Say what the run really did

- **Date the snapshot.** Unless the page has a live data source, the footer says it reflects the last refresh.
- **Show measurable cost and name the rest.** One harness reports per-run cost, another bills against a subscription — say which is which, because an unqualified total reads as complete.
- **Record rejected findings alongside upheld ones.** "Two of three Spec findings rejected as sibling scope" teaches more than a green tick.
- **Keep the run's mistakes on the page.** A wrong diagnosis, a killed agent, an override of the planner that did or did not pay off — highest-signal content there is.

Don't load `artifact-design` for this page and don't hand-write CSS — the template settles both, and a page that drifts from it stops looking like the run's dashboard.

## Refreshing

Overwrite the permalink, keeping the title — and, where the host sets one, the tab icon — identical. The user finds this page by its address and how its tab looks.

Re-read the run state and rebuild the JSON from the fresh copy of `template.html`: update the metric strip, move units between waves and states, extend the lessons band. Leave history that is still true alone — a refresh is a data swap, never a redesign.
