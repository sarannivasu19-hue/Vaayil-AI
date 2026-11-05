"""
Unit tests for Phase 9 Noise Lab:
- Audio degradation DSP routines (AWGN, SNR scaling, telephony simulation)
- Word Error Rate (WER) and Word Match accuracy calculations
- Noise Lab API routes (mocking Prisma only in test)
"""

import io
import wave
import numpy as np
import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

from app.main import app
from app.noise_lab.audio_degradation import (
    load_wav_to_numpy,
    numpy_to_wav_bytes,
    add_gaussian_noise,
    simulate_phone_call,
    generate_all_variants,
)
from app.noise_lab.accuracy import tokenize, compute_wer_and_alignment


def create_test_wav_bytes(duration_sec: float = 0.5, sample_rate: int = 16000) -> bytes:
    """Generates a synthetic 440 Hz test tone WAV file in memory."""
    t = np.linspace(0, duration_sec, int(sample_rate * duration_sec), endpoint=False)
    audio = 0.5 * np.sin(2 * np.pi * 440.0 * t).astype(np.float32)
    return numpy_to_wav_bytes(audio, sample_rate)


# ---------------------------------------------------------------------------
# Audio Degradation Unit Tests
# ---------------------------------------------------------------------------

def test_wav_roundtrip():
    """Validates that load_wav_to_numpy and numpy_to_wav_bytes preserve dimensions and sample rate."""
    original_wav = create_test_wav_bytes(0.2, 16000)
    audio_arr, sr = load_wav_to_numpy(original_wav)

    assert sr == 16000
    assert len(audio_arr) == int(16000 * 0.2)
    assert np.max(audio_arr) <= 1.0
    assert np.min(audio_arr) >= -1.0

    reconstructed_wav = numpy_to_wav_bytes(audio_arr, sr)
    reconstructed_arr, reconstructed_sr = load_wav_to_numpy(reconstructed_wav)

    assert reconstructed_sr == 16000
    # Mean squared error should be minimal (quantization error only)
    mse = np.mean((audio_arr - reconstructed_arr) ** 2)
    assert mse < 1e-4


def test_add_gaussian_noise_power():
    """Validates that add_gaussian_noise produces the expected noise power scaling."""
    wav_bytes = create_test_wav_bytes(1.0, 16000)
    audio, sr = load_wav_to_numpy(wav_bytes)

    # 10 dB SNR
    noisy_10db = add_gaussian_noise(audio, snr_db=10.0, seed=123)
    # 20 dB SNR
    noisy_20db = add_gaussian_noise(audio, snr_db=20.0, seed=123)

    # 10 dB should have more variance/noise deviation from original than 20 dB
    noise_10db = noisy_10db - audio
    noise_20db = noisy_20db - audio

    var_10db = np.var(noise_10db)
    var_20db = np.var(noise_20db)

    assert var_10db > var_20db
    # In dB, difference of 10 dB corresponds to a factor of ~10 in power
    ratio = var_10db / var_20db
    assert 7.0 < ratio < 13.0


def test_simulate_phone_call():
    """Validates that simulate_phone_call outputs 16 kHz audio with narrowband filtering and saturation."""
    wav_bytes = create_test_wav_bytes(0.5, 16000)
    audio, sr = load_wav_to_numpy(wav_bytes)

    phone_audio, phone_sr = simulate_phone_call(audio, sr)
    assert phone_sr == 16000
    assert len(phone_audio) > 0
    assert np.max(phone_audio) <= 1.0
    assert np.min(phone_audio) >= -1.0


def test_generate_all_variants():
    """Validates that generate_all_variants creates original, noise levels, and phone simulation."""
    wav_bytes = create_test_wav_bytes(0.3, 16000)
    variants = generate_all_variants(wav_bytes, noise_levels=["light", "medium", "heavy"], include_phone_sim=True)

    assert "original" in variants
    assert "light" in variants
    assert "medium" in variants
    assert "heavy" in variants
    assert "phone_sim" in variants

    for k, v in variants.items():
        assert len(v["wav_bytes"]) > 44  # WAV header is 44 bytes
        assert "dsp_steps" in v
        assert len(v["dsp_steps"]) > 0


# ---------------------------------------------------------------------------
# Accuracy & WER Unit Tests
# ---------------------------------------------------------------------------

def test_tokenize():
    """Validates tokenization across Tamil script, Tanglish, and English."""
    sample = "வணக்கம்! Today is tomorrow, 5 manikku call pannunga."
    tokens = tokenize(sample)
    assert "வணக்கம்" in tokens
    assert "today" in tokens
    assert "tomorrow" in tokens
    assert "5" in tokens
    assert "manikku" in tokens
    assert "pannunga" in tokens


def test_wer_exact_match():
    """Validates that identical reference and hypothesis give WER=0 and 100% accuracy."""
    ref = "நெஞ்சு வலி அதிகமாக உள்ளது"
    hyp = "நெஞ்சு வலி அதிகமாக உள்ளது"
    res = compute_wer_and_alignment(ref, hyp)

    assert res["wer"] == 0.0
    assert res["wer_percent"] == 0.0
    assert res["word_accuracy_percent"] == 100.0
    assert res["substitutions"] == 0
    assert res["deletions"] == 0
    assert res["insertions"] == 0
    assert res["hits"] == 4


