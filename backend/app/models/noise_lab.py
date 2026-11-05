"""
Database model for saved Noise Lab experiments.
Stores audio degradation test runs, reference text, variants, WER, and latency metrics.
Raw audio is NEVER stored in the database.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class NoiseLabRun(Base):
    __tablename__ = "noise_lab_runs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sector_id = Column(String(50), nullable=True)
    reference_text = Column(Text, nullable=False)
    language_mode = Column(String(20), default="tamil")
    audio_filename = Column(String(255), nullable=True)
    results_json = Column(Text, nullable=False)  # JSON serialized list of variant results
    summary_json = Column(Text, nullable=True)  # JSON summary metrics (baseline WER, phone WER, etc.)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User")

