"""
runner.py — Safety Benchmark Test Runner for Urgent-Case Detection Engine.

Executes ground-truth benchmark across Panchayat Health, Clinic, and Veterinary sectors.
Calculates:
- Recall (Sensitivity): TP / (TP + FN) — % of real emergencies detected.
- False Alarm Rate: FP / (FP + TN) — % of normal calls mistakenly flagged.
- Precision: TP / (TP + FP)
- Specificity: TN / (TN + FP)
- Overall Accuracy: (TP + TN) / Total

Identifies all misses (False Negatives) and false alarms (False Positives).
Provides structured suggestions for rule improvements without modifying production code.
"""

from typing import List, Dict, Any, Optional
from app.conversation.urgent_detection import check_urgent_case
from app.sectors.registry import get_sector_package
from app.safety_test.dataset import SAFETY_BENCHMARK_DATASET


def run_safety_benchmark(sector_filter: Optional[str] = None) -> Dict[str, Any]:
    """
    Executes the urgent detection engine on the benchmark test set.
    Filters by sector if specified (e.g. 'panchayat_health', 'clinic', 'vet_clinic').
    """
    dataset = SAFETY_BENCHMARK_DATASET
    if sector_filter and sector_filter != "all":
        dataset = [item for item in dataset if item["sector"] == sector_filter]

    tp_count = 0
    fp_count = 0
    tn_count = 0
    fn_count = 0

    misses: List[Dict[str, Any]] = []
    false_alarms: List[Dict[str, Any]] = []
    results: List[Dict[str, Any]] = []

    # Category trackers
    category_stats: Dict[str, Dict[str, int]] = {}
    sector_stats: Dict[str, Dict[str, int]] = {}

    for item in dataset:
        sector_id = item["sector"]
        category = item["category"]

        # Ensure trackers initialized
        if category not in category_stats:
            category_stats[category] = {"total": 0, "correct": 0, "errors": 0}
        category_stats[category]["total"] += 1

        if sector_id not in sector_stats:
            sector_stats[sector_id] = {"total": 0, "correct": 0, "errors": 0, "tp": 0, "fp": 0, "tn": 0, "fn": 0}
        sector_stats[sector_id]["total"] += 1

        # Retrieve sector custom keywords
        package = get_sector_package(sector_id)
        custom_kws = package.urgent_keywords if package else None

        # Execute genuine detector
        is_urgent, matched_kw, guidance = check_urgent_case(item["text"], custom_kws)
        expected = item["expected_urgent"]

        eval_result = {
            "id": item["id"],
            "sector": sector_id,
            "language": item["language"],
            "category": category,
            "text": item["text"],
            "expected_urgent": expected,
            "predicted_urgent": is_urgent,
            "matched_keyword": matched_kw,
            "notes": item.get("notes", ""),
            "is_correct": (is_urgent == expected),
        }

        # Confusion Matrix
        if expected and is_urgent:
            tp_count += 1
            sector_stats[sector_id]["tp"] += 1
            category_stats[category]["correct"] += 1
            sector_stats[sector_id]["correct"] += 1
            eval_result["classification"] = "TP"
        elif not expected and not is_urgent:
            tn_count += 1
            sector_stats[sector_id]["tn"] += 1
            category_stats[category]["correct"] += 1
            sector_stats[sector_id]["correct"] += 1
            eval_result["classification"] = "TN"
        elif not expected and is_urgent:
            fp_count += 1
            sector_stats[sector_id]["fp"] += 1
            category_stats[category]["errors"] += 1
            sector_stats[sector_id]["errors"] += 1
            eval_result["classification"] = "FP"
            false_alarms.append(eval_result)
        else:  # expected and not is_urgent
            fn_count += 1
            sector_stats[sector_id]["fn"] += 1
            category_stats[category]["errors"] += 1
            sector_stats[sector_id]["errors"] += 1
            eval_result["classification"] = "FN"
            misses.append(eval_result)

        results.append(eval_result)

    total = len(dataset)
    actual_positives = tp_count + fn_count
    actual_negatives = tn_count + fp_count

    recall = round((tp_count / actual_positives * 100.0) if actual_positives > 0 else 100.0, 2)
    false_alarm_rate = round((fp_count / actual_negatives * 100.0) if actual_negatives > 0 else 0.0, 2)
    precision = round((tp_count / (tp_count + fp_count) * 100.0) if (tp_count + fp_count) > 0 else 0.0, 2)
    specificity = round((tn_count / actual_negatives * 100.0) if actual_negatives > 0 else 100.0, 2)
    overall_accuracy = round(((tp_count + tn_count) / total * 100.0) if total > 0 else 100.0, 2)

    # Compile structured improvement suggestions based on misses / false alarms
    suggested_improvements: List[Dict[str, str]] = []
    if misses:
        # Analyze why items were missed
        for m in misses:
            suggested_improvements.append({
                "type": "missed_emergency",
                "item_id": m["id"],
                "text": m["text"],
                "reason": (
                    f"Utterance was missed because none of the configured keywords or phonetic variants "
                    f"matched text tokens. Consider adding stemming/regex for '{m.get('notes')}'."
                )
            })

    if false_alarms:
        for fa in false_alarms:
            suggested_improvements.append({
                "type": "false_alarm",
                "item_id": fa["id"],
                "text": fa["text"],
                "reason": (
                    f"Falsely triggered on '{fa.get('matched_keyword')}'. "
                    f"Consider adding the preceding context to NEGATION_PATTERNS or PAST_EVENT_PATTERNS."
                )
            })

    return {
        "sector_filter": sector_filter or "all",
        "total_test_cases": total,
        "metrics": {
            "recall_percent": recall,
            "false_alarm_rate_percent": false_alarm_rate,
            "precision_percent": precision,
            "specificity_percent": specificity,
            "accuracy_percent": overall_accuracy,
        },
        "confusion_matrix": {
            "tp": tp_count,
            "fp": fp_count,
            "tn": tn_count,
            "fn": fn_count,
            "actual_positives": actual_positives,
            "actual_negatives": actual_negatives,
        },
        "category_breakdown": {
            cat: {
                "total": stats["total"],
                "correct": stats["correct"],
                "errors": stats["errors"],
                "accuracy_percent": round((stats["correct"] / stats["total"] * 100.0) if stats["total"] > 0 else 100.0, 1),
            }
            for cat, stats in category_stats.items()
        },
        "sector_breakdown": {
            sec: {
                "total": stats["total"],
                "correct": stats["correct"],
                "recall_percent": round((stats["tp"] / (stats["tp"] + stats["fn"]) * 100.0) if (stats["tp"] + stats["fn"]) > 0 else 100.0, 1),
                "false_alarm_rate_percent": round((stats["fp"] / (stats["tn"] + stats["fp"]) * 100.0) if (stats["tn"] + stats["fp"]) > 0 else 0.0, 1),
            }
            for sec, stats in sector_stats.items()
        },
        "all_results": results,
        "misses_count": len(misses),
        "false_alarms_count": len(false_alarms),
        "misses": misses,
        "false_alarms": false_alarms,
        "suggested_improvements": suggested_improvements,
        "clinical_disclaimer": "Keyword-based alert, not a medical diagnosis.",
    }
