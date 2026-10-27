#!/usr/bin/env python3
"""Append private agent events and render an auditable combined activity log."""

from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROLES = ("coordinator", "planner", "implementer", "reviewer", "merger")
EVENTS = (
    "assigned",
    "started",
    "decision",
    "command",
    "files_changed",
    "test",
    "review",
    "handoff",
    "progress",
    "blocked",
    "completed",
    "error",
)
TERMINAL_EVENTS = {"blocked", "completed", "error"}


def clean(value: str | None, limit: int = 2000) -> str | None:
    if value is None:
        return None
    normalized = " ".join(value.replace("\x00", "").split())
    return normalized[:limit] or None


def append_line(path: Path, line: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    flags = os.O_WRONLY | os.O_CREAT | os.O_APPEND
    descriptor = os.open(path, flags, 0o600)
    try:
        os.write(descriptor, line.encode("utf-8"))
    finally:
        os.close(descriptor)


def event_record(args: argparse.Namespace) -> dict[str, Any]:
    record: dict[str, Any] = {
        "schemaVersion": 2,
        "timestamp": datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace(
            "+00:00", "Z"
        ),
        "runId": clean(args.run_id, 200),
        "agentId": clean(args.agent_id, 200),
        "role": args.role,
        "event": args.event,
        "summary": clean(args.summary),
    }
    optional = {
        "issue": clean(args.issue, 500),
        "unit": clean(args.unit, 500),
        "phase": clean(args.phase, 500),
        "harness": clean(args.harness, 200),
        "model": clean(args.model, 300),
        "effort": clean(args.effort, 200),
        "command": clean(args.command),
        "result": clean(args.result),
        "files": clean(args.files),
        "usage": clean(args.usage, 500),
        "nextStep": clean(args.next_step),
        "blocker": clean(args.blocker),
    }
    record.update({key: value for key, value in optional.items() if value is not None})
    return record


def human_line(record: dict[str, Any]) -> str:
    prefix = (
        f"{record['timestamp']} [{record['role']}/{record['agentId']}] "
        f"{record['event'].upper()} — {record['summary']}"
    )
    details = []
    for key in (
        "issue",
        "unit",
        "phase",
        "harness",
        "model",
        "effort",
        "command",
        "result",
        "files",
        "usage",
        "nextStep",
        "blocker",
    ):
        if key in record:
            details.append(f"{key}={record[key]}")
    return prefix + (" | " + " | ".join(details) if details else "") + "\n"


def emit_event(args: argparse.Namespace) -> int:
    record = event_record(args)
    for field in ("runId", "agentId", "summary"):
        if not record[field]:
            raise ValueError(f"{field} must contain visible text")
    if any(field not in record for field in ("harness", "model", "effort")):
        raise ValueError(
            "harness, model, and effort must be recorded together; use unknown or "
            "unsupported when the harness cannot report a selectable value"
        )
    agent_dir = Path(args.agent_dir).expanduser().resolve()
    append_line(
        agent_dir / "events.jsonl",
        json.dumps(record, ensure_ascii=False, separators=(",", ":")) + "\n",
    )
    append_line(agent_dir / "activity.log", human_line(record))
    return 0


def read_events(activity_root: Path) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    paths = sorted(activity_root.glob("*/events.jsonl"))
    if not paths:
        raise ValueError(f"no private event logs found under {activity_root}")
    for path in paths:
        for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            try:
                record = json.loads(line)
            except json.JSONDecodeError as error:
                raise ValueError(f"{path}:{line_number}: invalid JSON: {error}") from error
            required = {
                "schemaVersion",
                "timestamp",
                "runId",
                "agentId",
                "role",
                "event",
                "summary",
            }
            missing = sorted(required - record.keys())
            if missing:
                raise ValueError(f"{path}:{line_number}: missing {', '.join(missing)}")
            if record["schemaVersion"] not in (1, 2):
                raise ValueError(f"{path}:{line_number}: unsupported schemaVersion")
            if record["role"] not in ROLES or record["event"] not in EVENTS:
                raise ValueError(f"{path}:{line_number}: invalid role or event")
            if record["schemaVersion"] == 2 and any(
                field not in record for field in ("harness", "model", "effort")
            ):
                raise ValueError(
                    f"{path}:{line_number}: harness, model, and effort are required"
                )
            events.append(record)
    return events


def audit_events(events: list[dict[str, Any]]) -> None:
    run_ids = {event["runId"] for event in events}
    if len(run_ids) != 1:
        raise ValueError("combined activity contains more than one runId")
    by_agent: dict[str, list[dict[str, Any]]] = {}
    for event in sorted(events, key=lambda item: item["timestamp"]):
        by_agent.setdefault(event["agentId"], []).append(event)
    failures = []
    for agent_id, agent_events in by_agent.items():
        names = [event["event"] for event in agent_events]
        roles = {event["role"] for event in agent_events}
        if len(roles) != 1:
            failures.append(f"{agent_id}: role changed within one private log")
        if "started" not in names:
            failures.append(f"{agent_id}: missing started")
        started_index = names.index("started") if "started" in names else 0
        if any(name != "assigned" for name in names[:started_index]):
            failures.append(f"{agent_id}: non-assignment event before started")
        terminals = [name for name in names if name in TERMINAL_EVENTS]
        if len(terminals) != 1:
            failures.append(f"{agent_id}: expected one terminal event, found {len(terminals)}")
        elif names[-1] not in TERMINAL_EVENTS:
            failures.append(f"{agent_id}: terminal event is not last")
    if failures:
        raise ValueError("; ".join(failures))


def atomic_write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        mode="w", encoding="utf-8", dir=path.parent, delete=False
    ) as handle:
        handle.write(content)
        temporary = Path(handle.name)
    os.chmod(temporary, 0o600)
    os.replace(temporary, path)


