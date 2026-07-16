# AGENTS.md

Be extremely concise. Sacrifice grammar for concision.
At the end of each plan, list unresolved questions.

## WHAT

Repo of Agent Skills for AI coding agents. Maintained by Per Hassle (Monterro). No app code, no build, no test suite — content is Markdown (SKILL.md files), one Bash script, one self-contained HTML report template. Distributed two ways:

- **skills.sh** (`npx skills@latest add phassle/skills`) — copies skill folders into the user's own repo, editable.
- **Claude Code plugin** (`.claude-plugin/`) — read-only managed bundle, updates on version bump.

Also installable into Codex, GitHub Copilot, and other harnesses following the Agent-Skills standard; skills detect their harness and adapt (README.md:44).

## WHY

Every agent session loads plugins, model-invoked skills, agents, and MCP schemas into context before the user types anything — most of that is never invoked, and nothing surfaces the waste. This repo's skills exist to find and cut that waste. Flagship: `tokenomics` (README.md:46-63).

## HOW — commands

```bash
npx skills@latest add phassle/skills           # install skills for local testing
npx skills@latest add phassle/skills --list    # list installable skills (release check)
claude plugin validate .                        # validate plugin manifest (release check)
claude plugin marketplace add phassle/skills    # add marketplace (one-time, for plugin path)
claude plugin install phassle-skills@phassle    # install the plugin bundle
```

## Index — read only what's relevant

- `README.md` — user-facing quickstart + skill reference by category.
- `.claude-plugin/marketplace.json` — marketplace manifest, `marketplace: "phassle"`.
- `.claude-plugin/plugin.json` — released skill set (`skills` array) + `version`.
- `skills/<category>/<name>/SKILL.md` — one skill folder per skill; frontmatter = `name` + `description` (+ `disable-model-invocation: true` for slash-only skills). Categories: `productivity`, `engineering` (released), `other` (not ready yet — see skills/other/README.md).
- `docs/architectural_patterns.md` — recurring structural patterns across skills (read before adding a new skill).
- `docs/tokenomics-rationale.md` — living research underlay: the verified why + official-doc sources behind every tokenomics config tip (read/update when editing tokenomics tips, stats, or pricing).

## Critical workflow 1: add and test a new skill (unreleased)

1. Create `skills/other/<name>/SKILL.md` — unready skills live in `other/`. YAML frontmatter (`name`, `description`; add `disable-model-invocation: true` for slash-only skills that shouldn't sit in context) — see skills/productivity/tokenomics/SKILL.md:1-5 for the shape.
2. Drop supporting files (scripts, templates, reference docs) next to it — keep SKILL.md thin, link out (docs/architectural_patterns.md pattern 3).
3. Install locally: `npx skills@latest add phassle/skills`, pick the new skill — it shows under the **Other** group (not yet in plugin.json).
4. Invoke it in a real agent session and iterate. Not in `plugin.json` = not shipped to plugin users.

## Critical workflow 2: release a skill (promote to plugin)

1. Move the folder from `skills/other/` to its category — `skills/productivity/<name>/` or `skills/engineering/<name>/`.
2. Add `"./skills/<category>/<name>"` to the `skills` array (.claude-plugin/plugin.json:18-20) and bump `version` (plugin.json:3).
3. Add a one-line entry to README.md's Reference section under its category (README.md:69-76); create the category heading only if this is its first released skill.
4. Validate: `claude plugin validate .` then `npx skills@latest add phassle/skills --list`.
5. Commit + push. Plugin users get it on next update; skills.sh users see it as newly "released" vs "Other".

## Critical workflow 3: ship a report-generating skill (tokenomics pattern)

1. Deterministic collection first, no model calls — e.g. scripts/collect-usage.sh.
2. SKILL.md orchestrates in numbered steps: run script → classify results → fill a documented data contract (e.g. DATA-SHAPE.md) → publish via the Artifact tool.
3. Never let the skill mutate user config directly — it generates a copy-paste apply-prompt the user runs themselves (skills/productivity/tokenomics/SKILL.md:9, :77).

## Unresolved questions

- No CI/lint config exists (no `.github/`) — is `claude plugin validate .` the only pre-push gate, or is one expected to be added?
- `skills/engineering/` and `skills/other/` have no skills yet — confirm when the first lands, since it triggers the "create the category heading" step.
