# OrgLab Sentinel 独立公开数据试跑

2026-09-23｜9 条案例 × 3 个条件 × 1 次运行｜27 条实际输出

本次完成了一个小规模、可审查的封闭材料验证。单来源与多来源在 4/9 条题目上产生不同标签；相同多来源下，增加证据核验提示词没有改变任何标签。观察支持继续研究来源如何影响判断，但没有证明某种提示词更优、confidence 已校准或用户判断得到改善。

## 实验是怎样做的

选取三花智控订单传闻、浙江东方投资 DeepSeek 传闻、比亚迪 2024 年财务数据三个事件，共 6 份公开材料。模型只看到经过检查的短摘要，没有检索完整网页。每个事件有 3 条问题；3 条来自报道陈述的标准化改写，6 条是文档核对、范围、数值方向或跨年度推断测试题，不冒充真实流传的错误报道。

完整材料的临时参考标签为 Supported、Contradicted、Insufficient Evidence 各 3 条。标签在推理前固定，依据见 [annotations.json](annotations.json)，但由同一个助手整理，尚无独立人工标注审核。输入压缩、题目选择和提示词都可能带来偏差，属于开发试跑，没有训练集／独立测试集划分。

| 条件 | 每个事件看到的材料 | 提示词差异 |
| --- | --- | --- |
| single_source | 1 份新闻摘要 | 通用封闭材料核验与统一 JSON 格式 |
| multi_source | 同一新闻摘要 + 1 份公司披露摘要 | 与 single_source 相同 |
| evidence_aware | 与 multi_source 完全相同 | 加入原始来源、时间、主体、冲突和未知项检查 |

每组在无历史对话 fork 的新 Codex 上下文中一次处理 9 条；不提供参考标签和其他组输出。共享文件系统中的隔离依靠明确指令，不是安全隔离。输入、参考标签和协议在运行前记录 SHA-256；三个后台实验会话不等于三个不同模型。

实际模型环境：OpenAI GPT 系 Codex 助手，通过 ChatGPT Work 运行。未调用 Qwen、百炼或独立付费模型 API。精确模型快照、temperature、top_p、seed、输出 token 上限与实际 token 计费不可获取，均记为 null；不能声称 temperature=0 或完全可重复生成。每组只跑一次，没有为提高分数重试。**指标可由已保存输出确定性重算，重新推理不保证相同答案。**

## 结果与分母

| 指标 | single_source | multi_source | evidence_aware |
| --- | --- | --- | --- |
| 有效完成 | 9/9 | 9/9 | 9/9 |
| Macro-F1 完整材料参考标签 | 0.522 | 1.000 | 1.000 |
| Macro-F1 各自可见材料参考标签 | 1.000 | 1.000 | 1.000 |
| Conflict recall | N/A，0 个可见参考冲突 | 1/1 | 1/1 |
| Citation coverage | 8/9，88.9% | 9/9，100% | 9/9，100% |
| Abstention accuracy 各自材料 | 9/9 | 9/9 | 9/9 |
| 实际 abstain 比例 | 6/9 | 3/9 | 3/9 |
| Abstention precision | 6/6 | 3/3 | 3/3 |

单来源与普通多来源的 label disagreement 为 4/9（44.4%），与 evidence-aware 也是 4/9；普通多来源与 evidence-aware 为 0/9。27 条输出均通过结构检查，没有缺失输出。

完整材料 F1 衡量整个信息条件的差别；各自材料 F1 衡量是否正确理解所见摘要。后者的 Supported 只代表文字支持关系，不代表已经确认现实事实。两个分数不能混用来宣称模型能力提高。Conflict recall 只有一个真正的肯定陈述／公告否认对，不宜解读为稳健能力。Citation coverage 只检测存在有效来源 ID，不证明引用内容蕴含结论；单来源 C05 没有对应业绩证据，空引用和拒答是合理行为。置信度 0.95–0.99 是标签自报确信度，Insufficient Evidence 的 0.99 表示确信材料不足。

完整计算规则在 [PROTOCOL.md](PROTOCOL.md)，逐类 F1、分子分母与全部逐条结果在 [results.json](results.json)。

## 两个实际分歧案例

### C04 浙江东方是否投资 DeepSeek

2 月 5 日媒体评论称浙江东方通过旗下基金参与 DeepSeek 天使轮投资；2 月 6 日公司公告称公司及管理基金没有直接或间接投资深度求索，并指出北京深度搜索等是不同主体。

- 单来源：Supported，confidence **0.95**，引用 ZHE-N，同时承认缺少原始投资文件。
- 多来源：Contradicted，confidence **0.98**，引用 ZHE-N、ZHE-P，并保存新闻与公告的冲突。
- Evidence-aware：同样为 Contradicted、0.98，另外把缺少原始投资文件保留为 unknown。

这表明来源受限时，模型即使输出很高的确信度，也可能只是在复述错误报道。这里的完整材料参考判断依赖公司公开披露，仍不是对所有底层投资事实的独立审计。

### C01 三花智控是否获得机器人大额订单

新闻报道的是待核实的订单传闻；随后公司澄清称传闻不属实。

