# Tokenomics — rationale & verified sources

The **why** behind every optimization the `tokenomics` skill recommends. This is the skill's reference source: when the skill suggests a config change or scores a removal, the justification and evidence live here.

This is a **living document**. Re-run the research periodically (web claim → official-doc verification) and update the entries and dates below, then adjust `skills/productivity/tokenomics/` to match. The skill should never claim a saving this file cannot back with a source.

### Design rule: no maintained numbers

This document **deliberately hardcodes no prices, token counts, or percentages** — those go stale on every model release and would become a maintenance burden. Instead it states the *mechanism* ("cheaper tiers cost a fraction", "cached reads are heavily discounted", "removing always-loaded surfaces cuts standing context") and **links to the live official page** for the current figure. The concrete savings the skill reports are computed at runtime from the user's own `/context` output — never from a number stored here. Config defaults and documented limits (a listing budget share, a line target) are stated where the docs state them, because they decide which advice applies; re-check them each pass. Bottom line the skill can always state safely: **removing unused, always-loaded surfaces reduces the tokens carried into every session, which reduces cost.**

- **Last researched:** 2026-10-27 (previous: 2026-07-16)
- **Harnesses covered:** Claude Code, OpenAI Codex CLI, GitHub Copilot
- **Method:** for every claim, a community/practitioner source *and* an official-doc URL that confirms it. Each entry is tagged:
  - **VERIFIED** — official documentation confirms the mechanism.
  - **PARTIAL** — official docs confirm the mechanism but scope it more narrowly than commonly stated.
  - **UNVERIFIED** — only community sources; no official confirmation. Never present these as fact.

---

## 0. Core principles (cross-harness)

These hold across all three harnesses and set the frame for everything below.

