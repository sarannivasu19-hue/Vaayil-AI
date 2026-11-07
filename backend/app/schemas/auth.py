from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    username: str
    password: str


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    full_name: str
    email: str
    phone: str
    password: str
    confirm_password: str
    sector_id: str
    terms_accepted: bool = False


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    is_active: bool = True
    sector_id: Optional[str] = None
    created_at: datetime


class RegisterResponse(BaseModel):
    message: str
    user: UserResponse


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