- 单来源：Insufficient Evidence，confidence **0.99**，abstain=true，引用 SAN-N。
- 多来源与 evidence-aware：Contradicted，confidence **0.98**，abstain=false，引用 SAN-N、SAN-P。

新增证据使状态从“还不能判断”转为“被公告反驳”。新闻转述传闻本身不等于媒体确认订单。Evidence-aware 还提出“记者致电获得回应”与“公司未接受媒体采访”的张力；这可能来自“采访”的定义差异，与订单事实并非同一冲突，应交人工审核，不能把多输出一个 conflict 就当作更好。

## 数据来源

使用事实摘要与数值，不打包转载全文。检索核对日期均为 2026-09-23，日期只指历史材料，不是实时企业状态。

| ID | 发布日期 | 公开材料与定位 |
| --- | --- | --- |
| SAN-N | 2025-10-15 | [每日经济新闻转载21财经](https://www.nbd.com.cn/articles/2025-10-15/4091767.html)，订单传闻与证券部回应 |
| SAN-P | 2025-10-16 | [三花智控澄清公告](https://paper.cnstock.com/html/2025-10/16/content_2131544.htm)，上海证券报刊载，2025-093，董事会署名10月15日 |
| ZHE-N | 2025-02-05 | [证券之星转载博望财经评论](https://wap.stockstar.com/detail/IG2025020500015469)，浙江东方段落 |
| ZHE-P | 2025-02-06 | [浙江东方异常波动公告](https://paper.cnstock.com/html/2025-02/06/content_2024968.htm)，上海证券报刊载，2025-005 |
| BYD-N | 2025-03-24 | [第一财经财报报道](https://www.yicai.com/news/102532048.html)，收入、利润、经营现金流 |
| BYD-P | 2025-03-25 | [巨潮资讯年报摘要 PDF](https://static.cninfo.com.cn/finalpage/2025-03-25/1222881505.PDF)，2025-014，第2页主要财务数据 |

直接获取浙江东方交易所 PDF 时遇到不可访问问题，已改用公开刊载的公司公告原文，并在记录中保留实际使用的 URL。两个上海证券报链接是公司公告的一手内容转载，不伪称为直接交易所链接。

## 做成了什么及仍未解决什么

已完成证据来源整理、9 条临时标注、三组固定输入、27 条实际结构化输出、五类指标计算、两个分歧案例与资源记录。每条输出包含 label、confidence、citations、conflicts、unknowns、abstain 和简短理由。

本轮未发生 token 不足、额度报错或输出截断；实际限制是预算意识和元数据不可见，因此只做 3 次小批量会话。记录“未调用付费 API”不代表总成本为零，仍消耗当前产品额度，无法给出精确余量或费用。

原 mock 原型此前审查发现的三项合同问题仍待单独修复：缺少 synthesis.conflicts 可能通过校验、来源 brief ID 不一致可能漏检、删除 claims 可能触发 TypeError。本试跑没有用其固定 mock 分数作为模型结果，也没有修改网页业务流程。现有测试通过并不消除这些已知缺口。

下一步优先人工复核这 9 条参考标签与摘要，特别是 C04 的公司主体和 C01 的采访措辞，再决定是否扩展到 30–50 条并做独立留出集。若以后比较 prompt 效果，应保持来源一致并重复运行；若要报告 calibrated confidence，需要单独设计校准与测试。此次仅有一次预先设计的 prompt 对照，没有结果驱动的多轮调参。

Q1 研究问题可继续使用：How does presenting model disagreement, source provenance, and calibrated confidence affect users’ ability to judge the reliability of AI-generated assessments of corporate and economic information? 本次仅为来源差异和展示内容提供探索材料；用户信任或判断是否改善需要独立 user study。

## 复算与检查

在仓库根目录运行，仅需 Python 3 标准库，评估不调用模型：

```bash
python3 experiments/public_data_pilot_20260923/evaluate.py --output /tmp/orglab-pilot-results.json
python3 -m unittest discover -s experiments/public_data_pilot_20260923 -p 'test_*.py' -v
npm ci --no-audit --no-fund
npm run check
```

本轮评分测试 6/6 通过；原型测试 19/19 通过；Vite 生产构建通过。`npm` 的 http-proxy 环境配置警告未阻断构建。见 [verification.log](verification.log)。

| 文件 | 内容 |
| --- | --- |
| [sources.json](sources.json) | URL、时间、出版主体、定位、短摘要 |
| [annotations.json](annotations.json) | 参考标签、构造题标记、依据、条件内标签 |
| [inputs](inputs) | 三组实际输入与完整实验提示词，无参考标签 |
| [outputs](outputs) | 三组原始模型 JSON 答案，未经补写或改标签 |
| [manifest.json](manifest.json) | 运行前哈希、规模、模型与参数可得性 |
| [dispatch_messages.json](dispatch_messages.json) | 实际下发给三个会话的外层指令 |
| [execution_record.json](execution_record.json) | 完成状态、资源限制、问题、输出哈希 |
| [evaluate.py](evaluate.py) / [results.json](results.json) | 指标实现与完整结果 |

本次后续验证由项目负责人与 AI 助手协作完成；公开材料、临时标签和运行操作均有助手参与。它不代表阿里正式产品、真实交易系统、底层大模型训练成果或已完成的用户研究。
