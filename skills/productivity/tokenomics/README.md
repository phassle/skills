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

## Contents

```
tokenomics/
├── SKILL.md                 # workflow the agent follows
├── DATA-SHAPE.md            # JSON contract for the report template
├── template.html            # Monterro-branded interactive report (self-contained)
├── scripts/collect-usage.sh # deterministic transcript/inventory analysis
├── EVALS.md                 # invariants every run must hold (regression checklist)
└── README.md                # this file
```
