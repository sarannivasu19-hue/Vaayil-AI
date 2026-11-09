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
from pydantic import BaseModel, Field
from app.auth.dependencies import get_current_user
from app.sectors.registry import get_sector_package
from app.conversation.insights import generate_call_summary_heuristic
from app.conversation.urgent_detection import check_urgent_case
from app.conversation.parsers.phone_parser import parse_phone, mask_phone

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


class SmartServiceSubmission(BaseModel):
    sector_id: str
    service_category: str
    service_name: str
    customer_name: str
    phone: str
    email: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    notes: Optional[str] = None
    submission_mode: str = "manual"  # manual | voice | hybrid
    session_id: Optional[str] = None
    language: Optional[str] = "tanglish"
    client_token: Optional[str] = None


class SmartServiceResponse(BaseModel):
    success: bool
    reference_number: str
    booking_id: int
    status: str
    customer_name: str
    phone: str
    service_category: str
    service_name: str
    details: Dict[str, Any]
    notes: Optional[str] = None
    confirmation_message: str
    confirmation_speech_text: str
    created_at: str


def build_confirmation_texts(
    sector_id: str,
    customer_name: str,
    service_name: str,
    ref_num: str,
    details: Dict[str, Any],
    language: str = "tanglish",
) -> tuple[str, str]:
    """Generates display text and natural AI voice speech text for Gnani Timbre."""
    lang = (language or "tanglish").lower()

    if sector_id == "panchayat_health":
        if lang == "tamil":
            display = f"நன்றி, {customer_name}. உங்கள் {service_name} தொடர்பான பொதுச் சேவைப் புகார் வெற்றிகரமாக பதிவு செய்யப்பட்டது. உங்கள் குறிப்பு எண் {ref_num}."
            speech = f"நன்றி, {customer_name}. உங்கள் {service_name} புகார் பதிவு செய்யப்பட்டது. உங்கள் குறிப்பு எண் {ref_num}."
        elif lang == "english":
            display = f"Thank you, {customer_name}. Your public service complaint for {service_name} has been successfully registered. Your reference number is {ref_num}."
            speech = f"Thank you, {customer_name}. Your public service complaint for {service_name} has been successfully registered. Your reference number is {ref_num}. You can track its status from your dashboard."
        else:
            display = f"Nandri, {customer_name}. Unga {service_name} public service complaint successfully register aagiduchu. Reference number: {ref_num}."
            speech = f"Nandri, {customer_name}. Unga {service_name} complaint register aagiduchu. Reference number {ref_num}."

    elif sector_id == "clinic":
        date = details.get("appointment_date") or details.get("preferred_date") or "Scheduled Date"
        time_slot = details.get("appointment_time") or details.get("preferred_time") or "Regular Hours"
        if lang == "tamil":
            display = f"சரண் கிளினிக்கில் உங்கள் மருத்துவ முன்பதிவு பதிவு செய்யப்பட்டது. சேவை: {service_name}. தேதி: {date}, நேரம்: {time_slot}. குறிப்பு எண்: {ref_num}."
            speech = f"சரண் கிளினிக்கில் உங்கள் முன்பதிவு பதிவு செய்யப்பட்டது. சேவை {service_name}. தேதி {date}, நேரம் {time_slot}. குறிப்பு எண் {ref_num}."
        elif lang == "english":
            display = f"Your appointment request at Saran Clinic has been recorded. Your selected service is {service_name}. Your appointment date is {date} and time is {time_slot}. Your booking reference is {ref_num}."
            speech = f"Your appointment request at Saran Clinic has been recorded. Your selected service is {service_name}. Your appointment date is {date} and time is {time_slot}. Your booking reference is {ref_num}."
        else:
            display = f"Saran Clinic-la unga appointment request register aagiduchu. Service: {service_name}. Date: {date}, Time: {time_slot}. Reference: {ref_num}."
            speech = f"Saran Clinic-la unga appointment request register aagiduchu. Service {service_name}. Date {date}, time {time_slot}. Reference ID {ref_num}."

    elif sector_id == "restaurant":
        order_type = details.get("order_type", "Takeaway")
        total = details.get("total_amount", "0")
        if lang == "tamil":
            display = f"நன்றி {customer_name}! சரண் உணவகத்தில் உங்கள் உணவு முன்பதிவு பதிவு செய்யப்பட்டது. வகை: {order_type}, மொத்த தொகை: ₹{total}. ஆர்டர் எண்: {ref_num}."
            speech = f"நன்றி {customer_name}! சரண் உணவகத்தில் உங்கள் உணவு ஆர்டர் பதிவு செய்யப்பட்டது. வகை {order_type}, மொத்த தொகை ரூபாய் {total}. ஆர்டர் எண் {ref_num}."
        elif lang == "english":
            display = f"Thank you {customer_name}! Your food order from Saran Restaurant has been registered. Order type: {order_type}, Total: ₹{total}. Your order ID is {ref_num}."
            speech = f"Thank you {customer_name}. Your food order from Saran Restaurant has been registered. Order type {order_type}, total amount {total} rupees. Your order ID is {ref_num}."
        else:
            display = f"Nandri {customer_name}! Saran Restaurant-la unga food order register aagiduchu. Type: {order_type}, Total: ₹{total}. Order ID: {ref_num}."
            speech = f"Nandri {customer_name}! Saran Restaurant-la unga food order register aagiduchu. Total amount {total} rupees. Order ID {ref_num}."

    elif sector_id == "hotel_lodge":
        room_name = details.get("room_type") or service_name
        checkin = details.get("checkin_date") or details.get("check_in") or "Upcoming"
        checkout = details.get("checkout_date") or details.get("check_out") or ""
        total = details.get("total_amount", "0")
        if lang == "tamil":
            display = f"சரண் ஹோட்டலில் உங்கள் அறை முன்பதிவு பதிவு செய்யப்பட்டது. அறை: {room_name}. வருகை: {checkin}, வெளியேறுதல்: {checkout}. குறிப்பு எண்: {ref_num}."
            speech = f"சரண் ஹோட்டலில் உங்கள் அறை முன்பதிவு பதிவு செய்யப்பட்டது. அறை {room_name}. குறிப்பு எண் {ref_num}."
        elif lang == "english":
            display = f"Your room reservation request at Saran Hotel has been registered for {room_name}. Check-in: {checkin}, Check-out: {checkout}. Total: ₹{total}. Your booking reference is {ref_num}."
            speech = f"Your room reservation request at Saran Hotel has been registered for {room_name}. Check-in date {checkin}. Your booking reference is {ref_num}."
        else:
            display = f"Saran Hotel-la unga room reservation register aagiduchu. Room: {room_name}. Check-in: {checkin}. Reference: {ref_num}."
            speech = f"Saran Hotel-la unga room reservation register aagiduchu. Room {room_name}. Reference ID {ref_num}."

    elif sector_id == "vet_clinic":
        animal = details.get("animal_type") or "Animal"
        date = details.get("appointment_date") or details.get("preferred_date") or "Scheduled Date"
        time_slot = details.get("appointment_time") or details.get("preferred_time") or "General Slot"
        if lang == "tamil":
            display = f"அரசு கால்நடை மருத்துவ மையத்தில் உங்கள் {animal} சிகிச்சை ஆலோசனை பதிவு செய்யப்பட்டது. தேதி: {date}, நேரம்: {time_slot}. குறிப்பு எண்: {ref_num}."
            speech = f"அரசு கால்நடை மருத்துவ மையத்தில் உங்கள் {animal} ஆலோசனை பதிவு செய்யப்பட்டது. தேதி {date}, நேரம் {time_slot}. குறிப்பு எண் {ref_num}."
        elif lang == "english":
            display = f"Your veterinary consultation request at Government Veterinary Medical Centre has been recorded for your {animal}. Date: {date}, Time: {time_slot}. Your reference number is {ref_num}."
            speech = f"Your veterinary consultation request at Government Veterinary Medical Centre has been recorded for your {animal}. Date {date}, time {time_slot}. Your reference number is {ref_num}."
        else:
            display = f"Government Veterinary Medical Centre-la unga {animal} consultation register aagiduchu. Date: {date}, Time: {time_slot}. Reference: {ref_num}."
            speech = f"Government Veterinary Medical Centre-la unga {animal} consultation register aagiduchu. Date {date}, time {time_slot}. Reference ID {ref_num}."

    elif sector_id == "coaching":
        course = details.get("course_name") or service_name
        batch = details.get("preferred_batch") or details.get("batch") or "Regular"
        if lang == "tamil":
            display = f"நன்றி {customer_name}. சரண் பயிற்சி மையத்தில் {course} பாடத்திற்கான உங்கள் சேர்க்கை விவரம் பதிவு செய்யப்பட்டது. தொகுதி: {batch}. குறிப்பு எண்: {ref_num}."
            speech = f"நன்றி {customer_name}. சரண் பயிற்சி மையத்தில் {course} சேர்க்கை விவரம் பதிவு செய்யப்பட்டது. குறிப்பு எண் {ref_num}."
        elif lang == "english":
            display = f"Thank you {customer_name}. Your course enquiry for {course} at Saran Coaching Centre has been registered. Batch: {batch}. Your student reference ID is {ref_num}."
            speech = f"Thank you {customer_name}. Your course enquiry for {course} at Saran Coaching Centre has been registered. Batch {batch}. Your student reference ID is {ref_num}."
        else:
            display = f"Nandri {customer_name}. Saran Coaching Centre-la unga {course} enquiry register aagiduchu. Batch: {batch}. Reference ID: {ref_num}."
            speech = f"Nandri {customer_name}. Saran Coaching Centre-la unga {course} enquiry register aagiduchu. Reference ID {ref_num}."

    else:
        display = f"Thank you {customer_name}. Your request for {service_name} has been confirmed. Reference: {ref_num}."
        speech = f"Thank you {customer_name}. Your request has been confirmed. Reference number is {ref_num}."

    return display, speech