def test_wer_with_errors():
    """Validates WER calculation when words are substituted, deleted, or inserted."""
    ref = "dr anbazhagan appointment tomorrow morning"  # 5 words
    hyp = "dr anbazhagan checkup tomorrow morning please"  # 1 sub ('appointment'->'checkup'), 1 ins ('please')

    res = compute_wer_and_alignment(ref, hyp)
    # S=1, D=0, I=1 => total errors = 2. N_ref = 5. WER = 2/5 = 0.40 (40%)
    assert res["substitutions"] == 1
    assert res["insertions"] == 1
    assert res["deletions"] == 0
    assert res["wer"] == 0.4
    assert res["wer_percent"] == 40.0
    assert res["word_accuracy_percent"] == 60.0


# ---------------------------------------------------------------------------
# Noise Lab API Route Integration Tests
# ---------------------------------------------------------------------------

@pytest.fixture
def auth_headers(client: TestClient) -> dict:
    """Logs in as panchayat_admin and returns authorization header."""
    login_resp = client.post(
        "/api/auth/login",
        json={"username": "panchayat_admin", "password": "vaayil123"}
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def client():
    return TestClient(app)


def test_noise_lab_run_endpoint_mocked(client: TestClient, auth_headers: dict):
    """Tests POST /api/noise-lab/run with mocked Prisma API."""
    test_wav = create_test_wav_bytes(0.3, 16000)

    # Mock call_prisma to simulate realistic STT responses
    async def mock_call_prisma(audio_path, language_code, output_format):
        if "heavy" in audio_path:
            # Under heavy noise, STT misses a word
            return {"transcript": "வணக்கம் உதவி", "confidence": 0.65}
        return {"transcript": "வணக்கம் எனக்கு உதவி வேண்டும்", "confidence": 0.95}

    with patch("app.routes.noise_lab.call_prisma", side_effect=mock_call_prisma):
        resp = client.post(
            "/api/noise-lab/run",
            headers=auth_headers,
            data={
                "reference_text": "வணக்கம் எனக்கு உதவி வேண்டும்",
                "language_mode": "tamil",
                "noise_levels": "light,heavy",
                "include_phone_sim": "true",
            },
            files={"audio_file": ("test.wav", test_wav, "audio/wav")},
        )

        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert len(data["results"]) == 4  # original, light, heavy, phone_sim
        assert "summary" in data
        assert "disclaimer" in data

        # Check clean baseline
        baseline = next(r for r in data["results"] if r["variant_key"] == "original")
        assert baseline["wer_percent"] == 0.0
        assert baseline["word_accuracy_percent"] == 100.0


def test_noise_lab_save_and_export_csv(client: TestClient, auth_headers: dict):
    """Tests saving a run and downloading its CSV export."""
    save_payload = {
        "reference_text": "Appa-ku nenju vali romba jaasthi",
        "language_mode": "tanglish",
        "audio_filename": "tanglish_test.wav",
        "results": [
            {
                "variant_key": "original",
                "label": "Original (Clean Baseline)",
                "snr_db": None,
                "status": "success",
                "latency_ms": 320.5,
                "transcript": "Appa-ku nenju vali romba jaasthi",
                "wer_percent": 0.0,
                "word_accuracy_percent": 100.0,
                "substitutions": 0,
                "deletions": 0,
                "insertions": 0,
                "ref_word_count": 5,
                "hyp_word_count": 5,
            },
            {
                "variant_key": "heavy",
                "label": "Heavy Noise (3 dB SNR)",
                "snr_db": 3.0,
                "status": "success",
                "latency_ms": 410.2,
                "transcript": "Appa ku nenju vali jaasthi",
                "wer_percent": 20.0,
                "word_accuracy_percent": 80.0,
                "substitutions": 0,
                "deletions": 1,
                "insertions": 0,
                "ref_word_count": 5,
                "hyp_word_count": 4,
            }
        ],
        "summary": {
            "baseline_wer_percent": 0.0,
            "worst_wer_percent": 20.0,
        }
    }

    save_resp = client.post("/api/noise-lab/save", headers=auth_headers, json=save_payload)
    assert save_resp.status_code == 200
    run_id = save_resp.json()["run_id"]

    # Verify listing
    list_resp = client.get("/api/noise-lab/runs", headers=auth_headers)
    assert list_resp.status_code == 200
    runs = list_resp.json()
    assert any(r["id"] == run_id for r in runs)

    # Verify CSV export
    csv_resp = client.get(f"/api/noise-lab/runs/{run_id}/export-csv", headers=auth_headers)
    assert csv_resp.status_code == 200
    assert csv_resp.headers["content-type"].startswith("text/csv")
    csv_text = csv_resp.text
    assert "Vaayil AI — Noise Lab Benchmark Report" in csv_text
    assert "Heavy Noise (3 dB SNR)" in csv_text
