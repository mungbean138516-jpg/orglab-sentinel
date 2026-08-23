import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Check,
  ChevronRight,
  Cloud,
  Database,
  Eye,
  FileCheck2,
  FileWarning,
  FlaskConical,
  Gauge,
  GitCommitHorizontal,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Network,
  Newspaper,
  Pause,
  Play,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  Workflow,
  X,
  Zap,
} from 'lucide-react';
import {
  DEMO_NOTICE,
  eventTags,
  faults,
  holdings,
  integrationCapabilities,
  scenarios,
  sourceTrustLevels,
} from './data/demoData.js';
import {
  applyFaultToScenario,
  getAgentRuntime,
  getPatchLedger,
  getScenario,
  isQuarantined,
  runOrganizationExperiment,
} from './lib/simulation.js';
import {
  AllocationDonut,
  EvidenceBalance,
  ThresholdTrendChart,
} from './components/RiskVisuals.jsx';

const pageNames = {
  dashboard: '情报概览',
  agents: '核验记录',
  architecture: '数据与服务',
  lab: '风险演练',
};

export default function App() {
  const isMobile = useIsMobile();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const [runId, setRunId] = useState(1);
  const [phase, setPhase] = useState(5);
  const [fault, setFault] = useState('none');
  const [toast, setToast] = useState('');
  const [drawer, setDrawer] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reviewedRuns, setReviewedRuns] = useState({});
  const toastTimer = useRef(null);

  const scenario = useMemo(() => getScenario(scenarioId), [scenarioId]);
  const runScenarioView = useMemo(
    () => applyFaultToScenario(scenario, fault, runId),
    [scenario, fault, runId],
  );
  const runtimeAgents = useMemo(
    () => getAgentRuntime(phase, runScenarioView, fault),
    [phase, runScenarioView, fault],
  );
  const reviewKey = `${runId}:${fault}`;
  const runReviewed = Boolean(reviewedRuns[reviewKey]);
  const ledger = useMemo(
    () => getPatchLedger(runScenarioView, phase, fault, runReviewed),
    [runScenarioView, phase, fault, runReviewed],
  );

  useEffect(() => {
    if (phase >= 5) return undefined;
    const timer = window.setTimeout(() => setPhase((current) => current + 1), 580);
    return () => window.clearTimeout(timer);
  }, [phase, runId]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      setDrawer(null);
      setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const showToast = (message) => {
    window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(''), 2800);
  };

  const runScenario = (nextScenario, nextFault = fault) => {
    setScenarioId(nextScenario.id);
    setFault(nextFault);
    setPhase(0);
    setRunId((current) => current + 1);
    setDrawer(null);
    showToast(`正在更新「${nextScenario.short}」`);
  };

  const navigate = (next) => {
    setActiveNav(next);
    setMenuOpen(false);
  };

  const markReviewed = () => {
    setReviewedRuns((current) => ({ ...current, [reviewKey]: true }));
    showToast('已标记为已读');
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <aside
        id="primary-navigation"
        className={`sidebar ${menuOpen ? 'open' : ''}`}
        aria-hidden={isMobile && !menuOpen ? true : undefined}
        inert={drawer || (isMobile && !menuOpen) ? true : undefined}
      >
        <div className="brand">
          <div className="brand-mark"><Activity size={21} aria-hidden="true" /></div>
          <div><strong>OrgLab</strong><span>Sentinel · CN A</span></div>
        </div>
        <nav aria-label="主要导航">
          <NavItem icon={LayoutDashboard} label="情报概览" active={activeNav === 'dashboard'} onClick={() => navigate('dashboard')} />
          <NavItem icon={Users} label="核验记录" active={activeNav === 'agents'} onClick={() => navigate('agents')} />
          <NavItem icon={Cloud} label="数据与服务" active={activeNav === 'architecture'} onClick={() => navigate('architecture')} />
          <NavItem icon={FlaskConical} label="风险演练" active={activeNav === 'lab'} onClick={() => navigate('lab')} />
        </nav>
        <div className="sidebar-bottom">
          <div className="runtime-status"><span className="pulse-dot" />系统可用</div>
          <div className="disclaimer">MOCK ACTIVE · NO TRADING</div>
        </div>
      </aside>

      {menuOpen && <button className="sidebar-backdrop" aria-label="关闭导航" onClick={() => setMenuOpen(false)} />}

      <main id="main-content" aria-hidden={drawer ? true : undefined} inert={drawer ? true : undefined}>
        <header className="topbar">
          <button
            className="mobile-menu"
            type="button"
            aria-label={menuOpen ? '关闭导航' : '打开导航'}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="crumb"><span>OrgLab Sentinel</span><ChevronRight size={14} aria-hidden="true" /><b>{pageNames[activeNav]}</b></div>
          <div className="top-actions">
            <span className="demo-pill"><span />MOCK ACTIVE</span>
            <button className="icon-button" type="button" aria-label="查看通知" onClick={() => setDrawer('notifications')}>
              <Bell size={18} />
            </button>
            <div className="avatar" aria-label="当前用户">用</div>
          </div>
        </header>

        <div className="demo-banner" role="note">
          <FlaskConical size={15} aria-hidden="true" />
          <strong>演示环境</strong>
          <span>{DEMO_NOTICE}</span>
          <code>data_mode: MOCK</code>
        </div>

        {activeNav === 'dashboard' && (
          <Dashboard
            scenario={runScenarioView}
            phase={phase}
            runtimeAgents={runtimeAgents}
            ledger={ledger}
            reviewed={runReviewed}
            runScenario={runScenario}
            showToast={showToast}
            openDrawer={setDrawer}
          />
        )}
        {activeNav === 'agents' && (
          <AgentsPage runtimeAgents={runtimeAgents} openDrawer={setDrawer} />
        )}
        {activeNav === 'architecture' && <ArchitecturePage />}
        {activeNav === 'lab' && (
          <LabPage
            scenario={scenario}
            fault={fault}
            runScenario={runScenario}
          />
        )}
      </main>

      {drawer && (
        <Drawer title={drawerTitle(drawer)} onClose={() => setDrawer(null)} wide={drawer === 'sources'}>
          {drawer === 'report' && <RiskReport scenario={runScenarioView} reviewed={runReviewed} onReview={markReviewed} />}
          {drawer === 'ledger' && <LedgerView ledger={ledger} />}
          {drawer === 'sources' && <EvidenceView scenario={runScenarioView} />}
          {drawer === 'rules' && <RulesView />}
          {drawer === 'notifications' && <NotificationsView scenario={runScenarioView} phase={phase} />}
          {drawer === 'holdings' && <HoldingsDetail />}
        </Drawer>
      )}

      {toast && <div className="toast" role="status" aria-live="polite"><Zap size={16} />{toast}</div>}
    </div>
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => (
    typeof window === 'undefined' ? false : window.matchMedia('(max-width: 860px)').matches
  ));

  useEffect(() => {
    const query = window.matchMedia('(max-width: 860px)');
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return isMobile;
}

function drawerTitle(type) {
  return {
    report: '风险报告',
    ledger: '变更记录',
    sources: '来源详情',
    rules: '核验规则',
    notifications: '通知',
    holdings: '关注组合',
  }[type];
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button className={`nav-item ${active ? 'active' : ''}`} type="button" aria-current={active ? 'page' : undefined} onClick={onClick}>
      <Icon size={18} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

function Dashboard({ scenario, phase, runtimeAgents, ledger, reviewed, runScenario, showToast, openDrawer }) {
  const reportReady = phase >= 5;
  const quarantined = isQuarantined(scenario);
  const allEvidence = Object.values(scenario.evidenceBriefs)
    .flatMap((brief) => brief.evidence)
    .filter((item) => item.tier !== '系统事件');
  const verifiedEvidence = allEvidence.filter((item) => item.verified).length;
  const officialEvidence = scenario.evidenceBriefs.filing.evidence.filter(
    (item) => item.verified && item.tier.startsWith('A'),
  ).length;
  const currentFault = faults.find((item) => item.id === scenario.activeFault);

  return (
    <div className="page dashboard-page" aria-busy={phase < 5}>
      <section className="page-heading">
        <div>
          <span className="eyebrow">今日风险概览</span>
          <h1>{quarantined ? '发现未证实信息，已隔离' : `${scenario.severity}：${scenario.short}`}</h1>
          <p>{reportReady ? scenario.recommendation : '正在更新核验结果…'}</p>
        </div>
        <ScenarioMenu current={scenario.id} onSelect={(next) => runScenario(next)} />
      </section>

      <section className="metrics-grid" aria-label="演示运行摘要">
        <Metric icon={FileCheck2} label="已核验证据" value={phase < 2 ? '采集中' : `${verifiedEvidence} 条`} type="source" />
        <Metric icon={AlertTriangle} label="待解冲突" value={phase < 3 ? '待汇总' : `${scenario.synthesis.conflicts.length} 项`} type={scenario.synthesis.conflicts.length ? 'warning' : 'success'} />
        <Metric icon={Gauge} label="信息缺口" value={phase < 3 ? '待汇总' : `${scenario.synthesis.missing.length} 项`} type="neutral" />
        <Metric icon={UserCheck} label="阅读确认" value={!reportReady ? '等待报告' : reviewed ? '已阅读' : '待确认'} type="success" />
      </section>

      <section className="work-grid">
        <div className="panel holdings-panel">
          <PanelTitle title="模拟关注组合" subtitle="虚构证券 · 权重表示核验顺序" action="说明" onAction={() => openDrawer('holdings')} />
          <AllocationDonut holdings={holdings} />
          <div className="holding-list compact">
            {holdings.map((holding) => (
              <div className="holding" key={holding.ticker}>
                <div className="stock-icon" style={{ '--stock': holding.color }}>{holding.name.at(-1)}</div>
                <div className="stock-name"><b>{holding.name}</b><span>{holding.market} · {holding.ticker}</span></div>
                <div className="holding-stat"><span>关注权重</span><b>{holding.allocation}%</b></div>
                <span className={`evidence-state state-${holding.evidenceTone}`}>{holding.evidenceState}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`panel alert-panel ${quarantined ? 'quarantine' : ''}`}>
          <div className="alert-topline">
            <span className={`alert-badge ${quarantined ? 'isolated' : scenario.activeFault ? 'faulted' : ''}`}>
              {!reportReady ? <RefreshCw className="spin" size={15} /> : quarantined ? <LockKeyhole size={15} /> : <AlertTriangle size={15} />}
              {!reportReady ? '分析进行中' : quarantined ? '信息已隔离' : scenario.severity}
            </span>
            <span>{scenario.ticker} · 最新核验结果</span>
          </div>
          <h2>{scenario.title}</h2>
          <div className="source-row">
            <span className="source-chip">演示数据</span>
            {reportReady && (
              <span className="source-chip">
                合同 v{scenario.contractValidation?.schemaVersion} · {scenario.contractValidation?.valid ? 'PASS' : 'FAIL'}
              </span>
            )}
            {currentFault && <span className="fault-chip">FAULT · {currentFault.label}</span>}
            <span>核验覆盖 {reportReady ? `${scenario.verificationCoverage}%` : '计算中'}</span>
            <span>官方证据 {officialEvidence} 条</span>
          </div>
          <div className="conclusion-box">
            <div className="suggestion-label">{!reportReady ? '等待核验' : '核验结论'}</div>
            <p>{reportReady ? scenario.rationale : '正在更新，请稍候。'}</p>
            <div className="non-advice"><ShieldCheck size={16} /><span>仅解释信息风险，不预测收益或提供交易建议。</span></div>
          </div>
          {reportReady && <EvidenceBalance scenario={scenario} />}
          <div className="alert-actions">
            <button className="primary-action" type="button" disabled={phase < 5} onClick={() => openDrawer('report')}>
              {phase < 5 ? <><RefreshCw className="spin" size={16} />生成中</> : <><Eye size={16} />查看完整报告</>}
            </button>
            <button className="secondary-action" type="button" onClick={() => showToast('已添加演示提醒；刷新后清除')}>稍后提醒</button>
          </div>
        </div>
      </section>

      <section className="source-grid" aria-label="专项 Agent 简报">
        <EvidenceBriefCard type="news" brief={scenario.evidenceBriefs.news} phase={phase} onOpen={() => openDrawer('sources')} />
        <EvidenceBriefCard type="filing" brief={scenario.evidenceBriefs.filing} phase={phase} onOpen={() => openDrawer('sources')} />
      </section>

      <section className="panel workflow-panel">
        <PanelTitle title="本次核验记录" subtitle="舆情、公告和结论均可追溯" action="全部记录" onAction={() => openDrawer('ledger')} />
        <PipelineFlow agents={runtimeAgents} phase={phase} reviewed={reviewed} />
        <PatchPreview patch={ledger.at(-1)} phase={phase} />
      </section>
    </div>
  );
}

function ScenarioMenu({ current, onSelect }) {
  return (
    <div className="scenario-menu">
      <span>选择演示事件</span>
      <div>
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            className={current === scenario.id ? 'selected' : ''}
            type="button"
            aria-pressed={current === scenario.id}
            onClick={() => onSelect(scenario)}
          >
            {scenario.short}
          </button>
        ))}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, sub, type }) {
  return (
    <article className={`metric-card metric-${type}`}>
      <div className="metric-icon"><Icon size={18} aria-hidden="true" /></div>
      <div><span>{label}</span><strong>{value}</strong>{sub && <small>{sub}</small>}</div>
    </article>
  );
}

function PanelTitle({ title, subtitle, action, onAction }) {
  return (
    <div className="panel-title">
      <div><h3>{title}</h3><p>{subtitle}</p></div>
      {onAction && <button type="button" onClick={onAction}>{action}<ChevronRight size={14} /></button>}
    </div>
  );
}

function EvidenceBriefCard({ type, brief, phase, onOpen }) {
  const isNews = type === 'news';
  const Icon = isNews ? Newspaper : Database;
  const ready = phase >= 2;
  const degraded = ready && ['SOURCE_TIMEOUT', 'CONTRACT_REJECTED', 'STALE_SOURCE_FIXTURE'].includes(brief.status);
  const statusLabel = degraded ? '安全降级' : ready ? '已提交' : phase === 1 ? '分析中' : '等待';
  return (
    <article className={`panel source-brief ${isNews ? 'news-brief' : 'data-brief'}`}>
      <div className="source-brief-heading">
        <div className="source-icon"><Icon size={19} /></div>
        <div><span>{isNews ? '舆情来源' : '官方来源'}</span><h3>{isNews ? '舆情核验' : '公告核验'}</h3></div>
        <span className={`brief-status ${ready ? 'ready' : ''} ${degraded ? 'degraded' : ''}`}>{statusLabel}</span>
      </div>
      <h4>{ready ? brief.headline : phase === 1 ? '正在核验…' : '等待开始'}</h4>
      <p>{ready ? brief.summary : '简报通过格式校验后，才会进入汇总。'}</p>
      <div className="brief-meta"><span>数据：{brief.dataMode}</span><span>证据：{ready ? brief.evidence.length : '—'}</span><span>覆盖：{ready ? `${brief.verificationCoverage}%` : '—'}</span></div>
      <button type="button" className="text-action" disabled={!ready} onClick={onOpen}>{ready ? '查看证据' : '等待提交'} <ChevronRight size={14} /></button>
    </article>
  );
}

function PipelineFlow({ agents, phase, reviewed }) {
  const news = agents.find((agent) => agent.key === 'news');
  const filing = agents.find((agent) => agent.key === 'filing');
  const supervisor = agents.find((agent) => agent.key === 'supervisor');
  const risk = agents.find((agent) => agent.key === 'risk');
  return (
    <div className="pipeline-scroll" aria-label="舆情与公告 Agent 逻辑并行，之后依次经过主管、风险解释 Agent 和用户门禁">
      <div className="pipeline-flow">
        <div className="parallel-sources">
          <AgentNode agent={news} />
          <AgentNode agent={filing} />
        </div>
        <div className={`merge-arrow ${phase >= 2 ? 'done' : ''}`}><Network size={19} /><span>EvidenceBrief 汇合</span></div>
        <AgentNode agent={supervisor} />
        <FlowArrow done={phase >= 3} />
        <AgentNode agent={risk} />
        <FlowArrow done={phase >= 5} />
        <div className={`user-gate ${phase >= 5 ? 'ready' : ''} ${reviewed ? 'reviewed' : ''}`}><UserCheck size={21} /><b>用户门禁</b><span>{reviewed ? '已阅读 · 未交易' : phase >= 5 ? '报告待阅读' : '等待报告'}</span></div>
      </div>
    </div>
  );
}

function FlowArrow({ done }) {
  return <div className={`flow-arrow ${done ? 'done' : ''}`}><ChevronRight size={18} /></div>;
}

function AgentNode({ agent }) {
  const Icon = agent.icon;
  const working = agent.status === '工作中';
  const complete = ['已提交', '已综合', '已汇报', '已隔离', '降级完成', '去重完成', '过期隔离'].includes(agent.status);
  return (
    <div className={`agent-node tone-${agent.tone} ${working ? 'working' : ''} ${complete ? 'complete' : ''}`}>
      <div className="agent-avatar"><Icon size={18} /></div>
      <b>{agent.shortName}</b>
      <span>{agent.stage}</span>
      <small>
        {working && <><RefreshCw className="spin" size={12} />工作中</>}
        {complete && <><Check size={12} />{agent.status}</>}
        {!working && !complete && <><Pause size={11} />等待</>}
      </small>
    </div>
  );
}

function PatchPreview({ patch, phase }) {
  return (
    <div className="patch-row">
      <div><GitCommitHorizontal size={18} /><span><b>{patch.id}</b> {patch.target}</span></div>
      <code>{patch.summary}</code>
      <span className={`patch-state ${phase >= 5 ? 'complete' : ''}`}>{patch.status}</span>
    </div>
  );
}

function AgentsPage({ runtimeAgents, openDrawer }) {
  return (
    <div className="page">
      <section className="page-heading">
        <div><span className="eyebrow">核验记录</span><h1>本次核验已完成</h1><p>4 个环节均已留痕，可查看状态、依据和输出。</p></div>
        <button className="outline-button" type="button" onClick={() => openDrawer('rules')}><LockKeyhole size={17} />核验规则</button>
      </section>

      <section className="runtime-truth panel">
        <div className="truth-card current">
          <span>当前环境</span>
          <h3><Server size={19} />演示数据已就绪</h3>
          <p>所有核验结果均来自固定数据，可重复查看。</p>
        </div>
        <ChevronRight className="truth-arrow" size={22} />
        <div className="truth-card target">
          <span>外部服务</span>
          <h3><Cloud size={19} />暂未连接</h3>
          <p>真实模型、数据源和协作工具当前均未启用。</p>
        </div>
      </section>

      <section className="topology-callout panel">
        <div><Newspaper size={18} /><Database size={18} /><span>两份独立 EvidenceBrief</span></div>
        <ChevronRight size={18} />
        <div><Network size={18} /><span>主管保留冲突与缺口</span></div>
        <ChevronRight size={18} />
        <div><ShieldCheck size={18} /><span>风险解释 + 人工门禁</span></div>
      </section>

      <section className="agents-grid">
        {runtimeAgents.map((agent, index) => {
          const Icon = agent.icon;
          const statusTone = ['降级完成', '已隔离', '过期隔离'].includes(agent.status)
            ? 'warning'
            : agent.status === '等待'
              ? 'idle'
              : 'good';
          return (
            <article className="agent-card" key={agent.key}>
              <div className={`big-agent-icon tone-${agent.tone}`}><Icon size={24} /></div>
              <div className="agent-card-heading"><span>L{index + 1} · {agent.stage}</span><h3>{agent.name}</h3><p>{agent.role}</p></div>
              <dl>
                <div><dt>本次状态</dt><dd className={`agent-status status-${statusTone}`}><span />{agent.status}</dd></div>
                <div><dt>核验覆盖</dt><dd>{agent.reliability}%</dd></div>
                <div><dt>处理记录</dt><dd>{agent.demoRuns}</dd></div>
                <div><dt>输出格式</dt><dd>{agent.output}</dd></div>
              </dl>
              <div className="tool-state"><Workflow size={14} /><span>{agent.tool}</span></div>
              <div className="permission"><LockKeyhole size={14} /><span>可更新范围</span>{agent.permission.map((entry) => <code key={entry}>{entry}</code>)}</div>
              <div className="cannot"><AlertTriangle size={14} /><span>{agent.cannot}</span></div>
            </article>
          );
        })}
      </section>

      <section className="panel constitution-panel">
        <div><Sparkles size={21} /><div><h3>核验原则</h3><p>官方信息优先 · 冲突原样保留 · 热搜只作线索 · 结果由用户确认</p></div></div>
        <button type="button" onClick={() => openDrawer('rules')}>全部规则</button>
      </section>
    </div>
  );
}

function ArchitecturePage() {
  const targetSteps = [
    ['01', '入口', '网页 / 通义 / 夸克 / 钉钉', 'ROADMAP'],
    ['02', '总调度', '百炼 Workflow', 'PLANNED'],
    ['03', '岗位能力', '通义千问专项、主管与风险角色', 'PLANNED'],
    ['04', '工具连接', 'MCP + 官方披露适配器', 'PLANNED'],
    ['05', '确定性治理', 'EvidenceBrief v1.2 + Patch 账本', 'IMPLEMENTED'],
    ['06', '人工复核', '网页门禁 / 钉钉协同', 'MOCK / ROADMAP'],
  ];

  return (
    <div className="page architecture-page">
      <section className="page-heading">
        <div><h1>数据与服务</h1></div>
      </section>

      <section className="architecture-stage panel">
        <div className="architecture-track">
          {targetSteps.map(([id, layer, name, state], index) => (
            <React.Fragment key={id}>
              <article className={`architecture-node ${state.includes('IMPLEMENTED') ? 'implemented' : 'planned'}`}>
                <span>{id} · {layer}</span>
                <h3>{name}</h3>
                <code>{state}</code>
              </article>
              {index < targetSteps.length - 1 && <ChevronRight className="architecture-arrow" size={20} />}
            </React.Fragment>
          ))}
        </div>
        <div className="architecture-explainer">
          <ShieldCheck size={18} />
          <p><b>当前状态：</b>仅固定演示数据可用，其余服务尚未连接。</p>
        </div>
      </section>

      <section className="capability-grid">
        {integrationCapabilities.map((capability) => (
          <article className={`capability-card tone-${capability.tone}`} key={capability.id}>
            <div><span>{capability.layer}</span><StatusPill state={capability.state} /></div>
            <h3>{capability.name}</h3>
            <p>{capability.description}</p>
          </article>
        ))}
      </section>

      <section className="mcp-grid">
        <article className="panel mcp-card">
          <div className="mcp-heading"><Newspaper size={21} /><div><span>TOOL · PLANNED</span><h3>中文趋势聚合 MCP</h3></div></div>
          <p>发现公开讨论线索。热度只能触发核验，不能证明事实。</p>
          <ul><li>进入：中文舆情 Agent</li><li>信任等级：D 级线索</li><li>强制：同源去重、链接与时间戳</li></ul>
        </article>
        <article className="panel mcp-card">
          <div className="mcp-heading"><Database size={21} /><div><span>TOOL · AUTH REQUIRED</span><h3>天眼查 MCP</h3></div></div>
          <p>核验企业主体、股权和司法信息，不能替代交易所公告。</p>
          <ul><li>进入：公告数据 Agent</li><li>信任等级：B 级企业事实</li><li>强制：服务端密钥、授权与调用留痕</li></ul>
        </article>
      </section>

      <section className="panel trust-panel">
        <PanelTitle title="来源可信度" subtitle="以官方披露为准，公共讨论仅作线索" />
        <div className="trust-ladder">
          {sourceTrustLevels.map((level) => (
            <article className={`trust-level trust-${level.tone}`} key={level.grade}>
              <b>{level.grade}</b><div><h3>{level.title}</h3><p>{level.description}</p></div><span>{level.use}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="platform-vision panel">
        <div><Sparkles size={22} /></div>
        <section><span>后续支持范围</span><h3>供应链、旅行异常和合作方核验</h3><p>相关入口尚未开放。</p></section>
        <code>ROADMAP · TARGET HYPOTHESIS</code>
      </section>
    </div>
  );
}

function StatusPill({ state }) {
  const tone = state.includes('IMPLEMENTED') || state.includes('MOCK ACTIVE')
    ? 'implemented'
    : state.includes('AUTH')
      ? 'auth'
      : state.includes('ROADMAP')
        ? 'roadmap'
        : 'planned';
  return <code className={`status-pill status-${tone}`}>{state}</code>;
}

function LabPage({ scenario, fault, runScenario }) {
  const [running, setRunning] = useState(false);
  const [resultConfig, setResultConfig] = useState({ scenarioId: scenario.id, faultId: fault });
  const [selectedScenarioId, setSelectedScenarioId] = useState(scenario.id);
  const [selectedFaultId, setSelectedFaultId] = useState(fault);
  const experimentTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(experimentTimer.current), []);

  const startExperiment = () => {
    const config = { scenarioId: selectedScenarioId, faultId: selectedFaultId };
    setRunning(true);
    experimentTimer.current = window.setTimeout(() => {
      setResultConfig(config);
      runScenario(getScenario(config.scenarioId), config.faultId);
      setRunning(false);
    }, 1000);
  };

  const results = useMemo(
    () => runOrganizationExperiment(resultConfig.scenarioId, resultConfig.faultId),
    [resultConfig],
  );
  const winner = results.find((result) => result.winner);
  const resultScenario = getScenario(resultConfig.scenarioId);
  const resultFault = faults.find((item) => item.id === resultConfig.faultId) ?? faults[0];

  return (
    <div className="page">
      <section className="page-heading">
        <div><span className="eyebrow">风险演练</span><h1>选择场景并查看结果</h1><p>可测试超时、过期、重复来源和证据冲突。</p></div>
        <button className="primary-action" type="button" disabled={running} onClick={startExperiment}>
          {running ? <><RefreshCw className="spin" size={16} />运行中</> : <><Play size={16} />开始演练</>}
        </button>
      </section>

      <section className="experiment-controls panel">
        <div className="control-group"><span className="step-label">1 · 固定事件</span><div className="scenario-pills">{scenarios.map((item) => <button type="button" disabled={running} aria-pressed={item.id === selectedScenarioId} className={item.id === selectedScenarioId ? 'active' : ''} onClick={() => setSelectedScenarioId(item.id)} key={item.id}>{item.short}</button>)}</div></div>
        <div className="event-tag-bank"><span>场景覆盖标签</span>{eventTags.map((tag) => <i key={tag}>{tag}</i>)}</div>
        <div className="control-group"><span className="step-label">2 · 注入故障</span><div className="scenario-pills fault-pills">{faults.map((item) => <button type="button" title={item.detail} disabled={running} aria-pressed={item.id === selectedFaultId} className={item.id === selectedFaultId ? 'active' : ''} onClick={() => setSelectedFaultId(item.id)} key={item.id}>{item.label}</button>)}</div></div>
        <div className="experiment-locks"><span><LockKeyhole size={13} />目标预算 ¥3.50</span><span><LockKeyhole size={13} />固定 fixture</span><span><LockKeyhole size={13} />seed 20260722</span><span><LockKeyhole size={13} />合同 v1.2</span></div>
      </section>

      <div className="result-caption">
        <span>最近一次结果</span>
        <b>{resultScenario.short} · {resultFault.label}</b>
        <code>n=1 deterministic replay</code>
      </div>

      <section className="comparison-grid">
        {results.map((result) => <OrgCard key={result.id} result={result} />)}
      </section>

      <section className="panel findings">
        <div className="finding-icon"><BarChart3 size={21} /></div>
        <div><span>本次结果</span><h3>{winner.name}综合表现最高</h3><p>{conclusionFor(winner.id, resultConfig.faultId)}</p></div>
        <div className="sample-badge"><b>n = 1</b><span>不代表统计显著</span></div>
      </section>

      <p className="formula-note">综合分用于比较本次演练表现，不代表真实业务效果或金融预测。</p>
    </div>
  );
}

function conclusionFor(winnerId, faultId) {
  if (faultId === 'news-timeout') return '动态风控显式记录趋势源超时，并让公告链路继续，避免把缺失来源误读为没有风险。';
  if (faultId === 'stale-data') return '动态风控识别数据时效并隔离旧公告，要求重新获取官方披露。';
  if (faultId === 'duplicate-source') return '动态风控折叠同源转载，防止“七条转载”伪装成“七个独立来源”。';
  if (faultId === 'conflicting-evidence') return '动态风控保留公告与舆情冲突，阻止主管强行平均。';
  if (faultId === 'contract-failure') return '动态风控拒收不合格 Patch，让自由文本无法绕过 EvidenceBrief 合同。';
  if (winnerId === 'hierarchy') return '主管—专家结构在官方证据充分时，以较低重复工作完成综合。';
  return '动态风控在证据不完整时启用隔离与核验门禁，降低错误结论传播。';
}

function OrgCard({ result }) {
  return (
    <article className={`org-card ${result.winner ? 'winner' : ''}`} style={{ '--org': result.color }}>
      {result.winner && <span className="winner-flag"><Sparkles size={13} />本次最高</span>}
      <span className="org-tag">{result.tag}</span>
      <h3>{result.name}</h3>
      <div className="score"><b>{result.score}</b><span>/100<br />固定演示指数</span></div>
      <div className="mini-bars">
        <div><span>官方证据覆盖</span><i style={{ width: `${result.officialCoverage}%` }} /></div>
        <div><span>冲突保留</span><i style={{ width: `${result.conflictRetention}%` }} /></div>
        <div><span>未知项暴露</span><i style={{ width: `${result.unknownVisibility}%` }} /></div>
      </div>
      <dl><div><dt>模拟延迟</dt><dd>{result.latency}s</dd></div><div><dt>目标成本</dt><dd>¥{result.cost.toFixed(1)}</dd></div><div><dt>重复工作</dt><dd>{result.duplicate}%</dd></div><div><dt>恢复能力</dt><dd>{result.recovery}/100</dd></div></dl>
    </article>
  );
}

function Drawer({ title, onClose, children, wide = false }) {
  const closeRef = useRef(null);
  useEffect(() => closeRef.current?.focus(), []);
  return (
    <div className="drawer-layer" role="presentation">
      <button className="drawer-backdrop" type="button" aria-label="关闭详情" onClick={onClose} />
      <section className={`drawer ${wide ? 'drawer-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <header><div><span className="eyebrow">ORGLAB SENTINEL · CN A</span><h2 id="drawer-title">{title}</h2></div><button ref={closeRef} type="button" aria-label="关闭" onClick={onClose}><X size={20} /></button></header>
        <div className="drawer-body">{children}</div>
      </section>
    </div>
  );
}

function RiskReport({ scenario, reviewed, onReview }) {
  const officialEvidence = scenario.evidenceBriefs.filing.evidence.filter(
    (item) => item.verified && item.tier.startsWith('A'),
  );
  return (
    <div className="report-view">
      <div className="report-status"><ShieldCheck size={20} /><div><span>USER RISK REPORT · MOCK</span><h3>{scenario.userReport.status}</h3></div><code>{scenario.userReport.action}</code></div>
      <section><span className="section-kicker">结论</span><h3>{scenario.title}</h3><p>{scenario.rationale}</p></section>
      <div className="report-grid"><section><span className="section-kicker">A 级模拟证据</span><b>{officialEvidence.length} 条</b></section><section><span className="section-kicker">未解决冲突</span><b>{scenario.synthesis.conflicts.length} 项</b></section><section><span className="section-kicker">未知项</span><b>{scenario.synthesis.missing.length} 项</b></section></div>
      <div className="fact-inference-grid">
        <section className="fact-block"><span><Check size={14} />已确认事实</span><p>{scenario.synthesis.agreement}</p></section>
        <section className="inference-block"><span><AlertTriangle size={14} />冲突 / 推断</span>{scenario.synthesis.conflicts.map((item) => <p key={item}>{item}</p>)}</section>
        <section className="unknown-block"><span><Gauge size={14} />仍未知</span><ul>{scenario.synthesis.missing.map((item) => <li key={item}>{item}</li>)}</ul></section>
      </div>
      <section><span className="section-kicker">关注范围</span><p>{scenario.userReport.exposureSummary}</p></section>
      <section><span className="section-kicker">下一步</span><ol className="checklist">{scenario.userReport.checklist.map((item) => <li key={item}><span><Check size={13} /></span>{item}</li>)}</ol></section>
      <section><span className="section-kicker">引用链</span><div className="citation-list">{Object.values(scenario.evidenceBriefs).flatMap((brief) => brief.evidence).map((item) => <code key={item.id}>{item.id}</code>)}</div></section>
      <div className="legal-note"><FileWarning size={18} /><p><b>仅为概念验证。</b> 所有内容均为固定 MOCK，不构成投资建议，不连接券商或执行交易；实际使用前需完成资质与合规评估。</p></div>
      <button className="primary-action wide" type="button" disabled={reviewed} onClick={onReview}>{reviewed ? <><Check size={16} />已记录用户阅读</> : <><UserCheck size={16} />我已阅读风险提示（不触发交易）</>}</button>
    </div>
  );
}

function LedgerView({ ledger }) {
  return (
    <div className="ledger-list">
      <p className="drawer-intro">每个 Agent 只能写入自己的字段，所有修改都引用上游证据。本账本仅用于演示，不是区块链。</p>
      {ledger.map((patch, index) => (
        <article key={patch.id}>
          <div className="ledger-index">{String(index + 1).padStart(2, '0')}</div>
          <div><span>{patch.author}</span><h3>{patch.id}</h3><code>{patch.target}</code><p>{patch.summary}</p><small>引用：{patch.evidence.join(' · ') || '—'}</small></div>
          <b className={`ledger-status status-${patch.status.toLowerCase()}`}>{patch.status}</b>
        </article>
      ))}
    </div>
  );
}

const claimStateMeta = {
  CONFIRMED: { label: '已确认', className: 'confirmed' },
  PENDING_VERIFICATION: { label: '待核实', className: 'pending' },
  UNKNOWN: { label: '暂无法判断', className: 'unknown' },
};

function EvidenceView({ scenario }) {
  return (
    <div className="evidence-view">
      <section className="evidence-overview">
        <div>
          <span className="section-kicker">核验结论</span>
          <h3>{scenario.title}</h3>
          <p>{scenario.rationale}</p>
        </div>
        <div className="evidence-overview-meta">
          <span>{scenario.severity}</span>
          <span>{scenario.ticker}</span>
          <span>核验覆盖 {scenario.verificationCoverage}%</span>
        </div>
      </section>

      <section className="evidence-trend-card">
        <div className="evidence-section-heading">
          <div>
            <span className="section-kicker">变化趋势</span>
            <h3>{scenario.trend.metric}</h3>
            <p>{scenario.trend.note}</p>
          </div>
          <code>阈值 {scenario.trend.threshold}{scenario.trend.unit}</code>
        </div>
        <ThresholdTrendChart trend={scenario.trend} />
      </section>

      <div className="evidence-section-heading source-heading">
        <div>
          <span className="section-kicker">来源明细</span>
          <h3>舆情与公告证据</h3>
        </div>
      </div>
      <div className="evidence-brief-grid">
        {Object.entries(scenario.evidenceBriefs).map(([type, brief]) => (
          <section className="evidence-brief" key={brief.id}>
            <div className="evidence-brief-title">{type === 'news' ? <Newspaper size={18} /> : <Database size={18} />}<div><span>{brief.id}</span><h3>{brief.headline}</h3></div><b>{brief.status}</b></div>
            <p>{brief.summary}</p>
            <div className="schema-row">
              <code>数据：{brief.dataMode}</code>
              <code>来源：{brief.provider}</code>
              <code>覆盖：{brief.verificationCoverage}%</code>
            </div>
            <h4>事实状态</h4>
            <div className="claim-list">
              {brief.claims.map((claim) => {
                const state = claimStateMeta[claim.state];
                return (
                  <article key={claim.id} className={`claim-item claim-${state.className}`}>
                    <span>{state.label}</span>
                    <div>
                      <b>{claim.text}</b>
                      <p>{claim.rationale}</p>
                      <code>{claim.evidenceIds.join(' · ') || '无事实证据引用'}</code>
                    </div>
                  </article>
                );
              })}
            </div>
            <h4>证据</h4><div className="evidence-items">{brief.evidence.map((item) => <div key={item.id}><span className={item.verified ? 'verified-dot' : 'unverified-dot'} /><div><b>{item.label}</b><small>{item.id} · {item.tier} · {item.freshness}</small><code>{item.locator}</code><p>{item.note}</p></div></div>)}</div>
            <h4>仍需确认</h4><ul>{brief.gaps.map((gap) => <li key={gap}>{gap}</li>)}</ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function RulesView() {
  const rules = [
    ['G-01', '来源分权', '舆情 Agent 与公告 Agent 不能替对方修改简报。'],
    ['G-02', '合同先行', '所有状态变化必须通过 EvidenceBrief v1.2 与带证据 ID 的 Patch。'],
    ['G-03', '冲突保留', '主管不得把相互冲突的事实简单平均或静默删除。'],
    ['G-04', '热搜只作线索', '同源转载必须折叠；单一匿名来源默认进入隔离。'],
    ['G-05', '人类门禁', '报告只能被标记为已阅读，系统没有券商或交易工具。'],
    ['G-06', '状态真实', 'MOCK、PLANNED、AUTH REQUIRED 与 LIVE 必须明确区分。'],
    ['G-07', '密钥隔离', 'API Key 与 Hosted MCP URL 只能保存在服务端秘密存储，绝不进入 Git 或浏览器。'],
  ];
  return <div className="rules-list">{rules.map(([id, name, description]) => <article key={id}><code>{id}</code><div><h3>{name}</h3><p>{description}</p></div></article>)}</div>;
}

function NotificationsView({ scenario, phase }) {
  return <div className="notification-list"><article><AlertTriangle size={18} /><div><span>演示报告</span><h3>{scenario.short}</h3><p>{phase >= 5 ? '报告已生成，等待阅读。' : '正在核验，报告尚未生成。'}</p></div></article><article><FlaskConical size={18} /><div><span>连接状态</span><h3>固定 MOCK · 未连接外部服务</h3><p>当前仅运行本地回放。</p></div></article></div>;
}

function HoldingsDetail() {
  return <div className="holdings-detail"><p className="drawer-intro">以下均为虚构数据。权重只表示核验顺序，不代表真实持仓。</p>{holdings.map((holding) => <article key={holding.ticker}><div className="stock-icon" style={{ '--stock': holding.color }}>{holding.name.at(-1)}</div><div><h3>{holding.name}</h3><span>{holding.market} · {holding.ticker}</span></div><dl><div><dt>关注权重</dt><dd>{holding.allocation}%</dd></div><div><dt>证据状态</dt><dd>{holding.evidenceState}</dd></div><div><dt>交易能力</dt><dd>禁用</dd></div></dl></article>)}</div>;
}
