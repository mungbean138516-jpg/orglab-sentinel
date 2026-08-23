# OrgLab Sentinel 路演资料

> 状态：`IMPLEMENTED · MOCK`  
> 用途：技术说明、路演讲稿与 PPT 素材的统一事实来源。

OrgLab Sentinel 是一个**多源证据驱动的 Agent 风险情报原型**。新闻／舆情 Agent 与公告／数据 Agent 分头处理不同来源，主管 Agent 保留一致点、冲突和未知项，风险解释 Agent 再将结果翻译成用户可读的风险说明；系统不替用户交易。

## 状态图例

| 标签 | 含义 |
| --- | --- |
| `IMPLEMENTED · MOCK` | 已在仓库中实现，但只使用固定演示数据 |
| `SIMULATED · NOT CONNECTED` | UI 可展示预期联动，未真实调用外部服务 |
| `PLANNED` | 概念级目标架构或后续路线 |
| `OPTIONAL · REQUIRES AUTHORIZATION` | 外部数据／工具需授权、合规与密钥配置 |

任何页面、PPT 或口头讲解都不得把后面三类状态说成“已经上线”。

## 当前可以证明什么

- `IMPLEMENTED · MOCK`：可点击的 React/Vite Prototype。
- `IMPLEMENTED · MOCK`：两个来源专项 Agent 的逻辑并行、结构化简报、主管综合、风险解释和人工门禁。
- `IMPLEMENTED · MOCK`：证据 ID、来源等级、未知项、冲突与 Patch 父子关系。
- `IMPLEMENTED · MOCK`：来源超时、证据冲突、传闻隔离等安全降级。
- `IMPLEMENTED · MOCK`：固定输入、固定规则的组织实验回放；不代表统计显著性。

## 当前不能声称什么

- 没有真实行情、新闻或交易所公告流。
- 没有真正调用通义千问、百炼、魔搭或外部 MCP 服务。
- 没有后台权限、生产级审计、账户体系或券商连接。
- 没有证明准确率、收益率、效率提升或市场规模。
- 不提供荐股、目标仓位、自动交易或收益承诺。

## 文档导航

| 文档 | 回答的问题 | 主要供谁使用 |
| --- | --- | --- |
| [系统架构](01_SYSTEM_ARCHITECTURE.md) | 当前怎么运行，未来怎么迁移 | 技术、PPT 第 3 页 |
| [Agent 层级](02_AGENT_HIERARCHY.md) | Agent 是谁、谁能做什么 | 全员、PPT 第 4 页 |
| [端到端流程](03_END_TO_END_EVENT_FLOW.md) | 一个事件如何从来源走到用户 | 主讲、演示人员 |
| [合同与安全](04_CONTRACTS_AND_SAFETY.md) | Agent 如何交接，错误如何被阻断 | 技术、答辩 |
| [阿里技术映射](05_ALIBABA_TECHNOLOGY_MAP.md) | 各项阿里能力为什么必要 | PPT 第 5、8、9 页 |
| [A 股适配层](06_A_SHARE_ADAPTER_LAYER.md) | 数据源如何替换而不重做架构 | 数据、答辩 |
| [演示脚本](07_DEMO_SCRIPT.md) | 75–90 秒现场怎么点、怎么讲 | 主讲、录屏人员 |
| [宣传与合规矩阵](08_CLAIMS_AND_COMPLIANCE_MATRIX.md) | 哪些话可以说，哪些不能说 | 全员 |
| [反馈决策](09_STAKEHOLDER_FEEDBACK_DECISIONS.md) | 团队建议最终怎么处理 | 产品、团队 |
| [PPT 素材映射](10_PPT_SOURCE_MAP.md) | 11 页分别取什么材料 | PPT、主讲 |
| [连接与密钥](11_CONNECTOR_SETUP_AND_SECRETS.md) | 外部工具如何安全配置 | 技术 |

## 统一路演口径

推荐：

> 当前是合同优先、Mock-first 的多 Agent 概念验证。它真实实现了流程、证据交接、冲突保留与安全降级；下一阶段才会把模拟节点替换为百炼编排的通义千问角色，并在完成授权与合规评估后接入数据。

必须出现：

> **仅为概念验证，落地需相应资质与合规评估。**

## 维护规则

1. UI、合同或场景发生变化时，同一个 PR 中更新对应路演文档。
2. 所有数字注明“演示值”“目标假设”或可核验来源。
3. 外部能力必须写清 `MOCK / PLANNED / CONNECTED / DEGRADED`。
4. PPT 中使用的图优先来自 [`diagrams/`](diagrams/)；截图需保留 MOCK 标识。
5. 真实 API Key、访问令牌、账户信息永远不得进入 Git。

