import { agents, organizationModes, scenarios } from '../data/demoData.js';

export const PIPELINE_STAGES = [
  { phase: 0, label: '事件入队' },
  { phase: 1, label: '专项 Agent 逻辑并行' },
  { phase: 2, label: 'EvidenceBrief 合同提交' },
  { phase: 3, label: '主管保留一致、冲突与未知' },
  { phase: 4, label: '风险解释与安全门禁' },
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

function systemEvidence(id, label, note) {
  return {
    id,
    label,
    locator: `fixture://runtime/${id}`,
    tier: '系统事件',
    verified: true,
    freshness: 'T+0',
    note,
  };
}

function withFaultBase(scenario, fault, overrides) {
  return {
    ...scenario,
    riskScore: null,
    impact: '不估算价格或收益影响',
    activeFault: fault,
    ...overrides,
  };
}

function injectNewsTimeout(scenario) {
  return withFaultBase(scenario, 'news-timeout', {
    confidence: Math.min(scenario.confidence, 55),
    recommendation: '中文趋势来源在固定回放中超时。公告链路继续运行，但系统显式标记覆盖不完整，不用猜测内容填补缺口。',
    rationale: '一个专项来源缺失时，主管不得把单边证据包装成完整共识。',
    evidenceBriefs: {
      ...scenario.evidenceBriefs,
      news: {
        ...scenario.evidenceBriefs.news,
        status: 'SOURCE_TIMEOUT',
        confidence: 0,
        headline: '故障注入：舆情 Agent 在截止时间前未返回',
        summary: '趋势适配器被模拟为不可用；系统记录降级状态，公告 Agent 仍可独立提交。',
        findings: ['未取得舆情内容', '没有执行无限重试', '公告链路继续独立运行'],
        evidence: [
          systemEvidence('SIM-RUNTIME-TIMEOUT', '模拟趋势源超时事件', '故障种子 news-timeout；不是金融事实证据'),
        ],
        gaps: ['全部舆情侧事实与交叉核验'],
      },
    },
    synthesis: {
      ...scenario.synthesis,
      agreement: '只有公告 Agent 成功提交；主管明确标记来源覆盖不完整。',
      conflicts: ['舆情简报缺失，无法进行双来源一致性判断。'],
      missing: ['趋势来源恢复后的独立简报', ...scenario.synthesis.missing],
      decision: 'WATCH_AND_VERIFY',
    },
    userReport: {
      ...scenario.userReport,
      status: '来源降级，等待重跑',
      action: 'WATCH_FOR_CONFIRMATION',
      exposureSummary: `模拟关注权重 ${scenario.exposure}%；来源缺失时不生成任何仓位或交易建议。`,
      checklist: ['确认趋势源超时记录', '不要把来源缺失理解为“没有风险”', '等待来源恢复', '恢复后使用同一事件重新运行'],
    },
  });
}

function injectStaleData(scenario) {
  return withFaultBase(scenario, 'stale-data', {
    confidence: Math.min(scenario.confidence, 48),
    recommendation: '公告缓存超过演示新鲜度阈值。系统保留旧记录用于追踪，但不把它当作当前事实。',
    rationale: '来源存在不等于来源仍然新鲜；过期数据必须进入缺口，而不是继续支撑结论。',
    evidenceBriefs: {
      ...scenario.evidenceBriefs,
      filing: {
        ...scenario.evidenceBriefs.filing,
        status: 'STALE_SOURCE_FIXTURE',
        confidence: 30,
        headline: `故障注入：${scenario.evidenceBriefs.filing.headline}`,
        summary: '公告适配器返回的 fixture 被标记为 T+7，超过演示新鲜度阈值，合同仍记录但不采信为当前确认。',
        findings: ['缓存年龄：T+7（情景值）', '演示阈值：T+1', '需要重新获取官方披露'],
        evidence: scenario.evidenceBriefs.filing.evidence.map((item) => ({
          ...item,
          verified: false,
          freshness: 'T+7 · STALE',
          note: `${item.note}；故障注入后仅供追踪，不作为当前确认`,
        })),
        gaps: ['最新交易所公告或公司正式说明'],
      },
    },
    synthesis: {
      ...scenario.synthesis,
      agreement: '两个来源均已返回，但公告侧数据已过期，不能形成当前时点共识。',
      conflicts: ['舆情为 T+0，公告缓存为 T+7；时间窗口不可直接比较。'],
      missing: ['最新官方披露', ...scenario.synthesis.missing],
      decision: 'WATCH_AND_VERIFY',
    },
    userReport: {
      ...scenario.userReport,
      status: '公告数据过期，等待刷新',
      action: 'WATCH_FOR_CONFIRMATION',
      exposureSummary: `模拟关注权重 ${scenario.exposure}%；过期数据不进入操作判断。`,
      checklist: ['查看数据 as-of 时间', '重新获取官方披露', '不要用旧公告裁决新舆情', '刷新后重新运行'],
    },
  });
}

function injectDuplicateSource(scenario) {
  return withFaultBase(scenario, 'duplicate-source', {
    confidence: Math.min(scenario.confidence, 58),
    recommendation: '多篇舆情内容被识别为同源转载。系统折叠重复项，只保留一条线索，不把转载数量当作交叉验证。',
    rationale: '来源数量与独立来源数量不是一回事；同源复制会制造虚假的确定感。',
    evidenceBriefs: {
      ...scenario.evidenceBriefs,
      news: {
        ...scenario.evidenceBriefs.news,
        status: 'DUPLICATE_CLUSTER_COLLAPSED',
        confidence: Math.min(scenario.evidenceBriefs.news.confidence, 45),
        headline: `故障注入：${scenario.evidenceBriefs.news.headline}`,
        summary: '实验控制器把多条文本标记为同一上游线索，舆情 Agent 已折叠为一个 D/C 级证据簇。',
        findings: ['展示条目：7', '独立来源：1', '重复项：6 条已折叠'],
        evidence: [
          ...scenario.evidenceBriefs.news.evidence.slice(0, 1),
          systemEvidence('SIM-DUPLICATE-CLUSTER', '模拟同源聚类记录', '记录去重结果；不是新增金融证据'),
        ],
        gaps: ['第二个真正独立的来源'],
      },
    },
    synthesis: {
      ...scenario.synthesis,
      agreement: '舆情端只保留一个独立线索；公告端结论不受转载数量影响。',
      conflicts: ['表面热度较高，但独立来源覆盖不足。'],
      missing: ['第二个独立来源', ...scenario.synthesis.missing],
      decision: scenario.synthesis.decision === 'QUARANTINE_SOURCE' ? 'QUARANTINE_SOURCE' : 'WATCH_AND_VERIFY',
    },
    userReport: {
      ...scenario.userReport,
      status: '同源内容已折叠',
      action: scenario.synthesis.decision === 'QUARANTINE_SOURCE'
        ? 'NO_ACTION_INSUFFICIENT_EVIDENCE'
        : 'WATCH_FOR_CONFIRMATION',
      exposureSummary: `模拟关注权重 ${scenario.exposure}%；重复传播不改变任何操作状态。`,
      checklist: ['查看同源聚类记录', '寻找真正独立来源', '不要用热度替代事实', '证据升级后再评估'],
    },
  });
}

function injectConflict(scenario) {
  return withFaultBase(scenario, 'conflicting-evidence', {
    confidence: Math.min(scenario.confidence, 42),
    recommendation: '两份专项简报方向冲突。系统隔离综合结论，不形成操作建议，等待可裁决冲突的 A 级来源。',
    rationale: '冲突证据不能被平均成看似确定的答案；风险门禁优先阻断错误传播。',
    evidenceBriefs: {
      ...scenario.evidenceBriefs,
      news: {
        ...scenario.evidenceBriefs.news,
        status: 'CONFLICT_INJECTED_FIXTURE',
        confidence: Math.min(scenario.evidenceBriefs.news.confidence, 61),
        headline: `故障注入：${scenario.evidenceBriefs.news.headline}`,
        summary: '实验控制器将舆情简报方向设置为与公告简报不一致，用于测试冲突治理。',
        findings: ['舆情方向与公告侧相反', '冲突标记已保留', '禁止主管静默择一'],
        evidence: [
          ...scenario.evidenceBriefs.news.evidence,
          systemEvidence('SIM-FAULT-CONFLICT', '模拟证据冲突标记', '故障种子 conflicting-evidence；不是金融事实证据'),
        ],
        gaps: ['可裁决冲突的新增 A 级来源'],
      },
    },
    synthesis: {
      ...scenario.synthesis,
      agreement: '专项简报仅在主体与时间窗口上匹配，方向性判断不一致。',
      conflicts: ['舆情与公告简报方向相反；主管拒绝合并为单一事实。'],
      missing: ['可裁决冲突的新增 A 级来源'],
      decision: 'QUARANTINE_SOURCE',
    },
    userReport: {
      ...scenario.userReport,
      status: '证据冲突已隔离',
      action: 'NO_ACTION_INSUFFICIENT_EVIDENCE',
      exposureSummary: `模拟关注权重 ${scenario.exposure}%；证据冲突时不生成任何仓位或交易建议。`,
      checklist: ['查看冲突的两份简报', '寻找新增 A 级来源', '不要根据冲突结果交易', '解除隔离后重新评估'],
    },
  });
}

function injectContractFailure(scenario) {
  return withFaultBase(scenario, 'contract-failure', {
    confidence: Math.min(scenario.confidence, 40),
    recommendation: '舆情 Agent 的原始输出未通过 EvidenceBrief 校验。系统拒收不合格 Patch，并生成可追踪的降级占位记录。',
    rationale: '结构化合同是 Agent 之间的安全边界；字段缺失时宁可显式降级，也不让自由文本直接进入主管结论。',
    evidenceBriefs: {
      ...scenario.evidenceBriefs,
      news: {
        ...scenario.evidenceBriefs.news,
        status: 'CONTRACT_REJECTED',
        confidence: 0,
        headline: '故障注入：EvidenceBrief 缺少必填字段，原始 Patch 已拒收',
        summary: '页面展示的是校验器生成的安全占位记录，不是被拒收的原始 Agent 输出。',
        findings: ['缺失字段：source locator（情景值）', '原始 Patch：REJECTED', '自由文本未进入主管上下文'],
        evidence: [
          systemEvidence('SIM-SCHEMA-REJECT', '模拟合同校验失败事件', '校验失败记录；不是金融事实证据'),
        ],
        gaps: ['一份通过 EvidenceBrief v1.1 校验的舆情简报'],
      },
    },
    synthesis: {
      ...scenario.synthesis,
      agreement: '公告简报可用；舆情简报因合同失败未进入主管事实集合。',
      conflicts: ['来源覆盖不完整，无法形成双来源判断。'],
      missing: ['通过合同校验的舆情简报', ...scenario.synthesis.missing],
      decision: 'WATCH_AND_VERIFY',
    },
    userReport: {
      ...scenario.userReport,
      status: '合同失败，安全降级',
      action: 'WATCH_FOR_CONFIRMATION',
      exposureSummary: `模拟关注权重 ${scenario.exposure}%；不合格 Agent 输出不参与操作判断。`,
      checklist: ['查看 REJECTED Patch', '修复缺失字段', '重新提交 EvidenceBrief', '校验通过后重新综合'],
    },
  });
}

export function applyFaultToScenario(scenario, fault = 'none', runId = 'DEMO') {
  const faulted = {
    none: () => scenario,
    'news-timeout': () => injectNewsTimeout(scenario),
    'stale-data': () => injectStaleData(scenario),
    'duplicate-source': () => injectDuplicateSource(scenario),
    'conflicting-evidence': () => injectConflict(scenario),
    'contract-failure': () => injectContractFailure(scenario),
  }[fault]?.() ?? scenario;

  return materializeScenarioRun(faulted, runId);
}

export function getAgentRuntime(phase, scenario, fault = 'none') {
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

    if (phase >= 2 && agent.key === 'news' && ['news-timeout', 'contract-failure'].includes(fault)) {
      status = '降级完成';
      latency = fault === 'news-timeout' ? 'timeout' : 'rejected';
    }

    if (phase >= 2 && agent.key === 'news' && fault === 'duplicate-source') {
      status = '去重完成';
    }

    if (phase >= 2 && agent.key === 'filing' && fault === 'stale-data') {
      status = '过期隔离';
    }

    return { ...agent, status, latency };
  });
}

