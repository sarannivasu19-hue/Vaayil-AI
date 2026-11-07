import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.user import User
from app.models.alert import Alert
from app.models.call_log import CallLog
from app.models.sector import Sector
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/alerts", tags=["Urgent Alerts"])


def utcnow():
    return datetime.now(timezone.utc)


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sector_id: str
    sector_name: Optional[str] = None
    sector_icon: Optional[str] = None
    sector_accent: Optional[str] = None
    call_id: Optional[int] = None
    phone: str
    reason: str
    matched_keyword: str
    snippet: str
    severity: str  # critical, high, medium
    status: str    # new, under_review, confirmed, resolved, false_alarm
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    review_notes: Optional[str] = None
    is_dev_sample: bool = False
    created_at: str
    transcript_turns: List[Dict[str, str]] = []


class AlertSummaryResponse(BaseModel):
    total_alerts: int
    new_alerts: int
    under_review: int
    confirmed_urgent: int
    resolved_alerts: int
    false_alarms: int


class ReviewAlertRequest(BaseModel):
    action: str  # confirm, false_alarm, follow_up, resolve
    review_notes: Optional[str] = None


def format_alert(a: Alert, s: Optional[Sector], c: Optional[CallLog]) -> AlertResponse:
    turns = []
    if c and c.transcript_turns_json:
        try:
            turns = json.loads(c.transcript_turns_json)
        except Exception:
            turns = []

    return AlertResponse(
        id=a.id,
        sector_id=a.sector_id,
        sector_name=s.name if s else a.sector_id,
        sector_icon=s.icon if s else "ShieldAlert",
        sector_accent=s.accent_color if s else "#FF647C",
        call_id=a.call_id,
        phone=a.phone,
        reason=a.reason,
        matched_keyword=a.matched_keyword,
        snippet=a.snippet,
        severity=a.severity or "high",
        status=a.status,
        reviewed_by=a.reviewed_by,
        reviewed_at=a.reviewed_at.isoformat() if a.reviewed_at else None,
        review_notes=a.review_notes,
        is_dev_sample=a.is_dev_sample,
        created_at=a.created_at.isoformat() if a.created_at else "",
        transcript_turns=turns
    )


@router.get("/summary", response_model=AlertSummaryResponse)
@router.get("/summary/", response_model=AlertSummaryResponse, include_in_schema=False)
def get_alerts_summary(
    sector_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns KPI metrics for urgent alerts:
    Total, New, Under Review, Confirmed, Resolved, and False Alarms.
    """
    query = db.query(Alert)
    # Scoping: if not admin, strictly scoped to user's sector
    if current_user.role != "admin":
        query = query.filter(Alert.sector_id == current_user.sector_id)
    elif sector_id and sector_id != "all":
        query = query.filter(Alert.sector_id == sector_id)

    total = query.count()
    new_count = query.filter(Alert.status.in_(["new", "pending_review"])).count()
    review_count = query.filter(Alert.status == "under_review").count()
    confirmed_count = query.filter(Alert.status == "confirmed").count()
    resolved_count = query.filter(Alert.status == "resolved").count()
    false_count = query.filter(Alert.status == "false_alarm").count()

    return AlertSummaryResponse(
        total_alerts=total,
        new_alerts=new_count,
        under_review=review_count,
        confirmed_urgent=confirmed_count,
        resolved_alerts=resolved_count,
        false_alarms=false_count
    )


@router.get("", response_model=List[AlertResponse])
@router.get("/", response_model=List[AlertResponse], include_in_schema=False)
def get_alerts(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    sector_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lists urgent alerts with filters for status, severity, sector, and search.
    Provides role-based scoping: business owners see their sector, admin sees all.
    """
    query = db.query(Alert)

    # Scoping
    if current_user.role != "admin":
        query = query.filter(Alert.sector_id == current_user.sector_id)
    elif sector_id and sector_id != "all":
        query = query.filter(Alert.sector_id == sector_id)

    # Status filter
    if status and status != "all":
        if status == "new":
            query = query.filter(Alert.status.in_(["new", "pending_review"]))
        else:
            query = query.filter(Alert.status == status)

    # Severity filter
    if severity and severity != "all":
        query = query.filter(Alert.severity == severity)

    # Text search
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Alert.phone.ilike(term),
                Alert.reason.ilike(term),
                Alert.matched_keyword.ilike(term),
                Alert.snippet.ilike(term),
            )
        )

    alerts = query.order_by(Alert.created_at.desc()).limit(100).all()

    # Prefetch sectors and call logs
    sectors_map = {s.id: s for s in db.query(Sector).all()}
    call_ids = [a.call_id for a in alerts if a.call_id]
    calls_map = {}
    if call_ids:
        calls = db.query(CallLog).filter(CallLog.id.in_(call_ids)).all()
        calls_map = {c.id: c for c in calls}

    return [
        format_alert(a, sectors_map.get(a.sector_id), calls_map.get(a.call_id))
        for a in alerts
    ]


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert_detail(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves full alert details including transcript turns and caller information.
    """
    query = db.query(Alert).filter(Alert.id == alert_id)
    if current_user.role != "admin":
        query = query.filter(Alert.sector_id == current_user.sector_id)

    alert = query.first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")

    sector = db.query(Sector).filter(Sector.id == alert.sector_id).first()
    call_log = db.query(CallLog).filter(CallLog.id == alert.call_id).first() if alert.call_id else None

    return format_alert(alert, sector, call_log)


@router.patch("/{alert_id}/review", response_model=AlertResponse)
@router.put("/{alert_id}/review", response_model=AlertResponse, include_in_schema=False)
def review_alert(
    alert_id: int,
    payload: ReviewAlertRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Saves a formal review decision to the database.
    Supported actions: confirm, false_alarm, follow_up, resolve.
    Audited with reviewer name, timestamp, and review notes.
    """
    query = db.query(Alert).filter(Alert.id == alert_id)
    if current_user.role != "admin":
        query = query.filter(Alert.sector_id == current_user.sector_id)

    alert = query.first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")

    action_map = {
        "confirm": "confirmed",
        "false_alarm": "false_alarm",
        "follow_up": "under_review",
        "resolve": "resolved",
    }

    if payload.action not in action_map:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action '{payload.action}'. Must be one of: confirm, false_alarm, follow_up, resolve."
        )

    alert.status = action_map[payload.action]
    alert.reviewed_by = current_user.full_name or current_user.username
    alert.reviewed_at = utcnow()
    if payload.review_notes:
        alert.review_notes = payload.review_notes.strip()

    db.commit()
    db.refresh(alert)

    sector = db.query(Sector).filter(Sector.id == alert.sector_id).first()
    call_log = db.query(CallLog).filter(CallLog.id == alert.call_id).first() if alert.call_id else None

    return format_alert(alert, sector, call_log)

