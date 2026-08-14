#!/usr/bin/env bash
# tokenomics: collect Claude Code usage stats from all project transcripts.
# Usage: collect-usage.sh [projects-dir]   (default: ~/.claude/projects)
#
# Read-only by design. This script never writes, deletes, or sends anything —
# no network calls, no mutations, output goes to stdout only.
#
# Reads:
#   ~/.claude/projects/**/*.jsonl              transcripts (counts of skill/agent/MCP/slash use)
#   ~/.claude/settings.json                    enabledPlugins, marketplaces, hook event names, one env flag
#   ~/.claude.json                             MCP servers — type/url/command only (never env or headers)
#   ~/.claude/plugins/installed_plugins.json   installed plugin versions and scope
#   ~/.claude/{agents,commands,hooks}          directory listings only, no file contents
#   ~/.claude/skills/**/SKILL.md               path, description LENGTH, and whether
#                                              disable-model-invocation is set — no text
#   ~/.claude/CLAUDE.md, ./CLAUDE.md, ./AGENTS.md   line counts only, no contents
#
# Everything it prints is a name, a count, or a line count. It reads no message
# bodies, no secrets, and no credential files.
set -euo pipefail
DIR="${1:-$HOME/.claude/projects}"
ORIG_PWD="$PWD"   # user's project dir, before we cd into the transcripts dir
cd "$DIR"

echo "== Sessions per project =="
for d in */; do
  n=$(ls "$d"*.jsonl 2>/dev/null | wc -l | tr -d ' ')
  [ "$n" -gt 0 ] && echo "$n  $d"
done | sort -rn | head -30 || true

echo; echo "== Skill invocations (all projects, all-time) =="
grep -rh '"name":"Skill"' --include='*.jsonl' . 2>/dev/null \
  | grep -o '"skill":"[^"]*"' | sed 's/"skill":"//; s/"$//' | sort | uniq -c | sort -rn || true

echo; echo "== Agent invocations =="
grep -rh '"subagent_type":"' --include='*.jsonl' . 2>/dev/null \
  | grep -o '"subagent_type":"[^"]*"' | sed 's/"subagent_type":"//; s/"$//' | sort | uniq -c | sort -rn || true

echo; echo "== Slash commands typed =="
grep -rho '<command-name>/[^<]*</command-name>' --include='*.jsonl' . 2>/dev/null \
  | sed 's/<[^>]*>//g' | sort | uniq -c | sort -rn | head -40 || true

echo; echo "== MCP tool calls (by server) =="
grep -rho '"name":"mcp__[a-zA-Z0-9_-]*__' --include='*.jsonl' . 2>/dev/null \
  | sed 's/"name":"mcp__//; s/__$//' | sort | uniq -c | sort -rn || true

echo; echo "== Enabled plugins (~/.claude/settings.json) =="
python3 -c "import json,os;print(json.dumps(json.load(open(os.path.expanduser('~/.claude/settings.json'))).get('enabledPlugins',{}),indent=1))" 2>/dev/null || echo "(could not read)"

echo; echo "== User skills (~/.claude/skills) =="
# Columns: <description chars>  <path relative to ~/.claude/skills>  [disable-model-invocation]
# find, not ls: skills are not always one level deep — claude.ai skill sync nests them
# under synced/, so a plain listing sees the wrapper dir and misses every skill inside it.
# Paths are the row keys downstream; never treat a parent dir as a skill.
if [ -d "$HOME/.claude/skills" ]; then
  find -L "$HOME/.claude/skills" -maxdepth 3 -name SKILL.md 2>/dev/null | sort | while read -r f; do
    rel=$(dirname "$f"); rel="${rel#"$HOME"/.claude/skills/}"
    # first line of the description only (folded YAML continuations are not counted) — chars ≈ 4× tokens
    n=$(awk '/^description:/{sub(/^description:[[:space:]]*/,"");print length($0);f=1;exit} END{if(!f)print 0}' "$f")
    dmi=""; grep -qE '^disable-model-invocation:[[:space:]]*true' "$f" && dmi="  [disable-model-invocation]"
    echo "$n  $rel$dmi"
  done
  [ -z "$(find -L "$HOME/.claude/skills" -maxdepth 3 -name SKILL.md 2>/dev/null)" ] && echo "(none)" || true
else
  echo "(none)"
fi

