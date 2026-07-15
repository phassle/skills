# Contributing

Maintainer notes for this repo.

## Adding skills

The repo is built to hold many skills, with a test-first flow:

1. **Drop a folder** with a `SKILL.md` under `skills/<category>/<name>/`. It is immediately installable via `npx skills add phassle/skills` — unreleased skills show under the **Other** group in the picker.
2. **Promote it** when it's ready: add `"./skills/<category>/<name>"` to the `skills` array in `.claude-plugin/plugin.json` and bump `version`. It moves to the **Phassle Skills** group, and everyone on the Claude Code plugin gets it on their next update.
3. Add it to the README's Reference section, under its category, with a one-line description — and a "Why these skills exist" entry (problem → fix) if it earns one. Create the category heading when its first skill is released; empty categories don't belong in the README.

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

## Releasing

Bump `version` in `.claude-plugin/plugin.json` on every released change — plugin users update against it. Validate before pushing:

```bash
claude plugin validate .
npx skills@latest add phassle/skills --list
```
