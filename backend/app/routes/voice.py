"""
voice.py — Vaayil AI Phase 3
POST /api/voice/transcribe

Accepts an audio file, validates it, converts WebM/browser formats to WAV
(since Prisma accepts WAV/MP3/OGG/FLAC/AAC/M4A but NOT WebM), then calls
Gnani Prisma v3.0 (https://api.vachana.ai/stt/v3) with the API key from
environment variables.

Returns real transcript + metadata from Prisma's response.
Never returns fake or hardcoded transcripts.
Never exposes the API key.
Deletes all temporary files in a finally block.

Audio conversion: browser MediaRecorder produces WebM/Opus or WebM/vp8.
Since Prisma does NOT accept WebM, we convert to WAV on the backend using
pydub (which wraps ffmpeg). If ffmpeg is not installed, the error is surfaced
clearly instead of silently failing.
"""

import io
import logging
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, Response
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.routes.auth import get_current_user
from app.models import User

logger = logging.getLogger("vaayil-ai.voice")

router = APIRouter(prefix="/voice", tags=["voice"])

# ---------------------------------------------------------------------------
# Constants (from Gnani docs: https://docs.gnani.ai/)
# ---------------------------------------------------------------------------

GNANI_STT_URL = f"{settings.GNANI_API_BASE_URL}/stt/v3"
GNANI_TTS_URL = f"{settings.GNANI_API_BASE_URL}/api/v1/tts/inference"

# Audio formats Prisma v3.0 accepts (from docs)
ACCEPTED_MIME_TYPES = {
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/mp3",
    "audio/mpeg",
    "audio/ogg",
    "audio/flac",
    "audio/x-flac",
    "audio/aac",
    "audio/x-aac",
    "audio/mp4",          # M4A container
    "audio/m4a",
    "audio/x-m4a",
    # WebM variants — NOT accepted by Prisma; we detect and convert to WAV
    "audio/webm",
    "video/webm",         # Some browsers report this for WebM audio
}

# Browser-recorded formats that need conversion before sending to Prisma
BROWSER_WEBM_TYPES = {"audio/webm", "video/webm"}

# File extensions → MIME lookup for upload validation
ACCEPTED_EXTENSIONS = {
    ".wav", ".mp3", ".ogg", ".flac", ".aac", ".m4a",
    ".webm",  # allowed for upload; will be converted
}

# 10 MB ceiling (Prisma docs state 30-second limit; 10 MB is a safe byte cap)
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

# Language code options surfaced to the frontend
LANGUAGE_OPTIONS = {
    "tamil":    "ta-IN",
    "tanglish": "ta-IN,en-IN",   # code-mixed Tamil + English
    "english":  "en-IN",
    "auto":     "indic-auto",    # Prisma auto-detect across 10 Indian languages
}

# Output format options (from Prisma v3.0 docs)
FORMAT_OPTIONS = {
    "tamil":    "codemix",      # each word in its spoken script
    "tanglish": "codemix",      # Tanglish → native Tamil + Latin mixed
    "english":  "transcribe",   # clean ITN text
    "auto":     "transcribe",
}

# Request timeout for Prisma (30 s audio processing + 10 s network headroom)
PRISMA_TIMEOUT_SECONDS = 40.0


# ---------------------------------------------------------------------------
# Pydantic response schema
# ---------------------------------------------------------------------------

class SpeakRequest(BaseModel):
    text: str
    voice: str = "Shivani"
    language_mode: str = "ta-IN"
    speed: float = 1.0


class TranscribeResponse(BaseModel):
    """Real response returned to the frontend after a Prisma call."""
    success: bool
    transcript: str
    language_code: str
    model: str
    confidence: float | None = None
    segments: list | None = None
    # What we did to the file before sending (e.g., "webm_to_wav_conversion")
    preprocessing: str | None = None
    # Whether raw audio was saved (settings-dependent)
    audio_stored: bool = False


# ---------------------------------------------------------------------------
# Audio conversion helper
# ---------------------------------------------------------------------------

