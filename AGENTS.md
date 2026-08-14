# AGENTS.md

Be extremely concise. Sacrifice grammar for concision.
Always write in English — chat replies, code, comments, commits, docs, skill content — regardless of the language the user writes in.
At the end of each plan, list unresolved questions.

## WHAT

Repo of Agent Skills for AI coding agents. Maintained by Per Hassle (Monterro). No app code, no build, no test suite. Content:

- Markdown skill bundles — `SKILL.md` + optional `references/`, `scripts/`, `agents/`.
- Bash — `collect-usage.sh` (tokenomics collector).
- Python — `agent_log.py` (dynamic-implement activity logger).
- Self-contained HTML+JS — `template.html`, one per report skill, same Monterro design system: tokenomics (functions `render`, `buildPrompt`, `claudePrompt`, `codexPrompt`, `copilotPrompt`, `getScope`, `mdToHtml`) and dynamic-run-dashboard (`renderBoard`, `mchips`, `cell`).
- JSON manifests — `plugin.json`, `marketplace.json`.

Two distribution paths:

- **skills.sh** (`npx skills@latest add phassle/skills`) — copies skill folders into the user's repo, editable. Reads the filesystem; sees every skill folder.
- **Claude Code plugin** (`.claude-plugin/`) — read-only managed bundle. Ships only what the `skills` array in `plugin.json` lists.

Also installs into Codex, GitHub Copilot, other Agent-Skills-standard harnesses. Skills detect their harness and swap output mechanism (pattern 6).

## WHY

Every agent session loads plugins, model-invoked skills, agent definitions, and MCP schemas into context before the user types anything. Most is never invoked; nothing surfaces the waste. Skills here find and cut it. Flagship: `tokenomics`.

Second theme (staged): `dynamic-*` — multi-agent orchestration of one spec end to end without one context window holding the whole build. Same thesis as `tokenomics`, applied to output instead of standing context: a ticket starts at the **cheapest verified model step** and escalates one rung only when an attempt fails, so the expensive model is paid for on the tickets that need it and otherwise reserved for planning and review, where an error costs a whole wave. Calibration then moves that floor by measured **cost to acceptance** — retries and forced re-reviews included, because a step cheap per token that needs three passes is dearer than the strong step that lands it once. Whenever editing these bundles, keep that framing: the ladder is the product, not an implementation detail.

## Matt Pocock workflow

Dynamic Implement must always use the installed, current Matt Pocock skills and preserve their flow: `to-tickets` produces approved `ready-for-agent` vertical-slice children; one fresh agent invokes `implement` per child; `implement` owns its required `tdd`, checks, `code-review`, fixes, and commit. Orchestration may add isolation, scheduling, independent acceptance review, integration, and PR gates. Never imitate, inline, reorder, split, or replace Matt's flow. Treat each ticket contract as immutable; if it or Matt's flow cannot be followed exactly, stop that slice for HITL. Telemetry may appear only in tracker comments after explicit setup consent, never in ticket contract fields.

## HOW — commands

```bash
npx skills@latest add phassle/skills           # install skills locally for testing
npx skills@latest add phassle/skills --list    # list installable skills (release check)
claude plugin validate .                        # validate plugin manifest (release check)
claude plugin marketplace add phassle/skills    # add marketplace (one-time)
claude plugin install phassle-skills@phassle    # install the plugin bundle
```

No CI, no linters configured. `claude plugin validate .` is the only automated gate.

## skills.sh format — the published contract

