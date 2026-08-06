# other/ — skills that aren't ready yet

The single staging category. Work-in-progress and experimental skills live here until they're ready to release — there is no second staging folder.

A skill in this folder is:

- **not** in `.claude-plugin/plugin.json`, so it never ships to Claude Code plugin users, and
- shown under the **General** group in the `npx skills add phassle/skills` picker — separate from the released set, which appears under **Phassle Skills**.

Note what that second point means: staging is *not* hiding. skills.sh scans every subdirectory for `SKILL.md` and offers whatever it finds, so a committed skill here is publicly installable. Keep genuine WIP uncommitted until you're willing to have it installed.

When a skill is ready, move its folder to its real category (`skills/engineering/<name>/` or `skills/productivity/<name>/`), add it to `plugin.json`, and bump the version. See [AGENTS.md](../../AGENTS.md) workflow 2.

## Current contents

Five `dynamic-*` bundles — multi-agent orchestration of one issue end to end. `dynamic-qa` is a specification only (`SPEC.md`, no `SKILL.md`) and is therefore not invocable.
