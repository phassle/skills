---
name: spec-to-scenarios
description: "Prepare acceptance scenarios and save the Gherkin in the Spec on the user's chosen ticket, with a planner brief."
disable-model-invocation: true
---

# Spec to scenarios

The outcome is agreed Gherkin saved in the Spec on the ticket the user designates,
with a planner brief as a handover copy. Work only on the gaps, using Matt
Pocock's skills for questioning and domain modeling.

Input: a destination-ticket identifier or URL, with requirements from that
ticket, another source ticket, or pasted text. A source ticket provides context;
the destination ticket is where the resulting Spec/Gherkin is saved. They may
be the same ticket when the user designates it.
Invoke as `/spec-to-scenarios` in Claude or `$spec-to-scenarios` in Codex.
Use the user's language for the conversation and the project's language for scenarios.

The chain is **Ticket → Criteria → Scenarios → Environment**. A Spec holds
requirements; implementation tickets identify which scenarios they make pass.
The planner later explores the running feature and writes a test plan. This
skill prepares that handover; it writes neither test code nor the test plan.

## Required skills

Before step 1, check that these Matt Pocock skills are available and their
SKILL.md files can be read:

- [grill-with-docs](../grill-with-docs/SKILL.md): combines the interview and domain workflow.
- [domain-modeling](../domain-modeling/SKILL.md): terminology, glossary and architecture decisions.
- [grilling](../grilling/SKILL.md): questioning rounds; required by grill-with-docs.
- [setup-matt-pocock-skills](../setup-matt-pocock-skills/SKILL.md): finding the project's issue tracker and its configuration.

Resolve links from this skill's canonical directory, following symlinks. If a
linked file is absent, check the host's skill catalog and its declared install
locations before treating the dependency as missing.

If any dependency is missing or unreadable, tell the user which skills are
unavailable, what they provide and which locations were checked. Explain that
spec-to-scenarios depends on them and that they must be installed or made
readable before retrying. Stop before the interview or any Spec/glossary writes.

When all dependencies are available, load grill-with-docs and its grilling and
domain-modeling dependencies once through the host's normal skill mechanism or
by reading their SKILL.md files directly. Keep their instructions authoritative
instead of copying them here.

Apply these skills to the acceptance decisions in this Spec. Follow
`docs/agents/domain.md` when resolving their default glossary paths: in this
repo, `docs/domain-glossary.md` replaces `GLOSSARY.md`, and architecture
decisions live in `docs/adr/`.

## 1. Destination: name the outcome, find the tracker and choose the ticket

Name the destination before discussing criteria, as wayfinder does. Use the
outcome and target already supplied by the user. Ask only for missing outcome
details or a missing target, recommending the outcome above.

For tracker discovery, read `setup-matt-pocock-skills`'s **Explore** and
**Section A: Issue tracker** instructions. Start with the repository's
`AGENTS.md` / `CLAUDE.md` pointers and the setup output,
`docs/agents/issue-tracker.md`. That saved configuration determines the
tracker, project/team, tools and read/write boundaries. A GitHub remote alone
does not override a configured Linear tracker.

If configuration is missing, follow setup's discovery instructions rather than
guessing a tracker. If it still cannot be established, explain what is missing
and ask the user to run `/setup-matt-pocock-skills` or provide the tracker
workflow. Reading setup's instructions does not run setup or rewrite its config.
Drafting from supplied requirements can continue while the tracker is unresolved.

Resolve the destination in that tracker:

- If the user names a destination ticket, use that exact ticket. Fetch its body
  and comments, and state its title and link as the output destination.
- If only a source ticket is provided, keep it as input. Do not redirect output
  to it or its parent automatically.
- If no destination is designated, find relevant candidates from the available
  context using the configured tracker, then ask which ticket's Spec should
  receive the Gherkin. Present candidates by title and link when available;
  wait for the choice before publishing. Do not create a ticket as a fallback.
- Respect read-only boundaries. If the chosen ticket cannot be written, explain
  the restriction and ask for a writable destination rather than switching it.

If the role of a supplied ticket is ambiguous, clarify source versus destination.
Read any source Spec and its comments for requirements, keeping its identity
separate from the destination. Missing tracker access or destination leaves the
result **unpublished**; use pasted requirements to continue preparing the draft.

Read the repository instructions and, where present, consult:

- `docs/agents/domain.md`: glossary location and relevant architecture decisions.
- `docs/test-tags.md`: tag vocabulary and required scenario coverage.
- `docs/testing/pr-evidence.md`: plan, test and recording contract.

If these project facts are undocumented, discover them from existing issues,
tests and configuration. Ask only for information you cannot retrieve.

