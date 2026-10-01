# Oxford 导师进展报告｜OrgLab Sentinel

**日期：**2026-10-01

**项目状态：**实习原型可本地演示；实习后的个人公开数据试跑已完成一轮；今天完成来源审计、修订版候选数据与自动验证，但未运行修订版模型实验。
**一句话结论：**真实公开材料已经暴露出来源差异、传闻与公告冲突、以及摘要设计对模型判断的影响；目前只能报告小样本、临时参考标签下的探索性观察，不能报告经人工确认的 accuracy、prompt 优势或用户信任改善。

## 1. 与本次会议目标的对应

本次会议提出的下一步是主动跨出 mock prototype：使用真实公开证据，展示清楚的 experimental design、data preparation、existing-model/prompt evaluation、结果与不确定性，并把 evidence/source disagreement 连到未来研究问题——用户怎样判断 AI 生成企业与经济信息的可靠性。今天的工作没有把网页 mock 说成线上数据系统，也没有为赶进度训练模型或启动付费推理。先核对已经做过的试跑，再修复资料问题，并准备一个独立的新版本，保留可审计的时间顺序。

以下四个阶段必须分开讲：

| 阶段 | 已发生的工作 | 可以主张 | 不可以主张 |
| --- | --- | --- | --- |
| 原实习原型 | 项目记录显示：负责人带领七人团队，将模糊任务拆成舆情、公告、主管、风险解释等模块；设计 evidence/source/conflict/unknown/human-review 逻辑，迭代 input、prompt 与模块结构。当前仓库是 React/Vite、固定虚构 A 股 fixtures、确定性 JavaScript 状态机、AJV 合同和人工阅读门禁。 | 可运行的 mock-first 交互原型；逻辑证据链、异常降级和不交易边界。 | 实习期间已经接入真实公告/舆情、百炼/千问、券商，或部署四个真实模型 Agent。 |
| 实习后个人试跑（2026-09-23） | 个人与 AI 助手协作收集六份公开材料的短摘要，拟九条 claim、三组冻结 prompt；在 ChatGPT Work/Codex 的三个新上下文各跑一批，保存 27 条结构化输出、临时参考标签、哈希和 deterministic scorer。 | 一轮带完整输入、输出和代码的探索性 public-data pilot。 | 阿里正式产品、独立模型训练、人工标注 benchmark、用户研究或准确率认证。 |
| 今天的修订与验证（2026-10-01） | 核查六个原始来源链接：较早的独立 AI browser review 成功打开六条；本任务 browser reader 对 SAN-N、ZHE-N 初次失败，随后在本机直接获取两页原始 HTML 并核实内容、时间和定位。建立独立 v2 candidate，修正金额、措辞、范围、摘要和定位；补 CI Python/hash/result 检查，全部本地通过。 | 原运行可确定性复算；修订版输入已备好且 integrity checks 通过。 | 已用 v2 得到新的预测或分数；AI 二次审查等于独立人工核验。 |
| 后续研究 | 独立人工标签、来源核对、新事件扩容、冻结后重复模型运行、再设计 participant study。 | 可向导师讨论可检验的 research question 与可行设计。 | 当前已经证明 UI 或提示词让人更信任、更准确或更理性。 |

## 2. 原型：现有能力及研究动机

原型的问题不是让 AI 推荐股票，而是当媒体传闻、发行人公告和缺失数据交织时，如何向人呈现证据状态。舆情 Agent 和公告 Agent 在前端状态机中逻辑并列；主管保留一致、冲突和未知，风险解释只出带 citation 的核验报告，用户阅读门禁不触发交易。三个展示事件与股票代码均为虚构 fixtures。代码有 JSON Schema、运行时 AJV、Patch lineage、来源超时与旧公告等 fault injection；这些是软件/交互设计证据，不是模型对真实资料的测量结果。现有目标架构中的 Qwen、百炼、ModelScope/EvalScope、MCP、钉钉仍属计划或授权后工作，不应把工具连接器称为 Agent 或真实性证书。

正是这个 mock 与 empirical evidence 之间的缺口促成了 9 月个人试跑：当可见材料从一条新闻增加到新闻加公司披露，模型标签和引用是否变化？当证据相同、只增加来源/冲突/未知检查说明，输出是否变化？这些问题在封闭材料中可以初步观察，但不能直接回答人的判断是否改善。

