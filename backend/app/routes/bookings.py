import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.booking import Booking
from app.models.call_session import CallSession
from app.models.call_log import CallLog
from app.models.alert import Alert
from app.models.user import User
from app.schemas.booking import (
    BookingCreate,
    BookingUpdate,
    BookingResponse,
    ConflictCheckResponse,
)
from pydantic import BaseModel
from app.auth.dependencies import get_current_user
from app.sectors.registry import get_sector_package
from app.conversation.insights import generate_call_summary_heuristic
from app.conversation.urgent_detection import check_urgent_case

router = APIRouter(prefix="/bookings", tags=["Bookings"])

SECTOR_PREFIXES = {
    "panchayat_health": "PAN",
    "clinic": "CLN",
    "vet_clinic": "VET",
    "hotel_lodge": "HTL",
    "restaurant": "RST",
    "coaching": "CCH",
}


def generate_reference_number(db: Session, sector_id: str) -> str:
    """Generates unique sequential reference number, e.g. VYL-PAN-2026-0001."""
    year = datetime.now(timezone.utc).year
    prefix = SECTOR_PREFIXES.get(sector_id, sector_id[:3].upper())
    count = db.query(Booking).filter(Booking.sector_id == sector_id).count()
    return f"VYL-{prefix}-{year}-{(count + 1):04d}"


def check_booking_conflict(
    db: Session,
    sector_id: str,
    details: Dict[str, Any],
    exclude_booking_id: Optional[int] = None,
) -> Optional[str]:
    """
    Checks for scheduling conflicts where relevant.
    Returns error message if conflict exists, otherwise None.
    """
    pkg = get_sector_package(sector_id)
    if not pkg or not pkg.has_scheduling or not pkg.schedule_date_key:
        return None

    date_key = pkg.schedule_date_key
    time_key = pkg.schedule_time_key

    target_date = details.get(date_key)
    target_time = details.get(time_key) if time_key else None

    if not target_date:
        return None

    # Query existing active bookings for this sector
    query = db.query(Booking).filter(
        Booking.sector_id == sector_id,
        Booking.status != "cancelled"
    )
    if exclude_booking_id:
        query = query.filter(Booking.id != exclude_booking_id)

    existing_bookings = query.all()

    for b in existing_bookings:
        try:
            b_details = json.loads(b.details_json)
        except Exception:
            continue

        b_date = b_details.get(date_key)
        if not b_date:
            continue

        # Hotel room date overlap check
        if sector_id == "hotel_lodge":
            b_checkout = b_details.get("checkout_date", b_date)
            target_checkout = details.get("checkout_date", target_date)
            b_room = b_details.get("room_type")
            target_room = details.get("room_type")

            if b_room and target_room and b_room == target_room:
                # Check date overlap: target_date < b_checkout and target_checkout > b_date
                if str(target_date) < str(b_checkout) and str(target_checkout) > str(b_date):
                    return (
                        f"Conflict: Room category '{target_room}' is already booked from "
                        f"{b_date} to {b_checkout} (Ref: {b.reference_number})."
                    )
        else:
            # Point-in-time slot check (Clinic, Vet, Restaurant, Coaching)
            if str(b_date) == str(target_date):
                if time_key and target_time:
                    b_time = b_details.get(time_key)
                    if b_time and str(b_time).strip() == str(target_time).strip():
                        return (
                            f"Time slot conflict: '{target_time}' on {target_date} is already "
                            f"booked for {b.customer_name} (Ref: {b.reference_number})."
                        )

    return None


def serialize_booking(b: Booking) -> BookingResponse:
    """Helper to deserialize details_json into a dictionary for response."""
    try:
        details_dict = json.loads(b.details_json) if b.details_json else {}
    except Exception:
        details_dict = {}

    return BookingResponse(
        id=b.id,
        sector_id=b.sector_id,
        reference_number=b.reference_number,
        customer_name=b.customer_name,
        phone=b.phone,
        status=b.status,
        details=details_dict,
        notes=b.notes,
        created_at=b.created_at,
        updated_at=b.updated_at,
    )