Inspect Playwright configuration, the seed test, fixtures/personas, app address,
existing Gherkin, tags and any CI scenario parser. A **seed test** initializes
the app state from which the planner explores. Record actual paths and formats.
If criteria and scenarios already pass the checks below, preserve them and
complete only the requested destination write and missing environment or handover
information. Reading a complete source Spec does not mean the output has been saved.

## 2. Criteria: resolve decisions in rounds

Expected results come from the Spec and explicit user decisions. Observing the
app helps locate screens and controls; it does not establish correct behaviour.

Summarize the story in one sentence. Keep existing criterion IDs; assign `AC1`,
`AC2`, etc. only where IDs are missing, without collisions or renumbering.
For each criterion, report OK or a concrete gap:

- Is its outcome observable and verifiable, in the browser or at another test level?
- Are relevant values, limits, roles and conditions explicit?
- Is it free of unmeasurable words such as "correctly" or "fast"?

Review error handling and forbidden side effects across the criteria as a set.
Mark checks that do not apply as not applicable. Account for every criterion:
browser scenario, named lower-level test obligation, or unresolved question.

A **red card** is an unresolved product decision that affects expected behaviour,
scope or domain meaning. Use `grill-with-docs` for the questioning rounds and
`grilling` for the frontier, question format and confirmation of shared
understanding. Keep question IDs stable so scenarios can refer to them. Skip
rounds when no decisions remain.

Use `domain-modeling` to resolve terminology, record agreed terms in the
project's glossary and handle architecture decisions. Follow its linked formats
and the repository's domain-doc conventions.

A parked question remains open. Mark dependent scenarios "Waiting for: Q1" and
exclude them from the approved Gherkin. The Spec remains blocked if this leaves
an in-scope criterion unresolved; parking a question does not remove a requirement.

## 3. Scenarios: make the criteria executable

**Gherkin** describes examples using Given, When and Then. Preserve valid
existing scenarios and their IDs. Add examples only for uncovered behaviour.

Cover the normal journey, relevant errors, forbidden changes and nearby
regressions. Consider boundaries, duplicates, simultaneous actions, dates,
time zones, permissions and backend failures where the requirements make them
relevant. Follow the project's minimum coverage rules. Missing expected
behaviour becomes a red card, not an invented requirement.

Each browser scenario must:

- Describe one behaviour with concrete data and a visible outcome.
- Use domain actions and outcomes; put locator details in the later test plan.
- Stand alone with a defined starting state and isolated mutable data.
- Keep its stable ID and full name. Use `AS-1`, `AS-2`, etc. for new IDs unless
  the project defines another format; never reuse a retired ID.
- Include a `# Covers: AC1` comment using the actual criterion IDs.
- Carry the destination Spec's tag, an existing area tag and exactly one type tag.
  If no destination has been chosen, leave its tag unresolved in the draft.

Reuse documented tags. Without a documented taxonomy, use `@happy`, `@edge`,
`@error`, `@negative` and `@regression` as the type tags. Apply `@smoke`
only to agreed critical journeys and `@wip` only under the project's unfinished-
work convention. Check how the runner selects these tags.

Example of one scenario, not a complete coverage set:

```gherkin
Feature: Waitlist promotion

  # Covers: AC1
  @BCPLA-142 @booking @happy
  Scenario: AS-1 The first waitlisted member receives the available place
    Given Erik is first on the waitlist for Spin 18:00
    When a place in Spin 18:00 becomes available
    Then Erik has a confirmed booking for Spin 18:00
```

Keep unanswered scenarios and unapproved extras outside the Gherkin. List
unit-level rules separately with their criterion IDs so they remain accounted
for. Show coverage per criterion, then the full proposed Gherkin. Ask only about
remaining decisions, including proposed changes to existing scenario expectations.

Validate the draft against the project's parser or documented format: accepted
language and syntax, unique IDs/names, criterion references, type tags and required
coverage. Reuse an existing read-only parser where available. Do not add a new
test framework or change CI as part of preparing scenarios.

## 4. Environment: establish planner readiness

Report each item as verified, missing or unverified, with its evidence:

- **App:** actual address, how it starts, and whether the feature's screens exist.
  A configured `webServer` command alone does not prove the feature runs.
- **Accounts:** test identities/personas for the relevant roles and tenants.
  Follow existing fixtures. Use saved authentication state only when applicable;
  keep it out of version control. Parallel tests that mutate shared account state
  need separate accounts or another established isolation strategy.
- **Data:** deterministic setup/reset or isolated fixtures, plus cleanup where
  needed. A shared seed can supply immutable reference data.
