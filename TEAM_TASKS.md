# OrgLab Sentinel Team Tasks

This board defines ownership boundaries for the eight-person team. GitHub issues and pull requests are the live source of truth; names should be claimed there instead of being hard-coded in this file.

## Authoritative product flow

| Stage | Owner domain | Input | Required output |
| --- | --- | --- | --- |
| 1. News Agent | Agent + data engineering | News fixtures/API adapter | Structured news brief with source, freshness, facts, inference, confidence, and limitations |
| 2. Data/Filing Agent | Agent + data engineering | SEC filings and financial-data fixtures/API adapter | Independent structured filing/data brief using the same evidence contract |
| 3. Supervisor | Architecture + agent engineering | Both specialist briefs | Cited synthesis that preserves conflicts, missing evidence, and uncertainty |
| 4. User Risk Report | Frontend + compliance + evaluation | Supervisor synthesis | Human-readable risk report with user-reviewed actions and no automatic trade |

Stages 1 and 2 own distinct sources and may execute in parallel. The Supervisor must not erase disagreement merely to create a cleaner answer.

## Eight role lanes

| Role | Primary ownership | First sprint task | Acceptance signal |
| --- | --- | --- | --- |
| 1. Product / Team Lead | Scope, issue readiness, release path, opening and closing narrative | Freeze the three canonical events and end-to-end demo script | One issue per deliverable, dependencies named, three-minute demo path rehearsed |
| 2. Architecture / Backend | Event schema, EvidenceBrief contract, orchestration, Supervisor boundary | Define the EvidenceBrief and UserRiskReport contracts | News and filing briefs can be validated independently and merged without losing provenance |
| 3. Agent Engineering | Prompts/rules, structured output, failure recovery | Implement or document the two specialist behaviors and Supervisor reconciliation | Rumor, missing-source, and conflicting-evidence cases produce safe structured states |
| 4. Data Engineering | Mock fixtures, SEC adapter, optional news adapter, caching/fallback | Build deterministic fixtures first; then add SEC EDGAR behind the adapter | Demo works offline and live failure falls back visibly without fabricated data |
| 5. Frontend Engineering | Dashboard, Agent Team, OrgLab comparison, live demo | Make the four stages and evidence lineage visible in the UI | A reviewer can follow one event from sources to final report without explanation |
| 6. Experiment Evaluation | Metrics, fault injection, topology comparison | Define equal-input comparisons for flat, supervisor-expert, and dynamic-risk modes | Results show methodology and uncertainty, not decorative or unexplained scores |
| 7. Industry / Compliance | User pain, competitors, disclaimers, risk language | Review every action label and report disclaimer | No brokerage connection, execution claim, guaranteed outcome, or unsupported certainty |
| 8. Deck / Visual | Story, charts, timing, backup recording | Align the 20-minute deck and offline demo | Visual language matches the product and a backup video covers the full demo path |

## Issue-claim workflow

1. The Product/Team Lead creates or marks a task ready only after acceptance criteria and dependencies are clear.
2. A teammate comments `/claim`, names the role lane, and gives an expected completion window.
3. The teammate self-assigns, or the lead assigns them if permissions do not allow self-assignment.
4. Work starts on `role/issue-number-short-name`; one active implementation issue per person is the default.
5. Open a draft PR early, link `Closes #<issue>`, and list shared files before editing them.
6. Post a short issue update when the task crosses a pipeline boundary or becomes blocked.
7. If no progress update is possible for 24 hours, unassign or agree on a handoff so another teammate can claim it.
8. Merge only after CI, acceptance criteria, and the required cross-role review pass.

## Ready-to-file priority tasks

### P0 — stable collaborative baseline

- Product: capture the canonical three-event demo and explicit non-trading boundary.
- Architecture: publish one versioned Event, EvidenceBrief, SupervisorSynthesis, and UserRiskReport contract.
- Agent: preserve independent source analysis and conflict handling across all four stages.
- Data: provide deterministic news and filing fixtures for NVDA, AAPL, and TSLA.
- Frontend: expose source-to-report traceability, loading, empty, quarantined, and error states.
- Evaluation: verify the three organization modes use the same event inputs and comparison budget.
- Compliance: review labels, caveats, uncertainty, and final user-confirmation copy.
- Deck: record the offline happy path plus the unverified-rumor quarantine path.

### P1 — real-source adapter, still mock-first

- Add SEC EDGAR ingestion behind the Data/Filing Agent adapter.
- Select one news provider only after documenting its rate limit, attribution, freshness, and fallback behavior.
- Keep local fixtures as the default roadshow path.
- Add observable source failures without breaking the final report flow.

### P2 — OrgLab evidence

- Inject Agent timeout, unverified rumor, and conflicting-source faults.
- Compare flat chat, supervisor-expert, and dynamic-risk organizations under identical inputs.
- Report latency, duplicate work, conflicts, recovery time, and evidence coverage with definitions.

## Definition of done

A task is done when its acceptance criteria pass, tests and production build succeed, documentation reflects any contract change, mock fallback still works, and a reviewer can verify the result from the pull request alone.

For user-facing work, also include screenshots or a short recording. For data or agent work, include representative structured input/output with no secrets or personal account data.
