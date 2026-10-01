# Independent public data pilot protocol

Frozen before inference on 2026-09-23. This is an exploratory development pilot, not a held-out benchmark, Alibaba deployment, live financial service, or user study.

## Design and budget

- Nine Chinese claim cases in three company/event clusters; six public documents represented by short, checked paraphrases. Three claims normalize reported assertions; six are explicitly author-constructed document, scope, direction or future-extrapolation probes. These are not nine independent real-world misinformation incidents.
- Full-packet provisional reference labels are balanced: three Supported, three Contradicted, three Insufficient Evidence. A single assistant prepared sources and annotations; independent human review is pending. Case selection and summarization can introduce bias.
- Three fresh experimental conversation contexts, one batch of nine cases each, one run per condition. No history fork, browsing, other experiment files, gold labels or peer outputs. Isolation is instruction-based in a shared filesystem. Provider system instructions remain present and are not part of the saved experimental prompt.
- `single_source`: one news summary per company plus the common instruction. `multi_source`: news plus issuer document, same common instruction. `evidence_aware`: exactly the same evidence as multi-source plus explicit provenance, conflict and unknown handling instructions.
- All conditions receive the same output fields. Single versus multi changes information availability; it is not a pure prompt comparison. Multi versus evidence-aware isolates the added instruction within this one small run.
- Stop after three batches; no model sweep, retries to improve a score, or paid model API calls. ChatGPT Work usage consumes account allowance. Precise token counts and remaining quota are unavailable. Log actual failures; never infer that a token limit was hit merely from a short response.
- Inputs, annotations and source summaries are SHA-256 recorded in `manifest.json` before dispatch. No training or calibration; no train/test split is claimed. Model snapshot, sampling settings and seed are unavailable and must remain null, not invented defaults.

## Prediction contract

One JSON object per condition with exactly nine `predictions`. Each prediction has `id`, `label`, `confidence` (self-reported certainty in the chosen label, 0–1), `citations` (source IDs), `conflicts` (source ID pair and short description), `unknowns`, `abstain` and a short `rationale`. Insufficient Evidence means `abstain=true`; other labels require false. Confidence is not calibrated and is not an estimated investment or event probability.

Inputs use source paraphrases, not full original documents; models are not tested on autonomous retrieval or full-document comprehension. Reference judgments apply to the supplied material and its dates. An issuer denial is a disclosure-based reference, not independent proof of every underlying event.

## Metrics fixed before inference

- **Macro-F1**: unweighted mean of F1 for the three labels, zero for an undefined class F1. Primary comparison uses `gold_full_packet` for all methods: missing evidence is part of the system-level comparison. Also report condition-specific macro-F1 against `gold_by_condition` to distinguish evidence availability from interpretation errors. A media-only Supported label is a textual support judgment, not verified real-world truth.
- **Conflict recall**: recovered reference source pairs / reference pairs *visible in that condition*. The sole direct affirmative-assertion/denial pair is C04, ZHE-N versus ZHE-P. Single-source has no visible reference pair and is N/A. C01 reports an unconfirmed rumor followed by a denial; do not conflate reporting a rumor with asserting its truth. Additional emitted conflicts are retained, not automatically certified correct by this recall score. The multi-source denominator is only one.
- **Citation coverage**: cases with at least one valid, same-cluster source ID / nine planned cases. This measures reference presence, not entailment or citation quality. Also report valid IDs / all emitted citation IDs.
- **Abstention accuracy**: fraction of all nine planned cases where `abstain` equals whether the condition-specific reference label is Insufficient Evidence. Missing/invalid responses are incorrect. Also report abstention rate and precision (correct abstentions / emitted abstentions); precision is N/A if none. There are no calibrated confidence-based abstention thresholds.
- **Disagreement**: pairwise unequal labels / jointly valid cases, with denominator and missing cases stated; also any-condition disagreement among complete triples. These are same-runtime context/prompt/evidence disagreements, not independent-model disagreement.
- Schema-invalid or absent cases are recorded as failures. They do not disappear from macro-F1, coverage, or abstention denominators. No output repairs that alter labels or citations. A malformed batch is preserved for diagnosis.

## Reporting rules

Preserve raw responses, inputs, source dates/URLs, rationales, settings availability, failures and metric code. Report at least two real divergent cases only if they occur. If there are fewer, report that shortage without manufacturing it. Identical multi-source and evidence-aware labels do not establish an advantage for the latter. Confidence descriptions cannot support a calibration claim. Any later prompt revision is a new experiment with a new manifest.

No user trust outcome is measured. A later participant study would be required for the proposed Q1 question about disagreement, provenance and calibrated confidence displays.
