# DATA object shape for template.html

Replace `/*__DATA__*/ null` in `template.html` with one JSON object:

```js
{
  // HTML allowed in purpose/subtitle/notes (use <strong>, <code>); everything else is escaped by the template.
  "purpose": "Purpose: <strong>save tokens</strong> — every item below loads into context each session…",
  "subtitle": "Analysis of <strong>N sessions</strong> across M projects…",
  "tiles": [                          // 3 stat tiles; a 4th "You save" tile is added automatically
    { "label": "Skills in context", "value": "10.0k", "hint": "85 skills, every session" },
    { "label": "Custom agents",     "value": "3.2k",  "hint": "10 agents, every session" },
    { "label": "Memory files",      "value": "2.3k",  "hint": "CLAUDE.md + auto-memory" }
  ],
  "totalTokens": 13200,               // denominator for the savings bar/%
  "totalLabel": "13.2k skills + agents",
  "mcpNote": "…",                     // finding about MCP servers (HTML ok)
  "scopeNote": "…",                   // what's out of scope: project skills, built-ins (HTML ok)

  "items": [                          // audit rows, grouped by consecutive `grp`
    {
      "grp": "Plugins (global — enabledPlugins)",  // only on first row of a group
      "id": "azure@claude-plugins-official",       // exact id used in the generated prompt
      "kind": "plugin",               // "plugin" | "skill" | "mcp" | "managed" — decides prompt section
      // "managed" = delivered by the harness/account, not by a file on disk (claude.ai skills,
      // org plugins, app-supplied MCP). Requires "where": the exact place the user turns it off.
      // Managed rows never enter a harness prompt — the page lists them as a manual checklist.
      "name": "azure",
      "src": "claude-plugins-official",
      "tok": 3540,                    // estimated tokens per session
      "uses": 0,                      // all-time invocations; null = "—" (implicit, e.g. LSP)
      "verdict": "remove",            // "remove" | "borderline" | "keep" (keep = no checkbox)
      "checked": true,                // pre-checked (only remove-verdict rows)
      "desc": "30 skills — never invoked in any project."
    }
  ],

  "tips": [                           // "Save more tokens — config tips" cards (checkbox → apply-prompt)
    {
      "id": "subagent-model",
      "title": "Subagent default model → haiku",
      "harness": "Claude Code",        // REQUIRED when tips span harnesses: "Claude Code" | "Codex CLI" | "GitHub Copilot" (usage-based/token-metered since Jun 2026 — no premium-request multipliers) — shown as a tag; non-Claude harnesses get a [Harness] prefix in the apply-prompt
      "save": "big on fan-outs",       // optional badge text
      "desc": "Subagents inherit the parent model. Set <code>CLAUDE_CODE_SUBAGENT_MODEL</code>… (HTML ok)",
      "apply": "In ~/.claude/settings.json add env.CLAUDE_CODE_SUBAGENT_MODEL = \"haiku\"",  // one line, imperative — copied verbatim into the prompt
      "checked": false
    }
  ],

  "evidence": [                       // collapsible raw-count tables
    { "title": "Skill invocations (all projects, all-time)", "rows": [["deep-research", 9], ["azure:* (30 skills)", 0]] }
  ],

  "global": {                         // "Installed globally" tab — full user-level inventory
    "note": "Everything installed at user level (~/.claude), regardless of usage. (HTML ok)",
    "sections": [
      {
        "title": "Plugins",
        "count": 10,                  // optional badge in the summary line
        "note": "From enabledPlugins + installed_plugins.json. (HTML ok)",  // optional
        "cols": ["Plugin", "Version", "Scope", "Enabled"],                  // optional header
        "rows": [["azure@claude-plugins-official", "1.1.75", "user", "yes"]]
      },
      { "title": "User skills (~/.claude/skills)", "rows": [["graphify", "knowledge-graph queries"]] },
      { "title": "MCP servers (~/.claude.json)", "rows": [["mobi", "http · https://…"]] },
      { "title": "Hooks (global settings.json)", "rows": [["PreToolUse", "herdr-agent-state.sh working"]] },
      { "title": "Marketplaces", "rows": [["claude-code-plugins", "github anthropics/claude-code"]] }
    ]
  },

  "rationale": {                      // "Why & sources" tab — the verified underlay
    "note": "…",                      // optional intro line above the rendered doc (HTML ok)
    "md": "# Tokenomics — rationale…" // RAW Markdown of references/RATIONALE.md, verbatim
  }
}
```

Notes:
- **Tokens, not dollars.** All values (`tok`, `totalTokens`, tiles, `save` badges, `desc`) are token / qualitative — never prices, $/month, or hardcoded rates/multipliers (they go stale). `save` is a qualitative badge (e.g. "big on fan-outs"), not a figure.
- **`tok` is what actually loads today, not what an item would cost.** When the skill listing is saturated, an unused skill's description is already dropped, so its row is `tok: 0` (or near it) with the real benefit stated in `desc` — freed listing budget for the skills that do get invoked. Summing would-be description costs into `totalTokens` overstates the headline badly. See SKILL.md step 2.
- **`id` on a `kind: "skill"` row is the path relative to `~/.claude/skills`** (`synced/monterro-deck`) — the apply-prompt moves exactly that path. Never key a row on a directory that contains other skills.
- First cell of every row renders in monospace; rows are plain string arrays (any column count matching `cols`).
- `kind: "mcp"` rows generate a "remove from ~/.claude.json mcpServers" step in the apply-prompt.
- `kind: "managed"` rows are excluded from every harness prompt by design and rendered under "Turn these off yourself" using `name` + `where` (e.g. `"where": "claude.ai → Settings → Capabilities → Skills"`). Emitting config edits for a surface the harness supplies sends an agent looking for files that don't exist.
- Keep ids exact — the user pastes the generated prompt back and Claude follows it literally.
- The `md` field of the `rationale` object — `DATA.rationale.md`, not a key literally named `rationale.md` — is the **raw** Markdown of `references/RATIONALE.md`, passed through unchanged — the template renders it (headings, tables, links). Don't hand-convert to HTML and don't edit it; the file is the single source of truth.
