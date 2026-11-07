"""
Analytics & Dashboard API Routes (Phase 7 & Redesign).
GET /api/analytics/summary
GET /api/analytics/export/calls (CSV)
GET /api/analytics/export/bookings (CSV)
GET /api/analytics/hub-overview
"""

import csv
import io
import json
import re
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.booking import Booking
from app.models.call_log import CallLog
from app.models.alert import Alert
from app.auth.dependencies import get_current_user
from app.sectors.registry import get_sector_package

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def to_naive(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    return dt.replace(tzinfo=None) if dt.tzinfo else dt


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


class LanguageCount(BaseModel):
    language: str
    count: int
    percentage: float


class StatusCount(BaseModel):
    status: str
    count: int


class SectorComparisonItem(BaseModel):
    sector_id: str
    name: str
    calls: int
    bookings: int


class RecentAlertItem(BaseModel):
    id: int
    caller_phone: str
    reason: str
    status: str
    created_at: str


class SectorOverviewStat(BaseModel):
    sector_id: str
    calls_today: int
    total_calls: int
    bookings_today: int
    total_bookings: int
    urgent_alerts: int
    last_call_at: Optional[str] = None


class HubOverviewResponse(BaseModel):
    total_calls: int
    today_calls: int
    total_bookings: int
    today_bookings: int
    total_urgent_alerts: int
    overall_completion_rate: float
    sector_stats: Dict[str, SectorOverviewStat]
    recent_calls: List[Dict[str, Any]]
    daily_trends: List[DailyCount]


class DashboardSummaryResponse(BaseModel):
    today_calls: int
    today_bookings: int
    completion_rate_pct: float
    avg_call_duration_seconds: int
    urgent_alerts_count: int
    pending_actions_count: int
    calls_per_day: List[DailyCount]
    outcomes: List[OutcomeCount]
    top_intents: List[IntentCount]
    peak_hours: List[PeakHour]
    recent_calls: List[Dict[str, Any]]
    language_distribution: List[LanguageCount]
    booking_trends: List[DailyCount]
    booking_statuses: List[StatusCount]
    sector_comparison: List[SectorComparisonItem]
    recent_alerts: List[RecentAlertItem]


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
    All data is derived from actual CallLog, Booking, and Alert tables.
    """
    sector_id = current_user.sector_id
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # 1. Base queries
    calls_query = db.query(CallLog).filter(CallLog.sector_id == sector_id)
    bookings_query = db.query(Booking).filter(Booking.sector_id == sector_id)

    if start_date:
        try:
            s_dt = datetime.fromisoformat(start_date).replace(tzinfo=None)
            calls_query = calls_query.filter(CallLog.created_at >= s_dt)
            bookings_query = bookings_query.filter(Booking.created_at >= s_dt)
        except (ValueError, TypeError):
            pass

    if end_date:
        try:
            e_dt = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59, tzinfo=None)
            calls_query = calls_query.filter(CallLog.created_at <= e_dt)
            bookings_query = bookings_query.filter(Booking.created_at <= e_dt)
        except (ValueError, TypeError):
            pass

    all_calls = calls_query.order_by(CallLog.created_at.desc()).all()
    all_bookings = bookings_query.order_by(Booking.created_at.desc()).all()

    # 2. Today's metrics (safely using to_naive)
    today_calls_count = sum(1 for c in all_calls if to_naive(c.created_at) and to_naive(c.created_at) >= today_start)
    today_bookings_count = sum(1 for b in all_bookings if to_naive(b.created_at) and to_naive(b.created_at) >= today_start)

    # Urgent alerts count
    urgent_alerts = db.query(Alert).filter(
        Alert.sector_id == sector_id,
        Alert.status == "pending_review"
    ).count()

    # Pending bookings count
    pending_bookings_count = sum(1 for b in all_bookings if b.status == "pending")
    pending_actions = pending_bookings_count + urgent_alerts

    # Total calls & duration
    total_calls = len(all_calls)
    total_duration = sum(c.duration_seconds for c in all_calls)
    avg_duration = int(total_duration / total_calls) if total_calls > 0 else 0

    booked_calls = sum(1 for c in all_calls if c.outcome in ("booked", "completed"))
    completion_rate = round((booked_calls / total_calls * 100), 1) if total_calls > 0 else 0.0

    # 3. Calls per day (last 7 days trend)
    daily_map: Dict[str, int] = {}
    for i in range(6, -1, -1):
        day_str = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_map[day_str] = 0

    for c in all_calls:
        if c.created_at:
            d_str = to_naive(c.created_at).strftime("%Y-%m-%d")
            if d_str in daily_map:
                daily_map[d_str] += 1

    calls_per_day = [DailyCount(date=d, count=cnt) for d, cnt in daily_map.items()]

    # 4. Booking Trends (last 7 days trend)
    booking_daily_map: Dict[str, int] = {}
    for i in range(6, -1, -1):
        day_str = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        booking_daily_map[day_str] = 0

    for b in all_bookings:
        if b.created_at:
            d_str = to_naive(b.created_at).strftime("%Y-%m-%d")
            if d_str in booking_daily_map:
                booking_daily_map[d_str] += 1

    booking_trends = [DailyCount(date=d, count=cnt) for d, cnt in booking_daily_map.items()]

    # 5. Outcomes distribution
    outcome_map: Dict[str, int] = {}
    for c in all_calls:
        out = c.outcome or "completed"
        outcome_map[out] = outcome_map.get(out, 0) + 1
    outcomes = [OutcomeCount(outcome=k, count=v) for k, v in outcome_map.items()]

    # 6. Booking status distribution
    status_map: Dict[str, int] = {}
    for b in all_bookings:
        st = b.status or "confirmed"
        status_map[st] = status_map.get(st, 0) + 1
    booking_statuses = [StatusCount(status=k, count=v) for k, v in status_map.items()]

    # 7. Language Distribution
    # Analyze transcripts or extracted details for Tamil script vs Tanglish vs English
    lang_counts = {"Tamil": 0, "Tanglish": 0, "English": 0}
    for c in all_calls:
        text_corpus = ""
        try:
            turns = json.loads(c.transcript_turns_json or "[]")
            text_corpus = " ".join([t.get("text", "") for t in turns])
        except Exception:
            text_corpus = ""

        if not text_corpus:
            try:
                ins = json.loads(c.extracted_details_json or "{}")
                text_corpus = ins.get("summary", "")
            except Exception:
                pass

        has_tamil_script = bool(re.search(r"[\u0B80-\u0BFF]", text_corpus))
        has_latin_words = bool(re.search(r"[a-zA-Z]{3,}", text_corpus))

        if has_tamil_script and has_latin_words:
            lang_counts["Tanglish"] += 1
        elif has_tamil_script:
            lang_counts["Tamil"] += 1
        elif has_latin_words:
            # Check for Tanglish romanized words
            tanglish_tokens = {"vanakkam", "unga", "nanri", "thevai", "aachu", "irukku", "sollunga", "venum", "paambu", "nenju"}
            words = set(re.findall(r"\b[a-zA-Z]+\b", text_corpus.lower()))
            if words.intersection(tanglish_tokens):
                lang_counts["Tanglish"] += 1
            else:
                lang_counts["English"] += 1
        else:
            # Default to Tanglish (primary operating mode in TN)
            lang_counts["Tanglish"] += 1

    total_lang_samples = sum(lang_counts.values()) or 1
    language_distribution = [
        LanguageCount(
            language=k,
            count=v,
            percentage=round((v / total_lang_samples * 100), 1)
        )
        for k, v in lang_counts.items()
    ]

    # 8. Top Intents from heuristic insights
    intent_map: Dict[str, int] = {}
    for c in all_calls:
        try:
            ins = json.loads(c.extracted_details_json or "{}")
            raw_intent = ins.get("intent", "General Inquiry").replace(" (heuristic)", "")
            intent_map[raw_intent] = intent_map.get(raw_intent, 0) + 1
        except Exception:
            pass
    top_intents = [IntentCount(intent=k, count=v) for k, v in sorted(intent_map.items(), key=lambda x: -x[1])[:5]]

    # 9. Peak Hours distribution
    hour_map: Dict[int, int] = {h: 0 for h in [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]}
    for c in all_calls:
        if c.created_at:
            hr = to_naive(c.created_at).hour
            if hr in hour_map:
                hour_map[hr] += 1
    peak_hours = [
        PeakHour(hour=f"{h:02d}:00", calls=cnt)
        for h, cnt in sorted(hour_map.items())
    ]

    # 10. Sector Activity Comparison across all 6 sectors
    known_sectors = [
        ("panchayat_health", "Panchayat Health"),
        ("clinic", "Clinic"),
        ("vet_clinic", "Veterinary"),
        ("hotel_lodge", "Hotel & Lodge"),
        ("restaurant", "Restaurant"),
        ("coaching", "Coaching Centre"),
    ]
    sector_comparison: List[SectorComparisonItem] = []
    for s_id, s_name in known_sectors:
        sc_calls = db.query(CallLog).filter(CallLog.sector_id == s_id).count()
        sc_bookings = db.query(Booking).filter(Booking.sector_id == s_id).count()
        sector_comparison.append(SectorComparisonItem(
            sector_id=s_id,
            name=s_name,
            calls=sc_calls,
            bookings=sc_bookings,
        ))

    # 11. Recent calls snippet
    recent_calls = []
    for c in all_calls[:6]:
        recent_calls.append({
            "id": c.id,
            "caller_phone": c.caller_phone,
            "outcome": c.outcome,
            "duration": f"{c.duration_seconds}s",
            "time": to_naive(c.created_at).strftime("%H:%M") if c.created_at else "",
            "urgent": c.urgent_flag,
        })

    # 12. Recent alerts snippet
    alerts = db.query(Alert).filter(Alert.sector_id == sector_id).order_by(Alert.created_at.desc()).limit(5).all()
    recent_alerts = [
        RecentAlertItem(
            id=a.id,
            caller_phone=a.phone,
            reason=a.reason,
            status=a.status,
            created_at=to_naive(a.created_at).strftime("%b %d, %H:%M") if a.created_at else "",
        )
        for a in alerts
    ]

    return DashboardSummaryResponse(
        today_calls=today_calls_count,
        today_bookings=today_bookings_count,
        completion_rate_pct=completion_rate,
        avg_call_duration_seconds=avg_duration,
        urgent_alerts_count=urgent_alerts,
        pending_actions_count=pending_actions,
        calls_per_day=calls_per_day,
        outcomes=outcomes,
        top_intents=top_intents,
        peak_hours=peak_hours,
        recent_calls=recent_calls,
        language_distribution=language_distribution,
        booking_trends=booking_trends,
        booking_statuses=booking_statuses,
        sector_comparison=sector_comparison,
        recent_alerts=recent_alerts,
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


@router.get("/hub-overview", response_model=HubOverviewResponse)
def get_hub_overview(
    db: Session = Depends(get_db),
):
    """
    GET /api/analytics/hub-overview
    Provides aggregated platform-wide intelligence across all 6 sectors for the Main Hub Dashboard.
    Dynamic from database; no fake data.
    """
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    all_calls = db.query(CallLog).order_by(CallLog.created_at.desc()).all()
    all_bookings = db.query(Booking).all()
    all_alerts = db.query(Alert).filter(Alert.status == "pending_review").all()

    total_calls = len(all_calls)
    today_calls = sum(1 for c in all_calls if to_naive(c.created_at) and to_naive(c.created_at) >= today_start)
    total_bookings = len(all_bookings)
    today_bookings = sum(1 for b in all_bookings if to_naive(b.created_at) and to_naive(b.created_at) >= today_start)
    total_urgent_alerts = len(all_alerts)

    completed_calls = sum(1 for c in all_calls if c.outcome in ("booked", "completed"))
    overall_completion_rate = round((completed_calls / total_calls * 100), 1) if total_calls > 0 else 0.0

    # Sector breakdown
    sector_stats: Dict[str, SectorOverviewStat] = {}
    known_sectors = ["panchayat_health", "clinic", "vet_clinic", "hotel_lodge", "restaurant", "coaching"]
    for s_id in known_sectors:
        s_calls = [c for c in all_calls if c.sector_id == s_id]
        s_bookings = [b for b in all_bookings if b.sector_id == s_id]
        s_alerts = [a for a in all_alerts if a.sector_id == s_id]

        sector_stats[s_id] = SectorOverviewStat(
            sector_id=s_id,
            calls_today=sum(1 for c in s_calls if to_naive(c.created_at) and to_naive(c.created_at) >= today_start),
            total_calls=len(s_calls),
            bookings_today=sum(1 for b in s_bookings if to_naive(b.created_at) and to_naive(b.created_at) >= today_start),
            total_bookings=len(s_bookings),
            urgent_alerts=len(s_alerts),
            last_call_at=to_naive(s_calls[0].created_at).isoformat() if s_calls and s_calls[0].created_at else None,
        )

    # 7-day trend across platform
    daily_map: Dict[str, int] = {}
    for i in range(6, -1, -1):
        day_str = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_map[day_str] = 0

    for c in all_calls:
        if c.created_at:
            d_str = to_naive(c.created_at).strftime("%Y-%m-%d")
            if d_str in daily_map:
                daily_map[d_str] += 1

    daily_trends = [DailyCount(date=d, count=cnt) for d, cnt in daily_map.items()]

    recent_calls = []
    for c in all_calls[:6]:
        recent_calls.append({
            "id": c.id,
            "sector_id": c.sector_id,
            "caller_phone": c.caller_phone,
            "outcome": c.outcome,
            "duration": f"{c.duration_seconds}s",
            "time": to_naive(c.created_at).strftime("%H:%M") if c.created_at else "",
            "urgent": c.urgent_flag,
        })

    return HubOverviewResponse(
        total_calls=total_calls,
        today_calls=today_calls,
        total_bookings=total_bookings,
        today_bookings=today_bookings,
        total_urgent_alerts=total_urgent_alerts,
        overall_completion_rate=overall_completion_rate,
        sector_stats=sector_stats,
        recent_calls=recent_calls,
        daily_trends=daily_trends,
    )
