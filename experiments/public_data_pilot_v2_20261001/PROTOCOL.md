# v2 candidate protocol — 2026-10-01

This is a prepared correction of the September 23 development pilot. It is **not a new experiment or an accuracy result**. No new model inference has run. The September inputs, annotations, outputs, results, and execution record remain frozen in their original directory.

## Question and unit

The exploratory question is how source availability and evidence-aware instructions affect a model's handling of nine Chinese claims. The unit is a claim within one of three event clusters, not nine independent news events. Six source items are represented by short, AI-prepared paraphrases. Three conditions each present the same nine claims:

| Condition | Evidence | Instruction |
| --- | --- | --- |
| single_source | One news item per event | Common closed-packet rule |
| multi_source | Same news plus issuer item | Same common rule |
| evidence_aware | Identical six items as multi_source | Common rule plus explicit provenance/conflict/unknown checks |

The common rule now says that a directly relevant issuer disclosure is the reference for the issuer's own disclosures, while contrary reporting must be retained. This does not establish independent ground truth. Each event has a historical material cutoff in the input packets. No live retrieval is permitted during a future model batch.

## Corrected inputs and unresolved reference

The v2 candidate restores C01's reported USD amount without a made-up FX conversion, removes unsupported “未经审计,” corrects Zhejiang's original-page section from 01 to 02, removes summary-written answer cues, retains the news article's generic “净利润” scope, and rewrites C03/C09 as direct factual propositions and C06 with an aggregate-fund scope. See [CHANGELOG.md](CHANGELOG.md) and [SOURCE_AUDIT.md](SOURCE_AUDIT.md).

C01 remains a special risk: the issuer notice denies a broad large robot-order rumor but does not identify Tesla, 6.85亿美元 or Optimus. Its exact alignment with the reported rumor is **unresolved**. All nine proposed full-packet labels remain assistant proposals; all human labels are null. A reviewer should settle claim wording, source alignment and full/condition-specific labels before any accuracy score.

## Future freeze and evaluation gate

This candidate's manifest records SHA-256 values of prepared files. These are **candidate hashes**, not pre-run hashes: no v2 inference has been dispatched. First complete independent human review, then make a new immutable version with final annotations, condition labels and packet hashes. Select the model/runtime and record snapshot, settings, seed or their actual unavailability. Record one output per condition, an execution record and post-run SHA-256 values. Use the versioned evaluator in that new folder. It refuses to score this candidate while human labels or a frozen run are absent.

For a future comparison, keep source packets identical between multi_source and evidence_aware and their only instruction difference explicit. Stop after the planned batches; record missing or malformed outputs rather than repairing them. Report class macro-F1 against independent labels with numerator/denominator and uncertainty, source conflicts, citation coverage and abstentions. With only three event clusters, no strong generalization, prompt superiority or calibrated confidence claim is justified. The later user study requires a separate preregistered design, participant consent, human outcome measure and independent sample.

## Commands

```bash
python3 experiments/public_data_pilot_v2_20261001/evaluate.py --verify-only
python3 experiments/public_data_pilot_v2_20261001/evaluate.py
```

The first command checks this candidate and should pass. The second must fail with “Candidate not run”; that is the intended protection against presenting v2 metrics before a new, labeled run.
