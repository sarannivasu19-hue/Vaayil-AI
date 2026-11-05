"""
Phase 5 automated tests for Gnani Timbre TTS (POST /api/voice/speak).
"""

import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.main import app
from app.config import settings


@pytest.fixture(scope="module")
def client():
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


@pytest.fixture(scope="module")
def auth_token(client: TestClient) -> str:
    res = client.post("/api/auth/login", json={"username": "panchayat_admin", "password": "vaayil123"})
    assert res.status_code == 200
    return res.json()["access_token"]


def auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


def test_speak_requires_auth(client: TestClient):
    res = client.post("/api/voice/speak", json={"text": "Hello"})
    assert res.status_code == 401


def test_speak_empty_text(client: TestClient, auth_token: str):
    res = client.post("/api/voice/speak", headers=auth_headers(auth_token), json={"text": "   "})
    assert res.status_code == 400


def test_speak_oversized_text(client: TestClient, auth_token: str):
    long_txt = "வணக்கம் " * 300  # > 1500 chars
    res = client.post("/api/voice/speak", headers=auth_headers(auth_token), json={"text": long_txt})
    assert res.status_code == 413


def test_speak_no_key(client: TestClient, auth_token: str):
    with patch.object(type(settings), "is_gnani_configured", new_callable=lambda: property(lambda self: False)):
        res = client.post("/api/voice/speak", headers=auth_headers(auth_token), json={"text": "வணக்கம்"})
        assert res.status_code == 503


def test_speak_success_mock(client: TestClient, auth_token: str):
    dummy_wav = b"RIFF" + b"\x00" * 200
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.content = dummy_wav

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client.post = AsyncMock(return_value=mock_resp)

    with patch("app.routes.voice.httpx.AsyncClient", return_value=mock_client):
        res = client.post(
            "/api/voice/speak",
            headers=auth_headers(auth_token),
            json={"text": "வணக்கம், அருள் மருத்துவமனை", "voice": "Shivani", "language_mode": "ta-IN"}
        )
        assert res.status_code == 200
        assert res.headers["content-type"] == "audio/wav"
        assert len(res.content) == len(dummy_wav)

