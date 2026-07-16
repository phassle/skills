# Evals — tokenomics

Invariants that must hold on **every** run, written as checkable scenarios. A skill's job is a predictable *process*; these are the process's non-negotiables. Use them as a regression checklist after editing `SKILL.md`, or paste one scenario + a real run's output into an LLM grader and ask "did the run satisfy the pass criteria — yes/no + why".

Each eval: a scenario, then a **pass** criterion (binary, checkable) and the **fail** it guards against.

## 1. Never mutates config
- **Scenario:** run `/tokenomics` end-to-end in any project.
- **Pass:** the only writes are the report (Artifact or `tokenomics-report.html`) and scratch files. No edit to `~/.claude/settings.json`, `~/.claude.json`, `enabledPlugins`, or any skill/MCP config.
- **Fail:** the skill disables a plugin, removes an MCP server, or moves a skill dir itself instead of emitting an apply-prompt.

## 2. Tokens, never dollars
- **Scenario:** inspect the published report — tiles, row costs, savings counter, tip text, notes.
- **Pass:** every figure is tokens or qualitative ("standing context removed", "big on fan-outs"). No `$`, `$/month`, per-model rates, or hardcoded multipliers (5×, 90%).
- **Fail:** any price or fixed multiplier appears on the page (goes stale; belongs in `docs/tokenomics-rationale.md`).

## 3. Classification is usage-grounded
- **Scenario:** an invocation-based item (a plugin/skill/agent that isn't a passive LSP/hook and isn't a dependency of a used item) with 0 invocations across all transcripts *and* 0% in `/usage`.
- **Pass:** verdict `remove`, pre-checked.
- **Fail:** a passive-value item (LSP, hook) marked `remove` on invocation count alone, or a used item's dependency (e.g. codex behind a TDD flow) marked removable without the dependency check.

## 4. Scope discipline
- **Scenario:** the project contains its own `.claude/skills/` or `.agents/skills/`, plus built-in skills and deferred system tools.
- **Pass:** those appear in notes only, never as audit rows. Audit rows cover global plugins, user skills, and removable MCP servers (`kind` = plugin | skill | mcp per DATA-SHAPE.md).
- **Fail:** a project or built-in skill listed as a removable row.

## 5. Zero MCP is a finding, not an error
- **Scenario:** a setup with no MCP servers connected.
- **Pass:** the run completes and reports "no MCP servers" as a finding.
- **Fail:** the run errors, warns, or silently drops the MCP section.

## 6. Combined usage counting
- **Scenario:** `/graphify` typed 5× as a slash command + invoked 2× via the Skill tool.
- **Pass:** counted as 7 uses (slash + Skill-tool counts summed) → kept.
- **Fail:** only one source counted, leading to a false `remove`.

## 7. Apply-prompt is reversible and safe
- **Scenario:** the user pastes the generated Claude Code prompt back and it is followed.
- **Pass:** plugins → `enabledPlugins: false` (keys/hooks/marketplaces untouched); user skills → moved to `~/.claude/skills-disabled/`; MCP removals → backed up to `~/.claude/mcp-disabled.json` first; ends with a diff summary + skipped-at-scope list + restart reminder.
- **Fail:** any `rm`, deleted config key, or removed MCP server with no backup.

## 8. Publish contract
- **Scenario:** report is ready.
- **Pass:** published via the Artifact tool with favicon `🧹` and title "Tokenomics — Claude Code context audit"; if no Artifact tool (Codex/Copilot/other harness), written to `tokenomics-report.html` with an open-in-browser instruction instead.
- **Fail:** wrong/absent favicon or title, or a hard failure when the Artifact tool is unavailable.

## 9. Every tip is harness-tagged
- **Scenario:** the `tips` array is filled.
- **Pass:** each tip carries `harness`, and only harnesses the user actually has installed appear.
- **Fail:** a tip with no `harness`, or a tip for a harness the user doesn't run.

## 10. Invocation is slash-only
- **Scenario:** the user says "what can I remove from my context" without typing `/tokenomics`.
- **Pass:** the skill does **not** auto-fire (`disable-model-invocation: true`); it runs only when invoked by name.
- **Fail:** the skill triggers itself from context — regression of the frontmatter flag, re-adding standing context load.
