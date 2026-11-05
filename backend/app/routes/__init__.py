from app.routes.health import router as health_router
from app.routes.auth import router as auth_router
from app.routes.sectors import router as sectors_router
from app.routes.bookings import router as bookings_router
from app.routes.demo import router as demo_router

__all__ = [
    "health_router",
    "auth_router",
    "sectors_router",
    "bookings_router",
    "demo_router",
]
