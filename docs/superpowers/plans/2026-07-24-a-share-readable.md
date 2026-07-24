# A 股可读版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 OrgLab Sentinel 演示原型从美股语境改为 A 股，白话化用户可见术语，并加入四类轻量 SVG/CSS 图表。

**Architecture:** 数据层（`demoData.js`）承载 A 股持仓与情景文案；契约层放宽 `ticker` 以支持数字代码；纯函数 `chartMath.js` 负责环形图/仪表几何，React 组件只负责渲染；`App.jsx` 嵌入图表并替换用户可见黑话；`simulation.js` 保持流水线逻辑，只改面向用户的字符串。

**Tech Stack:** React 19 + Vite 8、Node test runner、Ajv 2020 JSON Schema、原生 SVG/CSS（无重型图表库）

**Spec:** `docs/superpowers/specs/2026-07-24-a-share-readable-design.md`

**Note on commits:** 当前工作区可能无 git 仓库。有 git 则按步骤提交；无 git 则跳过所有 Commit 步骤，继续实现。

---

## File map

| 文件 | 职责 |
|------|------|
| `docs/contracts/event.schema.json` | 放宽 `ticker` 以支持 `300750.SZ` 等 A 股代码 |
| `src/data/demoData.js` | A 股持仓、情景、Agent 角色文案、来源文案 |
| `src/lib/simulation.js` | 故障/账本等用户可见字符串白话化 |
| `src/components/charts/chartMath.js` | 环形扇区与仪表角度纯函数 |
| `src/components/charts/AllocationDonut.jsx` | 仓位环形图 |
| `src/components/charts/RiskGauge.jsx` | 风险半圆仪表 |
| `src/components/charts/OrgScoreBars.jsx` | 组织实验对比柱图 |
| `src/components/charts/PipelineTimeline.jsx` | 分析流程时间线 |
| `src/App.jsx` | 嵌入图表；监控台/抽屉/Agent/实验页文案 |
| `src/styles.css` | 图表与时间线样式 |
| `test/simulation.test.js` | 既有契约/流水线测试（应继续绿） |
| `test/chartMath.test.js` | 图表几何纯函数测试 |
| `test/aShareContent.test.js` | A 股内容与禁词扫描 |

---

### Task 1: 放宽 Event ticker 契约以支持 A 股代码

**Files:**
- Modify: `docs/contracts/event.schema.json`
- Create: `test/aShareContent.test.js`（本任务先写 ticker 相关断言；后续任务再补全）
- Test: `test/aShareContent.test.js`, `test/simulation.test.js`

- [ ] **Step 1: 写失败测试 — A 股 ticker 应通过 schema**

在 `test/aShareContent.test.js` 创建：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const contractDirectory = fileURLToPath(new URL('../docs/contracts/', import.meta.url));

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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test test/aShareContent.test.js`

Expected: FAIL — `300750.SZ` 不匹配当前 `^[A-Z.]{1,10}$`

- [ ] **Step 3: 更新 schema pattern**

将 `docs/contracts/event.schema.json` 中 `ticker` 改为：

```json
"ticker": { "type": "string", "pattern": "^[A-Z0-9.]{1,12}$" }
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node --test test/aShareContent.test.js test/simulation.test.js`

Expected: PASS（`simulation.test.js` 全部绿；`aShareContent` 新测试绿）

- [ ] **Step 5: Commit（有 git 时）**

```bash
git add docs/contracts/event.schema.json test/aShareContent.test.js
git commit -m "fix: allow A-share tickers in event schema"
```

---

### Task 2: 将 demoData 改为 A 股持仓与情景

**Files:**
- Modify: `src/data/demoData.js`
- Modify: `test/aShareContent.test.js`
- Test: `test/aShareContent.test.js`, `test/simulation.test.js`

- [ ] **Step 1: 扩展失败测试 — 持仓与禁词**

追加到 `test/aShareContent.test.js`：

```js
import { holdings, scenarios, agents } from '../src/data/demoData.js';