- **Outside services:** existing fakes or controlled mocks for services the team
  does not own; acceptance tests use these instead of real customer operations.
- **Seed test:** the real path and the state it establishes for the planner.

Check what is available within the authorized environment. Missing screens,
fixtures or infrastructure become explicit implementation tasks; preparing the
Spec does not require building them. After any browser check, read the server
logs required by the repository and report unexpected errors.

## 5. Save the agreed result and hand over

Save the agreed Gherkin in the Spec content of the designated destination
ticket's description, under its existing scenarios heading or `## Scenarios`.
Use the chosen ticket even when the source is another ticket or a parent Spec.
The local brief is a copy; it does not replace this save.

Preserve unrelated issue text. Show a concrete combined change for the clarified
criteria and the Gherkin block on that destination.
Apply changes within the user's authorization; when publication still needs
approval, obtain it once for this change. Prior approval remains valid.

Append agreed clarifications without silently rewriting the original requirements.
Add one Gherkin block or replace only the approved existing block, preserving IDs.
For existing implementation tickets, propose mappings only for supported scenarios:
`Covers: AS-1, AS-3`, or `Covers: none` when none apply. Several tickets may
contribute to one scenario; passing acceptance evidence establishes that it works.
Keep these mappings in the brief unless the user also requests edits to those
tickets. Issue edits are confined to the selected destination unless the user
also includes other tickets.
When implementation tickets do not exist yet, leave mapping for ticket planning.
Do not create those tickets here. Report an unmapped scenario for that planning
step rather than inventing a ticket or expanding an existing ticket's scope.

Refetch the destination before writing if it may have changed. Reconcile concurrent
edits before applying the approved change. After saving, read that same ticket back
and verify its ID and Gherkin. On an ambiguous write result, read before retrying
so sections are not duplicated. Post comments only when the user authorized a comment.

If the CI contract expects Gherkin on another issue, report that mismatch as an
evidence blocker. Keep the user's chosen destination; do not silently reroute the
save or change the pipeline.

Save or refresh `specs/<destination-id>-brief.md`, following repository layout.
Without a destination ID, use a descriptive filename and mark it unpublished.
The brief contains:

1. Expected outcome, destination ticket title/link/ID, source references,
   publication state and readiness.
2. Story, criteria with their original IDs, and agreed decisions/terms.
3. Gherkin copied exactly from the Spec saved on the destination ticket;
   label unsaved text as a draft.
4. Coverage mapping, lower-level test obligations, exclusions and open red cards.
5. Environment evidence, actual seed path and planner blockers.
6. The discovered CI contract: required tags, exact scenario-title matching,
   plan references, named steps, and video/trace configuration. Include relevant
   paths and helper names, such as `recordEvidence`, when the project uses them.
   If there is no evidence pipeline, say so instead of promising recordings.

An unchanged rerun should produce no duplicate sections or unnecessary rewrites.
Use the brief as a snapshot for the planner; the Spec on the destination ticket
holds the agreed scenarios. Refresh the snapshot when that Spec changes.

Supply this request with actual paths, names and the CI contract filled in:

```text
Create a test plan for <destination-id> from <brief-path>, using <seed-path>.
Recheck the Spec on <destination-ticket-url> and refresh the brief if its
scenarios changed. Other source tickets are supporting context.
Plan one test per approved browser scenario. Its title must equal the full
scenario name, including the ID. Preserve its tags.
Copy each Given/When/Then/And/But line word for word as a named test step;
describe executable UI actions underneath it without changing the expectation.
Use user-facing locators and web-first assertions. Follow the environment and
CI evidence contract in the brief, including recording and runner requirements.
Keep tests independent and use the project's fakes or mocks.
List newly discovered requirement gaps separately for a product decision.
```

If the destination Spec, running feature or seed is missing, label this request
for later and state the blocker instead of inserting a guessed path.

Classify the result:

- **Blocked:** an in-scope product decision or required coverage remains unresolved.
- **Ready for implementation:** criteria are verifiable, required coverage is
  present, and every criterion has a test obligation. Planner prerequisites may
  still be missing. Report draft/publication status separately.
- **Ready for planner:** the approved Spec is saved on the chosen ticket and
  ready for implementation, and the running feature, seed, identities and data
  are verified.

End with the outcome, destination title/link and verified save state, readiness,
the next human-triggered step, and open questions. When implementation tickets
are missing, name the
project's ticket-planning step (here `/to-tickets <destination-id>`); otherwise name
implementation or the planner as readiness allows. Stop there. The later planner
plan needs review before test generation; repairs must preserve agreed expectations.
