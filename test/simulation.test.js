import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { faults, holdings, scenarios } from '../src/data/demoData.js';
import { validateEvidenceBrief, validateRunContracts } from '../src/lib/contracts.js';
import {
  applyFaultToScenario,
  getAgentRuntime,
  getPatchLedger,
  isQuarantined,
  runOrganizationExperiment,
  validateScenarioContract,
} from '../src/lib/simulation.js';

test('every canonical scenario satisfies the mock pipeline contract', () => {
  for (const scenario of scenarios) {
    assert.deepEqual(validateScenarioContract(scenario), [], scenario.id);
    assert.equal(scenario.controls.humanGate, true);
    assert.equal(scenario.evidenceBriefs.news.dataMode, 'MOCK');
    assert.equal(scenario.evidenceBriefs.filing.dataMode, 'MOCK');
  }
});

test('all versioned JSON contract files parse successfully', () => {
  const contractDirectory = fileURLToPath(new URL('../docs/contracts/', import.meta.url));
  const files = readdirSync(contractDirectory).filter((file) => file.endsWith('.json'));
  assert.ok(files.length >= 3);
  for (const file of files) {
    const schema = JSON.parse(readFileSync(`${contractDirectory}/${file}`, 'utf8'));
    assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
    assert.equal(schema.type, 'object');
  }
});

test('canonical and fault-injected fixtures satisfy all JSON Schemas', () => {
  const contractDirectory = fileURLToPath(new URL('../docs/contracts/', import.meta.url));
  const loadSchema = (name) => JSON.parse(readFileSync(`${contractDirectory}/${name}`, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true });
  const validateEvent = ajv.compile(loadSchema('event.schema.json'));
  const validateBrief = ajv.compile(loadSchema('evidence-brief.schema.json'));
  const validateSynthesis = ajv.compile(loadSchema('supervisor-synthesis.schema.json'));
  const validateReport = ajv.compile(loadSchema('user-risk-report.schema.json'));

  const eventFields = ['id', 'schemaVersion', 'dataMode', 'ticker', 'eventType', 'title', 'asOf', 'sourceRefs'];
  for (const scenario of scenarios) {
    for (const fault of faults) {
      const run = applyFaultToScenario(scenario, fault.id, `SCHEMA-${scenario.id}-${fault.id}`);
      assert.equal(run.contractValidation.valid, true);
      assert.equal(run.contractValidation.schemaVersion, '1.2');
      const event = Object.fromEntries(eventFields.map((field) => [field, run[field]]));
      assert.equal(validateEvent(event), true, JSON.stringify(validateEvent.errors));
      assert.equal(validateBrief(run.evidenceBriefs.news), true, JSON.stringify(validateBrief.errors));
      assert.equal(validateBrief(run.evidenceBriefs.filing), true, JSON.stringify(validateBrief.errors));
      assert.equal(validateSynthesis(run.synthesis), true, JSON.stringify(validateSynthesis.errors));
      assert.equal(validateReport(run.userReport), true, JSON.stringify(validateReport.errors));
    }
  }
});

test('news and filing specialists run in parallel before the supervisor', () => {
  const running = getAgentRuntime(1, scenarios[0]);
  assert.equal(running.find((agent) => agent.key === 'news').status, '工作中');
  assert.equal(running.find((agent) => agent.key === 'filing').status, '工作中');
  assert.equal(running.find((agent) => agent.key === 'supervisor').status, '等待');

  const joined = getAgentRuntime(2, scenarios[0]);
  assert.equal(joined.find((agent) => agent.key === 'news').status, '已提交');
  assert.equal(joined.find((agent) => agent.key === 'filing').status, '已提交');
  assert.equal(joined.find((agent) => agent.key === 'supervisor').status, '工作中');
});

test('an unverified rumor is quarantined and produces no portfolio action', () => {
  const rumor = scenarios.find((scenario) => scenario.id === 'rumor');
  assert.equal(isQuarantined(rumor), true);
  assert.equal(rumor.userReport.action, 'NO_ACTION_INSUFFICIENT_EVIDENCE');
  assert.match(rumor.recommendation, /隔离/);
});

