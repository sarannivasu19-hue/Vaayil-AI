import re
import logging
from typing import Optional
from datetime import timedelta
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.sector import Sector
from app.schemas.auth import (
    LoginRequest,
    AdminLoginRequest,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
    UserResponse,
    SectorBrief,
)
from app.auth.security import verify_password, hash_password, create_access_token
from app.auth.dependencies import get_current_user, security_bearer

logger = logging.getLogger("vaayil-ai.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Public User Registration.
    One Gmail = One User Account = Access to All Six Workspaces.
    Requires only Full Name, Gmail Address, Password, and Confirm Password.
    Guarantees that public registration NEVER grants admin privileges.
    """
    # 1. Field validation
    full_name = request.full_name.strip()
    if len(full_name) < 2:
        raise HTTPException(status_code=400, detail="Full name must be at least 2 characters long.")

    clean_email = request.email.strip().lower()
    email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    if not re.match(email_regex, clean_email):
        raise HTTPException(status_code=400, detail="Please enter a valid Gmail or email address.")

    clean_phone = None
    if request.phone:
        raw_phone = re.sub(r"[^\d+]", "", request.phone.strip())
        digits_only = re.sub(r"[^\d]", "", raw_phone)
        if len(digits_only) >= 10:
            clean_phone = raw_phone

    # 2. Password validation
    if len(request.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
    if not re.search(r"\d", request.password):
        raise HTTPException(status_code=400, detail="Password must contain at least one numeric digit.")
    if not re.search(r"[a-zA-Z]", request.password):
        raise HTTPException(status_code=400, detail="Password must contain at least one letter.")
    if request.password != request.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    # 3. Duplicate checks - globally unique Gmail address
    existing_by_email = db.query(User).filter(User.email.ilike(clean_email)).first()
    if existing_by_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This Gmail is already registered. Please log in using your existing account."
        )

    # Derive unique username from email
    base_username = clean_email.split("@")[0]
    base_username = re.sub(r"[^a-zA-Z0-9_]", "_", base_username)[:35]
    candidate_username = base_username
    counter = 1
    while db.query(User).filter(User.username == candidate_username).first():
        candidate_username = f"{base_username}_{counter}"
        counter += 1

    # 4. Create single user account with access to all six workspaces
    new_user = User(
        username=candidate_username,
        email=clean_email,
        full_name=full_name,
        phone=clean_phone,
        hashed_password=hash_password(request.password),
        role="user",
        sector_id=request.sector_id if request.sector_id else None,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return RegisterResponse(
        message=f"Account created successfully for {full_name}! You can now log in with your Gmail.",
        user=UserResponse.model_validate(new_user)
    )


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user with username or email and password.
    Returns signed JWT access token and user's sector workspace information.
    """
    clean_identifier = request.username.strip().lower()
    user = db.query(User).filter(
        (User.username.ilike(clean_identifier)) | (User.email.ilike(clean_identifier))
    ).first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password. Check your credentials or select a demo account.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated by an administrator. Please contact support.",
        )

    # Fetch associated sector
    sector = db.query(Sector).filter(Sector.id == user.sector_id).first() if user.sector_id else None

    # Create JWT
    token_payload = {
        "sub": user.username,
        "user_id": user.id,
        "role": user.role,
        "sector_id": user.sector_id,
    }
    access_token = create_access_token(
        data=token_payload,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    sector_brief = None
    if sector:
        sector_brief = SectorBrief(
            id=sector.id,
            name=sector.name,
            display_name_ta=sector.display_name_ta,
            display_name_en=sector.display_name_en,
            tagline_ta=sector.tagline_ta,
            tagline_en=sector.tagline_en,
            icon=sector.icon,
            accent_color=sector.accent_color,
            secondary_color=sector.secondary_color
        )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user=UserResponse.model_validate(user),
        sector=sector_brief
    )


