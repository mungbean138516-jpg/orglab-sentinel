# Contributing to OrgLab Sentinel

OrgLab Sentinel is a mock-first, multi-agent risk-monitoring prototype for individual U.S. equity investors. It explains evidence and risk; it does not place trades or replace the user's judgment.

## Product source of truth

All product work must preserve the current four-stage, source-specialist pipeline:

1. **News Agent** — handles company news and other time-sensitive public reporting.
2. **Data/Filing Agent** — independently handles SEC filings and structured financial data.
3. **Supervisor** — receives both structured briefs, reconciles conflicts, preserves source attribution, and produces a synthesis.
4. **User Risk Report** — presents the synthesis, uncertainty, evidence, and possible user-reviewed actions. The user remains the decision-maker.

The first two stages have distinct source ownership and may run in parallel. Neither source agent should silently copy, overwrite, or impersonate the other agent's analysis.

## Prototype guardrails

- Keep the default demo mock-first and runnable without network access.
- Do not connect a brokerage, place orders, or imply that an action was executed.
- Do not turn an unverified report into a fact. Preserve source, timestamp, freshness, confidence, and limitations.
- Do not expose API keys, account data, or other secrets in code, fixtures, screenshots, logs, or pull requests.
- Keep recommendations evidence-backed and phrased as information for user review, such as observe, verify, or consider a position-adjustment range.
- Keep NVDA, AAPL, and TSLA plus the three canonical demo events working unless an agreed change explicitly updates the demo scope.
- Treat the Supervisor as a synthesizer, not a new source. It must retain disagreements and citations from both specialist briefs.

## Structured evidence contract

Changes to agent output should retain, at minimum:

- source agent and source type;
- ticker and event type;
- source identifier or URL;
- publication/filing time and data freshness;
- factual claims and supporting evidence;
- inferred impact, confidence, and limitations;
- unresolved conflicts or missing evidence.

The final risk report should clearly separate sourced facts from model inference and state that user confirmation is required.

## Start from the complete baseline

Issues are optional. Pull the latest `main`, then create a focused branch such as `data/sec-fixtures` or `frontend/evidence-drawer`. Small edits may follow the team's direct-commit policy; cross-cutting changes should open a Draft PR early.

Before changing `App.jsx`, `styles.css`, a shared contract, or another file already being edited, coordinate with the current owner. Keep one primary implementation area per contributor so the final integration remains reviewable.

## Local checks

```bash
npm ci
npm test
npm run build
```

Run all checks before requesting review. If a user-facing state changes, include screenshots or a short recording showing the normal path and relevant error/empty state.

## Pull requests

Keep pull requests small enough to review. A pull request should include:

- the user-visible outcome;
- the intended outcome and acceptance criteria;
- files or pipeline stages affected;
- test/build results;
- screenshots for UI changes;
- any mock/API fallback behavior;
- financial-safety, data-quality, or privacy considerations.

At least one teammate should review a pull request. Changes to shared schemas, the four-stage pipeline, risk wording, or organization-comparison metrics also require review from the relevant architecture, data, evaluation, or industry/compliance owner.

## Commit style

Use short, intentional commits with an imperative subject, for example:

- `Add SEC filing brief fixture`
- `Show conflicting evidence in supervisor summary`
- `Test rumor quarantine flow`

Avoid mixing broad visual restyling, schema changes, and pipeline behavior in one commit.
