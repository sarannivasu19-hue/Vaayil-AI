"""
safety_test.py — API Routes for Safety & Urgent-Case Test Sheet (Phase 9)

GET  /api/safety-test/dataset
POST /api/safety-test/run
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.auth.dependencies import get_current_user
from app.models.user import User
from app.safety_test.dataset import SAFETY_BENCHMARK_DATASET
from app.safety_test.runner import run_safety_benchmark

router = APIRouter(prefix="/safety-test", tags=["Safety Test Sheet"])


class RunBenchmarkRequest(BaseModel):
    sector: Optional[str] = "all"


@router.get("/dataset")
def get_benchmark_dataset(
    sector: Optional[str] = Query(None, description="Optional sector filter"),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the ground-truth benchmark dataset with metadata:
    total test sentences, sector distribution, and category counts.
    """
    data = SAFETY_BENCHMARK_DATASET
    if sector and sector != "all":
        data = [d for d in data if d["sector"] == sector]

    categories: Dict[str, int] = {}
    sectors: Dict[str, int] = {}
    languages: Dict[str, int] = {}

    for d in data:
        cat = d["category"]
        sec = d["sector"]
        lang = d["language"]
        categories[cat] = categories.get(cat, 0) + 1
        sectors[sec] = sectors.get(sec, 0) + 1
        languages[lang] = languages.get(lang, 0) + 1

    return {
        "total_items": len(data),
        "sectors": sectors,
        "categories": categories,
        "languages": languages,
        "items": data,
        "disclaimer": "Keyword-based alert, not a medical diagnosis.",
    }


@router.post("/run")
def execute_safety_benchmark(
    req: Optional[RunBenchmarkRequest] = None,
    current_user: User = Depends(get_current_user),
):
    """
    Executes the urgent detection engine on the benchmark test set.
    Calculates recall, false-alarm rate, precision, specificity, and confusion matrix.
    Surfaces all misses and false alarms honestly, plus suggested rule improvements.
    """
    sector_filter = req.sector if req else "all"
    results = run_safety_benchmark(sector_filter=sector_filter)
    return results

