# Platform adapters

## Contents

- Explicit root entry
- Skill invocation
- Persistent goal
- Subagents and isolation
- Discovery and distribution paths
- Issue and Git providers

Keep the workflow semantic and discover capabilities at runtime. Do not hard-code one vendor's subagent tool names into worker prompts.

## Explicit root entry

The accepted root entries are:

| Host | Accepted root entry |
| --- | --- |
| Codex CLI/IDE/app | `$dynamic-implement [issue-or-smoke-flag]`, or select `dynamic-implement` through `/skills`. |
| Claude Code | `/dynamic-implement [issue-or-smoke-flag]` |
| GitHub Copilot CLI/app | `/dynamic-implement [issue-or-smoke-flag]` |
| OpenCode | `/dynamic-implement [issue-or-smoke-flag]` through the installed custom-command adapter. |
| Pi | `/skill:dynamic-implement [issue-or-smoke-flag]` |

Codex retains the `$skill` mention or explicit selector metadata. Claude Code, GitHub Copilot, and Pi retain their direct command invocation. The OpenCode adapter expands to a prompt containing the exact line `DYNAMIC_IMPLEMENT_SLASH_ENTRY=1`. A host that strips its explicit invocation evidence is unverified for root entry and setup reports that blocker.

When the user supplies an explicit `SKILL.md` link/path, resolve and read it before consulting a cached catalog. Search the host's configured personal and repository skill roots and refresh discovery once before reporting absence. The explicit file link is valid selection evidence when its frontmatter names `dynamic-implement`; do not fall back to an improvised issue workflow.

An empty argument list is valid explicit entry. It runs the read-only Wayfinder-based orientation contract and stops; it does not start setup or implementation. The user must invoke the command again with the selected issue to enter an implementation run.

This restriction applies only to admission into the root orchestration run. After admission, invoke required companion and engineering skills with their normal host-native mechanisms.

Capability setup is a separate manual action and is never auto-invoked by Dynamic Implement. When the profile is absent, stale, or lacks a verified effort ladder, stop and return the matching command:

| Host | Manual setup entry |
| --- | --- |
| Codex CLI/IDE/app | `$dynamic-skills-setup`, or select `dynamic-skills-setup` through `/skills`. |
| Claude Code | `/dynamic-skills-setup` |
| GitHub Copilot CLI/app | `/dynamic-skills-setup` |
| OpenCode | `/dynamic-skills-setup` through the installed custom-command adapter. |
| Pi | `/skill:dynamic-skills-setup` |

Setup must finish and persist a current profile before the user invokes Dynamic Implement again. Do not combine setup and implementation in one automatic continuation.

Install the OpenCode adapter at `~/.config/opencode/commands/dynamic-implement.md`. Codex, Claude Code, GitHub Copilot, and Pi use their direct skill mechanisms and need no wrapper.

## Skill invocation

Use the skill mechanism native to the active host:

- Codex: invoke downstream named skills with `$skill-name` when that syntax is available.
- Claude Code: invoke named skills with `/skill-name`.
- GitHub Copilot CLI/app: invoke named skills with `/skill-name` or explicitly instruct Copilot to use the named skill.
- OpenCode: instruct the agent to load the named skill through its native `skill` tool.
- Pi: invoke an installed downstream skill with `/skill:skill-name`, or pass its directory/file with `--skill` for a standalone process.

Always read the installed skill file completely before acting. A subagent does not necessarily inherit the coordinator's loaded skills; explicitly tell every worker which skills to load.

## Persistent goal

Implement `goal-contract.md` on every host. The root issue and its child/dependency graph are the shared goal backlog; always create the technical ledger record. Native UI is a mirror, never the only state.

- Codex: create and reconcile one native Goal for the whole issue plus the ledger. Use automatic goal continuations while safe work remains. Do not create per-wave goals.
- Claude Code: use `TaskCreate`, `TaskUpdate`, `TaskGet`, and `TaskList` for the root plan. Tasks survive context compaction. When starting the coordinator CLI, set a deterministic `CLAUDE_CODE_TASK_LIST_ID=<repo>-<issue>` so the list is shared across sessions in `~/.claude/tasks/`; if the current session was not started that way, the ledger remains the cross-session source. Claude has no documented Goal-style automatic continuation, so execute all safe steps in the current run and resume from the named list plus ledger.
- GitHub Copilot: use autopilot for continuation until completion or a real blocker. `/tasks` represents running subagents and shell jobs rather than a durable root-plan store, so keep the root goal in the ledger. `/fleet` may execute independent units, but fleet workers do not own or complete the root goal.
- OpenCode: mirror the current plan into its session-persisted `todowrite` and delegate through native `task` subagents. It has no documented automatic continuation; resume the coordinator session when appropriate or reconstruct from the ledger in a new run.
- Pi: the base CLI has no built-in root task list or subagent tool. Use the ledger plus coordinator loop. When a trusted task/subagent extension is installed, it may mirror progress and launch isolated Pi processes; review subprocesses never own the root goal.

If a host cannot auto-continue, perform all safe ready steps in the current orchestration run. On re-entry, re-fetch the same issue graph and ledger rather than creating a new plan or declaring completion. Mark the goal complete only under `goal-contract.md`.

