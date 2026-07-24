import { agents, organizationModes, scenarios } from '../data/demoData.js';

export const PIPELINE_STAGES = [
  { phase: 0, label: '事件入队' },
  { phase: 1, label: '专项助手并行分析' },
  { phase: 2, label: '结构化简报提交' },
  { phase: 3, label: '主管汇总与冲突检查' },
  { phase: 4, label: '风险映射' },
  { phase: 5, label: '用户报告就绪' },
];

export function getScenario(id) {
  return scenarios.find((scenario) => scenario.id === id) ?? scenarios[0];
}

export function isQuarantined(scenario) {
  return scenario.synthesis.decision === 'QUARANTINE_SOURCE';
}

function materializeScenarioRun(scenario, runId) {
  const runInstanceId = `RUN-${runId}`;
  const newsBriefId = `${scenario.evidenceBriefs.news.id}:${runInstanceId}`;
  const filingBriefId = `${scenario.evidenceBriefs.filing.id}:${runInstanceId}`;
  const synthesisId = `${scenario.synthesis.id}:${runInstanceId}`;

  return {
    ...scenario,
    runInstanceId,
    sourceRefs: [newsBriefId, filingBriefId],
    evidenceBriefs: {
      news: { ...scenario.evidenceBriefs.news, id: newsBriefId },
      filing: { ...scenario.evidenceBriefs.filing, id: filingBriefId },
    },
    synthesis: {
      ...scenario.synthesis,
      id: synthesisId,
      inputBriefIds: [newsBriefId, filingBriefId],
    },
    userReport: {
      ...scenario.userReport,
      id: `${scenario.userReport.id}:${runInstanceId}`,
      synthesisId,
    },
  };
}