def render(args: argparse.Namespace) -> int:
    run_dir = Path(args.run_dir).expanduser().resolve()
    events = read_events(run_dir / "activity")
    audit_events(events)
    events.sort(key=lambda item: (item["timestamp"], item["agentId"]))
    jsonl = "".join(
        json.dumps(event, ensure_ascii=False, separators=(",", ":")) + "\n"
        for event in events
    )
    markdown = ["# Dynamic Implement activity\n\n"]
    for event in events:
        details = []
        for key in (
            "issue",
            "unit",
            "harness",
            "model",
            "effort",
            "result",
            "files",
            "nextStep",
            "blocker",
        ):
            if key in event:
                value = str(event[key]).replace("`", "'")
                details.append(f"{key}: `{value}`")
        suffix = f" ({'; '.join(details)})" if details else ""
        markdown.append(
            f"- `{event['timestamp']}` **{event['role']}/{event['agentId']}** "
            f"`{event['event']}` — {event['summary']}{suffix}\n"
        )
    atomic_write(run_dir / "activity.jsonl", jsonl)
    atomic_write(run_dir / "activity.md", "".join(markdown))
    print(run_dir / "activity.md")
    return 0


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__)
    commands = root.add_subparsers(dest="subcommand", required=True)

    event = commands.add_parser("event", help="append one private agent event")
    event.add_argument("--agent-dir", required=True)
    event.add_argument("--run-id", required=True)
    event.add_argument("--agent-id", required=True)
    event.add_argument("--role", required=True, choices=ROLES)
    event.add_argument("--event", required=True, choices=EVENTS)
    event.add_argument("--summary", required=True)
    event.add_argument("--issue")
    event.add_argument("--unit")
    event.add_argument("--phase")
    event.add_argument("--harness", required=True)
    event.add_argument("--model", required=True)
    event.add_argument("--effort", required=True)
    event.add_argument("--command")
    event.add_argument("--result")
    event.add_argument("--files")
    event.add_argument("--usage")
    event.add_argument("--next-step")
    event.add_argument("--blocker")
    event.set_defaults(handler=emit_event)

    render_command = commands.add_parser("render", help="validate and merge private logs")
    render_command.add_argument("--run-dir", required=True)
    render_command.set_defaults(handler=render)
    return root


def main() -> int:
    args = parser().parse_args()
    try:
        return args.handler(args)
    except (OSError, ValueError) as error:
        print(f"agent_log: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