## 3. 9 月 23 日已完成的 empirical pilot

### 3.1 数据准备与实验设计

数据来自三个 event clusters：三花智控大额机器人订单传闻、浙江东方/DeepSeek 投资说法、比亚迪 2024 年财务数据。每个 cluster 有一条新闻或评论与一条公司材料，共六份公开来源；模型看到的是带 URL、时间、主体和 locator 的**短摘要**，没有自主网页检索或完整原文阅读。九条中文 claim 中，三条是报道陈述的标准化改写，六条是明确构造的文档、范围、方向或未来外推 probe。因此分母 9 不等于九个独立现实事件；真实独立 cluster 只有 3。

三个条件各一次、各九题：

1. `single_source`：每事件仅一条新闻/评论摘要，通用 closed-packet prompt。
2. `multi_source`：同新闻再加一条公司公告/年报摘要，与 single-source 相同 prompt。
3. `evidence_aware`：与 multi-source 完全同样的证据，再增加 provenance、冲突、未知和适用范围检查。

September `PROTOCOL.md`、`sources.json`、`annotations.json`、三个 `inputs/*.json` 的预记录哈希，以及三个 `outputs/*.json` 的运行后哈希均在仓库。单来源对多来源**同时改变信息量**，不能解释为纯 prompt effect；后两组才是同材料的一次 prompt 对照。三个新会话共用同一产品及文件系统，依指令隔离，不是三种独立模型，也不是安全隔离。参考标签由 AI 助手准备，未有人类 reviewer 签字；没有 train/test split。

### 3.2 模型、设置和资源 provenance

实际运行环境记录为 ChatGPT Work 中 GPT 系 Codex 助手。三组各一批，没有为改高分数重试；没有 Qwen、百炼或付费 model API 调用。原运行记录的 Python 为 3.12.14、Node 为 24.19.0。**Exact model snapshot、temperature、top_p、seed、max output tokens、精确 token 数、费用与剩余额度均未暴露，记录为 null。**因此保存输出的 scoring 是 deterministic 的；重新 inference 不保证生成同一答案。不能由“没有付费 API”推出零资源成本，ChatGPT Work 使用仍消耗产品额度。

### 3.3 结果：只按临时参考标签解释

| 指标（分母见注） | single_source | multi_source | evidence_aware |
| --- | ---: | ---: | ---: |
| 有效结构化输出 | 9/9 | 9/9 | 9/9 |
| 完整材料**临时参考标签** macro-F1 | 0.522 | 1.000 | 1.000 |
| 各自可见材料**临时参考标签** macro-F1 | 1.000 | 1.000 | 1.000 |
| 可见参考冲突 pair recall | N/A，0 pair | 1/1 | 1/1 |
| 有有效来源 ID 的 case | 8/9 | 9/9 | 9/9 |
| 按各自材料的 abstention 判断 | 9/9 | 9/9 | 9/9 |
| 实际 abstain | 6/9 | 3/9 | 3/9 |

single-source 对 multi-source 标签不同 **4/9**（C01/C02/C04/C05）；multi-source 对 evidence-aware 为 **0/9**。后两组相同的标签不支持“新增 evidence-aware prompt 提高了分类表现”。Conflict recall 仅有一个可见 reference pair，不能报告稳健的冲突检测能力。Citation coverage 只判断合法 source ID 是否出现，不证明引用内容真正蕴含结论。Confidence 是模型的 self-report，不是 calibrated probability；一次九题没有校准曲线。

**案例 C04：**财经评论声称浙江东方通过基金参与 DeepSeek 投资，随后公司公告在其披露日否认公司及相关私募基金投资特定法律主体。单来源输出 Supported、confidence 0.95；多来源输出 Contradicted、0.98，并记录报道与公告的冲突。这里的 “Contradicted” 是按预定“公司自身披露事项优先参照直接相关公告”的有限规则判断，不是对底层投资事实的独立审计。**案例 C01：**新闻转述具体 Tesla/6.85 亿美元订单传闻，公司公告否认机器人大额订单传闻；原模型从 single-source 的 Insufficient Evidence/abstain 切到两种多来源的 Contradicted。今天发现公告没有明确列出 Tesla、金额或 Optimus，因此“是否恰好同一传闻”的 correspondence 尚需人工核查；不能把 C01 当已认证的精确反驳案例。

