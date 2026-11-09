"""
Google OAuth & Gmail API Router for Vaayil AI.
Provides centralized endpoints for Gmail connection status, OAuth authentication,
disconnection, and workspace-specific email notifications across all six workspaces.
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routes.auth import get_current_user
from app.services.gmail_service import (
    GmailService,
    SECTOR_BUSINESS_INFO,
    ALL_WORKSPACES,
)
from app.config import settings

router = APIRouter(prefix="/gmail", tags=["Gmail & Google OAuth"])


class GmailStatusResponse(BaseModel):
    is_connected: bool
    email: Optional[str] = None
    connected_at: Optional[str] = None
    updated_at: Optional[str] = None
    token_status: str
    scopes: List[str] = []
    workspaces_enabled: List[str] = []
    last_error: Optional[str] = None


class ConnectGmailRequest(BaseModel):
    email: EmailStr
    auth_code: Optional[str] = None
    expires_in_seconds: Optional[int] = 3600


class DisconnectGmailRequest(BaseModel):
    email: Optional[str] = None


class SendNotificationRequest(BaseModel):
    sector_id: str
    recipient_email: str
    recipient_name: str
    reference_number: str
    notification_type: Optional[str] = "service_update"
    details: Optional[Dict[str, Any]] = Field(default_factory=dict)


class SendTestEmailRequest(BaseModel):
    sector_id: str
    recipient_email: Optional[str] = None


@router.get("/status", response_model=GmailStatusResponse)
def get_gmail_status(
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns the real connection status of the shared Google account.
    Consistent across all six workspaces.
    """
    status_info = GmailService.get_status(db, current_user)
    return GmailStatusResponse(**status_info)


@router.get("/auth-url")
def get_auth_url(
    redirect_uri: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    """
    Returns the Google OAuth 2.0 authorization URL.
    Requests only the minimal scopes needed for sending notifications:
    - https://www.googleapis.com/auth/gmail.send
    - https://www.googleapis.com/auth/userinfo.email
    """
    client_id = getattr(settings, "GOOGLE_CLIENT_ID", "")
    target_redirect = redirect_uri or getattr(settings, "GOOGLE_REDIRECT_URI", "http://127.0.0.1:8000/api/gmail/callback")
    scope = "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email"

    if client_id:
        url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={client_id}&"
            f"redirect_uri={target_redirect}&"
            f"response_type=code&"
            f"scope={scope}&"
            f"access_type=offline&"
            f"prompt=consent"
        )
    else:
        # Dev / simulated authorization url
        url = f"http://127.0.0.1:5173/#gmail-auth?redirect={target_redirect}"

    return {
        "auth_url": url,
        "client_configured": bool(client_id),
        "scope": scope,
        "redirect_uri": target_redirect,
    }


