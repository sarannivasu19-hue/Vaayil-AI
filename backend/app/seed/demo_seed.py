from sqlalchemy.orm import Session
from app.models.sector import Sector
from app.models.user import User
from app.auth.security import hash_password
from app.sectors.registry import get_all_sector_packages

DEMO_PASSWORD_RAW = "vaayil123"


def seed_demo_data(db: Session) -> None:
    """
    Seeds initial sectors and synthetic demo users based on dynamically
    discovered Sector Packages in app/sectors/.
    Safe, idempotent, and updates branding or metadata automatically.
    """
    demo_hashed_password = hash_password(DEMO_PASSWORD_RAW)
    packages = get_all_sector_packages()

    for pkg in packages:
        existing_sector = db.query(Sector).filter(Sector.id == pkg.id).first()
        if not existing_sector:
            sector = Sector(
                id=pkg.id,
                name=pkg.name,
                display_name_ta=pkg.display_name_ta,
                display_name_en=pkg.display_name_en,
                tagline_ta=pkg.tagline_ta,
                tagline_en=pkg.tagline_en,
                description=pkg.description,
                icon=pkg.icon,
                accent_color=pkg.accent_color,
                secondary_color=pkg.secondary_color,
                is_active=True
            )
            db.add(sector)
            db.flush()
        else:
            # Keep display strings and branding in sync with package updates
            existing_sector.name = pkg.name
            existing_sector.display_name_ta = pkg.display_name_ta
            existing_sector.display_name_en = pkg.display_name_en
            existing_sector.tagline_ta = pkg.tagline_ta
            existing_sector.tagline_en = pkg.tagline_en
            existing_sector.description = pkg.description
            existing_sector.icon = pkg.icon
            existing_sector.accent_color = pkg.accent_color
            existing_sector.secondary_color = pkg.secondary_color

        user_info = pkg.demo_user
        existing_user = db.query(User).filter(User.username == user_info["username"]).first()
        if not existing_user:
            user = User(
                username=user_info["username"],
                email=user_info["email"],
                full_name=user_info["full_name"],
                hashed_password=demo_hashed_password,
                role=user_info.get("role", "owner"),
                sector_id=pkg.id
            )
            db.add(user)

    db.commit()
