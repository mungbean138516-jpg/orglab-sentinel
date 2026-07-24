# 端到端事件流程

> 当前状态：`IMPLEMENTED · MOCK`  
> A 股实时来源：`PLANNED`

## 路演场景

建议使用一个虚构 A 股场景：

> 沪市样本 A 发布业绩预告修正，同时公开热度源将指标变化夸大为“经营失速”。

使用虚构主体可以完整展示流程，又不需要对真实公司作无来源判断。所有页面必须显示 `A 股演示 · MOCK`。

## 主流程

| 阶段 | 输入 | 处理 | 输出 | UI 证据 |
| --- | --- | --- | --- | --- |
| 1. 事件入队 | 虚构公司、事件、时间 | 标准化市场、证券、事件类型 | `Event` | 事件卡与 MOCK 标签 |
| 2. 专项并行 | 同一个 `Event` | 新闻与公告分别分析 | 两份工作状态 | 两张 Agent 卡片 |
| 3. 简报提交 | 专项来源 | 来源分级、事实／推断／未知项 | 两份 `EvidenceBrief` | 右侧完整报告 |
| 4. 主管综合 | 两份简报或降级状态 | 找一致、冲突和缺口 | `SupervisorSynthesis` | 冲突与未知项 |
| 5. 风险解释 | 主管综合、虚拟暴露 | 翻译成用户可读说明 | `UserRiskReport` | 风险报告与核验清单 |
| 6. 人工门禁 | 用户阅读 | 记录已阅读 | Review Patch | 不出现交易按钮 |

对应图：[event-sequence.mmd](diagrams/event-sequence.mmd)。

## 证据链

```text
Event
├── 新闻简报 Patch ──引用── 新闻／热度证据 ID
└── 公告简报 Patch ──引用── 公告／数据证据 ID
        ↓
主管 Patch ──引用── 两份简报 Patch
        ↓
风险报告 Patch ──引用── 主管 Patch
        ↓
用户 Review Patch
```

Patch 账本当前只是确定性浏览器状态，不是区块链或不可篡改数据库。

## 正常路径

1. 公告 Agent 找到模拟业绩预告修正。
2. 舆情 Agent 找到报道与热度线索，并折叠同源转载。
3. 两边共同支持“指标变化引发关注”。
4. “经营失速”只存在于媒体／热度叙事，公告没有支持这一强结论。
5. 主管保留两个不同层级的结论：指标变化已确认，夸张叙事待核验。
6. 风险报告只提示“关注并核验”，不产生仓位建议。

## 故障路径

### 来源超时

- 新闻 Agent 进入 `SOURCE_TIMEOUT`。
- 公告简报继续保留。
- 主管标记“来源覆盖不完整”。
- 风险分／影响值显示“暂不估计”。
- 用户看到“等待来源恢复后重跑”。

### 证据冲突

- 新闻叙事与公告方向相反。
- 主管不得选择更“顺耳”的一边。
- 决策进入 `QUARANTINE_SOURCE`。
- 最终仅生成核验报告，不产生交易动作。

### 数据过期

- 保留原始 `asOf` 和抓取时间。
- 显示 `STALE`，不冒充最新信息。
- 用户被要求寻找更新公告。

### 工具鉴权失败

- 连接器显示 `AUTH REQUIRED` 或 `DEGRADED`。
- 系统不得退回到未标记的模拟结果。
- 路演可切换到显式的离线 MOCK fixture。

## 状态机

对应图：[safety-state-machine.mmd](diagrams/safety-state-machine.mmd)。

```text
QUEUED
  → SPECIALISTS_RUNNING
  → BRIEFS_SUBMITTED
  → SUPERVISING
  → RISK_MAPPING
  → USER_REVIEW

异常分支：
SUPERVISING → QUARANTINED → VERIFICATION_ONLY
```

## 可观测字段

每次运行至少显示：

- `run_id`
- `data_mode`
- `as_of`
- `agent_status`
- `evidence_ids`
- `schema_version`
- `active_fault`
- `decision`
- `human_gate`

模拟延迟和响应秒数必须标注“演示回放”，不能用于证明真实性能。

## A 股与美股的关系

工作流本身市场无关。迁移到 A 股主要替换：

- SEC 文件 → 中国交易所／公司公告
- 美股 ticker → 市场、交易所、六位证券代码
- 美股事件类型 → 业绩预告、问询函、减持、质押、重大合同等
- 海外新闻口径 → 本土授权新闻与公开热度

Agent 层级、合同、冲突治理和人工门禁无需重做。