def get_ffmpeg_path() -> str | None:
    """
    Find ffmpeg executable on PATH, via imageio-ffmpeg, or in Python virtualenv Scripts.
    """
    found = shutil.which("ffmpeg")
    if found:
        return found

    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe and os.path.isfile(exe):
            return exe
    except Exception:
        pass

    candidates = [
        os.path.join(sys.prefix, "Scripts", "ffmpeg.exe"),
        os.path.join(sys.prefix, "bin", "ffmpeg"),
        os.path.join(os.path.dirname(sys.executable), "ffmpeg.exe"),
        os.path.join(os.path.dirname(sys.executable), "ffmpeg"),
    ]
    for c in candidates:
        if os.path.isfile(c):
            return c

    return None


def convert_webm_to_wav(input_path: str, output_path: str) -> None:
    """
    Convert a WebM/Opus file (from browser MediaRecorder) to WAV (16kHz mono).
    Attempts direct conversion via ffmpeg first, and falls back to pydub if needed.

    Why: Gnani Prisma v3.0 accepts WAV/MP3/OGG/FLAC/AAC/M4A — NOT WebM.
    Browser MediaRecorder defaults to audio/webm;codecs=opus on Chrome/Edge
    and audio/ogg;codecs=opus on Firefox. Firefox OGG is accepted directly;
    Chrome/Edge WebM must be converted.
    """
    ffmpeg_exe = get_ffmpeg_path()

    # If ffmpeg binary found, execute direct conversion (fast, robust, no ffprobe dependency)
    if ffmpeg_exe:
        try:
            cmd = [
                ffmpeg_exe,
                "-y",
                "-i", input_path,
                "-vn",
                "-ac", "1",
                "-ar", "16000",
                "-af", "highpass=f=80,lowpass=f=7500,volume=1.2",
                output_path,
            ]
            proc = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=False,
            )
            if proc.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                logger.info(
                    "WebM→WAV conversion via ffmpeg: %s → %s (size: %d bytes)",
                    input_path, output_path, os.path.getsize(output_path)
                )
                return
            stderr_msg = proc.stderr.decode("utf-8", errors="replace")
            logger.warning(
                "Direct ffmpeg command returned code %d: %s. Trying pydub fallback...",
                proc.returncode, stderr_msg[-200:]
            )
        except Exception as exc:
            logger.warning("Direct ffmpeg execution failed: %s. Trying pydub fallback...", exc)

    # Fallback via pydub
    try:
        from pydub import AudioSegment
        if ffmpeg_exe:
            AudioSegment.converter = ffmpeg_exe
        audio = AudioSegment.from_file(input_path, format="webm")
        audio = audio.set_channels(1).set_frame_rate(16000)
        audio.export(output_path, format="wav")
        logger.info(
            "WebM→WAV conversion via pydub: %s → %s (%.2f s)",
            input_path, output_path, len(audio) / 1000
        )
        return
    except Exception as exc:
        if ffmpeg_exe is None:
            raise RuntimeError(
                "ffmpeg is required for WebM→WAV conversion but was not found. "
                "Install it from https://ffmpeg.org/download.html or pip install imageio-ffmpeg."
            )
        raise RuntimeError(f"Audio conversion failed: {exc}") from exc


# ---------------------------------------------------------------------------
# Prisma call helper (with timeout + one retry)
# ---------------------------------------------------------------------------