export function getPatchLedger(scenario, phase, fault = 'none', reviewed = false) {
  const base = scenario.id === 'earnings' ? 242 : scenario.id === 'supply' ? 253 : 264;
  const instanceSuffix = scenario.runInstanceId ? `-${scenario.runInstanceId}` : '';
  const faultSuffix = scenario.activeFault ? `-${scenario.activeFault.toUpperCase()}` : '';
  const runSuffix = `${instanceSuffix}${faultSuffix}`;
  const patchIds = [0, 1, 2, 3].map((offset) => `PATCH-${base + offset}${runSuffix}`);
  const newsPatchStatus = fault === 'contract-failure' ? 'REJECTED' : phase >= 2 ? 'ACCEPTED' : phase === 1 ? 'RUNNING' : 'QUEUED';
  const filingPatchStatus = fault === 'stale-data' && phase >= 2 ? 'QUARANTINED' : phase >= 2 ? 'ACCEPTED' : phase === 1 ? 'RUNNING' : 'QUEUED';

  const ledger = [
    {
      id: patchIds[0],
      author: '舆情 Agent',
      target: `/briefs/news/${scenario.ticker}`,
      summary: phase >= 2 ? `status: ${scenario.evidenceBriefs.news.status} · rule_coverage: ${scenario.evidenceBriefs.news.confidence}%` : '等待 EvidenceBrief 提交',
      evidence: phase >= 2 ? scenario.evidenceBriefs.news.evidence.map((item) => item.id) : [],
      status: newsPatchStatus,
    },
    {
      id: patchIds[1],
      author: '公告 Agent',
      target: `/briefs/data/${scenario.ticker}`,
      summary: phase >= 2 ? `status: ${scenario.evidenceBriefs.filing.status} · rule_coverage: ${scenario.evidenceBriefs.filing.confidence}%` : '等待 EvidenceBrief 提交',
      evidence: phase >= 2 ? scenario.evidenceBriefs.filing.evidence.map((item) => item.id) : [],
      status: filingPatchStatus,
    },
    {
      id: patchIds[2],
      author: '主管 Agent',
      target: `/synthesis/${scenario.ticker}`,
      summary: phase >= 3 ? `decision: ${scenario.synthesis.decision} · conflicts: ${scenario.synthesis.conflicts.length}` : '等待两份 EvidenceBrief 或显式降级状态',
      evidence: phase >= 3 ? [patchIds[0], patchIds[1]] : [],
      status: phase >= 3 ? 'ACCEPTED' : phase === 2 ? 'RUNNING' : 'QUEUED',
    },
    {
      id: patchIds[3],
      author: '风险 Agent',
      target: `/reports/risk/${scenario.ticker}`,
      summary: phase >= 5 ? `action: ${scenario.userReport.action} · human_gate: REQUIRED` : '等待 SupervisorSynthesis 与风险解释',
      evidence: phase >= 5 ? [patchIds[2]] : [],
      status: phase >= 5 ? (isQuarantined(scenario) ? 'QUARANTINED' : 'USER_REVIEW') : phase >= 3 ? 'RUNNING' : 'QUEUED',
    },
  ];

  if (reviewed && phase >= 5) {
    ledger.push({
      id: `PATCH-${base + 4}${runSuffix}`,
      author: '用户',
      target: `/governance/review/${scenario.ticker}`,
      summary: 'acknowledged: true · trade_executed: false',
      evidence: [patchIds[3]],
      status: 'RECORDED',
    });
  }

  return ledger;
}

