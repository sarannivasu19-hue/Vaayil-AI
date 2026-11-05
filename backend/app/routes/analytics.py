"""
Analytics & Dashboard API Routes (Phase 7).
GET /api/analytics/summary
GET /api/analytics/export/calls (CSV)
GET /api/analytics/export/bookings (CSV)
"""

import csv
import io
import json
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.booking import Booking
from app.models.call_log import CallLog
from app.models.alert import Alert
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


class DailyCount(BaseModel):
    date: str
    count: int


class OutcomeCount(BaseModel):
    outcome: str
    count: int


class IntentCount(BaseModel):
    intent: str
    count: int


class PeakHour(BaseModel):
    hour: str
    calls: int


class DashboardSummaryResponse(BaseModel):
    today_calls: int
    today_bookings: int
    completion_rate_pct: float
    avg_call_duration_seconds: int
    urgent_alerts_count: int
    calls_per_day: List[DailyCount]
    outcomes: List[OutcomeCount]
    top_intents: List[IntentCount]
    peak_hours: List[PeakHour]
    recent_calls: List[Dict[str, Any]]


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_analytics_summary(
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD filter"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD filter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    GET /api/analytics/summary
    Computes dashboard and analytics metrics dynamically from database records.
    Nothing hardcoded.
    """
    sector_id = current_user.sector_id
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # 1. Base query with optional date range
    calls_query = db.query(CallLog).filter(CallLog.sector_id == sector_id)
    bookings_query = db.query(Booking).filter(Booking.sector_id == sector_id)

    if start_date:
        try:
            s_dt = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc)
            calls_query = calls_query.filter(CallLog.created_at >= s_dt)
            bookings_query = bookings_query.filter(Booking.created_at >= s_dt)
        except ValueError:
            pass

    if end_date:
        try:
            e_dt = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
            calls_query = calls_query.filter(CallLog.created_at <= e_dt)
            bookings_query = bookings_query.filter(Booking.created_at <= e_dt)
        except ValueError:
            pass

    all_calls = calls_query.order_by(CallLog.created_at.desc()).all()
    all_bookings = bookings_query.all()

    # 2. Today's metrics
    today_calls_count = db.query(CallLog).filter(
        CallLog.sector_id == sector_id,
        CallLog.created_at >= today_start
    ).count()

    today_bookings_count = db.query(Booking).filter(
        Booking.sector_id == sector_id,
        Booking.created_at >= today_start
    ).count()

    # Urgent alerts count
    urgent_alerts = db.query(Alert).filter(
        Alert.sector_id == sector_id,
        Alert.status == "pending_review"
    ).count()

    # Total calls & duration
    total_calls = len(all_calls)
    total_duration = sum(c.duration_seconds for c in all_calls)
    avg_duration = int(total_duration / total_calls) if total_calls > 0 else 0

    booked_calls = sum(1 for c in all_calls if c.outcome == "booked")
    completion_rate = round((booked_calls / total_calls * 100), 1) if total_calls > 0 else 0.0

    # 3. Calls per day (last 7 days trend)
    daily_map: Dict[str, int] = {}
    for i in range(6, -1, -1):
        day_str = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_map[day_str] = 0

    for c in all_calls:
        d_str = c.created_at.strftime("%Y-%m-%d")
        if d_str in daily_map:
            daily_map[d_str] += 1

    calls_per_day = [DailyCount(date=d, count=cnt) for d, cnt in daily_map.items()]

    # 4. Outcomes distribution
    outcome_map: Dict[str, int] = {}
    for c in all_calls:
        outcome_map[c.outcome] = outcome_map.get(c.outcome, 0) + 1
    outcomes = [OutcomeCount(outcome=k, count=v) for k, v in outcome_map.items()]

    # 5. Top Intents from heuristic insights
    intent_map: Dict[str, int] = {}
    for c in all_calls:
        try:
            ins = json.loads(c.extracted_details_json or "{}")
            raw_intent = ins.get("intent", "General Inquiry").replace(" (heuristic)", "")
            intent_map[raw_intent] = intent_map.get(raw_intent, 0) + 1
        except Exception:
            pass
    top_intents = [IntentCount(intent=k, count=v) for k, v in sorted(intent_map.items(), key=lambda x: -x[1])[:5]]

    # 6. Peak Hours distribution
    hour_map: Dict[int, int] = {h: 0 for h in [9, 10, 11, 12, 14, 15, 16, 17, 18, 19]}
    for c in all_calls:
        hr = c.created_at.hour
        if hr in hour_map:
            hour_map[hr] += 1
    peak_hours = [
        PeakHour(hour=f"{h:02d}:00", calls=cnt)
        for h, cnt in sorted(hour_map.items())
    ]

    # 7. Recent calls snippet
    recent_calls = []
    for c in all_calls[:8]:
        recent_calls.append({
            "id": c.id,
            "caller_phone": c.caller_phone,
            "outcome": c.outcome,
            "duration": f"{c.duration_seconds}s",
            "time": c.created_at.strftime("%H:%M"),
            "urgent": c.urgent_flag,
        })

    return DashboardSummaryResponse(
        today_calls=today_calls_count,
        today_bookings=today_bookings_count,
        completion_rate_pct=completion_rate,
        avg_call_duration_seconds=avg_duration,
        urgent_alerts_count=urgent_alerts,
        calls_per_day=calls_per_day,
        outcomes=outcomes,
        top_intents=top_intents,
        peak_hours=peak_hours,
        recent_calls=recent_calls,
    )


@router.get("/export/calls")
def export_calls_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    GET /api/analytics/export/calls
    Generates downloadable CSV export of all call logs for current sector.
    """
    calls = db.query(CallLog).filter(CallLog.sector_id == current_user.sector_id).order_by(CallLog.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Call ID", "Sector", "Caller Phone", "Outcome", "Duration (s)", "Sentiment", "Urgent", "Created At"])

    for c in calls:
        writer.writerow([
            c.id,
            c.sector_id,
            c.caller_phone,
            c.outcome,
            c.duration_seconds,
            c.sentiment,
            "Yes" if c.urgent_flag else "No",
            c.created_at.isoformat() if c.created_at else "",
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=calls_{current_user.sector_id}.csv"}
    )


@router.get("/export/bookings")
def export_bookings_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    GET /api/analytics/export/bookings
    Generates downloadable CSV export of all bookings for current sector.
    """
    bookings = db.query(Booking).filter(Booking.sector_id == current_user.sector_id).order_by(Booking.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Ref Number", "Sector", "Customer Name", "Phone", "Status", "Created At", "Details JSON"])

    for b in bookings:
        writer.writerow([
            b.reference_number,
            b.sector_id,
            b.customer_name,
            b.phone,
            b.status,
            b.created_at.isoformat() if b.created_at else "",
            b.details_json,
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=bookings_{current_user.sector_id}.csv"}
    )

