from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class GoogleAccount(Base):
    """
    Centralized Google OAuth & Gmail integration model.
    Shared across all six Vaayil AI workspaces (Panchayat, Clinic, Vet Clinic,
    Hotel, Restaurant, Coaching). Never exposes tokens to client.
    """
    __tablename__ = "google_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expiry = Column(DateTime(timezone=True), nullable=True)
    scope = Column(
        String(255),
        default="https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email",
        nullable=False,
    )
    is_connected = Column(Boolean, default=True, nullable=False)
    last_error = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", backref="google_accounts")

    def __repr__(self) -> str:
        return f"<GoogleAccount {self.email} connected={self.is_connected}>"

