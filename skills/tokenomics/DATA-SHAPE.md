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
      "kind": "plugin",               // "plugin" | "skill" | "mcp" — decides prompt section
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
      "harness": "Claude Code",        // REQUIRED when tips span harnesses: "Claude Code" | "Codex CLI" | "GitHub Copilot" — shown as a tag; non-Claude harnesses get a [Harness] prefix in the apply-prompt
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
  }
}
```

Notes:
- First cell of every row renders in monospace; rows are plain string arrays (any column count matching `cols`).
- `kind: "mcp"` rows generate a "remove from ~/.claude.json mcpServers" step in the apply-prompt.
- Keep ids exact — the user pastes the generated prompt back and Claude follows it literally.
