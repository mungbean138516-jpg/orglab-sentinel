"""Verify the v2 candidate; score a future run only after independent labels exist.

The original September scorer is vendored as scoring_v1.py. No September
input, output, reference label or result is changed by this module.
"""
import argparse
import hashlib
import json
from itertools import combinations
from pathlib import Path

from scoring_v1 import CONDITIONS, LABELS, evaluate_condition, fraction

ROOT = Path(__file__).resolve().parent


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def verify_candidate(root=ROOT):
    manifest = read_json(root / "manifest.json")
    if manifest["status"] not in ("candidate_not_run", "frozen_run"):
        raise ValueError("Unknown dataset state")
    for name, expected in manifest["candidate_sha256"].items():
        actual = hashlib.sha256((root / name).read_bytes()).hexdigest()
        if actual != expected:
            raise ValueError(f"Candidate checksum mismatch: {name}")
    sources = read_json(root / "sources.json")
    annotations = read_json(root / "annotations.json")
    source_ids = {s["id"] for s in sources}
    case_ids = {a["id"] for a in annotations}
    if len(sources) != 6 or len(source_ids) != 6 or len(annotations) != 9 or len(case_ids) != 9:
        raise ValueError("Expected six unique sources and nine unique claims")
    if manifest["status"] == "candidate_not_run" and any(
        a["human_full_packet_label"] is not None or
        any(v is not None for v in a["human_by_condition"].values())
        for a in annotations
    ):
        raise ValueError("Candidate manifest must be renewed after human labels change")
    packets = {cond: read_json(root / "inputs" / f"{cond}.json") for cond in CONDITIONS}
    for cond, packet in packets.items():
        if packet["condition"] != cond:
            raise ValueError(f"Wrong condition in {cond} packet")
        if packet["claims"] != [
            {"id": a["id"], "cluster": a["cluster"], "claim": a["claim"]}
            for a in annotations
        ]:
            raise ValueError(f"Claim mismatch in {cond} packet")
        if packet["sources"] != [s for s in sources if s["id"] in
                                  {x["id"] for x in packet["sources"]}]:
            raise ValueError(f"Source mismatch in {cond} packet")
        if any(key in packet for key in ("gold_full_packet", "gold_by_condition", "human_label")):
            raise ValueError(f"Reference label leaked into {cond} packet")
    if packets["single_source"]["instructions"] != packets["multi_source"]["instructions"]:
        raise ValueError("Single and multi instructions must be identical")
    if packets["multi_source"]["sources"] != packets["evidence_aware"]["sources"]:
        raise ValueError("Multi and evidence-aware evidence must match")
    if len(packets["single_source"]["sources"]) != 3 or len(packets["multi_source"]["sources"]) != 6:
        raise ValueError("Unexpected source counts")
    return {"status": manifest["status"], "sources": len(sources), "claims": len(annotations),
            "conditions": list(CONDITIONS),
            "outputs_saved": sum((root / "outputs" / f"{c}.json").exists() for c in CONDITIONS),
            "human_labels": sum(a["human_full_packet_label"] in LABELS for a in annotations),
            "candidate_hashes_verified": len(manifest["candidate_sha256"])}


def score_future_run(root=ROOT):
    """Score only a new frozen version with human labels and hashed outputs."""
    state = verify_candidate(root)
    if state["status"] != "frozen_run":
        raise ValueError("Candidate not run; copy to a new version after human review and freeze")
    annotations = read_json(root / "annotations.json")
    if any(a["human_full_packet_label"] not in LABELS or
           any(a["human_by_condition"].get(c) not in LABELS for c in CONDITIONS)
           for a in annotations):
        raise ValueError("Independent human full-packet and condition labels are pending; no accuracy score")
    record = read_json(root / "execution_record.json")
    hashes = record["post_run_sha256"]
    expected_names = {f"outputs/{c}.json" for c in CONDITIONS}
    if set(hashes) != expected_names:
        raise ValueError("Expected hashes for exactly three saved output batches")
    for name, expected in hashes.items():
        if hashlib.sha256((root / name).read_bytes()).hexdigest() != expected:
            raise ValueError(f"Post-run checksum mismatch: {name}")
    references = [
        {**a, "gold_full_packet": a["human_full_packet_label"],
         "gold_by_condition": a["human_by_condition"]}
        for a in annotations
    ]
    metrics, valid = {}, {}
    for cond in CONDITIONS:
        packet = read_json(root / "inputs" / f"{cond}.json")
        raw = read_json(root / "outputs" / f"{cond}.json")
        metrics[cond], valid[cond] = evaluate_condition(references, packet, raw)
    pairwise = {}
    for left, right in combinations(CONDITIONS, 2):
        common = sorted(valid[left].keys() & valid[right].keys())
        differing = [cid for cid in common if valid[left][cid]["label"] != valid[right][cid]["label"]]
        pairwise[f"{left}__{right}"] = {
            **fraction(len(differing), len(common)), "case_ids": differing,
            "excluded_incomplete_cases": len(annotations) - len(common)}
    return {"status": "scored_against_independent_human_labels",
            "source_version": read_json(root / "manifest.json")["dataset_version"],
            "conditions": metrics, "pairwise_label_disagreement": pairwise}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--verify-only", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    if args.verify_only:
        print(json.dumps(verify_candidate(args.root), ensure_ascii=False, indent=2))
    else:
        result = json.dumps(score_future_run(args.root), ensure_ascii=False, indent=2) + "\n"
        if args.output:
            args.output.write_text(result, encoding="utf-8")
        else:
            print(result, end="")


if __name__ == "__main__":
    main()