echo; echo "== Global inventory =="
echo "-- user agents (~/.claude/agents):"; ls -1 "$HOME/.claude/agents" 2>/dev/null || echo "(none)"
echo "-- user commands (~/.claude/commands):"; ls -1 "$HOME/.claude/commands" 2>/dev/null || echo "(none)"
echo "-- hook scripts (~/.claude/hooks):"; ls -1 "$HOME/.claude/hooks" 2>/dev/null || echo "(none)"
echo "-- global MCP servers (~/.claude.json):"
python3 -c "import json,os;d=json.load(open(os.path.expanduser('~/.claude.json')));print(json.dumps({k:{kk:vv for kk,vv in v.items() if kk in('type','url','command')} for k,v in d.get('mcpServers',{}).items()},indent=1))" 2>/dev/null || echo "(none)"
echo "-- installed plugins (version | scope):"
python3 -c "
import json,os
d=json.load(open(os.path.expanduser('~/.claude/plugins/installed_plugins.json')))
for k,v in d.get('plugins',{}).items():
    for i in v: print(f\"{k} | {i.get('version')} | {i.get('scope')} | {i.get('projectPath','')}\")" 2>/dev/null || echo "(none)"
echo "-- marketplaces:"
python3 -c "import json,os;d=json.load(open(os.path.expanduser('~/.claude/settings.json')));print('\n'.join(d.get('extraKnownMarketplaces',{}).keys()))" 2>/dev/null || echo "(none)"
echo "-- global hooks (settings.json events):"
python3 -c "import json,os;d=json.load(open(os.path.expanduser('~/.claude/settings.json')));print('\n'.join(d.get('hooks',{}).keys()))" 2>/dev/null || echo "(none)"

echo; echo "== Inventory source check =="
# An empty on-disk profile is not the same as an empty session. Desktop/cowork harnesses deliver
# plugins, skills and MCP servers per session; auditing only ~/.claude there reports "nothing
# installed" about a large standing surface. Tell the caller to enumerate in-session (SKILL.md 1b).
disk=0
python3 -c "import json,os;d=json.load(open(os.path.expanduser('~/.claude/settings.json')));exit(0 if d.get('enabledPlugins') else 1)" 2>/dev/null && disk=$((disk+1))
python3 -c "import json,os;d=json.load(open(os.path.expanduser('~/.claude.json')));exit(0 if d.get('mcpServers') else 1)" 2>/dev/null && disk=$((disk+1))
[ -n "$(find -L "$HOME/.claude/skills" -maxdepth 3 -name SKILL.md 2>/dev/null)" ] && disk=$((disk+1))
if [ "$disk" -le 1 ]; then
  echo "on-disk profile is nearly empty (enabledPlugins / mcpServers / user skills: $disk of 3 populated)."
  echo "If this session lists more skills, agents or MCP servers than appear above, they are harness-delivered:"
  echo "enumerate them in-session (ListSkills/ListPlugins or the session's own listing) and audit those as kind=managed."
else
  echo "on-disk profile populated ($disk of 3) — still cross-check against what the session lists."
fi

echo; echo "== Config hygiene (token-tip signals) =="
echo "-- global CLAUDE.md lines:"; awk 'END{print NR}' "$HOME/.claude/CLAUDE.md" 2>/dev/null || echo "(none)"
# Marks files that are the same inode (the recommended CLAUDE.md -> AGENTS.md symlink) so the
# lines are counted once, not once per name — the file loads once per turn however many names it has.
echo "-- context files in project ($ORIG_PWD)  [lines  path  (same-file marker)]:"
seen=""
for f in CLAUDE.md AGENTS.md .claude/CLAUDE.md; do
  [ -f "$ORIG_PWD/$f" ] || continue
  ino=$(ls -Li "$ORIG_PWD/$f" 2>/dev/null | awk '{print $1}')
  case " $seen " in *" $ino "*) dup="  (same file as an entry above — count its lines once)";; *) dup=""; seen="$seen $ino";; esac
  echo "$(awk 'END{print NR}' "$ORIG_PWD/$f")  $f$dup"
done || true
echo "-- AGENTS.md present but no CLAUDE.md / .claude/CLAUDE.md (Claude Code won't load it):"
if [ -f "$ORIG_PWD/AGENTS.md" ] && [ ! -e "$ORIG_PWD/CLAUDE.md" ] && [ ! -e "$ORIG_PWD/.claude/CLAUDE.md" ]; then echo "YES — drift risk (add symlink or thin CLAUDE.md importing @AGENTS.md)"; else echo "no"; fi
echo "-- Agent Teams flag (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS; each teammate is a full instance, so substantially more tokens):"
if [ -n "${CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS:-}" ]; then echo "$CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS (from environment)"; else python3 -c "import json,os;print(json.load(open(os.path.expanduser('~/.claude/settings.json'))).get('env',{}).get('CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS','unset'))" 2>/dev/null || echo "unset"; fi
echo "-- CLIs present (prefer over MCP servers):"
for c in gh aws gcloud sentry-cli; do command -v "$c" >/dev/null 2>&1 && echo "$c: yes" || echo "$c: no"; done