test('patch ledger preserves the source-to-report evidence chain', () => {
  const ledger = getPatchLedger(scenarios[0], 5);
  assert.equal(ledger.length, 4);
  assert.deepEqual(ledger[2].evidence, [ledger[0].id, ledger[1].id]);
  assert.deepEqual(ledger[3].evidence, [ledger[2].id]);
  assert.equal(ledger[3].status, 'USER_REVIEW');
});

test('each materialized run has unique artifact IDs and records user review as a new Patch', () => {
  const first = applyFaultToScenario(scenarios[0], 'none', 101);
  const second = applyFaultToScenario(scenarios[0], 'none', 102);
  assert.notEqual(first.evidenceBriefs.news.id, second.evidenceBriefs.news.id);
  assert.notEqual(first.synthesis.id, second.synthesis.id);
  assert.notEqual(first.userReport.id, second.userReport.id);

  const reviewedLedger = getPatchLedger(first, 5, 'none', true);
  assert.equal(reviewedLedger.length, 5);
  assert.equal(reviewedLedger.at(-1).author, '用户');
  assert.equal(reviewedLedger.at(-1).status, 'RECORDED');
  assert.deepEqual(reviewedLedger.at(-1).evidence, [reviewedLedger.at(-2).id]);
});

test('news timeout degrades the news specialist without erasing the data brief', () => {
  const degradedScenario = applyFaultToScenario(scenarios[1], 'news-timeout');
  const runtime = getAgentRuntime(2, degradedScenario, 'news-timeout');
  assert.equal(runtime.find((agent) => agent.key === 'news').status, '降级完成');
  assert.equal(runtime.find((agent) => agent.key === 'filing').status, '已提交');
  assert.equal(degradedScenario.evidenceBriefs.news.status, 'SOURCE_TIMEOUT');
  assert.equal(degradedScenario.userReport.action, 'WATCH_FOR_CONFIRMATION');
  assert.match(degradedScenario.synthesis.conflicts[0], /舆情简报缺失/);
});

test('conflicting evidence is preserved and quarantined through the user report', () => {
  const conflictedScenario = applyFaultToScenario(scenarios[0], 'conflicting-evidence');
  assert.equal(conflictedScenario.synthesis.decision, 'QUARANTINE_SOURCE');
  assert.equal(conflictedScenario.userReport.action, 'NO_ACTION_INSUFFICIENT_EVIDENCE');
  assert.equal(conflictedScenario.userReport.humanGate, true);
  assert.match(conflictedScenario.recommendation, /冲突/);
});

test('organization experiment is deterministic for the same controls', () => {
  const first = runOrganizationExperiment('supply', 'conflicting-evidence');
  const second = runOrganizationExperiment('supply', 'conflicting-evidence');
  assert.deepEqual(first, second);
  assert.equal(first.filter((result) => result.winner).length, 1);
});

test('dynamic risk organization recovers best from a source timeout', () => {
  const results = runOrganizationExperiment('earnings', 'news-timeout');
  const dynamic = results.find((result) => result.id === 'dynamic');
  const alternatives = results.filter((result) => result.id !== 'dynamic');
  assert.ok(alternatives.every((result) => dynamic.recovery > result.recovery));
});

test('A-share demo identifiers are fictional, schema-compatible, and weights total 100', () => {
  assert.equal(holdings.reduce((sum, holding) => sum + holding.allocation, 0), 100);
  for (const holding of holdings) {
    assert.match(holding.ticker, /^[0-9X]{6}\.(SH|SZ|BJ)$/);
    assert.match(holding.ticker, /X/);
    assert.match(holding.market, /虚构样本/);
  }
});

