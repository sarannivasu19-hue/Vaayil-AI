"""
Call Logs API Routes (Phase 6).
GET /api/call-logs
GET /api/call-logs/{id}
"""

import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.user import User
from app.models.call_log import CallLog
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/call-logs", tags=["Call Logs"])


class CallLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sector_id: str
    caller_phone: str
    start_time: str
    duration_seconds: int
    outcome: str
    sentiment: str
    urgent_flag: bool
    transcript_turns: List[Dict[str, str]]
    insights: Dict[str, Any]
    created_at: str


@router.get("", response_model=List[CallLogResponse])
def get_call_logs(
    search: Optional[str] = Query(None, description="Search phone or text"),
    outcome: Optional[str] = Query(None, description="Filter by outcome"),
    urgent_only: Optional[bool] = Query(None, description="Filter only urgent flagged calls"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    GET /api/call-logs
    Lists call logs with sector isolation, search, and filters.
    """
    query = db.query(CallLog).filter(CallLog.sector_id == current_user.sector_id)

    if outcome and outcome != "all":
        query = query.filter(CallLog.outcome == outcome)

    if urgent_only:
        query = query.filter(CallLog.urgent_flag == True)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                CallLog.caller_phone.like(term),
                CallLog.transcript_turns_json.like(term),
                CallLog.extracted_details_json.like(term),
            )
        )

    records = query.order_by(CallLog.created_at.desc()).limit(100).all()

    results = []
    for r in records:
        turns = json.loads(r.transcript_turns_json or "[]")
        details = json.loads(r.extracted_details_json or "{}")
        results.append(
            CallLogResponse(
                id=r.id,
                sector_id=r.sector_id,
                caller_phone=r.caller_phone,
                start_time=r.start_time.isoformat() if r.start_time else "",
                duration_seconds=r.duration_seconds,
                outcome=r.outcome,
                sentiment=r.sentiment,
                urgent_flag=r.urgent_flag,
                transcript_turns=turns,
                insights=details,
                created_at=r.created_at.isoformat() if r.created_at else "",
            )
        )

    return results


@router.get("/{call_id}", response_model=CallLogResponse)
def get_call_log_detail(
    call_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    GET /api/call-logs/{id}
    Retrieves full transcript and heuristic insights for a specific call.
    """
    call = db.query(CallLog).filter(
        CallLog.id == call_id,
        CallLog.sector_id == current_user.sector_id,
    ).first()

    if not call:
        raise HTTPException(status_code=404, detail="Call log not found.")

    turns = json.loads(call.transcript_turns_json or "[]")
    details = json.loads(call.extracted_details_json or "{}")

    return CallLogResponse(
        id=call.id,
        sector_id=call.sector_id,
        caller_phone=call.caller_phone,
        start_time=call.start_time.isoformat() if call.start_time else "",
        duration_seconds=call.duration_seconds,
        outcome=call.outcome,
        sentiment=call.sentiment,
        urgent_flag=call.urgent_flag,
        transcript_turns=turns,
        insights=details,
        created_at=call.created_at.isoformat() if call.created_at else "",
    )

