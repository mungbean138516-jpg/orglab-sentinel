"""Check the frozen September pilot's recorded hashes and saved-output scoring."""
import hashlib
import json
import runpy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "experiments/public_data_pilot_20260923"


def verify():
    groups = (
        ("manifest.json", "pre_run_sha256", 6),
        ("execution_record.json", "post_run_sha256", 3),
    )
    for record_name, field, count in groups:
        hashes = json.loads((ROOT / record_name).read_text(encoding="utf-8"))[field]
        if len(hashes) != count:
            raise ValueError(f"{record_name}: expected {count} hashes, found {len(hashes)}")
        for name, expected in hashes.items():
            actual = hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
            if actual != expected:
                raise ValueError(f"{record_name}: checksum mismatch for {name}")
    evaluate = runpy.run_path(str(ROOT / "evaluate.py"))["evaluate_directory"]
    result = evaluate(ROOT)
    expected_bytes = (ROOT / "results.json").read_bytes()
    actual_bytes = (json.dumps(result, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    if actual_bytes != expected_bytes:
        raise ValueError("Saved-output rerun differs from committed results.json")
    if len(result["case_results"]) != 9 or any(
        row["valid_cases"] != 9 or row["validation_errors"] for row in result["conditions"].values()
    ):
        raise ValueError("Expected nine valid predictions in each of three conditions")
    print("September pilot: 6 pre-run hashes PASS; 3 post-run hashes PASS; "
          "27 outputs valid; results.json byte-for-byte PASS")


if __name__ == "__main__":
    verify()
