# Tokenomics — Claude Code context audit

Audits what your Claude Code setup loads into context every session (plugins, user skills, agents, MCP servers) against what you have **actually used** across all your session transcripts, then publishes an interactive Monterro-branded report:

- Removal candidates scored by real all-time usage, with live token-savings counter
- "Installed globally" inventory tab (plugins, skills, MCP, hooks, marketplaces)
- Token-saving config tips per harness — Claude Code, Codex CLI, GitHub Copilot
- Scope choice (this project only / global user settings) + one ready-to-run apply-prompt per harness

Nothing is changed automatically — the report generates prompts you paste back yourself.

## Install

1. Unzip into your user skills directory:

   ```bash
   unzip tokenomics-skill.zip -d ~/.claude/skills/
   ```

   You should end up with `~/.claude/skills/tokenomics/SKILL.md`.

2. In Claude Code, run `/reload-skills` (or start a new session).

## Use

Run `/tokenomics` in any project. The skill is user-invoked (slash only) — it doesn't sit in context until invoked, so it won't auto-fire; you invoke it by name. The analysis reads your own transcripts under `~/.claude/projects/` — results are personal per machine.

## What it reads, and what it doesn't

`scripts/collect-usage.sh` is read-only and makes no network calls — read it before you install, it's under 100 lines. It reads transcripts under `~/.claude/projects/` for *counts* of skill, agent, MCP and slash-command use (never message bodies), `~/.claude/settings.json` and `~/.claude/plugins/installed_plugins.json` for your inventory, `~/.claude.json` for each MCP server's `type`/`url`/`command` only (never `env` or headers), directory listings of `~/.claude/{agents,commands,hooks}`, and each `~/.claude/skills/**/SKILL.md` for its path, the *length* of its full description (continuation lines included), and whether it's slash-only — never the text. Everything it prints is a name, a count, or a length.

If your harness delivers plugins and skills per session rather than from `~/.claude` (the desktop app does), the skill also lists what the running session carries, so the audit covers that instead of reporting an empty disk. Those items are turned off in your own settings — the report says where, and never touches them.

The report is local HTML, it stays on your machine unless you publish it, and the skill changes no settings — it hands you a prompt and you decide whether to run it.

## Contents

```
tokenomics/
├── SKILL.md                    # workflow the agent follows
├── references/
│   ├── DATA-SHAPE.md           # JSON contract for the report template
│   └── RATIONALE.md            # verified why + official-doc sources behind every tip
├── template.html               # Monterro-branded interactive report (self-contained)
├── scripts/collect-usage.sh    # deterministic transcript/inventory analysis
├── EVALS.md                    # invariants every run must hold (regression checklist)
└── README.md                   # this file
```
