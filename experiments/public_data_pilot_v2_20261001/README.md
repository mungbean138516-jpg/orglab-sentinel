# OrgLab public-data pilot v2 — corrected candidate, not run

The September 23 pilot in `../public_data_pilot_20260923/` remains the only completed inference run. Its 9 claims × 3 conditions yielded 27 saved outputs and provisional-reference full-packet macro-F1 of 0.522 / 1.000 / 1.000. Those are **not human-validated accuracy**. This folder prepares corrected inputs for a later run; it contains **no v2 outputs or scores**.

## Files

- [SOURCE_AUDIT.md](SOURCE_AUDIT.md): linked source-document inspection and unresolved access/alignment questions.
- [CHANGELOG.md](CHANGELOG.md): per-claim and per-summary corrections.
- [PROTOCOL.md](PROTOCOL.md): evidence conditions, human-review and future freeze rules.
- [sources.json](sources.json), [annotations.json](annotations.json), [inputs/](inputs/): six paraphrased sources, nine candidate claims with null human labels, and three separate prompt packets.
- [manifest.json](manifest.json): SHA-256 of prepared candidate files. These are not represented as pre-run hashes.
- [run_status.json](run_status.json): zero new batches, outputs and metrics; unknown future model settings.
- [evaluate.py](evaluate.py) with vendored [scoring_v1.py](scoring_v1.py): verifies the candidate now and gates future scoring on a separately frozen, human-labeled run.

## Reproduce current verification

From the repository root, using Python 3 standard library:

```bash
python3 -m unittest discover -s experiments/public_data_pilot_20260923 -p 'test_*.py' -v
python3 scripts/verify_public_data_pilot.py
python3 experiments/public_data_pilot_v2_20261001/evaluate.py --verify-only
python3 -m unittest discover -s experiments/public_data_pilot_v2_20261001 -p 'test_*.py' -v
```

The September rerun evaluates **saved September outputs against unchanged September inputs**. The v2 check validates packet integrity only. A fresh v2 model run is required before saying whether any revised condition changes model behavior. Independent human labeling, C01 source alignment, source access, model snapshot/settings recording and a new frozen version are required before an accuracy claim.