### 0.1 Output tokens cost more than input — minimize what's generated — VERIFIED
Output is generated one token at a time; input is processed in one parallel pass. Every current model from both vendors prices output at a multiple of input. **The biggest lever is minimizing *generated* tokens**: terse/structured output, capped response length, and pushing large content to be *read* rather than *re-emitted*. This is why the skill says **reviewer/subagent output should be findings, not rewritten code** — you pay the output premium only on a short list, and let the orchestrator apply the edit once.
- Official (current ratios, read live): [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing), [OpenAI pricing](https://developers.openai.com/api/docs/pricing).
- Community: [Simon Willison — subagents](https://simonwillison.net/guides/agentic-engineering-patterns/subagents/), [Amnic — input vs output pricing](https://amnic.com/blogs/compare-input-vs-output-token-pricing).

### 0.2 Prompt caching dominates session cost — don't break the cache — VERIFIED
Cached input tokens bill at a steep discount on both vendors (the depth of the discount now varies by model — read it live). In a coding session the system prompt + tool defs + memory + history are cached and re-read every turn, so cache reads are usually the *majority* of billed cost. The practical lever is **not breaking the cache mid-session**. Cache-write pricing carries a premium, so churn is expensive.
- **Cache invalidators (Claude Code):** switching model (incl. `opusplan` toggling, model fallback, and a skill whose frontmatter sets `model` — a model switch for that turn), toggling fast mode, connecting/disconnecting a non-deferred MCP server, enabling/disabling a plugin **that bundles an MCP server** (plugin skills, commands, agents and hooks never invalidate it), denying a whole tool while tool search is off, compaction, accumulating many images, upgrading Claude Code.
- **Effort changes keep the cache** on the current Claude 5.5 / Fable 5.1 models with an API key or subscription; they still break it on Bedrock, Agent Platform and gateways. `/recap`, `/rewind` and output-style changes keep it too. Editing `CLAUDE.md` mid-session does **not** break the cache — but the edit also doesn't take effect until `/clear`/`/compact`/restart.
- **Cache lifetime (Claude Code):** the main conversation on a subscription (within plan usage) gets the long TTL; subagents, workflows and compaction, and everything on API keys / usage credits / cloud providers, get the short TTL. Tunables: `promptCacheTtl` / `CLAUDE_CODE_PROMPT_CACHE_TTL`, `subagentPromptCacheTtl` / `CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL`, `FORCE_PROMPT_CACHING_5M`, `ENABLE_PROMPT_CACHING_1H`. An idle long conversation on the long TTL may be compacted (`idleCompaction: false` disables).
- **`/usage` now prints a `Prompt cache (main)` hit/miss line** — the skill's runtime evidence of whether a user's habits thrash the cache.
- Official: [Claude prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), [Claude Code prompt caching + invalidators + lifetime](https://code.claude.com/docs/en/prompt-caching), [OpenAI prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching).

### 0.3 Fewer context tokens ≠ automatically lower cost — PARTIAL (important caveat)
Because cache reads dominate, aggressive context trimming that disrupts a cache-friendly prefix can *raise* billed cost even while the raw token count drops. One empirical study found a change that cut raw tool-output tokens *increased* paired billed cost, and that over-compression corrupted verbatim edit anchors and hurt task success.
- Source: arXiv:2607.12161 (Weinberger & Hozez, 2026-07-13, **not peer-reviewed**) — the mechanism is independently verified in 0.2; treat the study as directional.
- **Implication for the skill:** the defensible win is removing **always-loaded** surfaces (unused plugins/skills/agents/MCP schemas that load every session) — that shrinks the cached prefix once, permanently, without thrashing it. Frame the token counter as "standing context removed per session", not a guaranteed invoice reduction, and avoid selling mid-session compression as a pure saving.

### 0.4 Progressive disclosure / just-in-time loading — VERIFIED
Load a lightweight pointer (name + one-line description) by default; load the full body only when the task triggers it. This is how Agent Skills and MCP tool search work in all three harnesses now, and it's the biggest structural lever for standing context.
- Official: [Anthropic — Agent Skills (three-level disclosure)](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills), [Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) ("strive for the minimal set of information that fully outlines expected behavior"; "bloated tool sets" are a top failure mode).

### 0.5 Model tiering — VERIFIED
Route planning/judgment to a frontier model, execution to a cheaper one; cheaper tiers cost a fraction per token. Community routing studies claim large cost cuts (UNVERIFIED figures) — cite the mechanism, not a percentage. Caveat: a cheap tier is not cheap on every input — Claude's Haiku 5.5 is priced higher on very long prompts (see the pricing page), which matters when it is the forced subagent model over large contexts.
- Official (current per-tier prices, read live): pricing pages in §4.

### 0.6 Batch/async for offline work — VERIFIED
Non-interactive workloads (bulk classification, retro audits) qualify for a substantial discount on both vendors' batch APIs. Not applicable to interactive coding, but relevant if tokenomics ever runs large offline analysis.
- Official: [OpenAI Batch](https://developers.openai.com/api/docs/guides/batch); Anthropic batch processing (platform.claude.com/docs/en/build-with-claude/batch-processing).

### 0.7 Running several harnesses: what is a durable argument, and what the terms allow — VERIFIED (dates noted)
Orchestrating Claude Code, Codex and Copilot in one workflow is sometimes pitched as *spend arbitrage* — three subscriptions already paid for, so the tokens are free. **Don't build on that.** GitHub moved Copilot to metered AI Credits on **Jun 1 2026** (§3.0), drawn at published per-model token rates; Business/Enterprise promotional included usage ran for June–August 2026 and allowances then returned to the standard per-license amount. Anthropic announced metering for non-interactive routes (`claude -p`, Agent SDK) and then **paused** it — as of Oct 7 2026 the support page says those routes "still draw from your subscription limits". Treat any un-metered subscription route as temporary, not as the basis of a thesis.
- **What survives every repricing:** *review by a different model family than the one that wrote the code*, which removes shared blind spots, plus fresh per-ticket context and pointer-passing (paths/SHAs/diffs instead of transcripts) — both of which cut tokens regardless of who bills them. Argue quality and context hygiene; never argue "it's free".
- **Terms, as they read today:** one developer running the vendors' own CLIs, under their own logins, on their own machine is inside all three agreements. Shelling out to each CLI — rather than reusing another tool's OAuth token — is what keeps it there: Anthropic's legal page states OAuth authentication "is intended exclusively for purchasers of Claude Free, Pro, Max, Team, and Enterprise subscription plans" and that it does not permit third-party developers to route requests through those credentials. The violation is one config step away: put the same setup in CI, or point it at a login shared by a team, and GitHub's one-login-per-person rule is broken outright. Any material teaching this pattern must state the per-person, own-machine boundary alongside it.
- Official: [Copilot Jun 1 2026 billing changelog](https://github.blog/changelog/2026-06-01-updates-to-github-copilot-billing-and-plans/), [Copilot usage-based billing announcement (promo months)](https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/), [Agent SDK with your Claude plan](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan), [Claude Code legal & compliance (OAuth)](https://code.claude.com/docs/en/legal-and-compliance), [GitHub Terms — accounts](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service).
- **Still UNVERIFIED:** the exact date of Anthropic's OAuth-reuse prohibition (community sources say Feb 19 or 20 2026; the official page carries no date — cite the page, not a date), and any community figure for the size of the post-promo Copilot drop.

---

## 1. Claude Code

### 1.1 Model selection & `opusplan` — VERIFIED
`/model <alias>` (persists), `--model`/`ANTHROPIC_MODEL` (session), `ANTHROPIC_DEFAULT_MODEL`, or `model` in `settings.json`. Aliases: `sonnet`, `opus`, `haiku`, `fable` (Fable 5.1), `best` (resolves to Fable where available to you, else the `opus` model), `opusplan`, `default`, plus `[1m]` variants (`sonnet[1m]`, `opus[1m]`, `opusplan[1m]`). `opusplan` uses Opus in plan mode and auto-switches to Sonnet for execution — big-model reasoning without big-model rates on the token-heavy build phase. Some providers resolve aliases to older versions.
- Official: [model-config](https://code.claude.com/docs/en/model-config). Blanket "Sonnet saves X%" figures are UNVERIFIED (community).

### 1.2 Subagent model — `CLAUDE_CODE_SUBAGENT_MODEL` (+ `_FORCE`) — VERIFIED (changed)
Since v2.1.251 `CLAUDE_CODE_SUBAGENT_MODEL` is only a **default**. Resolution: per-invocation `model` param → subagent frontmatter `model:` (`inherit` = main model) → `CLAUDE_CODE_SUBAGENT_MODEL` → main model. Setting it alone also doesn't move the built-in **Explore** and **Plan** subagents — and when the main conversation runs Fable, Explore runs on the `opus` model on subscriptions, Console and `ANTHROPIC_BASE_URL` gateways. To put every subagent, teammate and workflow agent on one cheaper model, set **both** `CLAUDE_CODE_SUBAGENT_MODEL` and `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` (v2.1.257+); forks and `model: inherit` skills still run on the main model. Alternatively, define a user subagent named `Explore` with `model: haiku`. Only Claude aliases/IDs (or provider IDs on Bedrock/Vertex/Foundry) resolve.
- Official: [sub-agents → choose a model / run every subagent on one model](https://code.claude.com/docs/en/sub-agents), [model-config → environment-variables](https://code.claude.com/docs/en/model-config).

### 1.3 Reasoning effort — VERIFIED
Levels: **low / medium / high / xhigh / max**, plus `/effort auto`; set via `/effort`, `--effort`, `CLAUDE_CODE_EFFORT_LEVEL`, or `effort` in skill / subagent frontmatter. Effort governs output length, tool-call verbosity, *and* thinking depth together. Opus 5.5, Sonnet 5.5 and Haiku 5.5 default to `medium` in Claude Code. **Fable models, Sonnet 5+, Haiku 5.5 and Opus 4.7+ always use adaptive reasoning**: `MAX_THINKING_TOKENS` is ignored there, and thinking can't be turned off on Opus 5.5, Sonnet 5.5, Haiku 5.5 or any Fable model. A fixed thinking budget applies only to Opus 4.6 / Sonnet 4.6 with `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING=1`. `ultracode` is now a toggle independent of effort (v2.1.284+) that runs autonomous multi-agent orchestration — "each request uses more tokens": a cost increase, never a saving.
- Official: [effort](https://platform.claude.com/docs/en/build-with-claude/effort), [model-config → adaptive reasoning](https://code.claude.com/docs/en/model-config).

### 1.4 MCP tool search defers everything by default — VERIFIED (corrects "set ENABLE_TOOL_SEARCH")
Only tool names + server instructions load at session start; full schemas load on demand. `ENABLE_TOOL_SEARCH`: unset = **all MCP tools deferred** (default; also for gateways since v2.1.304), `true` = same as unset, `auto[:N]` = load upfront only if schemas fit within a share of context, `false` = disable. Needs a tool-search-capable model. `alwaysLoad: true` per server in `.mcp.json` exempts your most-used servers (it also makes startup wait for that server); server authors can mark single tools with `_meta."anthropic/alwaysLoad"`, which `alwaysLoad: false` overrides (v2.1.287+). Server instructions and upfront tool descriptions are capped (`CLAUDE_CODE_MAX_MCP_DESCRIPTION_LENGTH`); `MAX_MCP_OUTPUT_TOKENS` caps tool output.
- Official: [MCP → scale with tool search](https://code.claude.com/docs/en/mcp#scale-with-mcp-tool-search), [tool-search-tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool), [Anthropic — advanced tool use](https://www.anthropic.com/engineering/advanced-tool-use).
- **Open bug, not re-tested:** an HTTP/Streamable-HTTP MCP gateway was reported (issue #40314) loading full schemas regardless of the setting — auto-closed, never confirmed. UNVERIFIED.

### 1.5 Prefer CLI tools over MCP servers — VERIFIED
A CLI called via Bash adds zero standing schema cost; MCP tool *names* always load even under deferral. Docs specifically name `gh`, `aws`, `gcloud`, `sentry-cli`. Community "N× cheaper" figures are UNVERIFIED.
- Official: [costs → reduce MCP server overhead](https://code.claude.com/docs/en/costs).

### 1.6 Output-filter hooks — VERIFIED
A `PreToolUse` hook rewrites tool input before execution (e.g. appends `| grep ERROR | head -100`) so bloated output is never produced. Official example: grepping a large log cuts context dramatically. `PostToolUse` can swap output *after* the fact via `updatedToolOutput` (reduces context, not the underlying call's cost).
- Official: [costs → offload processing to hooks](https://code.claude.com/docs/en/costs), [hooks](https://code.claude.com/docs/en/hooks).

### 1.7 Instruction files (`CLAUDE.md` / `AGENTS.md`) — VERIFIED
Instruction files load **in full, every session**. Docs recommend keeping each under ~200 lines; `/doctor prompt-audit` (v2.1.283+) flags outdated or conflicting content. `@path` imports do **not** reduce cost (imported files still load at launch). Cheaper alternatives: move workflow-specific rules into **Skills** (description at start, body on invocation) or path-scoped `.claude/rules/` files with `paths:` frontmatter (load only when matching files are touched); block-level HTML comments are stripped and cost nothing; `claudeMdExcludes` skips ancestor files you don't want. A file over 4 MiB is skipped entirely.
- **Which file loads (v2.1.277+):** Claude Code reads `AGENTS.md` natively when no `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` exists in the working directory or above; any of those shadows it unless it imports `@AGENTS.md` (or is a symlink to it). The user-scope **Project instructions** setting (`/config`) changes the default: `claude-md-or-agents-md` (default), `claude-md-and-agents-md` (read both — lets a personal `CLAUDE.local.md` coexist with `AGENTS.md`), `claude-md`, `managed-only`.
- Official: [memory](https://code.claude.com/docs/en/memory) (incl. [#agents-md](https://code.claude.com/docs/en/memory#agents-md)), [costs](https://code.claude.com/docs/en/costs).

### 1.8 Skill / plugin / agent standing cost — VERIFIED
Skill *descriptions* always load; bodies load on invocation. The listing budget "scales at 1% of the model's context window" (`skillListingBudgetFraction`, default `0.01`; also `SLASH_COMMAND_TOOL_CHAR_BUDGET`, `skillListingMaxDescChars`), each entry's `description` + `when_to_use` is capped, and on overflow descriptions are dropped "starting with the skills you invoke least". **Fable 5.x, Sonnet 5+, Haiku 5.5 and Opus 4.7+ run with the 1M window by default**, so the budget is several times the 200K-window figure and the listing saturates far less often — unless the user sets `CLAUDE_CODE_DISABLE_1M_CONTEXT`. Descriptions are rebuilt after compaction (v2.1.304+).
- **Hiding a skill:** `disable-model-invocation: true` in frontmatter removes its description entirely (zero cost until manual invocation). **`skillOverrides`** in settings does the same without editing the skill: `"on"` | `"name-only"` | `"user-invocable-only"` (hidden from Claude, still in `/`) | `"off"` (hidden everywhere); keyed by skill name; the `/skills` menu writes it to `.claude/settings.local.json`. It is reversible and works for symlinked skills; **plugin skills are not affected** (use `/plugin`). Whether it holds for claude.ai-synced skills is UNVERIFIED.
- **Plugins:** before install, official-marketplace plugins show an **Every turn / When invoked** context estimate; `claude plugin details <name>` prints an **Always-on** token line. A **"not used recently"** flag marks plugins unused for at least 14 days and 10 sessions (hidden under `strictKnownMarketplaces`). Custom subagent descriptions are always-on too. Hooks cost **zero** context unless they emit output. Subagents run in an **isolated** context window (only a summary returns); `context: fork` inherits the parent instead.
- Official: [skills](https://code.claude.com/docs/en/skills) (incl. [override visibility from settings](https://code.claude.com/docs/en/skills#override-skill-visibility-from-settings)), [settings-reference](https://code.claude.com/docs/en/settings-reference#skilllistingbudgetfraction), [plugins → measure](https://code.claude.com/docs/en/plugins/measure), [sub-agents](https://code.claude.com/docs/en/sub-agents), [features-overview](https://code.claude.com/docs/en/features-overview).

**Corollary the audit must apply — a bounded budget makes removals non-additive.** Because the listing is capped and overflow drops the *least-used* descriptions first, once it saturates the skills an audit flags are exactly the ones already reduced to names. Disabling them then frees ≈0 tokens, and per-skill estimates must not be summed into a savings headline. The genuine gain is a **reallocation**: the freed budget goes to full descriptions for the skills that are actually invoked, so the model can route to them instead of seeing a bare name. Report it as a routing win, and keep the token counter for surfaces that are unbudgeted and always-on — plugins, custom agents, MCP, memory. On a 1M-window session check saturation before assuming it; it is now the exception. Skills already set to `disable-model-invocation: true` (or `skillOverrides` hidden) are outside the listing and are never savings.

### 1.9 Agent Teams token multiplier — PARTIAL
`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (env or settings), **disabled by default** (experimental). Each teammate is a full instance with its own context window, so cost is substantially higher — the one exact figure in official docs is scoped to **teammates running in plan mode**; elsewhere docs say cost is "roughly proportional to team size". Advise Sonnet teammates / small teams if enabled.
- Official: [agent-teams](https://code.claude.com/docs/en/agent-teams), [costs](https://code.claude.com/docs/en/costs).

### 1.10 Introspection & spend-cap commands — VERIFIED
- `/context [all]` — per-category token breakdown (system prompt, MCP tools, memory, skills, agents, messages, free space) + suggestions. **The skill's runtime source for actual token figures.**
- `/skill-doctor` (v2.1.252+) — per-skill context cost and usage frequency, flags never-invoked skills and plugins not used recently. **The best single source for skill rows when present.**
- `/usage` (aliases `/cost`, `/stats`) — on subscriptions, **attributes cost by % to skills, subagents, plugins and individual MCP servers** (24h/7d toggle), a **Recommendations** block, a `Prompt cache (main)` hit/miss line (v2.1.251+), and an `f` key that applies fixes (v2.1.305+). 0% attribution + 0 invocations = high-confidence removal.
- `/doctor` — checks unused skills, MCP servers and plugins against their context cost (pulls in `/usage` recommendations on v2.1.305+); `/doctor prompt-audit` reviews instruction files.
- `/usage-credits` — on Pro/Max opens **Settings → Usage on claude.ai** in the browser (buy credits, monthly spend limit, auto-reload); members without billing access send a request to their admin. Org caps: seat allowance (Team/Enterprise), Console workspace limits (API), or provider budgets (Bedrock/Vertex/Foundry).
- `/mcp` — per-server connection status + token cost; disable unused. `/autocompact <tokens>` — see §1.12. `/insights` — session insights.
- Official: [costs](https://code.claude.com/docs/en/costs), [commands](https://code.claude.com/docs/en/commands), [context-window](https://code.claude.com/docs/en/context-window), [plugins → measure](https://code.claude.com/docs/en/plugins/measure).

### 1.11 Junk-read denial — VERIFIED (official: `.claudeignore` has no effect)
The permissions page states it directly: "If your project has a `.claudeignore` file, it has no effect, so move its entries into `Read` deny rules." Use enforced `permissions.deny` Read rules in `settings.json`: `"Read(./.env)"`, `"Read(./node_modules/**)"`, `"Read(./**/*.lock)"`, `"Read(./**/*.pem)"`, etc.
- Official: [permissions](https://code.claude.com/docs/en/permissions).

### 1.12 Context lifecycle & the auto-compact window — VERIFIED
`/compact [focus on X]` summarizes (still costs a model call); `/clear` wipes (cheapest, loses history); subagent delegation keeps big one-off reads out of the main window. **With 1M windows the default, a session can run very long before it auto-compacts** — and every turn re-reads that whole cached prefix. Lower the threshold with `/autocompact <tokens>`, `autoCompactWindow` in settings, `--autocompact`, or `CLAUDE_CODE_AUTO_COMPACT_WINDOW` (the env var wins). Compaction re-attaches skills invoked in the session (capped per skill and in total). Community auto-compact buffer numbers for older windows remain UNVERIFIED.
- Official: [model-config → set the auto-compact window](https://code.claude.com/docs/en/model-config#set-the-auto-compact-window), [context-window](https://code.claude.com/docs/en/context-window), [how-claude-code-works](https://code.claude.com/docs/en/how-claude-code-works).

### 1.13 Auto-memory standing cost — VERIFIED (mechanism)
Auto memory loads `MEMORY.md` each session up to a documented cap (first 200 lines or 25KB), unlike `CLAUDE.md`, which has no such cap. Claude reads and writes memory files **during your session** as ordinary tool calls — the docs do not describe separate background calls, so don't claim any. Turn it off with the `/memory` toggle, `autoMemoryEnabled: false` (per project), or `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`. Only suggest this when the user already has their own memory system — otherwise the feature is doing useful work. State the cost qualitatively; never attach a number.
- Official: [memory → auto memory](https://code.claude.com/docs/en/memory#auto-memory).

### 1.14 The inventory is not always on disk — VERIFIED (by direct observation)
`~/.claude` describes the CLI profile. The Claude Code **desktop/cowork** app additionally receives plugins, skills and MCP servers from the app and the signed-in account at session start. Observed on a machine running the desktop app: `settings.json` had `enabledPlugins: {}`, `~/.claude.json` had no `mcpServers`, and `~/.claude/skills` held one symlinked skill — while the same session carried ~30 account skills plus several plugin bundles and their MCP servers, none of which existed anywhere under `~/.claude` or `~/Library/Application Support/Claude`. The `ListSkills` / `ListPlugins` tools return that account-side set (name, description, `enabled`).
- **Implication for the skill:** an audit restricted to disk reports "nothing installed" for exactly the setups carrying the most standing context. Enumerate in-session, and mark those rows as harness-managed: they are turned off in claude.ai / org settings, never by editing files.
- **The usage evidence is weaker for these rows.** `~/.claude/projects` holds CLI and desktop-app transcripts; an account skill used on claude.ai in the browser writes nothing there. On the machine above, all 30 account skills showed zero invocations — which locates the sessions, not the disuse. Treat local zero as "unknown" for managed rows and require corroboration (`/usage` attribution, `/skill-doctor`, a duplicate, or the user's own word) before calling one removable.
- Official: none — the app's delivery mechanism isn't documented; this rests on direct observation, so re-check it when the desktop app changes.

### 1.15 Fast mode and background usage drivers — VERIFIED
- **Fast mode** (Opus only) bills to usage credits on subscriptions at fast rates, and the first toggle re-reads the whole context uncached at those rates. Warn if it is persisted as a default.
- **Things that spend while you're not typing:** prompt suggestions, goal check-ins (`CLAUDE_CODE_GOAL_CHECKIN_MINUTES=0` turns them off), `/loop` scheduled tasks, cross-session messages (`crossSessionInbound: hold` queues them), and workflows (a "Large workflow" warning fires on big fan-outs). Mention only what the user has enabled.
- Official: [fast-mode](https://code.claude.com/docs/en/fast-mode), [costs → why usage climbs in a long session](https://code.claude.com/docs/en/costs#why-usage-climbs-in-a-long-session), [workflows](https://code.claude.com/docs/en/workflows).

---

## 2. OpenAI Codex CLI

Config lives in `~/.codex/config.toml`, and in a **trusted** project also `.codex/config.toml` (project files ignore `model_provider(s)`, `profile(s)`, `notify` and `otel`, but take model, effort and verbosity keys). Reasoning tokens bill at the **output** rate.

### 2.1 Lower `model_reasoning_effort` — VERIFIED (values changed)
Levels are now **model-dependent**: "Reasoning effort advertised by the selected model, such as `low`, `medium`, `high`, `xhigh`, `max`, or `ultra`." `minimal` is gone from the Codex reference (GPT-6.1 Sol doesn't support `none`/`minimal` and defaults to `medium` on the API). `ultra` uses subagents to work parts of a task in parallel — a token multiplier; Luna supports up to `max`, not `ultra`. Fewer reasoning tokens on lower effort = direct output-token savings; reserve `max`/`ultra` for hard tasks.
- Official: [config reference](https://learn.chatgpt.com/docs/config-file/config-reference), [models](https://learn.chatgpt.com/docs/models), [reasoning guide](https://developers.openai.com/api/docs/guides/reasoning).

### 2.2 Hiding reasoning summaries does NOT save money — VERIFIED (myth)
`model_reasoning_summary = "none"` / `hide_agent_reasoning = true` change only what's *displayed*; reasoning tokens are still generated and billed. Lower `model_reasoning_effort` is the real lever.
- Official: [reasoning guide](https://developers.openai.com/api/docs/guides/reasoning) ("reasoning tokens … are billed as output tokens").

### 2.3 Lower `model_verbosity` — VERIFIED
`low | medium | high`; applies only to providers using the Responses API (Chat Completions providers ignore it). Shortens final output.
- Official: [advanced config](https://learn.chatgpt.com/docs/config-file/config-advanced).

### 2.4 Cheaper model tier — VERIFIED (models changed)
The Codex lineup is now `gpt-6-astra`, `gpt-6.1-sol`, `gpt-6.1-terra` and `gpt-6-luna`; **Luna** is the efficient tier ("our most efficient model for focused, high-volume tasks") with the lowest credit rate. Older models were retired from ChatGPT sign-in (GPT-5.4 family Aug 31, GPT-5.3-Codex-Spark Sep 14, GPT-5.5 Oct 14 2026; API-key sessions unaffected) — so never recommend a model by an old name; point at the models page. Set `model = "…"` or `-m`.
- **Profiles changed in Codex 0.134.0+:** `[profiles.<name>]` tables in `config.toml` and the top-level `profile = …` selector are no longer read. A profile is its own file, `~/.codex/<name>.config.toml`, with top-level keys, selected with `--profile`/`-p`. Never emit a `[profiles.x]` table.
- Official: [models](https://learn.chatgpt.com/docs/models), [pricing](https://learn.chatgpt.com/docs/pricing), [advanced config → profiles](https://learn.chatgpt.com/docs/config-file/config-advanced).

### 2.5 Prompt caching (automatic) — VERIFIED
An exact-match prompt prefix caches automatically at a heavy discount ("cache reuse requires the entire rendered prefix to match"); Codex's append-only loop keeps the prior prompt a prefix of the next. Keep AGENTS.md/system stable; don't edit early messages. **The cache-write premium depends on the billing path:** on the API (newest model family) cache writes cost more than uncached input, with a longer TTL costing more still, so a low-reuse prefix can cost more; **Codex credit billing has no separate cache-write charge.** Community hit-rate claims are UNVERIFIED.
- Official: [prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching), [Codex pricing](https://learn.chatgpt.com/docs/pricing).

### 2.6 AGENTS.md hygiene / `project_doc_max_bytes` — VERIFIED
Codex builds the instruction chain once per run (in the TUI, once per launched session) from `~/.codex/AGENTS.override.md` (read *instead of* the global `AGENTS.md`) and, from repo root down to cwd, at most one file per directory — `AGENTS.override.md`, then `AGENTS.md`, then any `project_doc_fallback_filenames`. `project_doc_max_bytes` caps the total; Codex stops adding files once the combined size reaches it — content past the cap is dropped without a documented warning. A bloated file taxes every session; audit override and fallback files too.
- Official: [AGENTS.md custom instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

### 2.7 Trim MCP tool exposure — PARTIAL
`enabled_tools` (allow-list) / `disabled_tools` (deny-list, applied after `enabled_tools`) / `enabled = false` per server, and a new per-tool output cap `mcp_servers.<id>.tools.<tool>.output_token_limit`. That tool schemas consume per-turn context is a general truth, but OpenAI's docs **don't quantify** it. Tool search with deferred loading exists on the API (`defer_loading`); that Codex always defers MCP tools is suggested only indirectly (retired `tool_search` switches are rejected) — UNVERIFIED for Codex.
- Official: [MCP config](https://learn.chatgpt.com/docs/extend/mcp?surface=cli), [API tool search](https://developers.openai.com/api/docs/guides/tools-tool-search).

### 2.8 Context management & ephemeral history — VERIFIED (keys) / PARTIAL (defaults)
`model_auto_compact_token_limit` (+ `model_auto_compact_token_limit_scope`), `model_context_window`, `tool_output_token_limit`, `compact_prompt` cap growth; official docs confirm the keys but **not** the numeric defaults. `[history] persistence = "none"`, `history.max_bytes`, or `--ephemeral` (for `codex exec`) limit session rollout writes. `features.rollout_budget.*` is a token-budget tracker still under development, off by default.
- Official: [config reference](https://learn.chatgpt.com/docs/config-file/config-reference), [advanced config](https://learn.chatgpt.com/docs/config-file/config-advanced), [non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode).

### 2.9 Local OSS models — VERIFIED
`--oss` / `--local-provider ollama|lmstudio` / `oss_provider` route to a local OpenAI-compatible endpoint — no per-token API charge.
- Official: [developer commands](https://learn.chatgpt.com/docs/developer-commands?surface=cli).

### 2.10 Billing path: ChatGPT plan vs API key — VERIFIED
API-key sign-in bills pay-as-you-go per token (no cap). ChatGPT-plan sign-in includes Codex usage within rolling five-hour windows (plus possible weekly limits), then draws credits; "API token prices are separate from subscription usage; don't use them to estimate included tasks." Free and Go plans get the Luna model in the desktop app (rolling out). **Fast and Ultrafast modes consume allowance faster** and are on by default (`features.fast_mode`, `features.ultrafast_mode`) — don't use them for routine work.
- Official: [Codex pricing](https://learn.chatgpt.com/docs/pricing), [config reference](https://learn.chatgpt.com/docs/config-file/config-reference).

### 2.11 Skills standing cost — VERIFIED (new)
Codex starts with each skill's name and description and loads the full `SKILL.md` only when it uses the skill. The listing uses at most 2% of the model's context window (a fixed character budget if the window is unknown); over budget, Codex "shortens skill descriptions first" and may omit skills with a warning. `skills.max_context_tokens` raises the budget (capped). Disable a skill with a `[[skills.config]]` entry (`path`, `enabled = false`); stop implicit invocation with `policy.allow_implicit_invocation: false` in the skill's `agents/openai.yaml` (explicit `$skill` still works). Whether non-implicit skills are left out of the catalog entirely is UNVERIFIED. Locations: `.agents/skills` (cwd up to repo root), `$HOME/.agents/skills`, `/etc/codex/skills`. The §1.8 saturation corollary applies here too.
- Official: [build skills](https://learn.chatgpt.com/docs/build-skills).

### 2.12 Subagents, plugins and introspection — VERIFIED (new)
- **Subagent model:** `agents.default_subagent_model` and `agents.default_subagent_reasoning_effort` (an explicit spawn model wins) — the Codex equivalent of §1.2; also `agents.max_concurrent_threads_per_session`.
- **Plugins:** `plugins.<name@marketplace>.enabled`, `features.remote_plugin` (on by default), `tool_suggest.discoverables` — a standing surface to inventory; the docs don't quantify its context cost.
- **Introspection:** `/status` (session config, token usage, remaining context), `/usage daily|weekly|cumulative` (account token usage), `/compact`, `/plugins`, `/subagents`, `/debug-config`.
- Official: [config reference](https://learn.chatgpt.com/docs/config-file/config-reference), [developer commands](https://learn.chatgpt.com/docs/developer-commands).

---

## 3. GitHub Copilot

### 3.0 Current billing model — VERIFIED
**Usage-based billing in "GitHub AI Credits", effective June 1, 2026** (announced Apr 27, 2026), replacing premium-request-units + per-model multipliers. Cost = tokens (input + output + cached) × per-model rate. "Code completions and next edit suggestions are not billed in AI credits and remain unlimited for all paid plans." Additional usage for orgs is enabled by default. Business/Enterprise promotional included usage covered June–August 2026; allowances are now the standard per-license amount, and seats are charged upfront from Oct 1 2026. A Copilot Max individual tier exists. The old PRU/multiplier system is "(legacy)" and applies only to holdouts on **annual** Pro/Pro+ plans until their term expires (then Free).
- Official: [Copilot → usage-based billing (blog)](https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/), [Jun 1 2026 changelog](https://github.blog/changelog/2026-06-01-updates-to-github-copilot-billing-and-plans/), [usage-based billing for individuals](https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-individuals), [plans](https://docs.github.com/en/copilot/get-started/plans).

### 3.1 Context size now drives cost — VERIFIED (reverses old advice)
Under PRU billing, context size was free (flat per request). Under token metering it **directly drives cost** — and a **Long context** tier bills higher above an input-token threshold ("use the regular context window and regular reasoning by default"; CLI `--context default|long_context`, Tab in `/model`). Keep context lean: new session per task (`/new`, `/clear`), `/compact [focus on X]`, `/context` to inspect, side questions with `/ask` / `/btw` (kept out of history), a lean instruction set, and only needed MCP toolsets. The CLI auto-compacts near the window limit and spills large tool output to a temp file (`COPILOT_LARGE_OUTPUT_THRESHOLD_BYTES`).
- **Instruction files are all merged in the CLI:** "Copilot CLI loads custom instructions from these locations simultaneously (all are merged)" — `CLAUDE.md`, `GEMINI.md`, `AGENTS.md`, `.claude/rules/**`, `.github/instructions/**`, `.github/copilot-instructions.md`, `~/.copilot/…`. `@path` imports are inlined; `paths`/`applyTo`-scoped rules load only when matching files are touched. A repo carrying both `CLAUDE.md` and `AGENTS.md` pays for both here. `copilot instruction list` shows what loads; `--no-custom-instructions` turns loading off; subagents don't get repo instructions unless `include-custom-instructions: true`.
- Official: [optimize your AI usage](https://docs.github.com/en/copilot/tutorials/optimize-ai-usage), [supported models](https://docs.github.com/en/copilot/reference/ai-models/supported-models), [context management](https://docs.github.com/en/copilot/concepts/prompting-and-context/context-management), [CLI command reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference).

### 3.2 Auto model selection = a discount — VERIFIED
"Auto" routes per task to an efficient model, switches only at natural cache boundaries, and gives paid plans a discount on model cost (current rate on the docs page). Auto now has tiers (Efficiency / Balance / Intelligence) on github.com Chat, VS Code, the CLI and the Copilot app.
- Official: [auto model selection](https://docs.github.com/en/copilot/concepts/models/auto-model-selection).

### 3.3 Choose cheaper models / lower reasoning — VERIFIED
Per-token spread across models is large. Reasoning models only for architecture/hard debugging; lighter models for refactors/docs; cheaper models for subagents. Keep reasoning at default (`--effort`/`--reasoning-effort` low…max in the CLI, `reasoningEffort` in agent frontmatter); raise only for hard tasks.
- Official: [optimize AI usage](https://docs.github.com/en/copilot/tutorials/optimize-ai-usage), [models & pricing](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing).

### 3.4 Preserve the cache — VERIFIED
Cached input is heavily discounted. Invalidated by switching model mid-session, or changing "the reasoning effort level, context size, or the set of enabled tools and MCP servers"; caches also expire after inactivity (vendor-dependent). One model per session; start fresh or `/compact` rather than resume an expired session.
- Official: [optimize AI usage](https://docs.github.com/en/copilot/tutorials/optimize-ai-usage).

### 3.5 AI-credit limits (CLI, public preview) — PARTIAL (docs disagree)
`/limits set max-ai-credits N` (interactive) or `--max-ai-credits N` (`copilot -p …`, `/goal`/`/autopilot`) is a soft cap that stops a runaway turn. The CLI command reference describes it as **per response** ("resets for each user message"); the set-session-limit page still describes a budget that "lasts the whole session". State it as a soft cap and don't promise either scope.
- Official: [CLI command reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference), [set session limit](https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/set-session-limit).

### 3.6 Plan → implement with session restarts — VERIFIED
`/plan` (CLI) or Plan mode (VS Code); new session between phases so an expensive reasoning model is used only for planning, cheaper for execution. `/chronicle cost-tips` (CLI) surfaces token-usage reductions to encode into instructions. `/usage` shows per-model token totals with each model's AI-credit consumption.
- Official: [optimize AI usage](https://docs.github.com/en/copilot/tutorials/optimize-ai-usage), [chronicle](https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/chronicle), [CLI command reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference).

### 3.7 Admin cost controls — VERIFIED
- **User-level budgets** = always a **hard stop**. Most-specific wins: individual > cost-center > universal.
- **Cost-center/org/enterprise budgets** activate only after the shared pool is exhausted, and **"Stop usage when budget limit is reached" defaults to OFF** — without it, hitting the limit only notifies while charges keep accruing. Always toggle it on.
- Disable the **"AI credit paid usage"** policy to hard-cap at the pool (blocks all overage regardless of budgets).
- **Models policy** (org Settings → Copilot → Models) restricts costlier models. The **global model policy** (GA Aug 26 2026) has "Default availability for released models" **Enabled by default** — new GA models appear automatically; set it to Disabled to opt in per model.
- **Copilot code review** has effort levels — "Balanced reviews use more AI credits, and may consume marginally more GitHub Actions minutes, than Lite reviews"; the default moved to Balanced on Sep 28 2026. Credits go to the PR author or the requester. It consumes Actions minutes unless on self-hosted runners. Choose Lite for routine PRs and review once, not on every push.
- Official: [budgets for usage-based billing](https://docs.github.com/en/copilot/concepts/billing/budgets-for-usage-based-billing), [manage company spending](https://docs.github.com/en/copilot/how-tos/manage-and-track-spending/manage-company-spending), [manage policies](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-organization/manage-policies), [global model policy GA](https://github.blog/changelog/2026-08-26-global-model-policy-generally-available/), [code review](https://docs.github.com/en/copilot/concepts/agents/code-review), [Aug 28 2026 policy & billing changes](https://github.blog/changelog/2026-08-28-upcoming-changes-to-github-copilot-policies-and-billing/).

### 3.8 Legacy plans (annual holdouts only) — VERIFIED, narrow
Only for users on annual Pro/Pro+ past Jun 1 2026. They **still fall back to an included model** when premium requests run out ("you can still use Copilot with one of the included models for the rest of the month. This is subject to change"), won't get new models and features, and code review carries a large multiplier. Under AI Credits there is **no fallback** — you buy more usage or hit a cap. Any guide relying on flat-per-request costs is stale for everyone else.
- Official: [Copilot requests (legacy)](https://docs.github.com/en/copilot/reference/copilot-billing/request-based-billing-legacy/copilot-requests), [what changed with billing (legacy)](https://docs.github.com/en/copilot/reference/copilot-billing/request-based-billing-legacy/what-changed-with-billing).

### 3.9 Skills and MCP deferral in Copilot — VERIFIED (new)
- **Skills** work in the CLI, VS Code / Visual Studio / JetBrains agent mode, the cloud agent and code review, from `.github/skills`, `.claude/skills`, `.agents/skills`, `~/.copilot/skills`, `~/.agents/skills`. The full `SKILL.md` is injected once chosen by its description; manage with `/skills`, `copilot skill disable NAME`, or `disable-model-invocation`. The docs don't state how descriptions are budgeted.
- **MCP tool search** defers tools by default in the CLI: per-server `deferTools: "auto"` (default) or `"never"` ("keep this server's tools always visible even when tool search is active") — `never` brings back the standing cost.
- VS Code tool caps / virtual-tools thresholds circulate in search summaries only — UNVERIFIED; fetch the VS Code tools page before stating them.
- Official: [about agent skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills), [add skills (CLI)](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills), [CLI command reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference).

---

## 4. Pricing — always read live, never hardcode

This document intentionally stores **no price table**. Model prices, cache multipliers, and credit rates change on every model release; the skill's report derives token savings from the user's own `/context` and should quote dollars only if it reads a current rate from one of these pages at the time it runs:

- Claude: [platform.claude.com/docs/en/about-claude/pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- OpenAI API: [developers.openai.com/api/docs/pricing](https://developers.openai.com/api/docs/pricing); Codex plans & credits: [learn.chatgpt.com/docs/pricing](https://learn.chatgpt.com/docs/pricing)
- GitHub Copilot: [docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing)

Structural facts that are safe to state without a number: output costs more than input; cached reads are much cheaper than uncached (depth varies by model); cache writes carry a premium (except Codex credit billing); cheaper model tiers cost a fraction of frontier tiers, though some charge more past a long-prompt threshold; long-context tiers cost more; batch APIs are discounted vs synchronous. **Token counts are tokenizer-specific** — Claude 4.7+ uses a newer tokenizer that yields more tokens per character, so a `chars / 4` estimate undercounts; prefer `/context` figures.

---

## 5. Myths & corrections (consolidated)

1. **`.claudeignore`** works — false; the docs say it "has no effect". Use `permissions.deny`. [§1.11]
2. **`ENABLE_TOOL_SEARCH` is opt-in / auto-activates past a threshold** — outdated; unset now defers all MCP tools. Only `auto[:N]` uses a threshold. [§1.4]
3. **Effort is low/medium/high/max** — outdated; Claude adds `xhigh` and `auto`; Codex levels are model-dependent (incl. `max`, `ultra`; no `minimal`). [§1.3, §2.1]
4. **`MAX_THINKING_TOKENS` controls depth** — only on Opus 4.6 / Sonnet 4.6 with adaptive thinking disabled; ignored on every current model. [§1.3]
5. **`@path` imports reduce CLAUDE.md cost** — false; they still load in full at launch. [§1.7]
6. **Claude Code reads only `CLAUDE.md`** — false since v2.1.277; it reads `AGENTS.md` natively when no `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` exists in the working directory or above. Any of those shadows `AGENTS.md` unless it imports `@AGENTS.md` (or is a symlink to it), or Project instructions is set to read both. [§1.7]
7. **Agent Teams cost multiplier** stated as a blanket number — the one official figure is scoped to teammates in plan mode. [§1.9]
8. **Editing CLAUDE.md mid-session breaks the cache** — false; it's cache-neutral but the edit doesn't apply until `/clear`/`/compact`/restart. [§0.2]
9. **Hiding Codex reasoning summaries saves money** — false; only lower effort does. [§2.2]
10. **Copilot: bloating context is free** — false since Jun 2026 token metering (true only for legacy annual holdouts), and a long-context tier now costs more. [§3.1]
11. **Copilot falls back to a cheaper model when you run out** — false under AI Credits; still true for legacy annual holdouts. [§3.8]
12. **Fewer context tokens always cost less** — false when it breaks the cache; removing *always-loaded* surfaces is the clean win, not mid-session compression. [§0.3]
13. **Disabling an unused skill frees its description's tokens** — false once the skill listing is saturated: that description is already dropped. The win is reallocated listing budget (better routing). On 1M-window sessions saturation is rarer — check before assuming either way. [§1.8, §2.11]
14. **A multi-harness run is cheap because subscriptions are flat-rate** — false. Copilot has been token-metered since Jun 1 2026, and Anthropic's announced metering of non-interactive Claude routes is only paused. Sell cross-family review, not billing arbitrage. [§0.7]
15. **An empty `~/.claude` means an empty context** — false on the desktop app, where plugins, skills and MCP come from the account per session. [§1.14]
16. **`CLAUDE_CODE_SUBAGENT_MODEL` forces every subagent's model** — false since v2.1.251; it's a default under frontmatter and per-call choices, and doesn't move Explore/Plan. Add `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1`. [§1.2]
17. **Changing `/effort` always breaks the Claude cache** — false on current models with an API key or subscription; still true on Bedrock, Agent Platform and gateways. [§0.2]
18. **Codex profiles live in `[profiles.x]` in `config.toml`** — false since Codex 0.134.0; each profile is `~/.codex/<name>.config.toml`. [§2.4]

## 6. Things we deliberately do NOT hardcode

- Any price, cache multiplier, or credit rate — read live from §4 instead.
- Any "system prompt = X tokens" figure — third-party measurements vary wildly; Anthropic doesn't publish it. Use `/context` on the actual machine.
- Specific MCP overhead numbers on non-Anthropic harnesses — SEO-blog figures, unverified.
- Auto-compact thresholds — read the current model's default from the docs or `/context`; never quote a fixed number.
- Blanket "saves X%" / routing "N% cheaper" claims — third-party estimates; state the mechanism, not the percentage.
- Cache hit-rate percentages — no vendor publishes these as a norm; read the user's own `/usage` cache line instead.
- Model names as recommendations on non-Claude harnesses — lineups retire every few months; point at the models page.

---

## 7. How the skill uses this document

Each `tokenomics` config tip maps to a section here for its rationale + sources:

| Skill tip | Rationale |
|---|---|
| Default model / `opusplan` | §0.5, §1.1 |
| Subagent model → haiku (+ `_FORCE`) | §1.2 |
| Reviewer agents return findings | §0.1 |
| Effort levels | §1.3 |
| Junk reads (`permissions.deny`, not `.claudeignore`) | §1.11 |
| MCP schemas / tool search / `alwaysLoad` | §0.4, §1.4 |
| CLI over MCP | §1.5 |
| Output-filter hook | §1.6 |
| Agent Teams warning | §1.9 |
| Instruction-file size → skills / rules, `@path` caveat | §1.7 |
| Skill/plugin standing cost, `disable-model-invocation`, `skillOverrides` | §1.8 |
| Listing saturation check (1M window) | §1.8 corollary |
| Auto-compact window | §1.12 |
| Auto-memory off | §1.13 |
| Fast mode / background drivers | §1.15 |
| Spend cap (`/usage-credits`) | §1.10 |
| `/usage`, `/skill-doctor` ingestion | §1.10 |
| AGENTS.md/CLAUDE.md audit + cross-harness drift | §1.7, §2.6, §3.1, myth #6 |
| Codex `config.toml` tips (effort, Luna tier, subagent model, skills, Fast mode) | §2.* |
| Copilot billing / Auto / long context / budgets / code review effort | §3.* |
| "Honest savings" framing | §0.2, §0.3, §1.8 corollary |
| Multi-harness framing + terms boundary | §0.7 |
| Harness-delivered inventory (`kind: managed`) | §1.14 |

**When updating:** re-verify any PARTIAL/UNVERIFIED entry against the linked official docs, bump the *Last researched* date, then reflect changes in `SKILL.md` step 4 and `scripts/collect-usage.sh`. Do not add price/number tables — link to the live source (§4) instead.