async def call_prisma(
    audio_path: str,
    language_code: str,
    output_format: str,
) -> dict:
    """
    Send audio to Gnani Prisma v3.0 and return the parsed JSON response.

    Authentication: X-API-Key-ID header (from environment variable only).
    One retry on network errors or 503 responses. Never retries on 401/403/422.

    Raises HTTPException with clear messages on:
        - Missing API key (503)
        - Invalid key (401)
        - Scope denied (403)
        - Unsupported format (422)
        - Quota exceeded (429)
        - Timeout (504)
        - Network failure (503)
        - Unexpected Prisma error (502)
    """
    if not settings.is_gnani_configured:
        raise HTTPException(
            status_code=503,
            detail=(
                "Gnani API key is not configured. "
                "Add GNANI_API_KEY to backend/.env and restart the server. "
                "Get your key from https://gnani.ai/"
            ),
        )

    headers = {
        "X-API-Key-ID": settings.GNANI_API_KEY,
    }

    max_attempts = 2
    last_error: Exception | None = None

    for attempt in range(1, max_attempts + 1):
        try:
            async with httpx.AsyncClient(timeout=PRISMA_TIMEOUT_SECONDS) as client:
                with open(audio_path, "rb") as audio_file:
                    files = {"audio_file": (Path(audio_path).name, audio_file, "audio/wav")}
                    data = {
                        "model": settings.GNANI_STT_MODEL,   # prisma-v3.0
                        "language_code": language_code,
                        "format": output_format,
                    }
                    logger.info(
                        "Prisma STT call (attempt %d/%d): model=%s lang=%s fmt=%s",
                        attempt, max_attempts,
                        settings.GNANI_STT_MODEL, language_code, output_format,
                    )
                    t0 = time.monotonic()
                    response = await client.post(
                        GNANI_STT_URL,
                        headers=headers,
                        files=files,
                        data=data,
                    )
                    elapsed = time.monotonic() - t0
                    logger.info("Prisma responded in %.2f s — HTTP %d", elapsed, response.status_code)

            # --- Map Prisma error codes to clear user-facing messages ---
            if response.status_code == 200:
                return response.json()

            elif response.status_code == 401:
                raise HTTPException(
                    status_code=401,
                    detail=(
                        "Invalid Gnani API key. "
                        "Check GNANI_API_KEY in backend/.env. "
                        f"Prisma responded: {response.text[:200]}"
                    ),
                )
            elif response.status_code == 403:
                raise HTTPException(
                    status_code=403,
                    detail=(
                        "API key lacks STT scope (SCOPE_NOT_ALLOWED). "
                        "Ensure your Gnani key has Speech-to-Text permission."
                    ),
                )
            elif response.status_code == 422:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        "Prisma rejected this audio file. "
                        "Accepted formats: WAV, MP3, OGG, FLAC, AAC, M4A. "
                        "Max duration: 30 seconds. "
                        f"Prisma detail: {response.text[:200]}"
                    ),
                )
            elif response.status_code == 429:
                raise HTTPException(
                    status_code=429,
                    detail=(
                        "Gnani API quota exceeded. "
                        "Wait before retrying or check your plan at https://gnani.ai/"
                    ),
                )
            elif response.status_code in (502, 503, 504) and attempt < max_attempts:
                # Temporary server error — retry once
                logger.warning(
                    "Prisma returned %d (attempt %d) — retrying in 2 s",
                    response.status_code, attempt
                )
                import asyncio
                await asyncio.sleep(2)
                last_error = HTTPException(
                    status_code=502,
                    detail=f"Prisma server error {response.status_code}: {response.text[:200]}",
                )
                continue
            else:
                raise HTTPException(
                    status_code=502,
                    detail=(
                        f"Unexpected Prisma error (HTTP {response.status_code}). "
                        f"Response: {response.text[:300]}"
                    ),
                )

        except httpx.TimeoutException:
            if attempt < max_attempts:
                logger.warning("Prisma timed out (attempt %d) — retrying", attempt)
                last_error = HTTPException(
                    status_code=504,
                    detail="Transcription service timed out. Retrying...",
                )
                import asyncio
                await asyncio.sleep(1)
                continue
            raise HTTPException(
                status_code=504,
                detail=(
                    "Transcription service timed out after "
                    f"{PRISMA_TIMEOUT_SECONDS:.0f} seconds. "
                    "Check your network or try a shorter audio clip."
                ),
            )
        except httpx.RequestError as exc:
            if attempt < max_attempts:
                logger.warning("Network error (attempt %d): %s — retrying", attempt, exc)
                last_error = HTTPException(
                    status_code=503,
                    detail=f"Network error reaching Prisma: {exc}",
                )
                import asyncio
                await asyncio.sleep(1)
                continue
            raise HTTPException(
                status_code=503,
                detail=(
                    f"Network failure reaching Gnani Prisma: {exc}. "
                    "Check internet connectivity and try again."
                ),
            )
        except HTTPException:
            # Don't retry explicit HTTP errors (401/403/422/429)
            raise

    # All retries exhausted
    if last_error:
        raise last_error
    raise HTTPException(status_code=502, detail="Prisma transcription failed after retries.")


# ---------------------------------------------------------------------------
# Main endpoint
# ---------------------------------------------------------------------------

