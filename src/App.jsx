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
  dashboard: 'A 股风险情报台',
  agents: 'Agent 与证据链',
  architecture: '阿里目标架构',
  lab: '组织实验室',
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
    showToast(`已启动「${nextScenario.short}」固定 MOCK 回放`);
  };

  const navigate = (next) => {
    setActiveNav(next);
    setMenuOpen(false);
  };

  const markReviewed = () => {
    setReviewedRuns((current) => ({ ...current, [reviewKey]: true }));
    showToast('已记录“用户阅读”，没有执行任何交易');
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
          <NavItem icon={LayoutDashboard} label="风险情报台" active={activeNav === 'dashboard'} onClick={() => navigate('dashboard')} />
          <NavItem icon={Users} label="Agent 证据链" active={activeNav === 'agents'} onClick={() => navigate('agents')} />
          <NavItem icon={Cloud} label="目标架构" active={activeNav === 'architecture'} onClick={() => navigate('architecture')} />
          <NavItem icon={FlaskConical} label="组织实验" active={activeNav === 'lab'} onClick={() => navigate('lab')} />
        </nav>
        <div className="sidebar-bottom">
          <div className="runtime-status"><span className="pulse-dot" />本地确定性回放就绪</div>
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
          <div className="crumb"><span>路演原型</span><ChevronRight size={14} aria-hidden="true" /><b>{pageNames[activeNav]}</b></div>
          <div className="top-actions">
            <span className="demo-pill"><span />MOCK ACTIVE</span>
            <button className="icon-button" type="button" aria-label="查看演示通知" onClick={() => setDrawer('notifications')}>
              <Bell size={18} />
            </button>
            <div className="avatar" aria-label="演示用户">演</div>
          </div>
        </header>

        <div className="demo-banner" role="note">
          <FlaskConical size={15} aria-hidden="true" />
          <strong>概念验证</strong>
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
        <Drawer title={drawerTitle(drawer)} onClose={() => setDrawer(null)}>
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
    report: '证据与完整风险报告',
    ledger: 'Patch 决策账本',
    sources: '专项简报与引用链',
    rules: 'Agent 交接合同与安全边界',
    notifications: '演示通知',
    holdings: '模拟关注组合',
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
          <span className="eyebrow">A-SHARE EVIDENCE RISK INTELLIGENCE</span>
          <h1>先核验信息，再解释风险</h1>
          <p>A 股是首个演示场景；核心能力是多来源分工、交叉核验、冲突保留与人工门禁。</p>
        </div>
        <ScenarioMenu current={scenario.id} onSelect={(next) => runScenario(next)} />
      </section>

      <section className="metrics-grid" aria-label="演示运行摘要">
        <Metric icon={FileCheck2} label="已核验证据" value={phase < 2 ? '采集中' : `${verifiedEvidence} 条`} sub="带证据 ID 与来源等级" type="source" />
        <Metric icon={AlertTriangle} label="未解决冲突" value={phase < 3 ? '等待主管' : `${scenario.synthesis.conflicts.length} 项`} sub="冲突不会被平均或隐藏" type={scenario.synthesis.conflicts.length ? 'warning' : 'success'} />
        <Metric icon={Gauge} label="证据缺口" value={phase < 3 ? '待计算' : `${scenario.synthesis.missing.length} 项`} sub="未知项显式进入报告" type="neutral" />
        <Metric icon={UserCheck} label="人工门禁" value={!reportReady ? '等待报告' : reviewed ? '已阅读' : '必须确认'} sub="阅读记录 ≠ 交易执行" type="success" />
      </section>

      <section className="work-grid">
        <div className="panel holdings-panel">
          <PanelTitle title="模拟关注组合" subtitle="虚构证券 · 权重仅表示核验优先级" action="查看说明" onAction={() => openDrawer('holdings')} />
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
            <span>固定演示时点 · {scenario.ticker}</span>
          </div>
          <h2>{scenario.title}</h2>
          <div className="source-row">
            <span className="source-chip">MOCK FIXTURE</span>
            {currentFault && <span className="fault-chip">FAULT · {currentFault.label}</span>}
            <span>规则覆盖 {reportReady ? `${scenario.confidence}%` : '待计算'}</span>
            <span>当前 A 级证据 {officialEvidence} 条</span>
          </div>
          <div className="conclusion-box">
            <div className="suggestion-label">{!reportReady ? '等待证据合同' : '面向用户的解释'}</div>
            <p>{reportReady ? scenario.recommendation : '两份 EvidenceBrief 提交后，主管才会输出一致点、冲突与未知项；风险 Agent 不生成买卖建议。'}</p>
            <div className="non-advice"><ShieldCheck size={16} /><span>当前系统只解释信息风险，不预测收益，不给目标价或仓位。</span></div>
          </div>
          {reportReady && <EvidenceBalance scenario={scenario} />}
          <div className="alert-actions">
            <button className="primary-action" type="button" disabled={phase < 5} onClick={() => openDrawer('report')}>
              {phase < 5 ? <><RefreshCw className="spin" size={16} />生成中</> : <><Eye size={16} />查看证据与完整报告</>}
            </button>
            <button className="secondary-action" type="button" onClick={() => showToast('已加入本地演示提醒；刷新后不会保留')}>模拟稍后提醒</button>
          </div>
        </div>
      </section>

      <section className="panel trend-panel">
        <PanelTitle title={`${scenario.trend.metric}与演示阈值`} subtitle={scenario.trend.note} action="查看核验规则" onAction={() => openDrawer('rules')} />
        <ThresholdTrendChart trend={scenario.trend} />
      </section>

      <section className="source-grid" aria-label="专项 Agent 简报">
        <EvidenceBriefCard type="news" brief={scenario.evidenceBriefs.news} phase={phase} onOpen={() => openDrawer('sources')} />
        <EvidenceBriefCard type="filing" brief={scenario.evidenceBriefs.filing} phase={phase} onOpen={() => openDrawer('sources')} />
      </section>

      <section className="panel workflow-panel">
        <PanelTitle title="并行取证与证据交接" subtitle="当前为浏览器本地状态机的逻辑并行；目标由百炼编排多个通义角色" action="完整账本" onAction={() => openDrawer('ledger')} />
        <PipelineFlow agents={runtimeAgents} phase={phase} reviewed={reviewed} />
        <PatchPreview patch={ledger.at(-1)} phase={phase} />
      </section>
    </div>
  );
}