### 3.4 不确定性与偏差

这是 development pilot，只有三个 event clusters、每条件一次、没有独立人工 gold labels、没有 held-out event、没有模型重复、没有 participant。九题之间同事件关联，不能以 27 个输出当作 27 个独立实验样本。均衡的三类标签由构造题形成，可能提高小数据上的 macro-F1；摘要选择、先前撰写的 label rationale、来源优先规则及提示词都可能引入 bias。因而这里报告原始计数、可复算分数与具体分歧，不给具有虚假精度的 confidence interval，不外推到总体、真实用户或交易结果。

## 4. 今天实际完成的 source audit 与修订

今天核查了全部六个原始来源：[三花新闻（每日经济新闻转载 21 财经）](https://www.nbd.com.cn/articles/2025-10-15/4091767.html)、[三花公司澄清公告](https://paper.cnstock.com/html/2025-10/16/content_2131544.htm)、[浙江东方评论（证券之星载博望财经）](https://wap.stockstar.com/detail/IG2025020500015469)、[浙江东方公司公告](https://paper.cnstock.com/html/2025-02/06/content_2024968.htm)、[第一财经 BYD 报道](https://www.yicai.com/news/102532048.html)及[BYD 年报摘要 PDF](https://static.cninfo.com.cn/finalpage/2025-03-25/1222881505.PDF)。较早的独立 AI browser review 成功打开六条；本任务的 browser reader 起初打不开 SAN-N、ZHE-N，但随后在本机直接获取两页原始 HTML（HTTP 200），复核了原文、署名、时间与定位。此前使用的[一财同源转述](https://www.yicai.com/brief/102864170.html)和[同标题文章](https://www.laohu8.com/m/post/400261677977968)仅为辅助，**不算独立交叉证据**。两次 AI 核查都不等于独立人工标注。详细记录见 v2 的 `SOURCE_AUDIT.md`。

修订版 `public_data_pilot_v2_20261001`独立存放，不覆盖 9 月目录：

- C01 从无汇率来源的“约50亿元”恢复为新闻报告的 **6.85亿美元**，但保留公告对应性未定。
- ZHE-P 摘要删除公告未写出的“未经审计”；保留“初步测算，最终以年报为准”。ZHE-N 原 locator 的“01”错误：**原始证券之星页面**和同标题转载均为“02 浙江东方”；新记录已改为 02。
- BYD-N 摘要沿用新闻的“净利润”，不把公司表格的“归母”口径偷偷带入新闻。BYD-P 保留元单位、2024/2023 数据和 −21.37% 方向。777,102,455,000 元 ÷ 1亿 = 7771.02455 亿元，约 7771.02 亿元。
- 从短摘要移走“没有持股比例”“未给出2025预测”等整理者写出的 answer cues，把这类判断放到注释或后续 reviewer 的 rationale，不放进模型 evidence。
- C03/C09 改为直接的收入/利润陈述，消除“现有材料能够确认”的 meta-claim；C06 说明是基金板块**合计**持股比例的构造数字；C04 明确法律主体、时点与至少一方量词。三组新 prompt 均使用相同的 issuer-disclosure rule；同证据的两个多来源组只差 provenance 检查。

`annotations.json`保留 AI 的 proposed reference 供 reviewer 挑战，但九条 `human_full_packet_label` 与每条件 `human_by_condition` 全是 null；`scoring_eligible=false`。v2 仍是 **candidate_not_run**：0 新 batch、0 新 prediction、0 新 metric，未来 model/settings 也为 null。今天的 checksum 是 prepared candidate 的完整性记录，不伪称已在推理前冻结。代码明确拒绝对这个 candidate 输出 accuracy。把 9 月的旧 outputs 改用新 claims/summaries 重算会把不同任务混为一谈，因此没有这样做。

## 5. 代码、自动验证与复现

新增 `scripts/verify_public_data_pilot.py` 对 9 月记录独立核验 **6 个 pre-run**、**3 个 post-run** SHA-256，重新用未改动的 9 月 scorer 计算并与 committed `results.json` 做 byte-for-byte 比较，也检查 3×9 有效输出。新增 v2 integrity tests：无模型/人工结果、候选数据哈希完整、篡改输入会失败、候选状态不能评分。CI 工作流现将这些 Python checks 与既有 npm test/build 放在同一 pull-request gate；新 CI 只有本地验证，**因尚未 push，GitHub 尚未运行修改后的 workflow**。

本机复现命令（仓库根目录，Python 标准库，不触发模型）：

```bash
python3 -m unittest discover -s experiments/public_data_pilot_20260923 -p 'test_*.py' -v
python3 scripts/verify_public_data_pilot.py
python3 experiments/public_data_pilot_v2_20261001/evaluate.py --verify-only
python3 -m unittest discover -s experiments/public_data_pilot_v2_20261001 -p 'test_*.py' -v
npm ci --no-audit --no-fund
npm run check
git diff --check
```

2026-10-01 本机结果：原 metric unit tests **6/6 pass**；9 月六个输入/协议/标签哈希与三个输出哈希 **9/9 match**；27/27 输出结构有效，复算 `results.json` **byte-for-byte match**；v2 tests **3/3 pass**、12 个 candidate 文件哈希匹配；npm 原型测试 **19/19 pass**，Vite build pass，`git diff --check` pass。本机 Python 是 3.9.6、Node 是 24.18.0；与原实验记录版本不同，但 deterministic 保存输出得到完全相同的评分。新版 CI 固定 Python 3.12 与 Node 22；其远端结果待 push 后验证。

## 6. 对导师可提出的下一步研究

建议把问题写成：**How does presenting model disagreement, source provenance, and calibrated confidence affect users’ ability to judge the reliability of AI-generated assessments of corporate and economic information?** 本试跑只帮助设计前两个展示因素的任务素材，尚无 calibrated confidence 或任何 user outcome。

建议按以下顺序推进：

1. **Independent reference review：**至少一名不看模型输出的人工 reviewer 独立阅读六个原始来源，对九题逐条记录 full-packet 与 condition-specific 标签、证据 ID、日期、理由与分歧；优先查 C01 对应关系、C04 法律主体。若 C01 无法匹配，应改题或剔除该 case，并在新版本中预先声明，不能事后按分数选择。现有九题都属于已看过的 development material。
2. **新事件采样与冻结：**扩为多个 event clusters，先定 inclusion/exclusion、材料截止时间、公开文本使用权、来源类型、构造题比例和分层抽样；按事件划分开发与 held-out，避免同一事件改写题跨集合。确定模型、版本、参数/不可得字段、batch 次数、seed 策略、无效输出处理和 primary metric 后再运行。
3. **模型比较：**用相同材料比较普通与 evidence-aware prompt；另把“增加来源”作为独立因子。每条件重复而非单次；预先指定 paired case/cluster contrasts、置信区间或 bootstrap 的 cluster 单位，并报告实际分母、missingness、模型输出与来源引用质量。没有可用 calibrated probabilities 前，只称 self-reported confidence。
4. **Human study（另立协议）：**随机分配用户看到单一结论、带来源、带冲突、带可解释 uncertainty 等界面；选择有独立核验答案的新事件，测人的事实判断正确率、适当 abstention、证据识别、决策时间与主观信任。明确“信任”是否与正确判断相匹配，不能只测喜欢程度；先做伦理、招募及隐私审查。现阶段没有招募参与者，也没有用户研究数据。

**需要导师讨论的关键决策：**研究重点应先落在“来源增加造成的判断变化”，还是“相同来源下的 provenance/disagreement 呈现对人的判断影响”？第一问题可用模型实验推进；第二问题需要独立用户实验。两者不宜混写成一个已完成结论。

## 7. 交付位置与发布状态

原运行证据在 `experiments/public_data_pilot_20260923/`；新候选数据、source audit、change log、manifest、run status 与 evaluator 在 `experiments/public_data_pilot_v2_20261001/`；自动核验脚本在 `scripts/verify_public_data_pilot.py`；workflow 在 `.github/workflows/ci.yml`。本报告只描述本地 branch `codex/public-data-pilot-revision` 上的成果；没有 push、提交 GitHub review、合并或部署。建议先让负责人审阅 C01 对应性、九条参考标签和本报告，再将此分支作为 Draft PR 发布供来源/实验方法复核，而不是把 v2 candidate 对外呈现为新的准确率结果。