class ConfirmBookingRequest(BaseModel):
    session_id: str
    sector_id: str
    slots: Dict[str, Any]
    notes: Optional[str] = None


@router.post("/confirm", response_model=BookingResponse)
def confirm_booking(
    payload: ConfirmBookingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    POST /api/bookings/confirm
    Idempotent, transactional confirmation and saving of a call booking/request.
    Also creates a finalized CallLog entry and urgent Alert if applicable.
    """
    # 1. Sector isolation & package verification
    pkg = get_sector_package(payload.sector_id)
    if not pkg:
        raise HTTPException(status_code=404, detail="Sector package not found.")

    slots = payload.slots

    # Derive customer name & phone across sectors
    customer_name = (
        slots.get("citizen_name")
        or slots.get("patient_name")
        or slots.get("guest_name")
        or "Valued Caller"
    )
    phone = slots.get("phone", "0000000000")

    # 2. Idempotency Check: check if this session already generated a confirmed booking
    existing = db.query(Booking).filter(
        Booking.sector_id == payload.sector_id,
        Booking.customer_name == customer_name,
        Booking.phone == phone,
        Booking.notes.like(f"%Session:{payload.session_id}%")
    ).first()

    if existing:
        return serialize_booking(existing)

    # 3. Conflict Detection
    conflict_res = check_booking_conflict(db, payload.sector_id, slots)
    if conflict_res and getattr(conflict_res, "has_conflict", False):
        raise HTTPException(
            status_code=409,
            detail=f"{conflict_res.conflict_message} Suggest selecting an alternate slot."
        )

    # 4. Generate reference number & save transactional booking
    ref_num = generate_reference_number(db, payload.sector_id)
    new_booking = Booking(
        sector_id=payload.sector_id,
        reference_number=ref_num,
        customer_name=customer_name,
        phone=phone,
        status="confirmed",
        details_json=json.dumps(slots, ensure_ascii=False),
        notes=f"{payload.notes or ''} [Session:{payload.session_id}]".strip(),
    )
    db.add(new_booking)

    # 5. Save or update CallLog
    sess = db.query(CallSession).filter(CallSession.id == payload.session_id).first()
    history = json.loads(sess.history_json) if sess and sess.history_json else []

    # Run heuristic insights
    insights = generate_call_summary_heuristic(
        sector_id=payload.sector_id,
        slots=slots,
        outcome="booked",
        turns=history,
    )

    # Urgent case triage check
    full_text = " ".join([t.get("text", "") for t in history])
    is_urgent, matched_kw, _ = check_urgent_case(full_text, pkg.urgent_keywords)

    call_log = CallLog(
        sector_id=payload.sector_id,
        caller_phone=phone,
        outcome="urgent" if is_urgent else "booked",
        duration_seconds=len(history) * 6,
        transcript_turns_json=json.dumps(history, ensure_ascii=False),
        extracted_details_json=json.dumps(insights, ensure_ascii=False),
        sentiment=insights["sentiment"],
        urgent_flag=is_urgent,
    )
    db.add(call_log)
    db.flush()

    if is_urgent:
        alert = Alert(
            call_id=call_log.id,
            sector_id=payload.sector_id,
            phone=phone,
            matched_keyword=matched_kw or "urgent",
            snippet=history[-1]["text"] if history else "Emergency detected during voice booking.",
            severity="critical",
            reason=f"Emergency symptom detected: {matched_kw}",
            status="new",
        )
        db.add(alert)

    db.commit()
    db.refresh(new_booking)
    return serialize_booking(new_booking)


@router.get("", response_model=List[BookingResponse])
def list_bookings(
    search: Optional[str] = Query(None, description="Search by name, phone, or ref number"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List bookings strictly isolated to the authenticated user's assigned sector.
    Super admin can view all or specific sectors.
    """
    query = db.query(Booking)

    # Sector Data Isolation
    if current_user.role != "admin":
        query = query.filter(Booking.sector_id == current_user.sector_id)

    if status_filter and status_filter.lower() != "all":
        query = query.filter(Booking.status == status_filter.lower())

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Booking.customer_name.ilike(search_term),
                Booking.phone.ilike(search_term),
                Booking.reference_number.ilike(search_term),
                Booking.notes.ilike(search_term),
            )
        )

    # Order newest first
    bookings = query.order_by(Booking.created_at.desc()).all()
    return [serialize_booking(b) for b in bookings]


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new booking/request in the authenticated sector.
    Validates required slots and executes conflict detection where applicable.
    """
    target_sector_id = current_user.sector_id

    # Validate required slots against SectorPackage definition
    pkg = get_sector_package(target_sector_id)
    if pkg:
        missing_slots = []
        for slot in pkg.slots:
            if slot.required:
                val = payload.details.get(slot.name)
                # Customer name and phone might be passed at top-level or in details
                if slot.name in ("citizen_name", "patient_name", "owner_name", "guest_name", "customer_name", "student_name"):
                    val = val or payload.customer_name
                elif slot.name == "phone":
                    val = val or payload.phone

                if val is None or str(val).strip() == "":
                    missing_slots.append(f"{slot.label_en} ({slot.label_ta})")

        if missing_slots:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Missing required details: {', '.join(missing_slots)}"
            )

    # Conflict detection
    conflict_err = check_booking_conflict(db, target_sector_id, payload.details)
    if conflict_err:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=conflict_err
        )

    ref_num = generate_reference_number(db, target_sector_id)

    new_booking = Booking(
        sector_id=target_sector_id,
        reference_number=ref_num,
        customer_name=payload.customer_name.strip(),
        phone=payload.phone.strip(),
        status="confirmed",
        details_json=json.dumps(payload.details, ensure_ascii=False),
        notes=payload.notes,
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return serialize_booking(new_booking)


@router.post("/check-conflict", response_model=ConflictCheckResponse)
def check_conflict(
    details: Dict[str, Any],
    exclude_booking_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Pre-flight conflict check endpoint so the UI can warn the user before submitting.
    """
    conflict_err = check_booking_conflict(
        db,
        current_user.sector_id,
        details,
        exclude_booking_id=exclude_booking_id,
    )
    if conflict_err:
        return ConflictCheckResponse(has_conflict=True, conflict_message=conflict_err)
    return ConflictCheckResponse(has_conflict=False)


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get single booking details while enforcing sector data isolation."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking record not found.")

    if current_user.role != "admin" and booking.sector_id != current_user.sector_id:
        raise HTTPException(status_code=403, detail="Access denied: Booking belongs to another sector.")

    return serialize_booking(booking)


