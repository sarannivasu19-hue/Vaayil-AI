from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    sector_id = Column(String(50), ForeignKey("sectors.id"), nullable=False, index=True)
    call_id = Column(Integer, ForeignKey("call_logs.id"), nullable=True, index=True)
    phone = Column(String(20), nullable=False, index=True)
    reason = Column(String(255), nullable=False)
    matched_keyword = Column(String(100), nullable=False)
    snippet = Column(Text, nullable=False)
    severity = Column(String(20), default="high", nullable=False)  # critical, high, medium
    status = Column(String(30), default="new", nullable=False, index=True)  # new, under_review, confirmed, resolved, false_alarm
    reviewed_by = Column(String(100), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    review_notes = Column(Text, nullable=True)
    is_dev_sample = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    sector = relationship("Sector", back_populates="alerts")
    call_log = relationship("CallLog", back_populates="alerts")

    __table_args__ = (
        Index("idx_alerts_sector_status", "sector_id", "status"),
        Index("idx_alerts_created_at", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Alert #{self.id} ({self.sector_id}) [{self.severity}|{self.status}] {self.reason}>"
