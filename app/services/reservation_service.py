import datetime as dt

from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.reservation import Reservation, ReservationItem
from app.services.email_service import send_reservation_cancellation, send_reservation_confirmation
from app.services.inventory_service import decrement_stock, restore_stock


def create_reservation(
    db: Session,
    user_id: int,
    user_email: str,
    pickup_date: dt.date,
    pickup_time: str,
    items: list[dict],  # [{"product_id": int, "quantity": int}]
) -> Reservation:
    total_price = 0.0
    reservation_items = []

    for item in items:
        product = db.query(Product).filter_by(id=item["product_id"]).first()
        if not product:
            raise ValueError(f"商品が見つかりません: ID {item['product_id']}")

        quantity = item["quantity"]
        decrement_stock(db, product.id, pickup_date, quantity)

        unit_price = float(product.price)
        total_price += unit_price * quantity
        reservation_items.append(ReservationItem(
            product_id=product.id,
            quantity=quantity,
            unit_price=unit_price,
        ))

    reservation = Reservation(
        user_id=user_id,
        pickup_date=pickup_date,
        pickup_time=pickup_time,
        total_price=total_price,
        items=reservation_items,
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)

    send_reservation_confirmation(user_email, reservation.id, str(pickup_date), pickup_time)
    return reservation


def cancel_reservation(db: Session, reservation: Reservation, user_email: str) -> None:
    if reservation.status == "cancelled":
        return

    for item in reservation.items:
        restore_stock(db, item.product_id, reservation.pickup_date, item.quantity)

    reservation.status = "cancelled"
    db.commit()

    send_reservation_cancellation(user_email, reservation.id)


def get_user_reservations(db: Session, user_id: int) -> list[Reservation]:
    return (
        db.query(Reservation)
        .filter_by(user_id=user_id)
        .order_by(Reservation.created_at.desc())
        .all()
    )
