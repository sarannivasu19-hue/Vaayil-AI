from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float, Index
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class CallLog(Base):
    __tablename__ = "call_logs"

    id = Column(Integer, primary_key=True, index=True)
    sector_id = Column(String(50), ForeignKey("sectors.id"), nullable=False, index=True)
    caller_phone = Column(String(20), nullable=False, index=True)
    start_time = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    end_time = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    duration_seconds = Column(Integer, default=0, nullable=False)
    outcome = Column(String(50), default="completed", nullable=False)
    transcript_turns_json = Column(Text, default="[]", nullable=False)
    extracted_details_json = Column(Text, default="{}", nullable=False)
    sentiment = Column(String(30), default="neutral", nullable=False)
    urgent_flag = Column(Boolean, default=False, nullable=False, index=True)
    audio_duration_seconds = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    sector = relationship("Sector", back_populates="call_logs")
    alerts = relationship("Alert", back_populates="call_log", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_calls_sector_created", "sector_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<CallLog #{self.id} ({self.sector_id}) - {self.caller_phone} [{self.outcome}]>"
