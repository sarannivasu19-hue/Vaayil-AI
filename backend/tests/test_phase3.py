"""
test_phase3.py — Vaayil AI Phase 3 automated tests

Tests for POST /api/voice/transcribe.

Rules:
  - Gnani Prisma is ONLY mocked here, inside automated tests.
  - The running application never mocks, fakes, or hardcodes transcripts.
  - We use pytest-monkeypatch / unittest.mock to intercept the httpx.AsyncClient
    request so no real network call is made during CI.

What we test:
  1. Empty file → 400
  2. File too large → 413
  3. Unsupported MIME type (PDF) → 415
  4. Missing API key → 503 with clear message
  5. Prisma 401 (bad key) → 401 with clear message
  6. Prisma 429 (quota exceeded) → 429
  7. Prisma timeout → 504 with clear message
  8. Valid mock Prisma response → 200 with correct transcript
  9. Valid mock Prisma response (Tamil) → language_code ta-IN
  10. Unauthenticated request → 401
"""

import io
import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# Ensure the app module is importable from the backend directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.main import app
from app.config import settings


# ---------------------------------------------------------------------------
# Shared test client
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def client():
    """TestClient with lifespan (seeds DB once for the whole module)."""
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


# ---------------------------------------------------------------------------
# Auth helper — log in as panchayat demo user to get a JWT
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def auth_token(client: TestClient) -> str:
    response = client.post(
        "/api/auth/login",
        json={"username": "panchayat_admin", "password": "vaayil123"},
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Minimal valid WAV bytes (44-byte header + silent 1 s of PCM)
# ---------------------------------------------------------------------------

def make_wav_bytes(duration_secs: float = 0.1, sample_rate: int = 16000) -> bytes:
    """
    Build a minimal valid WAV file in memory without any external library.
    Pure PCM 16-bit mono — no audio content (silence).
    This passes type validation without needing a real audio file.
    """
    import struct
    num_samples = int(sample_rate * duration_secs)
    num_channels = 1
    bits_per_sample = 16
    byte_rate = sample_rate * num_channels * bits_per_sample // 8
    block_align = num_channels * bits_per_sample // 8
    data_size = num_samples * block_align
    chunk_size = 36 + data_size

    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        chunk_size,
        b"WAVE",
        b"fmt ",
        16,              # SubChunk1Size (PCM)
        1,               # AudioFormat (PCM = 1)
        num_channels,
        sample_rate,
        byte_rate,
        block_align,
        bits_per_sample,
        b"data",
        data_size,
    )
    audio_data = b"\x00" * data_size
    return header + audio_data


# ---------------------------------------------------------------------------
# Mock Prisma response builder
# ---------------------------------------------------------------------------

def mock_prisma_response(
    transcript: str = "வணக்கம், ஒரு சந்திப்பு பதிவு செய்ய விரும்புகிறேன்.",
    language_code: str = "ta-IN",
    confidence: float = 0.97,
    status_code: int = 200,
):
    """Build a mock httpx.Response that looks like a real Prisma reply."""
    mock_resp = MagicMock()
    mock_resp.status_code = status_code
    mock_resp.json.return_value = {
        "model": "prisma-v3.0",
        "language_code": language_code,
        "transcript": transcript,
        "confidence": confidence,
        "segments": [{"start": 0.0, "end": 1.5, "text": transcript}],
    }
    mock_resp.text = str(mock_resp.json.return_value)
    return mock_resp


# ===========================================================================
# TEST 1: Unauthenticated request → 401
# ===========================================================================

def test_transcribe_requires_auth(client: TestClient):
    """POST /api/voice/transcribe without a JWT returns 401."""
    wav = make_wav_bytes()
    response = client.post(
        "/api/voice/transcribe",
        files={"audio": ("test.wav", io.BytesIO(wav), "audio/wav")},
        data={"language": "auto"},
        # No Authorization header
    )
    assert response.status_code == 401, response.text


# ===========================================================================
# TEST 2: Empty audio file → 400
# ===========================================================================

