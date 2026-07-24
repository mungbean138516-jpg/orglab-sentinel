# OrgLab Sentinel team lanes

This is a lightweight coordination guide for a mixed technical and non-technical team. It is **not** a requirement to create eight GitHub issues.

## Authoritative flow

| Stage | Input | Required output |
| --- | --- | --- |
| Public-trend Agent | Chinese news / trend fixture or adapter | Cited, deduplicated `EvidenceBrief v1.1`; heat remains a clue |
| Disclosure Agent | Exchange / issuer / enterprise fixture or adapter | Independent factual `EvidenceBrief v1.1` |
| Supervisor | Both briefs or explicit degraded records | Agreement, conflict, unknowns and decision |
| Risk explanation | Supervisor synthesis | Human-readable report, verification checklist and no trade |

## Eight collaboration lanes

| Lane | Primary ownership | Useful next contribution |
| --- | --- | --- |
| Product / Lead | Scope, audience, opening and closing | Freeze the 90-second demo and 8-minute story |
| Architecture | Contracts, orchestration and trust boundaries | Review v1.1 schemas and target Bailian flow |
| Agent design | Role prompts/rules and failure recovery | Draft Qwen role instructions without expanding permissions |
| Data | Fictional fixtures and future adapters | Define official disclosure, trends and enterprise adapters |
| Frontend | Dashboard, report drawer and accessibility | Refine evidence drill-down and mobile presentation |
| Evaluation | Metrics, fixed controls and fault injection | Define repeated-seed protocol beyond the current n=1 demo |
| Compliance / Industry | User pain, source rights and wording | Review every claim, label and external connector |
| Deck / Visual | PPT, demo recording and timing | Turn `docs/roadshow/10_PPT_SOURCE_MAP.md` into 10–12 slides |

## Lightweight workflow

1. Treat latest `main` as the complete runnable baseline.
2. Choose a focused contribution and tell the team what shared files it touches.
3. Use a branch for non-trivial work; an Issue is optional.
4. Open a Draft PR early for cross-module changes.
5. Merge after CI and the relevant cross-role review pass.

## Priority backlog

### P0 — roadshow reliability

- Rehearse the fixed A-share happy path and one safe-degradation path.
- Capture a backup recording and screenshots.
- Keep all claims aligned with `docs/roadshow/08_CLAIMS_AND_COMPLIANCE_MATRIX.md`.
- Ensure every slide number has a source or `目标假设` label.

### P1 — concept architecture

- Define a server-side official-disclosure adapter.
- Define read-only Tianyancha and Chinese trends MCP tool policies.
- Map the deterministic v1.1 contracts into a Bailian workflow design.
- Keep the local MOCK path as the roadshow default.

### P2 — evaluation

- Run multiple seeds with locked prompts, models and tools.
- Measure official coverage, conflict retention, unknown visibility, duplicate work and recovery.
- Report uncertainty rather than only a single score.

## Definition of done

Acceptance criteria pass, tests and production build succeed, documentation reflects contract changes, offline MOCK still works, no secret or real personal data is introduced, and a reviewer can verify the result from the PR alone.
