"""Password hashing, session cookie signing, and CSRF token management."""

import secrets

import bcrypt
from itsdangerous import BadSignature, URLSafeTimedSerializer

from app.config import settings

_serializer = URLSafeTimedSerializer(settings.secret_key)
_SESSION_SALT = "session"
_SESSION_MAX_AGE = 86400  # 24 hours


# --- Password ---

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# --- Session cookie ---

def create_session_token(user_id: int, is_admin: bool) -> str:
    return _serializer.dumps({"user_id": user_id, "is_admin": is_admin}, salt=_SESSION_SALT)


def read_session_token(token: str) -> dict | None:
    try:
        return _serializer.loads(token, salt=_SESSION_SALT, max_age=_SESSION_MAX_AGE)
    except BadSignature:
        return None


# --- CSRF ---

def generate_csrf_token() -> str:
    return secrets.token_hex(32)
