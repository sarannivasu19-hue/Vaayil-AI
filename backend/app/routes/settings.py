"""
Settings API Route — fully rewritten to use the actual key-value DB model.

The `sector_settings` table stores rows as (sector_id, key, value_json).
Previous code incorrectly accessed flat columns (business_name, working_hours…)
that don't exist → nothing ever saved. This version uses _get / _upsert helpers.

GET  /api/settings  — returns all settings for the current user's sector
PUT  /api/settings  — saves all settings and returns the updated values
"""

import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, validator
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.setting import SectorSetting
from app.auth.dependencies import get_current_user
from app.sectors.registry import get_sector_package

router = APIRouter(prefix="/settings", tags=["Settings"])

VALID_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
VALID_VOICES = ["Shivani", "Avinash", "Lakshmi", "Kalpana", "Shubham", "Prakash"]
VALID_LANGUAGE_MODES = ["tanglish", "tamil", "english"]


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class AgentQuestion(BaseModel):
    id: str
    text_en: str
    text_ta: str
    order: int


class SectorSettingsModel(BaseModel):
    # Business Profile
    business_name: str = Field(..., min_length=1, max_length=200)
    contact_phone: str = Field("", max_length=20)
    contact_email: str = Field("", max_length=200)

    # Working Hours
    open_time: str = Field("09:00", pattern=r"^\d{2}:\d{2}$")
    close_time: str = Field("18:00", pattern=r"^\d{2}:\d{2}$")
    working_days: List[str] = Field(default_factory=lambda: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"])

    # Booking
    slot_length_minutes: int = Field(30, ge=5, le=240)

    # Voice & Language
    language_mode: str = Field("tanglish")
    tts_voice: str = Field("Shivani")

    # Agent Questions (editable view of sector slots)
    agent_questions: List[AgentQuestion] = Field(default_factory=list)

    # Urgent Keywords
    urgent_keywords: List[str] = Field(default_factory=list)

    # Privacy
    store_audio: bool = False
    data_retention_days: int = Field(90, ge=1, le=3650)
    consent_banner_enabled: bool = False

    @validator("language_mode")
    def validate_language_mode(cls, v):
        if v not in VALID_LANGUAGE_MODES:
            raise ValueError(f"language_mode must be one of {VALID_LANGUAGE_MODES}")
        return v

    @validator("tts_voice")
    def validate_tts_voice(cls, v):
        if v not in VALID_VOICES:
            raise ValueError(f"tts_voice must be one of {VALID_VOICES}")
        return v

    @validator("working_days")
    def validate_working_days(cls, v):
        invalid = [d for d in v if d not in VALID_DAYS]
        if invalid:
            raise ValueError(f"Invalid days: {invalid}. Valid: {VALID_DAYS}")
        return v


# ---------------------------------------------------------------------------
# DB helpers — read/write individual setting keys
# ---------------------------------------------------------------------------

def _get_setting(db: Session, sector_id: str, key: str, default=None):
    """Retrieve a setting value by key; returns default if not found."""
    row = db.query(SectorSetting).filter(
        SectorSetting.sector_id == sector_id,
        SectorSetting.key == key,
    ).first()
    if row is None:
        return default
    try:
        return json.loads(row.value_json)
    except (json.JSONDecodeError, TypeError):
        return default


def _upsert_setting(db: Session, sector_id: str, key: str, value) -> None:
    """Insert or update a setting key-value pair."""
    row = db.query(SectorSetting).filter(
        SectorSetting.sector_id == sector_id,
        SectorSetting.key == key,
    ).first()
    value_json = json.dumps(value, ensure_ascii=False)
    if row is None:
        row = SectorSetting(
            sector_id=sector_id,
            key=key,
            value_json=value_json,
        )
        db.add(row)
    else:
        row.value_json = value_json


# ---------------------------------------------------------------------------
# Default agent questions from sector slot definitions
# ---------------------------------------------------------------------------

def _default_agent_questions(sector_id: str) -> List[dict]:
    pkg = get_sector_package(sector_id)
    if not pkg:
        return []
    return [
        {
            "id": slot.name,
            "text_en": slot.prompts.en,
            "text_ta": slot.prompts.ta,
            "order": i,
        }
        for i, slot in enumerate(pkg.slots)
    ]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("", response_model=SectorSettingsModel)
def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Load all settings for the current user's sector workspace.
    Returns defaults from the sector package if no saved value exists yet.
    """
    sid = current_user.sector_id
    pkg = get_sector_package(sid)

    default_name = pkg.name if pkg else "Vaayil Business"
    default_keywords = pkg.urgent_keywords if pkg else []
    default_questions = _default_agent_questions(sid)

    return SectorSettingsModel(
        # Business Profile
        business_name=_get_setting(db, sid, "business_name", default_name),
        contact_phone=_get_setting(db, sid, "contact_phone", ""),
        contact_email=_get_setting(db, sid, "contact_email", ""),

        # Working Hours
        open_time=_get_setting(db, sid, "open_time", "09:00"),
        close_time=_get_setting(db, sid, "close_time", "18:00"),
        working_days=_get_setting(db, sid, "working_days", ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]),

        # Booking
        slot_length_minutes=_get_setting(db, sid, "slot_length_minutes", 30),

        # Voice & Language
        language_mode=_get_setting(db, sid, "language_mode", "tanglish"),
        tts_voice=_get_setting(db, sid, "tts_voice", "Shivani"),

        # Agent Questions
        agent_questions=_get_setting(db, sid, "agent_questions", default_questions),

        # Urgent Keywords
        urgent_keywords=_get_setting(db, sid, "urgent_keywords", default_keywords),

        # Privacy
        store_audio=_get_setting(db, sid, "store_audio", False),
        data_retention_days=_get_setting(db, sid, "data_retention_days", 90),
        consent_banner_enabled=_get_setting(db, sid, "consent_banner_enabled", False),
    )


@router.put("", response_model=SectorSettingsModel)
def update_settings(
    payload: SectorSettingsModel,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Persist all settings for the current sector. Each field is stored as an
    individual key-value row (upsert). Returns the saved values immediately.
    """
    sid = current_user.sector_id

    _upsert_setting(db, sid, "business_name", payload.business_name)
    _upsert_setting(db, sid, "contact_phone", payload.contact_phone)
    _upsert_setting(db, sid, "contact_email", payload.contact_email)
    _upsert_setting(db, sid, "open_time", payload.open_time)
    _upsert_setting(db, sid, "close_time", payload.close_time)
    _upsert_setting(db, sid, "working_days", payload.working_days)
    _upsert_setting(db, sid, "slot_length_minutes", payload.slot_length_minutes)
    _upsert_setting(db, sid, "language_mode", payload.language_mode)
    _upsert_setting(db, sid, "tts_voice", payload.tts_voice)
    _upsert_setting(db, sid, "agent_questions", [q.dict() for q in payload.agent_questions])
    _upsert_setting(db, sid, "urgent_keywords", payload.urgent_keywords)
    _upsert_setting(db, sid, "store_audio", payload.store_audio)
    _upsert_setting(db, sid, "data_retention_days", payload.data_retention_days)
    _upsert_setting(db, sid, "consent_banner_enabled", payload.consent_banner_enabled)

    db.commit()
    return payload