const baselineMetrics = {
  earnings: {
    flat: { officialCoverage: 72, conflictRetention: 55, unknownVisibility: 61, latency: 9.8, cost: 2.9, duplicate: 23, recovery: 58 },
    hierarchy: { officialCoverage: 96, conflictRetention: 93, unknownVisibility: 90, latency: 6.8, cost: 2.3, duplicate: 6, recovery: 90 },
    dynamic: { officialCoverage: 88, conflictRetention: 95, unknownVisibility: 96, latency: 6.7, cost: 2.4, duplicate: 6, recovery: 94 },
  },
  supply: {
    flat: { officialCoverage: 68, conflictRetention: 51, unknownVisibility: 57, latency: 8.9, cost: 2.8, duplicate: 21, recovery: 54 },
    hierarchy: { officialCoverage: 86, conflictRetention: 88, unknownVisibility: 85, latency: 7.4, cost: 2.5, duplicate: 9, recovery: 82 },
    dynamic: { officialCoverage: 90, conflictRetention: 96, unknownVisibility: 95, latency: 6.5, cost: 2.2, duplicate: 5, recovery: 96 },
  },
  rumor: {
    flat: { officialCoverage: 46, conflictRetention: 42, unknownVisibility: 40, latency: 8.2, cost: 2.7, duplicate: 26, recovery: 45 },
    hierarchy: { officialCoverage: 78, conflictRetention: 86, unknownVisibility: 83, latency: 7.0, cost: 2.4, duplicate: 10, recovery: 79 },
    dynamic: { officialCoverage: 94, conflictRetention: 98, unknownVisibility: 97, latency: 4.9, cost: 2.0, duplicate: 4, recovery: 98 },
  },
};