@router.post("/speak")
async def speak_text(
    payload: SpeakRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    POST /api/voice/speak
    Synthesizes agent response text into spoken audio using Gnani Timbre (timbre-v3.0).
    Returns playable audio/wav binary data.
    """
    if not settings.is_gnani_configured:
        raise HTTPException(
            status_code=503,
            detail="Gnani API key is not configured. Add GNANI_API_KEY to backend/.env."
        )

    text_to_synthesize = payload.text.strip()
    if not text_to_synthesize:
        raise HTTPException(status_code=400, detail="Text for speech synthesis cannot be empty.")

    if len(text_to_synthesize) > 1200:
        raise HTTPException(
            status_code=413,
            detail=f"Text too long ({len(text_to_synthesize)} chars). Max 1200 chars per utterance."
        )

    headers = {
        "X-API-Key-ID": settings.GNANI_API_KEY,
        "Content-Type": "application/json",
    }

    req_body = {
        "text": text_to_synthesize,
        "voice": payload.voice or settings.GNANI_TTS_VOICE,
        "model": settings.GNANI_TTS_MODEL,
        "language": payload.language_mode or "ta-IN",
        "speed": payload.speed,
        "audio_config": {
            "container": "wav",
            "encoding": "linear_pcm",
            "sample_rate": 24000
        }
    }

    max_attempts = 2
    for attempt in range(1, max_attempts + 1):
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                logger.info(
                    "Timbre TTS call (attempt %d/%d): voice=%s lang=%s chars=%d",
                    attempt, max_attempts, req_body["voice"], req_body["language"], len(text_to_synthesize)
                )
                t0 = time.monotonic()
                response = await client.post(
                    GNANI_TTS_URL,
                    headers=headers,
                    json=req_body,
                )
                elapsed = time.monotonic() - t0
                logger.info("Timbre responded in %.2f s — HTTP %d", elapsed, response.status_code)

            if response.status_code == 200:
                audio_bytes = response.content
                if len(audio_bytes) < 100:
                    raise HTTPException(status_code=502, detail="Timbre returned invalid/empty audio data.")
                return Response(content=audio_bytes, media_type="audio/wav")

            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid Gnani API key for Timbre TTS.")
            elif response.status_code == 403:
                raise HTTPException(status_code=403, detail="API key lacks TTS scope permissions.")
            elif response.status_code == 422:
                raise HTTPException(status_code=422, detail=f"Unsupported voice/parameters: {response.text[:200]}")
            elif response.status_code == 429:
                raise HTTPException(status_code=429, detail="Gnani API quota exceeded for TTS.")
            elif response.status_code in (502, 503, 504) and attempt < max_attempts:
                import asyncio
                await asyncio.sleep(1.5)
                continue
            else:
                raise HTTPException(
                    status_code=502,
                    detail=f"Prisma/Timbre server error ({response.status_code}): {response.text[:200]}"
                )

        except httpx.TimeoutException:
            if attempt < max_attempts:
                import asyncio
                await asyncio.sleep(1)
                continue
            raise HTTPException(status_code=504, detail="Timbre speech synthesis timed out.")
        except httpx.RequestError as exc:
            if attempt < max_attempts:
                import asyncio
                await asyncio.sleep(1)
                continue
            raise HTTPException(status_code=503, detail=f"Network error reaching Timbre: {exc}")


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(
    audio: UploadFile = File(..., description="Audio file to transcribe"),
    language: str = Form(
        "auto",
        description=(
            "Language mode: 'tamil' (ta-IN), 'tanglish' (ta-IN,en-IN), "
            "'english' (en-IN), or 'auto' (indic-auto). "
            "Docs: https://docs.gnani.ai/"
        ),
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    POST /api/voice/transcribe

    Accepts an audio file from the browser (MediaRecorder) or file upload.
    Validates the file type and size, converts WebM→WAV if needed, then calls
    Gnani Prisma v3.0. Returns the real transcript and metadata.

    - Requires JWT auth (Authorization: Bearer <token>)
    - API key is read from GNANI_API_KEY env var, never exposed in responses
    - Temporary files are always deleted in the finally block
    - Raw audio is NOT stored unless sector setting 'store_audio' is enabled
    """
    tmp_input_path: str | None = None
    tmp_wav_path: str | None = None
    preprocessing_note: str | None = None

    try:
        # ----------------------------------------------------------------
        # 1. Read file into memory and check size
        # ----------------------------------------------------------------
        content = await audio.read()
        file_size = len(content)

        if file_size == 0:
            raise HTTPException(status_code=400, detail="Audio file is empty.")

        if file_size > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=(
                    f"Audio file too large ({file_size / (1024*1024):.1f} MB). "
                    f"Maximum allowed: {MAX_FILE_SIZE_BYTES // (1024*1024)} MB. "
                    "Prisma REST endpoint supports up to 30 seconds of audio."
                ),
            )

        # ----------------------------------------------------------------
        # 2. Validate file type by extension and content-type
        # ----------------------------------------------------------------
        filename = audio.filename or "audio_upload"
        ext = Path(filename).suffix.lower()
        content_type = (audio.content_type or "").lower().split(";")[0].strip()

        # Accept if either extension or MIME type is in our allowed set
        ext_ok = ext in ACCEPTED_EXTENSIONS
        mime_ok = content_type in ACCEPTED_MIME_TYPES

        if not ext_ok and not mime_ok:
            raise HTTPException(
                status_code=415,
                detail=(
                    f"Unsupported audio format: extension='{ext}' type='{content_type}'. "
                    "Accepted: WAV, MP3, OGG, FLAC, AAC, M4A, WebM "
                    "(WebM is auto-converted to WAV on the server)."
                ),
            )

        # ----------------------------------------------------------------
        # 3. Write to temp file
        # ----------------------------------------------------------------
        suffix = ext if ext else ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_in:
            tmp_in.write(content)
            tmp_input_path = tmp_in.name

        # ----------------------------------------------------------------
        # 4. Convert WebM → WAV if needed (browser MediaRecorder format)
        # ----------------------------------------------------------------
        is_webm = ext == ".webm" or content_type in BROWSER_WEBM_TYPES

        if is_webm:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_wav:
                tmp_wav_path = tmp_wav.name

            try:
                convert_webm_to_wav(tmp_input_path, tmp_wav_path)
                audio_to_send = tmp_wav_path
                preprocessing_note = (
                    "webm_to_wav_conversion: "
                    "Browser MediaRecorder produces WebM/Opus which Prisma does not accept. "
                    "Converted to WAV on the backend before sending to Prisma."
                )
            except RuntimeError as exc:
                raise HTTPException(
                    status_code=500,
                    detail=str(exc),
                )
        else:
            audio_to_send = tmp_input_path
            preprocessing_note = None

        # ----------------------------------------------------------------
        # 5. Resolve language_code and format for Prisma
        # ----------------------------------------------------------------
        lang_key = language.lower().strip()
        if lang_key not in LANGUAGE_OPTIONS:
            lang_key = "auto"
        language_code = LANGUAGE_OPTIONS[lang_key]
        output_format = FORMAT_OPTIONS[lang_key]

        # ----------------------------------------------------------------
        # 6. Call Gnani Prisma (with timeout + one retry)
        # ----------------------------------------------------------------
        prisma_response = await call_prisma(audio_to_send, language_code, output_format)

        # ----------------------------------------------------------------
        # 7. Parse and return real Prisma response
        # ----------------------------------------------------------------
        transcript = prisma_response.get("transcript", "")
        if not transcript:
            # Prisma returned success but empty transcript — surface honestly
            transcript = ""
            logger.warning("Prisma returned success but empty transcript: %s", prisma_response)

        logger.info(
            "Transcription successful for user=%s sector=%s lang=%s chars=%d",
            current_user.username, current_user.sector_id, language_code, len(transcript)
        )

        return TranscribeResponse(
            success=True,
            transcript=transcript,
            language_code=prisma_response.get("language_code", language_code),
            model=prisma_response.get("model", settings.GNANI_STT_MODEL),
            confidence=prisma_response.get("confidence"),
            segments=prisma_response.get("segments"),
            preprocessing=preprocessing_note,
            audio_stored=False,  # Phase 3: never store audio by default
        )

    finally:
        # ----------------------------------------------------------------
        # Always delete temporary files, even on error
        # ----------------------------------------------------------------
        for path in [tmp_input_path, tmp_wav_path]:
            if path and os.path.exists(path):
                try:
                    os.unlink(path)
                    logger.debug("Deleted temp file: %s", path)
                except OSError as exc:
                    logger.warning("Could not delete temp file %s: %s", path, exc)

