# Architectural patterns

Recurring structural choices across this repo. Read before adding a new skill. Refer to code by symbol name; no line numbers.

## 1. Category/skill folder convention

`skills/<category>/<name>/SKILL.md` — one skill per folder, flat repo-wide category set. `productivity` and `engineering` hold released skills; `other` is the single staging category for unready ones. One staging dir, not several — a second one splits the same meaning across two places and neither stays authoritative. Category groups the README; it is not a namespace baked into the skill's `name`, and skills.sh ignores it entirely (pattern 2).

## 2. Test-first release gate via plugin.json membership

A folder existing under `skills/` does not mean it ships. Membership in the `skills` array of `plugin.json` is the only release gate. skills.sh reads the filesystem and offers everything; plugin users see only the array. Two consumers, one filesystem, different visibility rules.

## 3. Progressive disclosure inside a skill

`SKILL.md` stays thin and orchestration-only, linking files read only when relevant. `tokenomics` points at `references/DATA-SHAPE.md` instead of inlining the JSON contract; `template.html` is copied and filled, never rewritten. `dynamic-implement` takes this furthest: its `SKILL.md` names ten `references/*-contract.md` files and states which phase must read each one before starting. Layout: `references/` on-demand docs, `scripts/` deterministic collectors, `agents/` harness agent definitions, templates at skill root. This repo's own AGENTS.md applies the same principle to itself.

## 4. Deterministic collection before model reasoning

Facts about the user's environment come from a plain script first — `collect-usage.sh` — and the numbered workflow consumes its output. Separates the cheap/deterministic part (grep, ls, JSON parsing) from the expensive/uncertain part (classification, judgment).

## 5. Generate, don't mutate

A skill that could change user config (settings.json, installed plugins, MCP servers) never does. It emits a copy-paste apply-prompt the user runs themselves — `buildPrompt` plus one function per harness (`claudePrompt`, `codexPrompt`, `copilotPrompt`). Keeps irreversible actions under explicit user control even when the skill runs autonomously.

## 6. Cross-harness fallback

Detect the harness, swap the output mechanism, never fail. `tokenomics`: Artifact tool when present, else write `tokenomics-report.html` locally. `dynamic-run-dashboard` generalizes it into a primary/fallback table per host, with one invariant — the file path stays stable regardless of which delivery path wins. One `SKILL.md` stays portable instead of forking per harness.

## 7. Explicit-invocation gate

A skill whose run costs real money or mutates a repo refuses to start on intent matching. `dynamic-implement` admits a run only on retained native slash/skill selection or the exact marker `DYNAMIC_IMPLEMENT_SLASH_ENTRY=1`; `dynamic-skills-setup` and `tokenomics` set `disable-model-invocation: true` so they never load into context unasked. The gate guards the root run only — downstream skills are invoked normally once admitted.

## 8. Verified capability over declared capability

Never equate an installed binary with a callable model. `dynamic-skills-setup` live-probes each harness/model/effort combination, writes only verified steps to `escalationLadder`, parks advertised-but-unproven ones in `candidateEscalationSteps`, and leases the catalog for 14 days with a per-harness fingerprint. Merge, never overwrite: one harness refreshing must not invalidate another's saved indices.

## 9. Three knowledge stores, split by portability

Machine-local facts (executable paths, auth state, live route availability) live in `~/.agents/dynamic-skills/capabilities.json`, written by `dynamic-skills-setup`. Team-portable learned outcomes live in the tracked `.agents/dynamic-implement/model-calibration.json`, written by `dynamic-skills-calibrate`. Safeguards a run learned about a repository live beside it in the tracked `.agents/dynamic-implement/findings.json`, written by `dynamic-implement`'s retrospective and re-stated — never authored — by calibration.

No skill writes findings into its own installed directory: a skill is an engine, not a store, and an installed directory is discarded by the next reinstall. That splits a retrospective by scope rather than by convenience — what is true of this repository goes to the repository, what is true of the orchestration everywhere becomes a proposal against the skill's source repo. Each finding carries the route that produced it, which is what later lets calibration tell a safeguard that still earns its place from one a newer model made obsolete.

## 10. Hard human gate on the irreversible step

Autonomy runs to the last reversible action, then stops with evidence. `dynamic-implement` recovers from failed reviews, red checks, and dead agents without asking, but any merge into `develop`/`main` requires a fresh human instruction delivered *after* the evidence is presented. No initial instruction pre-authorizes it. A machine review is advisory evidence, never approval.

## 11. Clean-context independent review

Acceptance review runs in a standalone zero-conversation-context session, preferring a different verified model family, never a fork or resume of the implementation session. Every re-review gets a fresh session. Prevents an implementer from reviewing its own reasoning.

## 12. Concurrency isolation by minted token

Before the first ref exists, mint five base-36 chars from real system entropy (`/dev/urandom`, never model-invented) and embed it in every branch name, worktree path, and ledger entry. A ref whose token differs belongs to another run: never write to it, merge it, or count it as evidence. `dynamic-implement` layers three mechanisms because they answer different questions — the token separates *evidence*, a claim comment on the tracker announces *who holds the work* (a bare assignee cannot, when both runs authenticate as one account), and a same-host lock file catches a local collision in milliseconds.

## 13. Auditable-by-default logging

Each dispatched agent gets its own activity directory and log destination, and must emit a terminal event (`completed` or `blocked`); a handoff without one is rejected. `agent_log.py` is the deterministic writer. Live status is inspected before an agent is described as active, waiting, failed, or complete — remembered state is untrustworthy under concurrency.

## 14. One design system, one filled template per report skill

Every skill that publishes a page ships its own `template.html` carrying the same Monterro token block — colours, Arial, orange accent rules, light/dark pair, embedded logo — and its own `references/DATA-SHAPE.md`. The skill copies the file and replaces the single `/*__DATA__*/` placeholder; styling is never authored per run. `tokenomics` and `dynamic-run-dashboard` differ only in components (audit table and apply-prompts vs unit board and routing table), so two reports from two skills read as one product. The cost is a duplicated token block per template — deliberate: each template stays a single self-contained file that publishes anywhere, with no shared asset to resolve at render time.