export function applyFaultToScenario(scenario, fault = 'none', runId = 'DEMO') {
  if (fault === 'none') return materializeScenarioRun(scenario, runId);

  if (fault === 'news-timeout') {
    const newsBriefId = `${scenario.evidenceBriefs.news.id}:NEWS-TIMEOUT`;
    const filingBriefId = `${scenario.evidenceBriefs.filing.id}:NEWS-TIMEOUT`;
    const synthesisId = `${scenario.synthesis.id}:NEWS-TIMEOUT`;
    return materializeScenarioRun({
      ...scenario,
      sourceRefs: [newsBriefId, filingBriefId],
      confidence: Math.min(scenario.confidence, 55),
      riskScore: null,
      impact: '暂不估计',
      recommendation: '新闻来源在演示回放中超时。系统仅保留数据/公告简报，不形成新的仓位调整建议，并要求用户等待来源恢复后重跑。',
      rationale: '一个专项来源缺失时，主管不得把单边证据伪装成完整共识。',
      evidenceBriefs: {
        ...scenario.evidenceBriefs,
        news: {
          ...scenario.evidenceBriefs.news,
          id: newsBriefId,
          status: 'SOURCE_TIMEOUT',
          confidence: 0,
          headline: '故障注入：新闻助手在截止时间前未返回',
          summary: '新闻来源被模拟为不可用；系统记录降级状态，而不是补写或猜测新闻事实。',
          findings: ['未取得新闻内容', '未执行自动重试风暴', '公告/数据链路继续独立运行'],
          evidence: [{ id: 'SIM-RUNTIME-TIMEOUT', label: '模拟运行时超时事件', locator: 'demo://runtime/SIM-RUNTIME-TIMEOUT', tier: '系统事件', verified: true, freshness: 'T+0', note: '故障种子 news-timeout；不是金融证据' }],
          gaps: ['全部新闻侧事实与交叉核验'],
        },
        filing: {
          ...scenario.evidenceBriefs.filing,
          id: filingBriefId,
        },
      },
      synthesis: {
        ...scenario.synthesis,
        id: synthesisId,
        inputBriefIds: [newsBriefId, filingBriefId],
        agreement: '只有数据/公告 Agent 成功提交；主管明确标记来源覆盖不完整。',
        conflicts: ['新闻简报缺失，无法进行双来源一致性判断。'],
        missing: ['新闻来源恢复后的独立简报', ...scenario.synthesis.missing],
        decision: 'WATCH_AND_VERIFY',
      },
      userReport: {
        ...scenario.userReport,
        id: `${scenario.userReport.id}:NEWS-TIMEOUT`,
        synthesisId,
        status: '来源降级，等待重跑',
        action: 'NO_IMMEDIATE_REBALANCE',
        targetRange: `维持 ${scenario.exposure}%（演示）`,
        checklist: ['确认新闻源超时记录', '不要把缺失来源当作“没有风险”', '等待来源恢复', '恢复后使用相同事件重新运行'],
      },
      activeFault: fault,
    }, runId);
  }

  if (fault === 'conflicting-evidence') {
    const newsBriefId = `${scenario.evidenceBriefs.news.id}:CONFLICT`;
    const filingBriefId = `${scenario.evidenceBriefs.filing.id}:CONFLICT`;
    const synthesisId = `${scenario.synthesis.id}:CONFLICT`;
    return materializeScenarioRun({
      ...scenario,
      sourceRefs: [newsBriefId, filingBriefId],
      confidence: Math.min(scenario.confidence, 42),
      riskScore: null,
      impact: '暂不估计',
      recommendation: '两份专项简报在演示回放中出现方向冲突。系统隔离综合结论，不形成仓位调整建议，等待补充一级来源。',
      rationale: '冲突证据不能被平均成一个看似确定的结论；风险门禁优先阻断错误传播。',
      evidenceBriefs: {
        ...scenario.evidenceBriefs,
        news: {
          ...scenario.evidenceBriefs.news,
          id: newsBriefId,
          status: 'CONFLICT_INJECTED_FIXTURE',
          confidence: Math.min(scenario.evidenceBriefs.news.confidence, 61),
          headline: `故障注入：${scenario.evidenceBriefs.news.headline}`,
          summary: '实验控制器将新闻简报方向设置为与公告/数据简报不一致，用于测试冲突治理。',
          findings: ['新闻侧方向与数据侧相反', '冲突标记已保留', '禁止主管静默择一'],
          evidence: [
            ...scenario.evidenceBriefs.news.evidence,
            { id: 'SIM-FAULT-CONFLICT', label: '模拟证据冲突标记', locator: 'demo://runtime/SIM-FAULT-CONFLICT', tier: '实验控制', verified: true, freshness: 'T+0', note: '故障种子 conflicting-evidence；不是金融证据' },
          ],
          gaps: ['可裁决冲突的新增一级来源'],
        },
        filing: {
          ...scenario.evidenceBriefs.filing,
          id: filingBriefId,
        },
      },
      synthesis: {
        ...scenario.synthesis,
        id: synthesisId,
        inputBriefIds: [newsBriefId, filingBriefId],
        agreement: '专项简报仅在主体与时间窗口上匹配，方向性判断不一致。',
        conflicts: ['新闻与公告/数据简报方向相反；主管拒绝合并为单一事实。'],
        missing: ['可裁决冲突的新增一级来源'],
        decision: 'QUARANTINE_SOURCE',
      },
      userReport: {
        ...scenario.userReport,
        id: `${scenario.userReport.id}:CONFLICT`,
        synthesisId,
        status: '证据冲突已隔离',
        action: 'NO_PORTFOLIO_ACTION',
        targetRange: `维持 ${scenario.exposure}%（演示）`,
        checklist: ['查看冲突的两份简报', '寻找新增一级来源', '不要根据冲突结果交易', '解除隔离后重新评估'],
      },
      activeFault: fault,
    }, runId);
  }

  return materializeScenarioRun(scenario, runId);
}

export function getAgentRuntime(phase, scenario, fault = 'none') {
  const sourceTimedOut = fault === 'news-timeout' && phase >= 2;

  return agents.map((agent) => {
    let status = '等待';
    let latency = '—';

    if (agent.key === 'news' || agent.key === 'filing') {
      if (phase === 1) status = '工作中';
      if (phase >= 2) status = '已提交';
      latency = agent.key === 'news' ? '1.2s' : '1.8s';
    }

    if (agent.key === 'supervisor') {
      if (phase === 2) status = '工作中';
      if (phase >= 3) status = '已综合';
      latency = '1.5s';
    }

    if (agent.key === 'risk') {
      if (phase === 3 || phase === 4) status = '工作中';
      if (phase >= 5) status = isQuarantined(scenario) ? '已隔离' : '已汇报';
      latency = '1.9s';
    }

    if (agent.key === 'news' && sourceTimedOut) {
      status = '降级完成';
      latency = 'timeout';
    }

    return { ...agent, status, latency };
  });
}

