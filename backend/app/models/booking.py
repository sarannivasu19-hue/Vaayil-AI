from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    sector_id = Column(String(50), ForeignKey("sectors.id"), nullable=False, index=True)
    reference_number = Column(String(50), unique=True, index=True, nullable=False)
    customer_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False, index=True)
    status = Column(String(30), default="confirmed", nullable=False)  # confirmed, pending, completed, cancelled
    details_json = Column(Text, default="{}", nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    sector = relationship("Sector", back_populates="bookings")

    __table_args__ = (
        Index("idx_sector_phone", "sector_id", "phone"),
        Index("idx_sector_created", "sector_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Booking {self.reference_number} ({self.sector_id}) - {self.customer_name}>"
