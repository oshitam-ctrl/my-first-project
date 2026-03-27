import datetime as dt

from sqlalchemy.orm import Session

from app.models.inventory import Inventory


def check_availability(db: Session, product_id: int, date: dt.date, quantity: int) -> bool:
    inv = db.query(Inventory).filter_by(product_id=product_id, date=date).first()
    if not inv:
        return False
    return inv.available_quantity >= quantity


def decrement_stock(db: Session, product_id: int, date: dt.date, quantity: int) -> None:
    inv = db.query(Inventory).filter_by(product_id=product_id, date=date).first()
    if not inv or inv.available_quantity < quantity:
        raise ValueError("在庫が不足しています")
    inv.reserved_quantity += quantity


def restore_stock(db: Session, product_id: int, date: dt.date, quantity: int) -> None:
    inv = db.query(Inventory).filter_by(product_id=product_id, date=date).first()
    if inv:
        inv.reserved_quantity = max(0, inv.reserved_quantity - quantity)