export function getPatchLedger(scenario, phase, fault = 'none', reviewed = false) {
  const base = scenario.id === 'earnings' ? 142 : scenario.id === 'supply' ? 153 : 164;
  const newsStatus = fault === 'news-timeout' ? 'FALLBACK' : scenario.evidenceBriefs.news.status;
  const instanceSuffix = scenario.runInstanceId ? `-${scenario.runInstanceId}` : '';
  const faultSuffix = scenario.activeFault ? `-${scenario.activeFault.toUpperCase()}` : '';
  const runSuffix = `${instanceSuffix}${faultSuffix}`;
  const patchIds = [0, 1, 2, 3].map((offset) => `PATCH-${base + offset}${runSuffix}`);

  const ledger = [
    {
      id: patchIds[0],
      author: '新闻助手',
      target: `新闻简报 · ${scenario.ticker}`,
      summary: phase >= 2 ? `状态：${newsStatus} · 可信度：${scenario.evidenceBriefs.news.confidence}%` : '等待证据简报提交',
      evidence: phase >= 2 ? scenario.evidenceBriefs.news.evidence.map((item) => item.id) : [],
      status: phase >= 2 ? 'ACCEPTED' : phase === 1 ? 'RUNNING' : 'QUEUED',
    },
    {
      id: patchIds[1],
      author: '公告助手',
      target: `数据简报 · ${scenario.ticker}`,
      summary: phase >= 2 ? `状态：${scenario.evidenceBriefs.filing.status} · 可信度：${scenario.evidenceBriefs.filing.confidence}%` : '等待证据简报提交',
      evidence: phase >= 2 ? scenario.evidenceBriefs.filing.evidence.map((item) => item.id) : [],
      status: phase >= 2 ? 'ACCEPTED' : phase === 1 ? 'RUNNING' : 'QUEUED',
    },
    {
      id: patchIds[2],
      author: '主管助手',
      target: `汇总分析 · ${scenario.ticker}`,
      summary: phase >= 3 ? `结论：${scenario.synthesis.decision} · 冲突数：${scenario.synthesis.conflicts.length}` : '等待两份证据简报汇合',
      evidence: phase >= 3 ? [patchIds[0], patchIds[1]] : [],
      status: phase >= 3 ? 'ACCEPTED' : phase === 2 ? 'RUNNING' : 'QUEUED',
    },
    {
      id: patchIds[3],
      author: '风险助手',
      target: `风险报告 · ${scenario.ticker}`,
      summary: phase >= 5 ? `建议动作：${scenario.userReport.action} · 需人工确认` : '等待汇总分析与风险映射',
      evidence: phase >= 5 ? [patchIds[2]] : [],
      status: phase >= 5 ? (isQuarantined(scenario) ? 'QUARANTINED' : 'USER_REVIEW') : phase >= 3 ? 'RUNNING' : 'QUEUED',
    },
  ];

  if (reviewed && phase >= 5) {
    ledger.push({
      id: `PATCH-${base + 4}${runSuffix}`,
      author: '用户',
      target: `确认记录 · ${scenario.ticker}`,
      summary: '已阅读：是 · 已交易：否',
      evidence: [patchIds[3]],
      status: 'RECORDED',
    });
  }

  return ledger;
}

const baselineMetrics = {
  earnings: {
    flat: { quality: 76, reliability: 68, latency: 9.8, cost: 0.42, duplicate: 23, recovery: 58 },
    hierarchy: { quality: 96, reliability: 93, latency: 6.8, cost: 0.33, duplicate: 6, recovery: 90 },
    dynamic: { quality: 88, reliability: 93, latency: 6.7, cost: 0.34, duplicate: 6, recovery: 94 },
  },
  supply: {
    flat: { quality: 70, reliability: 62, latency: 8.9, cost: 0.40, duplicate: 21, recovery: 54 },
    hierarchy: { quality: 86, reliability: 85, latency: 7.4, cost: 0.37, duplicate: 9, recovery: 82 },
    dynamic: { quality: 90, reliability: 94, latency: 6.5, cost: 0.32, duplicate: 5, recovery: 96 },
  },
  rumor: {
    flat: { quality: 55, reliability: 48, latency: 8.2, cost: 0.39, duplicate: 26, recovery: 45 },
    hierarchy: { quality: 78, reliability: 83, latency: 7.0, cost: 0.35, duplicate: 10, recovery: 79 },
    dynamic: { quality: 94, reliability: 97, latency: 4.9, cost: 0.29, duplicate: 4, recovery: 98 },
  },
};

