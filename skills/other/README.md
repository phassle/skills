# other/ — skills that aren't ready yet

The single staging category. Work-in-progress and experimental skills live here until they're ready to release — there is no second staging folder.

A skill in this folder is:

- **not** in `.claude-plugin/plugin.json`, so it never ships to Claude Code plugin users, and
- shown under the **General** group in the `npx skills add phassle/skills` picker — separate from the released set, which appears under **Phassle Skills**.

Note what that second point means: staging is *not* hiding. skills.sh scans every subdirectory for `SKILL.md` and offers whatever it finds, so a committed skill here is publicly installable. Keep genuine WIP uncommitted until you're willing to have it installed.

When a skill is ready, move its folder to its real category (`skills/engineering/<name>/` or `skills/productivity/<name>/`), add it to `plugin.json`, and bump the version. See [AGENTS.md](../../AGENTS.md) workflow 2.

## Current contents

- **spec-to-scenarios** — turns a Spec into agreed Gherkin acceptance scenarios plus a planner brief for Playwright's planner agent. Tested on beefcake-platform. Depends on Matt Pocock's `grill-with-docs`, `grilling`, `domain-modeling` and `setup-matt-pocock-skills` installed as sibling skills.

The former `dynamic-*` bundles moved to [`../deprecated/`](../deprecated/README.md).
