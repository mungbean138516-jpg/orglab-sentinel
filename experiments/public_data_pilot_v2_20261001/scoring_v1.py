"""Deterministic, standard-library-only evaluation of saved pilot responses."""
from collections import Counter
from itertools import combinations
from pathlib import Path
import argparse
import hashlib
import json
import math

LABELS = ("Supported", "Contradicted", "Insufficient Evidence")
CONDITIONS = ("single_source", "multi_source", "evidence_aware")


def fraction(numerator, denominator):
    return {"numerator": numerator, "denominator": denominator,
            "value": numerator / denominator if denominator else None}


def macro_f1(gold, predicted):
    if len(gold) != len(predicted):
        raise ValueError("Gold and predictions must have equal lengths")
    per_class = {}
    for label in LABELS:
        tp = sum(g == label and p == label for g, p in zip(gold, predicted))
        fp = sum(g != label and p == label for g, p in zip(gold, predicted))
        fn = sum(g == label and p != label for g, p in zip(gold, predicted))
        denom = 2 * tp + fp + fn
        per_class[label] = {"tp": tp, "fp": fp, "fn": fn,
                            "f1": 2 * tp / denom if denom else 0.0}
    return {"value": sum(x["f1"] for x in per_class.values()) / len(LABELS),
            "per_class": per_class}


def prediction_error(p, allowed):
    required = {"id", "label", "confidence", "citations", "conflicts",
                "unknowns", "abstain", "rationale"}
    if not isinstance(p, dict) or not required <= p.keys():
        return "missing required fields"
    if p["label"] not in LABELS:
        return "invalid label"
    value = p["confidence"]
    if type(value) not in (int, float) or not math.isfinite(value) or not 0 <= value <= 1:
        return "confidence must be a finite number in [0, 1]"
    if type(p["abstain"]) is not bool or p["abstain"] != (p["label"] == LABELS[2]):
        return "abstain inconsistent with label"
    if not isinstance(p["citations"], list) or any(
            not isinstance(s, str) or s not in allowed for s in p["citations"]):
        return "unknown, unavailable or wrong-cluster citation"
    if not isinstance(p["unknowns"], list) or any(not isinstance(s, str) for s in p["unknowns"]):
        return "unknowns must be a string array"
    if not isinstance(p["rationale"], str) or not p["rationale"].strip():
        return "rationale must be nonempty"
    if not isinstance(p["conflicts"], list):
        return "conflicts must be an array"
    for c in p["conflicts"]:
        if not isinstance(c, dict):
            return "invalid conflict object"
        pair = c.get("source_ids")
        if (not isinstance(pair, list) or len(pair) != 2
                or any(not isinstance(s, str) or s not in allowed for s in pair)
                or pair[0] == pair[1] or not isinstance(c.get("summary"), str)
                or not c["summary"].strip()):
            return "invalid conflict source pair or summary"
    return None


