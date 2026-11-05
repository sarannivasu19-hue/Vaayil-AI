from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SlotPrompt(BaseModel):
    ta: str = Field(..., description="Prompt question in pure Tamil script")
    tanglish: str = Field(..., description="Prompt question in phonetic Tanglish (Latin script)")
    en: str = Field(..., description="Prompt question in English")


class SlotDefinition(BaseModel):
    name: str = Field(..., description="Slot key identifier, e.g. 'citizen_name'")
    label_en: str = Field(..., description="English field label")
    label_ta: str = Field(..., description="Tamil field label")
    type: str = Field("text", description="Field type: text, phone, date, time, number, select")
    required: bool = Field(True, description="Whether this slot is mandatory for booking completion")
    options: Optional[List[str]] = Field(None, description="Allowed choices for select type")
    prompts: SlotPrompt = Field(..., description="Multi-language prompt templates")
    description: Optional[str] = Field(None, description="Contextual guidance for agent extraction")


class SampleBooking(BaseModel):
    customer_name: str
    phone: str
    status: str = "confirmed"
    details: Dict[str, Any]
    notes: Optional[str] = None


class SectorPackage(BaseModel):
    """
    Standard interface for all sector packages in Vaayil AI.
    Adding a new sector requires creating only one package definition file.
    """
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
    has_scheduling: bool = False
    schedule_date_key: Optional[str] = None
    schedule_time_key: Optional[str] = None
    demo_user: Dict[str, str]
    slots: List[SlotDefinition]
    urgent_keywords: List[str] = Field(default_factory=list)
    sample_bookings: List[SampleBooking] = Field(default_factory=list)

