"""
Settings API Route (Phase 7).
GET /api/settings
PUT /api/settings
"""

from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.setting import SectorSetting
from app.auth.dependencies import get_current_user
from app.sectors.registry import get_sector_package

router = APIRouter(prefix="/settings", tags=["Settings"])


class SectorSettingsModel(BaseModel):
    business_name: str
    working_hours: str
    slot_length_minutes: int
    language_mode: str
    tts_voice: str
    urgent_keywords: List[str]
    store_audio: bool


@router.get("", response_model=SectorSettingsModel)
def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pkg = get_sector_package(current_user.sector_id)
    setting = db.query(SectorSetting).filter(SectorSetting.sector_id == current_user.sector_id).first()

    if not setting:
        return SectorSettingsModel(
            business_name=pkg.name if pkg else "Vaayil Business",
            working_hours="09:00 AM - 06:00 PM",
            slot_length_minutes=30,
            language_mode="tanglish",
            tts_voice="Shivani",
            urgent_keywords=pkg.urgent_keywords if pkg else [],
            store_audio=False,
        )

    return SectorSettingsModel(
        business_name=setting.business_name or (pkg.name if pkg else ""),
        working_hours=setting.working_hours or "09:00 AM - 06:00 PM",
        slot_length_minutes=setting.slot_length_minutes or 30,
        language_mode=setting.language_mode or "tanglish",
        tts_voice=setting.tts_voice or "Shivani",
        urgent_keywords=pkg.urgent_keywords if pkg else [],
        store_audio=setting.store_audio or False,
    )


@router.put("", response_model=SectorSettingsModel)
def update_settings(
    payload: SectorSettingsModel,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    setting = db.query(SectorSetting).filter(SectorSetting.sector_id == current_user.sector_id).first()
    if not setting:
        setting = SectorSetting(
            sector_id=current_user.sector_id,
            business_name=payload.business_name,
            working_hours=payload.working_hours,
            slot_length_minutes=payload.slot_length_minutes,
            language_mode=payload.language_mode,
            tts_voice=payload.tts_voice,
            store_audio=payload.store_audio,
        )
        db.add(setting)
    else:
        setting.business_name = payload.business_name
        setting.working_hours = payload.working_hours
        setting.slot_length_minutes = payload.slot_length_minutes
        setting.language_mode = payload.language_mode
        setting.tts_voice = payload.tts_voice
        setting.store_audio = payload.store_audio

    db.commit()
    db.refresh(setting)

    pkg = get_sector_package(current_user.sector_id)
    return SectorSettingsModel(
        business_name=setting.business_name,
        working_hours=setting.working_hours,
        slot_length_minutes=setting.slot_length_minutes,
        language_mode=setting.language_mode,
        tts_voice=setting.tts_voice,
        urgent_keywords=payload.urgent_keywords or (pkg.urgent_keywords if pkg else []),
        store_audio=setting.store_audio,
    )