def evaluate_condition(annotations, packet, raw):
    cond = packet["condition"]
    source_map = {s["id"]: s for s in packet["sources"]}
    by_id = {c["id"]: c for c in annotations}
    errors, valid = [], {}
    if not isinstance(raw, dict) or raw.get("condition") != cond or not isinstance(raw.get("predictions"), list):
        errors.append({"id": None, "error": "missing or invalid batch"})
        records = []
    else:
        records = raw["predictions"]
    ids = Counter(p.get("id") for p in records if isinstance(p, dict) and isinstance(p.get("id"), str))
    emitted_citations = valid_citations = 0
    for p in records:
        cid = p.get("id") if isinstance(p, dict) else None
        if not isinstance(cid, str) or cid not in by_id:
            errors.append({"id": str(cid), "error": "unknown case ID"})
            continue
        allowed = {sid for sid, s in source_map.items() if s["cluster"] == by_id[cid]["cluster"]}
        if isinstance(p.get("citations"), list):
            emitted_citations += len(p["citations"])
            valid_citations += sum(isinstance(s, str) and s in allowed for s in p["citations"])
        error = "duplicate case ID" if ids[cid] != 1 else prediction_error(p, allowed)
        if error:
            errors.append({"id": cid, "error": error})
        else:
            valid[cid] = p
    missing = sorted(set(by_id) - valid.keys())
    labels = [valid[c["id"]]["label"] if c["id"] in valid else None for c in annotations]
    reference_pairs = recovered_pairs = 0
    abstention_correct = abstained = correct_abstentions = 0
    for c in annotations:
        expected = {tuple(sorted(pair)) for pair in c["expected_conflict_pairs"] if set(pair) <= source_map.keys()}
        reference_pairs += len(expected)
        pred = valid.get(c["id"])
        if not pred:
            continue
        found = {tuple(sorted(x["source_ids"])) for x in pred["conflicts"]}
        recovered_pairs += len(expected & found)
        should_abstain = c["gold_by_condition"][cond] == LABELS[2]
        abstention_correct += pred["abstain"] == should_abstain
        abstained += pred["abstain"]
        correct_abstentions += pred["abstain"] and should_abstain
    n = len(annotations)
    metrics = {
        "planned_cases": n, "valid_cases": len(valid), "missing_or_invalid_ids": missing,
        "validation_errors": errors,
        "macro_f1_full_packet": macro_f1([c["gold_full_packet"] for c in annotations], labels),
        "macro_f1_condition_specific": macro_f1([c["gold_by_condition"][cond] for c in annotations], labels),
        "conflict_recall": fraction(recovered_pairs, reference_pairs),
        "citation_coverage": fraction(sum(bool(p["citations"]) for p in valid.values()), n),
        "citation_id_validity": fraction(valid_citations, emitted_citations),
        "abstention_accuracy": fraction(abstention_correct, n),
        "abstention_rate": fraction(abstained, n),
        "abstention_precision": fraction(correct_abstentions, abstained),
    }
    return metrics, valid


def evaluate_directory(root):
    annotations = json.loads((root / "annotations.json").read_text())
    manifest = json.loads((root / "manifest.json").read_text())
    for name, digest in manifest["pre_run_sha256"].items():
        if hashlib.sha256((root / name).read_bytes()).hexdigest() != digest:
            raise ValueError(f"Pre-run frozen file changed: {name}")
    metrics, valid, load_errors = {}, {}, {}
    for cond in CONDITIONS:
        packet = json.loads((root / "inputs" / f"{cond}.json").read_text())
        try:
            raw = json.loads((root / "outputs" / f"{cond}.json").read_text())
        except (OSError, ValueError) as error:
            raw = None
            load_errors[cond] = str(error)
        metrics[cond], valid[cond] = evaluate_condition(annotations, packet, raw)
    pairwise = {}
    for a, b in combinations(CONDITIONS, 2):
        common = sorted(valid[a].keys() & valid[b].keys())
        differing = [cid for cid in common if valid[a][cid]["label"] != valid[b][cid]["label"]]
        pairwise[f"{a}__{b}"] = {**fraction(len(differing), len(common)),
                                 "case_ids": differing, "excluded_incomplete_cases": len(annotations) - len(common)}
    complete = set.intersection(*(set(valid[c]) for c in CONDITIONS))
    differing = sorted(cid for cid in complete if len({valid[c][cid]["label"] for c in CONDITIONS}) > 1)
    return {"experiment_id": manifest["experiment_id"], "reference_status": "provisional assistant labels; human review pending",
            "load_errors": load_errors, "conditions": metrics, "pairwise_label_disagreement": pairwise,
            "any_label_disagreement": {**fraction(len(differing), len(complete)), "case_ids": differing},
            "case_results": [{"id": c["id"], "claim": c["claim"], "gold_full_packet": c["gold_full_packet"],
                              "predictions": {cond: valid[cond].get(c["id"]) for cond in CONDITIONS}} for c in annotations]}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    text = json.dumps(evaluate_directory(args.root), ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.write_text(text)
    else:
        print(text, end="")