@router.put("/{booking_id}", response_model=BookingResponse)
def update_booking(
    booking_id: int,
    payload: BookingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a booking record while enforcing sector isolation and conflict checking."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking record not found.")

    if current_user.role != "admin" and booking.sector_id != current_user.sector_id:
        raise HTTPException(status_code=403, detail="Access denied: Cannot edit booking of another sector.")

    # If details updated, check for slot conflicts
    if payload.details is not None:
        conflict_err = check_booking_conflict(
            db,
            booking.sector_id,
            payload.details,
            exclude_booking_id=booking.id,
        )
        if conflict_err:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=conflict_err)
        booking.details_json = json.dumps(payload.details, ensure_ascii=False)

    if payload.customer_name is not None:
        booking.customer_name = payload.customer_name.strip()
    if payload.phone is not None:
        booking.phone = payload.phone.strip()
    if payload.status is not None:
        booking.status = payload.status.lower().strip()
    if payload.notes is not None:
        booking.notes = payload.notes

    db.commit()
    db.refresh(booking)
    return serialize_booking(booking)


@router.delete("/{booking_id}")
def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel a booking by marking status as cancelled (soft delete) with sector isolation."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking record not found.")

    if current_user.role != "admin" and booking.sector_id != current_user.sector_id:
        raise HTTPException(status_code=403, detail="Access denied: Cannot cancel booking of another sector.")

    booking.status = "cancelled"
    db.commit()
    return {"message": f"Booking {booking.reference_number} cancelled successfully.", "success": True}

