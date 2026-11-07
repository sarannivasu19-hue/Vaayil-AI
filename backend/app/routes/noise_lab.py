"""
noise_lab.py — Vaayil AI Phase 9 Noise Lab API Routes

POST /api/noise-lab/run
POST /api/noise-lab/save
GET  /api/noise-lab/runs
GET  /api/noise-lab/runs/{id}
GET  /api/noise-lab/runs/{id}/export-csv

Processes audio across controlled synthetic noise levels and phone simulation,
evaluates each version against genuine Gnani Prisma STT, and calculates
Word Error Rate (WER) and word-level accuracy.
Deletes all temporary audio files immediately after use.
"""

import csv
import io
import json
import logging
import os
import tempfile
import time
from typing import List, Dict, Any, Optional
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, Response, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.user import User
from app.models.noise_lab import NoiseLabRun
from app.auth.dependencies import get_current_user
from app.routes.voice import (
    call_prisma,
    convert_webm_to_wav,
    LANGUAGE_OPTIONS,
    FORMAT_OPTIONS,
    MAX_FILE_SIZE_BYTES,
    ACCEPTED_EXTENSIONS,
)
from app.noise_lab.audio_degradation import generate_all_variants
from app.noise_lab.accuracy import compute_wer_and_alignment

logger = logging.getLogger("vaayil-ai.noise_lab")

router = APIRouter(prefix="/noise-lab", tags=["Noise Lab"])


class SaveRunRequest(BaseModel):
    reference_text: str
    language_mode: str = "tamil"
    audio_filename: Optional[str] = "recorded_audio.wav"
    results: List[Dict[str, Any]]
    summary: Optional[Dict[str, Any]] = None


