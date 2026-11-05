from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class SectorSetting(Base):
    __tablename__ = "sector_settings"

    id = Column(Integer, primary_key=True, index=True)
    sector_id = Column(String(50), ForeignKey("sectors.id"), nullable=False, index=True)
    key = Column(String(100), nullable=False)
    value_json = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    sector = relationship("Sector", back_populates="settings")

    __table_args__ = (
        UniqueConstraint("sector_id", "key", name="uq_sector_key"),
    )

    def __repr__(self) -> str:
        return f"<SectorSetting {self.sector_id}.{self.key}>"
