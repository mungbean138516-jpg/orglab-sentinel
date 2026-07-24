# Contributing to OrgLab Sentinel

OrgLab Sentinel is a MOCK-first A-share evidence-verification and risk-explanation prototype. It does not recommend or execute trades.

## Product source of truth

Preserve the four-role pipeline:

1. **Chinese public-trend Agent** — finds public discussion, grades sources, deduplicates and quarantines rumors.
2. **Disclosure / data Agent** — independently verifies exchange disclosures, structured facts and corporate identity.
3. **Supervisor** — compares both briefs, preserving agreements, conflicts and unknowns.
4. **Risk explanation Agent** — presents a cited verification report behind a human read gate.

The first two roles own distinct sources and may run in logical parallel. The Supervisor is not a new source.

## Prototype guardrails

- Keep the default demo deterministic, offline and network-independent.
- Use fictional instruments such as `600XXX.SH`; do not attach a fabricated negative event to a real company.
- Do not output buy/sell, target price, return prediction, target position or claim an action was executed.
- Preserve source class, time, freshness, evidence ID, verification state and limitations.
- Explicitly label `IMPLEMENTED`, `MOCK ACTIVE`, `PLANNED`, `AUTH REQUIRED` and `ROADMAP`.
- Do not expose API keys, Hosted MCP URLs, account data or secrets in code, fixtures, screenshots, logs or pull requests.
- Treat MCP as a tool connector, not an Agent or accuracy certificate.

## Contracts

Changes to `Event`, `EvidenceBrief`, `SupervisorSynthesis` or `UserRiskReport` must update:

- `docs/contracts/*.schema.json`;
- canonical and fault-injected fixtures;
- contract tests;
- relevant architecture and roadshow documentation.

The final report must separate confirmed facts, inference/conflict and unknowns. `humanGate` must remain `true`.

## Branch and review workflow

Issues are optional. Pull the latest `main`, create a focused branch and open a Draft PR early for cross-module work:

```bash
git switch main
git pull --ff-only
git switch -c frontend/improve-evidence-drawer
```

Coordinate before editing shared files such as `App.jsx`, `styles.css`, `demoData.js`, `simulation.js` or JSON Schemas.

## Local checks

```bash
npm ci
npm test
npm run build
```

UI changes should include screenshots or a short recording of the normal path and at least one degraded state.

## Pull requests

Include:

- user-visible outcome and acceptance criteria;
- affected pipeline stages and files;
- test/build results;
- screenshots for UI changes;
- MOCK/live fallback behavior;
- financial-safety, data-quality, licensing and privacy considerations.

Use short, intentional commits, for example:

- `Add A-share disclosure fixture`
- `Preserve public-trend conflict in supervisor summary`
- `Test EvidenceBrief rejection flow`

Avoid mixing unrelated changes.
