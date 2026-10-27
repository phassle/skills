# dynamic-qa

Its own skill bundle, kept beside `dynamic-implement`, `dynamic-skills-setup`, and
`dynamic-skills-calibrate` in this skills root rather than inside any product repository.
VibeFileSync is where the system was designed and where it will first be piloted; it is not
where the skill lives.

## Status

**Specification only. Not yet a loadable skill.** `SPEC.md` is the buildable specification;
no `SKILL.md` exists here yet, so nothing in this directory is invocable. The built bundle
ships two independently loadable skills, `qa-setup` and `qa-generate`, each with its own
`SKILL.md` — see `SPEC.md ## 4. Distribution and installation`. Building them is a separate
piece of work from writing this specification.

## Dependency on the Dynamic setup skill

Both qa skills depend on `dynamic-skills-setup` having been run for the current repository
and harness, and read the profile it writes instead of probing routes themselves. That skill
is also the single place the bundle's dependency on Matt Pocock's engineering skills is
proved: it verifies `implement`, `tdd`, `code-review`, and `setup-matt-pocock-skills` are
installed. Neither qa skill re-inventories that, and neither invokes setup automatically —
an absent, stale, or unverified profile stops the run before any mutation with the host's
exact manual setup command. See `SPEC.md ### Installation precondition: a verified Dynamic
setup profile`.

## Source and installation

This directory is planning source only. Do not install or mirror it into a harness skill root: without `SKILL.md`, it is not a skill.

When built, `qa-setup` and `qa-generate` become sibling directories under `skills/other/` and are installed independently. Keep genuine WIP without `SKILL.md` or uncommitted; any committed directory containing `SKILL.md` is immediately discoverable through skills.sh.
