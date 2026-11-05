from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.config import settings
from app.models.sector import Sector
from app.schemas.common import HealthResponse

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    """
    System Health Check endpoint.
    Verifies database connectivity and reports genuine Gnani configuration status.
    Never exposes raw API keys.
    """
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"

    active_sectors_count = db.query(Sector).filter(Sector.is_active == True).count()

    is_gnani_ready = settings.is_gnani_configured

    return HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        timestamp=datetime.now(timezone.utc),
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        database=db_status,
        gnani_stt_configured=is_gnani_ready,
        gnani_tts_configured=is_gnani_ready,
        gnani_stt_model=settings.GNANI_STT_MODEL,
        gnani_tts_model=settings.GNANI_TTS_MODEL,
        active_sectors_count=active_sectors_count
    )

