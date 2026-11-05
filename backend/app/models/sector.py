from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Sector(Base):
    __tablename__ = "sectors"

    id = Column(String(50), primary_key=True, index=True)  # e.g., 'panchayat_health'
    name = Column(String(100), nullable=False)
    display_name_ta = Column(String(150), nullable=False)
    display_name_en = Column(String(150), nullable=False)
    tagline_ta = Column(String(255), nullable=False)
    tagline_en = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    icon = Column(String(50), nullable=False)  # Lucide icon name, e.g., 'HeartPulse', 'Stethoscope'
    accent_color = Column(String(30), nullable=False)  # Hex code, e.g. '#06b6d4'
    secondary_color = Column(String(30), nullable=False)  # Hex code, e.g. '#0891b2'
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    users = relationship("User", back_populates="sector", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="sector", cascade="all, delete-orphan")
    call_logs = relationship("CallLog", back_populates="sector", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="sector", cascade="all, delete-orphan")
    settings = relationship("SectorSetting", back_populates="sector", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Sector {self.id}: {self.display_name_en}>"
