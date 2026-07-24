# 结构化合同与安全边界

> 当前合同：`IMPLEMENTED · MOCK · v1.1`  
> 更细粒度的事实／推断字段：`PLANNED · v1.2`

## 为什么合同比 Agent 数量重要

如果 Agent 只交换自由文本，来源、冲突和未知项容易在总结中消失。OrgLab Sentinel 要求每一层按固定合同交接，并让下游引用上游 ID。

## 四个核心合同

| 合同 | 生产者 | 消费者 | 必须保留 |
| --- | --- | --- | --- |
| `Event` | 事件入口 | 两个专项 Agent | 事件 ID、市场、时间、来源引用、数据模式 |
| `EvidenceBrief` | 新闻／公告 Agent | 主管 Agent | 来源、证据 ID、发现、未知项、置信规则 |
| `SupervisorSynthesis` | 主管 Agent | 风险 Agent | 一致点、冲突、缺失证据、决策 |
| `UserRiskReport` | 风险 Agent | 用户 | 证据状态、风险解释、核验清单、人工门禁 |

当前 Schema 位于 [`../contracts/`](../contracts/)。

## 合同不变量

1. 下游结论必须引用上游记录。
2. `MOCK`、`LIVE_DELAYED`、`LIVE` 不得静默互换。
3. “未找到”不等于“事件不存在”。
4. 置信度不能替代来源层级。
5. 冲突不能被删除或平均。
6. 缺失来源必须进入 `gaps` 或 `missing`。
7. `humanGate` 永远为必需。
8. 风险报告不得生成自动交易指令。

## A 股 v1.1 已实现范围

### Event

当前 v1.1 使用 A 股式证券标识：

```json
{
  "ticker": "600XXX.SH",
  "dataMode": "MOCK",
  "eventType": "DISCLOSURE_SIGNAL",
  "asOf": "FIXED_DEMO_TIME"
}
```

当前事件类型：

- `DISCLOSURE_SIGNAL`
- `EXCHANGE_INQUIRY`
- `UNVERIFIED_RUMOR`

### EvidenceBrief

v1.1 来源类别：

- `exchange_announcement`
- `issuer_announcement`
- `corporate_registry`
- `licensed_news`
- `public_trend`
- `social`
- `mixed`

当前 `findings` 仍为字符串数组，证据引用保存在同一简报的 `evidence` 中。下一版可将 finding 升级为带类型和引用的对象：

```json
{
  "type": "fact",
  "text": "示例公司发布业绩预告修正",
  "evidenceIds": ["SIM-CNINFO-001"],
  "asOf": "FIXED_DEMO_TIME"
}
```

`type` 只能是 `fact`、`inference` 或 `unknown`。

### SupervisorSynthesis

主管应输出“最弱共同结论”，而不是追求看起来完整：

```json
{
  "agreement": "业绩预告修正已被模拟公告确认",
  "conflicts": ["供应商停产仅存在热度线索"],
  "missing": ["供应商或公司一级来源"],
  "decision": "WATCH_AND_VERIFY"
}
```

### UserRiskReport

v1.1 已删除容易被理解为仓位建议的 `targetRange`，改用：

```json
{
  "action": "REVIEW_EVIDENCE",
  "exposureSummary": "虚拟持仓集中度较高，仅作演示",
  "humanGate": true
}
```

当前动作枚举：

- `REVIEW_EVIDENCE`
- `WATCH_FOR_CONFIRMATION`
- `NO_ACTION_INSUFFICIENT_EVIDENCE`

隔离场景通过 `status`、主管决策和核验清单共同表达；如果以后需要机器可读的独立隔离动作，再在 v1.2 中版本化新增。

## 风险分和图表

团队反馈指出 `68/100`、`29%–32%`、`−6% 至 −9%` 缺少可验证依据。优先方案是删除目标仓位和压力收益数字。

如果保留“演示风险指数”，必须同时展示：

- 输入变量
- 权重与公式
- 规则版本
- 数据时间
- `DEMO INDEX · NOT INVESTMENT ADVICE`

图表只解释可见输入，例如：

- 虚拟持仓集中度环形图
- 某个模拟指标随时间变化及用户预设关注线
- 来源覆盖和验证状态

## Patch 账本

Patch 的价值是记录责任与引用关系：

- 谁生成了内容
- 写入哪个命名空间
- 引用了哪些证据
- 哪个决策覆盖了哪个冲突
- 用户是否阅读

当前 Patch 是 `IMPLEMENTED · MOCK` 的浏览器确定性状态，不是不可篡改审计。生产版需要追加式后端存储、身份、授权、时间戳、内容哈希和 Schema 版本。

## 安全降级判定

| 条件 | 必须行为 | 禁止行为 |
| --- | --- | --- |
| 单一来源超时 | 保留已有简报，标记覆盖不足 | 猜测缺失来源 |
| 来源方向冲突 | 隔离综合结论 | 静默择一或取平均 |
| 只有热搜传闻 | 等待一级来源 | 输出确定风险或交易动作 |
| 数据过期 | 标记 `STALE` | 显示为实时 |
| Schema 不通过 | 拒绝进入下一阶段 | 让模型自由补字段 |
| 外部服务失败 | 显示降级／鉴权状态 | 用未标记 MOCK 冒充 LIVE |

## 路演可用表述

> 我们的技术可行性不依赖重新训练金融大模型，而是依靠版本化合同约束 Agent 的职责与交接。当前已经验证流程和安全降级；未来只需要在合同两端替换为百炼节点和合规数据适配器。
