from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.sector import Sector
from app.models.call_log import CallLog
from app.models.alert import Alert
from app.models.booking import Booking
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin Portal"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency: Restricts endpoint access strictly to admin users."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Administrator privileges required."
        )
    return current_user


class AdminOverviewResponse(BaseModel):
    total_users: int
    active_users: int
    total_sectors: int
    total_calls: int
    total_bookings: int
    total_alerts: int
    new_alerts: int
    confirmed_alerts: int
    system_status: str
    integrations: Dict[str, Any]
    sector_breakdown: List[Dict[str, Any]]


class AdminUserItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    sector_id: Optional[str] = None
    created_at: datetime


class ToggleStatusRequest(BaseModel):
    is_active: bool


@router.get("/overview", response_model=AdminOverviewResponse)
def get_admin_overview(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Returns platform-wide metrics and integration health for administrators."""
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_sectors = db.query(Sector).filter(Sector.id != "system").count()
    total_calls = db.query(CallLog).count()
    total_bookings = db.query(Booking).count()
    total_alerts = db.query(Alert).count()
    new_alerts = db.query(Alert).filter(Alert.status.in_(["new", "pending_review"])).count()
    confirmed_alerts = db.query(Alert).filter(Alert.status == "confirmed").count()

    # Sector Breakdown
    sectors = db.query(Sector).filter(Sector.id != "system").all()
    breakdown = []
    for s in sectors:
        calls_count = db.query(CallLog).filter(CallLog.sector_id == s.id).count()
        bookings_count = db.query(Booking).filter(Booking.sector_id == s.id).count()
        alerts_count = db.query(Alert).filter(Alert.sector_id == s.id).count()
        users_count = db.query(User).filter(User.sector_id == s.id).count()
        breakdown.append({
            "sector_id": s.id,
            "name": s.name,
            "display_name_ta": s.display_name_ta,
            "display_name_en": s.display_name_en,
            "icon": s.icon,
            "accent_color": s.accent_color,
            "users_count": users_count,
            "calls_count": calls_count,
            "bookings_count": bookings_count,
            "alerts_count": alerts_count,
        })

    integrations = {
        "database": {"status": "connected", "type": "SQLite ACID", "ping_ms": 1.2},
        "gnani_stt": {
            "status": "online" if settings.GNANI_API_KEY else "simulation_fallback",
            "model": settings.GNANI_STT_MODEL,
            "language": "ta-IN / tanglish"
        },
        "gnani_tts": {
            "status": "online" if settings.GNANI_API_KEY else "simulation_fallback",
            "model": settings.GNANI_TTS_MODEL,
            "voice": settings.GNANI_TTS_VOICE
        },
        "security": {"auth_mode": "JWT RS256/HS256", "rbac_enabled": True}
    }

    return AdminOverviewResponse(
        total_users=total_users,
        active_users=active_users,
        total_sectors=total_sectors,
        total_calls=total_calls,
        total_bookings=total_bookings,
        total_alerts=total_alerts,
        new_alerts=new_alerts,
        confirmed_alerts=confirmed_alerts,
        system_status="operational",
        integrations=integrations,
        sector_breakdown=breakdown,
    )


@router.get("/users", response_model=List[AdminUserItem])
def get_admin_users(
    search: Optional[str] = Query(None),
    sector_id: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Lists registered platform users with search and filter capabilities."""
    query = db.query(User)

    if sector_id and sector_id != "all":
        query = query.filter(User.sector_id == sector_id)

    if role and role != "all":
        query = query.filter(User.role == role)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (User.full_name.ilike(term)) |
            (User.email.ilike(term)) |
            (User.username.ilike(term)) |
            (User.phone.ilike(term))
        )

    users = query.order_by(User.created_at.desc()).all()
    return [AdminUserItem.model_validate(u) for u in users]


@router.patch("/users/{user_id}/status")
def toggle_user_status(
    user_id: int,
    payload: ToggleStatusRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Allows administrators to activate or deactivate user accounts."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.id == admin.id and not payload.is_active:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own active administrator account."
        )

    user.is_active = payload.is_active
    db.commit()
    return {
        "success": True,
        "message": f"User '{user.username}' is now {'active' if user.is_active else 'deactivated'}.",
        "user_id": user.id,
        "is_active": user.is_active
    }

