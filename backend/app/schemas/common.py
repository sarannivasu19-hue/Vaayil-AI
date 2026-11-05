from datetime import datetime
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str
    environment: str
    database: str
    gnani_stt_configured: bool
    gnani_tts_configured: bool
    gnani_stt_model: str
    gnani_tts_model: str
    active_sectors_count: int


class MessageResponse(BaseModel):
    message: str
    success: bool = True

