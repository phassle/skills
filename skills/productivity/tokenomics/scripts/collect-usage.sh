#!/usr/bin/env bash
# tokenomics: collect Claude Code usage stats from all project transcripts.
# Usage: collect-usage.sh [projects-dir]   (default: ~/.claude/projects)
set -euo pipefail
DIR="${1:-$HOME/.claude/projects}"
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
ls -1 "$HOME/.claude/skills" 2>/dev/null || echo "(none)"

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
