import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  ChevronRight,
  CircleDollarSign,
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
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react';
import {
  DEMO_NOTICE,
  faults,
  holdings,
  scenarios,
} from './data/demoData.js';
import {
  applyFaultToScenario,
  getAgentRuntime,
  getPatchLedger,
  getScenario,
  isQuarantined,
  runOrganizationExperiment,
} from './lib/simulation.js';

const pageNames = {
  dashboard: '风险监控台',
  agents: 'Agent 团队',
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
    const timer = window.setTimeout(() => setPhase((current) => current + 1), 620);
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
    toastTimer.current = window.setTimeout(() => setToast(''), 2600);
  };

  const runScenario = (nextScenario, nextFault = fault) => {
    setScenarioId(nextScenario.id);
    setFault(nextFault);
    setPhase(0);
    setRunId((current) => current + 1);
    setDrawer(null);
    showToast(`已启动「${nextScenario.short}」固定场景回放`);
  };

  const navigate = (next) => {
    setActiveNav(next);
    setMenuOpen(false);
  };

  const markReviewed = () => {
    setReviewedRuns((current) => ({ ...current, [reviewKey]: true }));
    showToast('已记录“用户阅读”，未执行任何交易');
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
          <div className="brand-mark"><Activity size={22} aria-hidden="true" /></div>
          <div><strong>OrgLab</strong><span>Sentinel</span></div>
        </div>
        <nav aria-label="主要导航">
          <NavItem icon={LayoutDashboard} label="监控台" active={activeNav === 'dashboard'} onClick={() => navigate('dashboard')} />
          <NavItem icon={Users} label="Agent 团队" active={activeNav === 'agents'} onClick={() => navigate('agents')} />
          <NavItem icon={FlaskConical} label="组织实验" active={activeNav === 'lab'} onClick={() => navigate('lab')} />
        </nav>
        <div className="sidebar-bottom">
          <div className="runtime-status"><span className="pulse-dot" />离线场景运行时就绪</div>
          <div className="disclaimer">DEMO · 模拟数据 · 不自动交易</div>
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
          <div className="crumb"><span>模拟组合</span><ChevronRight size={14} aria-hidden="true" /><b>{pageNames[activeNav]}</b></div>
          <div className="top-actions">
            <span className="demo-pill"><span />DEMO MODE</span>
            <button className="icon-button" type="button" aria-label="查看演示通知" onClick={() => setDrawer('notifications')}>
              <Bell size={18} />
            </button>
            <div className="avatar" aria-label="演示用户">林</div>
          </div>
        </header>

        <div className="demo-banner" role="note">
          <FlaskConical size={15} aria-hidden="true" />
          <strong>固定数据回放</strong>
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
    report: '面向用户的风险报告',
    ledger: 'Patch 决策账本',
    sources: '专项简报与证据链',
    rules: '组织宪法与权限门禁',
    notifications: '演示通知',
    holdings: '模拟持仓明细',
  }[type];
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button className={`nav-item ${active ? 'active' : ''}`} type="button" aria-current={active ? 'page' : undefined} onClick={onClick}>
      <Icon size={19} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