@router.post("/run")
async def run_noise_lab_experiment(
    audio_file: UploadFile = File(...),
    reference_text: str = Form(...),
    language_mode: str = Form("tamil"),
    noise_levels: str = Form("light,medium,heavy"),
    include_phone_sim: bool = Form(True),
    current_user: User = Depends(get_current_user),
):
    """
    Runs a complete Noise Lab benchmark:
    1. Ingests clean reference audio and converts to WAV if necessary.
    2. Synthesizes degraded audio variants (original baseline, light noise, medium noise, heavy noise, phone call sim).
    3. Sends each variant to genuine Gnani Prisma v3.0 API.
    4. Evaluates Word Error Rate (WER) and Word Match Accuracy % against the reference text.
    5. Honestly surfaces any Prisma errors, latency, and degradation impact.
    6. Destroys all temporary audio files before returning.
    """
    ref_clean = reference_text.strip()
    if not ref_clean:
        raise HTTPException(
            status_code=400,
            detail="Reference text is required to calculate word error rate and accuracy."
        )

    ext = Path(audio_file.filename or "").suffix.lower()
    if ext and ext not in ACCEPTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format '{ext}'. Supported: {', '.join(sorted(ACCEPTED_EXTENSIONS))}"
        )

    # Read uploaded audio
    audio_bytes = await audio_file.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded audio file is empty.")
    if len(audio_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Audio file exceeds 10 MB limit.")

    parsed_levels = [lvl.strip() for lvl in noise_levels.split(",") if lvl.strip()]
    if not parsed_levels:
        parsed_levels = ["light", "medium", "heavy"]

    lang_code = LANGUAGE_OPTIONS.get(language_mode, "ta-IN")
    fmt = FORMAT_OPTIONS.get(language_mode, "codemix")

    temp_dir = tempfile.mkdtemp(prefix="vaayil_noiselab_")

    try:
        # Step 1: Save uploaded file to temp dir
        raw_input_path = os.path.join(temp_dir, f"input{ext or '.wav'}")
        with open(raw_input_path, "wb") as f:
            f.write(audio_bytes)

        clean_wav_path = os.path.join(temp_dir, "clean_baseline.wav")
        is_genuine_wav = (
            len(audio_bytes) >= 12
            and audio_bytes[:4] == b"RIFF"
            and audio_bytes[8:12] == b"WAVE"
        )
        if not is_genuine_wav or ext in {".webm", ".ogg", ".mp3", ".m4a", ".aac", ".flac"}:
            try:
                convert_webm_to_wav(raw_input_path, clean_wav_path)
            except Exception as exc:
                logger.error("Audio conversion failed in Noise Lab: %s", exc)
                raise HTTPException(
                    status_code=400,
                    detail=f"Audio conversion failed: {exc}. Ensure valid recorded or uploaded audio."
                )
        else:
            # Copy or write directly as WAV
            clean_wav_path = raw_input_path

        with open(clean_wav_path, "rb") as f:
            clean_wav_bytes = f.read()

        # Step 2: Generate degraded variants
        variants_dict = generate_all_variants(
            clean_wav_bytes=clean_wav_bytes,
            noise_levels=parsed_levels,
            include_phone_sim=include_phone_sim
        )

        results: List[Dict[str, Any]] = []

        # Step 3: Run each variant through Gnani Prisma API
        for variant_key, variant_info in variants_dict.items():
            var_path = os.path.join(temp_dir, f"var_{variant_key}.wav")
            with open(var_path, "wb") as vf:
                vf.write(variant_info["wav_bytes"])

            t0 = time.monotonic()
            transcript = ""
            status_str = "success"
            error_detail = None
            confidence = None

            try:
                prisma_resp = await call_prisma(
                    audio_path=var_path,
                    language_code=lang_code,
                    output_format=fmt
                )
                transcript = prisma_resp.get("transcript", "")
                confidence = prisma_resp.get("confidence")
            except HTTPException as http_exc:
                status_str = "error"
                error_detail = f"Prisma Error ({http_exc.status_code}): {http_exc.detail}"
                logger.warning("Noise Lab variant %s failed: %s", variant_key, error_detail)
            except Exception as exc:
                status_str = "error"
                error_detail = f"Call Failed: {str(exc)}"
                logger.error("Noise Lab variant %s unexpected error: %s", variant_key, exc)

            elapsed_ms = round((time.monotonic() - t0) * 1000, 1)

            # Step 4: Calculate accuracy against reference text
            accuracy_metrics = compute_wer_and_alignment(ref_clean, transcript)

            results.append({
                "variant_key": variant_key,
                "label": variant_info["label"],
                "snr_db": variant_info["snr_db"],
                "description": variant_info["description"],
                "dsp_steps": variant_info["dsp_steps"],
                "status": status_str,
                "error_detail": error_detail,
                "latency_ms": elapsed_ms,
                "transcript": transcript,
                "confidence": confidence,
                "wer": accuracy_metrics["wer"],
                "wer_percent": accuracy_metrics["wer_percent"],
                "word_accuracy_percent": accuracy_metrics["word_accuracy_percent"],
                "substitutions": accuracy_metrics["substitutions"],
                "deletions": accuracy_metrics["deletions"],
                "insertions": accuracy_metrics["insertions"],
                "hits": accuracy_metrics["hits"],
                "ref_word_count": accuracy_metrics["ref_word_count"],
                "hyp_word_count": accuracy_metrics["hyp_word_count"],
                "alignment": accuracy_metrics["alignment"],
            })

            # Delete variant file as soon as processed
            try:
                if os.path.exists(var_path):
                    os.remove(var_path)
            except Exception:
                pass

        # Calculate high-level summary
        baseline_res = next((r for r in results if r["variant_key"] == "original"), None)
        baseline_wer = baseline_res["wer_percent"] if baseline_res else None
        phone_res = next((r for r in results if r["variant_key"] == "phone_sim"), None)
        phone_wer = phone_res["wer_percent"] if phone_res else None

        valid_wers = [r["wer_percent"] for r in results if r["status"] == "success"]
        worst_wer = max(valid_wers) if valid_wers else None

        summary = {
            "baseline_wer_percent": baseline_wer,
            "worst_wer_percent": worst_wer,
            "phone_sim_wer_percent": phone_wer,
            "total_variants": len(results),
            "successful_variants": sum(1 for r in results if r["status"] == "success"),
            "formula": "WER = (Substitutions + Deletions + Insertions) / N_reference; Word Match Accuracy = max(0, 1 - WER) * 100%",
        }

        return {
            "success": True,
            "reference_text": ref_clean,
            "language_mode": language_mode,
            "results": results,
            "summary": summary,
            "disclaimer": "Synthetic noise is a rough test, not a guarantee of real-world acoustic performance.",
            "limitations": [
                "Synthetic Gaussian noise is stationary, whereas real-world noise (canteen chatter, traffic horns, wind) is non-stationary and bursty.",
                "Real phone networks introduce adaptive echo cancellation, jitter buffering, and psychoacoustic codec artifacts (AMR-WB / EVS) beyond basic bandpass filtering.",
                "Prisma's acoustic model may behave differently on continuous real-world reverberation compared to synthesized AWGN.",
            ]
        }

    finally:
        # Step 5: Always clean up temporary directory and files
        try:
            for root, _, files in os.walk(temp_dir):
                for f in files:
                    try:
                        os.remove(os.path.join(root, f))
                    except Exception:
                        pass
            os.rmdir(temp_dir)
        except Exception as exc:
            logger.debug("Failed cleaning Noise Lab temp dir %s: %s", temp_dir, exc)


@router.post("/save")
def save_noise_lab_run(
    req: SaveRunRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Saves a Noise Lab benchmark run for later presentation and demo inspection."""
    run = NoiseLabRun(
        user_id=current_user.id,
        sector_id=current_user.sector_id,
        reference_text=req.reference_text,
        language_mode=req.language_mode,
        audio_filename=req.audio_filename,
        results_json=json.dumps(req.results, ensure_ascii=False),
        summary_json=json.dumps(req.summary or {}, ensure_ascii=False),
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    return {
        "success": True,
        "run_id": run.id,
        "created_at": run.created_at.isoformat(),
        "message": "Noise Lab run saved successfully."
    }


@router.get("/runs")
def list_saved_runs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lists saved Noise Lab runs for the current user."""
    runs = (
        db.query(NoiseLabRun)
        .filter(NoiseLabRun.user_id == current_user.id)
        .order_by(desc(NoiseLabRun.created_at))
        .limit(25)
        .all()
    )

    return [
        {
            "id": r.id,
            "reference_text": r.reference_text,
            "language_mode": r.language_mode,
            "audio_filename": r.audio_filename,
            "summary": json.loads(r.summary_json) if r.summary_json else {},
            "created_at": r.created_at.isoformat(),
        }
        for r in runs
    ]


@router.get("/runs/{run_id}")
def get_saved_run_detail(
    run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves full details of a saved Noise Lab benchmark run."""
    run = (
        db.query(NoiseLabRun)
        .filter(NoiseLabRun.id == run_id, NoiseLabRun.user_id == current_user.id)
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail="Noise Lab run not found.")

    return {
        "id": run.id,
        "reference_text": run.reference_text,
        "language_mode": run.language_mode,
        "audio_filename": run.audio_filename,
        "results": json.loads(run.results_json),
        "summary": json.loads(run.summary_json) if run.summary_json else {},
        "created_at": run.created_at.isoformat(),
    }


@router.get("/runs/{run_id}/export-csv")
def export_run_csv(
    run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Exports a saved Noise Lab run results to downloadable CSV format."""
    run = (
        db.query(NoiseLabRun)
        .filter(NoiseLabRun.id == run_id, NoiseLabRun.user_id == current_user.id)
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail="Noise Lab run not found.")

    results = json.loads(run.results_json)

    output = io.StringIO()
    writer = csv.writer(output)

    # Write Metadata header
    writer.writerow(["Vaayil AI — Noise Lab Benchmark Report"])
    writer.writerow(["Run ID", run.id])
    writer.writerow(["Created At", run.created_at.isoformat()])
    writer.writerow(["Reference Text", run.reference_text])
    writer.writerow(["Language Mode", run.language_mode])
    writer.writerow([])

    # Table columns
    writer.writerow([
        "Variant Key",
        "Variant Label",
        "Target SNR (dB)",
        "Status",
        "Latency (ms)",
        "WER (%)",
        "Word Accuracy (%)",
        "Substitutions",
        "Deletions",
        "Insertions",
        "Reference Word Count",
        "Hypothesis Word Count",
        "Prisma Transcript",
        "Error Detail",
    ])

    for row in results:
        writer.writerow([
            row.get("variant_key"),
            row.get("label"),
            row.get("snr_db") if row.get("snr_db") is not None else "Clean",
            row.get("status"),
            row.get("latency_ms"),
            row.get("wer_percent"),
            row.get("word_accuracy_percent"),
            row.get("substitutions"),
            row.get("deletions"),
            row.get("insertions"),
            row.get("ref_word_count"),
            row.get("hyp_word_count"),
            row.get("transcript", "").replace("\n", " "),
            row.get("error_detail") or "",
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="vaayil_noise_lab_run_{run.id}.csv"'
        }
    )

