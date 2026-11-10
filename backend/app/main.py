from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.seed.demo_seed import seed_demo_data
from app.routes.health import router as health_router
from app.routes.auth import router as auth_router
from app.routes.sectors import router as sectors_router
from app.routes.bookings import router as bookings_router
from app.routes.demo import router as demo_router
from app.routes.voice import router as voice_router
from app.routes.agent import router as agent_router
from app.routes.call_logs import router as call_logs_router
from app.routes.analytics import router as analytics_router
from app.routes.settings import router as settings_router
from app.routes.noise_lab import router as noise_lab_router
from app.routes.safety_test import router as safety_test_router
from app.routes.admin import router as admin_router
from app.routes.alerts import router as alerts_router
from app.routes.gmail import router as gmail_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("vaayil-ai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Initializes DB tables and seeds the 6 sectors + demo credentials on startup.
    """
    logger.info("Initializing Vaayil AI Database tables...")
    Base.metadata.create_all(bind=engine)

    logger.info("Seeding sector packages and synthetic demo accounts...")
    db = SessionLocal()
    try:
        seed_demo_data(db)
        logger.info("Database initialized and demo sectors successfully seeded.")
    except Exception as e:
        logger.error(f"Error during startup data seeding: {e}")
        db.rollback()
    finally:
        db.close()

    yield
    logger.info("Shutting down Vaayil AI API server.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Tamil & Tanglish Voice Agent Platform for Local Businesses and Public Services. Gnani AI Challenge.",
    version=settings.VERSION,
    lifespan=lifespan
)

# Configure CORS
# Always include the Render production frontend regardless of env config
ALWAYS_ALLOWED_ORIGINS = [
    "https://vaayil-frontend.onrender.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

origins = settings.cors_origins_list
for origin in ALWAYS_ALLOWED_ORIGINS:
    if origin not in origins:
        origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https://[a-zA-Z0-9-]+\.onrender\.com$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
)

# Register API subrouters with standard /api prefix
app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(sectors_router, prefix="/api")
app.include_router(bookings_router, prefix="/api")
app.include_router(demo_router, prefix="/api")
app.include_router(voice_router, prefix="/api")
app.include_router(agent_router, prefix="/api")
app.include_router(call_logs_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(noise_lab_router, prefix="/api")
app.include_router(safety_test_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(gmail_router, prefix="/api")


@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "tagline": settings.PROJECT_TAGLINE,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_url": "/api/health",
        "sectors_url": "/api/sectors"
    }