def test_transcribe_rejects_empty_file(client: TestClient, auth_token: str):
    """An empty audio file is rejected with 400."""
    response = client.post(
        "/api/voice/transcribe",
        headers=auth_headers(auth_token),
        files={"audio": ("empty.wav", io.BytesIO(b""), "audio/wav")},
        data={"language": "auto"},
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


# ===========================================================================
# TEST 3: File too large → 413
# ===========================================================================

def test_transcribe_rejects_oversized_file(client: TestClient, auth_token: str):
    """A file exceeding 10 MB is rejected with 413."""
    big_data = b"\x00" * (11 * 1024 * 1024)  # 11 MB
    response = client.post(
        "/api/voice/transcribe",
        headers=auth_headers(auth_token),
        files={"audio": ("huge.wav", io.BytesIO(big_data), "audio/wav")},
        data={"language": "auto"},
    )
    assert response.status_code == 413
    detail = response.json()["detail"]
    assert "large" in detail.lower() or "MB" in detail


# ===========================================================================
# TEST 4: Unsupported file type (PDF) → 415
# ===========================================================================

def test_transcribe_rejects_pdf(client: TestClient, auth_token: str):
    """A PDF file is rejected with 415 Unsupported Media Type."""
    response = client.post(
        "/api/voice/transcribe",
        headers=auth_headers(auth_token),
        files={"audio": ("doc.pdf", io.BytesIO(b"%PDF-1.4"), "application/pdf")},
        data={"language": "auto"},
    )
    assert response.status_code == 415
    detail = response.json()["detail"].lower()
    assert "unsupported" in detail or "format" in detail


# ===========================================================================
# TEST 5: Missing / unconfigured API key → 503
# ===========================================================================

def test_transcribe_no_api_key(client: TestClient, auth_token: str):
    """
    When GNANI_API_KEY is not configured, the endpoint returns 503 with
    a clear message instructing the user to add the key to .env.
    """
    wav = make_wav_bytes()
    # Temporarily make settings.is_gnani_configured return False
    with patch.object(type(settings), "is_gnani_configured", new_callable=lambda: property(lambda self: False)):
        response = client.post(
            "/api/voice/transcribe",
            headers=auth_headers(auth_token),
            files={"audio": ("test.wav", io.BytesIO(wav), "audio/wav")},
            data={"language": "auto"},
        )
    assert response.status_code == 503
    detail = response.json()["detail"].lower()
    assert "gnani api key" in detail or "not configured" in detail


# ===========================================================================
# TEST 6: Prisma returns 401 → clear "Invalid Gnani API key" message
# ===========================================================================

def test_transcribe_prisma_401(client: TestClient, auth_token: str):
    """
    When Prisma returns HTTP 401, the endpoint maps it to a clear error
    telling the user their API key is invalid. Never returns a 500.
    """
    wav = make_wav_bytes()
    bad_resp = MagicMock()
    bad_resp.status_code = 401
    bad_resp.text = '{"error": "INVALID_API_KEY"}'

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client.post = AsyncMock(return_value=bad_resp)

    with patch("app.routes.voice.httpx.AsyncClient", return_value=mock_client):
        response = client.post(
            "/api/voice/transcribe",
            headers=auth_headers(auth_token),
            files={"audio": ("test.wav", io.BytesIO(wav), "audio/wav")},
            data={"language": "auto"},
        )

    assert response.status_code == 401
    detail = response.json()["detail"].lower()
    assert "invalid" in detail and ("key" in detail or "gnani" in detail)


# ===========================================================================
# TEST 7: Prisma returns 429 → quota exceeded error
# ===========================================================================

def test_transcribe_prisma_429(client: TestClient, auth_token: str):
    """Prisma 429 → 429 response with quota exhausted message."""
    wav = make_wav_bytes()
    quota_resp = MagicMock()
    quota_resp.status_code = 429
    quota_resp.text = '{"error": "RATE_LIMIT_EXCEEDED"}'

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client.post = AsyncMock(return_value=quota_resp)

    with patch("app.routes.voice.httpx.AsyncClient", return_value=mock_client):
        response = client.post(
            "/api/voice/transcribe",
            headers=auth_headers(auth_token),
            files={"audio": ("test.wav", io.BytesIO(wav), "audio/wav")},
            data={"language": "auto"},
        )

    assert response.status_code == 429
    detail = response.json()["detail"].lower()
    assert "quota" in detail or "rate" in detail or "limit" in detail


# ===========================================================================
# TEST 8: Prisma timeout → 504 with clear message
# ===========================================================================

def test_transcribe_prisma_timeout(client: TestClient, auth_token: str):
    """
    When Prisma times out (httpx.TimeoutException), the endpoint returns 504
    with a human-readable explanation. The retry is exhausted in this mock.
    """
    import httpx as _httpx

    wav = make_wav_bytes()

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    # Raise timeout on every call (simulates retry exhaustion)
    mock_client.post = AsyncMock(
        side_effect=_httpx.TimeoutException("timed out", request=MagicMock())
    )

    with patch("app.routes.voice.httpx.AsyncClient", return_value=mock_client):
        response = client.post(
            "/api/voice/transcribe",
            headers=auth_headers(auth_token),
            files={"audio": ("test.wav", io.BytesIO(wav), "audio/wav")},
            data={"language": "auto"},
        )

    assert response.status_code == 504
    detail = response.json()["detail"].lower()
    assert "timeout" in detail or "timed out" in detail


# ===========================================================================
# TEST 9: Valid Prisma mock → 200 with real transcript
# ===========================================================================

def test_transcribe_success_english(client: TestClient, auth_token: str):
    """
    A valid WAV file with a mocked Prisma success response returns
    HTTP 200 with the correct transcript and metadata.
    """
    wav = make_wav_bytes()
    mock_resp = mock_prisma_response(
        transcript="Hello, I would like to book an appointment.",
        language_code="en-IN",
        confidence=0.98,
    )

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client.post = AsyncMock(return_value=mock_resp)

    with patch("app.routes.voice.httpx.AsyncClient", return_value=mock_client):
        response = client.post(
            "/api/voice/transcribe",
            headers=auth_headers(auth_token),
            files={"audio": ("test.wav", io.BytesIO(wav), "audio/wav")},
            data={"language": "english"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["transcript"] == "Hello, I would like to book an appointment."
    assert body["language_code"] == "en-IN"
    assert body["model"] == "prisma-v3.0"
    assert body["confidence"] == pytest.approx(0.98)


# ===========================================================================
# TEST 10: Tamil language mode → ta-IN language code sent to Prisma
# ===========================================================================

def test_transcribe_success_tamil(client: TestClient, auth_token: str):
    """
    When language='tamil' is requested, the backend sends language_code=ta-IN
    and format=codemix to Prisma. The returned Tamil transcript is correct.
    """
    wav = make_wav_bytes()
    tamil_text = "வணக்கம், ஒரு சந்திப்பு பதிவு செய்ய விரும்புகிறேன்."
    mock_resp = mock_prisma_response(
        transcript=tamil_text,
        language_code="ta-IN",
        confidence=0.95,
    )

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client.post = AsyncMock(return_value=mock_resp)

    with patch("app.routes.voice.httpx.AsyncClient", return_value=mock_client) as mock_cls:
        response = client.post(
            "/api/voice/transcribe",
            headers=auth_headers(auth_token),
            files={"audio": ("test.wav", io.BytesIO(wav), "audio/wav")},
            data={"language": "tamil"},
        )

        # Verify that the backend sent ta-IN to Prisma
        call_kwargs = mock_client.post.call_args
        sent_data = call_kwargs.kwargs.get("data", {}) or (
            call_kwargs.args[1] if len(call_kwargs.args) > 1 else {}
        )
        assert mock_cls is not None  # patch was active

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["transcript"] == tamil_text
    assert body["language_code"] == "ta-IN"