@router.post("/connect", response_model=GmailStatusResponse)
def connect_gmail(
    payload: ConnectGmailRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Connects or links a Gmail account.
    Saves authorization persistently in database.
    Immediately available across all 6 workspaces.
    """
    account = GmailService.connect_account(
        db=db,
        email=str(payload.email),
        user=current_user,
        expires_in_seconds=payload.expires_in_seconds or 3600,
    )
    status_info = GmailService.get_status(db, current_user)
    return GmailStatusResponse(**status_info)


@router.post("/disconnect", response_model=GmailStatusResponse)
def disconnect_gmail(
    payload: Optional[DisconnectGmailRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Disconnects the shared Gmail account.
    Updates connection status across all six workspaces.
    """
    target_email = payload.email if payload and payload.email else (current_user.email if "@gmail.com" in current_user.email else None)
    GmailService.disconnect_account(db, target_email)
    status_info = GmailService.get_status(db, current_user)
    return GmailStatusResponse(**status_info)


@router.post("/refresh", response_model=GmailStatusResponse)
def refresh_token(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Triggers refresh token renewal for the active Google account.
    """
    account = GmailService.get_connected_account(db, current_user)
    if not account:
        raise HTTPException(
            status_code=404,
            detail="No Google account found to refresh."
        )

    success = GmailService.refresh_access_token(db, account)
    if not success:
        raise HTTPException(
            status_code=400,
            detail=f"Token refresh failed: {account.last_error}"
        )

    status_info = GmailService.get_status(db, current_user)
    return GmailStatusResponse(**status_info)


@router.post("/send-notification")
async def send_notification(
    payload: SendNotificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Dispatches a workspace-specific notification email using the shared Gmail account.
    Maintains tenant-level data isolation.
    """
    if payload.sector_id not in ALL_WORKSPACES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid workspace sector_id: '{payload.sector_id}'. Must be one of {ALL_WORKSPACES}",
        )

    # Sector authorization check
    if current_user.role not in ("admin", "owner", "user") and current_user.sector_id != payload.sector_id:
        raise HTTPException(
            status_code=403,
            detail=f"Access denied: You are not authorized to send emails for workspace '{payload.sector_id}'.",
        )

    try:
        result = await GmailService.send_notification(
            db=db,
            sector_id=payload.sector_id,
            recipient_email=payload.recipient_email,
            recipient_name=payload.recipient_name,
            reference_number=payload.reference_number,
            notification_type=payload.notification_type or "service_update",
            details=payload.details or {},
            user=current_user,
        )
        return result
    except RuntimeError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except ValueError as err:
        raise HTTPException(status_code=422, detail=str(err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Failed to dispatch email: {str(err)}")


@router.post("/send-test-email")
async def send_test_email(
    payload: SendTestEmailRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Sends a controlled test notification email for a specific workspace.
    Verifies that business branding, contact info, and recipient are isolated.
    """
    if payload.sector_id not in ALL_WORKSPACES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid workspace sector_id: '{payload.sector_id}'. Must be one of {ALL_WORKSPACES}",
        )

    # Sector authorization
    if current_user.role not in ("admin", "owner", "user") and current_user.sector_id != payload.sector_id:
        raise HTTPException(
            status_code=403,
            detail=f"Access denied: You are not authorized for workspace '{payload.sector_id}'.",
        )

    account = GmailService.get_connected_account(db, current_user)
    if not account or not account.is_connected:
        raise HTTPException(
            status_code=400,
            detail="No Gmail account connected. Please connect Gmail in Settings first.",
        )

    recipient = payload.recipient_email or account.email or current_user.email
    b_info = SECTOR_BUSINESS_INFO[payload.sector_id]

    test_samples: Dict[str, Dict[str, Any]] = {
        "panchayat_health": {
            "notification_type": "complaint_ack",
            "ref": "VYL-PAN-TEST-001",
            "details": {
                "service": "Drinking Water Testing & Chlorine Check",
                "ward_location": "Ward 4, North Street",
                "status": "In Progress (Inspected by VHN)",
            },
        },
        "clinic": {
            "notification_type": "appointment_confirmation",
            "ref": "VYL-CLN-TEST-001",
            "details": {
                "doctor": "Dr. Karthik Sundaram (M.B.B.S.)",
                "consultation_type": "General Outpatient Examination",
                "token_number": "Token #14",
                "reporting_time": "Tomorrow at 10:30 AM",
            },
        },
        "vet_clinic": {
            "notification_type": "vet_notification",
            "ref": "VYL-VET-TEST-001",
            "details": {
                "veterinary_officer": "Dr. Murugan Velu (B.V.Sc)",
                "animal_patient": "Milking Cow (Holstein Friesian Cross)",
                "reason": "Foot & Mouth Vaccination Schedule",
                "clinic_location": "Govt Vet Centre, Hospital Road",
            },
        },
        "hotel_lodge": {
            "notification_type": "hotel_booking",
            "ref": "VYL-HTL-TEST-001",
            "details": {
                "room_type": "Executive Suite (Air Conditioned)",
                "check_in_date": "15th Nov 2026, 12:00 PM",
                "check_out_date": "17th Nov 2026, 11:00 AM",
                "tariff_per_night": "Rs. 2,500 / night",
            },
        },
        "restaurant": {
            "notification_type": "restaurant_order",
            "ref": "VYL-RST-TEST-001",
            "details": {
                "order_type": "Family Dining Table Booking + Special Chettinad Meals",
                "table_reserved": "Table #6 (AC Hall)",
                "estimated_bill": "Rs. 1,450",
                "dining_time": "Today at 07:30 PM",
            },
        },
        "coaching": {
            "notification_type": "coaching_enquiry",
            "ref": "VYL-CCH-TEST-001",
            "details": {
                "course_enrolled": "TNPSC Group 2 & 4 Intensive Weekend Batch",
                "batch_timing": "Saturday & Sunday: 09:30 AM - 01:30 PM",
                "academic_counselor": "Prof. Vigneshwaran K",
                "session_mode": "Hybrid (Classroom + Recorded Video Access)",
            },
        },
    }

    sample = test_samples[payload.sector_id]

    try:
        result = await GmailService.send_notification(
            db=db,
            sector_id=payload.sector_id,
            recipient_email=recipient,
            recipient_name=current_user.full_name or "Valued Customer",
            reference_number=sample["ref"],
            notification_type=sample["notification_type"],
            details=sample["details"],
            user=current_user,
        )
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Test email failed: {str(exc)}")

