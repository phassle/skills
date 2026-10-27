# deprecated/ — skills that are no longer maintained

The five `dynamic-*` bundles (multi-agent orchestration of one issue end to end) live here. They are not in `.claude-plugin/plugin.json` and receive no further updates. Use Matt Pocock's [`implement-spec`](https://github.com/mattpocock/skills) (`npx skills@latest add mattpocock/skills`) instead. `dynamic-qa` is a specification only (`SPEC.md`, no `SKILL.md`) and is not invocable.

Note: skills.sh scans every subdirectory for `SKILL.md`, so the skills here are still publicly installable via `npx skills add phassle/skills` until they are deleted.
