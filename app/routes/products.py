from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.product import Product
from app.models.user import User
from app.templating import templates

router = APIRouter(tags=["products"])


@router.get("/", response_class=HTMLResponse)
def home(
    request: Request,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    products = db.query(Product).filter_by(is_active=True).all()
    return templates.TemplateResponse(request, "index.html", context={
        "user": user,
        "products": products,
    })
