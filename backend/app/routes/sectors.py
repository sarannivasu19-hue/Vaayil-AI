from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.sector import Sector
from app.schemas.sector import SectorResponse, SectorDetailResponse
from app.sectors.registry import get_sector_package

router = APIRouter(prefix="/sectors", tags=["Sectors"])


@router.get("", response_model=List[SectorResponse])
def list_sectors(db: Session = Depends(get_db)):
    """
    Returns all registered business sectors with their branding,
    Tamil/English localization strings, and visual accents.
    """
    sectors = db.query(Sector).filter(Sector.is_active == True).all()
    return sectors


@router.get("/{sector_id}", response_model=SectorDetailResponse)
def get_sector_detail(sector_id: str, db: Session = Depends(get_db)):
    """
    Fetch complete sector details including dynamic slot definitions,
    prompts, and scheduling configuration from the sector package.
    """
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sector with ID '{sector_id}' not found."
        )

    pkg = get_sector_package(sector_id)

    return SectorDetailResponse(
        id=sector.id,
        name=sector.name,
        display_name_ta=sector.display_name_ta,
        display_name_en=sector.display_name_en,
        tagline_ta=sector.tagline_ta,
        tagline_en=sector.tagline_en,
        description=sector.description,
        icon=sector.icon,
        accent_color=sector.accent_color,
        secondary_color=sector.secondary_color,
        is_active=sector.is_active,
        created_at=sector.created_at,
        slots=pkg.slots if pkg else [],
        has_scheduling=pkg.has_scheduling if pkg else False,
        schedule_date_key=pkg.schedule_date_key if pkg else None,
        schedule_time_key=pkg.schedule_time_key if pkg else None,
        urgent_keywords=pkg.urgent_keywords if pkg else [],
    )