function ScenarioMenu({ current, onSelect }) {
  return (
    <div className="scenario-menu">
      <span>选择固定 A 股事件</span>
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
      <div><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>
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
        <div><span>{isNews ? 'PUBLIC TREND SPECIALIST' : 'OFFICIAL DISCLOSURE SPECIALIST'}</span><h3>{isNews ? '中文舆情 Agent 简报' : '公告数据 Agent 简报'}</h3></div>
        <span className={`brief-status ${ready ? 'ready' : ''} ${degraded ? 'degraded' : ''}`}>{statusLabel}</span>
      </div>
      <h4>{ready ? brief.headline : phase === 1 ? '正在处理对应来源…' : '尚未开始专项处理'}</h4>
      <p>{ready ? brief.summary : '只有通过 EvidenceBrief v1.1 校验的结构化 Patch 才会进入主管上下文。'}</p>
      <div className="brief-meta"><span>data: {brief.dataMode}</span><span>evidence: {ready ? brief.evidence.length : '—'}</span><span>规则覆盖: {ready ? `${brief.confidence}%` : '—'}</span></div>
      <button type="button" className="text-action" disabled={!ready} onClick={onOpen}>{ready ? '查看字段与证据' : '等待简报提交'} <ChevronRight size={14} /></button>
    </article>
  );
}

