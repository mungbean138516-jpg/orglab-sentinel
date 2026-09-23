"""Test scoring failure modes, not the observed experiment outcomes."""
import copy
import unittest
from evaluate import evaluate_condition, fraction, macro_f1, prediction_error


def response(label="Supported"):
    return dict(id="T1", label=label, confidence=0.8, citations=["A"],
                conflicts=[], unknowns=[], abstain=label == "Insufficient Evidence", rationale="Fixture")


class EvaluationTests(unittest.TestCase):
    def test_macro_f1_is_class_macro_not_accuracy(self):
        result = macro_f1(["Supported", "Supported", "Contradicted", "Insufficient Evidence"],
                          ["Supported", "Supported", "Supported", "Insufficient Evidence"])
        self.assertAlmostEqual(result["value"], (0.8 + 0 + 1) / 3)

    def test_missing_predictions_are_false_negatives(self):
        result = macro_f1(["Supported", "Contradicted", "Insufficient Evidence"], [None] * 3)
        self.assertEqual(result["value"], 0)
        self.assertTrue(all(v["fn"] == 1 for v in result["per_class"].values()))

    def test_zero_denominator_is_not_perfect_recall(self):
        self.assertIsNone(fraction(0, 0)["value"])

    def test_bad_citation_abstention_and_nonfinite_confidence_rejected(self):
        p = response()
        p["citations"] = ["not-in-packet"]
        self.assertIsNotNone(prediction_error(p, {"A"}))
        p = response(); p["abstain"] = True
        self.assertIsNotNone(prediction_error(p, {"A"}))
        for value in [True, float("nan"), float("inf"), -0.1, 1.1]:
            p = response(); p["confidence"] = value
            self.assertIsNotNone(prediction_error(p, {"A"}))

    def test_invisible_conflict_pair_excluded_and_missing_output_penalized(self):
        refs = [dict(id="T1", cluster="X", gold_full_packet="Supported",
                     gold_by_condition={"single_source": "Supported"}, expected_conflict_pairs=[["A", "B"]])]
        packet = dict(condition="single_source", sources=[dict(id="A", cluster="X")])
        metrics, _ = evaluate_condition(refs, packet, None)
        self.assertIsNone(metrics["conflict_recall"]["value"])
        self.assertEqual(metrics["citation_coverage"]["value"], 0)
        self.assertEqual(metrics["abstention_accuracy"]["value"], 0)
        self.assertEqual(metrics["missing_or_invalid_ids"], ["T1"])

    def test_duplicate_responses_do_not_inflate_scores(self):
        refs = [dict(id="T1", cluster="X", gold_full_packet="Supported",
                     gold_by_condition={"single_source": "Supported"}, expected_conflict_pairs=[])]
        packet = dict(condition="single_source", sources=[dict(id="A", cluster="X")])
        raw = dict(condition="single_source", predictions=[response(), copy.deepcopy(response())])
        metrics, valid = evaluate_condition(refs, packet, raw)
        self.assertEqual(valid, {})
        self.assertEqual(metrics["citation_coverage"]["value"], 0)


if __name__ == "__main__":
    unittest.main()
