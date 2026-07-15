# Monterro skills

[![skills.sh](https://skills.sh/b/phassle/skills)](https://skills.sh/phassle/skills)

Shared agent skills for Monterro engineers. Works with Claude Code and other agents that support the skills format.

## Skills

| Skill | Category | What it does |
|-------|----------|--------------|
| [tokenomics](skills/productivity/tokenomics/) | productivity | Audits what your AI coding setup loads into context every session vs what you actually use (from your own transcripts), then publishes an interactive report with removal candidates, per-harness config tips (Claude Code, Codex CLI, GitHub Copilot), and ready-to-run apply-prompts. |

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
├── engineering/       # category folders, one skill folder per skill
└── productivity/
    └── tokenomics/    # each skill folder has a SKILL.md
```

## Adding skills

The repo is built to hold many skills, with a test-first flow:

1. **Drop a folder** with a `SKILL.md` under `skills/<name>/` (subfolders like `skills/engineering/<name>/` work too). It is immediately installable via `npx skills add phassle/skills` — unreleased skills show under the **Other** group in the picker.
2. **Promote it** when it's ready: add `"./skills/<name>"` to the `skills` array in `.claude-plugin/plugin.json` and bump `version`. It moves to the **Phassle Skills** group, and everyone on the Claude Code plugin gets it on their next update.
3. Add a row to the table at the top of this README.

Skills in the repo but not in `plugin.json` never ship to plugin users — that's the curation line between "testing" and "released".