const faultAdjustments = {
  none: { flat: {}, hierarchy: {}, dynamic: {} },
  'news-timeout': {
    flat: { officialCoverage: -18, conflictRetention: -20, unknownVisibility: -10, latency: 5.2, cost: 0.7, duplicate: 12, recovery: -22 },
    hierarchy: { officialCoverage: -8, conflictRetention: -7, unknownVisibility: 0, latency: 2.6, cost: 0.4, duplicate: 4, recovery: -7 },
    dynamic: { officialCoverage: -3, conflictRetention: -2, unknownVisibility: 1, latency: 1.1, cost: 0.2, duplicate: 1, recovery: -1 },
  },
  'stale-data': {
    flat: { officialCoverage: -26, conflictRetention: -13, unknownVisibility: -12, latency: 2.4, cost: 0.5, duplicate: 4, recovery: -18 },
    hierarchy: { officialCoverage: -12, conflictRetention: -5, unknownVisibility: 1, latency: 1.7, cost: 0.3, duplicate: 2, recovery: -6 },
    dynamic: { officialCoverage: -5, conflictRetention: -1, unknownVisibility: 2, latency: 0.9, cost: 0.2, duplicate: 1, recovery: -1 },
  },
  'duplicate-source': {
    flat: { officialCoverage: -9, conflictRetention: -15, unknownVisibility: -11, latency: 1.9, cost: 0.5, duplicate: 28, recovery: -14 },
    hierarchy: { officialCoverage: -3, conflictRetention: -4, unknownVisibility: 0, latency: 1.2, cost: 0.3, duplicate: 9, recovery: -4 },
    dynamic: { officialCoverage: 0, conflictRetention: 0, unknownVisibility: 2, latency: 0.7, cost: 0.2, duplicate: 2, recovery: 0 },
  },
  'conflicting-evidence': {
    flat: { officialCoverage: -21, conflictRetention: -25, unknownVisibility: -16, latency: 3.0, cost: 0.6, duplicate: 16, recovery: -19 },
    hierarchy: { officialCoverage: -7, conflictRetention: -5, unknownVisibility: 1, latency: 2.2, cost: 0.4, duplicate: 5, recovery: -4 },
    dynamic: { officialCoverage: -2, conflictRetention: -1, unknownVisibility: 2, latency: 1.5, cost: 0.3, duplicate: 2, recovery: 0 },
  },
  'contract-failure': {
    flat: { officialCoverage: -22, conflictRetention: -18, unknownVisibility: -14, latency: 3.7, cost: 0.8, duplicate: 8, recovery: -24 },
    hierarchy: { officialCoverage: -10, conflictRetention: -6, unknownVisibility: 1, latency: 2.1, cost: 0.4, duplicate: 3, recovery: -8 },
    dynamic: { officialCoverage: -4, conflictRetention: -2, unknownVisibility: 2, latency: 1.0, cost: 0.2, duplicate: 1, recovery: -2 },
  },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function calculateScore(metric) {
  const latencyScore = clamp(100 - metric.latency * 5, 0, 100);
  const costScore = clamp(100 - metric.cost * 20, 0, 100);
  const duplicateScore = 100 - metric.duplicate;
  return Math.round(
    metric.officialCoverage * 0.24
    + metric.conflictRetention * 0.24
    + metric.unknownVisibility * 0.20
    + metric.recovery * 0.16
    + latencyScore * 0.06
    + costScore * 0.04
    + duplicateScore * 0.06,
  );
}

export function runOrganizationExperiment(scenarioId, faultId = 'none') {
  const scenarioMetrics = baselineMetrics[scenarioId] ?? baselineMetrics.earnings;
  const adjustments = faultAdjustments[faultId] ?? faultAdjustments.none;

  const results = organizationModes.map((organization) => {
    const base = scenarioMetrics[organization.id];
    const delta = adjustments[organization.id] ?? {};
    const metric = {
      officialCoverage: clamp(base.officialCoverage + (delta.officialCoverage ?? 0), 0, 100),
      conflictRetention: clamp(base.conflictRetention + (delta.conflictRetention ?? 0), 0, 100),
      unknownVisibility: clamp(base.unknownVisibility + (delta.unknownVisibility ?? 0), 0, 100),
      latency: Number((base.latency + (delta.latency ?? 0)).toFixed(1)),
      cost: Number(Math.min(3.5, base.cost + (delta.cost ?? 0)).toFixed(1)),
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
      'headline',
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

  ['id', 'schemaVersion', 'synthesisId', 'humanGate', 'status', 'action', 'exposureSummary', 'checklist'].forEach((field) => {
    if (scenario.userReport?.[field] === undefined || scenario.userReport?.[field] === null) errors.push(`missing:userReport.${field}`);
  });

  if (JSON.stringify(scenario.sourceRefs) !== JSON.stringify(scenario.synthesis?.inputBriefIds)) errors.push('source_refs_must_match_synthesis_inputs');
  if (scenario.userReport?.synthesisId !== scenario.synthesis?.id) errors.push('report_must_reference_synthesis');
  if (scenario.controls?.humanGate !== true) errors.push('human_gate_must_be_true');
  if (scenario.userReport?.humanGate !== true) errors.push('user_report_human_gate_must_be_true');
  return errors;
}
