# September-to-v2 candidate change log

Base: draft PR #7 head `b6d087bdf5de1d6151385b6f7b56fdc4de65e6fd`. Date: 2026-10-01. Scope: prepared dataset, evaluator gate, source audit and CI verification. The September 23 files remain byte-for-byte unchanged.

| Item | Frozen September state | v2 candidate correction | Evidence / remaining risk |
| --- | --- | --- | --- |
| C01 | Claim converted 6.85亿美元 to “约50亿元” without exchange-rate source | Uses the original USD amount and date | Direct original NBD/21财经 page gives USD amount; issuer denial is generic, so exact rumor alignment is unresolved and human label remains null. |
| C02 | Clarification claim | Wording retained | Issuer notice confirms the broad denial; human label remains null. |
| C03 | “现有材料能够确定…” mixed a statement about evidence with a revenue claim | Direct 2025 robot-business revenue proposition | No such full-year division figure in dated packet; future records are outside cutoff. |
| C04 | Investment claim left legal entity and fund scope loose | Specifies 浙江东方, fund-division managed private funds, 杭州深度求索, and at least one actor | Company notice denies this limited claim at disclosure; commentary asserts investment. An issuer disclosure is a reference rule, not independent proof. |
| C05 | 9.47亿元 forecast claim | Wording retained | Notice says preliminary estimate, annual report controls final amount. |
| C06 | “相关基金” and “准确持股比例40%” had unclear aggregation | Specifies fund-division aggregate stake in 北京深度搜索 at cutoff | 40% is an authored probe, not a sourced number. No negative ownership inference. |
| C07 | BYD revenue claim | Wording retained | Filing units and rounding rechecked. |
| C08 | Reverse-direction cash-flow probe | Wording retained | Filing shows −21.37%, making “增长21.37%” the constructed contradiction. |
| C09 | “根据现有材料，可以确认…” mixed a meta-judgment with 2025 performance | Direct 2025 attributable-profit growth proposition | Dated packet only supplies 2024 growth. |

Source paraphrases changed separately from claims: ZHE-P drops unsupported “未经审计” and an answer cue about missing stake percentage; BYD-N uses its own generic “净利润” rather than borrowing “归母” from the filing; BYD-P drops an answer cue about missing 2025 projections. SAN-N and ZHE-N summaries retain the reported assertions and remove analyst conclusions. Direct inspection of the original Zhejiang page confirms section 02, not 01; the original SAN-N page confirms the USD amount, source credit and phone call. An earlier independent AI browser review also opened both original URLs; this task's browser reader initially failed, then direct public HTML fetches on this Mac succeeded. Neither AI review is independent human labeling.

All three prompts share the same dated-packet, disclosure-reference and output contract. Evidence-aware adds only provenance/conflict/unknown checks; multi_source and evidence_aware use identical evidence packets. Input JSON contains no proposed reference labels. The September outputs are not copied or rescored against these changed inputs.

The v2 candidate has **zero** new model calls, prediction batches, saved outputs or metrics. It has nine assistant-proposed full-packet labels for review and **zero** independent human labels. The evaluator can verify candidate integrity now but refuses to score until a separately versioned, human-labeled frozen run exists. Historical metrics remain those of the September experiment only.

CI now runs Python metric unit tests, a byte-for-byte saved-results rerun, the six recorded pre-run and three post-run hash checks, and v2 candidate integrity checks alongside the existing npm test/build. No paid API or new package dependency is required for these checks.
