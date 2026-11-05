from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.sectors.base import SlotDefinition


class SectorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    display_name_ta: str
    display_name_en: str
    tagline_ta: str
    tagline_en: str
    description: str
    icon: str
    accent_color: str
    secondary_color: str
    is_active: bool
    created_at: datetime


class SectorDetailResponse(SectorResponse):
    """Includes slot definitions for dynamic form generation and prompt display."""
    slots: List[SlotDefinition] = []
    has_scheduling: bool = False
    schedule_date_key: Optional[str] = None
    schedule_time_key: Optional[str] = None
    urgent_keywords: List[str] = []