const faultAdjustments = {
  none: {
    flat: {}, hierarchy: {}, dynamic: {},
  },
  'news-timeout': {
    flat: { quality: -18, reliability: -20, latency: 5.2, cost: 0.09, duplicate: 12, recovery: -22 },
    hierarchy: { quality: -8, reliability: -7, latency: 2.6, cost: 0.05, duplicate: 4, recovery: -7 },
    dynamic: { quality: -3, reliability: -2, latency: 1.1, cost: 0.02, duplicate: 1, recovery: -1 },
  },
  'conflicting-evidence': {
    flat: { quality: -21, reliability: -22, latency: 3.0, cost: 0.08, duplicate: 16, recovery: -19 },
    hierarchy: { quality: -7, reliability: -5, latency: 2.2, cost: 0.05, duplicate: 5, recovery: -4 },
    dynamic: { quality: -2, reliability: -1, latency: 1.5, cost: 0.03, duplicate: 2, recovery: 0 },
  },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function calculateScore(metric) {
  const latencyScore = clamp(100 - metric.latency * 5, 0, 100);
  const costScore = clamp(100 - metric.cost * 100, 0, 100);
  const duplicateScore = 100 - metric.duplicate;
  return Math.round(
    metric.quality * 0.30
    + metric.reliability * 0.30
    + metric.recovery * 0.18
    + latencyScore * 0.08
    + costScore * 0.07
    + duplicateScore * 0.07,
  );
}

export function runOrganizationExperiment(scenarioId, faultId = 'none') {
  const scenarioMetrics = baselineMetrics[scenarioId] ?? baselineMetrics.earnings;
  const adjustments = faultAdjustments[faultId] ?? faultAdjustments.none;

  const results = organizationModes.map((organization) => {
    const base = scenarioMetrics[organization.id];
    const delta = adjustments[organization.id];
    const metric = {
      quality: clamp(base.quality + (delta.quality ?? 0), 0, 100),
      reliability: clamp(base.reliability + (delta.reliability ?? 0), 0, 100),
      latency: Number((base.latency + (delta.latency ?? 0)).toFixed(1)),
      cost: Number(Math.min(0.50, base.cost + (delta.cost ?? 0)).toFixed(2)),
      duplicate: clamp(base.duplicate + (delta.duplicate ?? 0), 0, 100),
      recovery: clamp(base.recovery + (delta.recovery ?? 0), 0, 100),
    };

    return { ...organization, ...metric, score: calculateScore(metric) };
  });

  const winner = results.reduce((best, result) => (result.score > best.score ? result : best));
  return results.map((result) => ({ ...result, winner: result.id === winner.id }));
}

export function validateScenarioContract(scenario) {
  const errors = [];
  const requiredScenarioFields = [
    'id',
    'schemaVersion',
    'dataMode',
    'ticker',
    'eventType',
    'asOf',
    'sourceRefs',
    'title',
    'evidenceBriefs',
    'synthesis',
    'userReport',
  ];
  requiredScenarioFields.forEach((field) => {
    if (scenario[field] === undefined || scenario[field] === null) errors.push(`missing:${field}`);
  });

  ['news', 'filing'].forEach((source) => {
    const brief = scenario.evidenceBriefs?.[source];
    if (!brief) {
      errors.push(`missing:evidenceBriefs.${source}`);
      return;
    }
    [
      'id',
      'schemaVersion',
      'agent',
      'dataMode',
      'provider',
      'sourceClass',
      'asOf',
      'status',
      'confidence',
      'summary',
      'findings',
      'evidence',
      'gaps',
    ].forEach((field) => {
      if (brief[field] === undefined || brief[field] === null) errors.push(`missing:evidenceBriefs.${source}.${field}`);
    });
    brief.evidence?.forEach((item, index) => {
      ['id', 'label', 'locator', 'tier', 'verified', 'freshness', 'note'].forEach((field) => {
        if (item[field] === undefined || item[field] === null) errors.push(`missing:evidenceBriefs.${source}.evidence.${index}.${field}`);
      });
    });
  });

  ['id', 'schemaVersion', 'inputBriefIds', 'agreement', 'conflicts', 'missing', 'decision'].forEach((field) => {
    if (scenario.synthesis?.[field] === undefined || scenario.synthesis?.[field] === null) errors.push(`missing:synthesis.${field}`);
  });

  ['id', 'schemaVersion', 'synthesisId', 'humanGate', 'status', 'action', 'targetRange', 'checklist'].forEach((field) => {
    if (scenario.userReport?.[field] === undefined || scenario.userReport?.[field] === null) errors.push(`missing:userReport.${field}`);
  });

  if (JSON.stringify(scenario.sourceRefs) !== JSON.stringify(scenario.synthesis?.inputBriefIds)) errors.push('source_refs_must_match_synthesis_inputs');
  if (scenario.userReport?.synthesisId !== scenario.synthesis?.id) errors.push('report_must_reference_synthesis');
  if (scenario.controls?.humanGate !== true) errors.push('human_gate_must_be_true');
  if (scenario.userReport?.humanGate !== true) errors.push('user_report_human_gate_must_be_true');
  return errors;
}
