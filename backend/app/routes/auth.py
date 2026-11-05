from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.sector import Sector
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse, SectorBrief
from app.auth.security import verify_password, create_access_token
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user with username and password.
    Returns signed JWT access token and user's sector workspace information.
    """
    clean_username = request.username.strip().lower()
    user = db.query(User).filter(User.username.ilike(clean_username)).first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password. Check your credentials or select a demo account.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fetch associated sector
    sector = db.query(Sector).filter(Sector.id == user.sector_id).first()

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


@router.get("/me", response_model=TokenResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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

    return TokenResponse(
        access_token="",  # Already authenticated
        token_type="bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user=UserResponse.model_validate(current_user),
        sector=sector_brief
    )

