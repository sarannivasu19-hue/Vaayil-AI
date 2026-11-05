from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict, Field


class BookingCreate(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=10, max_length=15)
    details: Dict[str, Any] = Field(default_factory=dict)
    notes: Optional[str] = None


class BookingUpdate(BaseModel):
    customer_name: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None  # confirmed, pending, completed, cancelled
    details: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sector_id: str
    reference_number: str
    customer_name: str
    phone: str
    status: str
    details: Dict[str, Any]
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ConflictCheckResponse(BaseModel):
    has_conflict: bool
    conflict_message: Optional[str] = None
    conflicting_reference: Optional[str] = None

