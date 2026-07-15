# Monterro skills

Shared agent skills for Monterro engineers. Works with Claude Code and other agents that support the skills format.

## Skills

| Skill | What it does |
|-------|--------------|
| [tokenomics](skills/tokenomics/) | Audits what your AI coding setup loads into context every session vs what you actually use (from your own transcripts), then publishes an interactive report with removal candidates, per-harness config tips (Claude Code, Codex CLI, GitHub Copilot), and ready-to-run apply-prompts. |

## Install

### Option 1 — skills.sh installer (any agent)

```bash
npx skills@latest add phassle/skills
```

Pick the skills and agents you want. Re-run to update.

### Option 2 — Claude Code plugin (managed, auto-updating)

Inside Claude Code:

```
/plugin marketplace add phassle/skills
/plugin install phassle-skills@phassle
```

Or from your shell:

```bash
claude plugin marketplace add phassle/skills
claude plugin install phassle-skills@phassle
```

## Use

Run `/tokenomics` in any project — or just ask "what can I remove from my context?". The analysis reads your own session transcripts under `~/.claude/projects/`, so every engineer gets their own personal report. Nothing changes automatically; the report generates prompts you review and run yourself.

## Repo layout

```
.claude-plugin/
├── marketplace.json   # Claude Code marketplace manifest (marketplace: "monterro")
└── plugin.json        # plugin manifest (plugin: "monterro-skills")
skills/
└── tokenomics/        # one folder per skill, each with SKILL.md
```

Add a new skill by dropping a folder with a `SKILL.md` under `skills/` and listing it in `.claude-plugin/plugin.json`.
