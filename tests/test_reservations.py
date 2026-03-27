import datetime as dt


def test_create_reservation(auth_client, sample_product, sample_inventory):
    # Get form to obtain CSRF token
    auth_client.get("/reservations/new")
    csrf_token = auth_client.cookies.get("csrf_token")

    response = auth_client.post("/reservations/new", data={
        "product_id": sample_product.id,
        "quantity": 2,
        "pickup_date": str(dt.date.today()),
        "pickup_time": "10:00",
        "csrf_token": csrf_token,
    }, follow_redirects=False)
    assert response.status_code == 303
    assert "/reservations/" in response.headers["location"]


def test_create_reservation_exceeds_stock(auth_client, sample_product, sample_inventory):
    auth_client.get("/reservations/new")
    csrf_token = auth_client.cookies.get("csrf_token")

    response = auth_client.post("/reservations/new", data={
        "product_id": sample_product.id,
        "quantity": 999,
        "pickup_date": str(dt.date.today()),
        "pickup_time": "10:00",
        "csrf_token": csrf_token,
    })
    assert response.status_code == 200
    assert "在庫" in response.text


def test_list_reservations(auth_client):
    response = auth_client.get("/reservations")
    assert response.status_code == 200


def test_cancel_reservation(auth_client, db, sample_product, sample_inventory, test_user):
    from app.services.reservation_service import create_reservation

    reservation = create_reservation(
        db=db,
        user_id=test_user.id,
        user_email=test_user.email,
        pickup_date=dt.date.today(),
        pickup_time="11:00",
        items=[{"product_id": sample_product.id, "quantity": 1}],
    )

    auth_client.get(f"/reservations/{reservation.id}")
    csrf_token = auth_client.cookies.get("csrf_token")

    response = auth_client.post(f"/reservations/{reservation.id}/cancel", data={
        "csrf_token": csrf_token,
    }, follow_redirects=False)
    assert response.status_code == 303

    db.refresh(reservation)
    assert reservation.status == "cancelled"
