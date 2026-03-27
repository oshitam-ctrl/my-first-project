import datetime as dt

from fastapi import APIRouter, Depends, Form, HTTPException, Query, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session

from app.dependencies import get_csrf_token, get_db, require_login, set_csrf_cookie, validate_csrf
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.reservation import Reservation
from app.models.user import User
from app.services.reservation_service import cancel_reservation, create_reservation, get_user_reservations
from app.templating import templates

router = APIRouter(prefix="/reservations", tags=["reservations"])


@router.get("/new", response_class=HTMLResponse)
def reservation_form(
    request: Request,
    product_id: int | None = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_login),
):
    products = db.query(Product).filter_by(is_active=True).all()
    today = dt.date.today()

    availability = {}
    if product_id:
        for i in range(7):
            date = today + dt.timedelta(days=i)
            inv = db.query(Inventory).filter_by(product_id=product_id, date=date).first()
            availability[str(date)] = inv.available_quantity if inv else 0

    csrf = get_csrf_token(request)
    response = templates.TemplateResponse(request, "reservations/create.html", context={
        "user": user,
        "products": products,
        "selected_product_id": product_id,
        "availability": availability,
        "csrf_token": csrf,
        "min_date": str(today),
        "max_date": str(today + dt.timedelta(days=6)),
        "error": None,
    })
    set_csrf_cookie(response, csrf)
    return response


@router.post("/new", response_class=HTMLResponse)
def create_reservation_handler(
    request: Request,
    product_id: int = Form(...),
    quantity: int = Form(...),
    pickup_date: str = Form(...),
    pickup_time: str = Form(...),
    csrf_token: str = Form(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_login),
):
    validate_csrf(request, csrf_token)

    try:
        date = dt.date.fromisoformat(pickup_date)
    except ValueError:
        raise HTTPException(400, "無効な日付です")

    if date < dt.date.today():
        raise HTTPException(400, "過去の日付は指定できません")

    if quantity < 1:
        raise HTTPException(400, "数量は1以上にしてください")

    try:
        reservation = create_reservation(
            db=db,
            user_id=user.id,
            user_email=user.email,
            pickup_date=date,
            pickup_time=pickup_time,
            items=[{"product_id": product_id, "quantity": quantity}],
        )
    except ValueError as e:
        products = db.query(Product).filter_by(is_active=True).all()
        csrf = get_csrf_token(request)
        response = templates.TemplateResponse(request, "reservations/create.html", context={
            "user": user,
            "products": products,
            "selected_product_id": product_id,
            "availability": {},
            "csrf_token": csrf,
            "min_date": str(dt.date.today()),
            "max_date": str(dt.date.today() + dt.timedelta(days=6)),
            "error": str(e),
        })
        set_csrf_cookie(response, csrf)
        return response

    return RedirectResponse(f"/reservations/{reservation.id}", status_code=303)


@router.get("", response_class=HTMLResponse)
def list_reservations(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_login),
):
    reservations = get_user_reservations(db, user.id)
    return templates.TemplateResponse(request, "reservations/list.html", context={
        "user": user,
        "reservations": reservations,
    })


@router.get("/{reservation_id}", response_class=HTMLResponse)
def reservation_detail(
    request: Request,
    reservation_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_login),
):
    reservation = db.query(Reservation).filter_by(id=reservation_id, user_id=user.id).first()
    if not reservation:
        raise HTTPException(404, "予約が見つかりません")

    csrf = get_csrf_token(request)
    response = templates.TemplateResponse(request, "reservations/detail.html", context={
        "user": user,
        "reservation": reservation,
        "csrf_token": csrf,
    })
    set_csrf_cookie(response, csrf)
    return response


@router.post("/{reservation_id}/cancel")
def cancel_reservation_handler(
    request: Request,
    reservation_id: int,
    csrf_token: str = Form(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_login),
):
    validate_csrf(request, csrf_token)
    reservation = db.query(Reservation).filter_by(id=reservation_id, user_id=user.id).first()
    if not reservation:
        raise HTTPException(404, "予約が見つかりません")

    cancel_reservation(db, reservation, user.email)
    return RedirectResponse(f"/reservations/{reservation_id}", status_code=303)
