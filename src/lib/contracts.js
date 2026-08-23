import Ajv2020 from 'ajv/dist/2020.js';
import eventSchema from '../../docs/contracts/event.schema.json' with { type: 'json' };
import evidenceBriefSchema from '../../docs/contracts/evidence-brief.schema.json' with { type: 'json' };
import supervisorSynthesisSchema from '../../docs/contracts/supervisor-synthesis.schema.json' with { type: 'json' };
import userRiskReportSchema from '../../docs/contracts/user-risk-report.schema.json' with { type: 'json' };

const ajv = new Ajv2020({ allErrors: true, strict: true });

const validators = {
  event: ajv.compile(eventSchema),
  evidenceBrief: ajv.compile(evidenceBriefSchema),
  supervisorSynthesis: ajv.compile(supervisorSynthesisSchema),
  userRiskReport: ajv.compile(userRiskReportSchema),
};

function normalizeErrors(errors = []) {
  return errors.map((error) => ({
    path: error.instancePath || '/',
    keyword: error.keyword,
    message: error.message ?? '合同校验失败',
    params: error.params,
  }));
}

function validateWith(validator, value) {
  const valid = validator(value);
  return {
    valid,
    errors: valid ? [] : normalizeErrors(validator.errors),
  };
}

export function validateEvidenceBrief(brief) {
  const schemaResult = validateWith(validators.evidenceBrief, brief);
  if (!schemaResult.valid) return schemaResult;

  const evidenceIds = new Set(brief.evidence.map((item) => item.id));
  const semanticErrors = [];
  if (evidenceIds.size !== brief.evidence.length) {
    semanticErrors.push({
      path: '/evidence',
      keyword: 'uniqueEvidenceIds',
      message: '同一简报内的 Evidence ID 必须唯一',
      params: {},
    });
  }
  if (new Set(brief.claims.map((claim) => claim.id)).size !== brief.claims.length) {
    semanticErrors.push({
      path: '/claims',
      keyword: 'uniqueClaimIds',
      message: '同一简报内的 Claim ID 必须唯一',
      params: {},
    });
  }

  semanticErrors.push(...brief.claims.flatMap((claim) => (
    claim.evidenceIds
      .filter((evidenceId) => !evidenceIds.has(evidenceId))
      .map((evidenceId) => ({
        path: `/claims/${claim.id}/evidenceIds`,
        keyword: 'evidenceReference',
        message: `引用了不存在的证据 ${evidenceId}`,
        params: { evidenceId },
      }))
  )));

  return {
    valid: semanticErrors.length === 0,
    errors: semanticErrors,
  };
}

export function validateRunContracts(scenario) {
  const event = Object.fromEntries([
    'id',
    'schemaVersion',
    'dataMode',
    'ticker',
    'eventType',
    'title',
    'asOf',
    'sourceRefs',
  ].map((field) => [field, scenario[field]]));

  const results = [
    { artifact: 'Event', ...validateWith(validators.event, event) },
    { artifact: 'EvidenceBrief.news', ...validateEvidenceBrief(scenario.evidenceBriefs.news) },
    { artifact: 'EvidenceBrief.filing', ...validateEvidenceBrief(scenario.evidenceBriefs.filing) },
    { artifact: 'SupervisorSynthesis', ...validateWith(validators.supervisorSynthesis, scenario.synthesis) },
    { artifact: 'UserRiskReport', ...validateWith(validators.userRiskReport, scenario.userReport) },
  ];

  const crossContractErrors = [];
  const claims = Object.values(scenario.evidenceBriefs).flatMap((brief) => brief.claims);
  const claimIds = claims.map((claim) => claim.id);
  const expectedClaimStates = {
    confirmed: claims.filter((claim) => claim.state === 'CONFIRMED').map((claim) => claim.id),
    pendingVerification: claims.filter((claim) => claim.state === 'PENDING_VERIFICATION').map((claim) => claim.id),
    unknown: claims.filter((claim) => claim.state === 'UNKNOWN').map((claim) => claim.id),
  };
  const expectedFactStateSummary = Object.fromEntries(
    Object.entries(expectedClaimStates).map(([state, ids]) => [state, ids.length]),
  );

  if (new Set(claimIds).size !== claimIds.length) {
    crossContractErrors.push({
      path: '/evidenceBriefs',
      keyword: 'uniqueClaimIds',
      message: '两份 EvidenceBrief 中的 Claim ID 必须全局唯一',
      params: {},
    });
  }
  if (JSON.stringify(scenario.sourceRefs) !== JSON.stringify(scenario.synthesis.inputBriefIds)) {
    crossContractErrors.push({
      path: '/sourceRefs',
      keyword: 'lineage',
      message: 'Event sourceRefs 必须与 Supervisor 输入简报一致',
      params: {},
    });
  }
  if (JSON.stringify(scenario.sourceRefs) !== JSON.stringify(scenario.userReport.sourceRefs)) {
    crossContractErrors.push({
      path: '/userReport/sourceRefs',
      keyword: 'lineage',
      message: 'UserRiskReport 必须保留两份输入简报引用',
      params: {},
    });
  }
  if (scenario.userReport.synthesisId !== scenario.synthesis.id) {
    crossContractErrors.push({
      path: '/userReport/synthesisId',
      keyword: 'lineage',
      message: 'UserRiskReport 必须引用本次 SupervisorSynthesis',
      params: {},
    });
  }
  if (JSON.stringify(expectedClaimStates) !== JSON.stringify(scenario.synthesis.claimStates)) {
    crossContractErrors.push({
      path: '/synthesis/claimStates',
      keyword: 'claimStateLineage',
      message: 'SupervisorSynthesis 必须完整保留两份简报的 Claim 状态',
      params: { expected: expectedClaimStates },
    });
  }
  if (JSON.stringify(expectedFactStateSummary) !== JSON.stringify(scenario.userReport.factStateSummary)) {
    crossContractErrors.push({
      path: '/userReport/factStateSummary',
      keyword: 'claimStateSummary',
      message: 'UserRiskReport 的事实状态计数必须与输入 Claim 一致',
      params: { expected: expectedFactStateSummary },
    });
  }
  if (scenario.userReport.asOf !== scenario.asOf) {
    crossContractErrors.push({
      path: '/userReport/asOf',
      keyword: 'asOfLineage',
      message: 'UserRiskReport 必须保留本次事件的数据时间',
      params: { expected: scenario.asOf },
    });
  }
  results.push({
    artifact: 'CrossContractLineage',
    valid: crossContractErrors.length === 0,
    errors: crossContractErrors,
  });

  return {
    valid: results.every((result) => result.valid),
    checkedAt: 'DETERMINISTIC_RUNTIME',
    schemaVersion: '1.2',
    results,
    errors: results.flatMap((result) => result.errors.map((error) => ({
      artifact: result.artifact,
      ...error,
    }))),
  };
}
