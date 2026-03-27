import datetime as dt

from fastapi import APIRouter, Depends, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.dependencies import get_csrf_token, get_db, require_admin, set_csrf_cookie, validate_csrf
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.reservation import Reservation
from app.models.user import User
from app.templating import templates

router = APIRouter(prefix="/admin", tags=["admin"])


# --- Dashboard ---

@router.get("", response_class=HTMLResponse)
def dashboard(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    today = dt.date.today()
    total_users = db.query(func.count(User.id)).scalar()
    today_reservations = db.query(func.count(Reservation.id)).filter(
        Reservation.pickup_date == today, Reservation.status == "confirmed"
    ).scalar()
    total_revenue = db.query(func.sum(Reservation.total_price)).filter(
        Reservation.status == "confirmed"
    ).scalar() or 0

    recent = (
        db.query(Reservation)
        .order_by(Reservation.created_at.desc())
        .limit(10)
        .all()
    )

    return templates.TemplateResponse(request, "admin/dashboard.html", context={
        "user": user,
        "total_users": total_users,
        "today_reservations": today_reservations,
        "total_revenue": total_revenue,
        "recent_reservations": recent,
    })


# --- Products CRUD ---

@router.get("/products", response_class=HTMLResponse)
def list_products(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    products = db.query(Product).order_by(Product.id).all()
    return templates.TemplateResponse(request, "admin/products.html", context={
        "user": user, "products": products,
    })


@router.get("/products/new", response_class=HTMLResponse)
def new_product_form(
    request: Request,
    user: User = Depends(require_admin),
):
    csrf = get_csrf_token(request)
    response = templates.TemplateResponse(request, "admin/product_form.html", context={
        "user": user, "csrf_token": csrf,
        "product": None, "error": None,
    })
    set_csrf_cookie(response, csrf)
    return response


@router.post("/products/new", response_class=HTMLResponse)
def create_product(
    request: Request,
    name: str = Form(...),
    description: str = Form(""),
    price: float = Form(...),
    csrf_token: str = Form(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    validate_csrf(request, csrf_token)
    product = Product(name=name, description=description, price=price)
    db.add(product)
    db.commit()
    return RedirectResponse("/admin/products", status_code=303)


@router.get("/products/{product_id}/edit", response_class=HTMLResponse)
def edit_product_form(
    request: Request,
    product_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    product = db.query(Product).filter_by(id=product_id).first()
    if not product:
        raise HTTPException(404)
    csrf = get_csrf_token(request)
    response = templates.TemplateResponse(request, "admin/product_form.html", context={
        "user": user, "csrf_token": csrf,
        "product": product, "error": None,
    })
    set_csrf_cookie(response, csrf)
    return response


@router.post("/products/{product_id}/edit", response_class=HTMLResponse)
def update_product(
    request: Request,
    product_id: int,
    name: str = Form(...),
    description: str = Form(""),
    price: float = Form(...),
    is_active: bool = Form(False),
    csrf_token: str = Form(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    validate_csrf(request, csrf_token)
    product = db.query(Product).filter_by(id=product_id).first()
    if not product:
        raise HTTPException(404)
    product.name = name
    product.description = description
    product.price = price
    product.is_active = is_active
    db.commit()
    return RedirectResponse("/admin/products", status_code=303)


# --- Reservations ---

@router.get("/reservations", response_class=HTMLResponse)
def admin_reservations(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    reservations = (
        db.query(Reservation)
        .order_by(Reservation.created_at.desc())
        .all()
    )
    return templates.TemplateResponse(request, "admin/reservations.html", context={
        "user": user, "reservations": reservations,
    })


# --- Inventory ---

@router.get("/inventory", response_class=HTMLResponse)
def inventory_page(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    products = db.query(Product).filter_by(is_active=True).order_by(Product.id).all()
    today = dt.date.today()
    dates = [today + dt.timedelta(days=i) for i in range(7)]

    grid = {}
    for product in products:
        grid[product.id] = {}
        for date in dates:
            inv = db.query(Inventory).filter_by(product_id=product.id, date=date).first()
            grid[product.id][str(date)] = inv

    csrf = get_csrf_token(request)
    response = templates.TemplateResponse(request, "admin/inventory.html", context={
        "user": user, "csrf_token": csrf,
        "products": products, "dates": dates, "grid": grid,
    })
    set_csrf_cookie(response, csrf)
    return response


@router.post("/inventory", response_class=HTMLResponse)
def update_inventory(
    request: Request,
    product_id: int = Form(...),
    date: str = Form(...),
    total_quantity: int = Form(...),
    csrf_token: str = Form(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    validate_csrf(request, csrf_token)
    inv_date = dt.date.fromisoformat(date)
    inv = db.query(Inventory).filter_by(product_id=product_id, date=inv_date).first()
    if inv:
        inv.total_quantity = total_quantity
    else:
        inv = Inventory(product_id=product_id, date=inv_date, total_quantity=total_quantity)
        db.add(inv)
    db.commit()
    return RedirectResponse("/admin/inventory", status_code=303)