test('every report action is non-execution and no target range survives in v1.2', () => {
  const safeActions = new Set([
    'REVIEW_EVIDENCE',
    'WATCH_FOR_CONFIRMATION',
    'NO_ACTION_INSUFFICIENT_EVIDENCE',
  ]);
  for (const scenario of scenarios) {
    for (const fault of faults) {
      const run = applyFaultToScenario(scenario, fault.id, `SAFE-${fault.id}`);
      assert.equal(safeActions.has(run.userReport.action), true);
      assert.equal(run.userReport.humanGate, true);
      assert.equal('targetRange' in run.userReport, false);
      assert.match(run.userReport.exposureSummary, /不|仅/);
    }
  }
});

test('stale disclosure data is isolated instead of treated as current evidence', () => {
  const run = applyFaultToScenario(scenarios[0], 'stale-data', 301);
  const runtime = getAgentRuntime(2, run, 'stale-data');
  assert.equal(run.evidenceBriefs.filing.status, 'STALE_SOURCE_FIXTURE');
  assert.equal(runtime.find((agent) => agent.key === 'filing').status, '过期隔离');
  assert.equal(run.userReport.action, 'WATCH_FOR_CONFIRMATION');
  assert.match(run.synthesis.missing[0], /最新官方披露/);
});

test('duplicate-source fault collapses repeated posts into one evidence cluster', () => {
  const run = applyFaultToScenario(scenarios[1], 'duplicate-source', 302);
  assert.equal(run.evidenceBriefs.news.status, 'DUPLICATE_CLUSTER_COLLAPSED');
  assert.equal(run.evidenceBriefs.news.claims[0].state, 'CONFIRMED');
  assert.match(run.evidenceBriefs.news.claims[0].rationale, /一个独立上游来源/);
  assert.match(run.recommendation, /同源转载/);
});

test('contract failure rejects the source Patch and still produces a safe report', () => {
  const run = applyFaultToScenario(scenarios[0], 'contract-failure', 303);
  const ledger = getPatchLedger(run, 5, 'contract-failure');
  assert.equal(run.evidenceBriefs.news.status, 'CONTRACT_REJECTED');
  assert.equal(run.contractAudit.accepted, false);
  assert.ok(run.contractAudit.errors.some((error) => error.path.includes('/evidence/0')));
  assert.equal(run.contractValidation.valid, true);
  assert.equal(ledger[0].status, 'REJECTED');
  assert.equal(run.userReport.action, 'WATCH_FOR_CONFIRMATION');
  assert.match(run.rationale, /安全边界/);
});

test('runtime validator rejects an EvidenceBrief with a missing locator', () => {
  const invalidBrief = structuredClone(scenarios[0].evidenceBriefs.news);
  delete invalidBrief.evidence[0].locator;
  const result = validateEvidenceBrief(invalidBrief);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.keyword === 'required'));
});

test('every claim references evidence in its own brief and is summarized in the report', () => {
  for (const scenario of scenarios) {
    const run = applyFaultToScenario(scenario, 'none', `CLAIMS-${scenario.id}`);
    const claims = Object.values(run.evidenceBriefs).flatMap((brief) => brief.claims);
    const summarized = run.userReport.factStateSummary;

    assert.equal(summarized.confirmed, claims.filter((claim) => claim.state === 'CONFIRMED').length);
    assert.equal(summarized.pendingVerification, claims.filter((claim) => claim.state === 'PENDING_VERIFICATION').length);
    assert.equal(summarized.unknown, claims.filter((claim) => claim.state === 'UNKNOWN').length);
    assert.equal(
      run.synthesis.claimStates.confirmed.length
        + run.synthesis.claimStates.pendingVerification.length
        + run.synthesis.claimStates.unknown.length,
      claims.length,
    );
  }
});

test('cross-contract validation catches a Supervisor that drops an unknown claim', () => {
  const run = applyFaultToScenario(scenarios[0], 'none', 'DROPPED-CLAIM');
  const tampered = structuredClone(run);
  tampered.synthesis.claimStates.unknown = [];
  const result = validateRunContracts(tampered);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.keyword === 'claimStateLineage'));
});
