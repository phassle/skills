# Architectural patterns

Recurring structural choices across this repo. Read before adding a new skill.

## 1. Category/skill folder convention

`skills/<category>/<name>/SKILL.md` — one skill per folder, one repo-wide flat category set (`productivity`, `engineering`, ... see skills/engineering/README.md:1). Category is a grouping for the README and installer picker, not a namespace baked into skill names.

## 2. Test-first release gate via plugin.json membership

A skill folder existing under `skills/` does not mean it ships. Membership in the `skills` array in .claude-plugin/plugin.json:18-20 is the only release gate — CONTRIBUTING.md:13. This lets skills be installed and iterated on via skills.sh (which reads the filesystem directly) while staying invisible to plugin users until promoted. Two consumers, one filesystem, different visibility rules.

## 3. Progressive disclosure inside a single skill

SKILL.md itself stays thin and orchestration-only; it links to reference files that are read only when relevant instead of being inlined. Example: skills/productivity/tokenomics/SKILL.md:56 points to DATA-SHAPE.md rather than embedding the JSON contract; template.html is copied and filled, not rewritten. This is the same principle this repo's own AGENTS.md applies to itself (index of docs/, not inlined content).

## 4. Deterministic collection before model reasoning

Where a skill needs facts about the user's environment, a plain script gathers them first (scripts/collect-usage.sh) and the SKILL.md's numbered workflow consumes its output. Keeps the expensive/uncertain part (classification, judgment) separate from the cheap/deterministic part (grep, ls, json parsing).

## 5. Generate, don't mutate

Skills that could change user config (settings.json, installed plugins, MCP servers) never do so directly. They produce a copy-paste "apply-prompt" the user runs themselves in the target harness — skills/productivity/tokenomics/SKILL.md:8. Keeps destructive/irreversible actions under explicit user control even when the skill runs autonomously.

## 6. Cross-harness fallback

A skill detects which agent harness it's running in and swaps its output mechanism accordingly rather than failing — e.g. Artifact tool when available, else write a local HTML file (skills/productivity/tokenomics/SKILL.md:58). Keeps one SKILL.md portable across Claude Code, Codex, and Copilot instead of forking per harness.
