---
name: tokenomics
description: Audit Claude Code context spend vs actual usage — analyze all session transcripts to find never-used plugins, skills, agents, and MCP servers, then publish an interactive HTML report (checkboxes → live token savings → copy-paste apply-prompt). Use when the user runs /tokenomics, asks "what can I remove", "trim my context", "which skills/plugins do I never use", mentions context bloat, or wants to reduce per-session token overhead.
---

# Tokenomics — context audit

Audits what's loaded into every session (plugins, user skills, custom agents, MCP) against what's *actually been used* across all project transcripts, then publishes an interactive report. The report is the deliverable — **never modify settings yourself**; the page generates an apply-prompt the user pastes back.

## Workflow

### 1. Collect usage data (deterministic)

```bash
bash ~/.claude/skills/tokenomics/scripts/collect-usage.sh
```

Outputs: sessions per project, skill invocations, agent invocations, slash commands, MCP calls (all projects, all-time), current `enabledPlugins`, and user skills. Slash-command counts complement Skill-tool counts — sum both when judging usage (e.g. `/graphify` typed 5× + skill called 2× = 7 uses).

### 2. Get token costs per item

- Best source: a `/context` (or `/context all`) output already in the conversation — it lists per-skill/per-agent token estimates. If absent, ask the user to run `/context all` (it's a local command; you can't run it).
- Fallback: estimate ~120 tok/skill description, and use agent-description lengths from the session's agent list.

### 3. Classify every removable item

Rows = each entry in `enabledPlugins` + each dir in `~/.claude/skills/`. For plugins, sum their skills + agents tokens. Verdicts:

- **remove** (pre-checked): 0 uses ever, or duplicate (same plugin from two marketplaces, or a built-in covers it).
- **borderline** (unchecked): 0 uses but plausibly wanted (matches user's domain/company), or overlaps a used alternative.
- **keep** (no checkbox): any real usage, near-zero cost (LSPs), or a dependency of a used skill — check whether used skills reference the plugin (e.g. a TDD flow invoking codex) before marking its plugin removable.

Out of scope: project skills in the repo (`.agents/skills/`, `.claude/skills/` of the project), built-in skills, deferred system tools. Mention them in notes, don't list as rows.

### 4. Config tips (beyond removals)

Fill `tips` with token-saving settings, personalized by reading the user's actual config — only suggest what isn't already set:

- **Default model**: if `model` in `~/.claude/settings.json` is a top-tier model (Opus/Fable), suggest defaulting new sessions to Sonnet and switching up only for planning/review ("plan on the big model, build on Sonnet").
- **Subagent model**: subagents inherit the parent model — suggest `env.CLAUDE_CODE_SUBAGENT_MODEL: "haiku"` (or sonnet) so fan-outs don't run on the expensive model.
- **Reviewer agents**: pin `model:` in agent frontmatter; reviews should return findings, not code (output tokens are the expensive ones).
- **CLAUDE.md size**: if project CLAUDE.md > ~200 lines / 2k tokens, suggest trimming to what can't be inferred from code.
- **Junk reads**: `.claudeignore` + `permissions.deny` Read rules for `node_modules`, `dist`, lock files.
- **MCP schemas**: each connected server loads its full schema every session — disconnect unused; suggest `env.ENABLE_TOOL_SEARCH: "true"` for on-demand tool loading.
- **Auto-memory**: only if the user has their own memory system — suggest toggling `/memory` auto-memory off (background forking costs input tokens).
- **Spend cap**: monthly usage limit at claude.ai → Settings → Usage (no config file; tip has no `apply`, present as manual step in `desc`, set `apply` to a reminder line).
- **Effort**: `/effort` low/medium for everyday tasks; high+ only when warranted.

Tips may cover other harnesses the user runs (Codex CLI via `~/.codex/config.toml` — model_reasoning_effort, model tiers; GitHub Copilot — premium-request multipliers, 0x included models). **Always set `harness` on every tip** so the dashboard shows which tool each applies to; only include harnesses the user actually has installed. If asked for broader research, delegate a web-research agent and verify against official docs before adding tips.

### 5. Build and publish the report

1. Copy `~/.claude/skills/tokenomics/template.html` to the scratchpad. The template is **Monterro-branded** (design system baked in: off-white/navy, orange accent lines, Arial, embedded logo) — don't restyle it; only replace the data placeholder. Brand tone in all copy: sentence case, no emoji, no hype words.
2. Replace the single placeholder `/*__DATA__*/ null` with a JSON object (see [DATA-SHAPE.md](DATA-SHAPE.md)) — including `purpose` (the skill's point: save tokens), `global` (the "Installed globally" tab: plugins w/ version+scope, user skills, MCP servers, hooks, marketplaces from the collect script), and `tips` (each with `harness`).
3. Publish via the Artifact tool — favicon `🧹`, keep title "Tokenomics — Claude Code context audit".

### 6. Summarize

Report top removals + total token savings in chat. Tell the user how the Apply section works:

- **Scope choice comes first** (radio on the page): *this project only* (default — changes land in project config like `.claude/settings.local.json`; global-only actions are skipped and listed) or *also global user settings* (`~/.claude`, `~/.codex`, account settings).
- **One prompt per harness** is generated (Claude Code / Codex CLI / GitHub Copilot — only harnesses with selected tips appear). The user runs each prompt **inside that harness**; the prompt itself carries the scope instructions.

When the user pastes the Claude Code prompt back here, follow it exactly: honor the stated scope; plugins → `enabledPlugins: false` (never delete keys/hooks/marketplaces); user skills → move to `~/.claude/skills-disabled/` (never `rm`); MCP removals → back up to `~/.claude/mcp-disabled.json` first; tips verbatim; end with a diff summary + skipped-at-this-scope list + restart reminder.

## Pitfalls

- Plugins are usually **global** (`~/.claude/settings.json`) — savings apply to every project; say so.
- Zero MCP rows ≠ error: many setups have no MCP servers connected. Still report the finding.
- Transcript greps cover invocations, not passive value (LSPs, hooks) — never mark those "remove" on count alone.