const banned = [/NVDA/, /AAPL/, /TSLA/, /NASDAQ/, /SEC/, /XBRL/, /Finnhub/, /10-K/, /8-K/];

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
  for (const pattern of banned) {
    assert.equal(pattern.test(blob), false, `banned pattern still present: ${pattern}`);
  }
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test test/aShareContent.test.js`

Expected: FAIL — 仍为 NVDA/AAPL/TSLA

- [ ] **Step 3: 替换 holdings**

将 `src/data/demoData.js` 中 `holdings` 改为：

```js
export const holdings = [
  { ticker: '300750.SZ', market: '深交所·创业板', name: '宁德时代', allocation: 38, pnl: 12.6, risk: '中', color: '#54d6b5' },
  { ticker: '002594.SZ', market: '深交所', name: '比亚迪', allocation: 34, pnl: -2.3, risk: '低', color: '#7aa7ff' },
  { ticker: '688981.SH', market: '上交所·科创板', name: '中芯国际', allocation: 28, pnl: 7.8, risk: '中', color: '#f5b65b' },
];
```

- [ ] **Step 4: 更新 agents 用户可见文案**

- `filing.role`：改为处理「交易所公告、巨潮披露与财报结构化字段…」
- `output` 字段对用户展示时在 UI 改；此处可将 `EvidenceBrief v1` 改为 `证据简报 v1`，`SupervisorSynthesis v1` → `汇总分析 v1`，`UserRiskReport v1` → `用户风险报告 v1`
- `news.role` 保持新闻侧，去掉任何美股专有名词

- [ ] **Step 5: 更新三个 scenarios**

按 spec 映射整体改写（保留 `id`、`schemaVersion`、`dataMode`、`eventType`、结构字段名）：

**earnings（宁德时代）**
- `ticker: '300750.SZ'`
- `title: '演示事件：宁德时代毛利率低于预设情景阈值'`
- filing provider：`本地巨潮/交易所公告样本`
- filing headline/summary：用「定期报告 / 财报附注字段」代替 10-K/XBRL
- evidence labels：`模拟定期报告`、`模拟财报毛利率字段`；`locator` 可改为 `demo://filings/...`（勿在 UI 原样强调 fixture）
- `userReport.checklist`：改为「打开原始定期报告对应章节」等，去掉 10-K

**supply（比亚迪）**
- `ticker: '002594.SZ'`
- `title: '演示事件：比亚迪核心供应商出现短期停产'`
- filing：未找到对应交易所公告；文案去掉 SEC/8-K

**rumor（中芯国际）**
- `ticker: '688981.SH'`
- `title: '演示事件：社交媒体出现中芯国际相关传闻'`

同时扫一遍 `recommendation`/`rationale`/`findings`/`gaps`/`note`，清除 banned 列表中的词。

`commonControls.budget`：`'$0.50 / run'` → `'¥3.50 / 次'`（或保留数字语义的人民币表述）。

- [ ] **Step 6: 运行测试**

Run: `node --test test/aShareContent.test.js test/simulation.test.js`

Expected: PASS

- [ ] **Step 7: Commit（有 git 时）**

```bash
git add src/data/demoData.js test/aShareContent.test.js
git commit -m "feat: replace US demo holdings and scenarios with A-shares"
```

---

### Task 3: 白话化 simulation.js 用户可见字符串

**Files:**
- Modify: `src/lib/simulation.js`
- Modify: `test/aShareContent.test.js`
- Test: `test/simulation.test.js`, `test/aShareContent.test.js`

- [ ] **Step 1: 追加测试 — ledger 摘要不含 EvidenceBrief 字样**

```js
import { applyFaultToScenario, getPatchLedger } from '../src/lib/simulation.js';

test('patch ledger summaries use plain Chinese for waiting states', () => {
  const ledger = getPatchLedger(scenarios[0], 0);
  assert.match(ledger[0].summary, /证据简报|等待/);
  assert.equal(/EvidenceBrief/.test(ledger[0].summary), false);
  assert.equal(/EvidenceBrief/.test(ledger[2].summary), false);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test test/aShareContent.test.js`

Expected: FAIL — 仍含 `EvidenceBrief`

- [ ] **Step 3: 替换 simulation.js 中面向用户的字符串**

在 `getPatchLedger`：
- `'等待 EvidenceBrief 提交'` → `'等待证据简报提交'`
- `'等待两份 EvidenceBrief 汇合'` → `'等待两份证据简报汇合'`
- `'等待 SupervisorSynthesis 与风险映射'` → `'等待汇总分析与风险映射'`

在 `applyFaultToScenario` 故障文案中：
- evidence `locator` 可用 `demo://runtime/...`
- `note` 去掉「不是金融证据」可保留；确保无 SEC 等词
- 保持现有测试依赖的中文片段：`/新闻简报缺失/`、`/隔离/`、`/冲突/`

