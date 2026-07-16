# other/ — skills that aren't ready yet

Work-in-progress and experimental skills live here until they're ready to release. A skill in this folder is:

- **not** in `.claude-plugin/plugin.json`, so it never ships to plugin users, and
- shown under the **Other** group in the `npx skills add phassle/skills` picker — installable for testing, clearly marked unreleased.

When a skill is ready, move its folder to its real category (`skills/engineering/<name>/` or `skills/productivity/<name>/`), add it to `plugin.json`, and bump the version. See [AGENTS.md](../../AGENTS.md) workflow 2.