function Dashboard({ scenario, phase, runtimeAgents, ledger, reviewed, runScenario, showToast, openDrawer }) {
  const quarantined = isQuarantined(scenario);
  const evidenceCount = Object.values(scenario.evidenceBriefs).reduce((total, brief) => total + brief.evidence.length, 0);
  const reportReady = phase >= 5;

  return (
    <div className="page dashboard-page" aria-busy={phase < 5}>
      <section className="page-heading">
        <div>
          <span className="eyebrow">SOURCE-SPECIALIST RISK COPILOT</span>
          <h1>两路专项取证，一份可追溯风险报告</h1>
          <p>新闻与公告数据分开处理，主管只合并证据，风险 Agent 只向用户汇报。</p>
        </div>
        <ScenarioMenu current={scenario.id} onSelect={(next) => runScenario(next)} />
      </section>

      <section className="metrics-grid" aria-label="演示运行摘要">
        <Metric icon={CircleDollarSign} label="模拟资产" value="$286,420" sub="虚构组合快照" type="neutral" />
        <Metric
          icon={Gauge}
          label="演示风险分"
          value={!reportReady ? '计算中' : scenario.riskScore === null ? '暂缓评分' : `${scenario.riskScore} / 100`}
          sub={!reportReady ? '等待主管综合与风险映射' : scenario.activeFault ? '故障门禁阻止不完整评分' : quarantined ? '传闻未计入组合风险' : `情景等级：${scenario.severity}`}
          type={scenario.activeFault || quarantined ? 'neutral' : 'warning'}
        />
        <Metric icon={FileCheck2} label="证据引用" value={phase < 2 ? '采集中' : `${evidenceCount} 条`} sub={phase < 2 ? '两个专项来源并行处理' : '均可追溯到本地 fixture'} type="up" />
        <Metric icon={UserCheck} label="决策门禁" value={!reportReady ? '等待报告' : reviewed ? '已阅读' : '必须人工确认'} sub="永不自动下单" type="up" />
      </section>

      <section className="work-grid">
        <div className="panel holdings-panel">
          <PanelTitle title="持仓概览" subtitle="完全虚构 · 仅用于压力情景演示" action="查看明细" onAction={() => openDrawer('holdings')} />
          <div className="allocation-bar" aria-label="模拟持仓占比">
            {holdings.map((holding) => <span key={holding.ticker} style={{ width: `${holding.allocation}%`, background: holding.color }} />)}
          </div>
          <div className="holding-list">
            {holdings.map((holding) => (
              <div className="holding" key={holding.ticker}>
                <div className="stock-icon" style={{ '--stock': holding.color }}>{holding.ticker.slice(0, 1)}</div>
                <div className="stock-name"><b>{holding.name}</b><span>{holding.market} · {holding.ticker}</span></div>
                <div className="holding-stat"><span>仓位</span><b>{holding.allocation}%</b></div>
                <div className={`pnl ${holding.pnl > 0 ? 'positive' : 'negative'}`}>
                  {holding.pnl > 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                  {Math.abs(holding.pnl)}%
                </div>
                <span className={`risk-tag risk-${holding.risk}`}>{holding.risk}风险</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`panel alert-panel ${quarantined ? 'quarantine' : ''}`}>
          <div className="alert-topline">
            <span className="alert-badge">
              {!reportReady ? <RefreshCw className="spin" size={15} /> : quarantined ? <LockKeyhole size={15} /> : <AlertTriangle size={15} />}
              {!reportReady ? '分析进行中' : quarantined ? '来源已隔离' : '演示风险汇报'}
            </span>
            <span>固定演示时点</span>
          </div>
          <h2>{scenario.title}</h2>
          <div className="source-row">
            <span>MOCK FIXTURE</span>
            {scenario.activeFault && <span>FAULT: {faults.find((item) => item.id === scenario.activeFault)?.label}</span>}
            <span>{reportReady ? `规则置信度 ${scenario.confidence}%` : '规则置信度待计算'}</span>
            <span>模拟暴露 {scenario.exposure}%</span>
          </div>
          <div className="suggestion-box">
            <div className="suggestion-label">{!reportReady ? '报告生成中' : quarantined ? '治理结论' : '示意性风险建议'}</div>
            <p>{reportReady ? scenario.recommendation : '两份 EvidenceBrief 提交后，主管将保留一致点、冲突与未知项；风险映射完成前不展示行动建议。'}</p>
            <div className="impact"><span>压力情景影响</span><b>{reportReady ? scenario.impact : '—'}</b></div>
          </div>
          <div className="evidence"><FileCheck2 size={17} /><p><b>{reportReady ? '依据：' : '当前阶段：'}</b>{reportReady ? scenario.rationale : '等待可引用的专项简报与 SupervisorSynthesis。'}</p></div>
          <div className="alert-actions">
            <button className="primary-action" type="button" disabled={phase < 5} onClick={() => openDrawer('report')}>
              {phase < 5 ? <><RefreshCw className="spin" size={16} />生成中</> : <><Eye size={16} />{quarantined ? '查看核验报告' : '查看完整报告'}</>}
            </button>
            <button className="secondary-action" type="button" onClick={() => showToast('已加入内存中的演示提醒；刷新后不会保留')}>模拟稍后提醒</button>
            <span><ShieldCheck size={15} />用户阅读 ≠ 执行交易</span>
          </div>
        </div>
      </section>

      <section className="source-grid" aria-label="专项 Agent 简报">
        <EvidenceBriefCard type="news" brief={scenario.evidenceBriefs.news} phase={phase} onOpen={() => openDrawer('sources')} />
        <EvidenceBriefCard type="filing" brief={scenario.evidenceBriefs.filing} phase={phase} onOpen={() => openDrawer('sources')} />
      </section>

      <section className="panel workflow-panel">
        <PanelTitle title="并行取证与汇报轨迹" subtitle="专项 Agent 独立提交同一结构；主管综合后，风险 Agent 才能面向用户输出" action="完整账本" onAction={() => openDrawer('ledger')} />
        <PipelineFlow agents={runtimeAgents} phase={phase} reviewed={reviewed} />
        <PatchPreview patch={ledger.at(-1)} phase={phase} />
      </section>
    </div>
  );
}

function ScenarioMenu({ current, onSelect }) {
  return (
    <div className="scenario-menu">
      <span>选择固定演示事件</span>
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
    <article className="metric-card">
      <div className="metric-icon"><Icon size={19} aria-hidden="true" /></div>
      <div><span>{label}</span><strong>{value}</strong><small className={type}>{sub}</small></div>
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
  const degraded = ready && brief.status === 'SOURCE_TIMEOUT';
  const statusLabel = degraded ? '来源降级' : ready ? '已提交' : phase === 1 ? '分析中' : '等待';
  return (
    <article className={`panel source-brief ${isNews ? 'news-brief' : 'data-brief'}`}>
      <div className="source-brief-heading">
        <div className="source-icon"><Icon size={19} /></div>
        <div><span>{isNews ? 'NEWS SPECIALIST' : 'FILING & DATA SPECIALIST'}</span><h3>{isNews ? '新闻 Agent 简报' : '数据 Agent 简报'}</h3></div>
        <span className={`brief-status ${ready ? 'ready' : ''} ${degraded ? 'degraded' : ''}`}>{statusLabel}</span>
      </div>
      <h4>{ready ? brief.headline : phase === 1 ? '正在处理对应来源…' : '尚未开始专项处理'}</h4>
      <p>{ready ? brief.summary : '只有该 Agent 的结构化 Patch 被接受后，简报内容与证据 ID 才会显示。'}</p>
      <div className="brief-meta"><span>schema: EvidenceBrief v1</span><span>evidence: {ready ? brief.evidence.length : '—'}</span><span>规则分: {ready ? `${brief.confidence}%` : '—'}</span></div>
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
    <div className="pipeline-scroll" aria-label="新闻与数据 Agent 并行，之后依次经过主管、风险 Agent 和用户门禁">
      <div className="pipeline-flow">
        <div className="parallel-sources">
          <AgentNode agent={news} />
          <AgentNode agent={filing} />
        </div>
        <div className={`merge-arrow ${phase >= 2 ? 'done' : ''}`}><Network size={20} /><span>结构化简报汇合</span></div>
        <AgentNode agent={supervisor} />
        <FlowArrow done={phase >= 3} />
        <AgentNode agent={risk} />
        <FlowArrow done={phase >= 5} />
        <div className={`user-gate ${phase >= 5 ? 'ready' : ''} ${reviewed ? 'reviewed' : ''}`}><UserCheck size={22} /><b>用户门禁</b><span>{reviewed ? '已阅读 · 未交易' : phase >= 5 ? '报告待阅读' : '等待报告'}</span></div>
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
  const complete = ['已提交', '已综合', '已汇报', '已隔离', '降级完成'].includes(agent.status);
  return (
    <div className={`agent-node tone-${agent.tone} ${working ? 'working' : ''} ${complete ? 'complete' : ''}`}>
      <div className="agent-avatar"><Icon size={19} /></div>
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
        <div><span className="eyebrow">TEAM & SEMANTIC PERMISSIONS</span><h1>按信息来源分工，而不是重复分析</h1><p>两个专家并行取证；主管只能综合；风险 Agent 只能汇报，任何 Agent 都不能交易。</p></div>
        <button className="outline-button" type="button" onClick={() => openDrawer('rules')}><LockKeyhole size={17} />查看组织规则</button>
      </section>

      <section className="topology-callout panel">
        <div><Newspaper size={18} /><Database size={18} /><span>两份独立 EvidenceBrief</span></div>
        <ChevronRight size={18} />
        <div><Network size={18} /><span>主管保留冲突与缺口</span></div>
        <ChevronRight size={18} />
        <div><ShieldCheck size={18} /><span>风险报告 + 人工门禁</span></div>
      </section>

      <section className="agents-grid">
        {runtimeAgents.map((agent, index) => {
          const Icon = agent.icon;
          const statusTone = ['降级完成', '已隔离'].includes(agent.status)
            ? 'warning'
            : agent.status === '等待'
              ? 'idle'
              : 'good';
          return (
            <article className="agent-card" key={agent.key}>
              <div className={`big-agent-icon tone-${agent.tone}`}><Icon size={25} /></div>
              <div className="agent-card-heading"><span>ROLE 0{index + 1} · {agent.stage}</span><h3>{agent.name}</h3><p>{agent.role}</p></div>
              <dl>
                <div><dt>本次状态</dt><dd className={`agent-status status-${statusTone}`}><span />{agent.status}</dd></div>
                <div><dt>演示规则通过率</dt><dd>{agent.reliability}%</dd></div>
                <div><dt>固定回放次数</dt><dd>{agent.demoRuns}</dd></div>
                <div><dt>输出合同</dt><dd>{agent.output}</dd></div>
              </dl>
              <div className="permission"><LockKeyhole size={14} /><span>可写 namespace</span>{agent.permission.map((entry) => <code key={entry}>{entry}</code>)}</div>
              <div className="cannot"><AlertTriangle size={14} /><span>{agent.cannot}</span></div>
            </article>
          );
        })}
      </section>

      <section className="panel constitution-panel">
        <div><Sparkles size={21} /><div><h3>组织宪法 v0.4</h3><p>来源分权 · 结构化 Patch · 冲突不平均 · 单一匿名来源隔离 · 最终报告必须人工阅读</p></div></div>
        <button type="button" onClick={() => openDrawer('rules')}>查看全部规则</button>
      </section>
    </div>
  );
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
    }, 1200);
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
        <div><span className="eyebrow">ORGANIZATION WIND TUNNEL</span><h1>同一证据，不同组织</h1><p>固定事件、预算和规则，只改变协作结构与故障条件；结果是演示回放，不是统计结论。</p></div>
        <button className="primary-action" type="button" disabled={running} onClick={startExperiment}>
          {running ? <><RefreshCw className="spin" size={16} />实验运行中</> : <><Play size={16} />运行固定对照</>}
        </button>
      </section>

      <section className="experiment-controls panel">
        <div className="control-group"><span className="step-label">1 · 固定事件</span><div className="scenario-pills">{scenarios.map((item) => <button type="button" disabled={running} aria-pressed={item.id === selectedScenarioId} className={item.id === selectedScenarioId ? 'active' : ''} onClick={() => setSelectedScenarioId(item.id)} key={item.id}>{item.short}</button>)}</div></div>
        <div className="control-group"><span className="step-label">2 · 注入故障</span><div className="scenario-pills">{faults.map((item) => <button type="button" disabled={running} aria-pressed={item.id === selectedFaultId} className={item.id === selectedFaultId ? 'active' : ''} onClick={() => setSelectedFaultId(item.id)} key={item.id}>{item.label}</button>)}</div></div>
        <div className="experiment-locks"><span><LockKeyhole size={13} />预算 $0.50</span><span><LockKeyhole size={13} />固定 fixture</span><span><LockKeyhole size={13} />seed 20260722</span><span><LockKeyhole size={13} />相同规则版本</span></div>
      </section>

      <div className="result-caption">
        <span>上次完成回放</span>
        <b>{resultScenario.short} · {resultFault.label}</b>
        <code>n=1 demo replay</code>
      </div>

      <section className="comparison-grid">
        {results.map((result) => <OrgCard key={result.id} result={result} />)}
      </section>

      <section className="panel findings">
        <div className="finding-icon"><BarChart3 size={21} /></div>
        <div><span>演示结论</span><h3>{winner.name}在这次固定回放中综合分最高</h3><p>{conclusionFor(winner.id, resultConfig.faultId)} 该结果仅用于展示测量方法；需要多 seed、多次重复和置信区间后才能形成研究结论。</p></div>
        <div className="sample-badge"><b>n = 1</b><span>不代表统计显著</span></div>
      </section>
    </div>
  );
}

function conclusionFor(winnerId, faultId) {
  if (faultId === 'news-timeout') return '动态风控通过来源降级和公告侧继续运行，减少了单点超时的传播。';
  if (faultId === 'conflicting-evidence') return '动态风控保留了证据冲突，并阻止主管把矛盾信息强行平均。';
  if (winnerId === 'hierarchy') return '主管—专家结构在高质量原始公告充分时，以较低重复工作完成了综合。';
  return '动态风控在证据不完整时启用隔离与核验门禁，降低了错误建议传播。';
}

function OrgCard({ result }) {
  return (
    <article className={`org-card ${result.winner ? 'winner' : ''}`} style={{ '--org': result.color }}>
      {result.winner && <span className="winner-flag"><Sparkles size={13} />本次最高</span>}
      <span className="org-tag">{result.tag}</span>
      <h3>{result.name}</h3>
      <div className="score"><b>{result.score}</b><span>/100<br />演示综合分</span></div>
      <div className="mini-bars"><div><span>质量</span><i style={{ width: `${result.quality}%` }} /></div><div><span>可靠性</span><i style={{ width: `${result.reliability}%` }} /></div></div>
      <dl><div><dt>模拟延迟</dt><dd>{result.latency}s</dd></div><div><dt>模拟成本</dt><dd>${result.cost.toFixed(2)}</dd></div><div><dt>重复工作</dt><dd>{result.duplicate}%</dd></div><div><dt>恢复能力</dt><dd>{result.recovery}/100</dd></div></dl>
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
        <header><div><span className="eyebrow">ORGLAB SENTINEL</span><h2 id="drawer-title">{title}</h2></div><button ref={closeRef} type="button" aria-label="关闭" onClick={onClose}><X size={20} /></button></header>
        <div className="drawer-body">{children}</div>
      </section>
    </div>
  );
}

function RiskReport({ scenario, reviewed, onReview }) {
  return (
    <div className="report-view">
      <div className="report-status"><ShieldCheck size={20} /><div><span>USER RISK REPORT · MOCK</span><h3>{scenario.userReport.status}</h3></div><code>{scenario.userReport.action}</code></div>
      <section><span className="section-kicker">事件</span><h3>{scenario.title}</h3><p>{scenario.rationale}</p></section>
      <div className="report-grid"><section><span className="section-kicker">模拟仓位</span><b>{scenario.exposure}%</b></section><section><span className="section-kicker">示意区间</span><b>{scenario.userReport.targetRange}</b></section><section><span className="section-kicker">压力情景</span><b>{scenario.impact}</b></section></div>
      <section><span className="section-kicker">主管综合</span><p>{scenario.synthesis.agreement}</p>{scenario.synthesis.conflicts.map((item) => <div className="warning-line" key={item}><AlertTriangle size={14} />{item}</div>)}</section>
      <section><span className="section-kicker">用户核验清单</span><ol className="checklist">{scenario.userReport.checklist.map((item) => <li key={item}><span><Check size={13} /></span>{item}</li>)}</ol></section>
      <section><span className="section-kicker">引用链</span><div className="citation-list">{Object.values(scenario.evidenceBriefs).flatMap((brief) => brief.evidence).map((item) => <code key={item.id}>{item.id}</code>)}</div></section>
      <div className="legal-note"><FileWarning size={18} /><p><b>教育与研究原型。</b>模拟持仓、事件与实验结果；不连接券商，不执行交易；数据可能缺失，模型与规则可能错误。请核对原始文件。本建议没有评估任何人的财务状况或适当性。</p></div>
      <button className="primary-action wide" type="button" disabled={reviewed} onClick={onReview}>{reviewed ? <><Check size={16} />已记录用户阅读</> : <><UserCheck size={16} />标记为已阅读（不交易）</>}</button>
    </div>
  );
}

function LedgerView({ ledger }) {
  return (
    <div className="ledger-list">
      <p className="drawer-intro">每个 Agent 只能提交自己 namespace 内的 Patch；下游通过 ID 引用上游证据，无法静默覆盖。</p>
      {ledger.map((patch, index) => (
        <article key={patch.id}>
          <div className="ledger-index">0{index + 1}</div>
          <div><span>{patch.author}</span><h3>{patch.id}</h3><code>{patch.target}</code><p>{patch.summary}</p><small>引用：{patch.evidence.join(' · ')}</small></div>
          <b className={`ledger-status status-${patch.status.toLowerCase()}`}>{patch.status}</b>
        </article>
      ))}
    </div>
  );
}

function EvidenceView({ scenario }) {
  return (
    <div className="evidence-view">
      <p className="drawer-intro">两个来源 Agent 使用同一最小输出合同，但不共享结论；主管收到两份 Brief 后才开始综合。</p>
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
            <code>rule_score: {brief.confidence}%</code>
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
    ['G-01', '来源分权', '新闻 Agent 与数据 Agent 不能替对方修改简报。'],
    ['G-02', '结构化写入', '所有状态变化必须通过包含证据 ID 的 Patch。'],
    ['G-03', '冲突保留', '主管不得把相互冲突的事实简单平均或静默删除。'],
    ['G-04', '匿名来源隔离', '单一匿名来源默认进入 QUARANTINE。'],
    ['G-05', '人类门禁', '报告只能被标记为已阅读，系统无券商连接与交易工具。'],
    ['G-06', '演示真实性', 'Mock、延迟和 Live 数据必须在每条记录上明确标记。'],
  ];
  return <div className="rules-list">{rules.map(([id, name, description]) => <article key={id}><code>{id}</code><div><h3>{name}</h3><p>{description}</p></div></article>)}</div>;
}

function NotificationsView({ scenario, phase }) {
  return <div className="notification-list"><article><AlertTriangle size={18} /><div><span>演示风险报告</span><h3>{scenario.short}</h3><p>{phase >= 5 ? '固定回放已生成用户报告；需要人工阅读。' : '专项 Agent 正在处理；最终报告尚未生成。'}</p></div></article><article><FlaskConical size={18} /><div><span>数据状态</span><h3>所有输入均为 MOCK</h3><p>当前页面未连接 SEC、Finnhub、券商或真实账户。</p></div></article></div>;
}

function HoldingsDetail() {
  return <div className="holdings-detail"><p className="drawer-intro">以下金额、收益与仓位全部为虚构演示数据。</p>{holdings.map((holding) => <article key={holding.ticker}><div className="stock-icon" style={{ '--stock': holding.color }}>{holding.ticker[0]}</div><div><h3>{holding.name}</h3><span>{holding.market} · {holding.ticker}</span></div><dl><div><dt>仓位</dt><dd>{holding.allocation}%</dd></div><div><dt>演示收益</dt><dd className={holding.pnl > 0 ? 'positive' : 'negative'}>{holding.pnl > 0 ? '+' : ''}{holding.pnl}%</dd></div><div><dt>规则风险</dt><dd>{holding.risk}</dd></div></dl></article>)}</div>;
}
