from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    full_name: str
    role: str
    sector_id: str
    created_at: datetime


class SectorBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    display_name_ta: str
    display_name_en: str
    tagline_ta: str
    tagline_en: str
    icon: str
    accent_color: str
    secondary_color: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    user: UserResponse
    sector: Optional[SectorBrief] = None