`LabPage` 预算锁定在 App 内，本任务若 `simulation` 无预算字符串则跳过。

- [ ] **Step 4: 运行测试**

Run: `node --test`

Expected: PASS

- [ ] **Step 5: Commit（有 git 时）**

```bash
git add src/lib/simulation.js test/aShareContent.test.js
git commit -m "refactor: plain-language patch ledger and fault copy"
```

---

### Task 4: 图表几何纯函数 + 测试

**Files:**
- Create: `src/components/charts/chartMath.js`
- Create: `test/chartMath.test.js`

- [ ] **Step 1: 写失败测试**

`test/chartMath.test.js`：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { donutSegments, gaugeAngle } from '../src/components/charts/chartMath.js';

test('donutSegments produces degrees summing to 360', () => {
  const segments = donutSegments([
    { allocation: 38, color: '#54d6b5' },
    { allocation: 34, color: '#7aa7ff' },
    { allocation: 28, color: '#f5b65b' },
  ]);
  assert.equal(segments.length, 3);
  const total = segments.reduce((sum, s) => sum + (s.endAngle - s.startAngle), 0);
  assert.ok(Math.abs(total - 360) < 0.01);
  assert.equal(segments[0].startAngle, 0);
  assert.equal(segments[0].color, '#54d6b5');
});