@router.post("/admin-login", response_model=TokenResponse)
def admin_login(request: AdminLoginRequest, db: Session = Depends(get_db)):
    """
    Dedicated Administrator Login Endpoint.
    Strictly enforces that authenticated user possesses the 'admin' role.
    Rejects normal business owners and unauthorized users with HTTP 403 Forbidden.
    """
    clean_identifier = request.username.strip().lower()
    user = db.query(User).filter(
        (User.username.ilike(clean_identifier)) | (User.email.ilike(clean_identifier))
    ).first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrator credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Enforce admin role strictly on backend
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Administrator privileges required to access this portal.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator account is disabled.",
        )

    sector = db.query(Sector).filter(Sector.id == user.sector_id).first() if user.sector_id else None

    token_payload = {
        "sub": user.username,
        "user_id": user.id,
        "role": user.role,
        "sector_id": user.sector_id,
    }
    access_token = create_access_token(
        data=token_payload,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    sector_brief = None
    if sector:
        sector_brief = SectorBrief(
            id=sector.id,
            name=sector.name,
            display_name_ta=sector.display_name_ta,
            display_name_en=sector.display_name_en,
            tagline_ta=sector.tagline_ta,
            tagline_en=sector.tagline_en,
            icon=sector.icon,
            accent_color=sector.accent_color,
            secondary_color=sector.secondary_color
        )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user=UserResponse.model_validate(user),
        sector=sector_brief
    )


@router.post("/demo-login/{sector_id}", response_model=TokenResponse)
def demo_login(sector_id: str, db: Session = Depends(get_db)):
    """
    Authenticate demo account directly for a given sector workspace.
    Provides instant secure demo access without exposing plain passwords in frontend code.
    """
    clean_sector_id = sector_id.strip().lower()
    user = db.query(User).filter(User.sector_id == clean_sector_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No demo account found for sector '{sector_id}'.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo account for this sector has been deactivated. Contact the administrator.",
        )

    sector = db.query(Sector).filter(Sector.id == user.sector_id).first()

    token_payload = {
        "sub": user.username,
        "user_id": user.id,
        "role": user.role,
        "sector_id": user.sector_id,
    }
    access_token = create_access_token(
        data=token_payload,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    sector_brief = None
    if sector:
        sector_brief = SectorBrief(
            id=sector.id,
            name=sector.name,
            display_name_ta=sector.display_name_ta,
            display_name_en=sector.display_name_en,
            tagline_ta=sector.tagline_ta,
            tagline_en=sector.tagline_en,
            icon=sector.icon,
            accent_color=sector.accent_color,
            secondary_color=sector.secondary_color
        )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user=UserResponse.model_validate(user),
        sector=sector_brief
    )


@router.get("/me", response_model=TokenResponse)
def get_me(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the currently authenticated user's profile and active sector workspace.
    """
    sector = db.query(Sector).filter(Sector.id == current_user.sector_id).first()
    sector_brief = None
    if sector:
        sector_brief = SectorBrief(
            id=sector.id,
            name=sector.name,
            display_name_ta=sector.display_name_ta,
            display_name_en=sector.display_name_en,
            tagline_ta=sector.tagline_ta,
            tagline_en=sector.tagline_en,
            icon=sector.icon,
            accent_color=sector.accent_color,
            secondary_color=sector.secondary_color
        )

    raw_token = credentials.credentials if credentials else ""
    return TokenResponse(
        access_token=raw_token,
        token_type="bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user=UserResponse.model_validate(current_user),
        sector=sector_brief
    )


class SwitchSectorRequest(BaseModel):
    sector_id: str


@router.post("/switch-sector", response_model=TokenResponse)
def switch_sector(
    request: SwitchSectorRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Switches active workspace context for the authenticated user across all six workspaces.
    Reuses the same authenticated account without forcing separate logins.
    """
    target_sector = db.query(Sector).filter(Sector.id == request.sector_id).first()
    if not target_sector:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid workspace sector ID: '{request.sector_id}'.",
        )

    # Multi-workspace authorization check
    # Single User Account = Access to All Six Workspaces
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated. Please contact support.",
        )

    # Update active sector on user record
    current_user.sector_id = target_sector.id
    db.commit()
    db.refresh(current_user)

    # Create new JWT bound to the target workspace
    token_payload = {
        "sub": current_user.username,
        "user_id": current_user.id,
        "role": current_user.role,
        "sector_id": target_sector.id,
    }
    access_token = create_access_token(
        data=token_payload,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    sector_brief = SectorBrief(
        id=target_sector.id,
        name=target_sector.name,
        display_name_ta=target_sector.display_name_ta,
        display_name_en=target_sector.display_name_en,
        tagline_ta=target_sector.tagline_ta,
        tagline_en=target_sector.tagline_en,
        icon=target_sector.icon,
        accent_color=target_sector.accent_color,
        secondary_color=target_sector.secondary_color,
    )

    logger.info(
        "User '%s' (%s) switched workspace to '%s' (%s)",
        current_user.username, current_user.email, target_sector.id, target_sector.name
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user=UserResponse.model_validate(current_user),
        sector=sector_brief,
    )