This repo is published to [skills.sh](https://skills.sh/phassle/skills) as `phassle/skills`. Its discovery rules, not `plugin.json`, decide what a skills.sh user sees.

- **Discovery walks every subdirectory** for `SKILL.md`. No allowlist, no manifest, no per-directory opt-out. Category dirs, staging dirs, dot-dirs — all scanned.
- Exception: a `SKILL.md` at repo root makes that the *only* skill unless `--full-depth`. This repo has none, so the full scan applies.
- Consequence: **anything committed containing a `SKILL.md` is an installable skill.** That is why this repo holds no upkeep skills of its own: a skill that only maintains this repo would be offered to every user who installs from it.
- Grouping in the picker: skills listed in `plugin.json`'s `skills` array show under **Phassle Skills**; every other discovered skill falls under **General**. There is no "Other" group — a staged skill is publicly visible and installable, just ungrouped.
- Frontmatter `description` is the entire shop window. It is what the picker prints and what a model matches on. Write it as *what it does + when to trigger*.
- Verify discovery locally before pushing, against the working tree:

```bash
npx skills@latest add . --list       # what a skills.sh user would be offered
```

Committing a staged skill is therefore a soft release. Gate real WIP by keeping it uncommitted or out of the repo.

## Versioning

Three things carry a version, and only one of them is authoritative.

- **`plugin.json` `version`** — the release version, semver, checked by `claude plugin validate`. This is what plugin users update against. Bump it on every release (workflow 2).
- **skills.sh** — no version at all. `skills-lock.json` records the source repo, the skill path, and a SHA-256 `computedHash` of the content; `skills update` compares that hash against the repo's **default branch**. The commit is the version. This is why `main` is the default branch and feature work merges into `develop`.
- **`metadata.version` in `SKILL.md`** — a per-skill marker for humans, so a contract change is legible without reading the diff. `metadata` is the Agent Skills spec's free-form map: legal everywhere, and Claude Code explicitly does not act on its contents.

There is no top-level `version` frontmatter field. Some published skills (including Anthropic's own `plugin-dev` bundle) set one anyway; every loader ignores it. Don't copy that — it reads as official and isn't.

Staged skills start at `0.1.0`. A released skill's `metadata.version` and `plugin.json`'s `version` move together.

## Tooling — LSP

Install a language server per language so agents resolve symbols directly (go-to-definition, find-references) instead of grepping:

- Bash → `bash-language-server` (`npm i -g bash-language-server`)
- Python → `basedpyright` or `pyright`
- HTML/CSS/JSON → `vscode-langservers-extracted`
- Markdown → `marksman`

Reference code by symbol name (`collect-usage.sh`, `buildPrompt`, `agent_log.py`), never by `file:line` — line numbers rot on the next edit.

## Index — read only what's relevant

- `README.md` — user-facing quickstart + skill reference, grouped by category and by who can invoke.
- `docs/architectural_patterns.md` — recurring structural patterns across skills, including the cheapest-verified-step ladder (pattern 15) and the three knowledge stores (pattern 9). Read before adding a skill.
- `docs/tokenomics-report.png` — screenshot used in README.
- `CLAUDE.md` → symlink to this file; `docs/tokenomics-rationale.md` → symlink to the skill's `RATIONALE.md`. Claude Code reads only `CLAUDE.md`, so the symlink is what makes this file load — never replace either with a copy.
- `.claude-plugin/plugin.json` — released skill set (`skills`) + `version`. Release gate.
- `.claude-plugin/marketplace.json` — marketplace manifest, `name: "phassle"`.
- `skills/<category>/<name>/SKILL.md` — one folder per skill. Frontmatter: `name`, `description`, plus `disable-model-invocation: true` for slash-only skills.
- `skills/productivity/tokenomics/references/DATA-SHAPE.md` — JSON contract the report template consumes.
- `skills/productivity/tokenomics/references/RATIONALE.md` — sourced why behind every config tip; embedded verbatim in the report. Update when tips, stats, or pricing change.
- `skills/productivity/tokenomics/EVALS.md` — eval cases for the tokenomics workflow.
- `skills/other/dynamic-run-dashboard/references/DATA-SHAPE.md` — JSON contract the run-dashboard template consumes.
- `skills/other/README.md` — what the staging category means and how a skill leaves it.
- `skills/other/dynamic-qa/SPEC.md` — buildable spec for an unbuilt two-skill QA bundle.

### Categories

`productivity`, `engineering` — released, listed in `plugin.json`. `other` — the single staging category; everything unready lives here, currently the five `dynamic-*` bundles. No other staging dir; do not reintroduce one.

### Installed-copy drift

There are no maintenance skills. This repo publishes skills for other people to use, so anything that only serves its own upkeep does not live here — the workflows below are the procedure, in prose, and that is deliberate.

One thing still needs a habit rather than a skill. The `dynamic-*` bundles get edited **where they run**: a run that hits a gap writes the safeguard into the installed copy under `~/.claude/skills/`, so the installed copy is normally ahead of this repo. Before editing a `dynamic-*` file here, and before releasing one, compare:

```bash
diff -rq skills/other/dynamic-<name> ~/.claude/skills/dynamic-<name>
```

A difference means the installed copy probably won — it usually carries a safeguard a real run paid for. Bring it across before editing, or the edit lands on a stale base and overwrites it.

## Workflow 1: add + test a skill (unreleased)

1. Create `skills/other/<name>/SKILL.md`. Frontmatter `name` + `description` + `metadata.version: 0.1.0`; add `disable-model-invocation: true` when the skill must not sit in context. Copy the shape from `tokenomics`.
2. Keep `SKILL.md` thin — orchestration in numbered steps. Push detail into `references/`, deterministic collection into `scripts/` (patterns 3, 4).
3. `npx skills@latest add . --list` — confirm it is discovered, under **General**. Then `npx skills@latest add .` and pick it.
4. Invoke in a real agent session, iterate. Absent from `skills` in `plugin.json` = not shipped to *plugin* users — but committing it does expose it to skills.sh users. Keep genuine WIP uncommitted.

## Workflow 2: release a skill

1. Move folder to its category: `skills/productivity/<name>/` or `skills/engineering/<name>/`.
2. Append `"./skills/<category>/<name>"` to `skills` in `plugin.json`; bump its `version` and the skill's own `metadata.version` together (see Versioning).
3. Add a one-line entry under the matching heading in README.md's **Reference** section. Create the category heading only if this is its first released skill.
4. `claude plugin validate .`, then `npx skills@latest add phassle/skills --list` — confirm the skill lists as released, not Other.
5. Commit + push. Plugin users get it on next update.

## Workflow 3: ship a report-generating skill

1. Deterministic collection first, zero model calls — `collect-usage.sh` shape.
2. `SKILL.md` numbered steps: run collector → classify results → fill the documented JSON contract (`DATA-SHAPE.md`) → publish.
3. Publish by copying `template.html` and replacing only the `/*__DATA__*/` placeholder. Don't restyle — branding is baked in.
4. Fall back when the Artifact tool is absent: write `tokenomics-report.html` locally, tell the user to open it (pattern 6).
5. Never mutate user config. Emit a copy-paste apply-prompt the user runs themselves (pattern 5) — see `buildPrompt` and the per-harness prompt functions.

## Unresolved questions

- All five `skills/other/` bundles are on `main`, so skills.sh users are already offered them under **General** — the "hold them back" question is closed by fact. Open instead: they ship at 0.1.x/0.2.x with contracts that still move, and nothing marks them as unstable in the picker, where `description` is the entire shop window. Say "staged, contracts may change" in each `description`, or accept that committing is release and stop treating `other/` as staging?
- Installed copies of the `dynamic-*` bundles drift from this repo by design (see Installed-copy drift). The `diff -rq` check is a habit, not a gate — worth enforcing somehow?
- No `.github/`, but PRs are not ungated: GitHub's Copilot reviewer runs on every PR and, across #10 and #11, found two real defects in `collect-usage.sh` that local checks missed. It also fails on its own infrastructure (a CAPI connect timeout failed #10's check with nothing to fix, and its runs can't be retried). So the working gate is Copilot review + `claude plugin validate .` by hand. Leave it there, or encode the repeatable parts — validate, `skills --list`, `bash -n` on the scripts — as a workflow so they don't depend on someone remembering?
- `/tokenomics` has never been run end to end. `/context` and `/usage` are interactive-only, so every fix through 1.4.1 is verified by fixture and unit test, not by a live audit — including the saturation branch, which is the one carrying the headline number. What's the release rule: does a skill version ship without one live run?
- Testing an install in-place (`npx skills@latest add .`) drops `skills-lock.json` and `.claude/` into the working tree, and neither is ignored — `.gitignore` covers `.agents/` only. Ignore both, or keep them visible so a stray install-for-testing can't be committed silently?
- `skills/engineering/` is still empty; its first entry triggers the "create the category heading" step in workflow 2.
