from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="owner", nullable=False)  # owner, staff, admin
    is_active = Column(Boolean, default=True, nullable=False)
    sector_id = Column(String(50), ForeignKey("sectors.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    sector = relationship("Sector", back_populates="users")

    def __repr__(self) -> str:
        return f"<User {self.username} ({self.role}) - Sector: {self.sector_id} Active: {self.is_active}>"
