import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.booking import Booking
from app.models.call_log import CallLog
from app.models.alert import Alert
from app.models.user import User
from app.schemas.booking import BookingResponse
from app.auth.dependencies import get_current_user
from app.sectors.registry import get_sector_package
from app.routes.bookings import generate_reference_number, serialize_booking

router = APIRouter(prefix="/demo", tags=["Demo Mode"])


@router.post("/load", response_model=List[BookingResponse], status_code=status.HTTP_201_CREATED)
def load_demo_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Demo Mode: Populates the logged-in sector workspace with clearly labelled
    synthetic sample bookings from the sector configuration package.
    Idempotent and safe for demo evaluation.
    """
    sector_id = current_user.sector_id
    pkg = get_sector_package(sector_id)
    if not pkg:
        raise HTTPException(status_code=404, detail=f"Sector package '{sector_id}' not found.")

    if not pkg.sample_bookings:
        raise HTTPException(
            status_code=400,
            detail=f"No synthetic demo data defined for sector package '{sector_id}'."
        )

    # Optional: remove previous synthetic demo entries to prevent cluttering
    db.query(Booking).filter(
        Booking.sector_id == sector_id,
        Booking.notes.ilike("%Synthetic Demo Data%")
    ).delete(synchronize_session=False)
    db.flush()

    created_list = []
    for sample in pkg.sample_bookings:
        ref_num = generate_reference_number(db, sector_id)
        booking = Booking(
            sector_id=sector_id,
            reference_number=ref_num,
            customer_name=sample.customer_name,
            phone=sample.phone,
            status=sample.status,
            details_json=json.dumps(sample.details, ensure_ascii=False),
            notes=sample.notes or f"[Synthetic Demo Data - {pkg.name}]",
        )
        db.add(booking)
        db.flush()
        created_list.append(booking)

    # Also populate synthetic demo call logs and alert for this sector so dashboard and analytics shine
    db.query(CallLog).filter(
        CallLog.sector_id == sector_id,
        CallLog.extracted_details_json.ilike("%Synthetic Demo Data%")
    ).delete(synchronize_session=False)

    for i, sample in enumerate(pkg.sample_bookings):
        call_log = CallLog(
            sector_id=sector_id,
            caller_phone=sample.phone,
            outcome="booked" if i % 2 == 0 else "completed",
            duration_seconds=45 + i * 15,
            transcript_turns_json=json.dumps([
                {"speaker": "caller", "text": f"வணக்கம், {sample.customer_name} பேசுகிறேன்."},
                {"speaker": "agent", "text": "வணக்கம், உங்களுக்கு என்ன உதவி வேண்டும்?"},
                {"speaker": "caller", "text": "விவரங்களை பதிவு செய்ய வேண்டும்."},
                {"speaker": "agent", "text": "சரி, உங்கள் பதிவு வெற்றிகரமாக பெறப்பட்டது."},
            ], ensure_ascii=False),
            extracted_details_json=json.dumps({
                "source": "heuristic",
                "intent": f"{pkg.name} Inquiry (heuristic)",
                "summary": f"[Synthetic Demo Data] Sample interaction for {sample.customer_name}.",
                "sentiment": "positive (heuristic)",
            }, ensure_ascii=False),
            sentiment="positive (heuristic)",
            urgent_flag=False,
        )
        db.add(call_log)

    db.commit()
    return [serialize_booking(b) for b in created_list]


@router.post("/clear")
def clear_demo_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    POST /api/demo/clear
    Removes demo records for the logged-in sector.
    """
    db.query(Booking).filter(
        Booking.sector_id == current_user.sector_id,
        Booking.notes.ilike("%Synthetic Demo Data%")
    ).delete(synchronize_session=False)

    db.query(CallLog).filter(
        CallLog.sector_id == current_user.sector_id,
        CallLog.extracted_details_json.ilike("%Synthetic Demo Data%")
    ).delete(synchronize_session=False)

    db.commit()
    return {"message": "Demo data cleared successfully.", "success": True}

