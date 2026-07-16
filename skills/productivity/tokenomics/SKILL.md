---
name: tokenomics
description: Audit what Claude Code loads into context every session vs what you actually use, then publish an interactive report with copy-paste apply-prompts. User-invoked — run /tokenomics.
disable-model-invocation: true
---

# Tokenomics — context audit

Audits what's loaded into every session (plugins, user skills, custom agents, MCP) against what's *actually been used* across all project transcripts, then publishes an interactive report. The report is the deliverable — **never modify settings yourself**; the page generates an apply-prompt the user pastes back.

> **Why each tip below works — and the source that verifies it — lives in `docs/tokenomics-rationale.md`** (in the phassle/skills repo). It's the living research underlay for this skill: every recommendation maps to a section there with a community claim + an official-doc link. Re-research it periodically and update both files together. Don't claim a saving the rationale can't source.

## Workflow

### 1. Collect usage data (deterministic)

```bash
bash <this skill's directory>/scripts/collect-usage.sh
```

(The skill may be installed at `~/.claude/skills/tokenomics/` or `.agents/skills/tokenomics/` — resolve the path relative to this SKILL.md.)

Outputs: sessions per project, skill invocations, agent invocations, slash commands, MCP calls (all projects, all-time), current `enabledPlugins`, and user skills. Slash-command counts complement Skill-tool counts — sum both when judging usage (e.g. `/graphify` typed 5× + skill called 2× = 7 uses).

### 2. Get token costs per item

- Best source: a `/context` (or `/context all`) output already in the conversation — it lists per-skill/per-agent token estimates. If absent, ask the user to run `/context all` (it's a local command; you can't run it).
- Also ask for `/usage` output (Pro/Max/Team/Enterprise): it already attributes recent spend to each skill, subagent, plugin, and MCP server as a percentage (24h/7d toggle) from local history. Blend those percentages with the transcript invocation counts from step 1 — an item at **0% in `/usage` and 0 invocations is a high-confidence removal**.
- Fallback: estimate ~120 tok/skill description, and use agent-description lengths from the session's agent list.

### 3. Classify every removable item

Rows = each entry in `enabledPlugins` + each dir in `~/.claude/skills/`. For plugins, sum their skills + agents tokens. Verdicts:

