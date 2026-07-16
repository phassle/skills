# Tokenomics — rationale & verified sources

The **why** behind every optimization the `tokenomics` skill recommends. This is the skill's reference source: when the skill suggests a config change or scores a removal, the justification and evidence live here.

This is a **living document**. Re-run the research periodically (web claim → official-doc verification) and update the entries and dates below, then adjust `skills/productivity/tokenomics/` to match. The skill should never claim a saving this file cannot back with a source.

### Design rule: no maintained numbers

This document **deliberately hardcodes no prices, token counts, or percentages** — those go stale on every model release and would become a maintenance burden. Instead it states the *mechanism* ("cheaper tiers cost a fraction", "cached reads are heavily discounted", "removing always-loaded surfaces cuts standing context") and **links to the live official page** for the current figure. The concrete savings the skill reports are computed at runtime from the user's own `/context` output — never from a number stored here. Bottom line the skill can always state safely: **removing unused, always-loaded surfaces reduces the tokens carried into every session, which reduces cost.**

- **Last researched:** 2026-07-16
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
- Official (current ratios, read live): [Claude models & pricing](https://platform.claude.com/docs/en/about-claude/models/overview), [OpenAI pricing](https://developers.openai.com/api/docs/pricing).
- Community: [Simon Willison — subagents](https://simonwillison.net/guides/agentic-engineering-patterns/subagents/), [Amnic — input vs output pricing](https://amnic.com/blogs/compare-input-vs-output-token-pricing).

### 0.2 Prompt caching dominates session cost — don't break the cache — VERIFIED
Cached input tokens bill at a steep discount on both vendors. In a coding session the system prompt + tool defs + memory + history are cached and re-read every turn, so cache reads are usually the *majority* of billed cost. The practical lever is **not breaking the cache mid-session**. Cache-write pricing carries a premium, so churn is expensive.
- **Cache invalidators (Claude Code):** switching model (incl. `opusplan` toggling), changing `/effort`, toggling fast mode, connecting/disconnecting a non-deferred MCP server, enabling/disabling a plugin that bundles an MCP server, upgrading Claude Code. Editing `CLAUDE.md` mid-session does **not** break the cache — but the edit also doesn't take effect until `/clear`/`/compact`/restart.
- Official: [Claude prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), [Claude Code prompt caching + invalidators](https://code.claude.com/docs/en/prompt-caching), [OpenAI prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching).

### 0.3 Fewer context tokens ≠ automatically lower cost — PARTIAL (important caveat)
Because cache reads dominate, aggressive context trimming that disrupts a cache-friendly prefix can *raise* billed cost even while the raw token count drops. One empirical study found a change that cut raw tool-output tokens *increased* paired billed cost, and that over-compression corrupted verbatim edit anchors and hurt task success.
- Source: arXiv:2607.12161 (Weinberger & Hozez, 2026-07-13, **not peer-reviewed**) — the mechanism is independently verified in 0.2; treat the study as directional.
- **Implication for the skill:** the defensible win is removing **always-loaded** surfaces (unused plugins/skills/agents/MCP schemas that load every session) — that shrinks the cached prefix once, permanently, without thrashing it. Frame the token counter as "standing context removed per session", not a guaranteed invoice reduction, and avoid selling mid-session compression as a pure saving.

### 0.4 Progressive disclosure / just-in-time loading — VERIFIED
Load a lightweight pointer (name + one-line description) by default; load the full body only when the task triggers it. This is how Agent Skills and MCP tool search both work, and it's the biggest structural lever for standing context.
- Official: [Anthropic — Agent Skills (three-level disclosure)](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills), [Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) ("strive for the minimal set of information that fully outlines expected behavior"; "bloated tool sets" are a top failure mode).

### 0.5 Model tiering — VERIFIED
Route planning/judgment to a frontier model, execution to a cheaper one; cheaper tiers cost a fraction per token. Community routing studies claim large cost cuts (UNVERIFIED figures) — cite the mechanism, not a percentage.
- Official (current per-tier prices, read live): pricing pages in §4.

### 0.6 Batch/async for offline work — VERIFIED
Non-interactive workloads (bulk classification, retro audits) qualify for a substantial discount on both vendors' batch APIs. Not applicable to interactive coding, but relevant if tokenomics ever runs large offline analysis.
- Official: [OpenAI Batch](https://developers.openai.com/api/docs/guides/batch); Anthropic batch processing (platform.claude.com/docs/en/build-with-claude/batch-processing).

---

## 1. Claude Code

### 1.1 Model selection & `opusplan` — VERIFIED
`/model <alias>` (persists), `--model`/`ANTHROPIC_MODEL` (session), or `model` in `settings.json`. Aliases: `sonnet`, `opus`, `haiku`, `fable`, `best`, `opusplan`, `default`. `opusplan` uses Opus in plan mode and auto-switches to Sonnet for execution — big-model reasoning without big-model rates on the token-heavy build phase.
- Official: [model-config](https://code.claude.com/docs/en/model-config). Blanket "Sonnet saves X%" figures are UNVERIFIED (community).

### 1.2 Subagent model — `CLAUDE_CODE_SUBAGENT_MODEL` — VERIFIED
Forces all subagents/team members/workflow agents onto one (cheaper) model, overriding per-invocation params and subagent frontmatter. Resolution: env var → invocation param → frontmatter `model:` → main model. `inherit` disables the override. **Only resolves Claude aliases/IDs** (or provider IDs on Bedrock/Vertex/Foundry) — not third-party models.
- Official: [model-config → environment-variables](https://code.claude.com/docs/en/model-config), [costs → choose the right model](https://code.claude.com/docs/en/costs).

### 1.3 Reasoning effort — VERIFIED
Levels: **low / medium / high / xhigh / max**, via `/effort`, `--effort`, or `CLAUDE_CODE_EFFORT_LEVEL`. Effort governs output length, tool-call verbosity, *and* thinking depth together. `MAX_THINKING_TOKENS` only sets a real budget on **fixed-budget** models (Opus 4.6 / Sonnet 4.6, or after `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING=1`); on adaptive models it's **ignored** (only `=0` disables thinking, and never on Fable 5). `ultracode` is a Claude-Code-only setting = xhigh + autonomous multi-agent orchestration — it *increases* cost, not a saving.
- Official: [effort](https://platform.claude.com/docs/en/build-with-claude/effort), [model-config → adaptive reasoning](https://code.claude.com/docs/en/model-config).

### 1.4 MCP tool search is default-on — VERIFIED (corrects "set ENABLE_TOOL_SEARCH")
Only tool names + server instructions load at session start; full schemas load on demand. `ENABLE_TOOL_SEARCH`: unset = deferred (default), `true` = force (for unsupported proxies), `auto[:N]` = load upfront only if schemas fit within a share of context, `false` = disable. Needs a tool-search-capable model. Per-server `alwaysLoad: true` in `.mcp.json` exempts your most-used tools. Anthropic reports large standing-context reductions and better tool-selection accuracy from deferral.
- Official: [MCP → tool search default-on](https://code.claude.com/docs/en/mcp), [tool-search-tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool), [Anthropic — advanced tool use](https://www.anthropic.com/engineering/advanced-tool-use).
- **Open bug to re-test, don't cite as fact:** an HTTP/Streamable-HTTP MCP gateway was reported (issue #40314) loading full schemas regardless of the setting — auto-closed, never confirmed. UNVERIFIED.

### 1.5 Prefer CLI tools over MCP servers — VERIFIED
A CLI called via Bash adds zero standing schema cost; MCP tool *names* always load even under deferral. Docs specifically name `gh`, `aws`, `gcloud`, `sentry-cli`. Community "N× cheaper" figures are UNVERIFIED.
- Official: [costs → reduce MCP server overhead](https://code.claude.com/docs/en/costs).

### 1.6 Output-filter hooks — VERIFIED
A `PreToolUse` hook rewrites tool input before execution (e.g. appends `| grep ERROR | head -100`) so bloated output is never produced. Official example: grepping a large log cuts context dramatically. `PostToolUse` can swap output *after* the fact via `updatedToolOutput` (reduces context, not the underlying call's cost).
- Official: [costs → offload processing to hooks](https://code.claude.com/docs/en/costs), [hooks](https://code.claude.com/docs/en/hooks).

### 1.7 CLAUDE.md size & migrating to Skills — VERIFIED
`CLAUDE.md` loads **in full, every session** (a user message after the system prompt). Docs recommend keeping it lean (a ~200-line target; `/doctor` now proposes trims). Move specialized/long-tail instructions into **Skills** — a skill loads only its description at start, body on invocation. `@path` imports do **not** reduce cost (imported files still load at launch). Auto memory (`MEMORY.md`) is capped; `CLAUDE.md` is not.
- Official: [memory](https://code.claude.com/docs/en/memory), [costs](https://code.claude.com/docs/en/costs).

### 1.8 Skill / plugin / agent standing cost — VERIFIED
Skill *descriptions* always load (a small share of the context window; overflow drops least-used first); bodies load on invocation. `disable-model-invocation: true` removes a skill's description from context entirely (zero cost until manual invocation). Plugins show an **Always-on vs On-invoke** context estimate before install; a **"not used recently"** detector flags long-unused plugins. Custom subagent descriptions are always-on too. Hooks cost **zero** context unless they emit output. Subagents run in an **isolated** context window (only a summary returns); `context: fork` inherits the parent instead.
- Official: [skills](https://code.claude.com/docs/en/skills), [plugins-reference](https://code.claude.com/docs/en/plugins-reference), [sub-agents](https://code.claude.com/docs/en/sub-agents), [features-overview](https://code.claude.com/docs/en/features-overview).

### 1.9 Agent Teams token multiplier — PARTIAL
`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (env or settings), **disabled by default** (experimental). Each teammate is a full instance with its own context window, so cost is substantially higher — the one exact figure in official docs is scoped to **teammates running in plan mode**; elsewhere docs say cost is "significantly more" / "roughly proportional to team size". Advise Sonnet teammates / small teams if enabled.
- Official: [agent-teams](https://code.claude.com/docs/en/agent-teams), [costs](https://code.claude.com/docs/en/costs).

### 1.10 Introspection & spend-cap commands — VERIFIED
- `/context [all]` — per-category token breakdown (system prompt, MCP tools, memory, skills, agents, messages, free space) + suggestions. **This is the skill's runtime source for actual token figures.**
- `/usage` (alias `/cost`) — on subscriptions, **attributes cost by % to skills, subagents, plugins, and individual MCP servers** (24h/7d toggle). The skill's second data source alongside transcript counts: 0% attribution + 0 invocations = high-confidence removal.
- `/usage-credits` — in-CLI dialog to buy credits, set/change/remove a monthly $ spend limit, auto-reload. Org caps: seat allowance (Teams/Enterprise), Console workspace limits (API), or provider budgets (Bedrock/Vertex/Foundry).
- `/mcp` — per-server connection status + token cost; disable unused. `/doctor` — estimates skill-listing cost + CLAUDE.md trims.
- Official: [costs](https://code.claude.com/docs/en/costs), [commands](https://code.claude.com/docs/en/commands), [context-window](https://code.claude.com/docs/en/context-window).

### 1.11 Junk-read denial — VERIFIED (corrects `.claudeignore`)
`.claudeignore` **does not exist / is not enforced** (recurring hallucination; issues #56997, #36163 report it silently ignored). Use enforced `permissions.deny` Read rules in `settings.json`: `"Read(./.env)"`, `"Read(./node_modules/**)"`, `"Read(./**/*.lock)"`, `"Read(./**/*.pem)"`, etc.
- Official: [permissions](https://code.claude.com/docs/en/permissions).

### 1.12 Context lifecycle — VERIFIED (mechanism)
`/compact [focus on X]` summarizes (still costs a model call); `/clear` wipes (cheapest, loses history); subagent delegation keeps big one-off reads out of the main window; large-context models can replace compaction. Exact standard-window auto-compact buffer numbers circulating in blogs are **UNVERIFIED**; treat the tunable (`CLAUDE_CODE_AUTO_COMPACT_WINDOW`) as the lever, not any hardcoded threshold.
- Official: [context-window](https://code.claude.com/docs/en/context-window), [how-claude-code-works](https://code.claude.com/docs/en/how-claude-code-works).

---

## 2. OpenAI Codex CLI

Config lives in `~/.codex/config.toml`. Reasoning tokens bill at the **output** rate.

### 2.1 Lower `model_reasoning_effort` — VERIFIED
Values: `minimal | low | medium | high | xhigh` (Codex default `medium`). Fewer reasoning tokens on lower effort = direct output-token savings.
- Official: [config reference](https://learn.chatgpt.com/docs/config-file/config-reference), [reasoning guide](https://developers.openai.com/api/docs/guides/reasoning).

### 2.2 Hiding reasoning summaries does NOT save money — VERIFIED (myth)
`model_reasoning_summary = "none"` / `hide_agent_reasoning = true` change only what's *displayed*; reasoning tokens are still generated and billed. Lower `model_reasoning_effort` is the real lever.
- Official: [reasoning guide](https://developers.openai.com/api/docs/guides/reasoning) ("reasoning tokens … are billed as output tokens").

### 2.3 Lower `model_verbosity` — VERIFIED
`low | medium | high` (Responses-API models); shortens final output.
- Official: [advanced config](https://learn.chatgpt.com/docs/config-file/config-advanced).

### 2.4 Cheaper model tier — VERIFIED
`model = "gpt-5.1-codex-mini"` (or `-m` flag; use `profiles` per task). Mini tiers cost a fraction of full-size per token.
- Official: [Codex models](https://developers.openai.com/api/docs/models), [pricing](https://developers.openai.com/api/docs/pricing).

### 2.5 Prompt caching (automatic) — VERIFIED
An exact-match prompt prefix caches automatically at a heavy discount; Codex's append-only loop is designed to keep the prior prompt a prefix of the next. Keep AGENTS.md/system stable; don't edit early messages. On the newest model family, cache *writes* carry a premium — a low-reuse prefix can cost more. Community hit-rate claims are UNVERIFIED.
- Official: [prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching), [pricing](https://developers.openai.com/api/docs/pricing).

### 2.6 AGENTS.md hygiene / `project_doc_max_bytes` — VERIFIED
Codex concatenates AGENTS.md from repo root down to cwd into the system prompt **every run** (no persistent cache of it). `project_doc_max_bytes` caps it; content past the cap is **silently dropped**. A bloated file taxes every session.
- Official: [AGENTS.md custom instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

### 2.7 Trim MCP tool exposure — PARTIAL
`enabled_tools` (allow-list) / `disabled_tools` (deny-list) / timeouts under `[mcp_servers.<name>]` are confirmed config keys. That tool schemas consume per-turn context is a general truth, but OpenAI's docs **don't quantify** it — community figures are UNVERIFIED SEO-blog numbers; directionally plausible only.
- Official: [MCP config](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) (confirms keys, not token cost).

### 2.8 Context management & ephemeral history — VERIFIED (keys) / PARTIAL (defaults)
`model_auto_compact_token_limit`, `model_context_window`, `tool_output_token_limit` cap growth; official docs confirm the keys but **not** the numeric defaults (community threshold numbers are UNVERIFIED). `[history] persistence = "none"` or `--ephemeral` (for `codex exec`) skip session rollout writes.
- Official: [config reference](https://learn.chatgpt.com/docs/config-file/config-reference), [advanced config](https://learn.chatgpt.com/docs/config-file/config-advanced), [non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode).

### 2.9 Local OSS models — VERIFIED
`--oss` / `--local-provider ollama|lmstudio` / `oss_provider` route to a local OpenAI-compatible endpoint — no per-token API charge.
- Official: [developer commands](https://learn.chatgpt.com/docs/developer-commands?surface=cli).

### 2.10 Billing path: ChatGPT plan vs API key — VERIFIED
API-key sign-in bills pay-as-you-go per token (no cap); ChatGPT-plan sign-in draws plan credits on a rolling usage window and has since moved to token-based credit billing (formula matches API rates; cached tokens keep the discount). Pick the path that matches usage: subscription for steady daily use, API key for bursty/CI (but it has no cap).
- Official: [ChatGPT pricing](https://learn.chatgpt.com/docs/pricing).

---

## 3. GitHub Copilot

### 3.0 Current billing model — VERIFIED
**Usage-based billing in "GitHub AI Credits", effective June 1, 2026** (announced Apr 27, 2026), replacing premium-request-units + per-model multipliers. Cost = tokens (input + output + cached) × per-model rate. **Code completions & Next Edit Suggestions remain unmetered** on paid plans. The old PRU/multiplier system is labeled "(legacy)" and applies only to holdouts on **annual** Pro/Pro+ plans until their term expires.
- Official: [Copilot → usage-based billing (blog)](https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/), [Jun 1 2026 changelog](https://github.blog/changelog/2026-06-01-updates-to-github-copilot-billing-and-plans/), [usage-based billing for individuals](https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-individuals).

### 3.1 Context size now drives cost — VERIFIED (reverses old advice)
Under PRU billing, context size was free (flat per request). Under token metering it **directly drives cost**. The classic Copilot advice "bloating context is free" is now **false** except for legacy annual holdouts. Keep context lean: new session per task (`/new`, `/clear`), `/compact [focus on X]`, `/context` to inspect, a lean `.github/copilot-instructions.md`/`AGENTS.md`, and enable only needed MCP toolsets.
- Official: [Optimize your AI usage](https://docs.github.com/en/copilot/tutorials/optimize-ai-usage) §3.

### 3.2 Auto model selection = a discount — VERIFIED
"Auto" routes per task to an efficient model, switches only at cache boundaries, and gives paid plans a discount on model cost (current rate on the docs page).
- Official: [auto model selection](https://docs.github.com/en/copilot/concepts/models/auto-model-selection).

### 3.3 Choose cheaper models / lower reasoning — VERIFIED
Per-token spread across models is large. Reasoning models only for architecture/hard debugging; lighter models for refactors/docs; cheaper models for subagents. Keep reasoning level at default; raise only for hard tasks.
- Official: [optimize AI usage](https://docs.github.com/en/copilot/tutorials/optimize-ai-usage) §1, [models & pricing](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing).

### 3.4 Preserve the cache — VERIFIED
Cached input is heavily discounted. Invalidated by switching model mid-session, changing reasoning/context/tools mid-session, or resuming a stale session. One model per session; start fresh or `/compact` rather than resume expired.
- Official: [optimize AI usage](https://docs.github.com/en/copilot/tutorials/optimize-ai-usage) §4.

### 3.5 AI-credit session limit (CLI, public preview) — VERIFIED
`/limits set max-ai-credits N` (interactive) or `--max-ai-credits N` (`copilot -p …`). Soft cap that stops a runaway session.
- Official: [set session limit](https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/set-session-limit).

### 3.6 Plan → implement with session restarts — VERIFIED
`/plan` (CLI) or Plan mode (VS Code); new session between phases so an expensive reasoning model is used only for planning, cheaper for execution. `/chronicle cost-tips` (CLI) surfaces token-usage reductions to encode into instructions.
- Official: [optimize AI usage](https://docs.github.com/en/copilot/tutorials/optimize-ai-usage) §§6–7.

### 3.7 Admin cost controls — VERIFIED
- **User-level budgets** = always a **hard stop** (active in both included-pool and metered phases). Most-specific wins: individual > cost-center > universal.
- **Cost-center/org/enterprise budgets** activate only after the shared pool is exhausted, and **"Stop usage when budget limit is reached" defaults to OFF** — without it, hitting the limit only notifies while charges keep accruing. Always toggle it on.
- Disable the **"AI credit paid usage"** policy to hard-cap at the pool (blocks all overage regardless of budgets).
- **Models policy** (org Settings → Copilot → Models) restricts costlier models org-wide. **Cost centers** attribute/size spend per department.
- Note: Copilot code review also consumes Actions minutes — set a default runner.
- Official: [budgets for usage-based billing](https://docs.github.com/en/copilot/concepts/billing/budgets-for-usage-based-billing), [manage company spending](https://docs.github.com/en/copilot/how-tos/manage-and-track-spending/manage-company-spending), [manage policies](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-organization/manage-policies).

### 3.8 Legacy multipliers (annual holdouts only) — VERIFIED, narrow
Only for users on annual Pro/Pro+ past Jun 1 2026. Automatic fallback-to-cheaper-model when premium requests run out is **discontinued**. Any guide relying on flat-per-request costs or model fallback is stale.
- Official: [what changed with billing (legacy)](https://docs.github.com/en/copilot/reference/copilot-billing/request-based-billing-legacy/what-changed-with-billing).

---

## 4. Pricing — always read live, never hardcode

This document intentionally stores **no price table**. Model prices, cache multipliers, and credit rates change on every model release; the skill's report derives token savings from the user's own `/context` and should quote dollars only if it reads a current rate from one of these pages at the time it runs:

- Claude: [platform.claude.com/docs/en/about-claude/models/overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- OpenAI / Codex: [developers.openai.com/api/docs/pricing](https://developers.openai.com/api/docs/pricing)
- GitHub Copilot: [docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing)

Structural facts that are safe to state without a number: output costs more than input; cached reads are much cheaper than uncached; cache writes carry a premium; cheaper model tiers cost a fraction of frontier tiers; batch APIs are discounted vs synchronous.

---

## 5. Myths & corrections (consolidated)

1. **`.claudeignore`** does not exist / is not enforced (Claude Code). Use `permissions.deny`. [§1.11]
2. **`ENABLE_TOOL_SEARCH` is opt-in** — outdated; tool search is default-on. [§1.4]
3. **Effort is low/medium/high/max** — outdated; now includes `xhigh` (+ Claude-Code `ultracode`). [§1.3]
4. **`MAX_THINKING_TOKENS` controls depth** — only on fixed-budget models; ignored on adaptive. [§1.3]
5. **`@path` imports reduce CLAUDE.md cost** — false; they still load in full at launch. [§1.7]
6. **Claude Code reads `AGENTS.md`** — false; it reads `CLAUDE.md` only. Cross-harness repos need a `CLAUDE.md` symlink or `@AGENTS.md` import, else Claude Code loads nothing. [see AGENTS.md audit tip]
7. **Agent Teams cost multiplier** stated as a blanket number — the one official figure is scoped to teammates in plan mode. [§1.9]
8. **Editing CLAUDE.md mid-session breaks the cache** — false; it's cache-neutral but the edit doesn't apply until `/clear`/`/compact`/restart. [§0.2]
9. **Hiding Codex reasoning summaries saves money** — false; only lower effort does. [§2.2]
10. **Copilot: bloating context is free** — false since Jun 2026 token metering (true only for legacy annual holdouts). [§3.1]
11. **Copilot falls back to a cheaper model when premium requests run out** — discontinued. [§3.8]
12. **Fewer context tokens always cost less** — false when it breaks the cache; removing *always-loaded* surfaces is the clean win, not mid-session compression. [§0.3]

## 6. Things we deliberately do NOT hardcode

- Any price, cache multiplier, or credit rate — read live from §4 instead.
- Any "system prompt = X tokens" figure — third-party measurements vary wildly; Anthropic doesn't publish it. Use `/context` on the actual machine.
- Specific MCP overhead numbers on non-Anthropic harnesses — SEO-blog figures, unverified.
- Standard-window auto-compact buffer numbers — community reverse-engineering only.
- Blanket "saves X%" / routing "N% cheaper" claims — third-party estimates; state the mechanism, not the percentage.
- Cache hit-rate percentages — no vendor publishes these; they depend on session structure.

---

## 7. How the skill uses this document

Each `tokenomics` config tip maps to a section here for its rationale + sources:

| Skill tip | Rationale |
|---|---|
| Default model / `opusplan` | §0.5, §1.1 |
| Subagent model → haiku | §1.2 |
| Reviewer agents return findings | §0.1 |
| Effort levels | §1.3 |
| Junk reads (`permissions.deny`, not `.claudeignore`) | §1.11 |
| MCP schemas / tool search / `alwaysLoad` | §0.4, §1.4 |
| CLI over MCP | §1.5 |
| Output-filter hook | §1.6 |
| Agent Teams warning | §1.9 |
| CLAUDE.md size → skills, `@path` caveat | §1.7 |
| Skill/plugin standing cost, `disable-model-invocation` | §1.8 |
| Spend cap (`/usage-credits`) | §1.10 |
| `/usage` attribution ingestion | §1.10 |
| AGENTS.md/CLAUDE.md audit + cross-harness drift | §2.6, myths #6 |
| Codex `config.toml` tips | §2.* |
| Copilot billing / Auto / budgets | §3.* |
| "Honest savings" framing | §0.2, §0.3 |

**When updating:** re-verify any PARTIAL/UNVERIFIED entry against the linked official docs, bump the *Last researched* date, then reflect changes in `SKILL.md` step 4 and `scripts/collect-usage.sh`. Do not add price/number tables — link to the live source (§4) instead.