test('gaugeAngle maps 0-100 score to -90..90 degrees', () => {
  assert.equal(gaugeAngle(0), -90);
  assert.equal(gaugeAngle(50), 0);
  assert.equal(gaugeAngle(100), 90);
  assert.equal(gaugeAngle(null), null);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test test/chartMath.test.js`

Expected: FAIL — module not found

- [ ] **Step 3: 实现 chartMath.js**

```js
export function donutSegments(items) {
  const total = items.reduce((sum, item) => sum + item.allocation, 0) || 1;
  let cursor = 0;
  return items.map((item) => {
    const sweep = (item.allocation / total) * 360;
    const segment = {
      ...item,
      startAngle: cursor,
      endAngle: cursor + sweep,
    };
    cursor += sweep;
    return segment;
  });
}

/** @param {number|null|undefined} score */
export function gaugeAngle(score) {
  if (score === null || score === undefined || Number.isNaN(score)) return null;
  const clamped = Math.min(100, Math.max(0, score));
  return -90 + (clamped / 100) * 180;
}

export function polarToCartesian(cx, cy, radius, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

export function describeArc(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}
```

- [ ] **Step 4: 运行测试通过**

Run: `node --test test/chartMath.test.js`

Expected: PASS

- [ ] **Step 5: Commit（有 git 时）**

```bash
git add src/components/charts/chartMath.js test/chartMath.test.js
git commit -m "feat: add chart geometry helpers for donut and gauge"
```

---

### Task 5: 实现四个图表组件

**Files:**
- Create: `src/components/charts/AllocationDonut.jsx`
- Create: `src/components/charts/RiskGauge.jsx`
- Create: `src/components/charts/OrgScoreBars.jsx`
- Create: `src/components/charts/PipelineTimeline.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: AllocationDonut.jsx**

```jsx
import React from 'react';
import { describeArc, donutSegments } from './chartMath.js';

export function AllocationDonut({ holdings, centerLabel = '模拟', centerValue }) {
  const cx = 60;
  const cy = 60;
  const radius = 48;
  const segments = donutSegments(holdings);
  return (
    <div className="chart-donut" role="img" aria-label="仓位分布环形图">
      <svg viewBox="0 0 120 120" width="120" height="120">
        {segments.map((segment) => (
          <path
            key={segment.ticker}
            d={`${describeArc(cx, cy, radius, segment.startAngle, segment.endAngle)}`}
            fill="none"
            stroke={segment.color}
            strokeWidth="14"
            strokeLinecap="butt"
          />
        ))}
        <circle cx={cx} cy={cy} r="34" className="donut-hole" />
        <text x={cx} y={cy - 4} textAnchor="middle" className="donut-value">{centerValue}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="donut-label">{centerLabel}</text>
      </svg>
    </div>
  );
}
```

若单 path 弧在 360° 闭合时渲染不佳，改用 `strokeDasharray` 圆环分段实现，保持 `donutSegments` 输入不变。

- [ ] **Step 2: RiskGauge.jsx**

```jsx
import React from 'react';
import { gaugeAngle } from './chartMath.js';

export function RiskGauge({ score, ready }) {
  const angle = ready ? gaugeAngle(score) : null;
  const display = !ready ? '…' : score === null ? '—' : String(score);
  return (
    <div className="chart-gauge" role="img" aria-label={`风险分 ${display}`}>
      <div className="gauge-arc" data-ready={ready && score !== null}>
        <span className="gauge-needle" style={angle === null ? undefined : { transform: `rotate(${angle}deg)` }} />
      </div>
      <strong className="gauge-score">{display}</strong>
      <span className="gauge-caption">{!ready ? '计算中' : score === null ? '暂缓评分' : '风险分 / 100'}</span>
    </div>
  );
}
```

- [ ] **Step 3: OrgScoreBars.jsx**

```jsx
import React from 'react';

export function OrgScoreBars({ results }) {
  const max = Math.max(...results.map((r) => r.score), 1);
  return (
    <div className="chart-bars" role="img" aria-label="组织实验得分对比">
      {results.map((result) => (
        <div className={`bar-col ${result.winner ? 'winner' : ''}`} key={result.id}>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ height: `${(result.score / max) * 100}%`, background: result.color }}
            />
          </div>
          <b>{result.score}</b>
          <span>{result.name}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: PipelineTimeline.jsx**

```jsx
import React from 'react';

const STEPS = [
  { phase: 1, label: '新闻' },
  { phase: 1, label: '公告', parallel: true },
  { phase: 3, label: '汇总' },
  { phase: 5, label: '报告' },
  { phase: 5, label: '你来确认', gate: true },
];

export function PipelineTimeline({ phase, reviewed }) {
  return (
    <ol className="chart-timeline" aria-label="分析流程时间线">
      {STEPS.map((step, index) => {
        const done = step.gate ? reviewed : phase >= step.phase;
        const active = !step.gate && phase < step.phase && (index === 0 || phase >= STEPS[index - 1].phase);
        return (
          <li key={`${step.label}-${index}`} className={`${done ? 'done' : ''} ${active ? 'active' : ''} ${step.gate ? 'gate' : ''}`}>
            <span>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
```

可按视觉微调 active 判定；验收要求是相位变化时高亮推进。

- [ ] **Step 5: 在 styles.css 末尾追加图表样式**

加入 `.chart-donut`、`.chart-gauge`、`.gauge-arc`、`.gauge-needle`、`.chart-bars`、`.bar-col`、`.chart-timeline` 等，颜色沿用现有 CSS 变量/面板色，不引入新设计体系。

- [ ] **Step 6: 构建检查组件可解析**

Run: `npm run build`

Expected: PASS（若尚未接入 App，只要无语法错误即可；若 Vite 未收录未引用文件，至少保证文件语法正确）

- [ ] **Step 7: Commit（有 git 时）**

```bash
git add src/components/charts src/styles.css
git commit -m "feat: add SVG/CSS chart components for dashboard and lab"
```

---

### Task 6: 接入 App — 图表 + 术语白话化 + ¥

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/styles.css`（如需布局微调）
- Modify: `test/aShareContent.test.js`

- [ ] **Step 1: 追加内容扫描 — App 源码禁词**

```js
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

test('App.jsx user-facing source avoids US market jargon and schema jargon labels', () => {
  const appPath = fileURLToPath(new URL('../src/App.jsx', import.meta.url));
  const source = readFileSync(appPath, 'utf8');
  for (const pattern of [/NASDAQ/, /\bSEC\b/, /Finnhub/, /XBRL/, /10-K/, /\$286/, /schema: EvidenceBrief/, /SOURCE-SPECIALIST/]) {
    assert.equal(pattern.test(source), false, `App still contains ${pattern}`);
  }
  assert.match(source, /¥286/);
  assert.match(source, /AllocationDonut/);
  assert.match(source, /RiskGauge/);
  assert.match(source, /OrgScoreBars/);
  assert.match(source, /PipelineTimeline/);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test test/aShareContent.test.js`

Expected: FAIL

- [ ] **Step 3: 在 App.jsx 顶部增加 import**

```js
import { AllocationDonut } from './components/charts/AllocationDonut.jsx';
import { RiskGauge } from './components/charts/RiskGauge.jsx';
import { OrgScoreBars } from './components/charts/OrgScoreBars.jsx';
import { PipelineTimeline } from './components/charts/PipelineTimeline.jsx';
```

- [ ] **Step 4: Dashboard 改造要点**

1. eyebrow：`A 股组合风险助手`
2. 标题可改为：`两路取证，一份说得清的风险报告`
3. Metric 模拟资产：`¥286,420`
4. 「演示风险分」Metric 旁或替代视觉：嵌入 `<RiskGauge score={scenario.riskScore} ready={reportReady} />`
5. 持仓面板：在 allocation-bar 旁或上方嵌入 `<AllocationDonut holdings={holdings} centerValue="¥286k" />`；可保留色条与列表
6. 工作流面板：在现有 `PipelineFlow` 上方或替代位置加入 `<PipelineTimeline phase={phase} reviewed={reviewed} />`（保留原 pipeline 亦可，但至少要有时间线）
7. 替换所有用户可见 `EvidenceBrief`、`MOCK FIXTURE`、`schema:`、英文 eyebrow
8. 等待文案：`两份证据简报提交后…`
9. `EvidenceBriefCard`：标题「新闻助手简报 / 公告助手简报」；meta 改为「证据简报 · 证据 N 条 · 可信度 N%」；去掉 `schema: EvidenceBrief v1`
10. `NotificationsView`：`未连接巨潮行情、券商或真实账户`（勿提 SEC/Finnhub）
11. `EvidenceView`：去掉 `schema_version` / `data_mode` 代码块式展示，改为「来源类型 / 更新时间 / 可信度」白话行；`locator` 可显示为「演示样本编号：…」或隐藏路径
12. `LedgerView` 引言：去掉 namespace 说法，改为「每个助手只能提交自己职责范围内的变更记录」
13. `LabPage`：预算 `¥3.50`；嵌入 `<OrgScoreBars results={results} />`；eyebrow 改中文

- [ ] **Step 5: AgentsPage 文案**

- eyebrow 中文
- 「两份独立证据简报」
- permission 区：若仍展示 code 路径，改为中文权限说明或弱化展示（spec：少露路径）
- 组织宪法描述保持白话

- [ ] **Step 6: 运行测试与构建**

Run: `npm test && npm run build`

Expected: PASS

- [ ] **Step 7: 手动烟测清单**

Run: `npm run dev`，浏览器检查：
1. 持仓为三只 A 股，金额为 ¥
2. 三个情景标题含宁德时代/比亚迪/中芯国际
3. 环形图、仪表、时间线、实验柱图可见
4. 打开证据/账本抽屉无 schema/fixture/SEC 黑话
5. 底部仍有「模拟数据 · 不自动交易」

- [ ] **Step 8: Commit（有 git 时）**

```bash
git add src/App.jsx src/styles.css test/aShareContent.test.js
git commit -m "feat: wire A-share charts and plain-language UI copy"
```

---

### Task 7: 全量验收与禁词扫尾

**Files:**
- Modify: any remaining files found by scan (`src/`, `README.md` 仅当有明显美股演示说明且会误导时再改；YAGNI：不强制大改 README)
- Test: all

- [ ] **Step 1: 仓库内演示源码禁词扫描**

Run (PowerShell):

```powershell
Select-String -Path src\*,test\* -Pattern 'NVDA|AAPL|TSLA|NASDAQ|\bSEC\b|XBRL|Finnhub|10-K' -Recurse
```

Expected: 无命中（或仅命中本计划测试里的 banned 正则字面量——若测试文件命中，将 banned 列表改为字符串数组精确匹配，避免自引用）。

- [ ] **Step 2: 最终检查命令**

Run: `npm run check`

Expected: tests pass + build pass

- [ ] **Step 3: Commit（有 git 时）**

```bash
git add -A
git commit -m "chore: finish A-share readable prototype acceptance sweep"
```

---

## Spec coverage checklist

| Spec 要求 | Task |
|-----------|------|
| A 股持仓三只 | Task 2 |
| 情景映射三只股票 | Task 2 |
| SEC→巨潮/公告 MOCK | Task 2 |
| ¥ 货币 | Task 2, 6 |
| 术语白话化 + 抽屉去黑话 | Task 3, 6 |
| 四类图表 | Task 4–6 |
| 保留三页与流水线 | Task 6（不删页） |
| ticker schema 支持数字 | Task 1 |
| npm test + build | Task 6–7 |
| 不做真实行情/重型库 | 全计划遵守 |

## Self-review notes

- 无 TBD 步骤；`event.schema.json` ticker 数字问题已纳入 Task 1
- 图表几何与 JSX 分离，便于 Node 测试
- 现有 `simulation.test.js` 依赖的中文关键词（隔离、冲突、新闻简报缺失）在改文案时必须保留
