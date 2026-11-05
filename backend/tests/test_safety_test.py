"""
Unit & Benchmark tests for Phase 9 Safety Test Sheet:
- Evaluates the 180-sentence labelled test dataset across Panchayat Health, Clinic, and Vet Clinic
- Verifies confusion matrix, recall, false-alarm rate, and specificity calculations
- Verifies negation handling and past-event detection
- Tests the Safety Test Sheet API endpoints
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.safety_test.dataset import SAFETY_BENCHMARK_DATASET
from app.safety_test.runner import run_safety_benchmark


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_headers(client: TestClient) -> dict:
    login_resp = client.post(
        "/api/auth/login",
        json={"username": "panchayat_admin", "password": "vaayil123"}
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_dataset_completeness_and_balance():
    """Validates that dataset contains ~60 sentences per sector and covers all critical categories."""
    assert len(SAFETY_BENCHMARK_DATASET) >= 170

    sectors = {"panchayat_health", "clinic", "vet_clinic"}
    for sec in sectors:
        sec_items = [d for d in SAFETY_BENCHMARK_DATASET if d["sector"] == sec]
        assert len(sec_items) >= 55, f"Sector {sec} should have ~60 benchmark cases"

        # Check category representation
        categories = {d["category"] for d in sec_items}
        assert "urgent_true" in categories
        assert "normal_call" in categories
        assert "negated" in categories
        assert "past_event" in categories


def test_safety_benchmark_runner_all_sectors():
    """Executes the ground-truth benchmark and tests mathematical metric invariants."""
    res = run_safety_benchmark(sector_filter="all")

    assert res["total_test_cases"] == len(SAFETY_BENCHMARK_DATASET)
    metrics = res["metrics"]
    cm = res["confusion_matrix"]

    # Invariants:
    # Total = TP + FP + TN + FN
    assert (cm["tp"] + cm["fp"] + cm["tn"] + cm["fn"]) == res["total_test_cases"]
    assert cm["actual_positives"] == (cm["tp"] + cm["fn"])
    assert cm["actual_negatives"] == (cm["tn"] + cm["fp"])

    # High safety recall requirement: real acute emergencies must be reliably captured (>80%)
    assert metrics["recall_percent"] >= 80.0

    # Low false alarm requirement: normal calls should not cause chaos (<15%)
    assert metrics["false_alarm_rate_percent"] <= 15.0

    # Negation category should have high accuracy (negations must not trigger false alarms)
    neg_stats = res["category_breakdown"].get("negated", {})
    assert neg_stats.get("accuracy_percent", 0) >= 80.0

    # Past events category: reveals real performance and weaknesses (~70%)
    past_stats = res["category_breakdown"].get("past_event", {})
    assert past_stats.get("accuracy_percent", 0) >= 65.0

    # Verification of clinical disclaimer
    assert "not a medical diagnosis" in res["clinical_disclaimer"]


def test_safety_benchmark_per_sector():
    """Validates that running benchmark for each single sector works cleanly."""
    for sec in ["panchayat_health", "clinic", "vet_clinic"]:
        res = run_safety_benchmark(sector_filter=sec)
        assert res["sector_filter"] == sec
        assert res["total_test_cases"] >= 55
        # Each sector achieves at least 70% recall on the tough benchmark
        assert res["metrics"]["recall_percent"] >= 70.0


def test_safety_test_api_endpoints(client: TestClient, auth_headers: dict):
    """Tests GET /api/safety-test/dataset and POST /api/safety-test/run."""
    # 1. Dataset metadata endpoint
    ds_resp = client.get("/api/safety-test/dataset", headers=auth_headers)
    assert ds_resp.status_code == 200
    ds_data = ds_resp.json()
    assert ds_data["total_items"] >= 170
    assert "panchayat_health" in ds_data["sectors"]
    assert "clinic" in ds_data["sectors"]
    assert "vet_clinic" in ds_data["sectors"]

    # 2. Run benchmark endpoint
    run_resp = client.post(
        "/api/safety-test/run",
        headers=auth_headers,
        json={"sector": "clinic"}
    )
    assert run_resp.status_code == 200
    run_data = run_resp.json()
    assert run_data["sector_filter"] == "clinic"
    assert "metrics" in run_data
    assert "confusion_matrix" in run_data
    assert "misses" in run_data
    assert "false_alarms" in run_data
