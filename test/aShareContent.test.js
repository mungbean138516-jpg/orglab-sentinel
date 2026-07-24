import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { holdings, scenarios, agents } from '../src/data/demoData.js';
import { applyFaultToScenario, getPatchLedger } from '../src/lib/simulation.js';

const contractDirectory = fileURLToPath(new URL('../docs/contracts/', import.meta.url));

const bannedExact = ['NVDA', 'AAPL', 'TSLA', 'NASDAQ', 'XBRL', 'Finnhub', '10-K', '8-K'];

test('event schema accepts A-share tickers with digits', () => {
  const schema = JSON.parse(readFileSync(`${contractDirectory}/event.schema.json`, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true });
  const validate = ajv.compile(schema);
  const sample = {
    id: 'earnings',
    schemaVersion: '1.0',
    dataMode: 'MOCK',
    ticker: '300750.SZ',
    eventType: 'FILING_SIGNAL',
    title: '演示事件：宁德时代毛利率低于预设情景阈值',
    asOf: 'FIXED_DEMO_TIME',
    sourceRefs: ['BRIEF-NEWS-0142'],
  };
  assert.equal(validate(sample), true, JSON.stringify(validate.errors));
});

test('holdings are A-share names and markets', () => {
  assert.deepEqual(
    holdings.map((h) => h.ticker),
    ['300750.SZ', '002594.SZ', '688981.SH'],
  );
  assert.equal(holdings[0].name, '宁德时代');
  assert.equal(holdings[1].name, '比亚迪');
  assert.equal(holdings[2].name, '中芯国际');
  assert.match(holdings[0].market, /深交所|创业板/);
  assert.match(holdings[2].market, /上交所|科创板/);
});

test('scenarios map to A-share tickers without US market jargon in user-facing strings', () => {
  assert.equal(scenarios.find((s) => s.id === 'earnings').ticker, '300750.SZ');
  assert.equal(scenarios.find((s) => s.id === 'supply').ticker, '002594.SZ');
  assert.equal(scenarios.find((s) => s.id === 'rumor').ticker, '688981.SH');

  const blob = JSON.stringify({ holdings, scenarios, agents });
  for (const token of bannedExact) {
    assert.equal(blob.includes(token), false, `banned token still present: ${token}`);
  }
  assert.equal(/\bSEC\b/.test(blob), false, 'banned token still present: SEC');
});

test('patch ledger summaries use plain Chinese for waiting states', () => {
  const ledger = getPatchLedger(scenarios[0], 0);
  assert.match(ledger[0].summary, /证据简报|等待/);
  assert.equal(ledger[0].summary.includes('EvidenceBrief'), false);
  assert.equal(ledger[2].summary.includes('EvidenceBrief'), false);
});

test('App.jsx user-facing source avoids US market jargon and schema jargon labels', () => {
  const appPath = fileURLToPath(new URL('../src/App.jsx', import.meta.url));
  const source = readFileSync(appPath, 'utf8');
  for (const token of ['NASDAQ', 'Finnhub', 'XBRL', '10-K', '$286', 'schema: EvidenceBrief', 'SOURCE-SPECIALIST']) {
    assert.equal(source.includes(token), false, `App still contains ${token}`);
  }
  assert.equal(/\bSEC\b/.test(source), false, 'App still contains SEC');
  assert.match(source, /¥286/);
  assert.match(source, /AllocationDonut/);
  assert.match(source, /RiskGauge/);
  assert.match(source, /OrgScoreBars/);
  assert.match(source, /PipelineTimeline/);
});
