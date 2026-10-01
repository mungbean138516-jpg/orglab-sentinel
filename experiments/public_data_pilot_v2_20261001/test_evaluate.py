"""Check candidate integrity and prevent premature accuracy scoring."""
from pathlib import Path
from tempfile import TemporaryDirectory
import shutil
import unittest

from evaluate import ROOT, score_future_run, verify_candidate


class CandidateTests(unittest.TestCase):
    def test_candidate_has_no_run_or_human_labels(self):
        state = verify_candidate()
        self.assertEqual((state["sources"], state["claims"]), (6, 9))
        self.assertEqual((state["outputs_saved"], state["human_labels"]), (0, 0))
        self.assertEqual(state["candidate_hashes_verified"], 12)

    def test_scoring_refuses_unrun_candidate(self):
        with self.assertRaisesRegex(ValueError, "Candidate not run"):
            score_future_run()

    def test_changed_input_fails_checksum(self):
        with TemporaryDirectory() as directory:
            copy = Path(directory) / "candidate"
            shutil.copytree(ROOT, copy, ignore=shutil.ignore_patterns("__pycache__"))
            packet = copy / "inputs" / "single_source.json"
            packet.write_bytes(packet.read_bytes() + b" ")
            with self.assertRaisesRegex(ValueError, "checksum mismatch"):
                verify_candidate(copy)


if __name__ == "__main__":
    unittest.main()
