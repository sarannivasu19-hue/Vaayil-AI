from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class CallSession(Base):
    __tablename__ = "call_sessions"

    id = Column(String(64), primary_key=True, index=True)  # session UUID
    sector_id = Column(String(50), ForeignKey("sectors.id"), nullable=False, index=True)
    caller_phone = Column(String(20), nullable=True)
    language_mode = Column(String(20), default="tanglish", nullable=False)  # 'ta', 'tanglish', 'en'
    current_state = Column(String(30), default="collecting", nullable=False)  # 'collecting', 'confirming', 'completed'
    current_slot = Column(String(50), nullable=True)
    slots_json = Column(Text, default="{}", nullable=False)
    history_json = Column(Text, default="[]", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    __table_args__ = (
        Index("idx_call_session_sector", "sector_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<CallSession {self.id} [{self.sector_id}] state={self.current_state}>"

