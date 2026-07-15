# Phassle skills

[![skills.sh](https://skills.sh/b/phassle/skills)](https://skills.sh/phassle/skills)

Agent skills I use to run AI coding agents efficiently — starting with what they silently cost. Built at [Monterro](https://www.monterro.com), shared so my colleagues (and you) can use them too.

Skills in this repo are small, auditable, and work across harnesses: Claude Code first, with fallbacks for Codex, GitHub Copilot, and other Agent-Skills-standard agents.

## Quickstart (30-second setup)

1. Run the skills.sh installer:

```bash
npx skills@latest add phassle/skills
```

2. Pick the skills you want and which agents to install them to.

3. Run `/tokenomics` in your agent. Done.

## Install as a Claude Code plugin

Prefer a managed install you don't maintain by hand? These skills also ship as a native [Claude Code plugin](https://code.claude.com/docs/en/plugins) — a read-only bundle that updates when a new version ships.

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

Two ways to install, two philosophies:

- **[skills.sh](https://skills.sh/phassle/skills)** copies the skills into your project so you can hack on them and make them your own.
- **The plugin** keeps them as an always-current bundle you don't edit — best when you just want the set to work and follow along as it evolves.

> Using Codex or another agent? The skills.sh installer puts these skills into Codex, Copilot, and other Agent-Skills-standard harnesses today. The skills detect which harness they run in and adapt (for example, tokenomics writes its report to a local HTML file where Claude's Artifact hosting isn't available).

## Why these skills exist

### #1: You pay for context you never use

**The problem.** Every session of Claude Code (or Codex, or Copilot) starts by loading plugins, skills, agent definitions, MCP schemas, and memory files into context — before you type a single character. That overhead rides along with *every message*, at real token prices. Most setups accumulate tools that are never invoked: a plugin installed for one demo, an MCP server from a POC, a skill pack that seemed useful. Nothing tells you they're still costing you.

**The fix** is **[/tokenomics](./skills/productivity/tokenomics/SKILL.md)**. It reads your actual session transcripts — every skill invocation, agent call, slash command, and MCP call you have ever made — and scores everything installed against real usage. The result is an interactive report:

- Removal candidates ranked by cost, with a live token-savings counter
- An "installed globally" inventory of everything your account loads
- Config tips per harness — model defaults, subagent models, thinking budgets, compaction, junk-read blocking — each verified against official docs
- A scope choice (this project only, or global user settings), then one ready-to-run apply-prompt per harness

Nothing changes automatically. The report generates prompts; you read them, then run them in the harness they belong to.

Run it once, clean up, then re-run monthly — `/usage` in Claude Code shows spend per skill and plugin, and tokenomics turns that into decisions.

## Reference

Skills split on one axis — who can invoke them. **User-invoked** skills are reachable when you type them (e.g. `/tokenomics`); **model-invoked** skills can also be reached automatically by the agent when a task fits.

### Productivity

General workflow tools, not tied to one codebase.

**User-invoked**

- **[tokenomics](./skills/productivity/tokenomics/SKILL.md)** — Audit what your AI coding setup loads into context vs what you actually use, from your own transcripts. Publishes an interactive report with removal candidates, per-harness config tips (Claude Code, Codex CLI, GitHub Copilot), and one apply-prompt per harness.

### Engineering

Code-focused skills. Nothing released here yet — this is where they will land.

## Adding skills

The repo is built to hold many skills, with a test-first flow:

1. **Drop a folder** with a `SKILL.md` under `skills/<category>/<name>/`. It is immediately installable via `npx skills add phassle/skills` — unreleased skills show under the **Other** group in the picker.
2. **Promote it** when it's ready: add `"./skills/<category>/<name>"` to the `skills` array in `.claude-plugin/plugin.json` and bump `version`. It moves to the **Phassle Skills** group, and everyone on the Claude Code plugin gets it on their next update.
3. Add it to the Reference section above, under its category, with a one-line description of what it does and when to reach for it.

Skills in the repo but not in `plugin.json` never ship to plugin users — that's the curation line between "testing" and "released".

## Repo layout

```
.claude-plugin/
├── marketplace.json   # Claude Code marketplace manifest (marketplace: "phassle")
└── plugin.json        # plugin manifest (plugin: "phassle-skills") — the released set
skills/
├── engineering/       # category folders, one skill folder per skill
└── productivity/
    └── tokenomics/    # each skill folder has a SKILL.md
```