- **remove** (pre-checked): 0 uses ever, or duplicate (same plugin from two marketplaces, or a built-in covers it).
- **borderline** (unchecked): 0 uses but plausibly wanted (matches user's domain/company), or overlaps a used alternative.
- **keep** (no checkbox): any real usage, near-zero cost (LSPs), or a dependency of a used skill — check whether used skills reference the plugin (e.g. a TDD flow invoking codex) before marking its plugin removable.

Out of scope: project skills in the repo (`.agents/skills/`, `.claude/skills/` of the project), built-in skills, deferred system tools. Mention them in notes, don't list as rows.

### 4. Config tips (beyond removals)

Fill `tips` with token-saving settings, personalized by reading the user's actual config — only suggest what isn't already set:

- **Default model**: if `model` in `~/.claude/settings.json` is a top-tier model (Opus/Fable), suggest defaulting new sessions to Sonnet and switching up only for planning/review ("plan on the big model, build on Sonnet"), or `opusplan` (Opus in plan mode, auto-switches to Sonnet for execution) — cheaper tiers cost a fraction per token.
- **Subagent model**: subagents inherit the parent model — suggest `env.CLAUDE_CODE_SUBAGENT_MODEL: "haiku"` (or sonnet) so fan-outs don't run on the expensive model.
- **Reviewer agents**: pin `model:` in agent frontmatter; reviews should return findings, not code (output tokens are the expensive ones).
- **CLAUDE.md size**: CLAUDE.md loads every turn; skills load on demand. If project CLAUDE.md > ~200 lines / 2k tokens, suggest trimming to what can't be inferred from code, and migrating workflow-specific rules out into skills (`.claude/skills/<name>/SKILL.md`) that load only when relevant.
- **Junk reads**: enforced `permissions.deny` Read rules in `settings.json` for `node_modules`, `dist`, `build`, lock files, `.env`, `*.pem`. (Do **not** recommend `.claudeignore` — Claude Code does not officially enforce it; there's a documented case of `.env` being read despite an ignore entry.)
- **MCP schemas**: MCP tool definitions are deferred by default now, and tool search auto-activates once schemas pass ~10% of context — so don't tell users to set `ENABLE_TOOL_SEARCH`; instead verify it's on, disconnect unused servers via `/mcp`, and prefer CLI tools.
- **CLI over MCP**: `gh`, `aws`, `gcloud`, `sentry-cli` are more context-efficient than the equivalent MCP server. For each connected server, check whether a CLI exists and suggest the swap.
- **Output-filter hook**: a `PreToolUse` hook that filters verbose test/log output before it hits context (Anthropic ships an official example — 10,000 lines → hundreds of tokens). Suggest it when the user runs noisy test/build commands.
- **Agent Teams**: if `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set (experimental, off by default), warn — each teammate is a full instance with its own context window, so a team uses substantially more tokens than a standard session. Advise Sonnet teammates and small teams. (Exact multiplier lives in rationale §1.9 — don't bake a number into the report.)
- **Auto-memory**: only if the user has their own memory system — suggest toggling `/memory` auto-memory off (background forking costs input tokens).
- **Spend cap**: set the monthly limit in-CLI with `/usage-credits` (Pro/Max), or in admin settings (Team/Enterprise). No config file — tip has no `apply`; present as a manual step in `desc`, set `apply` to a reminder line.
- **Effort**: levels are low / medium / high / xhigh / max — `/effort` low/medium for everyday tasks, high+ only when warranted. `MAX_THINKING_TOKENS` only affects fixed-budget models (e.g. Opus 4.5); adaptive models (Opus 4.8, Sonnet 5, Fable 5) ignore it and use effort.
- **AGENTS.md / CLAUDE.md audit**: report line count ≈ tokens loaded every turn (token framing only — no $/month), then split the file into: rules inferable from code / already linter-enforced (cut), recurring architecture notes (→ `docs/architectural_patterns.md`), procedural workflows (→ a skill). Also flag **cross-harness drift**: a repo with `AGENTS.md` but no `CLAUDE.md`/symlink/`@AGENTS.md` import means Claude Code won't load it (Claude Code reads `CLAUDE.md` only); recommend a symlink or thin importing CLAUDE.md.

Tips may cover other harnesses the user runs (Codex CLI via `~/.codex/config.toml` — model_reasoning_effort, model tiers; GitHub Copilot — usage-based billing since June 1 2026: token-metered GitHub AI Credits with admin budgets and free completions, so premium-request multipliers and "0x models" are legacy — advise model-tier choice and budgets instead). **Always set `harness` on every tip** so the dashboard shows which tool each applies to; only include harnesses the user actually has installed. If asked for broader research, delegate a web-research agent and verify against official docs before adding tips.

### 5. Build and publish the report

**Report content rule — savings in tokens, never dollars.** Everything the report shows (tiles, row costs, the savings counter, tip text, notes) is framed in **tokens removed / standing context saved**, computed from the user's own `/context`. Do **not** put prices, $/month, per-model rates, or hardcoded multipliers (5×, 90%, etc.) in the report — they go stale and become a maintenance burden. State savings qualitatively ("removes standing context loaded every session → lower cost"); the *why* and any live figure belong in `docs/tokenomics-rationale.md`, not on the page.

1. Copy `template.html` (next to this SKILL.md) to a temp/scratch location. The template is **Monterro-branded** (design system baked in: off-white/navy, orange accent lines, Arial, embedded logo) — don't restyle it; only replace the data placeholder. Brand tone in all copy: sentence case, no emoji, no hype words.
2. Replace the single placeholder `/*__DATA__*/ null` with a JSON object (see [DATA-SHAPE.md](DATA-SHAPE.md)) — including `purpose` (the skill's point: save tokens), `global` (the "Installed globally" tab: plugins w/ version+scope, user skills, MCP servers, hooks, marketplaces from the collect script), and `tips` (each with `harness`).
3. Publish via the Artifact tool — favicon `🧹`, keep title "Tokenomics — Claude Code context audit".
4. If no Artifact tool exists (running in Codex, Copilot, or another harness), write the finished HTML to `tokenomics-report.html` in the working directory instead and tell the user to open it in a browser.

### 6. Summarize

Report top removals + total token savings in chat. Tell the user how the Apply section works:

- **Scope choice comes first** (radio on the page): *this project only* (default — changes land in project config like `.claude/settings.local.json`; global-only actions are skipped and listed) or *also global user settings* (`~/.claude`, `~/.codex`, account settings).
- **One prompt per harness** is generated (Claude Code / Codex CLI / GitHub Copilot — only harnesses with selected tips appear). The user runs each prompt **inside that harness**; the prompt itself carries the scope instructions.

When the user pastes the Claude Code prompt back here, follow it exactly: honor the stated scope; plugins → `enabledPlugins: false` (never delete keys/hooks/marketplaces); user skills → move to `~/.claude/skills-disabled/` (never `rm`); MCP removals → back up to `~/.claude/mcp-disabled.json` first; tips verbatim; end with a diff summary + skipped-at-this-scope list + restart reminder.

## Pitfalls

- Plugins are usually **global** (`~/.claude/settings.json`) — savings apply to every project; say so.
- Zero MCP rows ≠ error: many setups have no MCP servers connected. Still report the finding.
- Transcript greps cover invocations, not passive value (LSPs, hooks) — never mark those "remove" on count alone.
- **Be honest about "savings".** Fewer context tokens ≠ automatically lower dollar cost — heavily-discounted cache reads dominate a session's bill, so mid-session compression that breaks the cache can even *raise* cost (rationale §0.2–0.3). The clean, defensible win this skill sells is removing **always-loaded** surfaces (unused plugins/skills/agents/MCP schemas that load every session) — that permanently shrinks the cached prefix without thrashing it. Frame the token counter as "standing context removed per session", not a guaranteed invoice reduction.