function PipelineFlow({ agents, phase, reviewed }) {
  const news = agents.find((agent) => agent.key === 'news');
  const filing = agents.find((agent) => agent.key === 'filing');
  const supervisor = agents.find((agent) => agent.key === 'supervisor');
  const risk = agents.find((agent) => agent.key === 'risk');
  return (
    <div className="pipeline-scroll" aria-label="舆情与公告 Agent 逻辑并行，之后依次经过主管、风险 Agent 和用户门禁">
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
        <div><span className="eyebrow">ROLE SEPARATION & EVIDENCE CONTRACTS</span><h1>Agent 是岗位，不是四个平台</h1><p>当前四个 Agent 是同一浏览器原型中的逻辑角色；目标是在百炼里编排多个通义角色实例。</p></div>
        <button className="outline-button" type="button" onClick={() => openDrawer('rules')}><LockKeyhole size={17} />查看交接规则</button>
      </section>

      <section className="runtime-truth panel">
        <div className="truth-card current">
          <span>当前 · IMPLEMENTED / MOCK</span>
          <h3><Server size={19} />浏览器本地确定性状态机</h3>
          <p>固定 fixture 驱动逻辑并行、合同校验、Patch 账本和安全降级；没有真实 LLM 或外部 MCP 调用。</p>
        </div>
        <ChevronRight className="truth-arrow" size={22} />
        <div className="truth-card target">
          <span>目标 · PLANNED</span>
          <h3><Cloud size={19} />百炼编排多个通义角色</h3>
          <p>百炼负责分支、超时和追踪，MCP 负责只读工具连接，钉钉承接人工复核。</p>
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
                <div><dt>固定规则覆盖</dt><dd>{agent.reliability}%</dd></div>
                <div><dt>回放次数</dt><dd>{agent.demoRuns}</dd></div>
                <div><dt>输出合同</dt><dd>{agent.output}</dd></div>
              </dl>
              <div className="tool-state"><Workflow size={14} /><span>{agent.tool}</span></div>
              <div className="permission"><LockKeyhole size={14} /><span>可写 namespace</span>{agent.permission.map((entry) => <code key={entry}>{entry}</code>)}</div>
              <div className="cannot"><AlertTriangle size={14} /><span>{agent.cannot}</span></div>
            </article>
          );
        })}
      </section>

      <section className="panel constitution-panel">
        <div><Sparkles size={21} /><div><h3>组织宪法 v1.1</h3><p>来源分权 · 合同先于结论 · 冲突不平均 · 热搜只作线索 · 最终报告必须人工阅读</p></div></div>
        <button type="button" onClick={() => openDrawer('rules')}>查看全部规则</button>
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
    ['05', '确定性治理', 'EvidenceBrief v1.1 + Patch 账本', 'IMPLEMENTED'],
    ['06', '人工复核', '网页门禁 / 钉钉协同', 'MOCK / ROADMAP'],
  ];

  return (
    <div className="page architecture-page">
      <section className="page-heading">
        <div><span className="eyebrow">CURRENT PROTOTYPE → ALIBABA TARGET STACK</span><h1>阿里生态不是堆产品名，而是各管一层</h1><p>千问负责分析，百炼负责组织，魔搭负责工具与评测，MCP 负责连接，钉钉把决定交还给人。</p></div>
        <span className="concept-pill"><Cloud size={16} />概念架构 · 未真实接入</span>
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
          <p><b>关键安全边界：</b>浏览器永远不携带第三方密钥；MCP 返回内容必须先通过确定性合同、来源等级、时效与去重校验，才能进入主管上下文。</p>
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
          <p>负责发现微博、知乎、Bilibili 等公开趋势线索。社区工具不等于平台官方接口，也不能证明内容真实。</p>
          <ul><li>进入：中文舆情 Agent</li><li>信任等级：D 级线索</li><li>强制：同源去重、链接与时间戳</li></ul>
        </article>
        <article className="panel mcp-card">
          <div className="mcp-heading"><Database size={21} /><div><span>TOOL · AUTH REQUIRED</span><h3>天眼查 MCP</h3></div></div>
          <p>目标用于企业主体、股权与经营司法事实核验；不能替代交易所公告，也不是股价或行情数据源。</p>
          <ul><li>进入：公告数据 Agent</li><li>信任等级：B 级企业事实</li><li>强制：服务端密钥、授权与调用留痕</li></ul>
        </article>
      </section>

      <section className="panel trust-panel">
        <PanelTitle title="A 股来源信任梯度" subtitle="热搜负责发现，企业数据负责背景，官方公告负责确认" />
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
        <section><span>从一个 A 股风控壳子，复用成一套证据引擎</span><h3>同一套“发现—核验—冲突—人工门禁”可扩展到商家供应链、旅行异常与企业合作方复核</h3><p>淘宝 / 天猫、飞猪和钉钉是未来可复用的业务入口，不是本版已经接入的组件。</p></section>
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
        <div><span className="eyebrow">ORGANIZATION WIND TUNNEL</span><h1>同一证据，不同组织</h1><p>固定事件、fixture、预算与规则，只改变协作结构和故障；结果是演示回放，不是统计结论。</p></div>
        <button className="primary-action" type="button" disabled={running} onClick={startExperiment}>
          {running ? <><RefreshCw className="spin" size={16} />实验运行中</> : <><Play size={16} />运行固定对照</>}
        </button>
      </section>

      <section className="experiment-controls panel">
        <div className="control-group"><span className="step-label">1 · 固定事件</span><div className="scenario-pills">{scenarios.map((item) => <button type="button" disabled={running} aria-pressed={item.id === selectedScenarioId} className={item.id === selectedScenarioId ? 'active' : ''} onClick={() => setSelectedScenarioId(item.id)} key={item.id}>{item.short}</button>)}</div></div>
        <div className="event-tag-bank"><span>场景覆盖标签</span>{eventTags.map((tag) => <i key={tag}>{tag}</i>)}</div>
        <div className="control-group"><span className="step-label">2 · 注入故障</span><div className="scenario-pills fault-pills">{faults.map((item) => <button type="button" title={item.detail} disabled={running} aria-pressed={item.id === selectedFaultId} className={item.id === selectedFaultId ? 'active' : ''} onClick={() => setSelectedFaultId(item.id)} key={item.id}>{item.label}</button>)}</div></div>
        <div className="experiment-locks"><span><LockKeyhole size={13} />目标预算 ¥3.50</span><span><LockKeyhole size={13} />固定 fixture</span><span><LockKeyhole size={13} />seed 20260722</span><span><LockKeyhole size={13} />合同 v1.1</span></div>
      </section>

      <div className="result-caption">
        <span>上次完成回放</span>
        <b>{resultScenario.short} · {resultFault.label}</b>
        <code>n=1 deterministic replay</code>
      </div>

      <section className="comparison-grid">
        {results.map((result) => <OrgCard key={result.id} result={result} />)}
      </section>

      <section className="panel findings">
        <div className="finding-icon"><BarChart3 size={21} /></div>
        <div><span>固定公式下的演示结论</span><h3>{winner.name}在本次回放中综合表现最高</h3><p>{conclusionFor(winner.id, resultConfig.faultId)} 需要多 seed、多次重复和置信区间后，才可形成研究结论。</p></div>
        <div className="sample-badge"><b>n = 1</b><span>不代表统计显著</span></div>
      </section>

      <p className="formula-note">演示综合分 = 官方覆盖 24% + 冲突保留 24% + 未知暴露 20% + 恢复能力 16% + 延迟 6% + 成本 4% + 去重 6%。该公式是产品演示规则，不是金融预测。</p>
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

function Drawer({ title, onClose, children }) {
  const closeRef = useRef(null);
  useEffect(() => closeRef.current?.focus(), []);
  return (
    <div className="drawer-layer" role="presentation">
      <button className="drawer-backdrop" type="button" aria-label="关闭详情" onClick={onClose} />
      <section className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
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
      <section><span className="section-kicker">事件</span><h3>{scenario.title}</h3><p>{scenario.rationale}</p></section>
      <div className="report-grid"><section><span className="section-kicker">A 级模拟证据</span><b>{officialEvidence.length} 条</b></section><section><span className="section-kicker">未解决冲突</span><b>{scenario.synthesis.conflicts.length} 项</b></section><section><span className="section-kicker">未知项</span><b>{scenario.synthesis.missing.length} 项</b></section></div>
      <div className="fact-inference-grid">
        <section className="fact-block"><span><Check size={14} />已确认事实</span><p>{scenario.synthesis.agreement}</p></section>
        <section className="inference-block"><span><AlertTriangle size={14} />冲突 / 推断</span>{scenario.synthesis.conflicts.map((item) => <p key={item}>{item}</p>)}</section>
        <section className="unknown-block"><span><Gauge size={14} />仍未知</span><ul>{scenario.synthesis.missing.map((item) => <li key={item}>{item}</li>)}</ul></section>
      </div>
      <section><span className="section-kicker">模拟暴露说明</span><p>{scenario.userReport.exposureSummary}</p></section>
      <section><span className="section-kicker">用户核验清单</span><ol className="checklist">{scenario.userReport.checklist.map((item) => <li key={item}><span><Check size={13} /></span>{item}</li>)}</ol></section>
      <section><span className="section-kicker">引用链</span><div className="citation-list">{Object.values(scenario.evidenceBriefs).flatMap((brief) => brief.evidence).map((item) => <code key={item.id}>{item.id}</code>)}</div></section>
      <div className="legal-note"><FileWarning size={18} /><p><b>仅为概念验证，落地需相应资质与合规评估。</b> 本系统不构成投资建议，不连接券商，不自动执行交易。所有证券、事件、图表和数字均为固定 MOCK。</p></div>
      <button className="primary-action wide" type="button" disabled={reviewed} onClick={onReview}>{reviewed ? <><Check size={16} />已记录用户阅读</> : <><UserCheck size={16} />我已阅读风险提示（不触发交易）</>}</button>
    </div>
  );
}

function LedgerView({ ledger }) {
  return (
    <div className="ledger-list">
      <p className="drawer-intro">每个 Agent 只能提交自己 namespace 内的 Patch；下游通过 ID 引用上游证据，无法静默覆盖。当前账本是浏览器演示状态，不是区块链或不可篡改日志。</p>
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

function EvidenceView({ scenario }) {
  return (
    <div className="evidence-view">
      <p className="drawer-intro">两个来源 Agent 使用同一最小输出合同，但不共享结论；主管收到两份 Brief 或显式降级状态后才开始综合。</p>
      {Object.entries(scenario.evidenceBriefs).map(([type, brief]) => (
        <section className="evidence-brief" key={brief.id}>
          <div className="evidence-brief-title">{type === 'news' ? <Newspaper size={18} /> : <Database size={18} />}<div><span>{brief.id}</span><h3>{brief.headline}</h3></div><b>{brief.status}</b></div>
          <p>{brief.summary}</p>
          <div className="schema-row">
            <code>schema_version: {brief.schemaVersion}</code>
            <code>data_mode: {brief.dataMode}</code>
            <code>provider: {brief.provider}</code>
            <code>source_class: {brief.sourceClass}</code>
            <code>as_of: {brief.asOf}</code>
            <code>rule_coverage: {brief.confidence}%</code>
          </div>
          <h4>结构化 findings</h4><ul>{brief.findings.map((finding) => <li key={finding}>{finding}</li>)}</ul>
          <h4>证据</h4><div className="evidence-items">{brief.evidence.map((item) => <div key={item.id}><span className={item.verified ? 'verified-dot' : 'unverified-dot'} /><div><b>{item.label}</b><small>{item.id} · {item.tier} · {item.freshness}</small><code>{item.locator}</code><p>{item.note}</p></div></div>)}</div>
          <h4>未知与缺口</h4><ul>{brief.gaps.map((gap) => <li key={gap}>{gap}</li>)}</ul>
        </section>
      ))}
    </div>
  );
}

function RulesView() {
  const rules = [
    ['G-01', '来源分权', '舆情 Agent 与公告 Agent 不能替对方修改简报。'],
    ['G-02', '合同先行', '所有状态变化必须通过 EvidenceBrief v1.1 与带证据 ID 的 Patch。'],
    ['G-03', '冲突保留', '主管不得把相互冲突的事实简单平均或静默删除。'],
    ['G-04', '热搜只作线索', '同源转载必须折叠；单一匿名来源默认进入隔离。'],
    ['G-05', '人类门禁', '报告只能被标记为已阅读，系统没有券商或交易工具。'],
    ['G-06', '状态真实', 'MOCK、PLANNED、AUTH REQUIRED 与 LIVE 必须明确区分。'],
    ['G-07', '密钥隔离', 'API Key 与 Hosted MCP URL 只能保存在服务端秘密存储，绝不进入 Git 或浏览器。'],
  ];
  return <div className="rules-list">{rules.map(([id, name, description]) => <article key={id}><code>{id}</code><div><h3>{name}</h3><p>{description}</p></div></article>)}</div>;
}

function NotificationsView({ scenario, phase }) {
  return <div className="notification-list"><article><AlertTriangle size={18} /><div><span>演示风险报告</span><h3>{scenario.short}</h3><p>{phase >= 5 ? '固定回放已生成证据报告，需要用户人工阅读。' : '专项 Agent 正在处理，最终报告尚未生成。'}</p></div></article><article><FlaskConical size={18} /><div><span>数据与连接状态</span><h3>固定 MOCK · 外部能力未连接</h3><p>当前页面未真实调用交易所、天眼查、趋势 MCP、百炼、千问或钉钉。</p></div></article></div>;
}

function HoldingsDetail() {
  return <div className="holdings-detail"><p className="drawer-intro">以下证券代码与关注权重全部为虚构演示数据，不对应真实持仓。权重只用于展示信息核验优先级。</p>{holdings.map((holding) => <article key={holding.ticker}><div className="stock-icon" style={{ '--stock': holding.color }}>{holding.name.at(-1)}</div><div><h3>{holding.name}</h3><span>{holding.market} · {holding.ticker}</span></div><dl><div><dt>关注权重</dt><dd>{holding.allocation}%</dd></div><div><dt>证据状态</dt><dd>{holding.evidenceState}</dd></div><div><dt>交易能力</dt><dd>禁用</dd></div></dl></article>)}</div>;
}
