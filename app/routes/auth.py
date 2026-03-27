from fastapi import APIRouter, Depends, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session

from app.dependencies import (
    get_csrf_token,
    get_db,
    set_csrf_cookie,
    validate_csrf,
    SESSION_COOKIE,
)
from app.templating import templates
from app.security import create_session_token
from app.services.auth_service import authenticate_user, create_user, get_user_by_email

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    csrf = get_csrf_token(request)
    response = templates.TemplateResponse(request, "auth/login.html", context={
        "csrf_token": csrf, "error": None,
    })
    set_csrf_cookie(response, csrf)
    return response


@router.post("/login", response_class=HTMLResponse)
def login(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    csrf_token: str = Form(...),
    db: Session = Depends(get_db),
):
    validate_csrf(request, csrf_token)
    user = authenticate_user(db, email, password)
    if not user:
        csrf = get_csrf_token(request)
        response = templates.TemplateResponse(request, "auth/login.html", context={
            "csrf_token": csrf, "error": "メールアドレスまたはパスワードが正しくありません",
        })
        set_csrf_cookie(response, csrf)
        return response
    token = create_session_token(user.id, user.is_admin)
    response = RedirectResponse("/", status_code=303)
    response.set_cookie(SESSION_COOKIE, token, httponly=True, samesite="lax")
    return response


@router.get("/register", response_class=HTMLResponse)
def register_page(request: Request):
    csrf = get_csrf_token(request)
    response = templates.TemplateResponse(request, "auth/register.html", context={
        "csrf_token": csrf, "error": None,
    })
    set_csrf_cookie(response, csrf)
    return response


@router.post("/register", response_class=HTMLResponse)
def register(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    name: str = Form(...),
    csrf_token: str = Form(...),
    db: Session = Depends(get_db),
):
    validate_csrf(request, csrf_token)

    if len(password) < 8:
        csrf = get_csrf_token(request)
        response = templates.TemplateResponse(request, "auth/register.html", context={
            "csrf_token": csrf,
            "error": "パスワードは8文字以上にしてください",
        })
        set_csrf_cookie(response, csrf)
        return response

    if get_user_by_email(db, email):
        csrf = get_csrf_token(request)
        response = templates.TemplateResponse(request, "auth/register.html", context={
            "csrf_token": csrf,
            "error": "このメールアドレスは既に登録されています",
        })
        set_csrf_cookie(response, csrf)
        return response

    user = create_user(db, email, password, name)
    token = create_session_token(user.id, user.is_admin)
    response = RedirectResponse("/", status_code=303)
    response.set_cookie(SESSION_COOKIE, token, httponly=True, samesite="lax")
    return response


@router.post("/logout")
def logout():
    response = RedirectResponse("/auth/login", status_code=303)
    response.delete_cookie(SESSION_COOKIE)
    return response
