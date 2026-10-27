# Concurrency: three mechanisms, three questions

Two Dynamic Implement runs can start on one issue minutes apart, on different harnesses, and neither will see the other unless the run makes itself visible. Three mechanisms answer three different questions, and a complete run wants all three:

- the **run token** keeps two runs' *evidence* apart;
- the **claim comment** stops a second run from starting, and names who holds the work;
- the **local lock** catches a same-host collision in milliseconds.

A token alone still lets both coordinators build the same issue, open competing branches and race the same worktrees — tidily logged in separate directories.

## The tracker is the medium, not the lock

The tracker is the one place both coordinators already read, so a claim written there works across harnesses, machines, containers and users, and the human can see the collision too. A filesystem lock cannot: two runs on different hosts, or in separate sandboxes, never contend for it.

But the tracker cannot *arbitrate*. Both runs authenticate as the same user, so a binary claim like an assignee cannot distinguish "someone else took this" from "I took this" — the second coordinator reads the first one's assignee as its own claim and proceeds.

**Observed 2026-08-05:** a Codex Desktop run and a Claude Code run started on the same issue two minutes apart, both claimed correctly, and neither could see the other.

That is why the claim is written as **content**, which carries identity, rather than as state:

```text
dynamic-implement: run claimed
harness: <harness>   session: <session id>   run token: <token>
issue: <root>        started: <RFC-3339>     status: in-flight
```

Post it as the run's first write, before planning and before any Git or tracker mutation. Make the corresponding **read** a precondition: fetch the root issue's comments first, and where a claim comment exists whose session id and run token are not this run's and has not been released, stop before any mutation, name the holder, and let the human decide whether to resume it, take it over, or run anyway.

Release it at terminal state — including when stopping at the gate — by posting a short released note naming the same run token, so an abandoned run is visibly abandoned rather than silently blocking the next one.

## Read before write

A blind claim is a write, not a check: it overwrites the very evidence that would have shown someone else is already here. Reading first costs one request and is the only cheap moment to catch a collision.

Claim the root issue before planning, and each unit at its own dispatch. The two claims answer different questions: the first unit claim appears only after planning finishes — often many minutes in — and marks one child rather than the feature, so for that whole window the run is invisible to everyone but this coordinator, because the ledger is private.

Read the tracker's own frontier rule to learn what it treats as a claim, commonly an assignee. An unclaimed in-flight ticket reads as takeable to any concurrent run, and the ledger cannot prevent that because the other run never reads it. Release or leave a unit claim per that tracker's convention when the unit closes.

## The local lock

One lock path per repository-and-issue, with **no** run token:

```text
<run-state-root>/locks/<repo>-<issue>.lock
```

Acquire it with an atomic fail-if-exists operation, and treat it as a fast secondary guard, never the authority.

It cannot be the run-state directory itself. `recovery.md` deliberately gives each run its own token-suffixed directory so two runs never interleave their evidence — a per-run path collides with nothing by construction, so it detects nothing.

## What a collision actually costs

In the observed collision both runs wrote the same branches and worktrees, each attributed the other's commits to its own agents, and one recorded a handoff-accuracy defect against an agent that had reported honestly — the commit it was accused of misreporting had been made by the other run.

Evidence corruption is the quiet failure here. The code survived; the account of who did what did not.