## Subagents and isolation

Use the host's general-purpose/task subagent primitive and request a fresh context. Use repository worktrees for filesystem isolation; conversational isolation alone is insufficient for parallel writers.

For acceptance review, "fresh" means zero conversation history. Start a new top-level harness process/session with persistence and memory disabled when supported. Never use a native subagent, resume, continue, compact, summarize, or fork the planner/implementer/merger session as the review coordinator. Matt's clean review coordinator then creates its required Standards and Spec child agents. Repository instructions and the minimal review packet may be loaded fresh; prior agent reasoning may not.

Every launch runs on the machine's existing harness authentication — a subscription login is a first-class route, and no step may require an API key where the verified route runs without one. A launch flag can change the permitted authentication sources, so only the exact live-verified launch mode counts as a route.

Preserve these launch semantics, adapting flags to the installed version:

- Codex: start a new `codex exec --ephemeral --ignore-user-config`/review process with an explicit verified model, never resume a session or attach the root Goal transcript. Restrict repository mutation and put any build artifacts in an isolated temp/output directory.
- Claude Code: start a new `claude --print --bare --no-session-persistence` process, never continue/resume/fork, and do not attach the coordinator's `CLAUDE_CODE_TASK_LIST_ID`. Because bare mode changes permitted authentication sources, setup must live-verify this exact route; otherwise Claude is not an eligible blind reviewer.
- GitHub Copilot: start a new prompt session without continue/resume/connect, keep memory disabled, and expose only skill, read/search, and approved verification commands.
- OpenCode: start `opencode run` without continue/session/fork, with an explicit verified model and `edit` denied. Do not attach the coordinator session.
- Pi: start `pi --print --no-session --no-extensions --no-skills` with an explicit verified model and exact Matt skill paths. If Matt's axes need Pi's optional subagent facility, explicitly load only a trusted, verified isolated-subagent extension; never enable extension discovery broadly. Use read/search/approved verification tools only.

Discover the current concurrency limit before scheduling a wave. Count the coordinator, implementers, and review subagents. If the host cannot provide the fresh contexts required by the plan, reduce concurrency. If one unit is still too large for the available context and no delegation mechanism exists, pause and report the capability blocker.

On Codex, treat a `pending_init` agent that survives interruption as a stale capacity slot. Stop assigning native children to that slot. For Matt review, launch the two ephemeral leaf processes in `review-contract.md` concurrently with explicit verified models, empty contexts, unchanged axis briefs, private logs, and repository-mutation checks. For implementation, use an explicit ephemeral process only when it can receive the same worktree, skill, logging, model, and commit contract; record the adapter route and reported usage.

Do not assume subagents inherit skills, tools, authentication, cwd, or uncommitted state. Pass the worktree path, branch, issue reference, skill names, and evidence contract explicitly.

## Discovery and distribution paths

The portable core is the directory containing this `SKILL.md` and `references/`:

- Codex personal install: `~/.codex/skills/dynamic-implement/`.
- Claude Code personal install: `~/.claude/skills/dynamic-implement/`.
- GitHub Copilot personal install: `~/.copilot/skills/dynamic-implement/` or `~/.agents/skills/dynamic-implement/`.
- OpenCode personal install: `~/.config/opencode/skills/dynamic-implement/`, `~/.claude/skills/dynamic-implement/`, or `~/.agents/skills/dynamic-implement/`.
- Pi personal install: `~/.pi/agent/skills/dynamic-implement/` or `~/.agents/skills/dynamic-implement/`.
- Repository install: use the host-supported `.agents/skills/`, `.claude/skills/`, or `.github/skills/` location.
- Plugin install: package the same portable directory as `skills/dynamic-implement/` and keep vendor manifests outside it.

`agents/openai.yaml` is optional Codex UI metadata. Claude Code, GitHub Copilot, OpenCode, and Pi may ignore it; workflow behaviour must live in `SKILL.md` and portable references.

OpenCode discovers Agent Skills from global and project `.agents/skills` paths and has native task subagents. Pi also discovers `.agents/skills` and can explicitly load a skill, but its base CLI may lack the subagent facility Matt's `code-review` requires. Let setup prove that facility; do not emulate the two-axis skill when it is absent.

Install the companion `dynamic-skills-setup` directory through the same personal/repository/plugin mechanisms. Its shared capability profile lives outside vendor-specific skill directories at `~/.agents/dynamic-skills/capabilities.json` unless overridden by `DYNAMIC_SKILLS_PROFILE`.

## Issue and Git providers

Follow the repository's configured tracker and Git workflow. For GitHub Issues, prefer authenticated GitHub tools supplied by the host or the `gh` CLI according to project instructions. Do not require a GitHub-specific connector when the repository uses another tracker.

For a ready GitHub PR targeting `develop` or `main`, offer to request GitHub Copilot review when supported. From Claude Code, offer a fresh Codex review using the verified isolated adapter route. These are optional advisory machine reviews and require human agreement to request; neither may approve or authorize merge. Every host stops at the same post-evidence human merge gate for PRs into `develop` or `main`; internal worker merges into a feature/integration branch continue autonomously.
