"""
Agent conversation turn API routes (Phase 4).
POST /api/agent/turn
"""

import json
import logging
import uuid
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.call_session import CallSession
from app.routes.auth import get_current_user
from app.sectors.registry import get_sector_package
from app.conversation.engine import ConversationEngine, EngineTurnResult

logger = logging.getLogger("vaayil-ai.agent")

router = APIRouter(prefix="/agent", tags=["agent"])


class AgentTurnRequest(BaseModel):
    session_id: Optional[str] = None
    sector_id: str
    transcript_text: str
    language_mode: Optional[str] = "tanglish"  # 'tamil' | 'tanglish' | 'english'


class AgentTurnResponse(BaseModel):
    session_id: str
    state: str
    slots: Dict[str, Any]
    next_slot: Optional[str] = None
    agent_message: str
    is_complete: bool
    summary: Optional[Dict[str, Any]] = None
    conversation_history: list = []


@router.post("/turn", response_model=AgentTurnResponse)
def handle_agent_turn(
    payload: AgentTurnRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    POST /api/agent/turn
    Executes a deterministic slot-filling turn with session persistence.
    """
    pkg = get_sector_package(payload.sector_id)
    if not pkg:
        raise HTTPException(status_code=404, detail=f"Sector package '{payload.sector_id}' not found.")

    # 1. Retrieve or initialize call session
    session_id = payload.session_id or str(uuid.uuid4())
    call_sess = db.query(CallSession).filter(CallSession.id == session_id).first()

    if not call_sess:
        call_sess = CallSession(
            id=session_id,
            sector_id=payload.sector_id,
            language_mode=payload.language_mode or "tanglish",
            current_state="collecting",
            current_slot=None,
            slots_json="{}",
            history_json="[]",
        )
        db.add(call_sess)
        db.flush()

    # Parse state and history from DB
    current_slots = json.loads(call_sess.slots_json or "{}")
    history = json.loads(call_sess.history_json or "[]")

    # Append user turn to history
    user_turn_text = payload.transcript_text.strip()
    history.append({
        "speaker": "caller",
        "text": user_turn_text,
    })

    # 2. Run deterministic engine
    engine = ConversationEngine(package=pkg, language_mode=payload.language_mode or call_sess.language_mode)
    turn_result = engine.process_turn(
        session_id=session_id,
        user_transcript=user_turn_text,
        current_slots=current_slots,
        current_state=call_sess.current_state,
        current_slot=call_sess.current_slot,
    )

    # Append agent reply to history
    history.append({
        "speaker": "agent",
        "text": turn_result.agent_message,
    })

    # 3. Update and persist session state
    call_sess.current_state = turn_result.state
    call_sess.current_slot = turn_result.next_slot
    call_sess.slots_json = json.dumps(turn_result.slots, ensure_ascii=False)
    call_sess.history_json = json.dumps(history, ensure_ascii=False)
    call_sess.language_mode = payload.language_mode or call_sess.language_mode

    # If phone was extracted, store in session
    if "phone" in turn_result.slots:
        call_sess.caller_phone = str(turn_result.slots["phone"])

    db.commit()

    return AgentTurnResponse(
        session_id=session_id,
        state=turn_result.state,
        slots=turn_result.slots,
        next_slot=turn_result.next_slot,
        agent_message=turn_result.agent_message,
        is_complete=turn_result.is_complete,
        summary=turn_result.summary,
        conversation_history=history,
    )

