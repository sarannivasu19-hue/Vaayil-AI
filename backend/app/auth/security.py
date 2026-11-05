import os
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from app.config import settings


def hash_password(password: str) -> str:
    """
    Cryptographically secure password hash using PBKDF2-HMAC-SHA256 with random salt.
    Guaranteed native compatibility with Python 3.13+ on Windows without external C libraries.
    """
    salt = os.urandom(16).hex()
    iterations = 100_000
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        iterations
    )
    return f"pbkdf2:sha256:{iterations}${salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against stored PBKDF2-HMAC hash."""
    try:
        parts = hashed_password.split("$")
        if len(parts) != 3:
            return False
        algo_part, salt, stored_key = parts
        iterations = int(algo_part.split(":")[-1])
        calculated_key = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt.encode('utf-8'),
            iterations
        )
        return hmac.compare_digest(calculated_key.hex(), stored_key)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed JWT access token containing subject and payload claims."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": now,
        "iss": "vaayil-ai"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decodes and validates a JWT token. Returns None if invalid or expired."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            issuer="vaayil-ai"
        )
        return payload
    except jwt.PyJWTError:
        return None