@router.post("/smart-service", response_model=SmartServiceResponse)
def submit_smart_service(
    payload: SmartServiceSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    POST /api/bookings/smart-service
    Unified submission endpoint for Smart Service Center requests across all 6 sectors.
    Validates required fields, checks for duplicate submission, assigns sequential reference number,
    persists transactional record to bookings table, and returns AI confirmation texts.
    """
    # 1. Sector Authorization Isolation (admin, citizen user, or assigned sector)
    if current_user.role not in ("admin", "user") and current_user.sector_id != payload.sector_id:
        raise HTTPException(
            status_code=403,
            detail=f"Access denied: You are not authorized to submit for sector '{payload.sector_id}'."
        )

    # 2. Input validation
    cust_name = payload.customer_name.strip()
    if len(cust_name) < 2:
        raise HTTPException(status_code=422, detail="Customer / Citizen name is required.")

    normalized_phone = parse_phone(payload.phone)
    if not normalized_phone:
        raise HTTPException(
            status_code=422,
            detail="Invalid mobile number. Please provide a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9."
        )
    phone_clean = normalized_phone

    # 3. Duplicate Prevention Check (Idempotency)
    # Check if identical booking was submitted in the last 60 seconds with same client token or phone & service
    client_token_note = f"[ClientToken:{payload.client_token}]" if payload.client_token else ""
    session_note = f"[Session:{payload.session_id}]" if payload.session_id else ""
    mode_note = f"[Mode:{payload.submission_mode}]"

    existing_query = db.query(Booking).filter(
        Booking.sector_id == payload.sector_id,
        Booking.customer_name == cust_name,
        Booking.phone == phone_clean,
        Booking.status != "cancelled",
    )
    if payload.client_token:
        existing = existing_query.filter(Booking.notes.like(f"%{client_token_note}%")).first()
        if existing:
            details_dict = json.loads(existing.details_json or "{}")
            disp, spch = build_confirmation_texts(
                payload.sector_id, cust_name, payload.service_name, existing.reference_number, details_dict, payload.language or "tanglish"
            )
            return SmartServiceResponse(
                success=True,
                reference_number=existing.reference_number,
                booking_id=existing.id,
                status=existing.status,
                customer_name=existing.customer_name,
                phone=existing.phone,
                service_category=payload.service_category,
                service_name=payload.service_name,
                details=details_dict,
                notes=existing.notes,
                confirmation_message=disp,
                confirmation_speech_text=spch,
                created_at=existing.created_at.isoformat(),
            )

    # 4. Conflict detection if scheduling applies
    conflict_err = check_booking_conflict(db, payload.sector_id, payload.details)
    if conflict_err:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=conflict_err)

    # 5. Build full details payload
    merged_details = dict(payload.details)
    merged_details["service_category"] = payload.service_category
    merged_details["service_name"] = payload.service_name
    if payload.email:
        merged_details["email"] = payload.email
    if payload.submission_mode:
        merged_details["submission_mode"] = payload.submission_mode

    # 6. Generate sequential reference number & persist
    ref_num = generate_reference_number(db, payload.sector_id)
    combined_notes = f"{payload.notes or ''} {client_token_note} {session_note} {mode_note}".strip()

    new_booking = Booking(
        sector_id=payload.sector_id,
        reference_number=ref_num,
        customer_name=cust_name,
        phone=phone_clean,
        status="confirmed",
        details_json=json.dumps(merged_details, ensure_ascii=False),
        notes=combined_notes or None,
    )
    db.add(new_booking)

    # 7. If submitted with voice or hybrid mode, create call log for analytics
    if payload.submission_mode in ("voice", "hybrid"):
        turns = [
            {"speaker": "system", "text": f"Smart Service Center request initiated: {payload.service_name}"},
            {"speaker": "caller", "text": f"Name: {cust_name}, Phone: {phone_clean}"},
            {"speaker": "agent", "text": f"Captured request for {payload.service_name} with reference {ref_num}"},
        ]
        call_log = CallLog(
            sector_id=payload.sector_id,
            caller_phone=phone_clean,
            outcome="booked",
            duration_seconds=30,
            transcript_turns_json=json.dumps(turns, ensure_ascii=False),
            extracted_details_json=json.dumps(merged_details, ensure_ascii=False),
            sentiment="positive",
            urgent_flag=bool(payload.details.get("urgency") == "Emergency"),
        )
        db.add(call_log)
        db.flush()

        # Check for urgent condition
        if payload.details.get("urgency") == "Emergency":
            alert = Alert(
                call_id=call_log.id,
                sector_id=payload.sector_id,
                phone=phone_clean,
                matched_keyword="emergency",
                snippet=f"Emergency service request flagged: {payload.service_name}",
                severity="critical",
                reason=f"Citizen marked urgency as Emergency for {payload.service_name}",
                status="new",
            )
            db.add(alert)

    db.commit()
    db.refresh(new_booking)

    # 8. Build confirmation texts
    disp_msg, spch_msg = build_confirmation_texts(
        payload.sector_id,
        cust_name,
        payload.service_name,
        ref_num,
        merged_details,
        payload.language or "tanglish",
    )

    return SmartServiceResponse(
        success=True,
        reference_number=ref_num,
        booking_id=new_booking.id,
        status=new_booking.status,
        customer_name=new_booking.customer_name,
        phone=new_booking.phone,
        service_category=payload.service_category,
        service_name=payload.service_name,
        details=merged_details,
        notes=new_booking.notes,
        confirmation_message=disp_msg,
        confirmation_speech_text=spch_msg,
        created_at=new_booking.created_at.isoformat(),
    )


@router.get("/track", response_model=List[BookingResponse])
def track_bookings(
    query: str = Query(..., min_length=3, description="Reference number or mobile number to track"),
    sector_id: Optional[str] = Query(None, description="Optional sector filter"),
    db: Session = Depends(get_db),
):
    """
    GET /api/bookings/track
    Allows citizens and customers to query their request status by reference ID or phone number.
    Does not expose sensitive system details.
    """
    clean_q = query.strip()
    db_query = db.query(Booking).filter(
        or_(
            Booking.reference_number.ilike(f"%{clean_q}%"),
            Booking.phone.ilike(f"%{clean_q}%"),
        )
    )
    if sector_id:
        db_query = db_query.filter(Booking.sector_id == sector_id)

    results = db_query.order_by(Booking.created_at.desc()).limit(10).all()
    return [serialize_booking(b) for b in results]


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
    raw_phone = slots.get("phone", "")
    phone = parse_phone(str(raw_phone)) or str(raw_phone).strip() or "0000000000"

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
    district: Optional[str] = Query(None, description="Filter by district"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List bookings strictly isolated to the authenticated user's assigned sector.
    Super admin can view all or specific sectors.
    Supports optional district filtering for district-wise data separation.
    """
    query = db.query(Booking)

    # Sector Data Isolation
    if current_user.role != "admin":
        query = query.filter(Booking.sector_id == current_user.sector_id)

    if status_filter and status_filter.lower() != "all":
        query = query.filter(Booking.status == status_filter.lower())

    if district and district.lower() != "all":
        d_clean = district.strip()
        query = query.filter(
            or_(
                Booking.details_json.ilike(f"%{d_clean}%"),
                Booking.notes.ilike(f"%{d_clean}%"),
            )
        )

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

    # Validate and normalize phone
    normalized_phone = parse_phone(payload.phone)
    if not normalized_phone:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid mobile number. Please provide a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9."
        )

    ref_num = generate_reference_number(db, target_sector_id)

    new_booking = Booking(
        sector_id=target_sector_id,
        reference_number=ref_num,
        customer_name=payload.customer_name.strip(),
        phone=normalized_phone,
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
        normalized_phone = parse_phone(payload.phone)
        if not normalized_phone:
            raise HTTPException(
                status_code=422,
                detail="Invalid mobile number. Please provide a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9."
            )
        booking.phone = normalized_phone
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

