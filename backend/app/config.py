from typing import List
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Determine backend base directory (where config.py lives is backend/app/config.py)
BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_FILE_PATH = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables or .env file.
    Follows 12-factor app principles. Secrets stay in environment variables.
    """
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE_PATH),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Project metadata
    PROJECT_NAME: str = "Vaayil AI"
    PROJECT_TAGLINE: str = "Every business. One voice at the door."
    VERSION: str = "1.0.0"

    # Gnani.ai API Configuration
    GNANI_API_KEY: str = ""
    GNANI_API_BASE_URL: str = "https://api.vachana.ai"
    GNANI_STT_MODEL: str = "prisma-v3.0"
    GNANI_TTS_MODEL: str = "timbre-v3.0"
    GNANI_TTS_VOICE: str = "Shivani"

    # Authentication & Security
    JWT_SECRET: str = "vaayil_ai_super_secret_jwt_key_2026_internship_demo"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Database
    DATABASE_URL: str = "sqlite:///./vaayil.db"

    # Environment & CORS
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_gnani_configured(self) -> bool:
        """Returns True only if a real Gnani API key is configured."""
        if not self.GNANI_API_KEY:
            return False
        clean = self.GNANI_API_KEY.strip().lower()
        return len(clean) > 8 and "your_gnani" not in clean


settings = Settings()

