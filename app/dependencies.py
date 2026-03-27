"""FastAPI dependencies: DB session, auth, CSRF."""

from typing import Generator

from fastapi import Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.security import generate_csrf_token, read_session_token

SESSION_COOKIE = "session"
CSRF_COOKIE = "csrf_token"


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User | None:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return None
    data = read_session_token(token)
    if not data:
        return None
    return db.query(User).filter_by(id=data["user_id"]).first()


def require_login(request: Request, user: User | None = Depends(get_current_user)) -> User:
    if user is None:
        from fastapi.responses import RedirectResponse
        raise HTTPException(status_code=303, detail="Login required",
                            headers={"Location": "/auth/login"})
    return user


def require_admin(user: User = Depends(require_login)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def get_csrf_token(request: Request) -> str:
    token = request.cookies.get(CSRF_COOKIE)
    if not token:
        token = generate_csrf_token()
    return token


def set_csrf_cookie(response: Response, token: str) -> None:
    response.set_cookie(CSRF_COOKIE, token, httponly=True, samesite="lax")


def validate_csrf(request: Request, form_token: str) -> None:
    cookie_token = request.cookies.get(CSRF_COOKIE)
    if not cookie_token or cookie_token != form_token:
        raise HTTPException(status_code=403, detail="CSRF token mismatch")
